/**
 * StateCoordinator Tests - Basic coordination functionality
 * 
 * These tests focus on the core coordination logic between stores.
 * Complex multiplayer integration tests are handled by E2E testing with Playwright.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  useStateCoordinator, 
  useCoordinatedGameActions,
  useStateCoordinatorDebug 
} from './StateCoordinator'
import { useGameStateStore } from './GameStateStore'
import { useMultiplayerStore } from './MultiplayerStore'
import {
  createTestGameState,
  testAssertions
} from '@/test/utils/testUtils'

describe('StateCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    // Reset stores to clean state
    const gameStore = useGameStateStore.getState()
    const multiplayerStore = useMultiplayerStore.getState()
    
    gameStore.resetState()
    multiplayerStore.disconnectFromRoom()
    
    vi.clearAllMocks()
  })
  
  describe('useStateCoordinator', () => {
    it('should indicate not coordinated when disconnected', () => {
      const { result } = renderHook(() => useStateCoordinator())
      
      expect(result.current.isCoordinated).toBe(false)
      expect(result.current.gameState).toBeDefined()
    })
    
    it('should clean up listeners on unmount', () => {
      const { unmount } = renderHook(() => useStateCoordinator())
      
      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow()
    })
    
    // Note: Complex multiplayer integration tests (sync, race conditions, connections)
    // are handled by E2E testing with Playwright for more realistic testing
  })

  describe('useCoordinatedGameActions', () => {
    it('should provide all game actions', () => {
      const { result } = renderHook(() => useCoordinatedGameActions())
      
      // Should have basic game actions
      expect(typeof result.current.movePiece).toBe('function')
      expect(typeof result.current.harvest).toBe('function')
      expect(typeof result.current.advanceTurn).toBe('function')
      expect(typeof result.current.initializeGame).toBe('function')
      
      // Should have multiplayer coordination actions
      expect(typeof result.current.initializeMultiplayerGame).toBe('function')
      expect(typeof result.current.createMultiplayerRoom).toBe('function')
      expect(typeof result.current.startMultiplayerGame).toBe('function')
    })
    
    // Note: Complex multiplayer action tests (like startMultiplayerGame) are handled 
    // by E2E testing with Playwright for more realistic multiplayer scenarios
  })

  describe('useStateCoordinatorDebug', () => {
    it('should provide debug utilities', () => {
      const { result } = renderHook(() => useStateCoordinatorDebug())
      
      expect(typeof result.current.getLocalGameState).toBe('function')
      expect(typeof result.current.getMultiplayerState).toBe('function')
      expect(typeof result.current.forceSyncToMultiplayer).toBe('function')
      expect(typeof result.current.compareStates).toBe('function')
    })
    
    it('should provide local game state', () => {
      const { result } = renderHook(() => useStateCoordinatorDebug())
      
      const localState = result.current.getLocalGameState()
      expect(localState).toBeDefined()
      expect(typeof localState).toBe('object')
    })
    
    it('should provide multiplayer state info', () => {
      const { result } = renderHook(() => useStateCoordinatorDebug())
      
      const multiplayerState = result.current.getMultiplayerState()
      expect(typeof multiplayerState.isConnected).toBe('boolean')
      expect(multiplayerState.roomId).toBeDefined()
    })
    
    it('should handle force sync when disconnected', () => {
      const { result } = renderHook(() => useStateCoordinatorDebug())
      
      // Should not throw when forcing sync while disconnected
      expect(() => result.current.forceSyncToMultiplayer()).not.toThrow()
    })
    
    it('should provide state comparison', () => {
      const { result } = renderHook(() => useStateCoordinatorDebug())
      
      const comparison = result.current.compareStates()
      expect(comparison).toBeDefined()
      expect(typeof comparison.message).toBe('string')
    })
  })
})