/**
 * Test Utilities - Helpers for testing our clean state architecture
 * 
 * These utilities provide consistent ways to test state management,
 * actions, and component interactions while maintaining the 
 * architectural principles.
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { vi } from 'vitest'
import { 
  CoreGameState, 
  createInitialGameState, 
  StateManager, 
  ActionDispatcher,
  Player,
  GamePiece,
  GameSpace,
  AnyGameAction
} from '@/state'

/**
 * Create test game state with sensible defaults
 */
export function createTestGameState(overrides: Partial<CoreGameState> = {}): CoreGameState {
  const base = createInitialGameState('test-game-' + Date.now())
  
  return {
    ...base,
    lastUpdated: Date.now(), // Default timestamp
    ...overrides // Allow override of timestamp
  }
}

/**
 * Create test player with defaults
 */
export function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test-player-1',
    name: 'Test Player',
    color: '#dc2626',
    pieces: [],
    pieceCount: {
      bears: 0,
      cubs: 0,
      maxBears: 3,
      maxCubs: 6
    },
    score: 0,
    barrenSpaces: [],
    harvestedThisTurn: [],
    isActive: true,
    playerNumber: 1,
    ...overrides
  }
}

/**
 * Create test game piece with defaults
 */
export function createTestPiece(overrides: Partial<GamePiece> = {}): GamePiece {
  return {
    id: 'test-piece-1',
    playerId: 'test-player-1',
    spaceId: 'test-space-1',
    type: 'bear',
    resources: {
      grains: 0,
      berries: 0,
      salmon: 0,
      honey: 0,
      bearMeat: 0
    },
    energy: 10,
    fat: 5,
    emergencyEnergy: 0,
    health: 10,
    isHibernating: false,
    movedThisTurn: false,
    ...overrides
  }
}

/**
 * Create test game space with defaults
 */
export function createTestSpace(overrides: Partial<GameSpace> = {}): GameSpace {
  return {
    id: 'test-space-1',
    ring: 1,
    position: 0,
    centerAngle: 0,
    quadrant: 'Pastures',
    canProduce: true,
    hasHoney: false,
    adjacentSpaces: [],
    piece: null,
    ...overrides
  }
}

/**
 * Create a complete test game state with players, pieces, and board
 */
export function createCompleteTestGameState(): CoreGameState {
  const player1 = createTestPlayer({ 
    id: 'player-1',
    name: 'Player 1',
    playerNumber: 1 
  })
  
  const player2 = createTestPlayer({ 
    id: 'player-2',
    name: 'Player 2',
    playerNumber: 2,
    color: '#2563eb'
  })
  
  const piece1 = createTestPiece({
    id: 'bear-1-1',
    playerId: 'player-1',
    spaceId: 'space-1'
  })
  
  const piece2 = createTestPiece({
    id: 'bear-2-1', 
    playerId: 'player-2',
    spaceId: 'space-2'
  })
  
  const space1 = createTestSpace({
    id: 'space-1',
    piece: piece1,
    quadrant: 'Pastures'
  })
  
  const space2 = createTestSpace({
    id: 'space-2',
    piece: piece2,
    quadrant: 'Forests',
    position: 1
  })
  
  // Update players with pieces
  player1.pieces = [piece1]
  player1.pieceCount.bears = 1
  
  player2.pieces = [piece2]
  player2.pieceCount.bears = 1
  
  return createTestGameState({
    gamePhase: 'playing',
    isGameStarted: true,
    players: [player1, player2],
    board: {
      spaces: {
        'space-1': space1,
        'space-2': space2
      },
      bridges: {},
      rings: {
        1: { spaceCount: 20, radius: 120 }
      },
      rotations: [0, 0, 0, 0, 0]
    }
  })
}

/**
 * Test State Manager Factory
 */
export function createTestStateManager(initialState?: CoreGameState): StateManager {
  const state = initialState || createTestGameState()
  return new StateManager(state)
}

/**
 * Test Action Dispatcher Factory
 */
export function createTestActionDispatcher(stateManager?: StateManager): ActionDispatcher {
  const manager = stateManager || createTestStateManager()
  const dispatcher = new ActionDispatcher(manager)
  
  // Built-in game logic handlers are already registered in ActionDispatcher constructor
  
  return dispatcher
}

/**
 * Test State System Factory - Complete system for integration tests
 */
