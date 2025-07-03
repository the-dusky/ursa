/**
 * MultiplayerStore - Y.js Sync and Room Management Only
 * 
 * This store ONLY handles multiplayer concerns:
 * - Y.js WebSocket connections
 * - Room management  
 * - Player connections
 * - State synchronization between clients
 * 
 * It does NOT handle game logic - that's in GameStateStore.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CoreGameState } from './CoreGameState'
import {
  YjsGameDocument,
  createYjsDocument,
  initializeYjsDocument,
  syncStateToYjs,
  yjsToGameState,
  observeGameState
} from './YjsDocumentStructure'

/**
 * Player slot configuration
 */
interface PlayerSlot {
  id: string
  reserved: boolean
  name?: string
}

/**
 * Room configuration
 */
interface RoomConfig {
  playerCount: number
  gameStarted?: boolean
  startedAt?: number
  createdBy?: string
  createdAt?: number
  playerSlots?: { [playerNumber: number]: PlayerSlot }
}

/**
 * Connected player info
 */
interface ConnectedPlayer {
  id: string
  name: string
  playerNumber: number
  isActive: boolean
  connectedAt: number
}

/**
 * Invite link info
 */
interface InviteLink {
  id: string
  inviteLink: string
}

/**
 * Multiplayer state
 */
interface MultiplayerState {
  // Connection status
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  
  // Room info
  roomId: string | null
  roomConfig: RoomConfig | null
  
  // Player info  
  playerName: string | null
  playerId: string | null
  playerNumber: number | null
  
  // Other players
  connectedPlayers: { [playerId: string]: ConnectedPlayer }
  
  // Y.js internals
  yjsDoc: Y.Doc | null
  yjsProvider: WebsocketProvider | null
}

/**
 * Multiplayer actions
 */
interface MultiplayerActions {
  // Connection management
  connectToRoom: (roomId: string, playerName: string, playerId: string) => Promise<void>
  disconnectFromRoom: () => void
  
  // Room management
  createRoom: (roomId: string, playerCount: number, creatorName: string, creatorId: string) => Promise<void>
  createRoomWithSlots: (roomId: string, playerCount: number, creatorName: string, creatorId: string) => Promise<{ [playerNumber: number]: InviteLink }>
  startGameInRoom: () => Promise<void>
  
  // Player utilities
  getAllPlayersInRoom: () => { [playerId: string]: ConnectedPlayer }
  getRoomConfig: () => RoomConfig | null
  
  // State synchronization
  syncGameState: (gameState: CoreGameState) => void
  onGameStateSync: (callback: (gameState: CoreGameState) => void) => () => void
  
  // Player management
  updatePlayerStatus: (isActive: boolean) => void
  
  // Error handling
  clearError: () => void
  
  // Helper methods for Y.js integration
  reconstructGameStateFromYjs: (gameStateMap: Y.Map<any>, yjsDoc: Y.Doc) => CoreGameState | null
  syncPlayersToYjs: (playersArray: Y.Array<any>, players: any[]) => void
  syncBoardToYjs: (boardMap: Y.Map<any>, board: any) => void
}

/**
 * Combined store interface
 */
type MultiplayerStore = MultiplayerState & MultiplayerActions

/**
 * WebSocket URL configuration
 */
const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://your-production-websocket-url' 
  : 'ws://localhost:1234'

/**
 * Multiplayer Store - Clean separation from game logic
 */
