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
import type { CoreGameState, QuadrantType } from '../engine/types'

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

  // Multiplayer state
  isMultiplayer: boolean
  roomId: string | null
  isConnected: boolean
  playerName: string

  // Game actions - delegate to engine
  initializeGame: () => void
  startMultiplayerGame: (roomId: string, playerName: string) => Promise<void>
  disconnectFromRoom: () => void
  
  // Engine-powered actions
  updateFromEngineState: (engineState: CoreGameState) => void
  
  // Board management - delegate to BoardFactory
  updateBoardRotations: (rotations: number[]) => void
  
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
function createInitialPlayers(): Player[] {
  return [
    {
      id: 1,
      name: 'Player 1',
      color: '#8B4513',
      pieces: [],
      pieceCount: { bears: 0, cubs: 0, maxBears: 3, maxCubs: 6 },
      score: 0
    }
  ]
}

export const useGameStore = create<CleanGameState>()(
  devtools(
    (set, get) => ({
      // Initial state
      board: createInitialBoard(),
      players: createInitialPlayers(),
      currentPlayerIndex: 0,
      season: 'Spring',
      year: 1,
      turn: 1,
      gamePhase: 'setup',
      turnPhase: 'movement',
      energyTaxPaid: false,

      // Multiplayer state
      isMultiplayer: false,
      roomId: null,
      isConnected: false,
      playerName: '',

      // Game initialization
      initializeGame: () => {
        set({
          board: createInitialBoard(),
          players: createInitialPlayers(),
          currentPlayerIndex: 0,
          season: 'Spring',
          year: 1,
          turn: 1,
          gamePhase: 'playing',
          turnPhase: 'movement',
          energyTaxPaid: false
        })
      },

      // Multiplayer setup
      startMultiplayerGame: async (roomId: string, playerName: string) => {
        try {
          // Initialize Y.js
          yjsDoc = new Y.Doc()
          yjsProvider = new WebsocketProvider('ws://localhost:1234', roomId, yjsDoc)
          gameStateMap = yjsDoc.getMap('gameState')

          // Set up sync
          gameStateMap.observe(() => {
            get().syncWithYjs()
          })

          set({
            isMultiplayer: true,
            roomId,
            playerName,
            isConnected: true
          })

          // Initialize game in multiplayer
          get().initializeGame()
        } catch (error) {
          console.error('Failed to start multiplayer game:', error)
          set({ isConnected: false })
        }
      },

      disconnectFromRoom: () => {
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
          playerName: ''
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
      },

      // Board management - delegate to BoardFactory
      updateBoardRotations: (rotations: number[]) => {
        console.log('Updating board with rotations:', rotations)
        const newBoard = createInitialBoard(rotations)
        const newPlayers = createInitialPlayers()
        
        // Randomly place each player's starting bear
        const availableSpaces = Object.values(newBoard.spaces).filter(space => 
          space.ring >= 2 && space.ring <= 4 && space.canProduce
        )
        
        if (availableSpaces.length >= newPlayers.length) {
          // Shuffle available spaces to get random placement
          const shuffledSpaces = [...availableSpaces].sort(() => Math.random() - 0.5)
          
          newPlayers.forEach((player, playerIndex) => {
            if (playerIndex < shuffledSpaces.length) {
              const selectedSpace = shuffledSpaces[playerIndex]
              
              // Create starting bear for this player
              const startingBear: GamePiece = {
                id: `bear-${player.id}-1`,
                playerId: player.id,
                spaceId: selectedSpace.id,
                type: 'bear',
                health: 10,
                resources: {
                  grains: 0,
                  berries: 0,
                  salmon: 0,
                  honey: 0,
                  bearMeat: 0
                },
                energy: 5,
                fat: 0,
                emergencyEnergy: 0,
                isHibernating: false
              }
              
              // Add bear to player's piece list
              player.pieces.push(startingBear)
              player.pieceCount.bears = 1
              
              // Place bear on the selected space in the board
              newBoard.spaces[selectedSpace.id].piece = startingBear
            }
          })
        }
        
        set({
          board: newBoard,
          players: newPlayers,
          currentPlayerIndex: 0,
          season: 'Spring',
          year: 1,
          turn: 1,
          gamePhase: 'playing',
          turnPhase: 'movement',
          energyTaxPaid: false
        })
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
        get().initializeGame()
      },

      syncWithYjs: () => {
        if (!gameStateMap) return

        const state = get()
        const syncableState = {
          board: state.board,
          players: state.players,
          currentPlayerIndex: state.currentPlayerIndex,
          season: state.season,
          year: state.year,
          turn: state.turn,
          gamePhase: state.gamePhase,
          turnPhase: state.turnPhase,
          energyTaxPaid: state.energyTaxPaid
        }

        // Update from Y.js if different
        const yjsState = gameStateMap.toJSON()
        if (JSON.stringify(yjsState) !== JSON.stringify(syncableState)) {
          if (Object.keys(yjsState).length > 0) {
            // Apply Y.js state to local state
            set(yjsState as Partial<CleanGameState>)
          } else {
            // Push local state to Y.js
            Object.entries(syncableState).forEach(([key, value]) => {
              gameStateMap!.set(key, value)
            })
          }
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
        energyTaxPaid: state.energyTaxPaid
      })
    }
  )
)

// Export for global access (for debugging and action creators)
if (typeof window !== 'undefined') {
  (window as { __gameStore?: ReturnType<typeof useGameStore.getState> }).__gameStore = useGameStore.getState()
}