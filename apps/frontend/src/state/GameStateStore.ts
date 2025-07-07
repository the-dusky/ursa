/**
 * GameStateStore - Clean Core Game State Management
 * 
 * This store ONLY handles core game state - no UI state, no multiplayer sync.
 * It provides a React hook interface to the StateManager for game data.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { StateManager } from './StateManager'
import { ActionDispatcher } from './ActionDispatcher'
// No longer need GameEngineAdapter - ActionDispatcher has built-in handlers
import { CoreGameState, createInitialGameState, CoreGameStateUtils } from './CoreGameState'
import { BoardFactory, BoardConfig } from '../engine/BoardFactory'
import type { QuadrantType } from '../engine/types'

/**
 * Game Store State - Only core game data
 */
interface GameStoreState {
  // Core game state (readonly)
  gameState: CoreGameState
  
  // Status flags
  isLoading: boolean
  lastError: string | null
  
  // Action dispatcher (for triggering actions)
  dispatch: ActionDispatcher
}

/**
 * Game Store Actions - Only core game actions
 */
interface GameStoreActions {
  // Direct state management
  setState: (newState: CoreGameState) => void
  resetState: () => void
  
  // Error handling
  clearError: () => void
  
  // Initialization
  initializeGame: (playerCount?: number) => Promise<void>
}

/**
 * Combined store interface
 */
type GameStore = GameStoreState & GameStoreActions

/**
 * Create StateManager and ActionDispatcher
 */
const createGameManagers = () => {
  const initialState = createInitialGameState()
  const stateManager = new StateManager(initialState)
  const actionDispatcher = new ActionDispatcher(stateManager)
  
  // ActionDispatcher now has built-in game logic handlers
  
  return { stateManager, actionDispatcher }
}

const { stateManager, actionDispatcher } = createGameManagers()

/**
 * Create initial board with all spaces using the original complex logic
 */
function createInitialBoard(customRotations?: number[]) {
  const boardConfig: BoardConfig = {
    ringConfigs: [
      { ring: 1, spaceCount: 20, radius: 120 },  // 5 spaces per quadrant
      { ring: 2, spaceCount: 24, radius: 180 },  // 6 spaces per quadrant
      { ring: 3, spaceCount: 28, radius: 240 },  // 7 spaces per quadrant
      { ring: 4, spaceCount: 32, radius: 300 },  // 8 spaces per quadrant
      { ring: 5, spaceCount: 36, radius: 360 }   // 9 spaces per quadrant
    ],
    biomes: ['Pastures', 'Mountains', 'Riverlands', 'Forests'] as QuadrantType[],
    bridgeSystem: {
      enabled: true,
      tunnelMode: true // East-West tunnel, North-South overland
    },
    honeySpaces: 5
  }
  
  const rotations = customRotations || [0, 0, 0, 0, 0]
  const engineBoard = BoardFactory.createBoard(boardConfig, rotations)
  
  // Convert to CoreGameState format
  return {
    spaces: Object.fromEntries(
      Object.entries(engineBoard.spaces).map(([id, space]) => [id, {
        ...space,
        piece: null // BoardSpace doesn't have pieces initially, they're added later
      }])
    ),
    rings: engineBoard.rings,
    bridges: Object.fromEntries(
      Object.entries(engineBoard.bridges).map(([id, space]) => [id, {
        ...space,
        piece: null
      }])
    ),
    rotations: engineBoard.rotations
  }
}

/**
 * Game State Store - Clean separation of concerns
 */
