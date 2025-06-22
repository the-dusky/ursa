/**
 * Game State Factory
 * Creates initial game states for simulations
 * 
 * This replicates the game initialization logic without UI dependencies
 */

import { GameSpace, Board, Player } from '@/store/gameStore'

// Simplified game state for simulation (data only, no methods)
export interface SimulationGameState {
  board: Board
  players: Player[]
  currentPlayerIndex: number
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter'
  year: number
  turn: number
  gamePhase: 'setup' | 'playing' | 'ended'
  turnPhase: 'movement' | 'harvest' | 'eat' | 'hibernation'
  
  // UI state (not used in simulation)
  selectedSpaceId: string | null
  selectedPieceId: string | null
  highlightedSpaces: string[]
  hoveredSpaceId: string | null
  showRules: boolean
  gameLog: string[]
  
  // Multiplayer state
  isMultiplayer: boolean
  roomId: string | null
  isConnected: boolean
  playerName: string
}

interface PlayerConfig {
  id: string
  name: string
}

/**
 * Create a fresh game state for simulation
 * This mimics what happens when starting a new game
 */
export function createInitialGameState(players: PlayerConfig[]): SimulationGameState {
  const board = createBoard()
  const gamePlayers = createPlayers(players)
  
  // Place initial bears for each player
  placeInitialBears(board, gamePlayers)
  
  return {
    board,
    players: gamePlayers,
    currentPlayerIndex: 0,
    season: 'Spring',
    year: 1,
    turn: 0,
    gamePhase: 'playing',
    turnPhase: 'movement',
    
    // UI state (not used in simulation)
    selectedSpaceId: null,
    selectedPieceId: null,
    highlightedSpaces: [],
    hoveredSpaceId: null,
    showRules: false,
    gameLog: [],
    
    // Multiplayer state
    isMultiplayer: false,
    roomId: null,
    isConnected: false,
    playerName: ''
  }
}

/**
 * Create the game board
 * Matches the structure from gameStore.ts
 */
function createBoard(): Board {
  const board: Board = {
    spaces: {},
    rings: {
      1: { spaceCount: 4, radius: 80 },
      2: { spaceCount: 8, radius: 120 },
      3: { spaceCount: 12, radius: 160 },
      4: { spaceCount: 16, radius: 200 },
      5: { spaceCount: 20, radius: 240 }
    }
  }
  
  // Create spaces for each ring
  for (const [ringNum, ringData] of Object.entries(board.rings)) {
    const ring = parseInt(ringNum)
    
    for (let position = 1; position <= ringData.spaceCount; position++) {
      const spaceId = `R${ring}:C${position}`
      
      // Calculate angle (with rotation for board orientation)
      const angle = ((position - 0.5) / ringData.spaceCount) * 2 * Math.PI + 3*Math.PI/4
      
      // Determine quadrant based on angle
      const quadrant = getQuadrant(angle)
      
      const space: GameSpace = {
        id: spaceId,
        ring,
        position,
        angle,
        quadrant,
        piece: null,
        canProduce: true,
        adjacentSpaces: calculateAdjacentSpaces(ring, position, ringData.spaceCount)
      }
      
      board.spaces[spaceId] = space
    }
  }
  
  // Add honey to 5 random forest spaces
  addHoneySpaces(board)
  
  return board
}

/**
 * Determine quadrant based on angle
 * Matches the rotated board layout from gameStore
 */
function getQuadrant(angle: number): GameSpace['quadrant'] {
  // Normalize angle to 0-2π
  const normalizedAngle = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)
  
  // Quadrants after rotation
  if (normalizedAngle >= 5*Math.PI/4 && normalizedAngle < 7*Math.PI/4) {
    return 'Mountains' // Top (225° to 315°)
  } else if (normalizedAngle >= 7*Math.PI/4 || normalizedAngle < Math.PI/4) {
    return 'Pastures' // Left (315° to 45°)
  } else if (normalizedAngle >= Math.PI/4 && normalizedAngle < 3*Math.PI/4) {
    return 'Forests' // Bottom (45° to 135°)
  } else {
    return 'Riverlands' // Right (135° to 225°)
  }
}

/**
 * Calculate adjacent spaces for a given position
 * This determines valid movement options
 */
