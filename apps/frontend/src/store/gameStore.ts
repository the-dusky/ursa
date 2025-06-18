import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// Types (same as before)
export interface GameSpace {
  id: number
  ring: number
  segment: number
  angle: number
  quadrant: 'Mountains' | 'Pastures' | 'Forests' | 'Riverlands'
  subArea?: 'Caves' | 'Hunting Grounds'
  piece: GamePiece | null
  canProduce: boolean
  isSelected?: boolean
  isHighlighted?: boolean
}

export interface GamePiece {
  id: string
  playerId: string | number
  spaceId: number
  type: 'player' | 'bear'
  isKing?: boolean
  health?: number
}

export interface Player {
  id: string | number
  name: string
  color: string
  resources: {
    grains: number
    berries: number
    salmon: number
  }
  pieces: GamePiece[]
  score: number
}

export interface GameState {
  // Game data
  spaces: GameSpace[]
  players: Player[]
  currentPlayerIndex: number
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter'
  turn: number
  gamePhase: 'setup' | 'playing' | 'ended'
  
  // UI state (local only - not synced)
  selectedSpaceId: number | null
  selectedPieceId: string | null
  highlightedSpaces: number[]
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
  placePiece: (playerId: string | number, spaceId: number) => boolean
  movePiece: (pieceId: string, newSpaceId: number) => boolean
  advanceSeason: () => void
  nextPlayer: () => void
  
  // Local actions (UI only)
  selectSpace: (spaceId: number) => void
  clearSelection: () => void
  addToLog: (message: string) => void
  toggleRules: () => void
  resetGame: () => void
  
  // Utility functions
  calculateScore: (playerId: string | number) => number
  getPlayerTerritories: (playerId: string | number) => number[]
  areSpacesAdjacent: (spaceId1: number, spaceId2: number) => boolean
}

// Y.js integration
let yjsDoc: Y.Doc | null = null
let yjsProvider: WebsocketProvider | null = null
let gameStateMap: Y.Map<any> | null = null

const SEASONAL_PRODUCTION = {
  Spring: { grains: 2, berries: 1, salmon: 3 },
  Summer: { grains: 3, berries: 3, salmon: 2 },
  Autumn: { grains: 3, berries: 2, salmon: 1 },
  Winter: { grains: 1, berries: 0, salmon: 1 }
}

// Helper functions (same as before)
const createInitialSpaces = (): GameSpace[] => {
  const spaces: GameSpace[] = []
  const rings = [20, 25, 30, 35, 40]
  let spaceId = 0

  rings.forEach((spaceCount, ring) => {
    for (let segment = 0; segment < spaceCount; segment++) {
      const angle = (segment / spaceCount) * 2 * Math.PI
      const quadrant = getQuadrantFromAngle(angle)
      
      spaces.push({
        id: spaceId++,
        ring,
        segment,
        angle,
        quadrant,
        subArea: quadrant === 'Mountains' ? getMountainSubArea(ring) : undefined,
        piece: null,
        canProduce: quadrant !== 'Mountains'
      })
    }
  })

  return spaces
}

const getQuadrantFromAngle = (angle: number): GameSpace['quadrant'] => {
  if (angle >= 0 && angle < Math.PI/2) return 'Mountains'
  if (angle >= Math.PI/2 && angle < Math.PI) return 'Pastures'
  if (angle >= Math.PI && angle < 3*Math.PI/2) return 'Forests'
  return 'Riverlands'
}

const getMountainSubArea = (ring: number): 'Caves' | 'Hunting Grounds' => {
  return ring <= 2 ? 'Caves' : 'Hunting Grounds'
}

const createInitialPlayers = (): Player[] => [
  {
    id: 1,
    name: 'Player 1',
    color: '#E74C3C',
    resources: { grains: 0, berries: 0, salmon: 0 },
    pieces: [],
    score: 0
  },
  {
    id: 2, 
    name: 'Player 2',
    color: '#3498DB',
    resources: { grains: 0, berries: 0, salmon: 0 },
    pieces: [],
    score: 0
  },
  {
    id: 'bears',
    name: 'Bears',
    color: '#8B4513',
    resources: { grains: 0, berries: 0, salmon: 0 },
    pieces: [],
    score: 0
  }
]

