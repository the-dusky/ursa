/**
 * Core Game State Types
 * 
 * These are the core types for the game engine, separate from UI state.
 * This represents the pure game data without any UI-specific properties.
 */

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter'
export type GamePhase = 'setup' | 'bear_placement' | 'playing' | 'ended'
export type TurnPhase = 'movement' | 'harvest' | 'eat' | 'hibernation'
export type ResourceType = 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat'
export type ConversionType = 'energy' | 'fat'
export type QuadrantType = 'Mountains' | 'Pastures' | 'Forests' | 'Riverlands' | 'Bridge'
export type SubAreaType = 'Caves' | 'Hunting Grounds' | 'Center' | 'North' | 'East' | 'South' | 'West'

export interface GameResources {
  grains: number
  berries: number
  salmon: number
  honey: number
  bearMeat: number
}

export interface CoreGamePiece {
  id: string
  playerId: string
  spaceId: string
  type: 'bear' | 'cub'
  health?: number
  resources: GameResources
  energy: number
  fat: number
  emergencyEnergy: number
  isHibernating?: boolean
  movedThisTurn?: boolean  // Track if piece moved this turn for harvest rules
  harvestedThisTurn?: boolean  // Track if piece harvested this turn (one harvest per turn)
}

export interface CoreGameSpace {
  id: string
  ring: number
  position: number
  centerAngle: number
  edgeAngles?: {
    left: number
    right: number
  }
  quadrant: QuadrantType
  subArea?: SubAreaType
  piece: CoreGamePiece | null
  canProduce: boolean
  hasHoney?: boolean
  adjacentSpaces: string[]
}

export interface CoreBoard {
  spaces: { [spaceId: string]: CoreGameSpace }
  rings: {
    [ring: number]: {
      spaceCount: number
      radius: number
    }
  }
  bridges: { [bridgeId: string]: CoreGameSpace }
  rotations: number[]
}

export interface CorePlayer {
  id: string | number
  name: string
  color: string
  pieces: CoreGamePiece[]
  pieceCount: {
    bears: number
    cubs: number
    maxBears: number
    maxCubs: number
  }
  score: number
  barrenSpaces: string[]  // Spaces that are barren (recently harvested) for this player
  harvestedThisTurn: string[]  // Spaces harvested during current turn (temporary tracking)
}

/**
 * Core Game State - Only game data, no UI state
 */
export interface CoreGameState {
  board: CoreBoard
  players: CorePlayer[]
  currentPlayerIndex: number
  season: Season
  year: number
  turn: number
  gamePhase: GamePhase
  turnPhase: TurnPhase
  energyTaxPaid: boolean
}

/**
 * Game Result - Result of executing a game action
 */
export interface GameResult<T = CoreGameState> {
  success: boolean
  state: T
  message?: string
  error?: string
}

/**
 * Validation Result - Result of validating a game action
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  message?: string
}