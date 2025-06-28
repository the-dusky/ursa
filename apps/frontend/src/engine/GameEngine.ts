/**
 * Game Engine - Pure Game Logic
 * 
 * This engine contains all the pure game logic functions that operate on game state.
 * It is completely separated from UI concerns and state management.
 * The engine receives actions and state, validates them, and returns new state.
 */

import type {
  CoreGameState,
  GameResult,
  ValidationResult,
  CoreGamePiece,
  CoreGameSpace,
  Season
} from './types'
import { rollDice, type DiceRoll } from './utils/dice'
import type {
  GameAction,
  MovementAction,
  EatingAction,
  HibernationAction,
  HarvestAction,
  EnergyTaxAction,
  EmergencyEnergyAction,
  DeathAction,
  TradingAction
} from './types/Actions'
import { GAME_CONFIG, type GameConfig } from './GameConfig'

export class GameEngine {
  constructor(private config: GameConfig = GAME_CONFIG) {}

  /**
   * Execute any game action
   */
  executeAction(state: CoreGameState, action: GameAction): GameResult<CoreGameState> {
    switch (action.type) {
      case 'movement':
        return this.executeMovement(state, action)
      case 'eating':
        return this.executeEating(state, action)
      case 'hibernation':
        return this.executeHibernation(state, action)
      case 'harvest':
        return this.executeHarvest(state, action)
      case 'energy_tax':
        return this.executeEnergyTax(state, action)
      case 'emergency_energy':
        return this.executeEmergencyEnergy(state, action)
      case 'death':
        return this.executeDeath(state, action)
      case 'trading':
        return this.executeTrading(state, action)
      case 'turn_advancement':
        return this.executeTurnAdvancement(state)
      case 'phase_advancement':
        return this.executePhaseAdvancement(state)
      default:
        return {
          success: false,
          state,
          error: `Unknown action type: ${(action as { type: string }).type}`
        }
    }
  }

  /**
   * Execute movement action
   */
  executeMovement(state: CoreGameState, action: MovementAction): GameResult<CoreGameState> {
    const validation = this.validateMovement(state, action)
    if (!validation.valid) {
      return { success: false, state, error: validation.error }
    }

    const piece = this.findPiece(state, action.pieceId)
    const fromSpace = state.board.spaces[action.fromSpaceId]
    const toSpace = state.board.spaces[action.toSpaceId]

    if (!piece || !fromSpace || !toSpace) {
      return { success: false, state, error: 'Invalid piece or space reference' }
    }

    // Calculate movement cost
    const movementCost = this.config.movement.baseCost(piece.fat)
    const winterCost = state.season === 'Winter' ? 
      (fromSpace.quadrant === 'Mountains' ? 
        this.config.movement.winterCost.mountains : 
        this.config.movement.winterCost.outside) : 
      movementCost

    const totalCost = state.season === 'Winter' ? winterCost : movementCost
    const totalEnergy = piece.energy + piece.emergencyEnergy

    if (totalEnergy < totalCost) {
      return {
        success: false,
        state,
        error: `Insufficient energy: need ${totalCost}, have ${totalEnergy}`
      }
    }

    // Apply energy cost
    let newEnergy = piece.energy
    let newEmergencyEnergy = piece.emergencyEnergy

    if (piece.energy >= totalCost) {
      newEnergy -= totalCost
    } else {
      const regularUsed = piece.energy
      const emergencyUsed = totalCost - regularUsed
      newEnergy = 0
      newEmergencyEnergy -= emergencyUsed
    }

    // Create the updated piece with movement flag
    const updatedPiece: CoreGamePiece = {
      ...piece,
      spaceId: action.toSpaceId,
      energy: newEnergy,
      emergencyEnergy: newEmergencyEnergy,
      movedThisTurn: true  // Mark that this piece moved this turn
    }

    // Update state with consistent piece data in both board and players
    const newState: CoreGameState = {
      ...state,
      board: {
        ...state.board,
        spaces: {
          ...state.board.spaces,
          [action.fromSpaceId]: {
            ...fromSpace,
            piece: null
          },
          [action.toSpaceId]: {
            ...toSpace,
            piece: updatedPiece  // Use the same updated piece
          }
        }
      }
    }

    // Log the movement for debugging
    console.log(`🚶 Movement: Piece ${piece.id} movedThisTurn = true (moved from ${action.fromSpaceId} to ${action.toSpaceId})`)
    
    return {
      success: true,
      state: this.updatePieceInPlayers(newState, updatedPiece),
      message: `Moved piece using ${totalCost} energy`
    }
  }

