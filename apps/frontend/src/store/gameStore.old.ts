/**
 * Game Store - Refactored to use Game Engine
 * 
 * This store now focuses ONLY on game state management and delegates
 * all game logic to the GameEngine. UI state has been moved to uiStore.ts
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
// import { GameEngine } from '../engine/GameEngine'
import type { CoreGameState } from '../engine/types'
// import { GAME_CONFIG } from '../engine/GameConfig'

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
  bridges: { [bridgeId: string]: GameSpace } // Bridge spaces in center
  rotations?: number[] // Current rotation offset for each ring
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

  // Game actions - now use engine
  initializeGame: () => void
  startMultiplayerGame: (roomId: string, playerName: string) => Promise<void>
  disconnectFromRoom: () => void
  
  // Engine-powered actions
  updateFromEngineState: (engineState: CoreGameState) => void
  
  // Utility functions
  calculateScore: (playerId: string | number) => number
  getPlayerTerritories: (playerId: string | number) => string[]
  areSpacesAdjacent: (spaceId1: string, spaceId2: string) => boolean
  resetGame: () => void
  updateBoardRotations: (rotations: number[]) => void
  
  // Multiplayer sync actions
  syncWithYjs: () => void
}

// Game engine instance (currently unused but reserved for future engine integration)
// const gameEngine = new GameEngine(GAME_CONFIG)

// Y.js integration
let yjsDoc: Y.Doc | null = null
let yjsProvider: WebsocketProvider | null = null
let gameStateMap: Y.Map<unknown> | null = null

// Helper functions for board creation
function getMountainSubArea(ring: number): 'Caves' | 'Hunting Grounds' {
  return ring <= 2 ? 'Caves' : 'Hunting Grounds'
}

/**
 * Generate ring rotations using dice rolls
 * Roll 1: 5 dice for position (1-6) for each ring
 * Roll 2: 5 dice for direction (1-3 = negative, 4-6 = positive)
 * Mountain/Pastures line is at position 0
 */
function generateDiceBasedRotations(): number[] {
  // Import dice function locally to avoid circular dependencies
  const rollD6 = () => Math.floor(Math.random() * 6) + 1
  
  // Roll 1: Position dice (1-6)
  const positionRolls = Array(5).fill(0).map(() => rollD6())
  
  // Roll 2: Direction dice (1-3 = negative, 4-6 = positive)
  const directionRolls = Array(5).fill(0).map(() => rollD6())
  
  // Convert to rotations
  const rotations = positionRolls.map((position, index) => {
    const direction = directionRolls[index]
    const isPositive = direction >= 4 // 4,5,6 = positive (clockwise)
    
    // Apply direction to position
    return isPositive ? position : -position
  })
  
  console.log('Dice-based ring rotations:')
  console.log('Position rolls:', positionRolls)
  console.log('Direction rolls:', directionRolls)
  console.log('Final rotations:', rotations)
  
  return rotations
}

