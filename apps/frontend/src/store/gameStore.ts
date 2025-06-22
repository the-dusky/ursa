import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

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
  }
  energy: number
  fat: number
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
  exchangeResources: (fromPieceId: string, toPieceId: string, resourceType: 'grains' | 'berries' | 'salmon', amount: number) => boolean
  transferEnergy: (fromPieceId: string, toPieceId: string, amount: number) => boolean
  
  // Turn phase actions
  eatFood: (pieceId: string, resourceType: 'grains' | 'berries' | 'salmon', amount: number, convertTo: 'energy' | 'fat') => boolean
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

const SEASONAL_PRODUCTION = {
  Spring: { grains: 4, berries: 1, salmon: 0, energy: 1 },
  Summer: { grains: 3, berries: 3, salmon: 0, energy: 2 },
  Autumn: { grains: 3, berries: 2, salmon: 1, energy: 3 },
  Winter: { grains: 1, berries: 0, salmon: 0, energy: 0 }
}

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
            salmon: 0
          },
          energy: 5,
          fat: 0
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
            salmon: 0
          },
          energy: 5,
          fat: 0
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
            salmon: 2
          },
          energy: 3,
          fat: 0
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
        
        const piece = state.players.flatMap(p => p.pieces).find(p => p.id === pieceId)
        const newSpace = state.board.spaces[newSpaceId]
        const oldSpace = Object.values(state.board.spaces).find(s => s.piece?.id === pieceId)

        if (!piece || !newSpace || !oldSpace || newSpace.piece) {
          return false
        }

        if (!get().areSpacesAdjacent(oldSpace.id, newSpaceId)) {
          return false
        }

        // Movement costs depend on fat level: 1 energy per space if ≤10 fat, 2 energy per space if >10 fat
        const currentPiece = oldSpace.piece!
        const movementCost = currentPiece.fat > 10 ? 2 : 1
        
        let energySource = ''
        const newResources = { ...currentPiece.resources }
        let newEnergy = currentPiece.energy
        const newFat = currentPiece.fat

        if (currentPiece.energy >= movementCost) {
          // Use energy reserves
          newEnergy -= movementCost
          energySource = `${movementCost} energy (${currentPiece.fat > 10 ? 'heavy' : 'light'})`
        } else {
          get().addToLog(`Bear has insufficient energy to move! Needs ${movementCost}, has ${currentPiece.energy}`)
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

        // Check if bear has enough resources
        if (pieceSpace.piece.resources[resourceType] < amount) {
          get().addToLog(`Not enough ${resourceType} to eat`)
          return false
        }

        // Calculate conversion based on food type and destination
        let conversionAmount = 0
        if (convertTo === 'energy') {
          // Energy conversion rates: Grain=3, Berries=2, Salmon=1 energy per unit
          const energyRates = { grains: 3, berries: 2, salmon: 1 }
          conversionAmount = amount * energyRates[resourceType]
        } else {
          // Fat conversion rates: Grain=1, Berries=2, Salmon=4 fat per unit
          const fatRates = { grains: 1, berries: 2, salmon: 4 }
          conversionAmount = amount * fatRates[resourceType]
        }

        // Update pieces with direct conversion
        const updatedSpaces = { ...state.board.spaces }
        
        Object.values(state.board.spaces).forEach(s => {
          if (s.piece?.id === pieceId) {
            updatedSpaces[s.id] = {
              ...s,
              piece: {
                ...s.piece,
                resources: {
                  ...s.piece.resources,
                  [resourceType]: s.piece.resources[resourceType] - amount
                },
                energy: convertTo === 'energy' ? s.piece.energy + conversionAmount : s.piece.energy,
                fat: convertTo === 'fat' ? s.piece.fat + conversionAmount : s.piece.fat
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
                return {
                  ...piece,
                  resources: {
                    ...piece.resources,
                    [resourceType]: piece.resources[resourceType] - amount
                  },
                  energy: convertTo === 'energy' ? piece.energy + conversionAmount : piece.energy,
                  fat: convertTo === 'fat' ? piece.fat + conversionAmount : piece.fat
                }
              }
              return piece
            })
          }))
        }))

        get().addToLog(`Bear ate ${amount} ${resourceType} → gained ${conversionAmount} ${convertTo}`)
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
        const player = state.players.find(p => String(p.id) === String(playerId))
        if (!player) {
          get().addToLog('Player not found')
          return false
        }

        const production = SEASONAL_PRODUCTION[state.season]
        const totalHarvested = { grains: 0, berries: 0, salmon: 0 }
        let bearsHarvested = 0
        
        const updatedSpaces = { ...state.board.spaces }
        
        // Update spaces
        Object.values(state.board.spaces).forEach(space => {
          if (space.piece && String(space.piece.playerId) === String(playerId) && space.canProduce) {
            const newResources = { ...space.piece.resources }
            
            switch (space.quadrant) {
              case 'Pastures':
                newResources.grains += production.grains
                totalHarvested.grains += production.grains
                break
              case 'Forests':
                newResources.berries += production.berries
                totalHarvested.berries += production.berries
                break
              case 'Riverlands':
                newResources.salmon += production.salmon
                totalHarvested.salmon += production.salmon
                break
            }

            updatedSpaces[space.id] = {
              ...space,
              piece: {
                ...space.piece,
                resources: newResources
              }
            }
            bearsHarvested++
          }
        })
        
        // Update player pieces
        const updatedPlayers = state.players.map(p => {
          if (String(p.id) === String(playerId)) {
            return {
              ...p,
              pieces: p.pieces.map(piece => {
                const space = state.board.spaces[piece.spaceId]
                if (space && space.canProduce) {
                  const newResources = { ...piece.resources }
                  
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

                  return { ...piece, resources: newResources }
                }
                return piece
              })
            }
          }
          return p
        })

        set(state => ({
          ...state,
          board: {
            ...state.board,
            spaces: updatedSpaces
          },
          players: updatedPlayers
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
                  energy: toSpace.piece.energy + amount
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
        
        // Lose 1 energy at start of turn
        const newEnergy = Math.max(0, piece.energy - 1)
        
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
                  energy: newEnergy
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
                  energy: newEnergy
                }
              }
              return playerPiece
            })
          }))
        }))
        
        if (newEnergy === 0) {
          get().addToLog(`Bear lost 1 energy at turn start and now has 0 energy!`)
        } else {
          get().addToLog(`Bear lost 1 energy at turn start (${newEnergy} remaining) ⚡`)
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
                  isHibernating: true
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
                  isHibernating: true
                }
              }
              return playerPiece
            })
          }))
        }))
        
        get().addToLog(`Bear entered hibernation in the Mountains 💤`)
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
                    resources: { grains: 0, berries: 0, salmon: 0 },
                    energy: 3, // Cubs start with 3 energy
                    fat: 0
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

      nextPlayer: () => {
        const state = get()
        
        // Check for bears with 0 energy and remove them (death check)
        const currentPlayer = state.players[state.currentPlayerIndex]
        const dyingPieces = currentPlayer.pieces.filter(piece => piece.energy === 0)
        
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
          turnPhase: 'movement' // Reset to first phase for new player
        }))
        
        // All bears lose 1 energy at the start of their turn (except hibernating bears)
        const newPlayer = get().players[newPlayerIndex]
        newPlayer.pieces.forEach(piece => {
          if (!piece.isHibernating) {
            get().loseTurnEnergy(piece.id)
          }
        })
        
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
          salmon: total.salmon + piece.resources.salmon
        }), { grains: 0, berries: 0, salmon: 0 })
        
        const totalEnergy = player.pieces.reduce((total, piece) => total + piece.energy, 0)
        
        const resourceScore = 
          totalResources.grains * 1 +
          totalResources.berries * 2 +
          totalResources.salmon * 3 +
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
          let newEnergy = space.piece.energy
          
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
          // All bears gain energy regardless of location (from eating food)
          newEnergy += production.energy

          updatedSpaces[space.id] = {
            ...space,
            piece: {
              ...space.piece,
              resources: newResources,
              energy: newEnergy
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
              let newEnergy = piece.energy
              
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
              // All bears gain energy regardless of location (from eating food)
              newEnergy += production.energy

              return {
                ...piece,
                resources: newResources,
                energy: newEnergy
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