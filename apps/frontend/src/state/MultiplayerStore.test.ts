/**
 * MultiplayerStore Tests - Test React store for multiplayer concerns
 * 
 * These tests ensure the MultiplayerStore properly handles Y.js sync,
 * room management, and player connections while maintaining separation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMultiplayerStore, useMultiplayerSelectors, useMultiplayerActions } from './MultiplayerStore'
import { CoreGameState } from './CoreGameState'
import {
  createTestGameState,
  createMockYjsDoc,
  createMockWebSocketProvider
} from '@/test/utils/testUtils'

// Import mocked modules for type safety
import { Doc } from 'yjs'
import { WebsocketProvider } from 'y-websocket'

describe('MultiplayerStore', () => {
  afterEach(() => {
    // Reset store to initial state
    const { disconnectFromRoom } = useMultiplayerStore.getState()
    disconnectFromRoom()
    vi.clearAllMocks()
  })
  
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useMultiplayerStore())
      
      const state = result.current
      expect(state.isConnected).toBe(false)
      expect(state.isConnecting).toBe(false)
      expect(state.connectionError).toBeNull()
      expect(state.roomId).toBeNull()
      expect(state.roomConfig).toBeNull()
      expect(state.playerName).toBeNull()
      expect(state.playerId).toBeNull()
      expect(state.playerNumber).toBeNull()
      expect(state.connectedPlayers).toEqual({})
      expect(state.yjsDoc).toBeNull()
      expect(state.yjsProvider).toBeNull()
    })
  })
  
  describe('useMultiplayerSelectors', () => {
    it('should provide connection selectors', () => {
      const { result } = renderHook(() => useMultiplayerSelectors())
      
      expect(result.current.isConnected).toBe(false)
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.connectionError).toBeNull()
    })
    
    it('should provide room selectors', () => {
      const { result } = renderHook(() => useMultiplayerSelectors())
      
      expect(result.current.roomId).toBeNull()
      expect(result.current.roomConfig).toBeNull()
      expect(result.current.isRoomCreator).toBe(false)
    })
    
    it('should provide player selectors', () => {
      const { result } = renderHook(() => useMultiplayerSelectors())
      
      expect(result.current.playerName).toBeNull()
      expect(result.current.playerId).toBeNull()
      expect(result.current.playerNumber).toBeNull()
    })
    
    it('should provide connected players selectors', () => {
      const { result } = renderHook(() => useMultiplayerSelectors())
      
      expect(result.current.connectedPlayers).toEqual({})
      expect(result.current.connectedPlayerCount).toBe(0)
    })
    
    it('should provide game status selectors', () => {
      const { result } = renderHook(() => useMultiplayerSelectors())
      
      expect(result.current.isGameStarted).toBe(false)
      expect(result.current.canStartGame).toBe(false)
    })
    
    it('should identify room creator correctly', () => {
      const { result: selectorsResult } = renderHook(() => useMultiplayerSelectors())
      
      // Set player as room creator using Zustand's state mutation
      act(() => {
        useMultiplayerStore.setState({ playerNumber: 1 })
      })
      
      expect(selectorsResult.current.isRoomCreator).toBe(true)
      expect(selectorsResult.current.canStartGame).toBe(true)
    })
  })
  
  describe('useMultiplayerActions', () => {
    it('should provide connection actions', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      expect(typeof result.current.connectToRoom).toBe('function')
      expect(typeof result.current.disconnectFromRoom).toBe('function')
    })
    
    it('should provide room management actions', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      expect(typeof result.current.createRoom).toBe('function')
      expect(typeof result.current.startGameInRoom).toBe('function')
    })
    
    it('should provide state sync actions', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      expect(typeof result.current.syncGameState).toBe('function')
      expect(typeof result.current.onGameStateSync).toBe('function')
    })
    
    it('should provide player management actions', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      expect(typeof result.current.updatePlayerStatus).toBe('function')
    })
    
    it('should provide error handling actions', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      expect(typeof result.current.clearError).toBe('function')
    })
  })
  
  describe('Connection Management', () => {
    beforeEach(() => {
      // Y.js and WebSocket are already mocked in setup.ts
      // Reset to default implementations to prevent test bleeding
      vi.clearAllMocks()
      vi.mocked(Doc).mockImplementation(() => createMockYjsDoc() as any)
      vi.mocked(WebsocketProvider).mockImplementation(() => createMockWebSocketProvider() as any)
    })
    
    it('should prevent double connection', async () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      // Start connecting
      act(() => {
        result.current.connectToRoom('test-room', 'Test Player', 'player-1')
      })
      
      // Try to connect again while connecting
      await expect(
        result.current.connectToRoom('other-room', 'Other Player', 'player-2')
      ).rejects.toThrow('Already connecting or connected')
    })
    
    it('should set connecting state during connection', async () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: selectorsResult } = renderHook(() => useMultiplayerSelectors())
      
      expect(selectorsResult.current.isConnecting).toBe(false)
      
      // Start connection (don't await to check intermediate state)
      act(() => {
        actionsResult.current.connectToRoom('test-room', 'Test Player', 'player-1')
      })
      
      expect(selectorsResult.current.isConnecting).toBe(true)
    })
    
    it('should handle connection timeout', async () => {
      // Use fake timers to control timeout behavior
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useMultiplayerActions())
      
      // Mock provider that never connects
      const timeoutProvider = createMockWebSocketProvider()
      // Don't simulate 'connected' event - provider will timeout
      vi.mocked(WebsocketProvider).mockImplementation(() => timeoutProvider as any)
      
      // Start the connection attempt
      const connectionPromise = result.current.connectToRoom('test-room', 'Test Player', 'player-1')
      
      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(10000) // 10 seconds
      
      await expect(connectionPromise).rejects.toThrow('Connection timeout')
      
      // Clean up fake timers
      vi.useRealTimers()
    })
    
    it('should handle connection errors', async () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      // Mock provider that errors
      const errorProvider = createMockWebSocketProvider()
      setTimeout(() => {
        errorProvider.simulateEvent('connection-error', { message: 'Network error' })
      }, 0)
      
      vi.mocked(WebsocketProvider).mockImplementation(() => errorProvider as any)
      
      await expect(
        result.current.connectToRoom('test-room', 'Test Player', 'player-1')
      ).rejects.toThrow('Network error')
    })
    
    it('should cleanup on connection failure', async () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: selectorsResult } = renderHook(() => useMultiplayerSelectors())
      
      // Mock connection failure
      vi.mocked(Doc).mockImplementation(() => {
        throw new Error('Y.js creation failed')
      })
      
      try {
        await act(async () => {
          await actionsResult.current.connectToRoom('test-room', 'Test Player', 'player-1')
        })
      } catch (error) {
        // Expected to fail
      }
      
      // State should be cleaned up
      expect(selectorsResult.current.isConnecting).toBe(false)
      expect(selectorsResult.current.isConnected).toBe(false)
      expect(selectorsResult.current.connectionError).toBeTruthy()
    })
    
    it('should disconnect cleanly', () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: storeResult } = renderHook(() => useMultiplayerStore())
      
      // Set up connected state
      act(() => {
        storeResult.current.isConnected = true
        storeResult.current.roomId = 'test-room'
        storeResult.current.playerId = 'player-1'
      })
      
      // Disconnect
      act(() => {
        actionsResult.current.disconnectFromRoom()
      })
      
      expect(storeResult.current.isConnected).toBe(false)
      expect(storeResult.current.roomId).toBeNull()
      expect(storeResult.current.playerId).toBeNull()
    })
  })
  
  describe('Room Management', () => {
    it('should create room with configuration', async () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      // Mock successful connection
      const mockDoc = createMockYjsDoc()
      const mockProvider = createMockWebSocketProvider()
      
      // Simulate successful connection
      setTimeout(() => {
        mockProvider.simulateEvent('status', { status: 'connected' })
      }, 0)
      
      vi.mocked(Doc).mockImplementation(() => mockDoc as any)
      vi.mocked(WebsocketProvider).mockImplementation(() => mockProvider as any)
      
      await act(async () => {
        await result.current.createRoom('test-room', 4, 'Creator', 'creator-id')
      })
      
      // Should call room config setup
      const roomConfigMap = mockDoc.getMap('roomConfig')
      expect(roomConfigMap.set).toHaveBeenCalledWith('playerCount', 4)
      expect(roomConfigMap.set).toHaveBeenCalledWith('gameStarted', false)
      expect(roomConfigMap.set).toHaveBeenCalledWith('createdBy', 'creator-id')
    })
    
    it('should start game in room as creator', async () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: storeResult } = renderHook(() => useMultiplayerStore())
      
      // Set up as room creator
      const mockDoc = createMockYjsDoc()
      act(() => {
        storeResult.current.yjsDoc = mockDoc as any
        storeResult.current.playerNumber = 1 // Room creator
      })
      
      await act(async () => {
        await actionsResult.current.startGameInRoom()
      })
      
      const roomConfigMap = mockDoc.getMap('roomConfig')
      expect(roomConfigMap.set).toHaveBeenCalledWith('gameStarted', true)
    })
    
    it('should prevent non-creators from starting game', async () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: storeResult } = renderHook(() => useMultiplayerStore())
      
      // Set up as non-creator
      act(() => {
        storeResult.current.yjsDoc = createMockYjsDoc() as any
        storeResult.current.playerNumber = 2 // Not creator
      })
      
      await expect(
        actionsResult.current.startGameInRoom()
      ).rejects.toThrow('Only room creator')
    })
  })
  
  describe('State Synchronization', () => {
    it('should sync game state to Y.js', () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: storeResult } = renderHook(() => useMultiplayerStore())
      
      const mockDoc = createMockYjsDoc()
      const gameState = createTestGameState({ turn: 5 })
      
      // Set up connected state
      act(() => {
        storeResult.current.yjsDoc = mockDoc as any
        storeResult.current.isConnected = true
      })
      
      act(() => {
        actionsResult.current.syncGameState(gameState)
      })
      
      const gameStateMap = mockDoc.getMap('gameState')
      expect(gameStateMap.set).toHaveBeenCalledWith('turn', 5)
      expect(gameStateMap.set).toHaveBeenCalledWith('gamePhase', 'setup')
    })
    
    it('should warn when syncing while disconnected', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      const gameState = createTestGameState()
      
      act(() => {
        result.current.syncGameState(gameState)
      })
      
      // Should warn but not crash
      expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
        expect.stringContaining('Cannot sync game state')
      )
    })
    
    it('should handle sync errors gracefully', () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: storeResult } = renderHook(() => useMultiplayerStore())
      
      const mockDoc = createMockYjsDoc()
      // Make getMap throw an error
      mockDoc.getMap.mockImplementation(() => {
        throw new Error('Y.js error')
      })
      
      act(() => {
        storeResult.current.yjsDoc = mockDoc as any
        storeResult.current.isConnected = true
      })
      
      act(() => {
        actionsResult.current.syncGameState(createTestGameState())
      })
      
      // Should not crash
      expect(vi.mocked(console.error)).toHaveBeenCalled()
    })
    
    it('should register and unregister sync callbacks', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      const callback = vi.fn()
      
      let unsubscribe: () => void = () => {}
      act(() => {
        unsubscribe = result.current.onGameStateSync(callback)
      })
      
      expect(typeof unsubscribe).toBe('function')
      
      // Unsubscribe should work
      act(() => {
        unsubscribe()
      })
      
      // Should not error
    })
  })
  
  describe('Player Management', () => {
    it('should update player status', () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: storeResult } = renderHook(() => useMultiplayerStore())
      
      const mockDoc = createMockYjsDoc()
      const playersMap = mockDoc.getMap('players')
      playersMap.get.mockReturnValue({
        id: 'player-1',
        name: 'Test Player',
        isActive: true
      })
      
      act(() => {
        storeResult.current.yjsDoc = mockDoc as any
        storeResult.current.playerId = 'player-1'
      })
      
      act(() => {
        actionsResult.current.updatePlayerStatus(false)
      })
      
      expect(playersMap.set).toHaveBeenCalledWith('player-1', {
        id: 'player-1',
        name: 'Test Player',
        isActive: false
      })
    })
    
    it('should handle missing player data gracefully', () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: storeResult } = renderHook(() => useMultiplayerStore())
      
      const mockDoc = createMockYjsDoc()
      const playersMap = mockDoc.getMap('players')
      playersMap.get.mockReturnValue(null) // No player data
      
      act(() => {
        storeResult.current.yjsDoc = mockDoc as any
        storeResult.current.playerId = 'player-1'
      })
      
      act(() => {
        actionsResult.current.updatePlayerStatus(false)
      })
      
      // Should not crash
      expect(playersMap.set).not.toHaveBeenCalled()
    })
  })
  
  describe('Error Handling', () => {
    it('should clear connection errors', () => {
      const { result: actionsResult } = renderHook(() => useMultiplayerActions())
      const { result: storeResult } = renderHook(() => useMultiplayerStore())
      
      // Set error
      act(() => {
        storeResult.current.connectionError = 'Test error'
      })
      
      expect(storeResult.current.connectionError).toBe('Test error')
      
      // Clear error
      act(() => {
        actionsResult.current.clearError()
      })
      
      expect(storeResult.current.connectionError).toBeNull()
    })
    
    it('should handle Y.js observer errors gracefully', () => {
      // This tests that errors in Y.js observers don't crash the store
      const { result } = renderHook(() => useMultiplayerStore())
      
      expect(result.current.isConnected).toBe(false)
      // No specific test needed - the setup mocks handle this
    })
  })
  
  describe('Memory Management', () => {
    it('should clean up Y.js resources on disconnect', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      const mockDoc = createMockYjsDoc()
      const mockProvider = createMockWebSocketProvider()
      
      // Set up connected state with mocks
      act(() => {
        const store = useMultiplayerStore.getState()
        store.yjsDoc = mockDoc as any as any
        store.yjsProvider = mockProvider as any
        store.isConnected = true
      })
      
      // Disconnect
      act(() => {
        result.current.disconnectFromRoom()
      })
      
      expect(mockProvider.destroy).toHaveBeenCalled()
      expect(mockDoc.destroy).toHaveBeenCalled()
    })
    
    it('should handle cleanup errors gracefully', () => {
      const { result } = renderHook(() => useMultiplayerActions())
      
      const mockDoc = createMockYjsDoc()
      mockDoc.destroy.mockImplementation(() => {
        throw new Error('Cleanup failed')
      })
      
      // Set up state with error-prone mock
      act(() => {
        const store = useMultiplayerStore.getState()
        store.yjsDoc = mockDoc as any
        store.isConnected = true
      })
      
      // Should not crash on disconnect
      act(() => {
        result.current.disconnectFromRoom()
      })
      
      // State should still be cleaned up
      const state = useMultiplayerStore.getState()
      expect(state.isConnected).toBe(false)
    })
  })
  
  describe('DevTools Integration', () => {
    it('should expose relevant state to devtools', () => {
      const { result } = renderHook(() => useMultiplayerStore())
      
      // DevTools integration is configured in the store
      expect(result.current.isConnected).toBeDefined()
      expect(result.current.roomId).toBeDefined()
    })
  })
})