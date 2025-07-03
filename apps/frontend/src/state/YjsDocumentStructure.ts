/**
 * Y.js Document Structure - Proper CRDT Architecture
 * 
 * This file defines the proper Y.js document structure for the game,
 * using appropriate Y.js data types for automatic conflict resolution.
 * 
 * Key Principles:
 * 1. Use Y.Array for ordered collections (players, pieces, spaces)
 * 2. Use Y.Map for keyed objects (board data, resources)
 * 3. Use Y.Text for collaborative text editing (future chat)
 * 4. Nest Y.js types for deep CRDT benefits
 */

import * as Y from 'yjs'
import type { 
  CoreGameState, 
  Player, 
  GamePiece, 
  GameSpace, 
  GameBoard,
  DiceRoll,
  DiceState,
  GameResources,
  Season,
  GamePhase,
  TurnPhase
} from './CoreGameState'

// Re-export types for consumers
export type { 
  Player, 
  GamePiece, 
  GameSpace, 
  GameResources,
  DiceState,
  GamePhase,
  Season
}

// Helper to safely call callbacks with error handling
const safeCall = <T extends any[]>(callback: (...args: T) => void, onError?: (error: Error) => void, ...args: T) => {
  try {
    callback(...args)
  } catch (error) {
    console.error('Error in Y.js observer callback:', error)
    onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Y.js Document Schema Definition
 * Defines the structure of our Y.js document for type safety
 */
export interface YjsGameDocument {
  // Root document
  doc: Y.Doc
  
  // Game state scalars (Y.Map)
  gameState: Y.Map<any>
  
  // Collections (Y.Array)
  players: Y.Array<Y.Map<any>>
  spaces: Y.Array<Y.Map<any>>
  
  // Complex structures (Y.Map)
  board: Y.Map<any>
  diceState: Y.Map<any>
  gameConfig: Y.Map<any>
  
  // Room management (Y.Map)
  roomState: Y.Map<any>
  connectedUsers: Y.Map<any>
}

/**
 * Create a properly structured Y.js document
 */
export function createYjsDocument(): YjsGameDocument {
  const doc = new Y.Doc()
  
  return {
    doc,
    gameState: doc.getMap('gameState'),
    players: doc.getArray('players'),
    spaces: doc.getArray('spaces'),
    board: doc.getMap('board'),
    diceState: doc.getMap('diceState'),
    gameConfig: doc.getMap('gameConfig'),
    roomState: doc.getMap('roomState'),
    connectedUsers: doc.getMap('connectedUsers')
  }
}

/**
 * Initialize Y.js document with proper structure
 */
export function initializeYjsDocument(yjsDoc: YjsGameDocument, initialState?: Partial<CoreGameState>): void {
  yjsDoc.doc.transact(() => {
    // Initialize game state scalars
    yjsDoc.gameState.set('gameId', initialState?.gameId || `game-${Date.now()}`)
    yjsDoc.gameState.set('gamePhase', initialState?.gamePhase || 'dice_roll')
    yjsDoc.gameState.set('turnPhase', initialState?.turnPhase || 'movement')
    yjsDoc.gameState.set('currentPlayerIndex', initialState?.currentPlayerIndex || 0)
    yjsDoc.gameState.set('season', initialState?.season || 'Spring')
    yjsDoc.gameState.set('year', initialState?.year || 1)
    yjsDoc.gameState.set('turn', initialState?.turn || 1)
    yjsDoc.gameState.set('energyTaxPaid', initialState?.energyTaxPaid || false)
    yjsDoc.gameState.set('isGameStarted', initialState?.isGameStarted || false)
    yjsDoc.gameState.set('createdAt', initialState?.createdAt || Date.now())
    
    // Initialize board structure
    yjsDoc.board.set('rings', new Y.Map())
    yjsDoc.board.set('bridges', new Y.Map())
    yjsDoc.board.set('rotations', Y.Array.from(initialState?.board?.rotations || []))
    
    // Initialize dice state
    yjsDoc.diceState.set('isRolling', false)
    yjsDoc.diceState.set('positionRolls', null)
    yjsDoc.diceState.set('directionRolls', null)
    yjsDoc.diceState.set('rotations', Y.Array.from([]))
    
    // Initialize game config
    yjsDoc.gameConfig.set('maxPlayers', 4)
    yjsDoc.gameConfig.set('maxBears', 5)
    yjsDoc.gameConfig.set('maxCubs', 10)
  })
}

/**
 * Convert a Player to Y.js structure
 */
export function playerToYjs(player: Player): Y.Map<any> {
  const playerMap = new Y.Map()
  
  playerMap.set('id', player.id)
  playerMap.set('name', player.name)
  playerMap.set('color', player.color)
  playerMap.set('score', player.score)
  playerMap.set('isActive', player.isActive)
  playerMap.set('playerNumber', player.playerNumber)
  
  // Piece count as Y.Map
  const pieceCount = new Y.Map()
  pieceCount.set('bears', player.pieceCount.bears)
  pieceCount.set('cubs', player.pieceCount.cubs)
  pieceCount.set('maxBears', player.pieceCount.maxBears)
  pieceCount.set('maxCubs', player.pieceCount.maxCubs)
  playerMap.set('pieceCount', pieceCount)
  
  // Arrays as Y.Array
  playerMap.set('barrenSpaces', Y.Array.from(player.barrenSpaces))
  playerMap.set('harvestedThisTurn', Y.Array.from(player.harvestedThisTurn))
  
  // Pieces as Y.Array of Y.Map
  const piecesArray = new Y.Array()
  player.pieces.forEach(piece => {
    piecesArray.push([pieceToYjs(piece)])
  })
  playerMap.set('pieces', piecesArray)
  
  return playerMap
}

/**
 * Convert a GamePiece to Y.js structure
 */
export function pieceToYjs(piece: GamePiece): Y.Map<any> {
  const pieceMap = new Y.Map()
  
  pieceMap.set('id', piece.id)
  pieceMap.set('playerId', piece.playerId)
  pieceMap.set('spaceId', piece.spaceId)
  pieceMap.set('type', piece.type)
  pieceMap.set('health', piece.health)
  pieceMap.set('energy', piece.energy)
  pieceMap.set('fat', piece.fat)
  pieceMap.set('emergencyEnergy', piece.emergencyEnergy)
  pieceMap.set('isHibernating', piece.isHibernating)
  pieceMap.set('movedThisTurn', piece.movedThisTurn)
  pieceMap.set('harvestedThisTurn', piece.harvestedThisTurn)
  
  // Resources as Y.Map
  const resources = new Y.Map()
  resources.set('grains', piece.resources.grains)
  resources.set('berries', piece.resources.berries)
  resources.set('salmon', piece.resources.salmon)
  resources.set('honey', piece.resources.honey)
  resources.set('bearMeat', piece.resources.bearMeat)
  pieceMap.set('resources', resources)
  
  return pieceMap
}

/**
 * Convert a GameSpace to Y.js structure
 */
export function spaceToYjs(space: GameSpace): Y.Map<any> {
  const spaceMap = new Y.Map()
  
  spaceMap.set('id', space.id)
  spaceMap.set('ring', space.ring)
  spaceMap.set('position', space.position)
  spaceMap.set('centerAngle', space.centerAngle)
  spaceMap.set('quadrant', space.quadrant)
  spaceMap.set('subArea', space.subArea)
  spaceMap.set('canProduce', space.canProduce)
  spaceMap.set('hasHoney', space.hasHoney)
  
  // Edge angles as Y.Map
  if (space.edgeAngles) {
    const edgeAngles = new Y.Map()
    edgeAngles.set('left', space.edgeAngles.left)
    edgeAngles.set('right', space.edgeAngles.right)
    spaceMap.set('edgeAngles', edgeAngles)
  }
  
  // Adjacent spaces as Y.Array
  spaceMap.set('adjacentSpaces', Y.Array.from(space.adjacentSpaces))
  
  // Piece reference (can be null)
  spaceMap.set('piece', space.piece ? pieceToYjs(space.piece) : null)
  
  return spaceMap
}

/**
 * Convert Y.js player structure back to Player object
 */
export function yjsToPlayer(playerMap: Y.Map<any>): Player {
  const pieces: GamePiece[] = []
  const piecesArray = playerMap.get('pieces') as Y.Array<Y.Map<any>>
  
  if (piecesArray) {
    piecesArray.forEach(pieceMap => {
      pieces.push(yjsToPiece(pieceMap))
    })
  }
  
  const pieceCountMap = playerMap.get('pieceCount') as Y.Map<any>
  const barrenSpacesArray = playerMap.get('barrenSpaces') as Y.Array<string>
  const harvestedArray = playerMap.get('harvestedThisTurn') as Y.Array<string>
  
  return {
    id: playerMap.get('id'),
    name: playerMap.get('name'),
    color: playerMap.get('color'),
    score: playerMap.get('score') || 0,
    isActive: playerMap.get('isActive'),
    playerNumber: playerMap.get('playerNumber'),
    pieceCount: {
      bears: pieceCountMap?.get('bears') || 0,
      cubs: pieceCountMap?.get('cubs') || 0,
      maxBears: pieceCountMap?.get('maxBears') || 5,
      maxCubs: pieceCountMap?.get('maxCubs') || 10
    },
    barrenSpaces: barrenSpacesArray ? barrenSpacesArray.toArray() : [],
    harvestedThisTurn: harvestedArray ? harvestedArray.toArray() : [],
    pieces
  }
}

/**
 * Convert Y.js piece structure back to GamePiece object
 */
export function yjsToPiece(pieceMap: Y.Map<any>): GamePiece {
  const resourcesMap = pieceMap.get('resources') as Y.Map<any>
  
  return {
    id: pieceMap.get('id'),
    playerId: pieceMap.get('playerId'),
    spaceId: pieceMap.get('spaceId'),
    type: pieceMap.get('type'),
    health: pieceMap.get('health'),
    energy: pieceMap.get('energy'),
    fat: pieceMap.get('fat'),
    emergencyEnergy: pieceMap.get('emergencyEnergy'),
    isHibernating: pieceMap.get('isHibernating'),
    movedThisTurn: pieceMap.get('movedThisTurn'),
    harvestedThisTurn: pieceMap.get('harvestedThisTurn'),
    resources: {
      grains: resourcesMap?.get('grains') || 0,
      berries: resourcesMap?.get('berries') || 0,
      salmon: resourcesMap?.get('salmon') || 0,
      honey: resourcesMap?.get('honey') || 0,
      bearMeat: resourcesMap?.get('bearMeat') || 0
    }
  }
}

/**
 * Convert Y.js space structure back to GameSpace object
 */
export function yjsToSpace(spaceMap: Y.Map<any>): GameSpace {
  const edgeAnglesMap = spaceMap.get('edgeAngles') as Y.Map<any>
  const adjacentArray = spaceMap.get('adjacentSpaces') as Y.Array<string>
  const pieceMap = spaceMap.get('piece') as Y.Map<any> | null
  
  return {
    id: spaceMap.get('id'),
    ring: spaceMap.get('ring'),
    position: spaceMap.get('position'),
    centerAngle: spaceMap.get('centerAngle'),
    quadrant: spaceMap.get('quadrant'),
    subArea: spaceMap.get('subArea'),
    canProduce: spaceMap.get('canProduce'),
    hasHoney: spaceMap.get('hasHoney'),
    edgeAngles: edgeAnglesMap ? {
      left: edgeAnglesMap.get('left'),
      right: edgeAnglesMap.get('right')
    } : undefined,
    adjacentSpaces: adjacentArray ? adjacentArray.toArray() : [],
    piece: pieceMap ? yjsToPiece(pieceMap) : null
  }
}

/**
 * Sync CoreGameState to Y.js document
 */
export function syncStateToYjs(yjsDoc: YjsGameDocument, state: CoreGameState): void {
  // Validate state before syncing
  if (!state || !state.players || !state.board || !state.board.rings) {
    console.warn('Invalid game state for Y.js sync:', state)
    return
  }
  
  yjsDoc.doc.transact(() => {
    // Update scalar fields
    yjsDoc.gameState.set('gameId', state.gameId)
    yjsDoc.gameState.set('gamePhase', state.gamePhase)
    yjsDoc.gameState.set('turnPhase', state.turnPhase)
    yjsDoc.gameState.set('currentPlayerIndex', state.currentPlayerIndex)
    yjsDoc.gameState.set('season', state.season)
    yjsDoc.gameState.set('year', state.year)
    yjsDoc.gameState.set('turn', state.turn)
    yjsDoc.gameState.set('energyTaxPaid', state.energyTaxPaid)
    yjsDoc.gameState.set('isGameStarted', state.isGameStarted)
    
    // Update players array
    yjsDoc.players.delete(0, yjsDoc.players.length)
    state.players.forEach(player => {
      yjsDoc.players.push([playerToYjs(player)])
    })
    
    // Update spaces array
    yjsDoc.spaces.delete(0, yjsDoc.spaces.length)
    Object.values(state.board.spaces).forEach(space => {
      yjsDoc.spaces.push([spaceToYjs(space)])
    })
    
    // Update board metadata
    const ringsMap = yjsDoc.board.get('rings') as Y.Map<any> || new Y.Map()
    Object.entries(state.board.rings).forEach(([ring, data]) => {
      const ringMap = new Y.Map()
      ringMap.set('spaceCount', data.spaceCount)
      ringMap.set('radius', data.radius)
      ringsMap.set(ring, ringMap)
    })
    yjsDoc.board.set('rings', ringsMap)
    
    // Update rotations
    const rotationsArray = yjsDoc.board.get('rotations') as Y.Array<number>
    if (rotationsArray) {
      rotationsArray.delete(0, rotationsArray.length)
      rotationsArray.push(state.board.rotations)
    }
    
    // Update dice state
    updateDiceStateToYjs(yjsDoc.diceState, state.diceState)
  })
}

/**
 * Update dice state in Y.js
 */
function updateDiceStateToYjs(diceStateMap: Y.Map<any>, diceState: DiceState): void {
  diceStateMap.set('isRolling', diceState.isRolling)
  
  // Position rolls
  if (diceState.positionRolls) {
    const positionRoll = new Y.Map()
    positionRoll.set('dice', Y.Array.from(diceState.positionRolls.dice))
    positionRoll.set('total', diceState.positionRolls.total)
    positionRoll.set('timestamp', diceState.positionRolls.timestamp)
    diceStateMap.set('positionRolls', positionRoll)
  } else {
    diceStateMap.set('positionRolls', null)
  }
  
  // Direction rolls
  if (diceState.directionRolls) {
    const directionRoll = new Y.Map()
    directionRoll.set('dice', Y.Array.from(diceState.directionRolls.dice))
    directionRoll.set('total', diceState.directionRolls.total)
    directionRoll.set('timestamp', diceState.directionRolls.timestamp)
    diceStateMap.set('directionRolls', directionRoll)
  } else {
    diceStateMap.set('directionRolls', null)
  }
  
  // Rotations
  const rotationsArray = diceStateMap.get('rotations') as Y.Array<number>
  if (rotationsArray) {
    rotationsArray.delete(0, rotationsArray.length)
    rotationsArray.push(diceState.rotations)
  } else {
    diceStateMap.set('rotations', Y.Array.from(diceState.rotations))
  }
}

/**
 * Reconstruct CoreGameState from Y.js document
 */
export function yjsToGameState(yjsDoc: YjsGameDocument): CoreGameState | null {
  try {
    // Get players
    const players: Player[] = []
    yjsDoc.players.forEach(playerMap => {
      if (playerMap instanceof Y.Map) {
        players.push(yjsToPlayer(playerMap))
      }
    })
    
    // Get spaces and reconstruct board
    const spaces: { [id: string]: GameSpace } = {}
    yjsDoc.spaces.forEach(spaceMap => {
      if (spaceMap instanceof Y.Map) {
        const space = yjsToSpace(spaceMap)
        spaces[space.id] = space
      }
    })
    
    // Get board metadata
    const ringsMap = yjsDoc.board.get('rings') as Y.Map<any>
    const rings: { [ring: number]: { spaceCount: number; radius: number } } = {}
    if (ringsMap) {
      ringsMap.forEach((ringData, ring) => {
        if (ringData instanceof Y.Map) {
          rings[parseInt(ring)] = {
            spaceCount: ringData.get('spaceCount'),
            radius: ringData.get('radius')
          }
        }
      })
    }
    
    // Get rotations
    const rotationsArray = yjsDoc.board.get('rotations') as Y.Array<number>
    const rotations = rotationsArray ? rotationsArray.toArray() : []
    
    // Get dice state
    const diceState = yjsToDiceState(yjsDoc.diceState)
    
    return {
      // Scalar fields
      gameId: yjsDoc.gameState.get('gameId'),
      gamePhase: yjsDoc.gameState.get('gamePhase'),
      turnPhase: yjsDoc.gameState.get('turnPhase'),
      currentPlayerIndex: yjsDoc.gameState.get('currentPlayerIndex') || 0,
      season: yjsDoc.gameState.get('season'),
      year: yjsDoc.gameState.get('year') || 1,
      turn: yjsDoc.gameState.get('turn') || 1,
      energyTaxPaid: yjsDoc.gameState.get('energyTaxPaid') || false,
      isGameStarted: yjsDoc.gameState.get('isGameStarted') || false,
      createdAt: yjsDoc.gameState.get('createdAt') || Date.now(),
      lastUpdated: Date.now(),
      
      // Complex fields
      players,
      board: {
        spaces,
        rings,
        bridges: {}, // TODO: Implement bridges in Y.js
        rotations
      },
      diceState
    }
  } catch (error) {
    console.error('Error reconstructing game state from Y.js:', error)
    return null
  }
}

/**
 * Convert Y.js dice state to DiceState object
 */
function yjsToDiceState(diceStateMap: Y.Map<any>): DiceState {
  const positionRollsMap = diceStateMap.get('positionRolls') as Y.Map<any> | null
  const directionRollsMap = diceStateMap.get('directionRolls') as Y.Map<any> | null
  const rotationsArray = diceStateMap.get('rotations') as Y.Array<number>
  
  let positionRolls: DiceRoll | null = null
  if (positionRollsMap) {
    const diceArray = positionRollsMap.get('dice') as Y.Array<number>
    positionRolls = {
      dice: diceArray ? diceArray.toArray() : [],
      total: positionRollsMap.get('total') || 0,
      timestamp: positionRollsMap.get('timestamp') || Date.now()
    }
  }
  
  let directionRolls: DiceRoll | null = null
  if (directionRollsMap) {
    const diceArray = directionRollsMap.get('dice') as Y.Array<number>
    directionRolls = {
      dice: diceArray ? diceArray.toArray() : [],
      total: directionRollsMap.get('total') || 0,
      timestamp: directionRollsMap.get('timestamp') || Date.now()
    }
  }
  
  return {
    isRolling: diceStateMap.get('isRolling') || false,
    positionRolls,
    directionRolls,
    rotations: rotationsArray ? rotationsArray.toArray() : []
  }
}

/**
 * Validate Y.js document structure
 */
export function validateYjsDocument(yjsDoc: YjsGameDocument): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check required maps exist
  if (!yjsDoc.gameState) errors.push('Missing gameState map')
  if (!yjsDoc.players) errors.push('Missing players array')
  if (!yjsDoc.spaces) errors.push('Missing spaces array')
  if (!yjsDoc.board) errors.push('Missing board map')
  if (!yjsDoc.diceState) errors.push('Missing diceState map')
  
  // Check game state has required fields
  if (yjsDoc.gameState) {
    const requiredFields = ['gameId', 'gamePhase', 'season', 'year', 'turn']
    requiredFields.forEach(field => {
      if (!yjsDoc.gameState.has(field)) {
        errors.push(`Missing required field: gameState.${field}`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Create granular observers for specific fields
 */
export function observeGameState(
  yjsDoc: YjsGameDocument,
  callbacks: {
    onPlayersChange?: (players: Player[]) => void
    onGamePhaseChange?: (phase: GamePhase) => void
    onTurnChange?: (turn: number) => void
    onSpaceChange?: (spaceId: string, space: GameSpace) => void
    onDiceChange?: (diceState: DiceState) => void
    onSeasonChange?: (season: Season) => void
    onCurrentPlayerChange?: (playerIndex: number) => void
    onBoardRotation?: (rotations: number[]) => void
    onPlayerResourceChange?: (playerId: string, resources: GameResources) => void
    onPieceMove?: (pieceId: string, fromSpaceId: string, toSpaceId: string) => void
    onError?: (error: Error) => void
  }
): () => void {
  const unsubscribers: (() => void)[] = []
  
  // Observe players array with deep observation
  if (callbacks.onPlayersChange || callbacks.onPlayerResourceChange) {
    const observer = (event: Y.YArrayEvent<Y.Map<any>>) => {
      // Reconstruct players for general callback
      if (callbacks.onPlayersChange) {
        const players: Player[] = []
        yjsDoc.players.forEach(playerMap => {
          if (playerMap instanceof Y.Map) {
            players.push(yjsToPlayer(playerMap))
          }
        })
        safeCall(callbacks.onPlayersChange, callbacks.onError, players)
      }
      
      // Deep observe for resource changes
      if (callbacks.onPlayerResourceChange) {
        event.changes.added.forEach(item => {
          item.content.getContent().forEach(playerMap => {
            if (playerMap instanceof Y.Map) {
              const resourcesMap = playerMap.get('resources') as Y.Map<any>
              if (resourcesMap) {
                const resourceObserver = () => {
                  const playerId = playerMap.get('id')
                  const resources: GameResources = {
                    grains: resourcesMap.get('grains') || 0,
                    berries: resourcesMap.get('berries') || 0,
                    salmon: resourcesMap.get('salmon') || 0,
                    honey: resourcesMap.get('honey') || 0,
                    bearMeat: resourcesMap.get('bearMeat') || 0
                  }
                  if (callbacks.onPlayerResourceChange) {
                    callbacks.onPlayerResourceChange(playerId, resources)
                  }
                }
                resourcesMap.observe(resourceObserver)
                unsubscribers.push(() => resourcesMap.unobserve(resourceObserver))
              }
            }
          })
        })
      }
    }
    yjsDoc.players.observe((event, transaction) => {
      if (transaction.local) return // Skip local changes to prevent loops
      observer(event)
    })
    unsubscribers.push(() => yjsDoc.players.unobserve(observer))
  }
  
  // Observe game state scalar fields
  if (callbacks.onGamePhaseChange || callbacks.onTurnChange || callbacks.onSeasonChange || callbacks.onCurrentPlayerChange) {
    const observer = (event: Y.YMapEvent<any>) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'update') {
          switch (key) {
            case 'gamePhase':
              if (callbacks.onGamePhaseChange) {
                safeCall(callbacks.onGamePhaseChange, callbacks.onError, yjsDoc.gameState.get('gamePhase'))
              }
              break
            case 'turn':
              if (callbacks.onTurnChange) {
                safeCall(callbacks.onTurnChange, callbacks.onError, yjsDoc.gameState.get('turn'))
              }
              break
            case 'season':
              if (callbacks.onSeasonChange) {
                safeCall(callbacks.onSeasonChange, callbacks.onError, yjsDoc.gameState.get('season'))
              }
              break
            case 'currentPlayerIndex':
              if (callbacks.onCurrentPlayerChange) {
                safeCall(callbacks.onCurrentPlayerChange, callbacks.onError, yjsDoc.gameState.get('currentPlayerIndex'))
              }
              break
          }
        }
      })
    }
    yjsDoc.gameState.observe((event, transaction) => {
      if (transaction.local) return // Skip local changes to prevent loops
      observer(event)
    })
    unsubscribers.push(() => yjsDoc.gameState.unobserve(observer))
  }
  
  // Observe spaces array for piece movements
  if (callbacks.onSpaceChange || callbacks.onPieceMove) {
    let previousSpaceStates = new Map<string, GameSpace>()
    
    // Build initial state
    yjsDoc.spaces.forEach(spaceMap => {
      if (spaceMap instanceof Y.Map) {
        const space = yjsToSpace(spaceMap)
        previousSpaceStates.set(space.id, space)
      }
    })
    
    const observer = () => {
      const currentSpaceStates = new Map<string, GameSpace>()
      
      // Build current state and detect changes
      yjsDoc.spaces.forEach(spaceMap => {
        if (spaceMap instanceof Y.Map) {
          const space = yjsToSpace(spaceMap)
          currentSpaceStates.set(space.id, space)
          
          // Check for space changes
          const prevSpace = previousSpaceStates.get(space.id)
          if (prevSpace) {
            // Space changed callback
            if (callbacks.onSpaceChange && 
                (prevSpace.piece?.id !== space.piece?.id || 
                 prevSpace.canProduce !== space.canProduce)) {
              safeCall(callbacks.onSpaceChange, callbacks.onError, space.id, space)
            }
            
            // Piece movement detection
            if (callbacks.onPieceMove) {
              if (prevSpace.piece && !space.piece) {
                // Piece left this space
                const movedPiece = prevSpace.piece
                // Find where it went
                currentSpaceStates.forEach((otherSpace, otherSpaceId) => {
                  if (otherSpace.piece?.id === movedPiece.id && otherSpaceId !== space.id) {
                    if (callbacks.onPieceMove) {
                      safeCall(callbacks.onPieceMove, callbacks.onError, movedPiece.id, space.id, otherSpaceId)
                    }
                  }
                })
              }
            }
          } else if (callbacks.onSpaceChange) {
            // New space
            safeCall(callbacks.onSpaceChange, callbacks.onError, space.id, space)
          }
        }
      })
      
      previousSpaceStates = currentSpaceStates
    }
    
    yjsDoc.spaces.observe((event, transaction) => {
      if (transaction.local) return // Skip local changes to prevent loops
      observer()
    })
    unsubscribers.push(() => yjsDoc.spaces.unobserve(observer))
  }
  
  // Observe dice state
  if (callbacks.onDiceChange) {
    const observer = () => {
      if (callbacks.onDiceChange) {
        safeCall(callbacks.onDiceChange, callbacks.onError, yjsToDiceState(yjsDoc.diceState))
      }
    }
    yjsDoc.diceState.observe((event, transaction) => {
      if (transaction.local) return // Skip local changes to prevent loops
      observer()
    })
    unsubscribers.push(() => yjsDoc.diceState.unobserve(observer))
  }
  
  // Observe board rotations
  if (callbacks.onBoardRotation) {
    const rotationsArray = yjsDoc.board.get('rotations') as Y.Array<number>
    if (rotationsArray) {
      const observer = () => {
        if (callbacks.onBoardRotation) {
          safeCall(callbacks.onBoardRotation, callbacks.onError, rotationsArray.toArray())
        }
      }
      rotationsArray.observe(observer)
      unsubscribers.push(() => rotationsArray.unobserve(observer))
    }
  }
  
  // Return combined unsubscribe function
  return () => {
    unsubscribers.forEach(unsub => {
      try {
        unsub()
      } catch (error) {
        console.error('Error unsubscribing Y.js observer:', error)
      }
    })
  }
}

/**
 * Create a specific observer for a single player's data
 */
export function observePlayer(
  yjsDoc: YjsGameDocument,
  playerId: string,
  callbacks: {
    onResourceChange?: (resources: GameResources) => void
    onPieceChange?: (pieces: GamePiece[]) => void
    onScoreChange?: (score: number) => void
    onError?: (error: Error) => void
  }
): () => void {
  const unsubscribers: (() => void)[] = []
  
  
  // Find and observe the specific player
  const findAndObservePlayer = () => {
    yjsDoc.players.forEach((playerMap, index) => {
      if (playerMap instanceof Y.Map && playerMap.get('id') === playerId) {
        // Observe resources
        if (callbacks.onResourceChange) {
          const resourcesMap = playerMap.get('resources') as Y.Map<any>
          if (resourcesMap) {
            const observer = () => {
              const resources: GameResources = {
                grains: resourcesMap.get('grains') || 0,
                berries: resourcesMap.get('berries') || 0,
                salmon: resourcesMap.get('salmon') || 0,
                honey: resourcesMap.get('honey') || 0,
                bearMeat: resourcesMap.get('bearMeat') || 0
              }
              if (callbacks.onResourceChange) {
                safeCall(callbacks.onResourceChange, callbacks.onError, resources)
              }
            }
            resourcesMap.observe(observer)
            unsubscribers.push(() => resourcesMap.unobserve(observer))
          }
        }
        
        // Observe pieces
        if (callbacks.onPieceChange) {
          const piecesArray = playerMap.get('pieces') as Y.Array<Y.Map<any>>
          if (piecesArray) {
            const observer = () => {
              const pieces: GamePiece[] = []
              piecesArray.forEach(pieceMap => {
                if (pieceMap instanceof Y.Map) {
                  pieces.push(yjsToPiece(pieceMap))
                }
              })
              if (callbacks.onPieceChange) {
                safeCall(callbacks.onPieceChange, callbacks.onError, pieces)
              }
            }
            piecesArray.observe(observer)
            unsubscribers.push(() => piecesArray.unobserve(observer))
          }
        }
        
        // Observe score
        if (callbacks.onScoreChange) {
          const observer = (event: Y.YMapEvent<any>) => {
            event.changes.keys.forEach((change, key) => {
              if (key === 'score' && change.action === 'update') {
                if (callbacks.onScoreChange) {
                  safeCall(callbacks.onScoreChange, callbacks.onError, playerMap.get('score') || 0)
                }
              }
            })
          }
          playerMap.observe(observer)
          unsubscribers.push(() => playerMap.unobserve(observer))
        }
      }
    })
  }
  
  // Initial setup
  findAndObservePlayer()
  
  // Re-scan when players array changes (in case player is added)
  const playersObserver = () => findAndObservePlayer()
  yjsDoc.players.observe(playersObserver)
  unsubscribers.push(() => yjsDoc.players.unobserve(playersObserver))
  
  return () => {
    unsubscribers.forEach(unsub => {
      try {
        unsub()
      } catch (error) {
        console.error('Error unsubscribing player observer:', error)
      }
    })
  }
}

/**
 * Create an observer for a specific space
 */
export function observeSpace(
  yjsDoc: YjsGameDocument,
  spaceId: string,
  callbacks: {
    onPieceChange?: (piece: GamePiece | null) => void
    onProductionChange?: (canProduce: boolean) => void
    onHoneyChange?: (hasHoney: boolean) => void
    onError?: (error: Error) => void
  }
): () => void {
  const unsubscribers: (() => void)[] = []
  
  
  // Find and observe the specific space
  const findAndObserveSpace = () => {
    yjsDoc.spaces.forEach((spaceMap, index) => {
      if (spaceMap instanceof Y.Map && spaceMap.get('id') === spaceId) {
        const observer = (event: Y.YMapEvent<any>) => {
          event.changes.keys.forEach((change, key) => {
            if (change.action === 'update') {
              switch (key) {
                case 'piece':
                  if (callbacks.onPieceChange) {
                    const pieceMap = spaceMap.get('piece') as Y.Map<any> | null
                    const piece = pieceMap ? yjsToPiece(pieceMap) : null
                    safeCall(callbacks.onPieceChange, callbacks.onError, piece)
                  }
                  break
                case 'canProduce':
                  if (callbacks.onProductionChange) {
                    safeCall(callbacks.onProductionChange, callbacks.onError, spaceMap.get('canProduce'))
                  }
                  break
                case 'hasHoney':
                  if (callbacks.onHoneyChange) {
                    safeCall(callbacks.onHoneyChange, callbacks.onError, spaceMap.get('hasHoney') || false)
                  }
                  break
              }
            }
          })
        }
        spaceMap.observe(observer)
        unsubscribers.push(() => spaceMap.unobserve(observer))
      }
    })
  }
  
  // Initial setup
  findAndObserveSpace()
  
  // Re-scan when spaces array changes
  const spacesObserver = () => findAndObserveSpace()
  yjsDoc.spaces.observe(spacesObserver)
  unsubscribers.push(() => yjsDoc.spaces.unobserve(spacesObserver))
  
  return () => {
    unsubscribers.forEach(unsub => {
      try {
        unsub()
      } catch (error) {
        console.error('Error unsubscribing space observer:', error)
      }
    })
  }
}

/**
 * Batch multiple Y.js operations in a single transaction
 */
export function batchUpdate(
  yjsDoc: YjsGameDocument,
  updates: () => void,
  origin?: string
): void {
  yjsDoc.doc.transact(updates, origin)
}

/**
 * Update a single player's resources atomically
 */
export function updatePlayerResources(
  yjsDoc: YjsGameDocument,
  playerId: string,
  resourceUpdates: Partial<GameResources>
): boolean {
  let success = false
  
  yjsDoc.doc.transact(() => {
    // Find the player
    yjsDoc.players.forEach((playerMap) => {
      if (playerMap instanceof Y.Map && playerMap.get('id') === playerId) {
        const resourcesMap = playerMap.get('resources') as Y.Map<any>
        if (resourcesMap) {
          // Update only the specified resources
          Object.entries(resourceUpdates).forEach(([resource, value]) => {
            if (value !== undefined) {
              resourcesMap.set(resource, value)
            }
          })
          success = true
        }
      }
    })
  }, `updatePlayerResources:${playerId}`)
  
  return success
}

/**
 * Move a piece from one space to another atomically
 */
export function movePiece(
  yjsDoc: YjsGameDocument,
  pieceId: string,
  fromSpaceId: string,
  toSpaceId: string
): boolean {
  let success = false
  
  yjsDoc.doc.transact(() => {
    let piece: Y.Map<any> | null = null
    let fromSpaceMap: Y.Map<any> | null = null
    let toSpaceMap: Y.Map<any> | null = null
    
    // Find the piece and spaces
    yjsDoc.spaces.forEach((spaceMap) => {
      if (spaceMap instanceof Y.Map) {
        const spaceIdValue = spaceMap.get('id')
        
        if (spaceIdValue === fromSpaceId) {
          fromSpaceMap = spaceMap
          const pieceMap = spaceMap.get('piece') as Y.Map<any>
          if (pieceMap && pieceMap.get('id') === pieceId) {
            piece = pieceMap
          }
        } else if (spaceIdValue === toSpaceId) {
          toSpaceMap = spaceMap
        }
      }
    })
    
    // Perform the move if all entities found
    if (piece && fromSpaceMap && toSpaceMap) {
      // Remove piece from source space
      fromSpaceMap.set('piece', null)
      
      // Update piece's spaceId
      piece.set('spaceId', toSpaceId)
      
      // Add piece to destination space
      toSpaceMap.set('piece', piece)
      
      success = true
    }
  }, `movePiece:${pieceId}:${fromSpaceId}->${toSpaceId}`)
  
  return success
}

/**
 * Update multiple spaces atomically (useful for board rotations)
 */
export function updateSpaces(
  yjsDoc: YjsGameDocument,
  spaceUpdates: Array<{
    spaceId: string
    updates: {
      piece?: GamePiece | null
      canProduce?: boolean
      hasHoney?: boolean
    }
  }>
): boolean {
  let success = false
  
  yjsDoc.doc.transact(() => {
    const spaceMap = new Map<string, Y.Map<any>>()
    
    // Build space lookup
    yjsDoc.spaces.forEach((space) => {
      if (space instanceof Y.Map) {
        spaceMap.set(space.get('id'), space)
      }
    })
    
    // Apply all updates
    let allUpdatesSuccessful = true
    spaceUpdates.forEach(({ spaceId, updates }) => {
      const space = spaceMap.get(spaceId)
      if (space) {
        if (updates.piece !== undefined) {
          space.set('piece', updates.piece ? pieceToYjs(updates.piece) : null)
        }
        if (updates.canProduce !== undefined) {
          space.set('canProduce', updates.canProduce)
        }
        if (updates.hasHoney !== undefined) {
          space.set('hasHoney', updates.hasHoney)
        }
      } else {
        allUpdatesSuccessful = false
      }
    })
    
    success = allUpdatesSuccessful
  }, `updateSpaces:${spaceUpdates.length}spaces`)
  
  return success
}

/**
 * Advance the game turn atomically with multiple state changes
 */
export function advanceTurn(
  yjsDoc: YjsGameDocument,
  updates: {
    turn?: number
    currentPlayerIndex?: number
    season?: Season
    year?: number
    gamePhase?: GamePhase
    energyTaxPaid?: boolean
  }
): void {
  yjsDoc.doc.transact(() => {
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        yjsDoc.gameState.set(key, value)
      }
    })
  }, `advanceTurn:${updates.turn || 'unknown'}`)
}

