import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {
  executeEatFood,
  executeDailyEnergyTax,
  convertFatToEmergencyEnergy,
  executeHarvest,
  DEFAULT_CONFIG,
  SEASONAL_PRODUCTION,
  EMERGENCY_CONVERSION,
} from '../shared/gameRules'

// Types (same as before)
export interface GameSpace {
  id: string // e.g., "R1-1", "R2-15", "R5-40"
  ring: number // 1-5
  position: number // 1-20 for ring 1, 1-25 for ring 2, etc.
  angle: number
  quadrant: 'Mountains' | 'Pastures' | 'Forests' | 'Riverlands'
  subArea?: 'Caves' | 'Hunting Grounds'
  piece: GamePiece | null
  canProduce: boolean
  hasHoney?: boolean // Only for Forest spaces - randomly assigned to 5 spaces
  adjacentSpaces: string[] // Array of space IDs that are adjacent
  isSelected?: boolean
  isHighlighted?: boolean
}

export interface Board {
  spaces: { [spaceId: string]: GameSpace }
  rings: {
    [ring: number]: {
      spaceCount: number
      radius: number
    }
  }
}

export interface GamePiece {
  id: string
  playerId: string | number
  spaceId: string // Now uses string space IDs like "R1-5"
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
  emergencyEnergy: number // Energy from fat conversion, lost at end of turn
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

export interface GameState {
  // Game data
  board: Board
  players: Player[]
  currentPlayerIndex: number
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter'
  year: number
  turn: number
  gamePhase: 'setup' | 'playing' | 'ended'
  turnPhase: 'movement' | 'harvest' | 'eat' | 'hibernation'
  energyTaxPaid: boolean // Whether current player has paid their daily energy tax this turn
  
  // UI state (local only - not synced)
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
  
  // Actions
  initializeGame: () => void
  startMultiplayerGame: (roomId: string, playerName: string) => Promise<void>
  disconnectFromRoom: () => void
  
  // Synced actions (work in both single and multiplayer)
  placePiece: (playerId: string | number, spaceId: string, pieceType?: 'bear' | 'cub') => boolean
  movePiece: (pieceId: string, newSpaceId: string) => boolean
  exchangeResources: (fromPieceId: string, toPieceId: string, resourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat', amount: number) => boolean
  transferEnergy: (fromPieceId: string, toPieceId: string, amount: number) => boolean
  
  // Turn phase actions
  eatFood: (pieceId: string, resourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat', amount: number, convertTo: 'energy' | 'fat') => boolean
  burnFatForEmergencyEnergy: (pieceId: string, fatAmount?: number) => boolean
  payEnergyTax: () => boolean
  loseTurnEnergy: (pieceId: string) => boolean
  hibernateBear: (pieceId: string) => boolean
  wakeHibernatingBears: () => void
  harvestResources: (pieceId: string) => boolean
  harvestAllPlayerResources: (playerId: string | number) => boolean
  nextTurnPhase: () => void
  setTurnPhase: (phase: 'movement' | 'harvest' | 'eat' | 'hibernation') => void
  
  advanceSeason: () => void
  nextPlayer: () => void
  
  // Local actions (UI only)
  selectSpace: (spaceId: string) => void
  clearSelection: () => void
  highlightValidMoves: (spaceId: string) => void
  setHoveredSpace: (spaceId: string | null) => void
  addToLog: (message: string) => void
  toggleRules: () => void
  resetGame: () => void
  
  // Utility functions
  calculateScore: (playerId: string | number) => number
  getPlayerTerritories: (playerId: string | number) => string[]
  areSpacesAdjacent: (spaceId1: string, spaceId2: string) => boolean
  produceResources: () => void
  handleWinterSurvival: () => void
}

// Y.js integration
let yjsDoc: Y.Doc | null = null
let yjsProvider: WebsocketProvider | null = null
let gameStateMap: Y.Map<unknown> | null = null

// SEASONAL_PRODUCTION now imported from shared/gameRules.ts

// Helper functions for board creation
const createInitialBoard = (): Board => {
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

  // Create all spaces first
  ringConfigs.forEach(({ ring, spaceCount, radius }) => {
    rings[ring] = { spaceCount, radius }
    
    for (let position = 1; position <= spaceCount; position++) {
      // Offset angle by half a space so boundaries fall between spaces, then rotate 135° (-45°)
      const angle = ((position - 0.5) / spaceCount) * 2 * Math.PI + 3*Math.PI/4
      const quadrant = getQuadrantFromAngle(angle)
      const spaceId = `R${ring}-${position}`
      
      spaces[spaceId] = {
        id: spaceId,
        ring,
        position,
        angle,
        quadrant,
        subArea: quadrant === 'Mountains' ? getMountainSubArea(ring) : undefined,
        piece: null,
        canProduce: quadrant !== 'Mountains',
        adjacentSpaces: [], // Will be calculated below
        isSelected: false,
        isHighlighted: false
      }
    }
  })

  // Assign honey to 5 random forest spaces
  const forestSpaces = Object.values(spaces).filter(space => space.quadrant === 'Forests')
  const honeySpaces = forestSpaces
    .sort(() => Math.random() - 0.5) // Shuffle
    .slice(0, 5) // Take first 5
  
  honeySpaces.forEach(space => {
    space.hasHoney = true
  })

  // Calculate adjacency for all spaces
  Object.values(spaces).forEach(space => {
    space.adjacentSpaces = calculateAdjacentSpaces(space, spaces, rings)
  })

  return { spaces, rings }
}

const calculateAdjacentSpaces = (
  space: GameSpace, 
  allSpaces: { [spaceId: string]: GameSpace },
  rings: Board['rings']
): string[] => {
  const adjacent: string[] = []
  const { ring, position } = space
  const ringConfig = rings[ring]
  
  // Same ring - left and right neighbors (share side edges)
  const leftPos = position === 1 ? ringConfig.spaceCount : position - 1
  const rightPos = position === ringConfig.spaceCount ? 1 : position + 1
  
  adjacent.push(`R${ring}-${leftPos}`)
  adjacent.push(`R${ring}-${rightPos}`)
  
  // Inner ring connections - spaces that share the inner radial edge
  if (ring > 1) {
    const innerRingConfig = rings[ring - 1]
    const innerPositions = getCorrespondingPositions(position, ringConfig.spaceCount, innerRingConfig.spaceCount)
    innerPositions.forEach(pos => {
      const innerSpaceId = `R${ring - 1}-${pos}`
      if (allSpaces[innerSpaceId]) {
        // Check if the spaces share the same quadrant or are at quadrant boundaries
        const innerSpace = allSpaces[innerSpaceId]
        if (canSpacesConnect(space, innerSpace)) {
          adjacent.push(innerSpaceId)
        }
      }
    })
  }
  
  // Outer ring connections - spaces that share the outer radial edge
  if (ring < 5) {
    const outerRingConfig = rings[ring + 1]
    const outerPositions = getCorrespondingPositions(position, ringConfig.spaceCount, outerRingConfig.spaceCount)
    outerPositions.forEach(pos => {
      const outerSpaceId = `R${ring + 1}-${pos}`
      if (allSpaces[outerSpaceId]) {
        // Check if the spaces share the same quadrant or are at quadrant boundaries
        const outerSpace = allSpaces[outerSpaceId]
        if (canSpacesConnect(space, outerSpace)) {
          adjacent.push(outerSpaceId)
        }
      }
    })
  }
  
  return [...new Set(adjacent)] // Remove duplicates
}

const getCorrespondingPositions = (position: number, fromRingSize: number, toRingSize: number): number[] => {
  // Calculate the angular extent of each space in both rings
  const fromAnglePerSpace = (2 * Math.PI) / fromRingSize
  const toAnglePerSpace = (2 * Math.PI) / toRingSize
  
  // Find the angular boundaries of the current space (accounting for offset)
  const spaceStartAngle = ((position - 1) - 0.5) * fromAnglePerSpace
  const spaceEndAngle = ((position - 1) + 0.5) * fromAnglePerSpace
  
  // Find all spaces in the target ring that overlap with this angular range
  const positions = []
  
  for (let targetPos = 1; targetPos <= toRingSize; targetPos++) {
    const targetStartAngle = ((targetPos - 1) - 0.5) * toAnglePerSpace
    const targetEndAngle = ((targetPos - 1) + 0.5) * toAnglePerSpace
    
    // Check if there's any overlap between the angular ranges
    // Account for wraparound at 2π
    const overlap = angularRangesOverlap(
      spaceStartAngle, spaceEndAngle,
      targetStartAngle, targetEndAngle
    )
    
    if (overlap) {
      positions.push(targetPos)
    }
  }
  
  return positions.length > 0 ? positions : [1] // Fallback to position 1 if no overlaps found
}

// Helper function to check if two angular ranges overlap (accounting for 2π wraparound)
const angularRangesOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
  // Normalize angles to [0, 2π)
  const normalize = (angle: number) => ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)
  
