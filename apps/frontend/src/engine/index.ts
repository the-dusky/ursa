/**
 * Game Engine - Main Export
 * 
 * Centralized export point for all engine components
 */

export { GameEngine } from './GameEngine'
export { GAME_CONFIG, GameConfigHelpers } from './GameConfig'
export type { GameConfig } from './GameConfig'
export { BoardFactory } from './BoardFactory'
export type { Board as EngineBoard, BoardConfig, BoardSpace } from './BoardFactory'

// Re-export all types
export * from './types'

// Export dice utilities
export * from './utils/dice'