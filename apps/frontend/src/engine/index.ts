/**
 * Game Engine - Main Export
 * 
 * Centralized export point for all engine components
 */

// GameEngine and GameConfig removed - logic moved to ActionDispatcher
export { BoardFactory } from './BoardFactory'
export type { Board as EngineBoard, BoardConfig, BoardSpace } from './BoardFactory'

// Re-export all types
export * from './types'

// Export dice utilities
export * from './utils/dice'