export const useGameStore = create<GameState>()(
  devtools(
    (set, get) => ({
      // Initial state
      spaces: createInitialSpaces(),
      players: createInitialPlayers(),
      currentPlayerIndex: 0,
      season: 'Spring',
      turn: 0,
      gamePhase: 'setup',
      selectedSpaceId: null,
      selectedPieceId: null,
      highlightedSpaces: [],
      showRules: false,
      gameLog: [],
      isMultiplayer: false,
      roomId: null,
      isConnected: false,
      playerName: '',

      // Initialize single player game
      initializeGame: () => {
        const newSpaces = createInitialSpaces()
        const newPlayers = createInitialPlayers()
        
        // Place initial pieces (same logic as before)
        const player1Spaces = [5, 25, 45]
        const player2Spaces = [85, 105, 125]
        const bearSpaces = [1, 61, 81]
        
        player1Spaces.forEach((spaceId, index) => {
          const piece: GamePiece = {
            id: `p1-${index}`,
            playerId: 1,
            spaceId,
            type: 'player'
          }
          newSpaces[spaceId].piece = piece
          newPlayers[0].pieces.push(piece)
        })
        
        player2Spaces.forEach((spaceId, index) => {
          const piece: GamePiece = {
            id: `p2-${index}`,
            playerId: 2,
            spaceId,
            type: 'player'
          }
          newSpaces[spaceId].piece = piece
          newPlayers[1].pieces.push(piece)
        })
        
        bearSpaces.forEach((spaceId, index) => {
          const piece: GamePiece = {
            id: `bear-${index}`,
            playerId: 'bears',
            spaceId,
            type: 'bear',
            health: 1
          }
          newSpaces[spaceId].piece = piece
          newPlayers[2].pieces.push(piece)
        })

        set({
          spaces: newSpaces,
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
                spaces: yjsState.spaces || get().spaces,
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
                JSON.stringify(prev.spaces) === JSON.stringify(state.spaces) &&
                JSON.stringify(prev.players) === JSON.stringify(state.players) &&
                prev.currentPlayerIndex === state.currentPlayerIndex &&
                prev.season === state.season &&
                prev.turn === state.turn &&
                prev.gamePhase === state.gamePhase
              ) {
                return;
              }

              isUpdatingFromYjs = true

              gameStateMap!.set('spaces', state.spaces)
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
      placePiece: (playerId, spaceId) => {
        const state = get()
        const space = state.spaces.find(s => s.id === spaceId)
        const player = state.players.find(p => p.id === playerId)

        if (!space || !player || space.piece) {
          return false
        }

        const piece: GamePiece = {
          id: `${playerId}-${Date.now()}`,
          playerId,
          spaceId,
          type: playerId === 'bears' ? 'bear' : 'player'
        }

        set(state => ({
          ...state,
          spaces: state.spaces.map(s => 
            s.id === spaceId ? { ...s, piece } : s
          ),
          players: state.players.map(p =>
            p.id === playerId ? { ...p, pieces: [...p.pieces, piece] } : p
          )
        }))

        get().addToLog(`${player.name} placed piece on ${space.quadrant}`)
        return true
      },

      movePiece: (pieceId, newSpaceId) => {
        const state = get()
        const piece = state.players.flatMap(p => p.pieces).find(p => p.id === pieceId)
        const newSpace = state.spaces.find(s => s.id === newSpaceId)
        const oldSpace = state.spaces.find(s => s.piece?.id === pieceId)

        if (!piece || !newSpace || !oldSpace || newSpace.piece) {
          return false
        }

        if (!get().areSpacesAdjacent(oldSpace.id, newSpaceId)) {
          return false
        }

        set(state => ({
          ...state,
          spaces: state.spaces.map(s => {
            if (s.id === oldSpace.id) return { ...s, piece: null }
            if (s.id === newSpaceId) return { ...s, piece: { ...piece, spaceId: newSpaceId } }
            return s
          }),
          players: state.players.map(p => ({
            ...p,
            pieces: p.pieces.map(piece => 
              piece.id === pieceId ? { ...piece, spaceId: newSpaceId } : piece
            )
          }))
        }))

        get().addToLog(`Moved piece from ${oldSpace.quadrant} to ${newSpace.quadrant}`)
        return true
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
        set(state => ({
          ...state,
          currentPlayerIndex: (state.currentPlayerIndex + 1) % (state.players.length - 1)
        }))
      },

      // Local actions (not synced in multiplayer)
      selectSpace: (spaceId) => {
        set(state => ({
          ...state,
          selectedSpaceId: spaceId,
          selectedPieceId: state.spaces.find(s => s.id === spaceId)?.piece?.id || null,
          spaces: state.spaces.map(s => ({
            ...s,
            isSelected: s.id === spaceId
          }))
        }))
      },

      clearSelection: () => {
        set(state => ({
          ...state,
          selectedSpaceId: null,
          selectedPieceId: null,
          highlightedSpaces: [],
          spaces: state.spaces.map(s => ({
            ...s,
            isSelected: false,
            isHighlighted: false
          }))
        }))
      },

      addToLog: (message) => {
        const timestamp = new Date().toLocaleTimeString()
        set(state => ({
          ...state,
          gameLog: [...state.gameLog, `[${timestamp}] ${message}`].slice(-20)
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
          spaces: createInitialSpaces(),
          players: createInitialPlayers(),
          currentPlayerIndex: 0,
          season: 'Spring',
          turn: 0,
          gamePhase: 'setup',
          selectedSpaceId: null,
          selectedPieceId: null,
          highlightedSpaces: [],
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

        const resourceScore = 
          player.resources.grains * 1 +
          player.resources.berries * 2 +
          player.resources.salmon * 3

        const territoryScore = get().getPlayerTerritories(playerId).length * 2
        return resourceScore + territoryScore
      },

      getPlayerTerritories: (playerId) => {
        const state = get()
        return state.spaces
          .filter(space => space.piece?.playerId === playerId)
          .map(space => space.id)
      },

      areSpacesAdjacent: (spaceId1, spaceId2) => {
        const state = get()
        const space1 = state.spaces.find(s => s.id === spaceId1)
        const space2 = state.spaces.find(s => s.id === spaceId2)
        
        if (!space1 || !space2) return false

        const sameRing = space1.ring === space2.ring
        const sameSegment = space1.segment === space2.segment
        const ringDiff = Math.abs(space1.ring - space2.ring)
        const segmentDiff = Math.abs(space1.segment - space2.segment)

        return (sameRing && segmentDiff <= 1) || (sameSegment && ringDiff <= 1)
      },

      // Helper methods (same as before)
      produceResources: () => {
        const state = get()
        const production = SEASONAL_PRODUCTION[state.season]

        set(state => ({
          ...state,
          players: state.players.map(player => {
            if (player.id === 'bears') return player

            const territories = get().getPlayerTerritories(player.id)
            let newResources = { ...player.resources }

            territories.forEach(territoryId => {
              const space = state.spaces.find(s => s.id === territoryId)
              if (space?.canProduce) {
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
            })

            return { ...player, resources: newResources }
          })
        }))
      },

      handleWinterSurvival: () => {
        const state = get()
        const bearsPlayer = state.players.find(p => p.id === 'bears')
        if (!bearsPlayer) return

        const survivingBears = bearsPlayer.pieces.filter(bear => {
          const space = state.spaces.find(s => s.id === bear.spaceId)
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

        set(state => ({
          ...state,
          spaces: state.spaces.map(space => {
            if (space.piece?.type === 'bear' && !survivingBears.find(b => b.id === space.piece?.id)) {
              return { ...space, piece: null }
            }
            return space
          }),
          players: state.players.map(player => 
            player.id === 'bears' ? { ...player, pieces: survivingBears } : player
          )
        }))
      }
    }),
    { name: 'game-store' }
  )
)