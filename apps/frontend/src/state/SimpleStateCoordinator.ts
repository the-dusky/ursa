/**
 * Simple State Coordinator - Clean Y.js Integration
 * 
 * This replaces the complex StateCoordinator with a simple approach:
 * 1. Local actions update local state immediately
 * 2. Local state syncs to Y.js automatically  
 * 3. Y.js changes update local state automatically
 * 4. No manual conflict resolution needed
 */

import { useEffect, useState } from 'react'
import { useGameStateStore } from './GameStateStore'
import { YjsGameStateSync } from './YjsGameStateSync'
import { CoreGameState } from './CoreGameState'

// Global Y.js sync instance (shared across components)
let yjsSync: YjsGameStateSync | null = null

export interface SimpleStateCoordinatorReturn {
  gameState: CoreGameState
  isConnected: boolean
  roomId: string | null
  sync: YjsGameStateSync | null
}

/**
 * Hook for coordinated game state (local + multiplayer)
 */
export function useSimpleStateCoordinator(): SimpleStateCoordinatorReturn {
  const gameState = useGameStateStore(state => state.gameState)
  const [isConnected, setIsConnected] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)

  return {
    gameState,
    isConnected,
    roomId,
    sync: yjsSync
  }
}

/**
 * Connect to multiplayer room
 */
export async function connectToMultiplayerRoom(roomId: string): Promise<YjsGameStateSync> {
  // Disconnect existing connection
  if (yjsSync) {
    yjsSync.disconnect()
  }

  // Create new Y.js sync
  yjsSync = new YjsGameStateSync()
  
  // Connect to room
  await yjsSync.connect(roomId)
  
  // Set up bidirectional sync
  setupBidirectionalSync(yjsSync)
  
  return yjsSync
}

/**
 * Disconnect from multiplayer
 */
export function disconnectFromMultiplayer(): void {
  if (yjsSync) {
    yjsSync.disconnect()
    yjsSync = null
  }
}

/**
 * Set up bidirectional sync between local state and Y.js
 */
function setupBidirectionalSync(sync: YjsGameStateSync): void {
  const gameStore = useGameStateStore.getState()
  
  // 1. Sync local changes to Y.js
  // Listen to local state changes and push to Y.js
  useGameStateStore.subscribe((state) => {
    if (sync.isConnected()) {
      sync.updateGameState(state.gameState)
    }
  })
  
  // 2. Sync Y.js changes to local state
  // Listen to Y.js changes and update local state
  sync.onStateChange((yjsState: CoreGameState) => {
    const currentState = useGameStateStore.getState().gameState
    
    // Simple timestamp check to prevent loops
    if (!yjsState.lastUpdated || yjsState.lastUpdated > currentState.lastUpdated) {
      console.log('📥 Applying Y.js state to local store')
      
      // Preserve local timestamp
      const mergedState = {
        ...yjsState,
        lastUpdated: Date.now() // Always use local timestamp
      }
      
      gameStore.setState(mergedState)
    }
  })
  
  // 3. Initial sync: Push current local state to Y.js
  const currentState = gameStore.gameState
  if (currentState && Object.keys(currentState).length > 0) {
    sync.updateGameState(currentState)
  }
}

/**
 * Get current Y.js sync instance
 */
export function getYjsSync(): YjsGameStateSync | null {
  return yjsSync
}