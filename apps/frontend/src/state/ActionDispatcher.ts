/**
 * ActionDispatcher - Single Entry Point for Game Actions
 * 
 * This is the ONLY way to trigger game actions. It provides:
 * - Type-safe action definitions
 * - Centralized action logging
 * - Action validation
 * - Integration with GameEngine
 * - State management coordination
 */

import { CoreGameState, GameActionResult, CoreGameStateUtils, GamePhase, TurnPhase } from './CoreGameState'
import { StateManager } from './StateManager'

/**
 * Winter Survival Constants
 */
const ENERGY_CONSTANTS = {
  MAX_ENERGY: 20,
  MAX_FAT: 100, // Allow high fat accumulation for winter prep
  FAT_TO_ENERGY_RATIO: 2, // 2 fat = 1 energy
  STARTING_ENERGY: 20,
  HIBERNATION_RESET_ENERGY: 5,
  WINTER_COST_MOUNTAINS: 2, // Energy per turn in mountains during winter
  WINTER_COST_OUTSIDE: 5,   // Energy per turn outside mountains during winter
  NORMAL_SEASON_COST: 1     // Energy per turn in non-winter seasons
} as const

/**
 * Seasonal Constants
 */
const SEASON_CONSTANTS = {
  TURNS_PER_SEASON: 5,
  SEASONS: ['Spring', 'Summer', 'Autumn', 'Winter'] as const
} as const

/**
 * Convert fat to energy when needed for survival
 * @param currentEnergy Current energy level
 * @param currentFat Current fat reserves  
 * @param energyNeeded Energy required
 * @returns Object with new energy and fat levels, plus success flag
 */
function convertFatToEnergy(currentEnergy: number, currentFat: number, energyNeeded: number) {
  const totalAvailableEnergy = currentEnergy
  const energyShortfall = energyNeeded - totalAvailableEnergy
  
  if (energyShortfall <= 0) {
    // No conversion needed
    return {
      newEnergy: currentEnergy,
      newFat: currentFat,
      energyUsed: Math.min(energyNeeded, currentEnergy),
      fatUsed: 0,
      canAfford: true
    }
  }
  
  // Calculate fat needed (2 fat = 1 energy)
  const fatNeeded = energyShortfall * ENERGY_CONSTANTS.FAT_TO_ENERGY_RATIO
  
  if (currentFat < fatNeeded) {
    // Cannot afford even with fat conversion
    return {
      newEnergy: currentEnergy,
      newFat: currentFat,
      energyUsed: 0,
      fatUsed: 0,
      canAfford: false
    }
  }
  
  // Convert fat to energy and pay the cost
  const energyFromFat = energyShortfall
  const newEnergy = Math.min(currentEnergy + energyFromFat - energyNeeded, ENERGY_CONSTANTS.MAX_ENERGY)
  const newFat = currentFat - fatNeeded
  
  return {
    newEnergy,
    newFat,
    energyUsed: energyNeeded,
    fatUsed: fatNeeded,
    canAfford: true
  }
}

/**
 * Base Action Interface - All actions implement this
 */
export interface GameAction {
  type: string
  playerId?: string
  timestamp?: number
  metadata?: Record<string, unknown>
}

/**
 * Movement Action
 */
export interface MovePieceAction extends GameAction {
  type: 'MOVE_PIECE'
  pieceId: string
  fromSpaceId: string
  toSpaceId: string
  playerId: string
}

/**
 * Placement Action
 */
export interface PlacePieceAction extends GameAction {
  type: 'PLACE_PIECE'
  pieceType: 'bear' | 'cub'
  spaceId: string
  playerId: string
}

/**
 * Resource Action
 */
export interface HarvestAction extends GameAction {
  type: 'HARVEST'
  pieceId: string
  playerId: string
}

/**
 * Eating Action
 */
export interface EatResourceAction extends GameAction {
  type: 'EAT_RESOURCE'
  pieceId: string
  resourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat'
  amount: number
  conversionType: 'energy' | 'fat'
  playerId: string
}

/**
 * Turn Management Actions
 */
export interface AdvanceTurnAction extends GameAction {
  type: 'ADVANCE_TURN'
}

export interface AdvancePhaseAction extends GameAction {
  type: 'ADVANCE_PHASE'
}

/**
 * Seasonal advancement action
 */
export interface AdvanceSeasonAction extends GameAction {
  type: 'ADVANCE_SEASON'
}

/**
 * Dice Actions
 */
export interface RollDiceAction extends GameAction {
  type: 'ROLL_DICE'
  diceType: 'position' | 'direction'
}

export interface ApplyBoardRotationsAction extends GameAction {
  type: 'APPLY_BOARD_ROTATIONS'
}

export interface ResetDiceAction extends GameAction {
  type: 'RESET_DICE'
}

export interface StartBearPlacementAction extends GameAction {
  type: 'START_BEAR_PLACEMENT'
}

export interface PlaceBearAction extends GameAction {
  type: 'PLACE_BEAR'
  spaceId: string
  playerId: string
}

export interface PayEnergyTaxAction extends GameAction {
  type: 'PAY_ENERGY_TAX'
  pieceId: string
  playerId: string
}

/**
 * Emergency Energy Action - Convert fat to emergency energy
 */
export interface EmergencyEnergyAction extends GameAction {
  type: 'EMERGENCY_ENERGY'
  pieceId: string
  fatAmount: number // Amount of fat to convert (2 fat → 1 emergency energy)
  playerId: string
}

/**
 * Death Action - Remove dead bears from game
 */
export interface DeathAction extends GameAction {
  type: 'DEATH'
  pieceId: string
  playerId: string
  reason: 'energy_insufficient' | 'combat' | 'starvation'
}

/**
 * Hibernation Action - Enter hibernation (Winter + Mountains + fat cost)
 */
export interface HibernateAction extends GameAction {
  type: 'HIBERNATE'
  pieceId: string
  playerId: string
}

/**
 * Trading Action - Player-to-player resource exchange
 */
export interface TradingAction extends GameAction {
  type: 'TRADING'
  fromPieceId: string
  toPieceId: string
  fromResourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat'
  toResourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat'
  fromAmount: number
  toAmount: number
  playerId: string // Player initiating the trade
}

/**
 * Game Management Actions
 */
export interface StartGameAction extends GameAction {
  type: 'START_GAME'
  playerCount?: number
}

export interface ResetGameAction extends GameAction {
  type: 'RESET_GAME'
}

/**
 * Union of all possible actions
 */
export type AnyGameAction = 
  | MovePieceAction
  | PlacePieceAction
  | HarvestAction
  | EatResourceAction
  | AdvanceTurnAction
  | AdvancePhaseAction
  | AdvanceSeasonAction
  | RollDiceAction
  | ApplyBoardRotationsAction
  | ResetDiceAction
  | StartBearPlacementAction
  | PlaceBearAction
  | PayEnergyTaxAction
  | EmergencyEnergyAction
  | DeathAction
  | HibernateAction
  | TradingAction
  | StartGameAction
  | ResetGameAction

/**
 * Action Handler - Function that processes an action
 */
export type ActionHandler<T extends GameAction = AnyGameAction> = (
  state: CoreGameState, 
  action: T
) => GameActionResult<CoreGameState>

/**
 * Action Validator - Function that validates if an action can be performed
 */