/**
 * Update dice state atomically
 */
export function updateDiceState(
  yjsDoc: YjsGameDocument,
  updates: {
    isRolling?: boolean
    positionRolls?: DiceRoll | null
    directionRolls?: DiceRoll | null
    rotations?: number[]
  }
): void {
  yjsDoc.doc.transact(() => {
    if (updates.isRolling !== undefined) {
      yjsDoc.diceState.set('isRolling', updates.isRolling)
    }
    
    if (updates.positionRolls !== undefined) {
      if (updates.positionRolls) {
        const rollMap = new Y.Map()
        rollMap.set('dice', Y.Array.from(updates.positionRolls.dice))
        rollMap.set('total', updates.positionRolls.total)
        rollMap.set('timestamp', updates.positionRolls.timestamp)
        yjsDoc.diceState.set('positionRolls', rollMap)
      } else {
        yjsDoc.diceState.set('positionRolls', null)
      }
    }
    
    if (updates.directionRolls !== undefined) {
      if (updates.directionRolls) {
        const rollMap = new Y.Map()
        rollMap.set('dice', Y.Array.from(updates.directionRolls.dice))
        rollMap.set('total', updates.directionRolls.total)
        rollMap.set('timestamp', updates.directionRolls.timestamp)
        yjsDoc.diceState.set('directionRolls', rollMap)
      } else {
        yjsDoc.diceState.set('directionRolls', null)
      }
    }
    
    if (updates.rotations !== undefined) {
      const rotationsArray = yjsDoc.diceState.get('rotations') as Y.Array<number>
      if (rotationsArray) {
        rotationsArray.delete(0, rotationsArray.length)
        rotationsArray.push(updates.rotations)
      } else {
        yjsDoc.diceState.set('rotations', Y.Array.from(updates.rotations))
      }
    }
  }, 'updateDiceState')
}

