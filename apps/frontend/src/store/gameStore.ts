/**
 * Game Store - Clean State Management with Engine Delegation
 * 
 * This store focuses ONLY on:
 * - Game state management
 * - Engine delegation
 * - Multiplayer synchronization
 * - UI state has been moved to uiStore.ts
 * - Game logic has been moved to engine/
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { BoardFactory, GAME_CONFIG, type EngineBoard, type BoardConfig, type BoardSpace } from '../engine'
import { GameEngine } from '../engine/GameEngine'
import { StateAdapter } from '../engine/StateAdapter'
import type { CoreGameState, QuadrantType } from '../engine/types'
import type { DiceRoll } from '../engine/utils/dice'

// Re-export types for backward compatibility
export interface GameSpace {
  id: string
  ring: number // 0 for bridge spaces
  position: number
  angle: number
  quadrant: 'Mountains' | 'Pastures' | 'Forests' | 'Riverlands' | 'Bridge'
  subArea?: 'Caves' | 'Hunting Grounds' | 'Center' | 'North' | 'East' | 'South' | 'West'
  piece: GamePiece | null
  canProduce: boolean
  hasHoney?: boolean
  adjacentSpaces: string[]
}

export interface Board {
  spaces: { [spaceId: string]: GameSpace }
  rings: {
    [ring: number]: {
      spaceCount: number
      radius: number
    }
  }
  bridges: { [bridgeId: string]: GameSpace }
  rotations: number[]
}

export interface GamePiece {
  id: string
  playerId: string | number
  spaceId: string
  type: 'bear' | 'cub'
  health?: number
  resources: {
    grains: number
    berries: number
    salmon: number
    honey: number
    bearMeat: number
  }
  energy: number
  fat: number
  emergencyEnergy: number
  isHibernating?: boolean
  movedThisTurn?: boolean  // Track if piece moved this turn for harvest rules
}

export interface Player {
  id: string | number
  name: string
  color: string
  pieces: GamePiece[]
  pieceCount: {
    bears: number
    cubs: number
    maxBears: number
    maxCubs: number
  }
  score: number
}

export interface DiceTrayState {
  positionRolls: DiceRoll | null
  directionRolls: DiceRoll | null
  rotations: number[]
  isRolling: boolean
}

/**
 * Clean Game State - Only game data, no UI state
 */
export interface CreatedRoom {
  id: string
  name: string
  createdAt: string
  lastUsed: string
}

export interface CleanGameState {
  // Core game state
  board: Board
  players: Player[]
  currentPlayerIndex: number
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter'
  year: number
  turn: number
  gamePhase: 'setup' | 'playing' | 'ended'
  turnPhase: 'movement' | 'harvest' | 'eat' | 'hibernation'
  energyTaxPaid: boolean
  diceState: DiceTrayState

  // Multiplayer state
  isMultiplayer: boolean
  roomId: string | null
  isConnected: boolean
  playerName: string
  playerId: string | null
  playerNumber: number | null
  roomPlayerCount: number
  maxRoomPlayers: number
  createdRooms: CreatedRoom[]
  isGameStarted: boolean

  // Game actions - delegate to engine
  initializeGame: () => void
  initializeGameWithPlayerCount: (playerCount: number) => void
  initializeMultiplayerGame: (multiplayerPlayers: { [playerId: string]: { name: string; playerNumber: number } }) => void
  createRoomWithSlots: (roomId: string, playerCount: number, creatorName: string, creatorId: string) => Promise<{ [playerNumber: number]: { id: string; inviteLink: string } }>
  joinMultiplayerRoom: (roomId: string, playerName: string, playerId: string) => Promise<void>
  startGame: () => void
  disconnectFromRoom: () => void
  
  // Engine-powered actions
  updateFromEngineState: (engineState: CoreGameState) => void
  
  // Board management - delegate to BoardFactory
  updateBoardRotations: (rotations: number[]) => void
  
  // Dice management
  updateDiceState: (newDiceState: Partial<DiceTrayState>) => void
  
  // Utility functions
  calculateScore: (playerId: string | number) => number
  getPlayerTerritories: (playerId: string | number) => string[]
  areSpacesAdjacent: (spaceId1: string, spaceId2: string) => boolean
  resetGame: () => void
  
  // Multiplayer sync actions
  syncWithYjs: () => void
  
  // Room management actions
  addCreatedRoom: (roomId: string, roomName: string) => void
  removeCreatedRoom: (roomId: string) => void
  updateRoomLastUsed: (roomId: string) => void
  loadCreatedRooms: () => void
  
  // Room validation
  isValidPlayerInRoom: () => boolean
  
  // Game start control
  startGameInRoom: () => void
}

// Y.js integration
let yjsDoc: Y.Doc | null = null
let yjsProvider: WebsocketProvider | null = null
let gameStateMap: Y.Map<unknown> | null = null
let isUpdatingFromYjs = false // 🔒 Lock to prevent race conditions
let syncTimeout: NodeJS.Timeout
let isConnecting = false // 🔒 Lock to prevent multiple connection attempts

// Create a singleton game engine instance for setup operations
const gameEngine = new GameEngine()

// Created rooms management
const CREATED_ROOMS_KEY = 'seasonal-game-created-rooms'

function getCreatedRoomsFromStorage(): CreatedRoom[] {
  // Always return empty array initially to avoid hydration mismatch
  // The actual rooms will be loaded in a useEffect
  return []
}

function saveCreatedRoomsToStorage(rooms: CreatedRoom[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CREATED_ROOMS_KEY, JSON.stringify(rooms))
}

// WebSocket connection management
function cleanupConnection() {
  console.log('🧹 Cleaning up WebSocket connection')
  
  if (yjsProvider) {
    try {
      yjsProvider.destroy()
    } catch (error) {
      console.warn('Error destroying Y.js provider:', error)
    }
    yjsProvider = null
  }
  
  if (yjsDoc) {
    try {
      yjsDoc.destroy()
    } catch (error) {
      console.warn('Error destroying Y.js document:', error)
    }
    yjsDoc = null
  }
  
  gameStateMap = null
  isConnecting = false
}