  const s1 = normalize(start1)
  const e1 = normalize(end1)
  const s2 = normalize(start2)
  const e2 = normalize(end2)
  
  // Simple overlap check without recursion
  // Handle wraparound by checking if either range spans across 0
  const range1Wraps = s1 > e1
  const range2Wraps = s2 > e2
  
  if (!range1Wraps && !range2Wraps) {
    // Neither range wraps - simple overlap check
    return !(e1 < s2 || e2 < s1)
  } else if (range1Wraps && !range2Wraps) {
    // Range 1 wraps, range 2 doesn't
    return (s2 <= e1) || (s1 <= e2)
  } else if (!range1Wraps && range2Wraps) {
    // Range 2 wraps, range 1 doesn't
    return (s1 <= e2) || (s2 <= e1)
  } else {
    // Both ranges wrap - they must overlap
    return true
  }
}

// Check if two spaces can connect based on their quadrants
const canSpacesConnect = (space1: GameSpace, space2: GameSpace): boolean => {
  // Spaces in the same ring are always connected (handled separately)
  if (space1.ring === space2.ring) {
    return true
  }
  
  // For spaces in different rings, they can only connect if:
  // 1. They are in the same quadrant, OR
  // 2. They actually share a radial edge at a quadrant boundary
  
  // If both spaces are in the same quadrant, they can connect
  if (space1.quadrant === space2.quadrant) {
    return true
  }
  
  // Check if spaces share a radial edge at a quadrant boundary
  // For spaces to share an edge across quadrants, they must:
  // 1. Be in adjacent quadrants
  // 2. Have overlapping angular ranges that span the boundary
  
  // Check if quadrants are adjacent (rotated 45° so Mountains at top)
  const quadrantOrder = ['Mountains', 'Riverlands', 'Forests', 'Pastures']
  const idx1 = quadrantOrder.indexOf(space1.quadrant)
  const idx2 = quadrantOrder.indexOf(space2.quadrant)
  
  // Adjacent quadrants have indices that differ by 1 (with wraparound)
  const areQuadrantsAdjacent = 
    Math.abs(idx1 - idx2) === 1 || 
    (idx1 === 0 && idx2 === 3) || 
    (idx1 === 3 && idx2 === 0)
  
  if (!areQuadrantsAdjacent) {
    return false
  }
  
  // Now check if they actually share an edge at the boundary
  // The boundary angles are: 0, π/2, π, 3π/2
  
  // Find the boundary between these two quadrants 
  // With spaces rotated 45°, boundaries are at: 45°, 135°, 225°, 315°
  let sharedBoundary: number
  if ((space1.quadrant === 'Mountains' && space2.quadrant === 'Riverlands') ||
      (space1.quadrant === 'Riverlands' && space2.quadrant === 'Mountains')) {
    sharedBoundary = Math.PI/4  // 45° boundary
  } else if ((space1.quadrant === 'Riverlands' && space2.quadrant === 'Forests') ||
             (space1.quadrant === 'Forests' && space2.quadrant === 'Riverlands')) {
    sharedBoundary = 3*Math.PI/4  // 135° boundary
  } else if ((space1.quadrant === 'Forests' && space2.quadrant === 'Pastures') ||
             (space1.quadrant === 'Pastures' && space2.quadrant === 'Forests')) {
    sharedBoundary = 5*Math.PI/4  // 225° boundary
  } else {
    // Mountains-Pastures boundary at -45° (315°)
    sharedBoundary = 7*Math.PI/4  // 315° boundary (-45°)
  }
  
  // Check if both spaces' angular ranges include the shared boundary
  // We need a very tight threshold - spaces must nearly touch the boundary
  const boundaryThreshold = Math.PI / 128 // ~1.4 degrees - very tight tolerance
  
  const isAtBoundary = (angle: number, boundary: number) => {
    const diff = Math.abs(angle - boundary)
    // Handle wraparound at 2π
    return diff < boundaryThreshold || (2 * Math.PI - diff) < boundaryThreshold
  }
  
  // Both spaces must be at the shared boundary
  return isAtBoundary(space1.angle, sharedBoundary) && 
         isAtBoundary(space2.angle, sharedBoundary)
}

const getQuadrantFromAngle = (angle: number): GameSpace['quadrant'] => {
  // Normalize angle to 0-2π range
  const normalizedAngle = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)
  
  // After 90° rotation, boundaries are at -135°, -45°, 45°, 135° (or 225°, 315°, 45°, 135°)
  // Mountains: 225° to 315° (or -135° to -45°)
  // Riverlands: 315° to 45° (crossing 0°)  
  // Forests: 45° to 135°
  // Pastures: 135° to 225°
  
  if (normalizedAngle >= 5*Math.PI/4 && normalizedAngle < 7*Math.PI/4) return 'Mountains'  // 225° to 315°
  if (normalizedAngle >= 7*Math.PI/4 || normalizedAngle < Math.PI/4) return 'Riverlands'  // 315° to 45°
  if (normalizedAngle >= Math.PI/4 && normalizedAngle < 3*Math.PI/4) return 'Forests'     // 45° to 135°
  return 'Pastures'  // 135° to 225°
}

const getMountainSubArea = (ring: number): 'Caves' | 'Hunting Grounds' => {
  return ring <= 2 ? 'Caves' : 'Hunting Grounds'
}

const createInitialPlayers = (): Player[] => [
  {
    id: 1,
    name: 'Player 1',
    color: '#E74C3C',
    pieces: [],
    pieceCount: { bears: 0, cubs: 0, maxBears: 5, maxCubs: 3 },
    score: 0
  },
  {
    id: 2, 
    name: 'Player 2',
    color: '#3498DB',
    pieces: [],
    pieceCount: { bears: 0, cubs: 0, maxBears: 5, maxCubs: 3 },
    score: 0
  }
]