/**
 * Add a new player to the game atomically
 */
export function addPlayer(
  yjsDoc: YjsGameDocument,
  player: Player
): void {
  yjsDoc.doc.transact(() => {
    const playerMap = playerToYjs(player)
    yjsDoc.players.push([playerMap])
  }, `addPlayer:${player.id}`)
}

/**
 * Remove a player from the game atomically
 */
export function removePlayer(
  yjsDoc: YjsGameDocument,
  playerId: string
): boolean {
  let success = false
  
  yjsDoc.doc.transact(() => {
    // Find and remove the player
    for (let i = 0; i < yjsDoc.players.length; i++) {
      const playerMap = yjsDoc.players.get(i)
      if (playerMap instanceof Y.Map && playerMap.get('id') === playerId) {
        yjsDoc.players.delete(i, 1)
        success = true
        break
      }
    }
  }, `removePlayer:${playerId}`)
  
  return success
}

/**
 * Rollback helper - restore previous state from backup
 */
export function rollbackToSnapshot(
  yjsDoc: YjsGameDocument,
  snapshot: CoreGameState
): void {
  yjsDoc.doc.transact(() => {
    // Clear existing data
    yjsDoc.players.delete(0, yjsDoc.players.length)
    yjsDoc.spaces.delete(0, yjsDoc.spaces.length)
    
    // Restore from snapshot
    syncStateToYjs(yjsDoc, snapshot)
  }, 'rollbackToSnapshot')
}