export const useMultiplayerStore = create<MultiplayerStore>()(
  devtools(
    (set, get) => {
      const gameStateSyncCallbacks: Set<(gameState: CoreGameState) => void> = new Set()
      
      return {
        // Initial state
        isConnected: false,
        isConnecting: false,
        connectionError: null,
        roomId: null,
        roomConfig: null,
        playerName: null,
        playerId: null,
        playerNumber: null,
        connectedPlayers: {},
        yjsDoc: null,
        yjsProvider: null,
        
        // Connection management
        connectToRoom: async (roomId: string, playerName: string, playerId: string) => {
          const state = get()
          if (state.isConnecting || state.isConnected) {
            throw new Error('Already connecting or connected')
          }
          
          set({ 
            isConnecting: true, 
            connectionError: null,
            roomId,
            playerName,
            playerId
          })
          
          try {
            console.log(`🔌 Connecting to room: ${roomId}`)
            
            // Create Y.js document
            const yjsDoc = new Y.Doc()
            
            // Create WebSocket provider
            const yjsProvider = new WebsocketProvider(WEBSOCKET_URL, roomId, yjsDoc)
            
            // Wait for connection
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'))
              }, 10000) // 10 second timeout
              
              yjsProvider.on('status', (event: { status: string }) => {
                console.log('🔌 WebSocket status:', event.status)
                if (event.status === 'connected') {
                  clearTimeout(timeout)
                  resolve()
                }
              })
              
              yjsProvider.on('connection-error', (event: Event & { message?: string }) => {
                clearTimeout(timeout)
                const errorMessage = (event as Event & { message?: string }).message || event.type || 'Unknown error'
                reject(new Error(errorMessage))
              })
            })
            
            // Set up Y.js observers
            const playersMap = yjsDoc.getMap('players')
            const gameStateMap = yjsDoc.getMap('gameState')
            const roomConfigMap = yjsDoc.getMap('roomConfig')
            
            // Observe game state changes using proper Y.js document structure
            // Create a proper Y.js document wrapper for observation
            const yjsGameDoc: YjsGameDocument = {
              doc: yjsDoc,
              gameState: gameStateMap,
              players: yjsDoc.getArray('players'),
              spaces: yjsDoc.getArray('spaces'),
              board: yjsDoc.getMap('board'),
              diceState: yjsDoc.getMap('diceState'),
              gameConfig: yjsDoc.getMap('gameConfig'),
              roomState: roomConfigMap,
              connectedUsers: playersMap
            }
            
            // Set up proper granular observers
            observeGameState(yjsGameDoc, {
              onPlayersChange: () => {
                const gameState = yjsToGameState(yjsGameDoc)
                if (gameState) {
                  console.log('📡 Received player changes from Y.js')
                  gameStateSyncCallbacks.forEach(callback => {
                    try {
                      callback(gameState)
                    } catch (error) {
                      console.error('Error in game state sync callback:', error)
                    }
                  })
                }
              },
              onGamePhaseChange: () => {
                const gameState = yjsToGameState(yjsGameDoc)
                if (gameState) {
                  console.log('📡 Received game phase change from Y.js')
                  gameStateSyncCallbacks.forEach(callback => {
                    try {
                      callback(gameState)
                    } catch (error) {
                      console.error('Error in game state sync callback:', error)
                    }
                  })
                }
              }
            })
            
            // Observe players changes - reconstruct from Y.js without JSON
            playersMap.observe(() => {
              const allPlayers: { [playerId: string]: ConnectedPlayer } = {}
              
              // Iterate through Y.Map entries directly
              playersMap.forEach((player, playerId) => {
                if (typeof player === 'object' && player !== null) {
                  allPlayers[playerId] = player as ConnectedPlayer
                }
              })
              
              set({ connectedPlayers: allPlayers })
              console.log('👥 Players updated:', Object.keys(allPlayers).length)
            })
            
            // Observe room config changes - reconstruct from Y.js without JSON
            roomConfigMap.observe(() => {
              const playerCount = roomConfigMap.get('playerCount')
              const gameStarted = roomConfigMap.get('gameStarted')
              const startedAt = roomConfigMap.get('startedAt')
              const createdBy = roomConfigMap.get('createdBy')
              const createdAt = roomConfigMap.get('createdAt')
              const playerSlots = roomConfigMap.get('playerSlots')
              
              const config: RoomConfig = {
                playerCount: typeof playerCount === 'number' ? playerCount : 2,
                gameStarted: typeof gameStarted === 'boolean' ? gameStarted : false,
                startedAt: typeof startedAt === 'number' ? startedAt : undefined,
                createdBy: typeof createdBy === 'string' ? createdBy : undefined,
                createdAt: typeof createdAt === 'number' ? createdAt : undefined,
                playerSlots: playerSlots && typeof playerSlots === 'object' ? playerSlots as { [playerNumber: number]: PlayerSlot } : undefined
              }
              
              set({ roomConfig: config })
              console.log('🏠 Room config updated:', config)
            })
            
            // Register this player - count existing players without toJSON()
            let playerCount = 0
            playersMap.forEach(() => playerCount++)
            const playerNumber = playerCount + 1
            playersMap.set(playerId, {
              id: playerId,
              name: playerName,
              playerNumber,
              isActive: true,
              connectedAt: Date.now()
            })
            
            set({
              isConnecting: false,
              isConnected: true,
              playerNumber,
              yjsDoc,
              yjsProvider,
              connectionError: null
            })
            
            console.log(`✅ Connected to room ${roomId} as Player ${playerNumber}`)
            
          } catch (error) {
            console.error('❌ Failed to connect to room:', error)
            
            // Cleanup on error
            const { yjsDoc, yjsProvider } = get()
            if (yjsProvider) {
              yjsProvider.destroy()
            }
            if (yjsDoc) {
              yjsDoc.destroy()
            }
            
            set({
              isConnecting: false,
              isConnected: false,
              connectionError: error instanceof Error ? error.message : 'Connection failed',
              yjsDoc: null,
              yjsProvider: null
            })
            
            throw error
          }
        },
        
        disconnectFromRoom: () => {
          const { yjsDoc, yjsProvider, playerId } = get()
          
          console.log('🔌 Disconnecting from room')
          
          // Mark player as inactive
          if (yjsDoc && playerId) {
            try {
              const playersMap = yjsDoc.getMap('players')
              const player = playersMap.get(playerId)
              if (player) {
                playersMap.set(playerId, { ...player, isActive: false })
              }
            } catch (error) {
              console.warn('Error marking player inactive:', error)
            }
          }
          
          // Cleanup connections - handle errors gracefully
          if (yjsProvider) {
            try {
              yjsProvider.destroy()
            } catch (error) {
              console.warn('Error destroying WebSocket provider:', error)
            }
          }
          if (yjsDoc) {
            try {
              yjsDoc.destroy()
            } catch (error) {
              console.warn('Error destroying Y.js document:', error)
            }
          }
          
          // Clear callbacks
          gameStateSyncCallbacks.clear()
          
          set({
            isConnected: false,
            isConnecting: false,
            roomId: null,
            roomConfig: null,
            playerName: null,
            playerId: null,
            playerNumber: null,
            connectedPlayers: {},
            yjsDoc: null,
            yjsProvider: null,
            connectionError: null
          })
          
          console.log('✅ Disconnected from room')
        },
        
        createRoom: async (roomId: string, playerCount: number, creatorName: string, creatorId: string) => {
          console.log(`🏗️ Creating room: ${roomId}`)
          
          // Connect to the room first
          await get().connectToRoom(roomId, creatorName, creatorId)
          
          // Set room configuration
          const { yjsDoc } = get()
          if (yjsDoc) {
            const roomConfigMap = yjsDoc.getMap('roomConfig')
            roomConfigMap.set('playerCount', playerCount)
            roomConfigMap.set('gameStarted', false)
            roomConfigMap.set('createdBy', creatorId)
            roomConfigMap.set('createdAt', Date.now())
          }
          
          console.log(`✅ Room ${roomId} created for ${playerCount} players`)
        },
        
        createRoomWithSlots: async (roomId: string, playerCount: number, creatorName: string, creatorId: string) => {
          console.log(`🏗️ Creating room with slots: ${roomId}`)
          console.log(`📝 Parameters: playerCount=${playerCount}, creatorName=${creatorName}, creatorId=${creatorId}`)
          
          // Connect to the room first
          await get().connectToRoom(roomId, creatorName, creatorId)
          
          // Generate player slots with unique IDs
          const playerSlots: { [playerNumber: number]: PlayerSlot } = {}
          const inviteLinks: { [playerNumber: number]: InviteLink } = {}
          
          for (let playerNum = 1; playerNum <= playerCount; playerNum++) {
            const slotId = playerNum === 1 ? creatorId : `player-${Date.now()}-${playerNum}-${Math.random().toString(36).substring(2, 8)}`
            
            playerSlots[playerNum] = {
              id: slotId,
              reserved: playerNum === 1, // Creator's slot is reserved
              name: playerNum === 1 ? creatorName : undefined
            }
            
            // Generate invite link for each slot
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8347'
            inviteLinks[playerNum] = {
              id: slotId,
              inviteLink: `${origin}/?room=${roomId}&player=${slotId}`
            }
          }
          
          console.log(`🎫 Generated ${playerCount} player slots:`, playerSlots)
          console.log(`🔗 Generated invite links:`, inviteLinks)
          
          // Set room configuration with player slots
          const { yjsDoc } = get()
          if (yjsDoc) {
            const roomConfigMap = yjsDoc.getMap('roomConfig')
            roomConfigMap.set('playerCount', playerCount)
            roomConfigMap.set('gameStarted', false)
            roomConfigMap.set('createdBy', creatorId)
            roomConfigMap.set('createdAt', Date.now())
            roomConfigMap.set('playerSlots', playerSlots)
            
            console.log(`✅ Room config stored in Y.js with ${playerCount} slots`)
          }
          
          console.log(`✅ Room ${roomId} created with slots for ${playerCount} players`)
          return inviteLinks
        },
        
        startGameInRoom: async () => {
          const { yjsDoc, playerNumber } = get()
          
          if (!yjsDoc || playerNumber !== 1) {
            throw new Error('Only room creator (Player 1) can start the game')
          }
          
          console.log('🎮 Starting game in room')
          
          const roomConfigMap = yjsDoc.getMap('roomConfig')
          roomConfigMap.set('gameStarted', true)
          roomConfigMap.set('startedAt', Date.now())
          
          console.log('✅ Game started in room')
        },
        
        getAllPlayersInRoom: () => {
          const { connectedPlayers } = get()
          return connectedPlayers
        },
        
        getRoomConfig: () => {
          const { roomConfig } = get()
          return roomConfig
        },
        
        syncGameState: (gameState: CoreGameState) => {
          const { yjsDoc, isConnected } = get()
          
          if (!yjsDoc || !isConnected) {
            console.warn('Cannot sync game state - not connected to Y.js')
            return
          }
          
          try {
            // Use structured Y.js document instead of flat map
            const gameStateMap = yjsDoc.getMap('gameState')
            const playersArray = yjsDoc.getArray('players')
            const boardMap = yjsDoc.getMap('board')
            
            // Update in transaction for atomicity
            yjsDoc.transact(() => {
              // Sync scalar fields directly
              gameStateMap.set('gamePhase', gameState.gamePhase)
              gameStateMap.set('turnPhase', gameState.turnPhase)
              gameStateMap.set('currentPlayerIndex', gameState.currentPlayerIndex)
              gameStateMap.set('season', gameState.season)
              gameStateMap.set('year', gameState.year)
              gameStateMap.set('turn', gameState.turn)
              gameStateMap.set('energyTaxPaid', gameState.energyTaxPaid)
              gameStateMap.set('isGameStarted', gameState.isGameStarted)
              
              // Remove lastUpdated - let Y.js handle conflict resolution
              // gameStateMap.set('lastUpdated', gameState.lastUpdated)
              
              // Sync players using Y.Array structure
              get().syncPlayersToYjs(playersArray, gameState.players)
              
              // Sync board using Y.Map structure
              get().syncBoardToYjs(boardMap, gameState.board)
              
              // Sync dice state
              if (gameState.diceState) {
                const diceMap = new Y.Map()
                Object.entries(gameState.diceState).forEach(([key, value]) => {
                  diceMap.set(key, value)
                })
                gameStateMap.set('diceState', diceMap)
              }
            })
            
            console.log('📡 Synced game state to Y.js using proper CRDT structures')
            
          } catch (error) {
            console.error('Error syncing game state:', error)
          }
        },
        
        onGameStateSync: (callback: (gameState: CoreGameState) => void) => {
          gameStateSyncCallbacks.add(callback)
          
          // Return unsubscribe function
          return () => {
            gameStateSyncCallbacks.delete(callback)
          }
        },
        
        updatePlayerStatus: (isActive: boolean) => {
          const { yjsDoc, playerId } = get()
          
          if (!yjsDoc || !playerId) {
            console.warn('Cannot update player status - not connected')
            return
          }
          
          try {
            const playersMap = yjsDoc.getMap('players')
            const player = playersMap.get(playerId)
            if (player) {
              playersMap.set(playerId, { ...player, isActive })
            }
          } catch (error) {
            console.error('Error updating player status:', error)
          }
        },
        
        clearError: () => {
          set({ connectionError: null })
        },
        
        // Helper methods for proper Y.js integration without JSON serialization
        reconstructGameStateFromYjs: (gameStateMap: Y.Map<any>, yjsDoc: Y.Doc): CoreGameState | null => {
          try {
            // Get structured data from Y.js document
            const playersArray = yjsDoc.getArray('players')
            const boardMap = yjsDoc.getMap('board')
            
            // Reconstruct players from Y.Array
            const players: any[] = []
            playersArray.forEach((playerData) => {
              if (playerData && typeof playerData === 'object') {
                players.push(playerData)
              }
            })
            
            // Reconstruct board from Y.Map
            const board: any = {}
            boardMap.forEach((value, key) => {
              board[key] = value
            })
            
            // Get dice state
            const diceStateMap = gameStateMap.get('diceState')
            let diceState: any = null
            if (diceStateMap instanceof Y.Map) {
              diceState = {}
              diceStateMap.forEach((value, key) => {
                diceState[key] = value
              })
            }
            
            return {
              gameId: 'yjs-synced', // Will be properly set elsewhere
              gamePhase: gameStateMap.get('gamePhase'),
              turnPhase: gameStateMap.get('turnPhase'),
              currentPlayerIndex: gameStateMap.get('currentPlayerIndex') || 0,
              season: gameStateMap.get('season'),
              year: gameStateMap.get('year') || 1,
              turn: gameStateMap.get('turn') || 1,
              energyTaxPaid: gameStateMap.get('energyTaxPaid') || false,
              isGameStarted: gameStateMap.get('isGameStarted') || false,
              players: players,
              board: board,
              diceState: diceState,
              createdAt: Date.now(), // Will be properly set elsewhere
              lastUpdated: Date.now() // Y.js handles this internally
            } as CoreGameState
          } catch (error) {
            console.error('Error reconstructing game state from Y.js:', error)
            return null
          }
        },
        
        syncPlayersToYjs: (playersArray: Y.Array<any>, players: any[]) => {
          // Clear and rebuild players array
          playersArray.delete(0, playersArray.length)
          
          players.forEach(player => {
            // Convert player to Y.js compatible structure
            const playerData = {
              id: player.id,
              name: player.name,
              color: player.color,
              score: player.score || 0,
              resources: player.resources,
              pieces: player.pieces || []
            }
            playersArray.push([playerData])
          })
        },
        
        syncBoardToYjs: (boardMap: Y.Map<any>, board: any) => {
          // Clear existing board data
          boardMap.clear()
          
          // Sync board data
          if (board && typeof board === 'object') {
            Object.entries(board).forEach(([key, value]) => {
              boardMap.set(key, value)
            })
          }
        }
      }
    },
    {
      name: 'multiplayer-store',
      // Only store connection state in devtools
      partialize: (state: MultiplayerStore) => ({
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        roomId: state.roomId,
        playerName: state.playerName,
        playerNumber: state.playerNumber,
        connectedPlayersCount: Object.keys(state.connectedPlayers).length,
        connectionError: state.connectionError
      })
    }
  )
)

