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

  // Game actions - delegate to engine
  initializeGame: () => void
  initializeGameWithPlayerCount: (playerCount: number) => void
  initializeMultiplayerGame: (multiplayerPlayers: { [playerId: string]: { name: string; playerNumber: number } }) => void
  startMultiplayerGame: (roomId: string, playerName: string, playerId: string) => Promise<void>
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
}

// Y.js integration
let yjsDoc: Y.Doc | null = null
let yjsProvider: WebsocketProvider | null = null
let gameStateMap: Y.Map<unknown> | null = null
let isUpdatingFromYjs = false // 🔒 Lock to prevent race conditions
let syncTimeout: NodeJS.Timeout

// Create a singleton game engine instance for setup operations
const gameEngine = new GameEngine()

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
      startMultiplayerGame: async (roomId: string, playerName: string, playerId: string) => {
        try {
          // Initialize Y.js with environment-specific WebSocket URL
          yjsDoc = new Y.Doc()
          const wsUrl = process.env.NEXT_PUBLIC_YJS_SERVER || 'ws://localhost:1234'
          
          console.log(`🔌 Connecting to WebSocket: ${wsUrl}`)
          yjsProvider = new WebsocketProvider(wsUrl, roomId, yjsDoc)
          gameStateMap = yjsDoc.getMap('gameState')
          const playersMap = yjsDoc.getMap('players')

          // Wait a moment for Y.js to sync existing data
          await new Promise(resolve => setTimeout(resolve, 500))

          // Check if room is full
          const existingPlayers = playersMap.toJSON()
          console.log('All players in room:', existingPlayers)
          
          const activeExistingPlayers = Object.values(existingPlayers).filter(
            (p: { isActive: boolean; id: string }) => p.isActive && p.id !== playerId
          )
          
          if (activeExistingPlayers.length >= 4) {
            throw new Error('Room is full - maximum 4 players allowed')
          }

          // Determine player number based on existing players
          let playerNumber = 1
          
          // If this player is reconnecting, keep their number
          if (existingPlayers[playerId] && existingPlayers[playerId].isActive) {
            playerNumber = existingPlayers[playerId].playerNumber || 1
            console.log(`Player ${playerId} reconnecting as Player ${playerNumber}`)
          } else {
            // Assign the lowest available player number
            const takenNumbers = activeExistingPlayers.map((p: { playerNumber?: number }) => p.playerNumber || 1)
            console.log('Taken player numbers:', takenNumbers)
            
            for (let i = 1; i <= 4; i++) {
              if (!takenNumbers.includes(i)) {
                playerNumber = i
                break
              }
            }
            console.log(`Assigning new player ${playerId} as Player ${playerNumber}`)
          }

          // Add this player to the room
          playersMap.set(playerId, {
            id: playerId,
            name: playerName,
            playerNumber,
            joinedAt: Date.now(),
            isActive: true
          })

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

            // Start game when 2-4 players are connected, but only let Player 1 initialize
            if (activePlayerCount >= 2 && activePlayerCount <= 4 && get().gamePhase === 'setup') {
              console.log(`Starting multiplayer game with ${activePlayerCount} players`)
              console.log('Current players in room:', currentPlayers)
              console.log('My player info:', { playerId: get().playerId, playerNumber: get().playerNumber })
              
              // Only Player 1 should initialize the game to avoid conflicts
              if (get().playerNumber === 1) {
                console.log('I am Player 1, initializing the game')
                
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
              } else {
                console.log('I am Player 2, waiting for Player 1 to initialize')
              }
            }
          })

          set({
            isMultiplayer: true,
            roomId,
            playerName,
            playerId,
            playerNumber,
            isConnected: true,
            roomPlayerCount: Object.keys(playersMap.toJSON()).length
          })

        } catch (error) {
          console.error('Failed to start multiplayer game:', error)
          set({ isConnected: false })
          throw error
        }
      },

      disconnectFromRoom: () => {
        const { playerId } = get()
        
        // Mark player as inactive before disconnecting
        if (yjsDoc && playerId) {
          const playersMap = yjsDoc.getMap('players')
          const existingPlayer = playersMap.get(playerId)
          if (existingPlayer) {
            playersMap.set(playerId, { ...existingPlayer, isActive: false })
          }
        }

        if (yjsProvider) {
          yjsProvider.destroy()
          yjsProvider = null
        }
        if (yjsDoc) {
          yjsDoc.destroy()
          yjsDoc = null
        }
        gameStateMap = null

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

// Export for global access (for debugging and action creators)
if (typeof window !== 'undefined') {
  (window as { __gameStore?: ReturnType<typeof useGameStore.getState> }).__gameStore = useGameStore.getState()
}