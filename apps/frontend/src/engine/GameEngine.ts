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
  DeathAction
} from './types/Actions'
import type { GameConfig } from './types'
import { GAME_CONFIG } from './GameConfig'

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

    // Update state
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
            piece: {
              ...piece,
              spaceId: action.toSpaceId,
              energy: newEnergy,
              emergencyEnergy: newEmergencyEnergy
            }
          }
        }
      }
    }

    return {
      success: true,
      state: this.updatePieceInPlayers(newState, {
        ...piece,
        spaceId: action.toSpaceId,
        energy: newEnergy,
        emergencyEnergy: newEmergencyEnergy
      }),
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
    
    // Advance turn
    newState.turn += 1
    
    // Check for season/year advancement (every 4 turns = new season)
    if (newState.turn % 4 === 0) {
      newState = this.advanceSeason(newState)
    }

    return {
      success: true,
      state: newState,
      message: 'Turn advanced'
    }
  }

  /**
   * Execute phase advancement
   */
  executePhaseAdvancement(state: CoreGameState): GameResult<CoreGameState> {
    const phaseOrder: typeof state.turnPhase[] = ['movement', 'harvest', 'eat', 'hibernation']
    const currentIndex = phaseOrder.indexOf(state.turnPhase)
    const nextIndex = (currentIndex + 1) % phaseOrder.length
    
    const newState: CoreGameState = {
      ...state,
      turnPhase: phaseOrder[nextIndex]
    }

    return {
      success: true,
      state: newState,
      message: `Advanced to ${phaseOrder[nextIndex]} phase`
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
   * Dice rolling utilities
   */
  rollDice(count: number): DiceRoll {
    return rollDice(count)
  }
}