function isConnectionActive(): boolean {
  return !!(
    yjsProvider && 
    yjsProvider.ws && 
    yjsProvider.ws.readyState === WebSocket.OPEN
  )
}

/**
 * Y.js Race Condition Fix Documentation
 * 
 * Problem: Previously, when Client A updated the Yjs document, Client B would receive 
 * the update and trigger a Zustand set(), which in turn would fire the store subscription
 * and call syncToYjs(), potentially overwriting A's fresh data with B's stale copy.
 * 
 * Solution:
 * 1. Lock Pattern: Use isUpdatingFromYjs flag to prevent recursive updates
 *    - Set isUpdatingFromYjs = true BEFORE calling set() in the observer
 *    - Check this flag in syncToYjs to avoid sending updates while receiving them
 * 
 * 2. Shallow Equality Check: In syncToYjs, compare current vs previous state
 *    using JSON.stringify to avoid unnecessary network traffic for identical data
 * 
 * 3. Debounced Sync: Use setTimeout(50ms) to batch rapid local changes before
 *    sending to Yjs, reducing network overhead
 * 
 * 4. Debug Logging: Track update sources with console.log to identify conflicts
 *    - "[From Yjs] Applying incoming update" - Remote changes being applied
 *    - "[To Yjs] Sending local update" - Local changes being sent
 */

/**
 * Convert engine board format to store board format
 */
function convertEngineBoard(engineBoard: EngineBoard): Board {
  const convertSpace = (space: BoardSpace): GameSpace => ({
    id: space.id,
    ring: space.ring,
    position: space.position,
    angle: space.angle,
    quadrant: space.quadrant,
    subArea: space.subArea,
    piece: null, // BoardSpace doesn't have pieces initially, they're added later
    canProduce: space.canProduce,
    hasHoney: space.hasHoney,
    adjacentSpaces: space.adjacentSpaces
  })

  return {
    spaces: Object.fromEntries(
      Object.entries(engineBoard.spaces).map(([id, space]) => [id, convertSpace(space)])
    ),
    rings: engineBoard.rings,
    bridges: Object.fromEntries(
      Object.entries(engineBoard.bridges).map(([id, space]) => [id, convertSpace(space)])
    ),
    rotations: engineBoard.rotations
  }
}

/**
 * Create initial board using BoardFactory
 */
function createInitialBoard(customRotations?: number[]): Board {
  const boardConfig: BoardConfig = {
    ringConfigs: GAME_CONFIG.board.ringConfigs,
    biomes: GAME_CONFIG.board.biomes as QuadrantType[],
    bridgeSystem: GAME_CONFIG.board.bridgeSystem,
    honeySpaces: GAME_CONFIG.board.honeySpaces
  }
  
  const rotations = customRotations || [0, 0, 0, 0, 0]
  const engineBoard = BoardFactory.createBoard(boardConfig, rotations)
  
  return convertEngineBoard(engineBoard)
}

/**
 * Create initial players
 */
function createInitialPlayers(playerCount: number = 1, multiplayerPlayers?: { [playerId: string]: { name: string; playerNumber: number } }): Player[] {
  const colors = ['#8B4513', '#228B22', '#4682B4', '#DC143C'] // Brown, Green, Blue, Red
  
  if (multiplayerPlayers) {
    // Use multiplayer player data
    return Object.values(multiplayerPlayers)
      .sort((a, b) => a.playerNumber - b.playerNumber)
      .map((player, i) => ({
        id: player.playerNumber,
        name: player.name,
        color: colors[i] || '#8B4513',
        pieces: [],
        pieceCount: { bears: 0, cubs: 0, maxBears: 3, maxCubs: 6 },
        score: 0
      }))
  }
  
  return Array.from({ length: playerCount }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    color: colors[i] || '#8B4513',
    pieces: [],
    pieceCount: { bears: 0, cubs: 0, maxBears: 3, maxCubs: 6 },
    score: 0
  }))
}

/**
 * Sync local state to Yjs with equality checks to prevent unnecessary writes
 */
const syncToYjs = (state: CleanGameState) => {
  if (!gameStateMap || isUpdatingFromYjs) return

  clearTimeout(syncTimeout)
  syncTimeout = setTimeout(() => {
    const prev = gameStateMap!.toJSON()

    // Avoid resending if nothing changed (shallow equality check)
    if (
      JSON.stringify(prev.players) === JSON.stringify(state.players) &&
      JSON.stringify(prev.board) === JSON.stringify(state.board) &&
      prev.currentPlayerIndex === state.currentPlayerIndex &&
      prev.season === state.season &&
      prev.year === state.year &&
      prev.turn === state.turn &&
      prev.gamePhase === state.gamePhase &&
      prev.turnPhase === state.turnPhase &&
      prev.energyTaxPaid === state.energyTaxPaid &&
      JSON.stringify(prev.diceState) === JSON.stringify(state.diceState)
    ) {
      return
    }

    console.log('[To Yjs] Sending local update')
    isUpdatingFromYjs = true

    try {
      gameStateMap!.set('players', state.players)
      gameStateMap!.set('board', state.board)
      gameStateMap!.set('currentPlayerIndex', state.currentPlayerIndex)
      gameStateMap!.set('season', state.season)
      gameStateMap!.set('year', state.year)
      gameStateMap!.set('turn', state.turn)
      gameStateMap!.set('gamePhase', state.gamePhase)
      gameStateMap!.set('turnPhase', state.turnPhase)
      gameStateMap!.set('energyTaxPaid', state.energyTaxPaid)
      gameStateMap!.set('diceState', state.diceState)
    } finally {
      isUpdatingFromYjs = false
    }
  }, 50)
}