  /**
   * Execute eating action
   */
  executeEating(state: CoreGameState, action: EatingAction): GameResult<CoreGameState> {
    const validation = this.validateEating(state, action)
    if (!validation.valid) {
      return { success: false, state, error: validation.error }
    }

    const piece = this.findPiece(state, action.pieceId)
    if (!piece) {
      return { success: false, state, error: 'Piece not found' }
    }

    if (piece.resources[action.resourceType] < action.amount) {
      return {
        success: false,
        state,
        error: `Not enough ${action.resourceType}: have ${piece.resources[action.resourceType]}, need ${action.amount}`
      }
    }

    const conversionRate = this.config.resources.conversion[action.convertTo][action.resourceType]
    const convertedAmount = action.amount * conversionRate

    const newResources = {
      ...piece.resources,
      [action.resourceType]: piece.resources[action.resourceType] - action.amount
    }

    let newEnergy = piece.energy
    let newFat = piece.fat

    if (action.convertTo === 'energy') {
      newEnergy = Math.min(this.config.energy.maxEnergy, piece.energy + convertedAmount)
    } else {
      newFat = piece.fat + convertedAmount
    }

    const updatedPiece: CoreGamePiece = {
      ...piece,
      resources: newResources,
      energy: newEnergy,
      fat: newFat
    }

    return {
      success: true,
      state: this.updatePieceInState(state, updatedPiece),
      message: `Converted ${action.amount} ${action.resourceType} to ${convertedAmount} ${action.convertTo}`
    }
  }

  /**
   * Execute hibernation action
   */
  executeHibernation(state: CoreGameState, action: HibernationAction): GameResult<CoreGameState> {
    const validation = this.validateHibernation(state, action)
    if (!validation.valid) {
      return { success: false, state, error: validation.error }
    }

    const piece = this.findPiece(state, action.pieceId)
    if (!piece) {
      return { success: false, state, error: 'Piece not found' }
    }

    const updatedPiece: CoreGamePiece = {
      ...piece,
      isHibernating: true,
      energy: this.config.hibernation.energyReset,
      fat: 0,
      emergencyEnergy: 0,
      resources: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 }
    }