export type ActionValidator<T extends GameAction = AnyGameAction> = (
  state: CoreGameState,
  action: T
) => { valid: boolean; reason?: string }

/**
 * ActionDispatcher - Orchestrates all game actions
 */
export class ActionDispatcher {
  private stateManager: StateManager
  private handlers: Map<string, ActionHandler> = new Map()
  private validators: Map<string, ActionValidator> = new Map()
  private actionHistory: Array<{ action: AnyGameAction; timestamp: number; result: GameActionResult }> = []
  
  constructor(stateManager: StateManager) {
    this.stateManager = stateManager
    this.registerDefaultHandlers()
    this.registerDefaultValidators()
  }
  
  /**
   * Calculate seasonal harvest for a given biome and season
   */
  private calculateSeasonalHarvest(season: string, space: any): { grains: number; berries: number; salmon: number; honey: number } | null {
    // Winter has no harvest
    if (season === 'Winter') {
      return null
    }
    
    // Base harvest amounts by season and biome
    const harvestTable: Record<string, Record<string, { grains: number; berries: number; salmon: number; honey: number }>> = {
      Spring: {
        Pastures: { grains: 2, berries: 0, salmon: 0, honey: 0 },
        Forests: { grains: 0, berries: 1, salmon: 0, honey: 0 },
        Riverlands: { grains: 0, berries: 0, salmon: 1, honey: 0 },
        Mountains: { grains: 0, berries: 0, salmon: 0, honey: 0 }
      },
      Summer: {
        Pastures: { grains: 3, berries: 0, salmon: 0, honey: 0 },
        Forests: { grains: 0, berries: 2, salmon: 0, honey: space.hasHoney ? 1 : 0 },
        Riverlands: { grains: 0, berries: 0, salmon: 3, honey: 0 },
        Mountains: { grains: 0, berries: 0, salmon: 0, honey: 0 }
      },
      Autumn: {
        Pastures: { grains: 4, berries: 0, salmon: 0, honey: 0 },
        Forests: { grains: 0, berries: 3, salmon: 0, honey: space.hasHoney ? 2 : 0 },
        Riverlands: { grains: 0, berries: 0, salmon: 2, honey: 0 },
        Mountains: { grains: 0, berries: 0, salmon: 0, honey: 0 }
      }
    }
    
    const seasonHarvest = harvestTable[season]
    if (!seasonHarvest) {
      return null
    }
    
    const biomeHarvest = seasonHarvest[space.quadrant]
    if (!biomeHarvest) {
      return null
    }
    
    return biomeHarvest
  }
  