function calculateAdjacentSpaces(ring: number, position: number, spaceCount: number): string[] {
  const adjacent: string[] = []
  
  // Same ring neighbors
  const prevPos = position === 1 ? spaceCount : position - 1
  const nextPos = position === spaceCount ? 1 : position + 1
  
  adjacent.push(`R${ring}:C${prevPos}`)
  adjacent.push(`R${ring}:C${nextPos}`)
  
  // Inner ring connections
  if (ring > 1) {
    const innerRingSpaces = getConnectedSpaces(ring, position, ring - 1)
    adjacent.push(...innerRingSpaces)
  }
  
  // Outer ring connections
  if (ring < 5) {
    const outerRingSpaces = getConnectedSpaces(ring, position, ring + 1)
    adjacent.push(...outerRingSpaces)
  }
  
  return adjacent
}

/**
 * Get connected spaces between rings
 * Based on angle proximity
 */
function getConnectedSpaces(fromRing: number, fromPosition: number, toRing: number): string[] {
  const fromSpaceCount = getRingSpaceCount(fromRing)
  const toSpaceCount = getRingSpaceCount(toRing)
  
  // Calculate angle of current space
  const fromAngle = ((fromPosition - 0.5) / fromSpaceCount) * 2 * Math.PI
  
  // Find spaces in target ring within connection range
  const connected: string[] = []
  const angleThreshold = Math.PI / Math.max(fromSpaceCount, toSpaceCount)
  
  for (let pos = 1; pos <= toSpaceCount; pos++) {
    const toAngle = ((pos - 0.5) / toSpaceCount) * 2 * Math.PI
    const angleDiff = Math.abs(normalizeAngleDiff(fromAngle - toAngle))
    
    if (angleDiff <= angleThreshold) {
      connected.push(`R${toRing}:C${pos}`)
    }
  }
  
  return connected
}

function getRingSpaceCount(ring: number): number {
  const counts = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 }
  return counts[ring as keyof typeof counts] || 20
}

function normalizeAngleDiff(diff: number): number {
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  return diff
}

/**
 * Create player objects
 */
function createPlayers(playerConfigs: PlayerConfig[]): Player[] {
  return playerConfigs.map(config => ({
    id: config.id,
    name: config.name,
    color: getPlayerColor(playerConfigs.indexOf(config)),
    pieces: [],
    pieceCount: {
      bears: 0,
      cubs: 0,
      maxBears: 5,
      maxCubs: 3
    },
    score: 0,
    resources: {
      grains: 0,
      berries: 0,
      salmon: 0
    }
  }))
}

/**
 * Add honey to 5 random forest spaces
 */
function addHoneySpaces(board: Board) {
  // Find all forest spaces
  const forestSpaces = Object.values(board.spaces)
    .filter(space => space.quadrant === 'Forests')
  
  // Randomly select 5 forest spaces for honey
  const shuffled = [...forestSpaces].sort(() => Math.random() - 0.5)
  const honeySpaces = shuffled.slice(0, 5)
  
  // Mark these spaces as having honey
  honeySpaces.forEach(space => {
    space.hasHoney = true
  })
}

/**
 * Get player color based on index
 */
function getPlayerColor(index: number): string {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']
  return colors[index % colors.length]
}

/**
 * Place initial bears on the board
 * Each player starts with 2 bears in different quadrants
 */
function placeInitialBears(board: Board, players: Player[]) {
  const quadrants = ['Mountains', 'Pastures', 'Forests', 'Riverlands']
  
  players.forEach((player, index) => {
    // Start in different quadrants for balance
    const startQuadrant = quadrants[index % quadrants.length]
    
    // Find empty spaces in starting quadrant
    const availableSpaces = Object.values(board.spaces)
      .filter(space => space.quadrant === startQuadrant && !space.piece)
      .slice(0, 2) // Get first 2 empty spaces
    
    // Place 2 bears
    availableSpaces.forEach((space, bearIndex) => {
      const bear = {
        id: `${player.id}-bear-${bearIndex}`,
        playerId: player.id,
        spaceId: space.id,
        type: 'bear' as const,
        health: 1,
        resources: {
          grains: 2,
          berries: 2,
          salmon: 2,
          honey: 0,
          bearMeat: 0
        },
        energy: 3,
        fat: 0,
        emergencyEnergy: 0,
        isHibernating: false
      }
      
      space.piece = bear
      player.pieces.push(bear)
      player.pieceCount.bears++
    })
  })
}