/**
 * Generate rotations from specific dice rolls (for testing/demonstration)
 * Example: positionRolls=[1,1,1,1,1], directionRolls=[4,5,4,5,6] = [1,1,1,1,1] (basic setup)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateRotationsFromDice(positionRolls: number[], directionRolls: number[]): number[] {
  if (positionRolls.length !== 5 || directionRolls.length !== 5) {
    throw new Error('Must provide exactly 5 dice for each roll')
  }
  
  const rotations = positionRolls.map((position, index) => {
    const direction = directionRolls[index]
    const isPositive = direction >= 4 // 4,5,6 = positive (clockwise)
    
    return isPositive ? position : -position
  })
  
  console.log('Custom dice rotations:')
  console.log('Position rolls:', positionRolls)
  console.log('Direction rolls:', directionRolls)
  console.log('Final rotations:', rotations)
  
  return rotations
}

// Ring rotation offsets (in positions) - simulates physical ring rotation
// Each ring can be rotated independently to create different board configurations
function getRingRotations(config?: number[], useDiceRolls?: boolean): number[] {
  // If a specific configuration is provided, use it
  if (config && config.length === 5) {
    return config
  }
  
  // Use dice-based ring rotation system
  if (useDiceRolls) {
    return generateDiceBasedRotations()
  }
  
  // Calculate rotations to align leftmost mountain spaces in a straight line
  // Each ring has different space counts: 20, 24, 28, 32, 36
  // Mountains are the 2nd biome, so they start at position (spacesPerBiome + 1)
  // Ring 1: Mountains start at position 6 (out of 20)
  // Ring 2: Mountains start at position 7 (out of 24) 
  // Ring 3: Mountains start at position 8 (out of 28)
  // Ring 4: Mountains start at position 9 (out of 32)
  // Ring 5: Mountains start at position 10 (out of 36)
  
  // To align them, we need each ring's leftmost mountain to point to the same angle
  // Calculate the angular position of Ring 1's leftmost mountain as reference
  const ring1SpacesPerBiome = 20 / 4 // 5
  const ring1MountainStart = ring1SpacesPerBiome + 1 // Position 6
  const ring1Angle = ((ring1MountainStart - 0.5) / 20) * 2 * Math.PI + (3 * Math.PI / 4)
  
  // Calculate rotations needed for other rings to match this angle
  const ringConfigs = [20, 24, 28, 32, 36]
  const rotations = ringConfigs.map((spaceCount) => {
    const spacesPerBiome = spaceCount / 4
    const mountainStart = spacesPerBiome + 1
    const baseAngle = ((mountainStart - 0.5) / spaceCount) * 2 * Math.PI + (3 * Math.PI / 4)
    
    // Calculate how many positions to rotate to match ring1Angle
    const angleDiff = ring1Angle - baseAngle
    const positionsToRotate = Math.round((angleDiff / (2 * Math.PI)) * spaceCount)
    
    return positionsToRotate
  })
  
  return rotations
  
  // Other preset configurations:
  // return [2, 0, -1, -3, 1]  // Previous test layout
  // return [0, 0, 0, 0, 0]    // All rings aligned
}

function createInitialBoard(customRotations?: number[]): Board {
  // Use space counts divisible by 4 for perfect quadrant alignment
  const ringConfigs = [
    { ring: 1, spaceCount: 20, radius: 120 },  // 5 spaces per quadrant
    { ring: 2, spaceCount: 24, radius: 180 },  // 6 spaces per quadrant
    { ring: 3, spaceCount: 28, radius: 240 },  // 7 spaces per quadrant
    { ring: 4, spaceCount: 32, radius: 300 },  // 8 spaces per quadrant
    { ring: 5, spaceCount: 36, radius: 360 }   // 9 spaces per quadrant
  ]

  const spaces: { [spaceId: string]: GameSpace } = {}
  const rings: Board['rings'] = {}

  // Get ring rotations - use custom rotations if provided, otherwise use standard [0, 0, 0, 0, 0]
  const rotations = getRingRotations(customRotations || [0, 0, 0, 0, 0])

  // Create all spaces first - each ring has exactly 25% of each biome
  ringConfigs.forEach(({ ring, spaceCount, radius }) => {
    rings[ring] = { spaceCount, radius }
    
    // Calculate how many spaces per biome (exactly 25% each)
    const spacesPerBiome = spaceCount / 4
    // Order biomes so that with 0 rotation and 135° board offset, Mountains appear at top
    // The board is rotated 135° (3π/4), so we need to offset our biome order
    const biomes: GameSpace['quadrant'][] = ['Pastures', 'Mountains', 'Riverlands', 'Forests']
    
    for (let position = 1; position <= spaceCount; position++) {
      // Calculate angle for this position (FIXED - does not change with rotation)
      const angle = ((position - 0.5) / spaceCount) * 2 * Math.PI + 3*Math.PI/4
      
      // Apply ring rotation to determine biome (rotation affects biome assignment, not physical position)
      const rotation = rotations[ring - 1]
      const rotatedBiomePosition = ((position - 1 - rotation + spaceCount) % spaceCount) + 1
      const biomeIndex = Math.floor((rotatedBiomePosition - 1) / spacesPerBiome)
      const baseQuadrant = biomes[biomeIndex]
      
      const spaceId = `R${ring}-${position}`
      
      spaces[spaceId] = {
        id: spaceId,
        ring,
        position,
        angle,
        quadrant: baseQuadrant,
        subArea: baseQuadrant === 'Mountains' ? getMountainSubArea(ring) : undefined,
        piece: null,
        canProduce: baseQuadrant !== 'Mountains',
        adjacentSpaces: [] // Will be calculated below
      }
    }
  })

  // Calculate adjacencies using angular overlap for proper connections
  Object.values(spaces).forEach(space => {
    const adjacentSpaces: string[] = []
    
    // Same ring adjacencies (left and right neighbors)
    const ringData = rings[space.ring as keyof typeof rings]
    const prevPosition = space.position === 1 ? ringData.spaceCount : space.position - 1
    const nextPosition = space.position === ringData.spaceCount ? 1 : space.position + 1
    
    adjacentSpaces.push(`R${space.ring}-${prevPosition}`)
    adjacentSpaces.push(`R${space.ring}-${nextPosition}`)
    
    // Calculate this space's angular span
    const anglePerSpace = (2 * Math.PI) / ringData.spaceCount
    const spaceStartAngle = space.angle - anglePerSpace / 2
    const spaceEndAngle = space.angle + anglePerSpace / 2
    
    // Inner ring adjacencies (angular overlap)
    if (space.ring > 1) {
      const innerRing = space.ring - 1
      const innerRingData = rings[innerRing as keyof typeof rings]
      const innerAnglePerSpace = (2 * Math.PI) / innerRingData.spaceCount
      
      // Find all inner ring spaces that overlap with this space's angular span
      Object.values(spaces).forEach(otherSpace => {
        if (otherSpace.ring === innerRing) {
          const otherStartAngle = otherSpace.angle - innerAnglePerSpace / 2
          const otherEndAngle = otherSpace.angle + innerAnglePerSpace / 2
          
          // Check for angular overlap (considering wrap-around at 2π)
          if (anglesOverlap(spaceStartAngle, spaceEndAngle, otherStartAngle, otherEndAngle)) {
            adjacentSpaces.push(otherSpace.id)
          }
        }
      })
    }
    
    // Outer ring adjacencies (angular overlap)
    if (space.ring < 5) {
      const outerRing = space.ring + 1
      const outerRingData = rings[outerRing as keyof typeof rings]
      const outerAnglePerSpace = (2 * Math.PI) / outerRingData.spaceCount
      
      // Find all outer ring spaces that overlap with this space's angular span
      Object.values(spaces).forEach(otherSpace => {
        if (otherSpace.ring === outerRing) {
          const otherStartAngle = otherSpace.angle - outerAnglePerSpace / 2
          const otherEndAngle = otherSpace.angle + outerAnglePerSpace / 2
          
          // Check for angular overlap (considering wrap-around at 2π)
          if (anglesOverlap(spaceStartAngle, spaceEndAngle, otherStartAngle, otherEndAngle)) {
            adjacentSpaces.push(otherSpace.id)
          }
        }
      })
    }
    
    space.adjacentSpaces = adjacentSpaces.filter(id => spaces[id])
  })
  
  // Helper function to check if two angular spans overlap
  function anglesOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    // Normalize angles to 0-2π range
    const normalize = (angle: number) => ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const s1 = normalize(start1)
    const e1 = normalize(end1)
    const s2 = normalize(start2)
    const e2 = normalize(end2)
    
    // Handle wrap-around case
    if (s1 > e1) {
      return (s2 <= e1 || s2 >= s1) || (e2 <= e1 || e2 >= s1) || (s2 <= s1 && e2 >= e1)
    }
    if (s2 > e2) {
      return (s1 <= e2 || s1 >= s2) || (e1 <= e2 || e1 >= s2) || (s1 <= s2 && e1 >= e2)
    }
    
    // Normal case (no wrap-around)
    return !(e1 < s2 || e2 < s1)
  }

  // Add honey to 5 random forest spaces
  const forestSpaces = Object.values(spaces).filter(s => s.quadrant === 'Forests')
  const honeySpaces = forestSpaces.sort(() => Math.random() - 0.5).slice(0, 5)
  honeySpaces.forEach(space => {
    space.hasHoney = true
  })

  // Create bridge spaces (center cross)
  const bridges: { [bridgeId: string]: GameSpace } = {}
  
  // Center bridge space - tunnel only connects East-West
  bridges['BRIDGE-CENTER'] = {
    id: 'BRIDGE-CENTER',
    ring: 0,
    position: 0,
    angle: 0, // Not used for center
    quadrant: 'Bridge',
    subArea: 'Center',
    piece: null,
    canProduce: false,
    hasHoney: false,
    adjacentSpaces: ['BRIDGE-EAST', 'BRIDGE-WEST'] // Only East-West tunnel
  }
  
  // Bridge arms (North, East, South, West)
  const bridgeArms = [
    { id: 'BRIDGE-NORTH', subArea: 'North', angle: -Math.PI / 2 }, // Top
    { id: 'BRIDGE-EAST', subArea: 'East', angle: 0 },              // Right
    { id: 'BRIDGE-SOUTH', subArea: 'South', angle: Math.PI / 2 },  // Bottom  
    { id: 'BRIDGE-WEST', subArea: 'West', angle: Math.PI }         // Left
  ]
  
  bridgeArms.forEach((arm, index) => {
    // Set up bridge connections based on type
    const adjacentSpaces: string[] = []
    
    if (arm.subArea === 'North') {
      adjacentSpaces.push('BRIDGE-SOUTH') // North connects directly to South (overland)
    } else if (arm.subArea === 'South') {
      adjacentSpaces.push('BRIDGE-NORTH') // South connects directly to North (overland)
    } else if (arm.subArea === 'East') {
      adjacentSpaces.push('BRIDGE-CENTER') // East connects to tunnel
    } else if (arm.subArea === 'West') {
      adjacentSpaces.push('BRIDGE-CENTER') // West connects to tunnel
    }
    
    bridges[arm.id] = {
      id: arm.id,
      ring: 0,
      position: index + 1,
      angle: arm.angle,
      quadrant: 'Bridge',
      subArea: arm.subArea as 'North' | 'East' | 'South' | 'West',
      piece: null,
      canProduce: false,
      hasHoney: false,
      adjacentSpaces // Will add ring connections below
    }
  })
  
  // Connect bridge arms to innermost ring spaces
  const ring1Spaces = Object.values(spaces).filter(s => s.ring === 1)
  bridgeArms.forEach(arm => {
    // Find the closest ring 1 spaces to each bridge arm
    const armSpace = bridges[arm.id]
    const closestSpaces = ring1Spaces
      .map(space => ({
        space,
        distance: Math.abs(space.angle - arm.angle)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2) // Connect to 2 closest spaces
    
    closestSpaces.forEach(({ space }) => {
      armSpace.adjacentSpaces.push(space.id)
      space.adjacentSpaces.push(arm.id)
    })
  })

  return { spaces, rings, bridges, rotations }
}

function createInitialPlayers(): Player[] {
  return [
    {
      id: 1,
      name: 'Player 1',
      color: '#8B4513',
      pieces: [],
      pieceCount: { bears: 0, cubs: 0, maxBears: 3, maxCubs: 6 },
      score: 0
    },
    {
      id: 2,
      name: 'Player 2',
      color: '#2F4F4F',
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
            rings: engineState.board.rings
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
        return Object.values(state.board.spaces)
          .filter(space => space.piece?.playerId === playerId)
          .map(space => space.id)
      },

      areSpacesAdjacent: (spaceId1: string, spaceId2: string) => {
        const state = get()
        const space1 = state.board.spaces[spaceId1]
        return space1?.adjacentSpaces.includes(spaceId2) || false
      },

      resetGame: () => {
        get().initializeGame()
      },

      updateBoardRotations: (rotations: number[]) => {
        console.log('Updating board with rotations:', rotations)
        set({
          board: createInitialBoard(rotations),
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