/**
 * StateCoordinator - Coordinates GameStateStore and MultiplayerStore
 * 
 * This coordinator ensures proper synchronization between:
 * - Local game state changes
 * - Multiplayer state synchronization  
 * - Action dispatching
 * 
 * It eliminates the complex race condition handling from the old system.
 */

import { useEffect, useMemo } from 'react'
import { useGameStateStore, useGameActions } from './GameStateStore'
import { useMultiplayerStore, useMultiplayerActions } from './MultiplayerStore'
import { CoreGameState } from './CoreGameState'

/**
 * Hook that coordinates game state and multiplayer sync
 * 
 * This should be used at the app level to set up the coordination.
 */
export function useStateCoordinator() {
  const gameState = useGameStateStore(state => state.gameState)
  const { syncGameState, onGameStateSync } = useMultiplayerActions()
  const isConnected = useMultiplayerStore(state => state.isConnected)
  
  // Sync local game state changes to multiplayer
  useEffect(() => {
    if (!isConnected) return
    
    console.log('🔄 Syncing local game state to multiplayer')
    syncGameState(gameState)
  }, [gameState, isConnected, syncGameState])
  
  // Listen for multiplayer game state changes
  useEffect(() => {
    if (!isConnected) return
    
    console.log('👂 Setting up multiplayer game state listener')
    
    const unsubscribe = onGameStateSync((multiplayerGameState: CoreGameState) => {
      console.log('📥 Received game state from multiplayer')
      
      // Update local game state store
      const currentState = useGameStateStore.getState().gameState
      
      // Only update if there are actual changes (simple timestamp check)
      if (multiplayerGameState.lastUpdated > currentState.lastUpdated) {
        console.log('✅ Applying multiplayer game state locally')
        
        // Ensure critical fields are preserved from current state if missing from multiplayer state
        const mergedState: CoreGameState = {
          ...multiplayerGameState,
          // Preserve gameId if missing (critical for validation)
          gameId: multiplayerGameState.gameId || currentState.gameId || `game-${Date.now()}`,
          // Preserve other critical fields if needed
          createdAt: multiplayerGameState.createdAt || currentState.createdAt || Date.now()
        }
        
        useGameStateStore.getState().setState(mergedState)
      } else {
        console.log('⏭️ Skipping stale multiplayer state')
      }
    })
    
    return unsubscribe
  }, [isConnected, onGameStateSync])
  
  return {
    isCoordinated: isConnected,
    gameState,
    
    // Multiplayer state for backward compatibility with original UI
    isMultiplayer: isConnected,
    roomId: useMultiplayerStore.getState().roomId,
    isConnected,
    playerName: useMultiplayerStore.getState().playerName || 'Player 1',
    playerId: useMultiplayerStore.getState().playerId,
    playerNumber: useMultiplayerStore.getState().playerNumber || 1,
    roomPlayerCount: useMultiplayerStore.getState().connectedPlayers.length,
    maxRoomPlayers: useMultiplayerStore.getState().roomConfig?.playerCount || 2,
    isGameStarted: gameState.isGameStarted,
    gamePhase: gameState.gamePhase as 'setup' | 'playing' | 'ended',
    players: gameState.players,
    currentPlayerIndex: gameState.currentPlayerIndex,
    season: gameState.season,
    year: gameState.year,
    turn: gameState.turn,
    turnPhase: gameState.turnPhase,
    energyTaxPaid: gameState.energyTaxPaid,
    board: gameState.board,
    createdRooms: [] // TODO: Implement created rooms management
  }
}

/**
 * Helper hook for coordinated multiplayer game actions
 * 
 * This ensures actions are properly coordinated between local and multiplayer state.
 */
export function useCoordinatedGameActions() {
  const gameActions = useGameActions()
  const multiplayerActions = useMultiplayerActions()
  
  // Wrap game actions to ensure they're properly synchronized
  const coordinatedActions = useMemo(() => ({
    // Game initialization with multiplayer support
    initializeMultiplayerGame: async (roomId: string, playerCount: number, playerName: string, playerId: string) => {
      try {
        // First connect to multiplayer room
        await multiplayerActions.connectToRoom(roomId, playerName, playerId)
        
        // Then initialize local game
        await gameActions.initializeGame(playerCount)
        
        console.log('✅ Multiplayer game initialized')
      } catch (error) {
        console.error('❌ Failed to initialize multiplayer game:', error)
        throw error
      }
    },
    
    createMultiplayerRoom: async (roomId: string, playerCount: number, creatorName: string, creatorId: string) => {
      try {
        // Create room in multiplayer store
        await multiplayerActions.createRoom(roomId, playerCount, creatorName, creatorId)
        
        // Initialize local game
        await gameActions.initializeGame(playerCount)
        
        console.log('✅ Multiplayer room created and game initialized')
      } catch (error) {
        console.error('❌ Failed to create multiplayer room:', error)
        throw error
      }
    },
    
    startMultiplayerGame: async () => {
      try {
        // Start game in multiplayer room
        await multiplayerActions.startGameInRoom()
        
        console.log('✅ Multiplayer game started')
      } catch (error) {
        console.error('❌ Failed to start multiplayer game:', error)
        throw error
      }
    },
    
    // All other actions work the same - they go through local store first,
    // then get synchronized to multiplayer automatically
    ...gameActions
  }), [gameActions, multiplayerActions])
  
  return coordinatedActions
}

/**
 * Development utilities for state coordination
 */
export function useStateCoordinatorDebug() {
  const gameState = useGameStateStore(state => state.gameState)
  const multiplayerState = useMultiplayerStore()
  
  return {
    // State inspection
    getLocalGameState: () => gameState,
    getMultiplayerState: () => ({
      isConnected: multiplayerState.isConnected,
      roomId: multiplayerState.roomId,
      playerNumber: multiplayerState.playerNumber,
      connectedPlayers: multiplayerState.connectedPlayers
    }),
    
    // Manual sync (for debugging)
    forceSyncToMultiplayer: () => {
      if (multiplayerState.isConnected) {
        multiplayerState.syncGameState(gameState)
      }
    },
    
    // State comparison
    compareStates: () => {
      // TODO: Add state comparison utilities for debugging sync issues
      return {
        message: 'State comparison not yet implemented'
      }
    }
  }
}