/**
 * Convenient selectors for multiplayer state
 */
export const useMultiplayerSelectors = () => {
  const store = useMultiplayerStore()
  
  return {
    // Connection status
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    connectionError: store.connectionError,
    
    // Room info
    roomId: store.roomId,
    roomConfig: store.roomConfig,
    isRoomCreator: store.playerNumber === 1,
    
    // Player info
    playerName: store.playerName,
    playerId: store.playerId,
    playerNumber: store.playerNumber,
    
    // Other players
    connectedPlayers: store.connectedPlayers,
    connectedPlayerCount: Object.values(store.connectedPlayers).filter(p => p.isActive).length,
    
    // Game status
    isGameStarted: store.roomConfig?.gameStarted || false,
    canStartGame: store.playerNumber === 1 && !store.roomConfig?.gameStarted
  }
}

/**
 * Hook for multiplayer actions
 */
export const useMultiplayerActions = () => {
  const store = useMultiplayerStore()
  
  return {
    // Connection
    connectToRoom: store.connectToRoom,
    disconnectFromRoom: store.disconnectFromRoom,
    
    // Room management  
    createRoom: store.createRoom,
    createRoomWithSlots: store.createRoomWithSlots,
    startGameInRoom: store.startGameInRoom,
    
    // Player utilities
    getAllPlayersInRoom: store.getAllPlayersInRoom,
    getRoomConfig: store.getRoomConfig,
    
    // State sync
    syncGameState: store.syncGameState,
    onGameStateSync: store.onGameStateSync,
    
    // Player management
    updatePlayerStatus: store.updatePlayerStatus,
    
    // Error handling
    clearError: store.clearError
  }
}