  /**
   * Dispatch an action (main entry point)
   */
  async dispatch<T extends AnyGameAction>(action: T): Promise<GameActionResult<CoreGameState>> {
    const timestamp = Date.now()
    const actionWithMetadata = {
      ...action,
      timestamp,
      metadata: {
        ...action.metadata,
        dispatchedAt: timestamp
      }
    }
    
    console.log(`🎯 Dispatching action: ${action.type}`, actionWithMetadata)
    
    try {
      // Validate the action first
      const validation = this.validateAction(actionWithMetadata)
      if (!validation.valid) {
        const result = {
          success: false,
          state: this.stateManager.state,
          error: `Action validation failed: ${validation.reason}`
        }
        this.recordAction(actionWithMetadata, result)
        return result
      }
      
      // Get the handler for this action type
      const handler = this.handlers.get(action.type)
      if (!handler) {
        const result = {
          success: false,
          state: this.stateManager.state,
          error: `No handler registered for action type: ${action.type}`
        }
        this.recordAction(actionWithMetadata, result)
        return result
      }
      
      // Execute the action
      const result = await handler(this.stateManager.state, actionWithMetadata)
      
      // Update state if successful
      if (result.success && result.newState) {
        const updateResult = this.stateManager.updateState(
          result.newState, 
          `action: ${action.type}`
        )
        
        if (!updateResult.success) {
          // Rollback if state update failed
          const rollbackResult = {
            success: false,
            state: this.stateManager.state,
            error: `State update failed after action: ${updateResult.error}`
          }
          this.recordAction(actionWithMetadata, rollbackResult)
          return rollbackResult
        }
      }
      
      this.recordAction(actionWithMetadata, result)
      return result
      
    } catch (error) {
      const result = {
        success: false,
        state: this.stateManager.state,
        error: `Action execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      this.recordAction(actionWithMetadata, result)
      return result
    }
  }
  
  /**
   * Register an action handler
   */
  registerHandler<T extends AnyGameAction>(
    actionType: T['type'], 
    handler: ActionHandler<T>
  ): void {
    this.handlers.set(actionType, handler as ActionHandler)
  }
  
  /**
   * Register an action validator
   */
  registerValidator<T extends AnyGameAction>(
    actionType: T['type'],
    validator: ActionValidator<T>
  ): void {
    this.validators.set(actionType, validator as ActionValidator)
  }
  
  /**
   * Get action history (for debugging/replay)
   */
  getActionHistory(): Array<{ action: AnyGameAction; timestamp: number; result: GameActionResult }> {
    return [...this.actionHistory]
  }
  
  /**
   * Clear action history
   */
  clearHistory(): void {
    this.actionHistory = []
  }
  
  /**
   * Validate an action
   */
  private validateAction(action: AnyGameAction): { valid: boolean; reason?: string } {
    // Basic validation
    if (!action.type) {
      return { valid: false, reason: 'Action type is required' }
    }
    
    // Player validation (if action requires a player)
    if (action.playerId) {
      const player = CoreGameStateUtils.getPlayer(this.stateManager.state, action.playerId)
      if (!player) {
        return { valid: false, reason: `Player ${action.playerId} not found` }
      }
    }
    
    // Custom validator
    const validator = this.validators.get(action.type)
    if (validator) {
      return validator(this.stateManager.state, action)
    }
    
    return { valid: true }
  }
  
  /**
   * Record action in history
   */
  private recordAction(
    action: AnyGameAction, 
    result: GameActionResult
  ): void {
    this.actionHistory.push({
      action,
      timestamp: Date.now(),
      result
    })
    
    // Keep history manageable (last 100 actions)
    if (this.actionHistory.length > 100) {
      this.actionHistory = this.actionHistory.slice(-100)
    }
  }
  
  /**
   * Register actual game logic handlers
   */
  private registerDefaultHandlers(): void {
    this.registerHandler('MOVE_PIECE', (state, action) => {
      if (action.type !== 'MOVE_PIECE') return { success: false, state, error: 'Wrong action type' }
      
      const piece = CoreGameStateUtils.getPiece(state, action.pieceId)
      const fromSpace = CoreGameStateUtils.getSpace(state, action.fromSpaceId)
      const toSpace = CoreGameStateUtils.getSpace(state, action.toSpaceId)
      
      if (!piece || !fromSpace || !toSpace) {
        return { success: false, state, error: 'Invalid piece or space' }
      }
      
      // Check if energy tax has been paid during movement phase
      if (state.turnPhase === 'movement' && !state.energyTaxPaid) {
        return { success: false, state, error: 'Must pay energy tax before moving' }
      }
      
      if (toSpace.piece) {
        return { success: false, state, error: 'Destination space is occupied' }
      }
      
      // Calculate movement energy cost based on fat level
      const fat = piece.fat || 0
      let movementCost: number
      if (fat <= 5) {
        movementCost = 1
      } else if (fat <= 15) {
        movementCost = 2
      } else {
        movementCost = 3
      }
      
      // Check if piece has enough energy to move
      if (piece.energy < movementCost) {
        return { 
          success: false, 
          state, 
          error: `Insufficient energy to move: need ${movementCost}, have ${piece.energy}` 
        }
      }
      
      // Update players with moved piece and reduced energy
      const updatedPlayers = state.players.map(p => 
        p.pieces.some(playerPiece => playerPiece.id === piece.id)
          ? {
              ...p,
              pieces: p.pieces.map(playerPiece => 
                playerPiece.id === piece.id
                  ? { 
                      ...playerPiece, 
                      spaceId: action.toSpaceId, 
                      energy: playerPiece.energy - movementCost,
                      movedThisTurn: true // Still set this for harvest rules, but ignore during movement phase
                    }
                  : playerPiece
              )
            }
          : p
      )
      
      // Update board spaces
      const updatedPiece = updatedPlayers
        .flatMap(p => p.pieces)
        .find(p => p.id === piece.id)!
        
      // Update board spaces and bridges
      const updatedSpaces = { ...state.board.spaces }
      const updatedBridges = { ...state.board.bridges }
      
      // Clear from space
      if (updatedSpaces[action.fromSpaceId]) {
        updatedSpaces[action.fromSpaceId] = { ...fromSpace, piece: null }
      } else if (updatedBridges[action.fromSpaceId]) {
        updatedBridges[action.fromSpaceId] = { ...fromSpace, piece: null }
      }
      
      // Set to space
      if (updatedSpaces[action.toSpaceId]) {
        updatedSpaces[action.toSpaceId] = { ...toSpace, piece: updatedPiece }
      } else if (updatedBridges[action.toSpaceId]) {
        updatedBridges[action.toSpaceId] = { ...toSpace, piece: updatedPiece }
      }
      
      const updatedBoard = {
        ...state.board,
        spaces: updatedSpaces,
        bridges: updatedBridges
      }
      
      const newState = {
        ...state,
        players: updatedPlayers,
        board: updatedBoard,
        lastUpdated: Date.now()
      }
      
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: `Moved piece ${piece.id} (cost: ${movementCost} energy, fat: ${fat})` 
      }
    })
    
    this.registerHandler('PLACE_PIECE', (state, action) => {
      if (action.type !== 'PLACE_PIECE') return { success: false, state, error: 'Wrong action type' }
      
      const newState = { ...state, lastUpdated: Date.now() }
      return { success: true, state: newState, newState, message: `Placed ${action.pieceType} piece` }
    })
    
    this.registerHandler('HARVEST', (state, action) => {
      if (action.type !== 'HARVEST') return { success: false, state, error: 'Wrong action type' }
      
      const piece = CoreGameStateUtils.getPiece(state, action.pieceId)
      const player = CoreGameStateUtils.getPlayer(state, action.playerId)
      
      if (!piece) {
        return { success: false, state, error: 'Piece not found' }
      }
      
      if (!player) {
        return { success: false, state, error: 'Player not found' }
      }
      
      // Check harvest requirements
      if (piece.harvestedThisTurn) {
        return { success: false, state, error: 'Cannot harvest - bear already harvested this turn' }
      }
      
      if (state.turnPhase !== 'harvest') {
        return { success: false, state, error: 'Can only harvest during harvest phase' }
      }
      
      // Find the space where the bear is located
      const space = CoreGameStateUtils.getSpace(state, piece.spaceId)
      if (!space) {
        return { success: false, state, error: 'Bear is not on a valid space' }
      }
      
      // Check if space can produce resources
      if (!space.canProduce) {
        return { success: false, state, error: 'Mountains cannot be harvested' }
      }
      
      // Winter blocks all harvesting
      if (state.season === 'Winter') {
        return { success: false, state, error: 'No harvest possible in winter' }
      }
      
      // Check if space is barren for this player (recently harvested)
      console.log(`🌾 HARVEST CHECK - Player ${player.name}:`)
      console.log(`  Space: ${space.id} (${space.quadrant})`)
      console.log(`  Barren spaces: [${(player.barrenSpaces || []).join(', ')}]`)
      console.log(`  Harvested this turn: [${(player.harvestedThisTurn || []).join(', ')}]`)
      console.log(`  Is space barren? ${player.barrenSpaces && player.barrenSpaces.includes(space.id)}`)
      console.log(`  Bear already harvested? ${piece.harvestedThisTurn}`)
      
      if (player.barrenSpaces && player.barrenSpaces.includes(space.id)) {
        return { success: false, state, error: 'Space is depleted - must wait for replenishment' }
      }
      
      // Calculate harvest based on season and biome
      const harvestResult = this.calculateSeasonalHarvest(state.season, space)
      
      if (!harvestResult) {
        return { success: false, state, error: `No harvest available in ${space.quadrant} during ${state.season}` }
      }
      
      // Update piece resources
      const updatedPlayers = state.players.map(p => 
        p.id === action.playerId 
          ? {
              ...p,
              harvestedThisTurn: [...(p.harvestedThisTurn || []), space.id],  // Track space harvested this turn
              pieces: p.pieces.map(playerPiece => 
                playerPiece.id === action.pieceId
                  ? { 
                      ...playerPiece, 
                      resources: {
                        ...playerPiece.resources,
                        grains: playerPiece.resources.grains + (harvestResult.grains || 0),
                        berries: playerPiece.resources.berries + (harvestResult.berries || 0),
                        salmon: playerPiece.resources.salmon + (harvestResult.salmon || 0),
                        honey: playerPiece.resources.honey + (harvestResult.honey || 0)
                      },
                      harvestedThisTurn: true  // Mark as harvested this turn
                    }
                  : playerPiece
              )
            }
          : p
      )
      
      const newState = { 
        ...state, 
        players: updatedPlayers,
        lastUpdated: Date.now() 
      }
      
      const resourcesGained = Object.entries(harvestResult)
        .filter(([_, amount]) => (amount as number) > 0)
        .map(([resource, amount]) => `${amount as number} ${resource}`)
        .join(', ')
      
      // Log successful harvest
      const updatedPlayer = newState.players.find(p => p.id === action.playerId)
      console.log(`✅ HARVEST SUCCESS - Player ${player.name}:`)
      console.log(`  Added ${space.id} to harvestedThisTurn`)
      console.log(`  New harvestedThisTurn: [${(updatedPlayer?.harvestedThisTurn || []).join(', ')}]`)
      console.log(`  Barren spaces unchanged: [${(updatedPlayer?.barrenSpaces || []).join(', ')}]`)
      
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: `Harvested ${resourcesGained} from ${space.quadrant} during ${state.season}` 
      }
    })
    
    this.registerHandler('EAT_RESOURCE', (state, action) => {
      if (action.type !== 'EAT_RESOURCE') return { success: false, state, error: 'Wrong action type' }
      
      const newState = { ...state, lastUpdated: Date.now() }
      const piece = CoreGameStateUtils.getPiece(state, action.pieceId)
      
      if (!piece) {
        return { success: false, state, error: 'Piece not found' }
      }
      
      // Check if player has enough resources
      if (piece.resources[action.resourceType] < action.amount) {
        return { success: false, state, error: 'Not enough resources' }
      }
      
      // Calculate conversion based on type
      let energyGain = 0
      let fatGain = 0
      let maxValue = 0
      let currentValue = 0
      
      if (action.conversionType === 'energy') {
        energyGain = action.amount
        maxValue = ENERGY_CONSTANTS.MAX_ENERGY
        currentValue = piece.energy
      } else {
        fatGain = action.amount
        maxValue = ENERGY_CONSTANTS.MAX_FAT
        currentValue = piece.fat
      }
      
      // Check if we exceed maximum
      if (currentValue + (energyGain || fatGain) > maxValue) {
        return { 
          success: false, 
          state, 
          error: `Cannot exceed maximum ${action.conversionType}: ${currentValue}/${maxValue} (trying to add ${energyGain || fatGain})` 
        }
      }
      
      // Apply the conversion
      const updatedPlayers = state.players.map(p => 
        p.id === action.playerId 
          ? {
              ...p,
              pieces: p.pieces.map(playerPiece => 
                playerPiece.id === action.pieceId
                  ? { 
                      ...playerPiece,
                      resources: {
                        ...playerPiece.resources,
                        [action.resourceType]: playerPiece.resources[action.resourceType] - action.amount
                      },
                      energy: Math.min(playerPiece.energy + energyGain, ENERGY_CONSTANTS.MAX_ENERGY),
                      fat: Math.min(playerPiece.fat + fatGain, ENERGY_CONSTANTS.MAX_FAT)
                    }
                  : playerPiece
              )
            }
          : p
      )
      
      const updatedNewState = { ...newState, players: updatedPlayers }
      return { 
        success: true, 
        state: updatedNewState, 
        newState: updatedNewState, 
        message: `Piece ate ${action.amount} ${action.resourceType} and gained ${energyGain || fatGain} ${action.conversionType}` 
      }
    })
    
    this.registerHandler('ADVANCE_TURN', (state) => {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
      const nextPlayer = state.players[nextPlayerIndex]
      
      console.log(`🔄 ADVANCE_TURN - From Player ${currentPlayer?.name} to Player ${nextPlayer?.name}`)
      
      // Reset movedThisTurn flag for all pieces and handle barren space transitions
      const updatedPlayers = state.players.map((player, index) => {
        if (index === state.currentPlayerIndex) {
          // For current player ending their turn: move harvestedThisTurn to barrenSpaces
          console.log(`  Player ${player.name} (ending turn):`)
          console.log(`    Old barrenSpaces: [${(player.barrenSpaces || []).join(', ')}]`)
          console.log(`    Old harvestedThisTurn: [${(player.harvestedThisTurn || []).join(', ')}]`)
          console.log(`    New barrenSpaces: [${(player.harvestedThisTurn || []).join(', ')}]`)
          console.log(`    New harvestedThisTurn: []`)
          
          return {
            ...player,
            barrenSpaces: player.harvestedThisTurn || [],  // Replace barren spaces with this turn's harvests
            harvestedThisTurn: [],  // Clear harvested this turn
            pieces: player.pieces.map(piece => ({
              ...piece,
              movedThisTurn: false,
              harvestedThisTurn: false
            }))
          }
        } else if (index === nextPlayerIndex) {
          // For next player starting their turn: clear their barren spaces (they've waited a full cycle)
          console.log(`  Player ${player.name} (starting turn):`)
          console.log(`    Clearing barren spaces: [${(player.barrenSpaces || []).join(', ')}] → []`)
          
          return {
            ...player,
            barrenSpaces: [],  // Clear barren spaces - they've waited a full turn cycle
            pieces: player.pieces.map(piece => ({
              ...piece,
              movedThisTurn: false,
              harvestedThisTurn: false
            }))
          }
        } else {
          // For other players: just reset piece flags
          return {
            ...player,
            pieces: player.pieces.map(piece => ({
              ...piece,
              movedThisTurn: false,
              harvestedThisTurn: false
            }))
          }
        }
      })
      
      const newState = { 
        ...state, 
        players: updatedPlayers,
        turn: state.turn + 1,
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
        turnPhase: 'movement' as TurnPhase,  // Reset to movement phase for next player
        energyTaxPaid: false, // Reset energy tax for new turn
        lastUpdated: Date.now()
      }
      
      // Check if we need to advance season after TURNS_PER_SEASON turns
      const shouldAdvanceSeason = newState.turn % SEASON_CONSTANTS.TURNS_PER_SEASON === 0
      let message = `Advanced to turn ${newState.turn}`
      
      if (shouldAdvanceSeason) {
        // Auto-advance season
        const seasonHandler = this.handlers.get('ADVANCE_SEASON')
        if (seasonHandler) {
          const seasonResult = seasonHandler(newState, { type: 'ADVANCE_SEASON', timestamp: Date.now() })
          if (seasonResult.success) {
            message += ` - ${seasonResult.message}`
            return { success: true, state: seasonResult.state, newState: seasonResult.newState, message }
          }
        }
      }
      
      return { success: true, state: newState, newState, message }
    })
    
    this.registerHandler('ADVANCE_PHASE', (state) => {
      const phases: TurnPhase[] = ['movement', 'harvest', 'eat', 'hibernation']
      const currentPhaseIndex = phases.indexOf(state.turnPhase)
      const nextPhaseIndex = (currentPhaseIndex + 1) % phases.length
      
      const newState = { 
        ...state, 
        turnPhase: phases[nextPhaseIndex],
        lastUpdated: Date.now()
      }
      
      return { success: true, state: newState, newState, message: `Advanced to ${newState.turnPhase} phase` }
    })
    
    this.registerHandler('ADVANCE_SEASON', (state) => {
      const seasons = SEASON_CONSTANTS.SEASONS
      const currentSeasonIndex = seasons.indexOf(state.season)
      const nextSeasonIndex = (currentSeasonIndex + 1) % seasons.length
      const nextSeason = seasons[nextSeasonIndex]
      
      // Advance year when transitioning from Winter back to Spring
      const newYear = (state.season === 'Winter' && nextSeason === 'Spring') 
        ? state.year + 1 
        : state.year
      
      const newState = { 
        ...state, 
        season: nextSeason,
        year: newYear,
        lastUpdated: Date.now()
      }
      
      const yearMessage = newYear > state.year ? ` (Year ${newYear})` : ''
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: `Season advanced to ${nextSeason}${yearMessage}` 
      }
    })
    
    this.registerHandler('ROLL_DICE', (state, action) => {
      if (action.type !== 'ROLL_DICE') return { success: false, state, error: 'Wrong action type' }
      
      // Roll 5 dice for board setup (one for each ring)
      const dice: number[] = []
      for (let i = 0; i < 5; i++) {
        dice.push(Math.floor(Math.random() * 6) + 1)
      }
      
      const roll = {
        dice,
        total: dice.reduce((sum, die) => sum + die, 0),
        timestamp: Date.now()
      }
      
      const newDiceState = { ...state.diceState }
      
      if (action.diceType === 'position') {
        newDiceState.positionRolls = roll
        newDiceState.isRolling = false
      } else if (action.diceType === 'direction') {
        newDiceState.directionRolls = roll
        newDiceState.isRolling = false
        
        // Calculate rotations when direction dice are rolled
        if (newDiceState.positionRolls) {
          newDiceState.rotations = roll.dice.map((directionDie, index) => {
            const positionDie = newDiceState.positionRolls!.dice[index]
            // Position: 1=stay, 2-6=rotate 1-5 positions
            const rotationAmount = positionDie === 1 ? 0 : positionDie - 1
            // Direction: 1-3=counter-clockwise (negative), 4-6=clockwise (positive)
            const rotationDirection = directionDie >= 4 ? 1 : -1
            const finalRotation = rotationAmount * rotationDirection
            
            // Debug logging to check rotation calculations
            console.log(`Ring ${index + 1}: Position die=${positionDie}, Direction die=${directionDie}, Rotation=${finalRotation}`)
            
            return finalRotation
          })
          
          console.log('Final rotations for all rings:', newDiceState.rotations)
        }
      }
      
      // Check if both dice sets are rolled and advance to board_setup phase
      const bothDiceRolled = newDiceState.positionRolls && newDiceState.directionRolls
      const gamePhase = bothDiceRolled ? 'board_setup' : state.gamePhase
      
      const newState = { 
        ...state, 
        gamePhase: gamePhase as GamePhase,
        diceState: newDiceState,
        lastUpdated: Date.now()
      }
      
      const message = bothDiceRolled 
        ? `Rolled ${action.diceType} dice: [${dice.join(', ')}] - Board setup ready!`
        : `Rolled ${action.diceType} dice: [${dice.join(', ')}]`
      
      return { success: true, state: newState, newState, message }
    })
    
    this.registerHandler('APPLY_BOARD_ROTATIONS', (state, action) => {
      if (action.type !== 'APPLY_BOARD_ROTATIONS') return { success: false, state, error: 'Wrong action type' }
      
      const { diceState } = state
      if (!diceState.rotations || diceState.rotations.length === 0) {
        return { success: false, state, error: 'No rotations to apply' }
      }
      
      // Apply rotations to board
      const newBoard = {
        ...state.board,
        rotations: diceState.rotations
      }
      
      const newState = {
        ...state,
        board: newBoard,
        lastUpdated: Date.now()
      }
      
      return { success: true, state: newState, newState, message: `Applied board rotations: [${diceState.rotations.join(', ')}]` }
    })
    
    this.registerHandler('RESET_DICE', (state, action) => {
      if (action.type !== 'RESET_DICE') return { success: false, state, error: 'Wrong action type' }
      
      const newDiceState = {
        positionRolls: null,
        directionRolls: null,
        rotations: [0, 0, 0, 0, 0],
        isRolling: false
      }
      
      const newState = {
        ...state,
        diceState: newDiceState,
        lastUpdated: Date.now()
      }
      
      return { success: true, state: newState, newState, message: 'Reset dice state' }
    })
    
    this.registerHandler('START_BEAR_PLACEMENT', (state, action) => {
      if (action.type !== 'START_BEAR_PLACEMENT') return { success: false, state, error: 'Wrong action type' }
      
      // Initialize bear placement in REVERSE player order (last player first for fairness)
      // This balances the advantage of going first in the actual game
      const playerIndices = Array.from({ length: state.players.length }, (_, i) => i).reverse()
      
      const newState = {
        ...state,
        gamePhase: 'bear_placement' as const,
        isGameStarted: false, // Game starts only when all bears are placed
        bearPlacementState: {
          currentPlayerIndex: playerIndices[0], // Start with last player (highest index)
          playersRemaining: [...playerIndices], // All players in reverse order
          isComplete: false
        },
        lastUpdated: Date.now()
      }
      
      return { success: true, state: newState, newState, message: 'Started bear placement phase - reverse player order' }
    })
    
    this.registerHandler('PLACE_BEAR', (state, action) => {
      if (action.type !== 'PLACE_BEAR') return { success: false, state, error: 'Wrong action type' }
      
      const { spaceId, playerId } = action
      const space = CoreGameStateUtils.getSpace(state, spaceId)
      const player = CoreGameStateUtils.getPlayer(state, playerId)
      
      if (!space) {
        return { success: false, state, error: `Space ${spaceId} not found` }
      }
      
      if (!player) {
        return { success: false, state, error: `Player ${playerId} not found` }
      }
      
      if (space.piece) {
        return { success: false, state, error: 'Space already occupied' }
      }
      
      // Create the bear piece
      const bearPiece = {
        id: `${playerId}-bear-${player.pieces.length + 1}`,
        playerId,
        spaceId,
        type: 'bear' as const,
        health: 100,
        energy: ENERGY_CONSTANTS.STARTING_ENERGY,
        fat: 0,
        emergencyEnergy: 0,
        isHibernating: false,
        movedThisTurn: false,
        harvestedThisTurn: false,
        resources: {
          grains: 0,
          berries: 0,
          salmon: 0,
          honey: 0,
          bearMeat: 0
        }
      }
      
      // Update player pieces and counts
      const updatedPlayers = state.players.map(p => 
        p.id === playerId 
          ? {
              ...p,
              pieces: [...p.pieces, bearPiece],
              pieceCount: {
                ...p.pieceCount,
                bears: p.pieceCount.bears + 1
              }
            }
          : p
      )
      
      // Update board space
      const updatedBoard = {
        ...state.board,
        spaces: {
          ...state.board.spaces,
          [spaceId]: {
            ...space,
            piece: bearPiece
          }
        }
      }
      
      // Update bear placement state
      const currentPlacementState = state.bearPlacementState!
      const remainingPlayers = currentPlacementState.playersRemaining.slice(1)
      const isPlacementComplete = remainingPlayers.length === 0
      
      const newBearPlacementState = isPlacementComplete 
        ? { ...currentPlacementState, isComplete: true }
        : {
            ...currentPlacementState,
            currentPlayerIndex: remainingPlayers[0],
            playersRemaining: remainingPlayers
          }
      
      const newState = {
        ...state,
        players: updatedPlayers,
        board: updatedBoard,
        bearPlacementState: newBearPlacementState,
        gamePhase: isPlacementComplete ? 'playing' as const : state.gamePhase,
        isGameStarted: isPlacementComplete ? true : state.isGameStarted,
        lastUpdated: Date.now()
      }
      
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: isPlacementComplete 
          ? 'Bear placement complete! Game starting...' 
          : `Bear placed for ${player.name}` 
      }
    })
    
    this.registerHandler('PAY_ENERGY_TAX', (state, action) => {
      if (action.type !== 'PAY_ENERGY_TAX') return { success: false, state, error: 'Wrong action type' }
      
      const { pieceId, playerId } = action
      const piece = CoreGameStateUtils.getPiece(state, pieceId)
      const player = CoreGameStateUtils.getPlayer(state, playerId)
      
      if (!piece) {
        return { success: false, state, error: `Piece ${pieceId} not found` }
      }
      
      if (!player) {
        return { success: false, state, error: `Player ${playerId} not found` }
      }
      
      if (piece.playerId !== playerId) {
        return { success: false, state, error: 'Cannot pay tax for piece belonging to another player' }
      }
      
      // Calculate energy tax cost based on season and location
      const space = CoreGameStateUtils.getSpace(state, piece.spaceId)
      let energyTaxCost = ENERGY_CONSTANTS.NORMAL_SEASON_COST // Base cost for normal seasons
      
      if (state.season === 'Winter') {
        if (space?.quadrant === 'Mountains') {
          energyTaxCost = ENERGY_CONSTANTS.WINTER_COST_MOUNTAINS // Mountains provide shelter in winter
        } else {
          energyTaxCost = ENERGY_CONSTANTS.WINTER_COST_OUTSIDE // Harsh survival outside mountains in winter
        }
      }
      
      // Try to pay energy tax with automatic fat conversion if needed
      const conversionResult = convertFatToEnergy(piece.energy, piece.fat, energyTaxCost)
      
      if (!conversionResult.canAfford) {
        // Bear cannot afford the energy tax even with fat conversion - death
        const deathAction: DeathAction = {
          type: 'DEATH',
          pieceId,
          playerId,
          reason: 'energy_insufficient',
          timestamp: Date.now()
        }
        
        // Execute death handler
        const deathHandler = this.handlers.get('DEATH')
        if (deathHandler) {
          const deathResult = deathHandler(state, deathAction)
          if (deathResult.success) {
            return {
              success: true,
              state: deathResult.state,
              newState: deathResult.newState,
              message: `${player.name}'s bear starved to death (insufficient energy and fat for daily tax: needed ${energyTaxCost}, had ${piece.energy} energy + ${piece.fat} fat)`
            }
          }
        }
        
