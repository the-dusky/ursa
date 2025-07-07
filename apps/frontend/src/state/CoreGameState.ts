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
  
  // Arena combat state
  arenaState?: {
    spaceId: string                    // Where the combat is happening
    participants: string[]             // Bear IDs participating in combat
    energyCommitments: { [bearId: string]: number }  // Hidden energy commitments
    skillRolls: { [bearId: string]: number[] }       // 5 dice rolls per bear
    phase: 'joining' | 'committing' | 'revealing' | 'resolved'
    teams: {
      [playerId: string]: {
        bearIds: string[]
        totalScore: number
      }
    }
    winner?: string                    // Winning player ID
    casualties: string[]               // Bear IDs that died
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
    gamePhase: 'dice_roll',
    season: 'Spring',
    year: 1,
    turn: 1,
    round: 1,
    totalBearTurns: 0,
    totalPlayerTurns: 0,
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
   * Create a deep copy of game state without JSON serialization
   * Uses structured cloning for better performance and type safety
   */
  clone(state: CoreGameState): CoreGameState {
    // Use structured cloning instead of JSON serialization
    // This preserves types and handles edge cases better
    return {
      // Basic game state from engine
      gamePhase: state.gamePhase,
      turnPhase: state.turnPhase,
      currentPlayerIndex: state.currentPlayerIndex,
      season: state.season,
      year: state.year,
      turn: state.turn,
      round: state.round,
      totalBearTurns: state.totalBearTurns,
      totalPlayerTurns: state.totalPlayerTurns,
      energyTaxPaid: state.energyTaxPaid,
      
      // Enhanced fields
      gameId: state.gameId,
      isGameStarted: state.isGameStarted,
      createdAt: state.createdAt,
      lastUpdated: state.lastUpdated,
      
      // Deep clone players array with proper engine types
      players: state.players.map(player => ({
        id: player.id,
        name: player.name,
        color: player.color,
        score: player.score,
        pieceCount: { ...player.pieceCount },
        barrenSpaces: [...player.barrenSpaces],
        harvestedThisTurn: [...player.harvestedThisTurn],
        // Enhanced player fields
        isActive: player.isActive,
        playerNumber: player.playerNumber,
        playerTurn: player.playerTurn,
        pieces: player.pieces.map(piece => ({
          id: piece.id,
          playerId: piece.playerId,
          spaceId: piece.spaceId,
          type: piece.type,
          health: piece.health,
          resources: { ...piece.resources },
          energy: piece.energy,
          fat: piece.fat,
          emergencyEnergy: piece.emergencyEnergy,
          isHibernating: piece.isHibernating,
          movedThisTurn: piece.movedThisTurn,
          harvestedThisTurn: piece.harvestedThisTurn,
          bearTurn: piece.bearTurn
        }))
      })),
      
      // Deep clone board with proper engine types
      board: {
        spaces: Object.fromEntries(
          Object.entries(state.board.spaces).map(([id, space]) => [
            id,
            {
              id: space.id,
              ring: space.ring,
              position: space.position,
              centerAngle: space.centerAngle,
              edgeAngles: space.edgeAngles ? { ...space.edgeAngles } : undefined,
              quadrant: space.quadrant,
              subArea: space.subArea,
              canProduce: space.canProduce,
              hasHoney: space.hasHoney,
              adjacentSpaces: [...space.adjacentSpaces],
              piece: space.piece ? {
                id: space.piece.id,
                playerId: space.piece.playerId,
                spaceId: space.piece.spaceId,
                type: space.piece.type,
                health: space.piece.health,
                resources: { ...space.piece.resources },
                energy: space.piece.energy,
                fat: space.piece.fat,
                emergencyEnergy: space.piece.emergencyEnergy,
                isHibernating: space.piece.isHibernating,
                movedThisTurn: space.piece.movedThisTurn,
                harvestedThisTurn: space.piece.harvestedThisTurn,
                bearTurn: space.piece.bearTurn
              } : null
            }
          ])
        ),
        rings: Object.fromEntries(
          Object.entries(state.board.rings).map(([ring, data]) => [
            ring,
            { ...data }
          ])
        ),
        bridges: Object.fromEntries(
          Object.entries(state.board.bridges).map(([id, space]) => [
            id,
            { ...space, piece: space.piece ? { ...space.piece } : null }
          ])
        ),
        rotations: [...state.board.rotations]
      },
      
      // Deep clone dice state
      diceState: {
        positionRolls: state.diceState.positionRolls ? {
          dice: [...state.diceState.positionRolls.dice],
          total: state.diceState.positionRolls.total,
          timestamp: state.diceState.positionRolls.timestamp
        } : null,
        directionRolls: state.diceState.directionRolls ? {
          dice: [...state.diceState.directionRolls.dice],
          total: state.diceState.directionRolls.total,
          timestamp: state.diceState.directionRolls.timestamp
        } : null,
        rotations: [...state.diceState.rotations],
        isRolling: state.diceState.isRolling
      },
      
      // Bear placement state if present
      bearPlacementState: state.bearPlacementState ? {
        currentPlayerIndex: state.bearPlacementState.currentPlayerIndex,
        playersRemaining: [...state.bearPlacementState.playersRemaining],
        isComplete: state.bearPlacementState.isComplete
      } : undefined
    }
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