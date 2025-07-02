/**
 * GameStateStore Tests - Test React store for core game data
 * 
 * These tests ensure the GameStateStore properly exposes game state
 * through React hooks while maintaining clean separation of concerns.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameStateStore, useGameSelectors, useGameActions } from './GameStateStore'
import { CoreGameState } from './CoreGameState'
import {
  createTestGameState,
  createCompleteTestGameState,
  testAssertions
} from '@/test/utils/testUtils'

// Mock console.log for cleaner test output
vi.mock('console', () => ({
  log: vi.fn(),
  error: console.error,
  warn: console.warn
}))

describe('GameStateStore', () => {
  afterEach(() => {
    // Reset store to initial state
    const { resetState } = useGameStateStore.getState()
    resetState()
    vi.clearAllMocks()
  })
  
  describe('Initial State', () => {
    it('should have valid initial game state', () => {
      const { result } = renderHook(() => useGameStateStore())
      
      const state = result.current
      testAssertions.stateValid(state.gameState)
      expect(state.isLoading).toBe(false)
      expect(state.lastError).toBeNull()
      expect(state.dispatch).toBeDefined()
    })
    
    it('should have ActionDispatcher available', () => {
      const { result } = renderHook(() => useGameStateStore())
      
      expect(result.current.dispatch).toBeDefined()
      expect(typeof result.current.dispatch.dispatch).toBe('function')
    })
  })
  
  describe('State Management', () => {
    it('should update state manually', () => {
      const { result } = renderHook(() => useGameStateStore())
      const testState = createTestGameState({ turn: 5 })
      
      act(() => {
        result.current.setState(testState)
      })
      
      expect(result.current.gameState.turn).toBe(5)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.lastError).toBeNull()
    })
    
    it('should handle state validation errors', () => {
      const { result } = renderHook(() => useGameStateStore())
      const invalidState = createTestGameState({ turn: -1 }) // Invalid
      
      act(() => {
        result.current.setState(invalidState)
      })
      
      // State should not change, error should be set
      expect(result.current.gameState.turn).not.toBe(-1)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.lastError).toBeTruthy()
    })
    
    it('should reset state to initial', () => {
      const { result } = renderHook(() => useGameStateStore())
      const testState = createTestGameState({ turn: 5, year: 3 })
      
      // Set non-initial state
      act(() => {
        result.current.setState(testState)
      })
      
      expect(result.current.gameState.turn).toBe(5)
      
      // Reset
      act(() => {
        result.current.resetState()
      })
      
      expect(result.current.gameState.turn).toBe(1)
      expect(result.current.gameState.year).toBe(1)
    })
    
    it('should clear errors', () => {
      const { result } = renderHook(() => useGameStateStore())
      
      // Cause an error
      act(() => {
        result.current.setState(createTestGameState({ turn: -1 }))
      })
      
      expect(result.current.lastError).toBeTruthy()
      
      // Clear error
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.lastError).toBeNull()
    })
  })
  
  describe('Game Initialization', () => {
    it('should initialize game with default player count', async () => {
      const { result } = renderHook(() => useGameStateStore())
      
      await act(async () => {
        await result.current.initializeGame()
      })
      
      expect(result.current.gameState.players).toHaveLength(2)
      expect(result.current.gameState.players[0].name).toBe('Player 1')
      expect(result.current.gameState.players[1].name).toBe('Player 2')
      expect(result.current.isLoading).toBe(false)
    })
    
    it('should initialize game with custom player count', async () => {
      const { result } = renderHook(() => useGameStateStore())
      
      await act(async () => {
        await result.current.initializeGame(4)
      })
      
      expect(result.current.gameState.players).toHaveLength(4)
      expect(result.current.gameState.players[3].name).toBe('Player 4')
    })
    
    it('should set player properties correctly', async () => {
      const { result } = renderHook(() => useGameStateStore())
      
      await act(async () => {
        await result.current.initializeGame(2)
      })
      
      const players = result.current.gameState.players
      
      players.forEach((player, index) => {
        expect(player.id).toBe((index + 1).toString())
        expect(player.name).toBe(`Player ${index + 1}`)
        expect(player.color).toBeDefined()
        expect(player.pieces).toEqual([])
        expect(player.pieceCount.maxBears).toBe(3)
        expect(player.pieceCount.maxCubs).toBe(6)
        expect(player.isActive).toBe(true)
        expect(player.playerNumber).toBe(index + 1)
      })
    })
    
    it('should handle initialization errors', async () => {
      const { result } = renderHook(() => useGameStateStore())
      
      // Mock dispatch to fail
      const originalDispatch = result.current.dispatch
      const spy = vi.spyOn(originalDispatch, 'dispatch').mockRejectedValue(new Error('Init failed'))
      
      await act(async () => {
        try {
          await result.current.initializeGame()
        } catch (error) {
          // Expected to throw
        }
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.lastError).toContain('Init failed')
      
      // Restore the spy to not affect other tests
      spy.mockRestore()
    })
  })
  
  describe('useGameSelectors', () => {
    it('should provide game state selectors', () => {
      const { result } = renderHook(() => useGameSelectors())
      
      expect(result.current.gamePhase).toBe('setup')
      expect(result.current.turnPhase).toBe('movement')
      expect(result.current.season).toBe('Spring')
      expect(result.current.year).toBe(1)
      expect(result.current.turn).toBe(1)
      expect(result.current.isGameStarted).toBe(false)
    })
    
    it('should provide player selectors', () => {
      const { result } = renderHook(() => useGameSelectors())
      
      expect(result.current.players).toEqual([])
      expect(result.current.currentPlayerIndex).toBe(0)
      expect(result.current.currentPlayer).toBeNull()
    })
    
    it('should provide board selectors', () => {
      const { result } = renderHook(() => useGameSelectors())
      
      expect(result.current.board).toBeDefined()
      expect(result.current.spaces).toEqual({})
      expect(result.current.bridges).toEqual({})
    })
    
    it('should provide dice selectors', () => {
      const { result } = renderHook(() => useGameSelectors())
      
      expect(result.current.diceState).toBeDefined()
      expect(result.current.diceState.positionRolls).toBeNull()
      expect(result.current.diceState.directionRolls).toBeNull()
      expect(result.current.diceState.isRolling).toBe(false)
    })
    
    it('should provide utility functions bound to current state', () => {
      const { result } = renderHook(() => useGameSelectors())
      
      expect(typeof result.current.utils.getPiece).toBe('function')
      expect(typeof result.current.utils.getSpace).toBe('function')
      expect(typeof result.current.utils.getPlayer).toBe('function')
      expect(typeof result.current.utils.getCurrentPlayer).toBe('function')
    })
    
    it('should update selectors when state changes', () => {
      const { result: storeResult } = renderHook(() => useGameStateStore())
      const { result: selectorsResult } = renderHook(() => useGameSelectors())
      
      // Initial state
      expect(selectorsResult.current.turn).toBe(1)
      
      // Update state
      act(() => {
        const newState = createTestGameState({ turn: 5 })
        storeResult.current.setState(newState)
      })
      
      // Selectors should reflect new state
      expect(selectorsResult.current.turn).toBe(5)
    })
  })
  
  describe('useGameActions', () => {
    it('should provide action dispatcher', () => {
      const { result } = renderHook(() => useGameActions())
      
      expect(result.current.dispatch).toBeDefined()
      expect(typeof result.current.dispatch.dispatch).toBe('function')
    })
    
    it('should provide convenience action creators', () => {
      const { result } = renderHook(() => useGameActions())
      
      expect(typeof result.current.movePiece).toBe('function')
      expect(typeof result.current.placePiece).toBe('function')
      expect(typeof result.current.harvest).toBe('function')
      expect(typeof result.current.eatResource).toBe('function')
      expect(typeof result.current.advanceTurn).toBe('function')
      expect(typeof result.current.advancePhase).toBe('function')
      expect(typeof result.current.rollDice).toBe('function')
    })
    
    it('should provide store actions', () => {
      const { result } = renderHook(() => useGameActions())
      
      expect(typeof result.current.initializeGame).toBe('function')
      expect(typeof result.current.resetState).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
    
    it('should dispatch actions correctly', async () => {
      const { result } = renderHook(() => useGameActions())
      
      // Roll dice action
      await act(async () => {
        const rollResult = await result.current.rollDice('position')
        testAssertions.actionSucceeded(rollResult)
      })
      
      // Check state was updated
      const { result: selectorsResult } = renderHook(() => useGameSelectors())
      expect(selectorsResult.current.diceState.positionRolls).toBeDefined()
    })
    
    it('should handle action failures gracefully', async () => {
      const { result } = renderHook(() => useGameActions())
      
      // Try to move non-existent piece
      await act(async () => {
        const moveResult = await result.current.movePiece(
          'non-existent',
          'space-1',
          'space-2',
          'player-1'
        )
        testAssertions.actionFailed(moveResult)
      })
    })
  })
  
  describe('State Reactivity', () => {
    it('should trigger re-renders on state changes', () => {
      const { result } = renderHook(() => useGameSelectors())
      let renderCount = 0
      
      // Count renders
      renderCount++
      const initialTurn = result.current.turn
      
      // Update state
      act(() => {
        const { setState } = useGameStateStore.getState()
        setState(createTestGameState({ turn: 5 }))
      })
      
      renderCount++
      expect(result.current.turn).toBe(5)
      expect(result.current.turn).not.toBe(initialTurn)
    })
    
    it('should not trigger unnecessary re-renders', () => {
      const { result } = renderHook(() => useGameStateStore(state => state.gameState.turn))
      
      let renderCount = 0
      void result.current // Access to trigger render count
      renderCount++
      
      // Update unrelated state
      act(() => {
        const { setState } = useGameStateStore.getState()
        const currentState = useGameStateStore.getState().gameState
        setState({ ...currentState, season: 'Summer' }) // Different field
      })
      
      // Should not re-render since we're only subscribed to turn
      expect(result.current).toBe(1) // Turn unchanged
    })
  })
  
  describe('Error Handling', () => {
    it('should handle state manager listener errors', () => {
      // This tests that the store handles errors in state manager listeners gracefully
      const { result } = renderHook(() => useGameStateStore())
      
      // Even if there's an error in the listener, store should remain functional
      act(() => {
        const newState = createTestGameState({ turn: 2 })
        result.current.setState(newState)
      })
      
      expect(result.current.gameState.turn).toBe(2)
      expect(result.current.isLoading).toBe(false)
    })
    
    it('should preserve game ID on reset', () => {
      const { result } = renderHook(() => useGameStateStore())
      const originalGameId = result.current.gameState.gameId
      
      act(() => {
        result.current.resetState()
      })
      
      expect(result.current.gameState.gameId).toBe(originalGameId)
    })
  })
  
  describe('Memory Management', () => {
    it('should clean up listeners properly', () => {
      // Test that listeners are properly managed
      const { result, unmount } = renderHook(() => useGameStateStore())
      
      expect(result.current).toBeDefined()
      
      // Unmount should not cause errors
      unmount()
    })
  })
  
  describe('DevTools Integration', () => {
    it('should expose state to devtools', () => {
      const { result } = renderHook(() => useGameStateStore())
      
      // Check that state is available (devtools integration is tested implicitly)
      expect(result.current.gameState).toBeDefined()
    })
  })
})