        return { success: false, state, error: `Bear died of starvation: needed ${energyTaxCost} energy, had ${piece.energy} energy + ${piece.fat} fat` }
      }
      
      // Apply energy cost using the conversion result
      const newEnergy = conversionResult.newEnergy
      const newFat = conversionResult.newFat
      const fatUsed = conversionResult.fatUsed
      
      // Build success message
      let taxMessage = `${player.name}'s bear paid ${energyTaxCost} energy tax`
      if (fatUsed > 0) {
        taxMessage += ` (converted ${fatUsed} fat to ${conversionResult.fatUsed / ENERGY_CONSTANTS.FAT_TO_ENERGY_RATIO} energy)`
      }
      
      // Update the piece's energy and fat
      const updatedPlayers = state.players.map(p => 
        p.id === playerId 
          ? {
              ...p,
              pieces: p.pieces.map(playerPiece => 
                playerPiece.id === pieceId
                  ? { 
                      ...playerPiece, 
                      energy: newEnergy,
                      fat: newFat
                    }
                  : playerPiece
              )
            }
          : p
      )
      
      // Update board space with updated piece
      const updatedBoard = space ? {
        ...state.board,
        spaces: {
          ...state.board.spaces,
          [piece.spaceId]: {
            ...space,
            piece: updatedPlayers.find(p => p.id === playerId)?.pieces.find(p => p.id === pieceId) || null
          }
        }
      } : state.board
      
      const newState = {
        ...state,
        players: updatedPlayers,
        board: updatedBoard,
        energyTaxPaid: true, // Mark that energy tax has been paid this turn
        lastUpdated: Date.now()
      }
      
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: taxMessage
      }
    })
    
    this.registerHandler('EMERGENCY_ENERGY', (state, action) => {
      if (action.type !== 'EMERGENCY_ENERGY') return { success: false, state, error: 'Wrong action type' }
      
      const { pieceId, fatAmount, playerId } = action
      const piece = CoreGameStateUtils.getPiece(state, pieceId)
      const player = CoreGameStateUtils.getPlayer(state, playerId)
      
      if (!piece) {
        return { success: false, state, error: `Piece ${pieceId} not found` }
      }
      
      if (!player) {
        return { success: false, state, error: `Player ${playerId} not found` }
      }
      
      if (piece.playerId !== playerId) {
        return { success: false, state, error: 'Cannot convert fat for piece belonging to another player' }
      }
      
      if (piece.fat < fatAmount) {
        return { success: false, state, error: `Insufficient fat: need ${fatAmount}, have ${piece.fat}` }
      }
      
      // 2 fat → 1 emergency energy conversion rate
      const emergencyEnergyGained = Math.floor(fatAmount / 2)
      
      if (emergencyEnergyGained === 0) {
        return { success: false, state, error: 'Need at least 2 fat to convert to emergency energy' }
      }
      
      // Update the piece's fat and emergency energy
      const updatedPlayers = state.players.map(p => 
        p.id === playerId 
          ? {
              ...p,
              pieces: p.pieces.map(playerPiece => 
                playerPiece.id === pieceId
                  ? { 
                      ...playerPiece, 
                      fat: playerPiece.fat - fatAmount,
                      emergencyEnergy: playerPiece.emergencyEnergy + emergencyEnergyGained
                    }
                  : playerPiece
              )
            }
          : p
      )
      
      // Update board space with updated piece
      const space = CoreGameStateUtils.getSpace(state, piece.spaceId)
      const updatedBoard = space ? {
        ...state.board,
        spaces: {
          ...state.board.spaces,
          [piece.spaceId]: {
            ...space,
            piece: updatedPlayers.find(p => p.id === playerId)?.pieces.find(p => p.id === pieceId) || null
          }
        }
      } : state.board
      
      const newState = {
        ...state,
        players: updatedPlayers,
        board: updatedBoard,
        lastUpdated: Date.now()
      }
      
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: `${player.name} converted ${fatAmount} fat to ${emergencyEnergyGained} emergency energy` 
      }
    })
    
    this.registerHandler('DEATH', (state, action) => {
      if (action.type !== 'DEATH') return { success: false, state, error: 'Wrong action type' }
      
      const { pieceId, playerId, reason } = action
      const piece = CoreGameStateUtils.getPiece(state, pieceId)
      const player = CoreGameStateUtils.getPlayer(state, playerId)
      
      if (!piece) {
        return { success: false, state, error: `Piece ${pieceId} not found` }
      }
      
      if (!player) {
        return { success: false, state, error: `Player ${playerId} not found` }
      }
      
      if (piece.playerId !== playerId) {
        return { success: false, state, error: 'Cannot kill piece belonging to another player' }
      }
      
      // Remove piece from player's pieces
      const updatedPlayers = state.players.map(p => 
        p.id === playerId 
          ? {
              ...p,
              pieces: p.pieces.filter(playerPiece => playerPiece.id !== pieceId),
              pieceCount: {
                ...p.pieceCount,
                bears: p.pieces.filter(playerPiece => playerPiece.id !== pieceId && playerPiece.type === 'bear').length,
                cubs: p.pieces.filter(playerPiece => playerPiece.id !== pieceId && playerPiece.type === 'cub').length
              }
            }
          : p
      )
      
      // Remove piece from board
      const updatedBoard = { ...state.board }
      Object.keys(updatedBoard.spaces).forEach(spaceId => {
        if (updatedBoard.spaces[spaceId].piece?.id === pieceId) {
          updatedBoard.spaces[spaceId] = { ...updatedBoard.spaces[spaceId], piece: null }
        }
      })
      Object.keys(updatedBoard.bridges).forEach(bridgeId => {
        if (updatedBoard.bridges[bridgeId].piece?.id === pieceId) {
          updatedBoard.bridges[bridgeId] = { ...updatedBoard.bridges[bridgeId], piece: null }
        }
      })
      
      const newState = {
        ...state,
        players: updatedPlayers,
        board: updatedBoard,
        lastUpdated: Date.now()
      }
      
      const reasonText = reason === 'energy_insufficient' ? 'starvation' : reason === 'combat' ? 'combat' : 'starvation'
      
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: `${player.name}'s bear died of ${reasonText}` 
      }
    })
    
    this.registerHandler('HIBERNATE', (state, action) => {
      if (action.type !== 'HIBERNATE') return { success: false, state, error: 'Wrong action type' }
      
      const { pieceId, playerId } = action
      const piece = CoreGameStateUtils.getPiece(state, pieceId)
      const player = CoreGameStateUtils.getPlayer(state, playerId)
      
      if (!piece) {
        return { success: false, state, error: `Piece ${pieceId} not found` }
      }
      
      if (!player) {
        return { success: false, state, error: `Player ${playerId} not found` }
      }
      
      if (piece.playerId !== playerId) {
        return { success: false, state, error: 'Cannot hibernate piece belonging to another player' }
      }
      
      // Hibernation validation
      if (state.season !== 'Winter') {
        return { success: false, state, error: 'Can only hibernate in Winter' }
      }
      
      const space = CoreGameStateUtils.getSpace(state, piece.spaceId)
      if (!space || space.quadrant !== 'Mountains') {
        return { success: false, state, error: 'Must be in Mountains to hibernate' }
      }
      
      const fatCostToHibernate = 3
      if (piece.fat < fatCostToHibernate) {
        return { success: false, state, error: `Need ${fatCostToHibernate} fat to hibernate, have ${piece.fat}` }
      }
      
      // Calculate remaining fat after hibernation cost
      const remainingFat = piece.fat - fatCostToHibernate
      
      // Update the piece for hibernation
      const updatedPlayers = state.players.map(p => 
        p.id === playerId 
          ? {
              ...p,
              pieces: p.pieces.map(playerPiece => 
                playerPiece.id === pieceId
                  ? { 
                      ...playerPiece, 
                      isHibernating: true,
                      energy: ENERGY_CONSTANTS.HIBERNATION_RESET_ENERGY, // Reset to hibernation energy level
                      fat: remainingFat, // Keep remaining fat for survival
                      emergencyEnergy: 0, // Clear emergency energy
                      resources: { // Clear all resources
                        grains: 0,
                        berries: 0,
                        salmon: 0,
                        honey: 0,
                        bearMeat: 0
                      }
                    }
                  : playerPiece
              )
            }
          : p
      )
      
      // Update board space with updated piece
      const updatedBoard = space ? {
        ...state.board,
        spaces: {
          ...state.board.spaces,
          [piece.spaceId]: {
            ...space,
            piece: updatedPlayers.find(p => p.id === playerId)?.pieces.find(p => p.id === pieceId) || null
          }
        }
      } : state.board
      
      const newState = {
        ...state,
        players: updatedPlayers,
        board: updatedBoard,
        lastUpdated: Date.now()
      }
      
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: `${player.name}'s bear entered hibernation (consumed ${fatCostToHibernate} fat, reset to ${ENERGY_CONSTANTS.HIBERNATION_RESET_ENERGY} energy, ${remainingFat} fat remaining)` 
      }
    })
    
    this.registerHandler('TRADING', (state, action) => {
      if (action.type !== 'TRADING') return { success: false, state, error: 'Wrong action type' }
      
      const { fromPieceId, toPieceId, fromResourceType, toResourceType, fromAmount, toAmount, playerId } = action
      const fromPiece = CoreGameStateUtils.getPiece(state, fromPieceId)
      const toPiece = CoreGameStateUtils.getPiece(state, toPieceId)
      const player = CoreGameStateUtils.getPlayer(state, playerId)
      
      if (!fromPiece) {
        return { success: false, state, error: `From piece ${fromPieceId} not found` }
      }
      
      if (!toPiece) {
        return { success: false, state, error: `To piece ${toPieceId} not found` }
      }
      
      if (!player) {
        return { success: false, state, error: `Player ${playerId} not found` }
      }
      
      // Validate ownership - player must own the fromPiece (initiating trade)
      if (fromPiece.playerId !== playerId) {
        return { success: false, state, error: 'Can only initiate trades with your own pieces' }
      }
      
      // Validate pieces belong to different players
      if (fromPiece.playerId === toPiece.playerId) {
        return { success: false, state, error: 'Cannot trade with your own pieces' }
      }
      
      // Check if pieces have enough resources
      if (fromPiece.resources[fromResourceType] < fromAmount) {
        return { 
          success: false, 
          state, 
          error: `From piece doesn't have enough ${fromResourceType}: has ${fromPiece.resources[fromResourceType]}, needs ${fromAmount}` 
        }
      }
      
      if (toPiece.resources[toResourceType] < toAmount) {
        return { 
          success: false, 
          state, 
          error: `To piece doesn't have enough ${toResourceType}: has ${toPiece.resources[toResourceType]}, needs ${toAmount}` 
        }
      }
      
      // Check if pieces are adjacent (trading requires adjacency)
      const fromSpace = CoreGameStateUtils.getSpace(state, fromPiece.spaceId)
      const toSpace = CoreGameStateUtils.getSpace(state, toPiece.spaceId)
      
      if (!fromSpace || !toSpace) {
        return { success: false, state, error: 'Cannot find spaces for pieces' }
      }
      
      const areAdjacent = fromSpace.adjacentSpaces.includes(toSpace.id)
      if (!areAdjacent) {
        return { success: false, state, error: 'Pieces must be on adjacent spaces to trade' }
      }
      
      // Execute the trade
      const updatedPlayers = state.players.map(p => ({
        ...p,
        pieces: p.pieces.map(piece => {
          if (piece.id === fromPieceId) {
            return {
              ...piece,
              resources: {
                ...piece.resources,
                [fromResourceType]: piece.resources[fromResourceType] - fromAmount,
                [toResourceType]: piece.resources[toResourceType] + toAmount
              }
            }
          } else if (piece.id === toPieceId) {
            return {
              ...piece,
              resources: {
                ...piece.resources,
                [toResourceType]: piece.resources[toResourceType] - toAmount,
                [fromResourceType]: piece.resources[fromResourceType] + fromAmount
              }
            }
          }
          return piece
        })
      }))
      
      // Update board spaces with updated pieces
      const updatedFromPiece = updatedPlayers.find(p => p.id === fromPiece.playerId)?.pieces.find(p => p.id === fromPieceId)
      const updatedToPiece = updatedPlayers.find(p => p.id === toPiece.playerId)?.pieces.find(p => p.id === toPieceId)
      
      const updatedBoard = {
        ...state.board,
        spaces: {
          ...state.board.spaces,
          [fromPiece.spaceId]: {
            ...fromSpace,
            piece: updatedFromPiece || null
          },
          [toPiece.spaceId]: {
            ...toSpace,
            piece: updatedToPiece || null
          }
        }
      }
      
      const newState = {
        ...state,
        players: updatedPlayers,
        board: updatedBoard,
        lastUpdated: Date.now()
      }
      
      const fromPlayerName = updatedPlayers.find(p => p.id === fromPiece.playerId)?.name || `Player ${fromPiece.playerId}`
      const toPlayerName = updatedPlayers.find(p => p.id === toPiece.playerId)?.name || `Player ${toPiece.playerId}`
      
      return { 
        success: true, 
        state: newState, 
        newState, 
        message: `${fromPlayerName} traded ${fromAmount} ${fromResourceType} for ${toAmount} ${toResourceType} with ${toPlayerName}` 
      }
    })
    
    this.registerHandler('START_GAME', (state, action) => {
      if (action.type !== 'START_GAME') return { success: false, state, error: 'Wrong action type' }
      
      const newState = { 
        ...state, 
        gamePhase: 'playing' as GamePhase,
        isGameStarted: true,
        lastUpdated: Date.now()
      }
      
      return { success: true, state: newState, newState, message: 'Game started!' }
    })
    
    this.registerHandler('RESET_GAME', (state, action) => {
      if (action.type !== 'RESET_GAME') return { success: false, state, error: 'Wrong action type' }
      
      // Clear all pieces from board when resetting
      const clearedBoard = { ...state.board }
      Object.keys(clearedBoard.spaces).forEach(spaceId => {
        clearedBoard.spaces[spaceId] = { ...clearedBoard.spaces[spaceId], piece: null }
      })
      Object.keys(clearedBoard.bridges).forEach(bridgeId => {
        clearedBoard.bridges[bridgeId] = { ...clearedBoard.bridges[bridgeId], piece: null }
      })
      
      const newState = { 
        ...state, 
        gamePhase: 'setup' as GamePhase,
        isGameStarted: false,
        turn: 1,
        year: 1,
        currentPlayerIndex: 0,
        players: [],
        board: clearedBoard,
        lastUpdated: Date.now()
      }
      
      return { success: true, state: newState, newState, message: 'Game reset!' }
    })
  }
  
  /**
   * Register default action validators
   */
  private registerDefaultValidators(): void {
    // Global validator: Block game actions during setup phases
    const gamePhaseValidator = (state: CoreGameState, action: AnyGameAction) => {
      // Allow only dice rolling during dice_roll phase
      if (state.gamePhase === 'dice_roll') {
        const allowedDiceActions = ['ROLL_DICE']
        if (!allowedDiceActions.includes(action.type)) {
          return { valid: false, reason: 'Game is in dice roll phase - only dice rolling allowed' }
        }
      }
      
      // Allow only board setup actions during board_setup phase
      if (state.gamePhase === 'board_setup') {
        const allowedBoardSetupActions = ['APPLY_BOARD_ROTATIONS', 'START_BEAR_PLACEMENT']
        if (!allowedBoardSetupActions.includes(action.type)) {
          return { valid: false, reason: 'Game is in board setup phase - only board setup and starting bear placement allowed' }
        }
      }
      
      // Allow only bear placement during bear placement phase
      if (state.gamePhase === 'bear_placement') {
        const allowedBearPlacementActions = ['PLACE_BEAR']
        if (!allowedBearPlacementActions.includes(action.type)) {
          return { valid: false, reason: 'Game is in bear placement phase - only bear placement allowed' }
        }
      }
      
      return { valid: true }
    }
    
    // Register game phase validator for blocked action types
    this.registerValidator('MOVE_PIECE', gamePhaseValidator)
    this.registerValidator('HARVEST', gamePhaseValidator)
    this.registerValidator('EAT_RESOURCE', gamePhaseValidator)
    this.registerValidator('ADVANCE_TURN', gamePhaseValidator)
    this.registerValidator('ADVANCE_PHASE', gamePhaseValidator)
    this.registerValidator('PAY_ENERGY_TAX', gamePhaseValidator)
    this.registerValidator('PLACE_PIECE', gamePhaseValidator)

    this.registerValidator('MOVE_PIECE', (state, action) => {
      if (action.type !== 'MOVE_PIECE') return { valid: true }
      
      const piece = CoreGameStateUtils.getPiece(state, action.pieceId)
      if (!piece) {
        return { valid: false, reason: `Piece ${action.pieceId} not found` }
      }
      
      if (piece.playerId !== action.playerId) {
        return { valid: false, reason: 'Cannot move piece belonging to another player' }
      }
      
      const fromSpace = CoreGameStateUtils.getSpace(state, action.fromSpaceId)
      const toSpace = CoreGameStateUtils.getSpace(state, action.toSpaceId)
      
      if (!fromSpace || !toSpace) {
        return { valid: false, reason: 'Invalid space IDs' }
      }
      
      if (fromSpace.piece?.id !== piece.id) {
        return { valid: false, reason: 'Piece not at specified location' }
      }
      
      // Calculate movement energy cost and check if piece has enough energy
      const fat = piece.fat || 0
      let movementCost: number
      if (fat <= 5) {
        movementCost = 1
      } else if (fat <= 15) {
        movementCost = 2
      } else {
        movementCost = 3
      }
      
      if (piece.energy < movementCost) {
        return { 
          valid: false, 
          reason: `Insufficient energy to move: need ${movementCost}, have ${piece.energy}` 
        }
      }
      
      return { valid: true }
    })
    
    this.registerValidator('PLACE_PIECE', (state, action) => {
      if (action.type !== 'PLACE_PIECE') return { valid: true }
      
      const space = CoreGameStateUtils.getSpace(state, action.spaceId)
      if (!space) {
        return { valid: false, reason: `Space ${action.spaceId} not found` }
      }
      
      if (space.piece) {
        return { valid: false, reason: 'Space is already occupied' }
      }
      
      return { valid: true }
    })
  }
}