export const useGameStateStore = create<GameStore>()(
  devtools(
    (set, get) => {
      // Listen to state manager changes
      const unsubscribe = stateManager.addListener((newState) => {
        console.log('🎮 Game state updated:', {
          gamePhase: newState.gamePhase,
          turnPhase: newState.turnPhase,
          currentPlayer: newState.currentPlayerIndex,
          playerCount: newState.players.length
        })
        
        set({ 
          gameState: newState,
          isLoading: false,
          lastError: null 
        })
      })
      
      // Store cleanup function for potential future use
      ;(globalThis as typeof globalThis & { __gameStateCleanup?: () => void }).__gameStateCleanup = unsubscribe
      
      return {
        // Initial state
        gameState: stateManager.state,
        isLoading: false,
        lastError: null,
        dispatch: actionDispatcher,
        
        // Actions
        setState: (newState: CoreGameState) => {
          set({ isLoading: true })
          const result = stateManager.updateState(newState, 'manual setState')
          if (!result.success) {
            set({ 
              isLoading: false,
              lastError: result.error || 'Failed to update state'
            })
            console.error('Failed to set state:', result.error)
          }
        },
        
        resetState: () => {
          set({ isLoading: true })
          const newState = createInitialGameState(get().gameState.gameId)
          const result = stateManager.updateState(newState, 'manual reset')
          if (!result.success) {
            set({ 
              isLoading: false,
              lastError: result.error || 'Failed to reset state'
            })
            console.error('Failed to reset state:', result.error)
          }
        },
        
        clearError: () => {
          set({ lastError: null })
        },
        
        initializeGame: async (playerCount: number = 2) => {
          set({ isLoading: true, lastError: null })
          
          try {
            // Create players - bears will be placed during setup
            const players = Array.from({ length: playerCount }, (_, i) => ({
              id: (i + 1).toString(),
              name: `Player ${i + 1}`,
              color: ['#dc2626', '#2563eb', '#16a34a', '#7c3aed'][i] || '#64748b',
              pieces: [], // Bears will be placed during game setup
              pieceCount: {
                bears: 0,
                cubs: 0,
                maxBears: 5,
                maxCubs: 3
              },
              score: 0,
              barrenSpaces: [],  // Initialize empty barren spaces array
              harvestedThisTurn: [],  // Initialize empty harvested this turn array
              playerTurn: 0,  // Initialize new field
              isActive: true,
              playerNumber: i + 1
            }))
            
            // Create proper board with all spaces
            const board = createInitialBoard()
            
            // Update state with players and board
            const currentState = get().gameState
            const stateWithPlayers: CoreGameState = {
              ...currentState,
              players,
              board,
              isGameStarted: false // Will be set to true when game actually starts
            }
            
            const result = stateManager.updateState(stateWithPlayers, 'initializeGame')
            if (!result.success) {
              throw new Error(result.error || 'Failed to initialize game')
            }
            
            // Game stays in setup phase - dice rolling and board setup must be done manually
            
            console.log('🎮 Game initialized successfully with', playerCount, 'players')
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            set({ 
              isLoading: false,
              lastError: errorMessage
            })
            console.error('Failed to initialize game:', error)
            throw error
          }
        }
      }
    },
    {
      name: 'game-state-store',
      // Only store essential state in devtools
      partialize: (state: GameStoreState) => ({
        gameState: {
          gamePhase: state.gameState.gamePhase,
          turnPhase: state.gameState.turnPhase,
          currentPlayerIndex: state.gameState.currentPlayerIndex,
          playerCount: state.gameState.players.length,
          season: state.gameState.season,
          year: state.gameState.year,
          turn: state.gameState.turn
        },
        isLoading: state.isLoading,
        lastError: state.lastError
      })
    }
  )
)

/**
 * Convenient selectors for common game state
 */
export const useGameSelectors = () => {
  const gameState = useGameStateStore(state => state.gameState)
  
  return {
    // Basic game info
    gamePhase: gameState.gamePhase,
    turnPhase: gameState.turnPhase,
    season: gameState.season,
    year: gameState.year,
    turn: gameState.turn,
    isGameStarted: gameState.isGameStarted,
    
    // Players
    players: gameState.players,
    currentPlayerIndex: gameState.currentPlayerIndex,
    currentPlayer: gameState.players[gameState.currentPlayerIndex] || null,
    
    // Board
    board: gameState.board,
    spaces: gameState.board.spaces,
    bridges: gameState.board.bridges,
    
    // Dice
    diceState: gameState.diceState,
    
    // Game state
    energyTaxPaid: gameState.energyTaxPaid,
    
    // Utility functions bound to current state
    utils: {
      getPiece: (pieceId: string) => CoreGameStateUtils.getPiece(gameState, pieceId),
      getSpace: (spaceId: string) => CoreGameStateUtils.getSpace(gameState, spaceId),
      getPlayer: (playerId: string) => CoreGameStateUtils.getPlayer(gameState, playerId),
      getCurrentPlayer: () => CoreGameStateUtils.getCurrentPlayer(gameState)
    }
  }
}

/**
 * Hook for game actions (uses the dispatcher)
 */