    return {
      success: true,
      state: this.updatePieceInState(state, updatedPiece),
      message: `Bear entered hibernation (consumed ${this.config.hibernation.fatCost} fat, reset to ${this.config.hibernation.energyReset} energy)`
    }
  }

  /**
   * Execute harvest action
   */
  executeHarvest(state: CoreGameState, action: HarvestAction): GameResult<CoreGameState> {
    const piece = this.findPiece(state, action.pieceId)
    const space = state.board.spaces[action.spaceId]

    if (!piece || !space) {
      return { success: false, state, error: 'Invalid piece or space reference' }
    }

    if (!space.canProduce) {
      return { success: false, state, error: 'This space cannot produce resources' }
    }

    // New rule: Bears that stayed on the same space get no harvest
    console.log(`🌾 Harvest: Checking piece ${piece.id} movedThisTurn = ${piece.movedThisTurn}`)
    if (!piece.movedThisTurn) {
      console.log(`❌ Harvest blocked: Piece ${piece.id} did not move this turn`)
      return { 
        success: true, 
        state: state, 
        message: 'No harvest - bear must move to gather resources' 
      }
    }
    console.log(`✅ Harvest allowed: Piece ${piece.id} moved this turn`)

    const production = this.config.resources.seasonalProduction[state.season]
    const newResources = { ...piece.resources }
    const harvested: string[] = []

    // Harvest based on quadrant
    switch (space.quadrant) {
      case 'Pastures':
        newResources.grains += production.grains
        if (production.grains > 0) harvested.push(`${production.grains} grains`)
        break
      case 'Forests':
        newResources.berries += production.berries
        if (production.berries > 0) harvested.push(`${production.berries} berries`)
        if (space.hasHoney && production.honey > 0) {
          newResources.honey += production.honey
          harvested.push(`${production.honey} honey`)
        }
        break
      case 'Riverlands':
        newResources.salmon += production.salmon
        if (production.salmon > 0) harvested.push(`${production.salmon} salmon`)
        break
    }

    const updatedPiece: CoreGamePiece = {
      ...piece,
      resources: newResources
    }

    return {
      success: true,
      state: this.updatePieceInState(state, updatedPiece),
      message: harvested.length > 0 ? `Harvested: ${harvested.join(', ')}` : 'No resources harvested'
    }
  }

  /**
   * Execute daily energy expense action
   */
  executeEnergyTax(state: CoreGameState, action: EnergyTaxAction): GameResult<CoreGameState> {
    const piece = this.findPiece(state, action.pieceId)
    const space = this.findPieceSpace(state, action.pieceId)

    if (!piece || !space) {
      return { success: false, state, error: 'Piece or space not found' }
    }

    const energyLoss = state.season === 'Winter' ? 
      (space.quadrant === 'Mountains' ? 
        this.config.energy.dailyLoss.winter.mountains : 
        this.config.energy.dailyLoss.winter.outside) : 
      this.config.energy.dailyLoss.other

    const totalEnergy = piece.energy + piece.emergencyEnergy

    if (totalEnergy < energyLoss) {
      return {
        success: false,
        state,
        error: `Cannot pay daily energy expense: need ${energyLoss}, have ${totalEnergy}`
      }
    }

    let newEnergy = piece.energy
    let newEmergencyEnergy = piece.emergencyEnergy

    if (piece.energy >= energyLoss) {
      newEnergy -= energyLoss
    } else {
      const regularUsed = piece.energy
      const emergencyUsed = energyLoss - regularUsed
      newEnergy = 0
      newEmergencyEnergy -= emergencyUsed
    }

    const updatedPiece: CoreGamePiece = {
      ...piece,
      energy: newEnergy,
      emergencyEnergy: newEmergencyEnergy
    }

    return {
      success: true,
      state: { ...this.updatePieceInState(state, updatedPiece), energyTaxPaid: true },
      message: `Paid ${energyLoss} daily energy expense`
    }
  }

  /**
   * Execute emergency energy conversion
   */
  executeEmergencyEnergy(state: CoreGameState, action: EmergencyEnergyAction): GameResult<CoreGameState> {
    const piece = this.findPiece(state, action.pieceId)

    if (!piece) {
      return { success: false, state, error: 'Piece not found' }
    }

    if (piece.fat < action.fatAmount) {
      return {
        success: false,
        state,
        error: `Not enough fat: have ${piece.fat}, need ${action.fatAmount}`
      }
    }

    const emergencyEnergyGained = Math.floor(action.fatAmount * this.config.energy.emergencyConversion)

    const updatedPiece: CoreGamePiece = {
      ...piece,
      fat: piece.fat - action.fatAmount,
      emergencyEnergy: piece.emergencyEnergy + emergencyEnergyGained
    }

    return {
      success: true,
      state: this.updatePieceInState(state, updatedPiece),
      message: `Converted ${action.fatAmount} fat to ${emergencyEnergyGained} emergency energy`
    }
  }

  /**
   * Execute death action
   */
  executeDeath(state: CoreGameState, action: DeathAction): GameResult<CoreGameState> {
    const piece = this.findPiece(state, action.pieceId)
    
    if (!piece) {
      return { success: false, state, error: 'Piece not found' }
    }

    // Remove piece from player's pieces list
    const newState: CoreGameState = {
      ...state,
      players: state.players.map(player => ({
        ...player,
        pieces: player.pieces.filter(p => p.id !== action.pieceId),
        pieceCount: {
          ...player.pieceCount,
          bears: player.pieces.filter(p => p.id !== action.pieceId && p.type === 'bear').length,
          cubs: player.pieces.filter(p => p.id !== action.pieceId && p.type === 'cub').length
        }
      })),
      board: {
        ...state.board,
        spaces: Object.fromEntries(
          Object.entries(state.board.spaces).map(([spaceId, space]) => [
            spaceId,
            space.piece?.id === action.pieceId ? 
              { ...space, piece: null } : 
              space
          ])
        )
      }
    }

    return {
      success: true,
      state: newState,
      message: `Bear ${action.pieceId} died of starvation`
    }
  }

  /**
   * Execute trading action between two pieces
   */
  executeTrading(state: CoreGameState, action: TradingAction): GameResult<CoreGameState> {
    const validation = this.validateTrading(state, action)
    if (!validation.valid) {
      return { success: false, state, error: validation.error }
    }

    const fromPiece = this.findPiece(state, action.fromPieceId)
    const toPiece = this.findPiece(state, action.toPieceId)

    if (!fromPiece || !toPiece) {
      return { success: false, state, error: 'One or both pieces not found' }
    }

    // Check if pieces have enough resources
    if (fromPiece.resources[action.fromResourceType] < action.fromAmount) {
      return {
        success: false,
        state,
        error: `From piece doesn't have enough ${action.fromResourceType}: has ${fromPiece.resources[action.fromResourceType]}, needs ${action.fromAmount}`
      }
    }

    if (toPiece.resources[action.toResourceType] < action.toAmount) {
      return {
        success: false,
        state,
        error: `To piece doesn't have enough ${action.toResourceType}: has ${toPiece.resources[action.toResourceType]}, needs ${action.toAmount}`
      }
    }

    // Execute the trade
    const updatedFromPiece: CoreGamePiece = {
      ...fromPiece,
      resources: {
        ...fromPiece.resources,
        [action.fromResourceType]: fromPiece.resources[action.fromResourceType] - action.fromAmount,
        [action.toResourceType]: fromPiece.resources[action.toResourceType] + action.toAmount
      }
    }

    const updatedToPiece: CoreGamePiece = {
      ...toPiece,
      resources: {
        ...toPiece.resources,
        [action.toResourceType]: toPiece.resources[action.toResourceType] - action.toAmount,
        [action.fromResourceType]: toPiece.resources[action.fromResourceType] + action.fromAmount
      }
    }

    // Update both pieces in the state
    let newState = this.updatePieceInState(state, updatedFromPiece)
    newState = this.updatePieceInState(newState, updatedToPiece)

    return {
      success: true,
      state: newState,
      message: `Traded ${action.fromAmount} ${action.fromResourceType} for ${action.toAmount} ${action.toResourceType}`
    }
  }

  /**
   * Execute turn advancement
   */
  executeTurnAdvancement(state: CoreGameState): GameResult<CoreGameState> {
    // Clear emergency energy for all pieces
    const clearedState = this.clearEmergencyEnergy(state)
    
    let newState: CoreGameState = { 
      ...clearedState, 
      energyTaxPaid: false, 
      turnPhase: 'movement'
    }
    
    // Reset movement flags when advancing to next player's turn
    console.log(`🔄 Turn advancement: Resetting movement flags for all pieces`)
    newState = this.resetMovementFlags(newState)
    
    // Advance to next player
    newState.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
    
    // If we've cycled back to the first player, advance the turn
    if (newState.currentPlayerIndex === 0) {
      newState.turn += 1
      
      // Check for season/year advancement (every 4 turns = new season)
      if (newState.turn % 4 === 0) {
        newState = this.advanceSeason(newState)
      }
    }

    const currentPlayer = newState.players[newState.currentPlayerIndex]
    return {
      success: true,
      state: newState,
      message: `Turn advanced - now ${currentPlayer?.name || 'Player ' + (newState.currentPlayerIndex + 1)}'s turn`
    }
  }

  /**
   * Execute phase advancement
   */
  executePhaseAdvancement(state: CoreGameState): GameResult<CoreGameState> {
    const phaseOrder: typeof state.turnPhase[] = ['movement', 'harvest', 'eat', 'hibernation']
    const currentIndex = phaseOrder.indexOf(state.turnPhase)
    const nextIndex = (currentIndex + 1) % phaseOrder.length
    
    let newState: CoreGameState = {
      ...state,
      turnPhase: phaseOrder[nextIndex]
    }


    return {
      success: true,
      state: newState,
      message: `Advanced to ${phaseOrder[nextIndex]} phase`
    }
  }

  /**
   * Initialize game with player setup and bear placement
   */
  initializeGameWithPlayers(
    board: CoreGameState['board'], 
    players: CoreGameState['players']
  ): GameResult<CoreGameState> {
    // Find suitable starting spaces (rings 2-4, can produce)
    const availableSpaces = Object.values(board.spaces).filter(space => 
      space.ring >= 2 && space.ring <= 4 && space.canProduce
    )
    
    if (availableSpaces.length < players.length) {
      return {
        success: false,
        state: {
          board,
          players,
          currentPlayerIndex: 0,
          season: 'Spring',
          year: 1,
          turn: 1,
          gamePhase: 'setup',
          turnPhase: 'movement',
          energyTaxPaid: false
        },
        error: `Not enough starting spaces: need ${players.length}, found ${availableSpaces.length}`
      }
    }

    // Shuffle available spaces for random placement
    const shuffledSpaces = [...availableSpaces].sort(() => Math.random() - 0.5)
    
    // Create copies to avoid mutation
    const newBoard = { ...board, spaces: { ...board.spaces } }
    const newPlayers = players.map(player => ({ ...player, pieces: [] as CoreGamePiece[] }))
    
    // Place starting bears for each player
    newPlayers.forEach((player, playerIndex) => {
      const selectedSpace = shuffledSpaces[playerIndex]
      
      // Create starting bear with engine defaults
      const startingBear: CoreGamePiece = {
        id: `bear-${player.id}-1`,
        playerId: player.id,
        spaceId: selectedSpace.id,
        type: 'bear',
        health: this.config.pieces.bear.startingHealth,
        resources: {
          grains: 0,
          berries: 0,
          salmon: 0,
          honey: 0,
          bearMeat: 0
        },
        energy: this.config.pieces.bear.startingEnergy,
        fat: this.config.pieces.bear.startingFat,
        emergencyEnergy: 0,
        isHibernating: false,
        movedThisTurn: false  // Bears start without having moved
      }
      
      // Add bear to player's pieces
      player.pieces.push(startingBear)
      player.pieceCount.bears = 1
      
      // Place bear on the board
      newBoard.spaces[selectedSpace.id] = {
        ...newBoard.spaces[selectedSpace.id],
        piece: startingBear
      }
    })

    return {
      success: true,
      state: {
        board: newBoard,
        players: newPlayers,
        currentPlayerIndex: 0,
        season: 'Spring',
        year: 1,
        turn: 1,
        gamePhase: 'playing',
        turnPhase: 'movement',
        energyTaxPaid: false
      },
      message: `Game initialized with ${players.length} players`
    }
  }

  // Validation methods
  validateMovement(state: CoreGameState, action: MovementAction): ValidationResult {
    if (state.turnPhase !== 'movement') {
      return { valid: false, error: 'Can only move during movement phase' }
    }

    if (!state.energyTaxPaid) {
      return { valid: false, error: 'Must pay energy tax before moving' }
    }

    const piece = this.findPiece(state, action.pieceId)
    if (!piece) {
      return { valid: false, error: 'Piece not found' }
    }

    const toSpace = state.board.spaces[action.toSpaceId]
    if (!toSpace) {
      return { valid: false, error: 'Destination space not found' }
    }

    if (toSpace.piece) {
      return { valid: false, error: 'Destination space is occupied' }
    }

    return { valid: true }
  }

  validateEating(state: CoreGameState, action: EatingAction): ValidationResult {
    if (state.turnPhase !== 'eat') {
      return { valid: false, error: 'Can only eat during eating phase' }
    }

    const piece = this.findPiece(state, action.pieceId)
    if (!piece) {
      return { valid: false, error: 'Piece not found' }
    }

    if (piece.resources[action.resourceType] < action.amount) {
      return { valid: false, error: `Not enough ${action.resourceType}` }
    }

    return { valid: true }
  }

  validateHibernation(state: CoreGameState, action: HibernationAction): ValidationResult {
    if (state.turnPhase !== 'hibernation') {
      return { valid: false, error: 'Can only hibernate during hibernation phase' }
    }

    if (state.season !== 'Winter') {
      return { valid: false, error: 'Can only hibernate in Winter' }
    }

    const piece = this.findPiece(state, action.pieceId)
    if (!piece) {
      return { valid: false, error: 'Piece not found' }
    }

    const space = this.findPieceSpace(state, action.pieceId)
    if (!space || space.quadrant !== 'Mountains') {
      return { valid: false, error: 'Must be in Mountains to hibernate' }
    }

    if (piece.fat < this.config.hibernation.fatCost) {
      return { 
        valid: false, 
        error: `Need ${this.config.hibernation.fatCost} fat to hibernate, have ${piece.fat}` 
      }
    }

    return { valid: true }
  }

  validateTrading(state: CoreGameState, action: TradingAction): ValidationResult {
    // Check if trading is allowed in current phase
    if (!this.config.trading.allowedPhases.includes(state.turnPhase)) {
      return { valid: false, error: `Trading not allowed during ${state.turnPhase} phase` }
    }

    const fromPiece = this.findPiece(state, action.fromPieceId)
    const toPiece = this.findPiece(state, action.toPieceId)

    if (!fromPiece || !toPiece) {
      return { valid: false, error: 'One or both pieces not found' }
    }

    // Check if pieces belong to different players
    if (fromPiece.playerId === toPiece.playerId) {
      return { valid: false, error: 'Cannot trade with your own pieces' }
    }

    // Check if resources are tradable
    if (!this.config.trading.tradableResources.includes(action.fromResourceType)) {
      return { valid: false, error: `${action.fromResourceType} cannot be traded` }
    }

    if (!this.config.trading.tradableResources.includes(action.toResourceType)) {
      return { valid: false, error: `${action.toResourceType} cannot be traded` }
    }

    // Check adjacency requirement
    if (this.config.trading.requireAdjacency) {
      const fromSpace = this.findPieceSpace(state, action.fromPieceId)
      const toSpace = this.findPieceSpace(state, action.toPieceId)

      if (!fromSpace || !toSpace) {
        return { valid: false, error: 'Cannot find spaces for pieces' }
      }

      const areAdjacent = fromSpace.adjacentSpaces.includes(toSpace.id)
      if (!areAdjacent) {
        return { valid: false, error: 'Pieces must be on adjacent spaces to trade' }
      }
    }

    // Check trade amounts are positive
    if (action.fromAmount <= 0 || action.toAmount <= 0) {
      return { valid: false, error: 'Trade amounts must be positive' }
    }

    // Check pieces have enough resources
    if (fromPiece.resources[action.fromResourceType] < action.fromAmount) {
      return { valid: false, error: `From piece doesn't have enough ${action.fromResourceType}` }
    }

    if (toPiece.resources[action.toResourceType] < action.toAmount) {
      return { valid: false, error: `To piece doesn't have enough ${action.toResourceType}` }
    }

    return { valid: true }
  }

  // Helper methods
  private findPiece(state: CoreGameState, pieceId: string): CoreGamePiece | null {
    for (const player of state.players) {
      const piece = player.pieces.find(p => p.id === pieceId)
      if (piece) return piece
    }
    return null
  }

  private findPieceSpace(state: CoreGameState, pieceId: string): CoreGameSpace | null {
    for (const space of Object.values(state.board.spaces)) {
      if (space.piece?.id === pieceId) return space
    }
    return null
  }

  private updatePieceInState(state: CoreGameState, updatedPiece: CoreGamePiece): CoreGameState {
    const newState = this.updatePieceInPlayers(state, updatedPiece)
    return this.updatePieceInSpaces(newState, updatedPiece)
  }

  private updatePieceInPlayers(state: CoreGameState, updatedPiece: CoreGamePiece): CoreGameState {
    return {
      ...state,
      players: state.players.map(player => ({
        ...player,
        pieces: player.pieces.map(piece => 
          piece.id === updatedPiece.id ? updatedPiece : piece
        )
      }))
    }
  }

  private updatePieceInSpaces(state: CoreGameState, updatedPiece: CoreGamePiece): CoreGameState {
    return {
      ...state,
      board: {
        ...state.board,
        spaces: Object.fromEntries(
          Object.entries(state.board.spaces).map(([spaceId, space]) => [
            spaceId,
            space.piece?.id === updatedPiece.id ? 
              { ...space, piece: updatedPiece } : 
              space
          ])
        )
      }
    }
  }

  private clearEmergencyEnergy(state: CoreGameState): CoreGameState {
    return {
      ...state,
      players: state.players.map(player => ({
        ...player,
        pieces: player.pieces.map(piece => ({
          ...piece,
          emergencyEnergy: 0
        }))
      })),
      board: {
        ...state.board,
        spaces: Object.fromEntries(
          Object.entries(state.board.spaces).map(([spaceId, space]) => [
            spaceId,
            space.piece ? 
              { ...space, piece: { ...space.piece, emergencyEnergy: 0 } } : 
              space
          ])
        )
      }
    }
  }

  private advanceSeason(state: CoreGameState): CoreGameState {
    const seasons: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter']
    const currentIndex = seasons.indexOf(state.season)
    const nextIndex = (currentIndex + 1) % seasons.length
    
    let newYear = state.year
    if (nextIndex === 0) { // Spring = new year
      newYear += 1
    }

    return {
      ...state,
      season: seasons[nextIndex],
      year: newYear
    }
  }

  /**
   * Reset movement flags for all pieces (called at start of movement phase)
   */
  private resetMovementFlags(state: CoreGameState): CoreGameState {
    const newState = { ...state }
    newState.players = state.players.map(player => ({
      ...player,
      pieces: player.pieces.map(piece => ({
        ...piece,
        movedThisTurn: false  // Reset movement flag for new turn
      }))
    }))
    
    // Log the reset for debugging
    newState.players.forEach((player, playerIndex) => {
      player.pieces.forEach((piece, pieceIndex) => {
        console.log(`🏃 Reset: Player ${playerIndex + 1} Piece ${pieceIndex + 1} (${piece.id}) movedThisTurn = false`)
      })
    })
    
    return newState
  }

  /**
   * Dice rolling utilities
   */
  rollDice(count: number): DiceRoll {
    return rollDice(count)
  }
}