export function createTestStateSystem(initialState?: CoreGameState) {
  const stateManager = createTestStateManager(initialState)
  const actionDispatcher = createTestActionDispatcher(stateManager)
  
  return {
    stateManager,
    actionDispatcher,
    
    // Helper methods
    getState: () => stateManager.state,
    setState: (newState: CoreGameState) => stateManager.updateState(newState, 'test'),
    dispatch: (action: AnyGameAction) => actionDispatcher.dispatch(action),
    
    // Cleanup
    cleanup: () => {
      // Any cleanup needed
    }
  }
}

/**
 * Wait for state updates to complete
 */
export async function waitForStateUpdate(
  stateManager: StateManager,
  predicate: (state: CoreGameState) => boolean,
  timeout = 1000
): Promise<CoreGameState> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`State update timeout: predicate not satisfied within ${timeout}ms`))
    }, timeout)
    
    const unsubscribe = stateManager.addListener((newState) => {
      if (predicate(newState)) {
        clearTimeout(timeoutId)
        unsubscribe()
        resolve(newState)
      }
    })
    
    // Check if predicate is already satisfied
    if (predicate(stateManager.state)) {
      clearTimeout(timeoutId)
      unsubscribe()
      resolve(stateManager.state)
    }
  })
}

/**
 * Mock Y.js document for multiplayer tests
 */
export function createMockYjsDoc() {
  const maps = new Map()
  
  return {
    getMap: vi.fn((name: string) => {
      if (!maps.has(name)) {
        const map = {
          set: vi.fn(),
          get: vi.fn(),
          delete: vi.fn(),
          toJSON: vi.fn(() => ({})),
          observe: vi.fn(),
          unobserve: vi.fn()
        }
        maps.set(name, map)
      }
      return maps.get(name)
    }),
    destroy: vi.fn(),
    
    // Helper to simulate Y.js updates
    simulateUpdate: (mapName: string, data: unknown) => {
      const map = maps.get(mapName)
      if (map) {
        map.toJSON.mockReturnValue(data)
        // Trigger observers
        const observers = map.observe.mock.calls.map((call: unknown[]) => call[0])
        observers.forEach((observer: unknown) => {
          if (typeof observer === 'function') {
            observer()
          }
        })
      }
    }
  }
}

/**
 * Mock WebSocket provider for multiplayer tests
 */
export function createMockWebSocketProvider() {
  const listeners = new Map()
  
  return {
    on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, [])
      }
      listeners.get(event).push(callback)
    }),
    off: vi.fn(),
    destroy: vi.fn(),
    ws: { readyState: 1 },
    
    // Helper to simulate events
    simulateEvent: (event: string, data?: unknown) => {
      const callbacks = listeners.get(event) || []
      callbacks.forEach((callback: (...args: unknown[]) => void) => callback(data))
    }
  }
}

/**
 * Custom render function with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: CoreGameState
  withStateSystem?: boolean
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { ...renderOptions } = options
  
  function Wrapper({ children }: { children: ReactNode }) {
    // Add providers here if needed for component tests
    return <>{children}</>
  }
  
  const result = render(ui, { wrapper: Wrapper, ...renderOptions })
  
  return {
    ...result,
    // Add custom utilities if needed
  }
}

/**
 * Test assertion helpers
 */
export const testAssertions = {
  /**
   * Assert that a state change occurred
   */
  stateChanged: (oldState: CoreGameState, newState: CoreGameState) => {
    expect(newState.lastUpdated).toBeGreaterThan(oldState.lastUpdated)
  },
  
  /**
   * Assert that an action succeeded
   */
  actionSucceeded: (result: { success: boolean; error?: string }) => {
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  },
  
  /**
   * Assert that an action failed with specific error
   */
  actionFailed: (result: { success: boolean; error?: string }, expectedError?: string) => {
    expect(result.success).toBe(false)
    if (expectedError) {
      expect(result.error).toContain(expectedError)
    }
  },
  
  /**
   * Assert that state is valid
   */
  stateValid: (state: CoreGameState) => {
    expect(state.gameId).toBeDefined()
    expect(state.gamePhase).toMatch(/^(setup|playing|ended)$/)
    expect(state.season).toMatch(/^(Spring|Summer|Autumn|Winter)$/)
    expect(state.year).toBeGreaterThan(0)
    expect(state.turn).toBeGreaterThan(0)
    expect(state.currentPlayerIndex).toBeGreaterThanOrEqual(0)
  }
}

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Time an async operation
   */
  timeAsync: async <T,>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now()
    const result = await operation()
    const duration = performance.now() - start
    return { result, duration }
  },
  
  /**
   * Time a sync operation
   */
  timeSync: <T,>(operation: () => T): { result: T; duration: number } => {
    const start = performance.now()
    const result = operation()
    const duration = performance.now() - start
    return { result, duration }
  }
}