export const useGameStore = create<GameState>()(
  devtools(
    (set, get) => ({
      // Initial state
      board: createInitialBoard(),
      players: createInitialPlayers(),
      currentPlayerIndex: 0,
      season: 'Spring',
      year: 1,
      turn: 0,
      gamePhase: 'setup',
      turnPhase: 'movement',
      energyTaxPaid: false,
      selectedSpaceId: null,
      selectedPieceId: null,
      highlightedSpaces: [],
      hoveredSpaceId: null,
      showRules: false,
      gameLog: [],
      isMultiplayer: false,
      roomId: null,
      isConnected: false,
      playerName: '',

      // Initialize single player game
      initializeGame: () => {
        const newBoard = createInitialBoard()
        const newPlayers = createInitialPlayers()
        
        // Each player starts with 1 adult bear at edge of mountains in pasture
        const player1StartSpace = 'R3-7'   // Middle ring at Mountains/Pastures border
        const player2StartSpace = 'R3-21'  // Middle ring at Mountains/Pastures border (opposite side)
        
        // Player 1's starting bear
        const p1Bear: GamePiece = {
          id: 'p1-bear-1',
          playerId: 1,
          spaceId: player1StartSpace,
          type: 'bear',
          health: 1,
          resources: {
            grains: 0,
            berries: 0,
            salmon: 0,
            honey: 0,
            bearMeat: 0
          },
          energy: 5,
          fat: 0,
          emergencyEnergy: 0
        }
        newBoard.spaces[player1StartSpace].piece = p1Bear
        newPlayers[0].pieces.push(p1Bear)
        newPlayers[0].pieceCount.bears = 1
        
        // Player 2's starting bear
        const p2Bear: GamePiece = {
          id: 'p2-bear-1',
          playerId: 2,
          spaceId: player2StartSpace,
          type: 'bear',
          health: 1,
          resources: {
            grains: 0,
            berries: 0,
            salmon: 0,
            honey: 0,
            bearMeat: 0
          },
          energy: 5,
          fat: 0,
          emergencyEnergy: 0
        }
        newBoard.spaces[player2StartSpace].piece = p2Bear
        newPlayers[1].pieces.push(p2Bear)
        newPlayers[1].pieceCount.bears = 1

        set({
          board: newBoard,
          players: newPlayers,
          gamePhase: 'playing',
          gameLog: ['Game initialized with pieces placed!'],
          isMultiplayer: false
        })
      },

      // Start multiplayer game
      startMultiplayerGame: async (roomId: string, playerName: string) => {
        try {
          // Create Y.js document
          yjsDoc = new Y.Doc()
          gameStateMap = yjsDoc.getMap('gameState')
          
          // Connect to WebSocket provider
          yjsProvider = new WebsocketProvider(
            process.env.NEXT_PUBLIC_YJS_SERVER || 'ws://localhost:1234',
            roomId,
            yjsDoc
          )

          // Handle connection status
          yjsProvider.on('status', (event: { status: string }) => {
            set({ isConnected: event.status === 'connected' })
            if (event.status === 'connected') {
              get().addToLog(`Connected to room: ${roomId}`)
            }
          })

          // Sync Y.js changes to Zustand
          let isUpdatingFromYjs = false
          gameStateMap.observe(() => {
            if (isUpdatingFromYjs) return
            console.log('[From Yjs] Applying incoming update');

            const yjsState = gameStateMap!.toJSON()
            if (Object.keys(yjsState).length > 0) {
              isUpdatingFromYjs = true;

              set({
                board: yjsState.board || get().board,
                players: yjsState.players || get().players,
                currentPlayerIndex: yjsState.currentPlayerIndex || 0,
                season: yjsState.season || 'Spring',
                turn: yjsState.turn || 0,
                gamePhase: yjsState.gamePhase || 'playing'
              })

              isUpdatingFromYjs = false;
            }
          })

          // Sync Zustand changes to Y.js (with debouncing)
          let syncTimeout: NodeJS.Timeout
          const syncToYjs = (state: GameState) => {
            if (!gameStateMap || isUpdatingFromYjs) return

            console.log('[To Yjs] Sending local update');
            
            clearTimeout(syncTimeout)
            syncTimeout = setTimeout(() => {
              const prev = gameStateMap!.toJSON();

              // avoid resending if nothing changed
              if (
                JSON.stringify(prev.board) === JSON.stringify(state.board) &&
                JSON.stringify(prev.players) === JSON.stringify(state.players) &&
                prev.currentPlayerIndex === state.currentPlayerIndex &&
                prev.season === state.season &&
                prev.turn === state.turn &&
                prev.gamePhase === state.gamePhase
              ) {
                return;
              }

              isUpdatingFromYjs = true

              gameStateMap!.set('board', state.board)
              gameStateMap!.set('players', state.players)
              gameStateMap!.set('currentPlayerIndex', state.currentPlayerIndex)
              gameStateMap!.set('season', state.season)
              gameStateMap!.set('turn', state.turn)
              gameStateMap!.set('gamePhase', state.gamePhase)

              isUpdatingFromYjs = false
            }, 50)
          }

          // Subscribe to Zustand changes
          useGameStore.subscribe(syncToYjs)

          // Initialize game if first player
          if (gameStateMap.size === 0) {
            get().initializeGame()
          }

          set({
            isMultiplayer: true,
            roomId,
            playerName,
            gameLog: [...get().gameLog, `Joining multiplayer room: ${roomId}`]
          })

        } catch (error) {
          console.error('Failed to start multiplayer game:', error)
          get().addToLog('Failed to connect to multiplayer server')
          throw error
        }
      },

      // Disconnect from multiplayer
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
        
        get().addToLog('Disconnected from multiplayer room')
      },

      // Synced actions (work in both single and multiplayer)
      placePiece: (playerId, spaceId, pieceType: 'bear' | 'cub' = 'bear') => {
        const state = get()
        const space = state.board.spaces[spaceId]
        const player = state.players.find(p => p.id === playerId)

        if (!space || !player || space.piece) {
          return false
        }

        // Check piece limits
        const currentBears = player.pieceCount.bears
        const currentCubs = player.pieceCount.cubs
        
        if (pieceType === 'bear' && currentBears >= player.pieceCount.maxBears) {
          get().addToLog(`${player.name} has reached maximum bears (${player.pieceCount.maxBears})`)
          return false
        }
        
        if (pieceType === 'cub' && currentCubs >= player.pieceCount.maxCubs) {
          get().addToLog(`${player.name} has reached maximum cubs (${player.pieceCount.maxCubs})`)
          return false
        }

        const piece: GamePiece = {
          id: `${playerId}-${pieceType}-${Date.now()}`,
          playerId,
          spaceId,
          type: pieceType,
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
          emergencyEnergy: 0
        }

        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: {
              ...state.board.spaces,
              [spaceId]: { ...state.board.spaces[spaceId], piece }
            }
          },
          players: state.players.map(p =>
            p.id === playerId ? { 
              ...p, 
              pieces: [...p.pieces, piece],
              pieceCount: {
                ...p.pieceCount,
                [pieceType === 'bear' ? 'bears' : 'cubs']: p.pieceCount[pieceType === 'bear' ? 'bears' : 'cubs'] + 1
              }
            } : p
          )
        }))

        get().addToLog(`${player.name} placed ${pieceType} on ${space.quadrant}`)
        return true
      },

      movePiece: (pieceId, newSpaceId) => {
        const state = get()
        
        // Can only move during the movement phase
        if (state.turnPhase !== 'movement') {
          return false
        }
        
        // Must pay energy tax before moving
        if (!state.energyTaxPaid) {
          get().addToLog('Must pay energy tax before moving')
          return false
        }
        
        const piece = state.players.flatMap(p => p.pieces).find(p => p.id === pieceId)
        const newSpace = state.board.spaces[newSpaceId]
        const oldSpace = Object.values(state.board.spaces).find(s => s.piece?.id === pieceId)

        if (!piece || !newSpace || !oldSpace || newSpace.piece) {
          return false
        }

        if (!get().areSpacesAdjacent(oldSpace.id, newSpaceId)) {
          return false
        }

        // Movement costs depend on fat level and season
        const currentPiece = oldSpace.piece!
        const currentSeason = get().season
        const isInMountains = oldSpace.quadrant === 'Mountains'
        
        let baseCost = 1
        if (currentPiece.fat <= 5) {
          baseCost = 1  // Lean bears move efficiently
        } else if (currentPiece.fat <= 15) {
          baseCost = 2  // Getting heavy
        } else {
          baseCost = 3  // Very heavy, hibernation-ready bears
        }
        
        // Winter movement is extremely costly
        let movementCost = baseCost
        if (currentSeason === 'Winter') {
          movementCost = isInMountains ? 2 : 5  // Winter: Mountains 2, Outside 5
        }
        
        let energySource = ''
        const newResources = { ...currentPiece.resources }
        let newEnergy = currentPiece.energy
        let newEmergencyEnergy = currentPiece.emergencyEnergy
        const newFat = currentPiece.fat

        const totalEnergy = currentPiece.energy + currentPiece.emergencyEnergy
        if (totalEnergy >= movementCost) {
          // Use energy reserves (regular first, then emergency)
          if (currentPiece.energy >= movementCost) {
            newEnergy -= movementCost
            energySource = `${movementCost} regular energy`
          } else {
            const regularUsed = currentPiece.energy
            const emergencyUsed = movementCost - regularUsed
            newEnergy = 0
            newEmergencyEnergy -= emergencyUsed
            energySource = `${regularUsed} regular + ${emergencyUsed} emergency energy`
          }
          
          const fatLevel = currentPiece.fat <= 5 ? 'lean' : currentPiece.fat <= 15 ? 'heavy' : 'very heavy'
          energySource += ` (${fatLevel})`
        } else {
          get().addToLog(`Bear has insufficient energy to move! Needs ${movementCost}, has ${totalEnergy} total`)
          return false
        }

        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: {
              ...state.board.spaces,
              [oldSpace.id]: { ...state.board.spaces[oldSpace.id], piece: null },
              [newSpaceId]: { 
                ...state.board.spaces[newSpaceId], 
                piece: { 
                  ...piece, 
                  spaceId: newSpaceId,
                  resources: newResources,
                  energy: newEnergy,
                  emergencyEnergy: newEmergencyEnergy,
                  fat: newFat
                } 
              }
            }
          },
          players: state.players.map(p => ({
            ...p,
            pieces: p.pieces.map(piece => 
              piece.id === pieceId ? { 
                ...piece, 
                spaceId: newSpaceId,
                resources: newResources,
                energy: newEnergy,
                emergencyEnergy: newEmergencyEnergy,
                fat: newFat
              } : piece
            )
          }))
        }))

        get().addToLog(`Moved piece from ${oldSpace.quadrant} to ${newSpace.quadrant} using ${energySource}`)
        return true
      },

      exchangeResources: (fromPieceId, toPieceId, resourceType, amount) => {
        const state = get()
        
        // Find the pieces
        const fromPiece = Object.values(state.board.spaces).find(s => s.piece?.id === fromPieceId)?.piece
        const toPiece = Object.values(state.board.spaces).find(s => s.piece?.id === toPieceId)?.piece
        
        if (!fromPiece || !toPiece) {
          get().addToLog('Cannot find pieces for resource exchange')
          return false
        }

        // Check if pieces are adjacent
        if (!get().areSpacesAdjacent(fromPiece.spaceId, toPiece.spaceId)) {
          get().addToLog('Bears must be adjacent to exchange resources')
          return false
        }

        // Check if fromPiece has enough resources
        if (fromPiece.resources[resourceType] < amount) {
          get().addToLog(`${resourceType}: Not enough resources to exchange`)
          return false
        }

        // Perform the exchange
        const updatedSpaces = { ...state.board.spaces }
        
        Object.values(state.board.spaces).forEach(s => {
          if (s.piece?.id === fromPieceId) {
            updatedSpaces[s.id] = {
              ...s,
              piece: {
                ...s.piece,
                resources: {
                  ...s.piece.resources,
                  [resourceType]: s.piece.resources[resourceType] - amount
                }
              }
            }
          }
          if (s.piece?.id === toPieceId) {
            updatedSpaces[s.id] = {
              ...s,
              piece: {
                ...s.piece,
                resources: {
                  ...s.piece.resources,
                  [resourceType]: s.piece.resources[resourceType] + amount
                }
              }
            }
          }
        })
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: state.players.map(p => ({
            ...p,
            pieces: p.pieces.map(piece => {
              if (piece.id === fromPieceId) {
                return {
                  ...piece,
                  resources: {
                    ...piece.resources,
                    [resourceType]: piece.resources[resourceType] - amount
                  }
                }
              }
              if (piece.id === toPieceId) {
                return {
                  ...piece,
                  resources: {
                    ...piece.resources,
                    [resourceType]: piece.resources[resourceType] + amount
                  }
                }
              }
              return piece
            })
          }))
        }))

        get().addToLog(`Exchanged ${amount} ${resourceType} between bears`)
        return true
      },

      // Turn phase functions
      eatFood: (pieceId, resourceType, amount, convertTo) => {
        const state = get()
        
        // Find the piece
        const pieceSpace = Object.values(state.board.spaces).find(s => s.piece?.id === pieceId)
        if (!pieceSpace?.piece) {
          get().addToLog('Cannot find bear for eating')
          return false
        }

        // Use shared rules engine
        const result = executeEatFood(pieceSpace.piece, resourceType, amount, convertTo, DEFAULT_CONFIG)
        
        if (!result.success) {
          get().addToLog(result.message)
          return false
        }

        // Update game state with new piece
        const updatedSpaces = { ...state.board.spaces }
        updatedSpaces[pieceSpace.id] = {
          ...pieceSpace,
          piece: result.newPiece
        }
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: state.players.map(p => ({
            ...p,
            pieces: p.pieces.map(piece => 
              piece.id === pieceId ? result.newPiece : piece
            )
          }))
        }))

        get().addToLog(result.message)
        return true
      },

      burnFatForEmergencyEnergy: (pieceId, fatAmount) => {
        const state = get()
        
        // Find the piece
        const pieceSpace = Object.values(state.board.spaces).find(s => s.piece?.id === pieceId)
        if (!pieceSpace?.piece) {
          get().addToLog('Piece not found')
          return false
        }

        const piece = pieceSpace.piece
        
        // Auto-convert small amount if not specified
        const amountToConvert = fatAmount || Math.min(piece.fat, EMERGENCY_CONVERSION.maxFatPerTurn)
        
        // Use shared rules engine for fat conversion
        const result = convertFatToEmergencyEnergy(piece, amountToConvert, DEFAULT_CONFIG)
        
        if (!result.success) {
          get().addToLog(result.message)
          return false
        }

        // Update the piece in the board
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: {
              ...state.board.spaces,
              [pieceSpace.id]: {
                ...pieceSpace,
                piece: result.newPiece
              }
            }
          }
        }))

        get().addToLog(`Converted ${amountToConvert} fat to ${amountToConvert * DEFAULT_CONFIG.emergencyEnergyConversion} emergency energy`)
        return true
      },

      payEnergyTax: () => {
        const state = get()
        
        if (state.energyTaxPaid) {
          get().addToLog('Energy tax already paid this turn')
          return false
        }

        const currentPlayer = state.players[state.currentPlayerIndex]
        if (!currentPlayer) {
          get().addToLog('No current player found')
          return false
        }

        // Apply energy tax to all non-hibernating pieces
        const updatedSpaces = { ...state.board.spaces }
        let taxApplied = false

        Object.values(state.board.spaces).forEach(space => {
          if (space.piece && String(space.piece.playerId) === String(currentPlayer.id) && !space.piece.isHibernating) {
            const result = executeDailyEnergyTax(space.piece, state.season, space.quadrant, DEFAULT_CONFIG)
            
            updatedSpaces[space.id] = {
              ...space,
              piece: result.newPiece
            }
            taxApplied = true
          }
        })

        if (!taxApplied) {
          get().addToLog('No pieces available for energy tax')
          return false
        }

        // Update the game state
        set(state => ({
          ...state,
          energyTaxPaid: true,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: state.players.map(p => {
            if (p.id === currentPlayer.id) {
              return {
                ...p,
                pieces: p.pieces.map(piece => {
                  // Find the updated piece in the board spaces
                  const updatedSpace = Object.values(updatedSpaces).find(s => s.piece?.id === piece.id)
                  return updatedSpace?.piece || piece
                })
              }
            }
            return p
          })
        }))

        get().addToLog('💰 Energy tax paid for all bears')
        return true
      },

      harvestResources: (pieceId) => {
        const state = get()
        const pieceSpace = Object.values(state.board.spaces).find(s => s.piece?.id === pieceId)
        if (!pieceSpace?.piece || !pieceSpace.canProduce) {
          get().addToLog('Cannot harvest from this location')
          return false
        }

        const production = SEASONAL_PRODUCTION[state.season]
        
        const updatedSpaces = { ...state.board.spaces }
        
        Object.values(state.board.spaces).forEach(s => {
          if (s.piece?.id === pieceId) {
            const newResources = { ...s.piece.resources }
            
            switch (s.quadrant) {
              case 'Pastures':
                newResources.grains += production.grains
                break
              case 'Forests':
                newResources.berries += production.berries
                if (s.hasHoney) {
                  newResources.honey += production.honey
                }
                break
              case 'Riverlands':
                newResources.salmon += production.salmon
                break
            }

            updatedSpaces[s.id] = {
              ...s,
              piece: {
                ...s.piece,
                resources: newResources
              }
            }
          }
        })
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: state.players.map(p => ({
            ...p,
            pieces: p.pieces.map(piece => {
              if (piece.id === pieceId) {
                const space = state.board.spaces[piece.spaceId]
                const newResources = { ...piece.resources }
                
                if (space) {
                  switch (space.quadrant) {
                    case 'Pastures':
                      newResources.grains += production.grains
                      break
                    case 'Forests':
                      newResources.berries += production.berries
                      if (space.hasHoney) {
                        newResources.honey += production.honey
                      }
                      break
                    case 'Riverlands':
                      newResources.salmon += production.salmon
                      break
                  }
                }

                return { ...piece, resources: newResources }
              }
              return piece
            })
          }))
        }))

        get().addToLog(`Bear harvested from ${pieceSpace.quadrant}`)
        return true
      },

      harvestAllPlayerResources: (playerId) => {
        const state = get()
        
        // Must pay energy tax before harvesting
        if (!state.energyTaxPaid) {
          get().addToLog('Must pay energy tax before harvesting')
          return false
        }
        
        const player = state.players.find(p => String(p.id) === String(playerId))
        if (!player) {
          get().addToLog('Player not found')
          return false
        }

        const totalHarvested = { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 }
        let bearsHarvested = 0
        
        const updatedSpaces = { ...state.board.spaces }
        
        // Use shared rules engine for harvesting
        Object.values(state.board.spaces).forEach(space => {
          if (space.piece && String(space.piece.playerId) === String(playerId)) {
            const harvestResult = executeHarvest(space.piece, space, state.season, DEFAULT_CONFIG)
            
            // Update totals
            totalHarvested.grains += harvestResult.harvested.grains
            totalHarvested.berries += harvestResult.harvested.berries
            totalHarvested.salmon += harvestResult.harvested.salmon
            totalHarvested.honey += harvestResult.harvested.honey
            totalHarvested.bearMeat += harvestResult.harvested.bearMeat
            
            updatedSpaces[space.id] = {
              ...space,
              piece: harvestResult.newPiece
            }
            
            if (harvestResult.harvested.grains + harvestResult.harvested.berries + harvestResult.harvested.salmon + harvestResult.harvested.honey > 0) {
              bearsHarvested++
            }
          }
        })

        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: state.players.map(p => {
            if (String(p.id) === String(playerId)) {
              return {
                ...p,
                pieces: p.pieces.map(piece => {
                  // Find the updated piece in the board spaces
                  const updatedSpace = Object.values(updatedSpaces).find(s => s.piece?.id === piece.id)
                  return updatedSpace?.piece || piece
                })
              }
            }
            return p
          })
        }))

        if (bearsHarvested > 0) {
          const harvestSummary = []
          if (totalHarvested.grains > 0) harvestSummary.push(`${totalHarvested.grains} 🌾`)
          if (totalHarvested.berries > 0) harvestSummary.push(`${totalHarvested.berries} 🫐`)
          if (totalHarvested.salmon > 0) harvestSummary.push(`${totalHarvested.salmon} 🐟`)
          
          get().addToLog(`${bearsHarvested} bears harvested: ${harvestSummary.join(', ')}`)
        } else {
          get().addToLog('No bears in productive areas to harvest')
        }
        
        return bearsHarvested > 0
      },


      transferEnergy: (fromPieceId: string, toPieceId: string, amount: number) => {
        const state = get()
        const fromSpace = Object.values(state.board.spaces).find(s => s.piece?.id === fromPieceId)
        const toSpace = Object.values(state.board.spaces).find(s => s.piece?.id === toPieceId)
        
        if (!fromSpace?.piece || !toSpace?.piece) {
          get().addToLog('Cannot find one or both pieces for energy transfer')
          return false
        }
        
        if (fromSpace.piece.energy < amount) {
          get().addToLog('Not enough energy to transfer')
          return false
        }
        
        // Check if pieces are adjacent (optional rule)
        if (!get().areSpacesAdjacent(fromSpace.id, toSpace.id)) {
          get().addToLog('Pieces must be adjacent to transfer energy')
          return false
        }
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: {
              ...state.board.spaces,
              [fromSpace.id]: {
                ...fromSpace,
                piece: fromSpace.piece ? {
                  ...fromSpace.piece,
                  energy: fromSpace.piece.energy - amount
                } : null
              },
              [toSpace.id]: {
                ...toSpace,
                piece: toSpace.piece ? {
                  ...toSpace.piece,
                  energy: Math.min(20, toSpace.piece.energy + amount)
                } : null
              }
            }
          }
        }))
        
        get().addToLog(`Transferred ${amount} energy from ${fromPieceId} to ${toPieceId}`)
        return true
      },


      loseTurnEnergy: (pieceId: string) => {
        const state = get()
        const space = Object.values(state.board.spaces).find(s => s.piece?.id === pieceId)
        
        if (!space?.piece) {
          return false
        }
        
        const piece = space.piece
        
        // Calculate energy loss based on season and fat reserves
        let energyLoss = 1 // Base energy loss
        const currentSeason = get().season
        const currentSpace = get().board.spaces[space.id]
        const isInMountains = currentSpace?.quadrant === 'Mountains'

        if (currentSeason === 'Winter') {
          // Winter is extremely harsh - fat provides no protection anymore
          energyLoss = isInMountains ? 2 : 5  // Mountains: -2, Outside: -5
        } else {
          // Non-winter seasons are easier
          energyLoss = 1
        }

        // Calculate total available energy (regular + emergency)
        const totalEnergy = piece.energy + piece.emergencyEnergy
        const totalEnergyAfterLoss = Math.max(0, totalEnergy - energyLoss)
        
        // Distribute remaining energy (regular energy first, then emergency)
        const newRegularEnergy = Math.min(piece.energy, totalEnergyAfterLoss)
        let newEmergencyEnergy = Math.max(0, totalEnergyAfterLoss - newRegularEnergy)
        
        // Emergency energy is lost at end of turn regardless
        newEmergencyEnergy = 0
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: {
              ...state.board.spaces,
              [space.id]: {
                ...space,
                piece: {
                  ...piece,
                  energy: newRegularEnergy,
                  emergencyEnergy: newEmergencyEnergy
                }
              }
            }
          },
          players: state.players.map(p => ({
            ...p,
            pieces: p.pieces.map(playerPiece => {
              if (playerPiece.id === pieceId) {
                return {
                  ...playerPiece,
                  energy: newRegularEnergy,
                  emergencyEnergy: newEmergencyEnergy
                }
              }
              return playerPiece
            })
          }))
        }))
        
        if (newRegularEnergy === 0) {
          get().addToLog(`Bear lost ${energyLoss} energy at turn start and now has 0 energy!`)
        } else {
          get().addToLog(`Bear lost ${energyLoss} energy at turn start (${newRegularEnergy} remaining) ⚡`)
        }
        
        return true
      },

      hibernateBear: (pieceId: string) => {
        const state = get()
        const space = Object.values(state.board.spaces).find(s => s.piece?.id === pieceId)
        
        if (!space?.piece || space.quadrant !== 'Mountains' || state.season !== 'Winter') {
          return false
        }
        
        const piece = space.piece
        
        // Check if bear has enough fat to hibernate (requires 35 fat)
        if (piece.fat < 35) {
          get().addToLog(`Bear needs 35 fat to hibernate (has ${piece.fat})`)
          return false
        }
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: {
              ...state.board.spaces,
              [space.id]: {
                ...space,
                piece: {
                  ...piece,
                  isHibernating: true,
                  energy: 5, // Reset energy to 5
                  fat: 0,    // Reset fat to 0
                  resources: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 } // Reset all resources to 0
                }
              }
            }
          },
          players: state.players.map(p => ({
            ...p,
            pieces: p.pieces.map(playerPiece => {
              if (playerPiece.id === pieceId) {
                return {
                  ...playerPiece,
                  isHibernating: true,
                  energy: 5, // Reset energy to 5
                  fat: 0,    // Reset fat to 0
                  resources: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 } // Reset all resources to 0
                }
              }
              return playerPiece
            })
          }))
        }))
        
        get().addToLog(`Bear entered hibernation (consumed 35 fat, reset to 5 energy) 💤`)
        return true
      },

      wakeHibernatingBears: () => {
        const state = get()
        const updatedSpaces = { ...state.board.spaces }
        const updatedPlayers = [...state.players]
        
        // Track whether any bears hibernated on first day of winter for cub spawning
        const isFirstDayOfWinter = state.turn === 1 && state.season === 'Winter'
        
        // Find all hibernating bears
        Object.values(state.board.spaces).forEach(space => {
          if (space.piece?.isHibernating) {
            const piece = space.piece
            
            // Wake up the bear
            updatedSpaces[space.id] = {
              ...space,
              piece: {
                ...piece,
                isHibernating: false
              }
            }
            
            // Update in players array
            updatedPlayers.forEach(player => {
              player.pieces = player.pieces.map(playerPiece => {
                if (playerPiece.id === piece.id) {
                  return {
                    ...playerPiece,
                    isHibernating: false
                  }
                }
                return playerPiece
              })
            })
            
            get().addToLog(`Bear woke up from hibernation! 🌅`)
            
            // Spawn cub if hibernated on first day of winter
            if (isFirstDayOfWinter) {
              // Find an adjacent empty space for the cub
              const adjacentSpaces = Object.values(state.board.spaces).filter(s => 
                s.id !== space.id && 
                !s.piece && 
                get().areSpacesAdjacent(space.id, s.id)
              )
              
              if (adjacentSpaces.length > 0 && piece.playerId) {
                const cubSpace = adjacentSpaces[0]
                const player = updatedPlayers.find(p => String(p.id) === String(piece.playerId))
                
                if (player && player.pieceCount.cubs < player.pieceCount.maxCubs) {
                  const cubId = `cub-${Date.now()}-${Math.random()}`
                  
                  // Create cub
                  const newCub = {
                    id: cubId,
                    playerId: piece.playerId,
                    spaceId: cubSpace.id,
                    type: 'cub' as const,
                    resources: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 },
                    energy: 3, // Cubs start with 3 energy
                    fat: 0,
                    emergencyEnergy: 0
                  }
                  
                  // Place cub on board
                  updatedSpaces[cubSpace.id] = {
                    ...cubSpace,
                    piece: newCub
                  }
                  
                  // Add to player
                  player.pieces.push(newCub)
                  player.pieceCount.cubs++
                  
                  get().addToLog(`A cub was born from hibernation! 🐼`)
                }
              }
            }
          }
        })
        
        // Update state
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: updatedPlayers
        }))
      },

      nextTurnPhase: () => {
        const state = get()
        const phases: GameState['turnPhase'][] = ['movement', 'harvest', 'eat']
        const currentIndex = phases.indexOf(state.turnPhase)
        const nextPhase = phases[(currentIndex + 1) % phases.length]

        set(state => ({
          ...state,
          turnPhase: nextPhase
        }))

        get().addToLog(`Turn phase: ${nextPhase}`)
        
        // If we completed a full cycle, advance to next player
        if (nextPhase === 'eat') {
          get().nextPlayer()
        }
      },

      setTurnPhase: (phase: 'eat' | 'movement' | 'harvest' | 'hibernation') => {
        set(state => ({
          ...state,
          turnPhase: phase
        }))
        
        get().addToLog(`Turn phase set to: ${phase}`)
      },

      advanceSeason: () => {
        const state = get()
        const seasons: GameState['season'][] = ['Spring', 'Summer', 'Autumn', 'Winter']
        const currentIndex = seasons.indexOf(state.season)
        const newSeason = seasons[(currentIndex + 1) % seasons.length]

        set(state => ({
          ...state,
          season: newSeason,
          turn: newSeason === 'Spring' ? state.turn + 1 : state.turn
        }))

        // Produce resources
        get().produceResources()
        get().addToLog(`Season advanced to ${newSeason}`)
        
        if (newSeason === 'Winter') {
          get().handleWinterSurvival()
        }
      },

      // Fight another bear on the same space
      fightBear: (attackerSpaceId: string, defenderSpaceId: string) => {
        const state = get()
        const attackerSpace = state.board.spaces[attackerSpaceId]
        const defenderSpace = state.board.spaces[defenderSpaceId]
        
        if (!attackerSpace?.piece || !defenderSpace?.piece) {
          get().addToLog(`Bears must be on same space to fight`)
          return false
        }
        
        if (attackerSpace.id !== defenderSpace.id) {
          get().addToLog(`Bears must be on same space to fight`)
          return false
        }
        
        const attacker = attackerSpace.piece
        const defender = defenderSpace.piece
        
        if (attacker.playerId === defender.playerId) {
          get().addToLog(`Bears from same player cannot fight each other`)
          return false
        }
        
        // Fight mechanics: larger bears (more fat + energy) are stronger
        const attackerStrength = attacker.fat + attacker.energy + attacker.emergencyEnergy
        const defenderStrength = defender.fat + defender.energy + defender.emergencyEnergy
        
        // Add some randomness (±20%)
        const attackerRoll = attackerStrength * (0.8 + Math.random() * 0.4)
        const defenderRoll = defenderStrength * (0.8 + Math.random() * 0.4)
        
        const winner = attackerRoll > defenderRoll ? attacker : defender
        const loser = attackerRoll > defenderRoll ? defender : attacker
        const winnerSpace = winner === attacker ? attackerSpace : defenderSpace
        
        // Winner gains bear meat based on loser's size
        const bearMeatGained = Math.max(1, Math.floor((loser.fat + loser.energy) / 5))
        
        // Remove loser from game
        const updatedSpaces = { ...state.board.spaces }
        updatedSpaces[defenderSpace.id] = {
          ...defenderSpace,
          piece: winner === defender ? defender : null
        }
        
        if (winner === attacker && attackerSpace.id !== defenderSpace.id) {
          updatedSpaces[attackerSpace.id] = {
            ...attackerSpace,
            piece: null
          }
        }
        
        // Update winner with bear meat
        if (winnerSpace.piece) {
          updatedSpaces[winnerSpace.id] = {
            ...winnerSpace,
            piece: {
              ...winner,
              resources: {
                ...winner.resources,
                bearMeat: winner.resources.bearMeat + bearMeatGained
              }
            }
          }
        }
        
        // Remove loser from players array
        const updatedPlayers = state.players.map(player => ({
          ...player,
          pieces: player.pieces.filter(piece => piece.id !== loser.id),
          pieceCount: {
            ...player.pieceCount,
            bears: player.pieces.filter(p => p.id !== loser.id && p.type === 'bear').length,
            cubs: player.pieces.filter(p => p.id !== loser.id && p.type === 'cub').length
          }
        }))
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: updatedPlayers
        }))
        
        get().addToLog(`🥊 ${winner.type} defeated ${loser.type} and gained ${bearMeatGained} bear meat!`)
        return true
      },

      // Convert fat to emergency energy at start of turn (before daily energy loss)
      convertFatToEmergencyEnergy: (spaceId: string, fatAmount: number) => {
        const state = get()
        const space = state.board.spaces[spaceId]
        
        if (!space?.piece) {
          get().addToLog('Cannot find bear for fat conversion')
          return false
        }
        
        // Use shared rules engine
        const result = convertFatToEmergencyEnergy(space.piece, fatAmount, DEFAULT_CONFIG)
        
        if (!result.success) {
          get().addToLog(result.message)
          return false
        }
        
        // Update game state
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: {
              ...state.board.spaces,
              [spaceId]: {
                ...space,
                piece: result.newPiece
              }
            }
          }
        }))
        
        get().addToLog(result.message)
        return true
      },

      nextPlayer: () => {
        const state = get()
        
        // Check for bears with 0 energy AND 0 fat and remove them (death check)
        const currentPlayer = state.players[state.currentPlayerIndex]
        const dyingPieces = currentPlayer.pieces.filter(piece => piece.energy === 0 && piece.fat === 0)
        
        if (dyingPieces.length > 0) {
          // Remove dying pieces from board and player
          const updatedSpaces = { ...state.board.spaces }
          const updatedPlayers = [...state.players]
          
          dyingPieces.forEach(dyingPiece => {
            // Remove from board
            Object.keys(updatedSpaces).forEach(spaceId => {
              if (updatedSpaces[spaceId].piece?.id === dyingPiece.id) {
                updatedSpaces[spaceId] = {
                  ...updatedSpaces[spaceId],
                  piece: null
                }
              }
            })
            
            // Update piece counts
            if (dyingPiece.type === 'bear') {
              updatedPlayers[state.currentPlayerIndex].pieceCount.bears--
            } else {
              updatedPlayers[state.currentPlayerIndex].pieceCount.cubs--
            }
            
            get().addToLog(`${currentPlayer.name}'s ${dyingPiece.type} died from starvation!`)
          })
          
          // Remove dying pieces from player's pieces array
          updatedPlayers[state.currentPlayerIndex].pieces = currentPlayer.pieces.filter(
            piece => piece.energy > 0
          )
          
          // Update state with removed pieces
          set(state => ({
            ...state,
            board: {
              ...state.board,
              spaces: updatedSpaces
            },
            players: updatedPlayers
          }))
        }
        
        const newPlayerIndex = (state.currentPlayerIndex + 1) % (state.players.length - 1)
        let newTurn = state.turn
        let newSeason = state.season
        let newYear = state.year
        
        // If we're back to player 0, increment turn counter
        if (newPlayerIndex === 0) {
          newTurn = state.turn + 1
          
          // Check if season should advance (every 7 turns)
          if (newTurn % 7 === 1 && newTurn > 1) {
            const seasons: GameState['season'][] = ['Spring', 'Summer', 'Autumn', 'Winter']
            const currentSeasonIndex = seasons.indexOf(state.season)
            newSeason = seasons[(currentSeasonIndex + 1) % seasons.length]
            
            // If we're going from Winter back to Spring, increment the year
            if (state.season === 'Winter' && newSeason === 'Spring') {
              newYear = state.year + 1
              get().addToLog(`Season changed to ${newSeason}! Year ${newYear} begins.`)
              
              // Wake up hibernating bears and spawn cubs
              get().wakeHibernatingBears()
            } else {
              get().addToLog(`Season changed to ${newSeason}!`)
            }
          }
        }
        
        set(state => ({
          ...state,
          currentPlayerIndex: newPlayerIndex,
          turn: newTurn,
          season: newSeason,
          year: newYear,
          turnPhase: 'movement', // Reset to first phase for new player
          energyTaxPaid: false // Reset energy tax payment for new player
        }))
        
        // Energy loss and fat burning are now player choices during movement phase
        
        get().addToLog(`Turn ${newTurn}: Player ${newPlayerIndex + 1}'s turn`)
      },

      // Local actions (not synced in multiplayer)
      selectSpace: (spaceId) => {
        const updatedSpaces = { ...get().board.spaces }
        Object.keys(updatedSpaces).forEach(id => {
          updatedSpaces[id] = {
            ...updatedSpaces[id],
            isSelected: id === spaceId
          }
        })
        
        set(state => ({
          ...state,
          selectedSpaceId: spaceId,
          selectedPieceId: state.board.spaces[spaceId]?.piece?.id || null,
          board: {
            ...state.board,
            spaces: updatedSpaces
          }
        }))
      },

      clearSelection: () => {
        const updatedSpaces = { ...get().board.spaces }
        Object.keys(updatedSpaces).forEach(id => {
          updatedSpaces[id] = {
            ...updatedSpaces[id],
            isSelected: false,
            isHighlighted: false
          }
        })
        
        set(state => ({
          ...state,
          selectedSpaceId: null,
          selectedPieceId: null,
          highlightedSpaces: [],
          board: {
            ...state.board,
            spaces: updatedSpaces
          }
        }))
      },

      highlightValidMoves: (spaceId) => {
        const state = get()
        const selectedSpace = state.board.spaces[spaceId]
        
        if (!selectedSpace?.piece) return
        
        // Only highlight moves during movement phase
        if (state.turnPhase !== 'movement') return

        // Find all adjacent empty spaces
        const validMoves = Object.values(state.board.spaces).filter(space => 
          space.id !== spaceId && // not the same space
          !space.piece && // empty space
          get().areSpacesAdjacent(spaceId, space.id) // adjacent
        )

        const validMoveIds = validMoves.map(s => s.id)
        
        const updatedSpaces = { ...state.board.spaces }
        Object.keys(updatedSpaces).forEach(id => {
          updatedSpaces[id] = {
            ...updatedSpaces[id],
            isHighlighted: validMoveIds.includes(id)
          }
        })

        set(state => ({
          ...state,
          highlightedSpaces: validMoveIds,
          board: {
            ...state.board,
            spaces: updatedSpaces
          }
        }))

        get().addToLog(`Highlighted ${validMoveIds.length} valid moves`)
      },

      addToLog: (message) => {
        const timestamp = new Date().toLocaleTimeString()
        set(state => ({
          ...state,
          gameLog: [...state.gameLog, `[${timestamp}] ${message}`].slice(-20)
        }))
      },

      setHoveredSpace: (spaceId) => {
        set(state => ({
          ...state,
          hoveredSpaceId: spaceId
        }))
      },

      toggleRules: () => {
        set(state => ({ ...state, showRules: !state.showRules }))
      },

      resetGame: () => {
        // Disconnect from multiplayer if connected
        if (get().isMultiplayer) {
          get().disconnectFromRoom()
        }

        set({
          board: createInitialBoard(),
          players: createInitialPlayers(),
          currentPlayerIndex: 0,
          season: 'Spring',
          year: 1,
          turn: 0,
          gamePhase: 'setup',
          selectedSpaceId: null,
          selectedPieceId: null,
          highlightedSpaces: [],
          hoveredSpaceId: null,
          showRules: false,
          gameLog: [],
          isMultiplayer: false,
          roomId: null,
          isConnected: false,
          playerName: ''
        })
      },

      // Utility functions (same implementation as before)
      calculateScore: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)
        if (!player) return 0

        const totalResources = player.pieces.reduce((total, piece) => ({
          grains: total.grains + piece.resources.grains,
          berries: total.berries + piece.resources.berries,
          salmon: total.salmon + piece.resources.salmon,
          honey: total.honey + piece.resources.honey,
          bearMeat: total.bearMeat + piece.resources.bearMeat
        }), { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 })
        
        const totalEnergy = player.pieces.reduce((total, piece) => total + piece.energy, 0)
        
        const resourceScore = 
          totalResources.grains * 1 +
          totalResources.berries * 2 +
          totalResources.salmon * 3 +
          totalResources.honey * 5 +
          totalResources.bearMeat * 8 +
          totalEnergy * 4

        const territoryScore = get().getPlayerTerritories(playerId).length * 2
        return resourceScore + territoryScore
      },

      getPlayerTerritories: (playerId) => {
        const state = get()
        return Object.values(state.board.spaces)
          .filter(space => String(space.piece?.playerId) === String(playerId))
          .map(space => space.id)
      },

      areSpacesAdjacent: (spaceId1, spaceId2) => {
        const state = get()
        const space1 = state.board.spaces[spaceId1]
        
        if (!space1) return false
        
        // Use pre-calculated adjacency list
        return space1.adjacentSpaces.includes(spaceId2)
      },

      // Helper methods (same as before)
      produceResources: () => {
        const state = get()
        const production = SEASONAL_PRODUCTION[state.season]

        // Give resources to each bear based on their location
        const updatedSpaces = { ...state.board.spaces }
        
        Object.values(state.board.spaces).forEach(space => {
          if (!space.piece || !space.canProduce) return

          const newResources = { ...space.piece.resources }
          const newEnergy = space.piece.energy
          
          switch (space.quadrant) {
            case 'Pastures':
              newResources.grains += production.grains
              break
            case 'Forests':
              newResources.berries += production.berries
              if (space.hasHoney) {
                newResources.honey += production.honey
              }
              break
            case 'Riverlands':
              newResources.salmon += production.salmon
              break
          }

          updatedSpaces[space.id] = {
            ...space,
            piece: {
              ...space.piece,
              resources: newResources,
              energy: Math.min(20, newEnergy)
            }
          }
        })
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: state.players.map(player => ({
            ...player,
            pieces: player.pieces.map(piece => {
              const space = state.board.spaces[piece.spaceId]
              if (!space?.canProduce) return piece

              const newResources = { ...piece.resources }
              const newEnergy = piece.energy
              
              switch (space.quadrant) {
                case 'Pastures':
                  newResources.grains += production.grains
                  break
                case 'Forests':
                  newResources.berries += production.berries
                  break
                case 'Riverlands':
                  newResources.salmon += production.salmon
                  break
              }

              return {
                ...piece,
                resources: newResources,
                energy: Math.min(20, newEnergy)
              }
            })
          }))
        }))
      },

      handleWinterSurvival: () => {
        const state = get()
        const bearsPlayer = state.players.find(p => p.id === 'bears')
        if (!bearsPlayer) return

        const survivingBears = bearsPlayer.pieces.filter(bear => {
          const space = state.board.spaces[bear.spaceId]
          if (space?.subArea === 'Caves') {
            get().addToLog('Bear survived winter in caves')
            return true
          } else if (space?.subArea === 'Hunting Grounds') {
            const survived = Math.random() > 0.5
            get().addToLog(survived ? 'Bear survived hunting ground competition' : 'Bear perished in hunting grounds')
            return survived
          }
          return true
        })

        const updatedSpaces = { ...state.board.spaces }
        
        Object.values(state.board.spaces).forEach(space => {
          if (space.piece?.type === 'bear' && !survivingBears.find(b => b.id === space.piece?.id)) {
            updatedSpaces[space.id] = { ...space, piece: null }
          }
        })
        
        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: state.players.map(player => 
            player.id === 'bears' ? { ...player, pieces: survivingBears } : player
          )
        }))
      }
    }),
    { name: 'game-store' }
  )
)