export const useGameStore = create<CleanGameState>()(
  devtools(
    (set, get) => ({
      // Initial state - check if we're in a multiplayer room
      board: createInitialBoard(),
      players: createInitialPlayers(1),
      currentPlayerIndex: 0,
      season: 'Spring',
      year: 1,
      turn: 1,
      gamePhase: 'setup',
      turnPhase: 'movement',
      energyTaxPaid: false,
      diceState: {
        positionRolls: null,
        directionRolls: null,
        rotations: [],
        isRolling: false
      },

      // Multiplayer state
      isMultiplayer: false,
      roomId: null,
      isConnected: false,
      playerName: '',
      playerId: null,
      playerNumber: null,
      roomPlayerCount: 0,
      maxRoomPlayers: 4,
      createdRooms: getCreatedRoomsFromStorage(),
      isGameStarted: false,

      // Game initialization
      initializeGame: () => {
        set({
          board: createInitialBoard(),
          players: createInitialPlayers(1),
          currentPlayerIndex: 0,
          season: 'Spring',
          year: 1,
          turn: 1,
          gamePhase: 'playing',
          turnPhase: 'movement',
          energyTaxPaid: false,
          diceState: {
            positionRolls: null,
            directionRolls: null,
            rotations: [],
            isRolling: false
          }
        })
      },

      initializeGameWithPlayerCount: (playerCount: number) => {
        console.log('Initializing game with', playerCount, 'players')
        
        // Create initial board and players without bear placement
        const initialBoard = createInitialBoard()
        const initialPlayers = createInitialPlayers(playerCount)
        
        // Convert to engine format for setup using StateAdapter
        const engineBoard = StateAdapter.toBoardForSetup(initialBoard)
        const enginePlayers = StateAdapter.toPlayersForSetup(initialPlayers)
        
        // Use engine to initialize game with proper bear placement
        const result = gameEngine.initializeGameWithPlayers(engineBoard, enginePlayers)
        
        if (result.success) {
          // Convert engine result back to store format
          const storeUpdate = StateAdapter.fromEngineState(result.state!)
          
          // Apply the complete game state with bears placed
          set({
            ...storeUpdate,
            // Ensure UI state is properly set
            diceState: {
              positionRolls: null,
              directionRolls: null,
              rotations: [],
              isRolling: false
            }
          })
          
          console.log('Game initialized successfully with engine setup')
        } else {
          console.error('Failed to initialize game with engine:', result.error)
          // Fallback to basic initialization without bears
          set({
            board: initialBoard,
            players: initialPlayers,
            currentPlayerIndex: 0,
            season: 'Spring',
            year: 1,
            turn: 1,
            gamePhase: 'setup',
            turnPhase: 'movement',
            energyTaxPaid: false,
            diceState: {
              positionRolls: null,
              directionRolls: null,
              rotations: [],
              isRolling: false
            }
          })
        }
        
        // Note: Y.js sync is handled automatically by the store subscription
      },

      initializeMultiplayerGame: (multiplayerPlayers: { [playerId: string]: { name: string; playerNumber: number } }) => {
        console.log('Initializing multiplayer game with players:', multiplayerPlayers)
        
        // Create initial board and players without bear placement
        const initialBoard = createInitialBoard()
        const initialPlayers = createInitialPlayers(Object.keys(multiplayerPlayers).length, multiplayerPlayers)
        
        // Convert to engine format for setup using StateAdapter
        const engineBoard = StateAdapter.toBoardForSetup(initialBoard)
        const enginePlayers = StateAdapter.toPlayersForSetup(initialPlayers)
        
        // Use engine to initialize game with proper bear placement
        const result = gameEngine.initializeGameWithPlayers(engineBoard, enginePlayers)
        
        if (result.success) {
          // Convert engine result back to store format
          const storeUpdate = StateAdapter.fromEngineState(result.state!)
          
          // Apply the complete game state with bears placed
          set({
            ...storeUpdate,
            // Ensure UI state is properly set
            diceState: {
              positionRolls: null,
              directionRolls: null,
              rotations: [],
              isRolling: false
            }
          })
          
          console.log('Multiplayer game initialized successfully with engine setup')
        } else {
          console.error('Failed to initialize multiplayer game with engine:', result.error)
          // Fallback to basic initialization without bears
          set({
            board: initialBoard,
            players: initialPlayers,
            currentPlayerIndex: 0,
            season: 'Spring',
            year: 1,
            turn: 1,
            gamePhase: 'setup',
            turnPhase: 'movement',
            energyTaxPaid: false,
            diceState: {
              positionRolls: null,
              directionRolls: null,
              rotations: [],
              isRolling: false
            }
          })
        }
        
        // Note: Y.js sync is handled automatically by the store subscription
      },

      // Multiplayer setup
      createRoomWithSlots: async (roomId: string, playerCount: number, creatorName: string, creatorId: string) => {
        try {
          console.log(`\n🏠 ===== STEP 1: CREATING ROOM =====`)
          console.log(`📝 Room ID: ${roomId}`)
          console.log(`👥 Player Count: ${playerCount}`)
          console.log(`👤 Creator: ${creatorName}`)
          console.log(`🆔 Creator ID: ${creatorId}`)
          
          // Clean up any existing connections first
          cleanupConnection()
          
          console.log(`\n🔧 ===== STEP 2: GENERATING PLAYER SLOTS =====`)
          
          // Create player slots
          const playerSlots: { [playerNumber: number]: { id: string; reserved: boolean; joinedAt?: number } } = {}
          
          // Player 1 is the room creator
          playerSlots[1] = {
            id: creatorId,
            reserved: true,
            joinedAt: Date.now()
          }
          console.log(`✅ Slot 1 (Creator): ${creatorId} (reserved: true)`)
          
          // Generate IDs for remaining slots
          for (let i = 2; i <= playerCount; i++) {
            const slotId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-slot${i}`
            playerSlots[i] = {
              id: slotId,
              reserved: false
            }
            console.log(`✅ Slot ${i} (Open): ${slotId} (reserved: false)`)
          }
          
          console.log(`📊 Complete player slots:`, playerSlots)
          
          console.log(`\n🔌 ===== STEP 3: CREATING Y.JS CONNECTION =====`)
          console.log(`👤 WHO: Room creator "${creatorName}" (${creatorId})`)
          console.log(`🎯 PURPOSE: Initial room setup and config storage`)
          
          // Initialize Y.js connection and store room config on server
          const wsUrl = process.env.NODE_ENV === 'development' 
            ? (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234')
            : (process.env.NEXT_PUBLIC_WS_URL || 'wss://ursa-game-server.up.railway.app')
            
          console.log(`🌐 WebSocket URL: ${wsUrl}`)
          console.log(`🏠 Room ID: ${roomId}`)
          
          yjsDoc = new Y.Doc()
          yjsProvider = new WebsocketProvider(wsUrl, roomId, yjsDoc)
          
          console.log(`✅ Y.js document created by room creator`)
          console.log(`✅ WebSocket provider initialized for room setup`)
          
          // Set up connection handlers
          yjsProvider.on('status', (event: { status: string }) => {
            console.log(`🔌 Y.js connection status changed: ${event.status}`)
            if (event.status === 'connected') {
              console.log('✅ Y.js connected - room creation complete')
            } else if (event.status === 'disconnected') {
              console.log('❌ Y.js disconnected during room creation')
            }
          })
          
          console.log(`\n💾 ===== STEP 4: STORING ROOM CONFIG ON Y.JS SERVER =====`)
          
          // Set up Y.js maps and store room configuration
          gameStateMap = yjsDoc.getMap('gameState')
          const roomConfigMap = yjsDoc.getMap('roomConfig')
          
          console.log(`🗂️ Setting up Y.js maps...`)
          
          // Store room configuration in Y.js (this goes to the server)
          const roomConfig = {
            playerCount,
            createdAt: Date.now(),
            createdBy: creatorName,
            playerSlots,
            gameStarted: false
          }
          
          roomConfigMap.set('playerCount', roomConfig.playerCount)
          roomConfigMap.set('createdAt', roomConfig.createdAt)
          roomConfigMap.set('createdBy', roomConfig.createdBy)
          roomConfigMap.set('playerSlots', roomConfig.playerSlots)
          roomConfigMap.set('gameStarted', roomConfig.gameStarted)
          
          console.log(`✅ Room config stored on Y.js server:`)
          console.log(`   👥 Player Count: ${roomConfig.playerCount}`)
          console.log(`   👤 Created By: ${roomConfig.createdBy}`)
          console.log(`   📅 Created At: ${new Date(roomConfig.createdAt).toLocaleTimeString()}`)
          console.log(`   🎮 Game Started: ${roomConfig.gameStarted}`)
          console.log(`   🎪 Player Slots:`, roomConfig.playerSlots)
          
          console.log(`\n🎫 ===== STEP 5: GENERATING INVITE LINKS =====`)
          
          // Generate invite links for each slot
          const inviteLinks: { [playerNumber: number]: { id: string; inviteLink: string } } = {}
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
          
          console.log(`🌐 Base URL: ${baseUrl}`)
          
          for (let playerNumber = 1; playerNumber <= playerCount; playerNumber++) {
            const slot = playerSlots[playerNumber]
            const inviteLink = `${baseUrl}/?room=${roomId}&player=${slot.id}`
            inviteLinks[playerNumber] = {
              id: slot.id,
              inviteLink: inviteLink
            }
            console.log(`✅ Player ${playerNumber} link: ${inviteLink}`)
          }
          
          console.log(`\n🎉 ===== ROOM CREATION COMPLETE =====`)
          console.log(`📝 Room ID: ${roomId}`)
          console.log(`🎫 Total invite links generated: ${Object.keys(inviteLinks).length}`)
          console.log(`📊 Full invite links object:`, inviteLinks)
          
          return inviteLinks
          
        } catch (error) {
          console.error('Failed to create room with slots:', error)
          cleanupConnection()
          throw error
        }
      },

      joinMultiplayerRoom: async (roomId: string, playerName: string, playerId: string) => {
        try {
          console.log(`\n🚪 ===== JOINING MULTIPLAYER ROOM =====`)
          console.log(`🏠 Room ID: ${roomId}`)
          console.log(`👤 Player Name: ${playerName}`)
          console.log(`🆔 Player ID: ${playerId}`)
          console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`)
          
          // Prevent multiple simultaneous connection attempts
          if (isConnecting) {
            console.log('🔌 Connection already in progress, skipping')
            return
          }
          
          // Check if we already have an active connection for this room
          if (isConnectionActive() && get().roomId === roomId) {
            console.log(`🔌 Already connected to room ${roomId}, skipping`)
            return
          }
          
          // Check if already connected to different room
          if (get().isConnected && get().roomId !== roomId) {
            console.log('🔌 Connected to different room, cleaning up first')
            cleanupConnection()
          }
          
          // Set connecting flag
          isConnecting = true
          console.log('🔒 Setting connecting flag')
          
          // Initialize Y.js connection if not already connected to this room
          if (!yjsDoc || !yjsProvider || get().roomId !== roomId) {
            console.log(`\n🔌 ===== CREATING Y.JS CONNECTION =====`)
            console.log(`👤 WHO: Player "${playerName}" (${playerId})`)
            console.log(`🎯 PURPOSE: Joining existing room`)
            
            // Cleanup any existing connections
            cleanupConnection()
            
            // Initialize Y.js with environment-specific WebSocket URL
            const wsUrl = process.env.NODE_ENV === 'development' 
              ? (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234')
              : (process.env.NEXT_PUBLIC_WS_URL || 'wss://ursa-game-server.up.railway.app')
            
            console.log(`🌐 WebSocket URL: ${wsUrl}`)
            console.log(`🏠 Room ID: ${roomId}`)
            
            yjsDoc = new Y.Doc()
            yjsProvider = new WebsocketProvider(wsUrl, roomId, yjsDoc)
            
            // Monitor connection state
            yjsProvider.on('status', (event: { status: string }) => {
              console.log(`🔌 Y.js connection status: ${event.status}`)
              if (event.status === 'connected') {
                isConnecting = false
                console.log('🔓 Clearing connecting flag - connected')
              } else if (event.status === 'disconnected') {
                isConnecting = false
                console.log('🔓 Clearing connecting flag - disconnected')
              }
            })
            
            gameStateMap = yjsDoc.getMap('gameState')
          } else {
            console.log(`\n🔌 ===== REUSING EXISTING Y.JS CONNECTION =====`)
            console.log(`👤 WHO: Player "${playerName}" (${playerId})`)
            console.log(`🎯 PURPOSE: Room creator joining their own room`)
            console.log(`✅ Y.js connection already exists`)
          }
          
          const playersMap = yjsDoc.getMap('players')
          const roomConfigMap = yjsDoc.getMap('roomConfig')

          // Wait a moment for Y.js to sync existing data
          await new Promise(resolve => setTimeout(resolve, 500))

          console.log(`\n🔍 ===== VALIDATING PLAYER ACCESS =====`)
          
          // Get room configuration from Y.js server
          const playerSlots = roomConfigMap.get('playerSlots')
          
          console.log(`📋 Room config from Y.js server:`)
          console.log(`   🎪 Player Slots:`, playerSlots)
          
          // Validate player ID against room slots
          if (playerSlots) {
            console.log(`🔍 Validating player ID "${playerId}" against room slots...`)
            
            // Find which slot this player ID belongs to
            let assignedPlayerNumber: number | null = null
            
            for (const [slotNumber, slotInfo] of Object.entries(playerSlots as { [key: string]: { id: string; reserved: boolean; joinedAt?: number } })) {
              console.log(`   🔍 Checking slot ${slotNumber}: ID="${slotInfo.id}", Reserved=${slotInfo.reserved}`)
              if (slotInfo.id === playerId) {
                assignedPlayerNumber = parseInt(slotNumber)
                console.log(`   ✅ MATCH FOUND! Player ID matches slot ${slotNumber}`)
                break
              } else {
                console.log(`   ❌ No match for slot ${slotNumber}`)
              }
            }
            
            if (assignedPlayerNumber === null) {
              console.log(`❌ VALIDATION FAILED: Player ID "${playerId}" not found in any slot`)
              console.log(`📋 Available slots:`, playerSlots)
              throw new Error(`Invalid player ID - you don't have permission to join this room. Please use the correct invite link.`)
            }
            
            console.log(`✅ VALIDATION SUCCESS: Player ID "${playerId}" validated for slot ${assignedPlayerNumber}`)
          }

          // Check if room is full
          const existingPlayers = playersMap.toJSON()
          console.log('All players in room:', existingPlayers)
          
          const activeExistingPlayers = Object.values(existingPlayers).filter(
            (p: { isActive: boolean; id: string }) => p.isActive && p.id !== playerId
          )
          
          if (activeExistingPlayers.length >= 4) {
            throw new Error('Room is full - maximum 4 players allowed')
          }

          console.log(`\n🎯 ===== ASSIGNING PLAYER NUMBER =====`)
          
          // Determine player number based on validated slot assignment
          let playerNumber = 1
          
          if (playerSlots) {
            console.log(`📋 Using slot-based assignment...`)
            // Use the pre-assigned slot number from validation
            for (const [slotNumber, slotInfo] of Object.entries(playerSlots as { [key: string]: { id: string; reserved: boolean; joinedAt?: number } })) {
              if (slotInfo.id === playerId) {
                playerNumber = parseInt(slotNumber)
                console.log(`✅ SLOT ASSIGNMENT: Player ID "${playerId}" → Player ${playerNumber}`)
                break
              }
            }
          } else {
            console.log(`📋 Using fallback assignment (no slots found)...`)
            // Fallback to old logic for rooms created before slot system
            if (existingPlayers[playerId] && existingPlayers[playerId].isActive) {
              playerNumber = existingPlayers[playerId].playerNumber ?? 1
              console.log(`🔄 RECONNECTION: Player ${playerId} → Player ${playerNumber}`)
            } else {
              // Assign the lowest available player number
              const takenNumbers = activeExistingPlayers.map((p: { playerNumber?: number }) => p.playerNumber ?? 1)
              console.log(`🔍 Taken player numbers:`, takenNumbers)
              
              for (let i = 1; i <= 4; i++) {
                if (!takenNumbers.includes(i)) {
                  playerNumber = i
                  break
                }
              }
              console.log(`🆕 NEW ASSIGNMENT: Player ${playerId} → Player ${playerNumber}`)
            }
          }
          
          console.log(`🎯 FINAL ASSIGNMENT: "${playerName}" (${playerId}) = Player ${playerNumber}`)

          console.log(`\n💾 ===== ADDING PLAYER TO Y.JS ROOM =====`)
          
          // Add this player to the room
          const playerData = {
            id: playerId,
            name: playerName,
            playerNumber,
            joinedAt: Date.now(),
            isActive: true
          }
          
          console.log(`📝 Adding player to Y.js playersMap:`, playerData)
          playersMap.set(playerId, playerData)
          console.log(`✅ Player added to Y.js server successfully`)

          // Set up sync with proper locking to avoid conflicts
          gameStateMap.observe(() => {
            if (isUpdatingFromYjs) return // 🔒 Don't sync while we're updating from Y.js
            
            console.log('[From Yjs] Applying incoming update')
            const yjsState = gameStateMap!.toJSON()
            
            if (Object.keys(yjsState).length > 0) {
              isUpdatingFromYjs = true // 🔒 Lock before set()
              
              try {
                set({
                  players: yjsState.players || get().players,
                  board: yjsState.board || get().board,
                  currentPlayerIndex: yjsState.currentPlayerIndex ?? get().currentPlayerIndex,
                  season: yjsState.season || get().season,
                  year: yjsState.year ?? get().year,
                  turn: yjsState.turn ?? get().turn,
                  gamePhase: yjsState.gamePhase || get().gamePhase,
                  turnPhase: yjsState.turnPhase || get().turnPhase,
                  energyTaxPaid: yjsState.energyTaxPaid ?? get().energyTaxPaid,
                  diceState: yjsState.diceState || get().diceState
                })
              } finally {
                isUpdatingFromYjs = false // 🔓 Always release lock
              }
            }
          })

          // Monitor players joining/leaving
          playersMap.observe(() => {
            const currentPlayers = playersMap.toJSON()
            const activePlayerCount = Object.values(currentPlayers).filter(
              (p: { isActive: boolean }) => p.isActive
            ).length
            
            set({ roomPlayerCount: activePlayerCount })

            // Update isGameStarted flag but don't auto-start the game
            if (activePlayerCount >= 2 && activePlayerCount <= 4) {
              set({ isGameStarted: false }) // Game ready but not started
              console.log(`Room ready with ${activePlayerCount} players - waiting for manual start`)
            } else {
              set({ isGameStarted: false }) // Not enough players
            }
          })

          console.log(`\n🏪 ===== UPDATING LOCAL STATE =====`)
          
          const finalRoomPlayerCount = Object.keys(playersMap.toJSON()).length
          
          const localState = {
            isMultiplayer: true,
            roomId,
            playerName,
            playerId,
            playerNumber,
            isConnected: true,
            roomPlayerCount: finalRoomPlayerCount
          }
          
          console.log(`📝 Setting local state:`, localState)
          
          set(localState)
          
          console.log(`✅ Local state updated successfully`)
          console.log(`\n🎉 ===== JOIN ROOM COMPLETE =====`)
          console.log(`🏠 Room: ${roomId}`)
          console.log(`👤 Player: ${playerName} (${playerId})`)
          console.log(`🔢 Player Number: ${playerNumber}`)
          console.log(`👥 Room Player Count: ${finalRoomPlayerCount}`)
          console.log(`🔗 Connected: ${localState.isConnected}`)
          console.log(`⏰ Completed at: ${new Date().toLocaleTimeString()}`)

        } catch (error) {
          console.error('Failed to start multiplayer game:', error)
          isConnecting = false
          console.log('🔓 Clearing connecting flag - error')
          cleanupConnection()
          set({ 
            isConnected: false,
            isMultiplayer: false,
            roomId: null,
            playerNumber: null,
            playerId: null
          })
          throw error
        }
      },

      disconnectFromRoom: () => {
        const { playerId } = get()
        
        console.log('🔌 Disconnecting from room')
        
        // Mark player as inactive before disconnecting
        if (yjsDoc && playerId) {
          try {
            const playersMap = yjsDoc.getMap('players')
            const existingPlayer = playersMap.get(playerId)
            if (existingPlayer) {
              playersMap.set(playerId, { ...existingPlayer, isActive: false })
            }
          } catch (error) {
            console.warn('Error marking player inactive:', error)
          }
        }

        // Use centralized cleanup
        cleanupConnection()
      },

      startGame: () => {
        const state = get()
        
        if (!state.isMultiplayer || !state.isConnected) {
          console.warn('Cannot start game - not in multiplayer room')
          return
        }
        
        if (state.playerNumber !== 1) {
          console.warn('Only room creator (Player 1) can start the game')
          return
        }
        
        try {
          console.log('🎮 Starting multiplayer game')
          
          // Mark game as started in Y.js
          if (yjsDoc) {
            const roomConfigMap = yjsDoc.getMap('roomConfig')
            roomConfigMap.set('gameStarted', true)
            roomConfigMap.set('startedAt', Date.now())
            
            console.log('🎮 Game started - notifying all players')
          }
          
        } catch (error) {
          console.error('Failed to start game:', error)
        }

        set({
          isMultiplayer: false,
          roomId: null,
          isConnected: false,
          playerName: '',
          playerId: null,
          playerNumber: null,
          roomPlayerCount: 0
        })
      },

      // Engine state updates
      updateFromEngineState: (engineState: CoreGameState) => {
        // Convert engine state back to store format, separating bridges from regular spaces
        const allSpaces = Object.entries(engineState.board.spaces)
        const regularSpaces = allSpaces.filter(([id]) => !id.startsWith('BRIDGE-'))
        const bridgeSpaces = allSpaces.filter(([id]) => id.startsWith('BRIDGE-'))
        
        set({
          board: {
            spaces: Object.fromEntries(
              regularSpaces.map(([id, space]) => [
                id,
                {
                  id: space.id,
                  ring: space.ring,
                  position: space.position,
                  angle: space.angle,
                  quadrant: space.quadrant,
                  subArea: space.subArea,
                  piece: space.piece ? {
                    id: space.piece.id,
                    playerId: space.piece.playerId,
                    spaceId: space.piece.spaceId,
                    type: space.piece.type,
                    health: space.piece.health,
                    resources: space.piece.resources,
                    energy: space.piece.energy,
                    fat: space.piece.fat,
                    emergencyEnergy: space.piece.emergencyEnergy,
                    isHibernating: space.piece.isHibernating
                  } : null,
                  canProduce: space.canProduce,
                  hasHoney: space.hasHoney,
                  adjacentSpaces: space.adjacentSpaces
                }
              ])
            ),
            bridges: Object.fromEntries(
              bridgeSpaces.map(([id, space]) => [
                id,
                {
                  id: space.id,
                  ring: space.ring,
                  position: space.position,
                  angle: space.angle,
                  quadrant: space.quadrant,
                  subArea: space.subArea,
                  piece: space.piece ? {
                    id: space.piece.id,
                    playerId: space.piece.playerId,
                    spaceId: space.piece.spaceId,
                    type: space.piece.type,
                    health: space.piece.health,
                    resources: space.piece.resources,
                    energy: space.piece.energy,
                    fat: space.piece.fat,
                    emergencyEnergy: space.piece.emergencyEnergy,
                    isHibernating: space.piece.isHibernating
                  } : null,
                  canProduce: space.canProduce,
                  hasHoney: space.hasHoney,
                  adjacentSpaces: space.adjacentSpaces
                }
              ])
            ),
            rings: engineState.board.rings,
            rotations: engineState.board.rotations
          },
          players: engineState.players.map(player => ({
            id: player.id,
            name: player.name,
            color: player.color,
            pieces: player.pieces.map(piece => ({
              id: piece.id,
              playerId: piece.playerId,
              spaceId: piece.spaceId,
              type: piece.type,
              health: piece.health,
              resources: piece.resources,
              energy: piece.energy,
              fat: piece.fat,
              emergencyEnergy: piece.emergencyEnergy,
              isHibernating: piece.isHibernating
            })),
            pieceCount: player.pieceCount,
            score: player.score
          })),
          currentPlayerIndex: engineState.currentPlayerIndex,
          season: engineState.season,
          year: engineState.year,
          turn: engineState.turn,
          gamePhase: engineState.gamePhase,
          turnPhase: engineState.turnPhase,
          energyTaxPaid: engineState.energyTaxPaid
        })
        
        // Note: Y.js sync is handled automatically by the store subscription
        // No manual sync needed here to avoid race conditions
      },

      // Board management - delegate to BoardFactory
      updateBoardRotations: (rotations: number[]) => {
        console.log('Updating board with rotations:', rotations)
        const state = get()
        
        // Generate the new board locally first
        const currentPlayers = state.players
        const newBoard = createInitialBoard(rotations)
        
        // Preserve existing player pieces and their positions
        currentPlayers.forEach(player => {
          player.pieces.forEach(piece => {
            const space = newBoard.spaces[piece.spaceId] || newBoard.bridges[piece.spaceId]
            if (space) {
              space.piece = piece
            }
          })
        })
        
        // Update local state immediately
        set({
          board: newBoard,
          players: currentPlayers
        })
        
        // Note: Y.js sync is handled automatically by the store subscription
        // No manual sync needed here to avoid race conditions
      },

      // Dice management
      updateDiceState: (newDiceState: Partial<DiceTrayState>) => {
        const state = get()
        const updatedDiceState = { ...state.diceState, ...newDiceState }
        
        set({ diceState: updatedDiceState })
        
        // Note: Y.js sync is handled automatically by the store subscription
        // No manual sync needed here to avoid race conditions
      },

      // Utility functions
      calculateScore: (playerId: string | number) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)
        if (!player) return 0

        // Calculate score based on territories and pieces
        const territories = get().getPlayerTerritories(playerId)
        const pieceScore = player.pieces.length * 10
        const territoryScore = territories.length * 5

        return pieceScore + territoryScore
      },

      getPlayerTerritories: (playerId: string | number) => {
        const state = get()
        const allSpaces = [...Object.values(state.board.spaces), ...Object.values(state.board.bridges)]
        return allSpaces
          .filter(space => space.piece?.playerId === playerId)
          .map(space => space.id)
      },

      areSpacesAdjacent: (spaceId1: string, spaceId2: string) => {
        const state = get()
        const allSpaces = { ...state.board.spaces, ...state.board.bridges }
        const space1 = allSpaces[spaceId1]
        return space1?.adjacentSpaces.includes(spaceId2) || false
      },

      resetGame: () => {
        // Disconnect from multiplayer if connected
        if (get().isConnected) {
          get().disconnectFromRoom()
        }
        
        set({
          board: createInitialBoard(),
          players: createInitialPlayers(1),
          currentPlayerIndex: 0,
          season: 'Spring',
          year: 1,
          turn: 1,
          gamePhase: 'setup',
          turnPhase: 'movement',
          energyTaxPaid: false,
          diceState: {
            positionRolls: null,
            directionRolls: null,
            rotations: [],
            isRolling: false
          }
        })
        
        // Clear URL parameters
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname)
        }
      },

      syncWithYjs: () => {
        if (!gameStateMap) return

        try {
          const state = get()
          
          // Get the full game state from Y.js
          const yjsGameState = {
            currentPlayerIndex: gameStateMap.get('currentPlayerIndex'),
            season: gameStateMap.get('season'),
            year: gameStateMap.get('year'),
            turn: gameStateMap.get('turn'),
            gamePhase: gameStateMap.get('gamePhase'),
            turnPhase: gameStateMap.get('turnPhase'),
            energyTaxPaid: gameStateMap.get('energyTaxPaid'),
            players: gameStateMap.get('players'),
            board: gameStateMap.get('board'),
            boardRotations: gameStateMap.get('boardRotations'),
            diceState: gameStateMap.get('diceState')
          }

          // Handle dice state changes specifically
          if (yjsGameState.diceState && typeof yjsGameState.diceState === 'object') {
            const currentDiceState = state.diceState
            const newDiceState = yjsGameState.diceState
            
            if (JSON.stringify(currentDiceState) !== JSON.stringify(newDiceState)) {
              console.log('Applying dice state update from Y.js:', newDiceState)
              set({ diceState: newDiceState as DiceTrayState })
            }
          }

          // Handle board rotation changes specifically
          if (yjsGameState.boardRotations && Array.isArray(yjsGameState.boardRotations)) {
            const currentRotations = state.board.rotations
            const newRotations = yjsGameState.boardRotations
            
            if (JSON.stringify(currentRotations) !== JSON.stringify(newRotations)) {
              console.log('Applying board rotation update from Y.js:', newRotations)
              
              // Create new board with updated rotations
              const newBoard = createInitialBoard(newRotations)
              
              // Preserve existing player pieces and their positions
              state.players.forEach(player => {
                player.pieces.forEach(piece => {
                  const space = newBoard.spaces[piece.spaceId] || newBoard.bridges[piece.spaceId]
                  if (space) {
                    space.piece = piece
                  }
                })
              })
              
              set({ board: newBoard })
              return // Exit early to avoid double updates
            }
          }

          // Only apply Y.js state if we have valid data and it's different
          if (yjsGameState.gamePhase && yjsGameState.players && yjsGameState.board) {
            const hasChanges = 
              yjsGameState.gamePhase !== state.gamePhase ||
              yjsGameState.currentPlayerIndex !== state.currentPlayerIndex ||
              JSON.stringify(yjsGameState.players) !== JSON.stringify(state.players) ||
              JSON.stringify(yjsGameState.board) !== JSON.stringify(state.board)

            if (hasChanges) {
              console.log('Applying Y.js game state update:', yjsGameState)
              
              // Don't reset to setup if we're already playing
              const newGamePhase = yjsGameState.gamePhase === 'setup' && state.gamePhase === 'playing' 
                ? state.gamePhase 
                : yjsGameState.gamePhase
              
              // Type check and safely apply Y.js values
              const updateData: Partial<CleanGameState> = {
                // Keep local multiplayer state
                isMultiplayer: state.isMultiplayer,
                roomId: state.roomId,
                isConnected: state.isConnected,
                playerName: state.playerName,
                playerId: state.playerId,
                playerNumber: state.playerNumber,
                roomPlayerCount: state.roomPlayerCount,
                maxRoomPlayers: state.maxRoomPlayers
              }
              
              if (typeof yjsGameState.currentPlayerIndex === 'number') {
                updateData.currentPlayerIndex = yjsGameState.currentPlayerIndex
              }
              if (typeof yjsGameState.season === 'string') {
                updateData.season = yjsGameState.season as 'Spring' | 'Summer' | 'Autumn' | 'Winter'
              }
              if (typeof yjsGameState.year === 'number') {
                updateData.year = yjsGameState.year
              }
              if (typeof yjsGameState.turn === 'number') {
                updateData.turn = yjsGameState.turn
              }
              if (typeof newGamePhase === 'string') {
                updateData.gamePhase = newGamePhase as 'setup' | 'playing' | 'ended'
              }
              if (typeof yjsGameState.turnPhase === 'string') {
                updateData.turnPhase = yjsGameState.turnPhase as 'movement' | 'harvest' | 'eat' | 'hibernation'
              }
              if (typeof yjsGameState.energyTaxPaid === 'boolean') {
                updateData.energyTaxPaid = yjsGameState.energyTaxPaid
              }
              if (Array.isArray(yjsGameState.players)) {
                updateData.players = yjsGameState.players
              }
              if (yjsGameState.board && typeof yjsGameState.board === 'object') {
                updateData.board = yjsGameState.board as Board
              }
              if (yjsGameState.diceState && typeof yjsGameState.diceState === 'object') {
                updateData.diceState = yjsGameState.diceState as DiceTrayState
              }
              
              set(updateData)
            }
          }
        } catch (error) {
          console.warn('Y.js sync error:', error)
        }
      },

      // Room management actions
      addCreatedRoom: (roomId: string, roomName: string) => {
        const state = get()
        const newRoom: CreatedRoom = {
          id: roomId,
          name: roomName,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        }
        
        const updatedRooms = [newRoom, ...state.createdRooms.filter(r => r.id !== roomId)]
        set({ createdRooms: updatedRooms })
        saveCreatedRoomsToStorage(updatedRooms)
      },

      removeCreatedRoom: (roomId: string) => {
        const state = get()
        const updatedRooms = state.createdRooms.filter(r => r.id !== roomId)
        set({ createdRooms: updatedRooms })
        saveCreatedRoomsToStorage(updatedRooms)
      },

      updateRoomLastUsed: (roomId: string) => {
        const state = get()
        const updatedRooms = state.createdRooms.map(room => 
          room.id === roomId 
            ? { ...room, lastUsed: new Date().toISOString() }
            : room
        )
        set({ createdRooms: updatedRooms })
        saveCreatedRoomsToStorage(updatedRooms)
      },

      loadCreatedRooms: () => {
        if (typeof window === 'undefined') return
        try {
          const stored = localStorage.getItem(CREATED_ROOMS_KEY)
          const rooms = stored ? JSON.parse(stored) : []
          set({ createdRooms: rooms })
        } catch (error) {
          console.warn('Failed to load created rooms:', error)
        }
      },

      // Room validation
      isValidPlayerInRoom: () => {
        const state = get()
        return !!(
          state.isMultiplayer && 
          state.isConnected && 
          state.roomId && 
          state.playerId && 
          state.playerNumber &&
          state.playerName
        )
      },

      // Game start control
      startGameInRoom: () => {
        const state = get()
        if (!state.isMultiplayer || !state.isConnected || state.roomPlayerCount < 2) {
          console.log('Cannot start game - not enough players')
          return
        }

        // Only Player 1 should initialize the game to avoid conflicts
        if (state.playerNumber === 1) {
          console.log('Starting multiplayer game as Player 1')
          
          // Get current players from Y.js
          if (yjsDoc) {
            const playersMap = yjsDoc.getMap('players')
            const currentPlayers = playersMap.toJSON()
            
            // Create multiplayer player data from Y.js
            const multiplayerPlayers: { [playerId: string]: { name: string; playerNumber: number } } = {}
            Object.entries(currentPlayers).forEach(([id, player]: [string, { isActive: boolean; name: string; playerNumber: number }]) => {
              if (player.isActive) {
                multiplayerPlayers[id] = {
                  name: player.name,
                  playerNumber: player.playerNumber
                }
              }
            })
            
            get().initializeMultiplayerGame(multiplayerPlayers)
            set({ isGameStarted: true })
          }
        } else {
          console.log('Only Player 1 can start the game')
        }
      }
    }),
    {
      name: 'game-store',
      // Only store core game state, not UI state
      partialize: (state: CleanGameState) => ({
        board: state.board,
        players: state.players,
        currentPlayerIndex: state.currentPlayerIndex,
        season: state.season,
        year: state.year,
        turn: state.turn,
        gamePhase: state.gamePhase,
        turnPhase: state.turnPhase,
        energyTaxPaid: state.energyTaxPaid,
        diceState: state.diceState
      })
    }
  )
)

// Subscribe to store changes to sync with Yjs (only when in multiplayer mode)
useGameStore.subscribe((state) => {
  if (state.isMultiplayer && gameStateMap) {
    syncToYjs(state)
  }
})

// Debug: Log game state every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useGameStore.getState()
    console.log('🎮 GAME STATE DEBUG:', {
      gamePhase: state.gamePhase,
      isMultiplayer: state.isMultiplayer,
      isConnected: state.isConnected,
      isGameStarted: state.isGameStarted,
      roomId: state.roomId,
      roomPlayerCount: state.roomPlayerCount,
      playerNumber: state.playerNumber,
      playerName: state.playerName,
      playerId: state.playerId
    })
  }, 30000) // Every 30 seconds
}

// Export for global access (for debugging and action creators)
if (typeof window !== 'undefined') {
  (window as { __gameStore?: ReturnType<typeof useGameStore.getState> }).__gameStore = useGameStore.getState()
}