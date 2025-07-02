/**
 * State Management - Clean Architecture Index
 * 
 * This provides a unified, clean interface to the entire state management system.
 * Import from here to get the DRY, separated concerns architecture.
 * 
 * Architecture:
 * - CoreGameState: Single source of truth for all game data
 * - StateManager: Central orchestrator for state changes
 * - ActionDispatcher: Single entry point for all actions
 * - GameStateStore: React store for core game state
 * - MultiplayerStore: React store for multiplayer sync
 * - StateCoordinator: Coordinates the two stores
 */

// Core state types and utilities
export type {
  CoreGameState,
  GamePiece,
  GameSpace,
  Player,
  GameBoard,
  DiceState,
  GameActionResult,
  StateValidation,
  Season,
  GamePhase,
  TurnPhase,
  QuadrantType,
  SubAreaType,
  PieceType
} from './CoreGameState'

export {
  createInitialGameState,
  CoreGameStateUtils
} from './CoreGameState'

// State management core
export type {
  StateChangeListener,
  StateValidator
} from './StateManager'

export {
  StateManager,
  StateManagerFactory
} from './StateManager'

// Action system
export type {
  GameAction,
  MovePieceAction,
  PlacePieceAction,
  HarvestAction,
  EatResourceAction,
  AdvanceTurnAction,
  AdvancePhaseAction,
  RollDiceAction,
  StartGameAction,
  ResetGameAction,
  AnyGameAction,
  ActionHandler,
  ActionValidator
} from './ActionDispatcher'

export {
  ActionDispatcher,
  ActionCreators
} from './ActionDispatcher'

// Game logic is now built into ActionDispatcher

// React hooks - Game State
export {
  useGameStateStore,
  useGameSelectors,
  useGameActions,
  useGameDebug
} from './GameStateStore'

// React hooks - Multiplayer
export {
  useMultiplayerStore,
  useMultiplayerSelectors,
  useMultiplayerActions
} from './MultiplayerStore'

// React hooks - Coordination
export {
  useStateCoordinator,
  useCoordinatedGameActions,
  useStateCoordinatorDebug
} from './StateCoordinator'

/**
 * Main Application Hook - Use this for the complete state system
 * 
 * This hook sets up the entire state coordination and provides
 * everything you need for both single-player and multiplayer games.
 */
export function useGameState() {
  // For now, just return the basic game state store
  // TODO: Add full coordination when circular imports are resolved
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useGameStateStore: _useGameStateStore } = require('./GameStateStore')
  return _useGameStateStore()
}

/**
 * Development Hook - Use this for debugging and development
 */
export function useGameStateDebug() {
  // Simplified for now
  return {
    inspect: () => ({ message: 'Debug hooks temporarily simplified' })
  }
}

/**
 * Backward Compatibility Layer
 * 
 * These provide compatibility with existing components during the transition.
 * TODO: Remove these once all components are updated to use the new architecture.
 */

// Legacy compatibility hook (maps to new architecture)
export function useGameStore() {
  const gameState = useGameState()
  
  // Map new architecture to old interface
  return {
    // Game state (mapped from new selectors)
    gamePhase: gameState.gamePhase,
    turnPhase: gameState.turnPhase,
    season: gameState.season,
    year: gameState.year,
    turn: gameState.turn,
    currentPlayerIndex: gameState.currentPlayerIndex,
    players: gameState.players,
    board: gameState.board,
    diceState: gameState.diceState,
    energyTaxPaid: gameState.energyTaxPaid,
    isGameStarted: gameState.isGameStarted,
    
    // Multiplayer state (mapped)
    isMultiplayer: gameState.isMultiplayer,
    isConnected: gameState.multiplayer.isConnected,
    roomId: gameState.multiplayer.roomId,
    playerName: gameState.multiplayer.playerName,
    playerNumber: gameState.multiplayer.playerNumber,
    
    // Actions (mapped to coordinated actions)
    initializeGame: gameState.actions.initializeGame,
    resetGame: gameState.actions.resetState,
    movePiece: gameState.actions.movePiece,
    harvest: gameState.actions.harvest,
    eatResource: gameState.actions.eatResource,
    advanceTurn: gameState.actions.advanceTurn,
    advancePhase: gameState.actions.advancePhase,
    rollDice: gameState.actions.rollDice,
    
    // Multiplayer actions (mapped)
    joinMultiplayerRoom: gameState.actions.initializeMultiplayerGame,
    createRoomWithSlots: gameState.actions.createMultiplayerRoom,
    startGameInRoom: gameState.actions.startMultiplayerGame,
    
    // Utility functions
    utils: gameState.utils
  }
}

/**
 * Export everything for advanced usage
 */
export * from './CoreGameState'
export * from './StateManager'
export * from './ActionDispatcher'
// GameEngineAdapter removed - game logic now in ActionDispatcher
export * from './GameStateStore'
export * from './MultiplayerStore'
export * from './StateCoordinator'