/**
 * Migration Helper for Game Store Y.js Integration
 * 
 * This replaces the complex Y.js sync logic in gameStore with clean Y.js approach
 */

import { YjsGameStateSync, SyncedGameState } from './YjsGameStateSync'

// Global Y.js sync instance
let yjsSync: YjsGameStateSync | null = null

/**
 * Start multiplayer game with clean Y.js sync
 */
export async function startMultiplayerGame(
  roomId: string, 
  playerName: string,
  onStateUpdate: (syncedState: SyncedGameState) => void,
  getCurrentSyncedState: () => SyncedGameState
): Promise<void> {
  try {
    // Clean up any existing connection
    if (yjsSync) {
      yjsSync.disconnect()
    }

    // Create new Y.js sync
    yjsSync = new YjsGameStateSync()
    
    // Connect to room
    await yjsSync.connect(roomId)
    
    console.log(`✅ Connected to Y.js room: ${roomId}`)

    // Set up Y.js → Local sync
    yjsSync.onStateChange((yjsState: SyncedGameState) => {
      console.log('📥 Received state from Y.js, applying locally')
      onStateUpdate(yjsState)
    })

    // Initial sync: Push current state to Y.js if we have one
    const currentState = getCurrentSyncedState()
    if (currentState && currentState.spaces.length > 0) {
      console.log('📤 Pushing initial state to Y.js')
      yjsSync.updateGameState(currentState)
    }

  } catch (error) {
    console.error('Failed to start multiplayer game:', error)
    throw error
  }
}

/**
 * Sync local state changes to Y.js
 */
export function syncStateToYjs(syncedState: SyncedGameState): void {
  if (yjsSync && yjsSync.isConnected()) {
    yjsSync.updateGameState(syncedState)
  }
}

/**
 * Disconnect from multiplayer
 */
export function disconnectFromMultiplayer(): void {
  if (yjsSync) {
    yjsSync.disconnect()
    yjsSync = null
    console.log('🔌 Disconnected from Y.js')
  }
}

/**
 * Check if connected to multiplayer
 */
export function isConnectedToMultiplayer(): boolean {
  return yjsSync?.isConnected() || false
}

/**
 * Get current room ID
 */
export function getCurrentRoomId(): string | null {
  return yjsSync?.getRoomId() || null
}