/**
 * Action Creator Helpers - Type-safe action creation
 */
export const ActionCreators = {
  movePiece(pieceId: string, fromSpaceId: string, toSpaceId: string, playerId: string): MovePieceAction {
    return {
      type: 'MOVE_PIECE',
      pieceId,
      fromSpaceId,
      toSpaceId,
      playerId
    }
  },
  
  placePiece(pieceType: 'bear' | 'cub', spaceId: string, playerId: string): PlacePieceAction {
    return {
      type: 'PLACE_PIECE',
      pieceType,
      spaceId,
      playerId
    }
  },
  
  harvest(pieceId: string, playerId: string): HarvestAction {
    return {
      type: 'HARVEST',
      pieceId,
      playerId
    }
  },
  
  eatResource(
    pieceId: string, 
    resourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat',
    amount: number,
    conversionType: 'energy' | 'fat',
    playerId: string
  ): EatResourceAction {
    return {
      type: 'EAT_RESOURCE',
      pieceId,
      resourceType,
      amount,
      conversionType,
      playerId
    }
  },
  
  advanceTurn(): AdvanceTurnAction {
    return { type: 'ADVANCE_TURN' }
  },
  
  advancePhase(): AdvancePhaseAction {
    return { type: 'ADVANCE_PHASE' }
  },
  
  advanceSeason(): AdvanceSeasonAction {
    return { type: 'ADVANCE_SEASON' }
  },
  
  rollDice(diceType: 'position' | 'direction'): RollDiceAction {
    return {
      type: 'ROLL_DICE',
      diceType
    }
  },
  
  applyBoardRotations(): ApplyBoardRotationsAction {
    return {
      type: 'APPLY_BOARD_ROTATIONS'
    }
  },
  
  resetDice(): ResetDiceAction {
    return {
      type: 'RESET_DICE'
    }
  },
  
  startBearPlacement(): StartBearPlacementAction {
    return {
      type: 'START_BEAR_PLACEMENT'
    }
  },
  
  placeBear(spaceId: string, playerId: string): PlaceBearAction {
    return {
      type: 'PLACE_BEAR',
      spaceId,
      playerId
    }
  },
  
  payEnergyTax(pieceId: string, playerId: string): PayEnergyTaxAction {
    return {
      type: 'PAY_ENERGY_TAX',
      pieceId,
      playerId
    }
  },
  
  startGame(playerCount?: number): StartGameAction {
    return {
      type: 'START_GAME',
      playerCount
    }
  },
  
  resetGame(): ResetGameAction {
    return { type: 'RESET_GAME' }
  }
}