export const useGameActions = () => {
  const dispatch = useGameStateStore(state => state.dispatch)
  const { initializeGame, resetState, clearError } = useGameStateStore()
  
  return {
    // Direct actions through dispatcher
    dispatch,
    
    // Convenience action creators
    movePiece: (pieceId: string, fromSpaceId: string, toSpaceId: string, playerId: string) =>
      dispatch.dispatch({
        type: 'MOVE_PIECE',
        pieceId,
        fromSpaceId,
        toSpaceId,
        playerId
      }),
      
    placePiece: (pieceType: 'bear' | 'cub', spaceId: string, playerId: string) =>
      dispatch.dispatch({
        type: 'PLACE_PIECE',
        pieceType,
        spaceId,
        playerId
      }),
      
    harvest: (pieceId: string, playerId: string) =>
      dispatch.dispatch({
        type: 'HARVEST',
        pieceId,
        playerId
      }),
      
    eatResource: (pieceId: string, resourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat', amount: number, playerId: string, conversionType: 'energy' | 'fat' = 'energy') =>
      dispatch.dispatch({
        type: 'EAT_RESOURCE',
        pieceId,
        resourceType,
        amount,
        conversionType,
        playerId
      }),
      
    advanceTurn: () =>
      dispatch.dispatch({
        type: 'ADVANCE_TURN'
      }),
      
    advancePhase: () =>
      dispatch.dispatch({
        type: 'ADVANCE_PHASE'
      }),
      
    rollDice: async (diceType: 'position' | 'direction') => {
      // Set rolling state
      const currentState = useGameStateStore.getState().gameState
      const rollingState = {
        ...currentState,
        diceState: {
          ...currentState.diceState,
          isRolling: true
        },
        lastUpdated: Date.now()
      }
      
      const setRollingResult = stateManager.updateState(rollingState, 'set rolling state')
      if (!setRollingResult.success) {
        console.error('Failed to set rolling state:', setRollingResult.error)
      }
      
      // Add a small delay for animation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Then roll the dice
      return dispatch.dispatch({
        type: 'ROLL_DICE',
        diceType
      })
    },
    
    applyBoardRotations: () =>
      dispatch.dispatch({
        type: 'APPLY_BOARD_ROTATIONS'
      }),
      
    resetDice: () =>
      dispatch.dispatch({
        type: 'RESET_DICE'
      }),
      
    startBearPlacement: () =>
      dispatch.dispatch({
        type: 'START_BEAR_PLACEMENT'
      }),
      
    placeBear: (spaceId: string, playerId: string) =>
      dispatch.dispatch({
        type: 'PLACE_BEAR',
        spaceId,
        playerId
      }),
      
    payEnergyTax: (pieceId: string, playerId: string) =>
      dispatch.dispatch({
        type: 'PAY_ENERGY_TAX',
        pieceId,
        playerId
      }),
      
    // Arena Combat Actions
    startArena: (spaceId: string, bearIds: string[]) =>
      dispatch.dispatch({
        type: 'START_ARENA',
        spaceId,
        bearIds
      }),
      
    joinArena: (bearId: string, playerId: string) =>
      dispatch.dispatch({
        type: 'JOIN_ARENA',
        bearId,
        playerId
      }),
      
    commitEnergy: (bearId: string, energyCommitted: number, playerId: string) =>
      dispatch.dispatch({
        type: 'COMMIT_ENERGY',
        bearId,
        energyCommitted,
        playerId
      }),
      
    resolveArena: () =>
      dispatch.dispatch({
        type: 'RESOLVE_ARENA'
      }),
      
    updateBoardRotations: (rotations: number[]) => {
      // Update the board with new rotations
      const currentState = useGameStateStore.getState().gameState
      console.log('🔄 Applying board rotations:', rotations)
      const newBoard = createInitialBoard(rotations)
      
      // Preserve existing player pieces and their positions
      currentState.players.forEach(player => {
        player.pieces.forEach(piece => {
          const space = newBoard.spaces[piece.spaceId] || newBoard.bridges[piece.spaceId]
          if (space && piece.spaceId) {
            (space as any).piece = piece
          }
        })
      })
      
      const updatedState = {
        ...currentState,
        board: newBoard,
        lastUpdated: Date.now()
      }
      
      const result = stateManager.updateState(updatedState, 'updateBoardRotations')
      if (!result.success) {
        console.error('Failed to update board rotations:', result.error)
      }
    },
    
    // Store actions
    initializeGame,
    resetState,
    clearError
  }
}

/**
 * Development utilities
 */
export const useGameDebug = () => {
  const store = useGameStateStore()
  
  return {
    // State snapshots
    getSnapshot: () => stateManager.getSnapshot(),
    loadSnapshot: (snapshot: CoreGameState) => stateManager.loadSnapshot(snapshot),
    
    // Action history
    getActionHistory: () => store.dispatch.getActionHistory(),
    clearActionHistory: () => store.dispatch.clearHistory(),
    
    // State validation
    validateCurrentState: () => {
      // TODO: Add state validation
      return { isValid: true, errors: [], warnings: [] }
    },
    
    // Direct state access
    getCurrentState: () => store.gameState,
    getStateManager: () => stateManager,
    getDispatcher: () => store.dispatch
  }
}