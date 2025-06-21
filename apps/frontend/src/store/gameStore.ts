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
  type: 'bear' | 'cub'
  health?: number
  resources: {
    grains: number
    berries: number
    salmon: number
  }
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
  placePiece: (playerId: string | number, spaceId: number, pieceType?: 'bear' | 'cub') => boolean
  movePiece: (pieceId: string, newSpaceId: number) => boolean
  exchangeResources: (fromPieceId: string, toPieceId: string, resourceType: 'grains' | 'berries' | 'salmon', amount: number) => boolean
  advanceSeason: () => void
  nextPlayer: () => void
  
  // Local actions (UI only)
  selectSpace: (spaceId: number) => void
  clearSelection: () => void
  highlightValidMoves: (spaceId: number) => void
  addToLog: (message: string) => void
  toggleRules: () => void
  resetGame: () => void
  
  // Utility functions
  calculateScore: (playerId: string | number) => number
  getPlayerTerritories: (playerId: string | number) => number[]
  areSpacesAdjacent: (spaceId1: number, spaceId2: number) => boolean
  produceResources: () => void
  handleWinterSurvival: () => void
}

// Y.js integration
let yjsDoc: Y.Doc | null = null
let yjsProvider: WebsocketProvider | null = null
let gameStateMap: Y.Map<unknown> | null = null

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
        
        // Each player starts with 1 adult bear
        const player1StartSpace = 25  // Middle ring in Mountains
        const player2StartSpace = 105 // Middle ring in Forests
        
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
          }
        }
        newSpaces[player1StartSpace].piece = p1Bear
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
          }
        }
        newSpaces[player2StartSpace].piece = p2Bear
        newPlayers[1].pieces.push(p2Bear)
        newPlayers[1].pieceCount.bears = 1

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
      placePiece: (playerId, spaceId, pieceType: 'bear' | 'cub' = 'bear') => {
        const state = get()
        const space = state.spaces.find(s => s.id === spaceId)
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
            grains: 0,
            berries: 0,
            salmon: 0
          }
        }

        set(state => ({
          ...state,
          spaces: state.spaces.map(s => 
            s.id === spaceId ? { ...s, piece } : s
          ),
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

      exchangeResources: (fromPieceId, toPieceId, resourceType, amount) => {
        const state = get()
        
        // Find the pieces
        const fromPiece = state.spaces.find(s => s.piece?.id === fromPieceId)?.piece
        const toPiece = state.spaces.find(s => s.piece?.id === toPieceId)?.piece
        
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
        set(state => ({
          ...state,
          spaces: state.spaces.map(s => {
            if (s.piece?.id === fromPieceId) {
              return {
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
              return {
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
            return s
          }),
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

      highlightValidMoves: (spaceId) => {
        const state = get()
        const selectedSpace = state.spaces.find(s => s.id === spaceId)
        
        if (!selectedSpace?.piece) return

        // Find all adjacent empty spaces
        const validMoves = state.spaces.filter(space => 
          space.id !== spaceId && // not the same space
          !space.piece && // empty space
          get().areSpacesAdjacent(spaceId, space.id) // adjacent
        )

        const validMoveIds = validMoves.map(s => s.id)

        set(state => ({
          ...state,
          highlightedSpaces: validMoveIds,
          spaces: state.spaces.map(s => ({
            ...s,
            isHighlighted: validMoveIds.includes(s.id)
          }))
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

        const totalResources = player.pieces.reduce((total, piece) => ({
          grains: total.grains + piece.resources.grains,
          berries: total.berries + piece.resources.berries,
          salmon: total.salmon + piece.resources.salmon
        }), { grains: 0, berries: 0, salmon: 0 })
        
        const resourceScore = 
          totalResources.grains * 1 +
          totalResources.berries * 2 +
          totalResources.salmon * 3

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

        const ringDiff = Math.abs(space1.ring - space2.ring)
        const segmentDiff = Math.abs(space1.segment - space2.segment)
        
        // Handle wrap-around for segments (circular nature of the board)
        const ring1Segments = [20, 25, 30, 35, 40][space1.ring]
        const ring2Segments = [20, 25, 30, 35, 40][space2.ring]
        const segmentDiffWrap1 = Math.min(segmentDiff, ring1Segments - segmentDiff)
        const segmentDiffWrap2 = Math.min(segmentDiff, ring2Segments - segmentDiff)
        const minSegmentDiff = Math.min(segmentDiffWrap1, segmentDiffWrap2)

        // Adjacent if:
        // 1. Same ring, adjacent segments (including wrap-around)
        // 2. Same segment, adjacent rings  
        // 3. Adjacent ring AND adjacent segment (diagonal)
        return (ringDiff === 0 && minSegmentDiff <= 1) || 
               (space1.segment === space2.segment && ringDiff <= 1) ||
               (ringDiff <= 1 && minSegmentDiff <= 1)
      },

      // Helper methods (same as before)
      produceResources: () => {
        const state = get()
        const production = SEASONAL_PRODUCTION[state.season]

        // Give resources to each bear based on their location
        set(state => ({
          ...state,
          spaces: state.spaces.map(space => {
            if (!space.piece || !space.canProduce) return space

            const newResources = { ...space.piece.resources }
            
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
              ...space,
              piece: {
                ...space.piece,
                resources: newResources
              }
            }
          }),
          players: state.players.map(player => ({
            ...player,
            pieces: player.pieces.map(piece => {
              const space = state.spaces.find(s => s.id === piece.spaceId)
              if (!space?.canProduce) return piece

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

              return {
                ...piece,
                resources: newResources
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