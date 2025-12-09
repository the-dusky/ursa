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

import {
  createInitialGameState as _createInitialGameState,
  CoreGameStateUtils as _CoreGameStateUtils
} from './CoreGameState'

export const createInitialGameState = _createInitialGameState
export const CoreGameStateUtils = _CoreGameStateUtils

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
import {
  useGameStateStore as _useGameStateStore,
  useGameActions as _useGameActions,
  useGameSelectors as _useGameSelectors,
  useGameDebug as _useGameDebug
} from './GameStateStore'

export const useGameStateStore = _useGameStateStore
export const useGameSelectors = _useGameSelectors
export const useGameActions = _useGameActions
export const useGameDebug = _useGameDebug

// React hooks - Multiplayer
import {
  useMultiplayerStore as _useMultiplayerStore,
  useMultiplayerSelectors as _useMultiplayerSelectors,
  useMultiplayerActions as _useMultiplayerActions
} from './MultiplayerStore'

export const useMultiplayerStore = _useMultiplayerStore
export const useMultiplayerSelectors = _useMultiplayerSelectors
export const useMultiplayerActions = _useMultiplayerActions

// React hooks - Coordination
import {
  useStateCoordinator as _useStateCoordinator,
  useCoordinatedGameActions as _useCoordinatedGameActions,
  useStateCoordinatorDebug as _useStateCoordinatorDebug
} from './StateCoordinator'

export const useStateCoordinator = _useStateCoordinator
export const useCoordinatedGameActions = _useCoordinatedGameActions
export const useStateCoordinatorDebug = _useStateCoordinatorDebug

/**
 * Main Application Hook - Use this for the complete state system
 *
 * This hook sets up the entire state coordination and provides
 * everything you need for both single-player and multiplayer games.
 */
export function useGameState() {
  // Call hooks in consistent order (Rules of Hooks)
  const store = _useGameStateStore()
  const gameActions = _useGameActions()
  const multiplayer = _useMultiplayerStore()
  const coordinatedActions = _useCoordinatedGameActions()

  // Get selectors directly from store.gameState to avoid extra hook calls
  const gameState = store.gameState

  return {
    // Full game state
    gameState,

    // Convenience selectors (inline to avoid hook order issues)
    gamePhase: gameState.gamePhase,
    turnPhase: gameState.turnPhase,
    season: gameState.season,
    year: gameState.year,
    turn: gameState.turn,
    isGameStarted: gameState.isGameStarted,
    players: gameState.players,
    currentPlayerIndex: gameState.currentPlayerIndex,
    currentPlayer: gameState.players[gameState.currentPlayerIndex] || null,
    board: gameState.board,
    spaces: gameState.board.spaces,
    bridges: gameState.board.bridges,
    diceState: gameState.diceState,
    energyTaxPaid: gameState.energyTaxPaid,

    // Utility functions bound to current state
    utils: {
      getPiece: (pieceId: string) => _CoreGameStateUtils.getPiece(gameState, pieceId),
      getSpace: (spaceId: string) => _CoreGameStateUtils.getSpace(gameState, spaceId),
      getPlayer: (playerId: string) => _CoreGameStateUtils.getPlayer(gameState, playerId),
      getCurrentPlayer: () => _CoreGameStateUtils.getCurrentPlayer(gameState)
    },

    // Multiplayer state
    multiplayer: {
      isConnected: multiplayer.isConnected,
      roomId: multiplayer.roomId,
      playerName: multiplayer.playerName,
      playerNumber: multiplayer.playerNumber,
      connectedPlayers: multiplayer.connectedPlayers,
      roomConfig: multiplayer.roomConfig
    },
    isMultiplayer: multiplayer.isConnected,

    // All actions - both game and coordinated
    actions: {
      ...gameActions,
      ...coordinatedActions
    },

    // Status
    isLoading: store.isLoading,
    lastError: store.lastError,
    isCoordinated: multiplayer.isConnected
  }
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