/**
 * CoreGameState - Single Source of Truth
 * 
 * This extends and standardizes the engine types to be the definitive 
 * state representation for the entire game. All stores, engines, and 
 * multiplayer sync use this exact format. No format conversions needed.
 */

// Import engine types
import type {
  Season,
  GamePhase,
  TurnPhase,
  ResourceType,
  QuadrantType,
  SubAreaType,
  GameResources,
  CoreGamePiece,
  CoreGameSpace,
  CoreBoard,
  CorePlayer,
  CoreGameState as EngineGameState,
  GameResult,
  ValidationResult
} from '../engine/types'

// Re-export engine types
export type {
  Season,
  GamePhase,
  TurnPhase,
  ResourceType,
  QuadrantType,
  SubAreaType,
  GameResources,
  GameResult,
  ValidationResult
}

// Type aliases for clarity
export type GamePiece = CoreGamePiece
export type GameSpace = CoreGameSpace
export type GameBoard = CoreBoard
export type PieceType = 'bear' | 'cub'

/**
 * Enhanced Player - Extends engine CorePlayer with multiplayer state
 */
export interface Player extends CorePlayer {
  // Multiplayer state extensions
  isActive?: boolean
  playerNumber?: number
}

/**
 * Dice State for board rotations
 */
export interface DiceRoll {
  dice: number[]      // Array of die values (5 dice for position, 5 dice for direction)
  total: number       // Sum of all dice
  timestamp: number
}

export interface DiceState {
  positionRolls: DiceRoll | null
  directionRolls: DiceRoll | null
  rotations: number[]
  isRolling: boolean
}

/**
 * Enhanced Core Game State - Extends engine state with additional fields
 * This is the ONLY state representation used throughout the application
 */
export interface CoreGameState extends EngineGameState {
  // Override players with enhanced type
  players: Player[]
  board: GameBoard
  
  // Additional fields not in engine state
  gameId: string
  diceState: DiceState
  isGameStarted: boolean
  createdAt: number
  lastUpdated: number
  
  // Bear placement state
  bearPlacementState?: {
    currentPlayerIndex: number  // Index of player currently placing (reverse order)
    playersRemaining: number[]  // Player indices that still need to place bears
    isComplete: boolean
  }
  
  // Note: energyTaxPaid, season, year, turn, gamePhase, turnPhase, 
  // currentPlayerIndex all come from EngineGameState
}

/**
 * Game Action Result - Standardized action response (compatible with engine)
 */
export interface GameActionResult<T = CoreGameState> {
  success: boolean
  state: T
  newState?: T // Alias for backward compatibility
  message?: string
  error?: string
  data?: unknown
}

/**
 * State Validation - Validation result with detailed feedback
 */
export interface StateValidation {
  valid: boolean
  isValid: boolean // Alias for consistency
  error?: string
  message?: string
  errors: string[]
  warnings: string[]
}

/**
 * Helper function to create initial state
 */
export function createInitialGameState(gameId: string = 'game-' + Date.now()): CoreGameState {
  return {
    gameId,
    gamePhase: 'setup',
    season: 'Spring',
    year: 1,
    turn: 1,
    turnPhase: 'movement',
    currentPlayerIndex: 0,
    board: {
      spaces: {},
      bridges: {},
      rings: {},
      rotations: [0, 0, 0, 0, 0]
    },
    players: [],
    diceState: {
      positionRolls: null,
      directionRolls: null,
      rotations: [0, 0, 0, 0, 0],
      isRolling: false
    },
    energyTaxPaid: false,
    isGameStarted: false,
    createdAt: Date.now(),
    lastUpdated: Date.now()
  }
}

/**
 * State utilities
 */
export const CoreGameStateUtils = {
  /**
   * Create a deep copy of game state
   */
  clone(state: CoreGameState): CoreGameState {
    return JSON.parse(JSON.stringify(state))
  },
  
  /**
   * Update last modified timestamp
   */
  touch(state: CoreGameState, timestamp?: number): CoreGameState {
    return {
      ...state,
      lastUpdated: timestamp ?? Date.now()
    }
  },
  
  /**
   * Get piece by ID (searches all players)
   */
  getPiece(state: CoreGameState, pieceId: string): GamePiece | null {
    for (const player of state.players) {
      const piece = player.pieces.find(p => p.id === pieceId)
      if (piece) return piece
    }
    return null
  },
  
  /**
   * Get space by ID (including bridges)
   */
  getSpace(state: CoreGameState, spaceId: string): GameSpace | null {
    return state.board.spaces[spaceId] || state.board.bridges[spaceId] || null
  },
  
  /**
   * Get current player
   */
  getCurrentPlayer(state: CoreGameState): Player | null {
    return state.players[state.currentPlayerIndex] || null
  },
  
  /**
   * Get player by ID
   */
  getPlayer(state: CoreGameState, playerId: string): Player | null {
    return state.players.find(p => p.id === playerId) || null
  }
}