/**
 * React Hooks for Y.js Granular Observers
 * 
 * These hooks provide easy integration of granular Y.js observers
 * with React components, handling cleanup automatically.
 */

import { useEffect, useRef } from 'react'
import {
  YjsGameDocument,
  observeGameState,
  observePlayer,
  observeSpace,
  Player,
  GameSpace,
  GamePiece,
  GameResources,
  DiceState,
  GamePhase,
  Season
} from './YjsDocumentStructure'

/**
 * Hook to observe specific game state changes
 */
export function useYjsGameObserver(
  yjsDoc: YjsGameDocument | null,
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
) {
  // Use ref to avoid re-creating observers on every render
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks
  
  useEffect(() => {
    if (!yjsDoc) return
    
    // Create observer with current callbacks
    const unsubscribe = observeGameState(yjsDoc, {
      onPlayersChange: callbacksRef.current.onPlayersChange,
      onGamePhaseChange: callbacksRef.current.onGamePhaseChange,
      onTurnChange: callbacksRef.current.onTurnChange,
      onSpaceChange: callbacksRef.current.onSpaceChange,
      onDiceChange: callbacksRef.current.onDiceChange,
      onSeasonChange: callbacksRef.current.onSeasonChange,
      onCurrentPlayerChange: callbacksRef.current.onCurrentPlayerChange,
      onBoardRotation: callbacksRef.current.onBoardRotation,
      onPlayerResourceChange: callbacksRef.current.onPlayerResourceChange,
      onPieceMove: callbacksRef.current.onPieceMove,
      onError: callbacksRef.current.onError
    })
    
    return unsubscribe
  }, [yjsDoc])
}

/**
 * Hook to observe a specific player's data
 */
export function useYjsPlayerObserver(
  yjsDoc: YjsGameDocument | null,
  playerId: string,
  callbacks: {
    onResourceChange?: (resources: GameResources) => void
    onPieceChange?: (pieces: GamePiece[]) => void
    onScoreChange?: (score: number) => void
    onError?: (error: Error) => void
  }
) {
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks
  
  useEffect(() => {
    if (!yjsDoc || !playerId) return
    
    const unsubscribe = observePlayer(yjsDoc, playerId, {
      onResourceChange: callbacksRef.current.onResourceChange,
      onPieceChange: callbacksRef.current.onPieceChange,
      onScoreChange: callbacksRef.current.onScoreChange,
      onError: callbacksRef.current.onError
    })
    
    return unsubscribe
  }, [yjsDoc, playerId])
}

/**
 * Hook to observe a specific space
 */
export function useYjsSpaceObserver(
  yjsDoc: YjsGameDocument | null,
  spaceId: string,
  callbacks: {
    onPieceChange?: (piece: GamePiece | null) => void
    onProductionChange?: (canProduce: boolean) => void
    onHoneyChange?: (hasHoney: boolean) => void
    onError?: (error: Error) => void
  }
) {
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks
  
  useEffect(() => {
    if (!yjsDoc || !spaceId) return
    
    const unsubscribe = observeSpace(yjsDoc, spaceId, {
      onPieceChange: callbacksRef.current.onPieceChange,
      onProductionChange: callbacksRef.current.onProductionChange,
      onHoneyChange: callbacksRef.current.onHoneyChange,
      onError: callbacksRef.current.onError
    })
    
    return unsubscribe
  }, [yjsDoc, spaceId])
}

/**
 * Hook to observe just the current turn
 */
export function useYjsTurnObserver(
  yjsDoc: YjsGameDocument | null,
  onTurnChange: (turn: number) => void
) {
  useYjsGameObserver(yjsDoc, { onTurnChange })
}

/**
 * Hook to observe just the game phase
 */
export function useYjsGamePhaseObserver(
  yjsDoc: YjsGameDocument | null,
  onGamePhaseChange: (phase: GamePhase) => void
) {
  useYjsGameObserver(yjsDoc, { onGamePhaseChange })
}

/**
 * Hook to observe piece movements
 */
export function useYjsPieceMovementObserver(
  yjsDoc: YjsGameDocument | null,
  onPieceMove: (pieceId: string, fromSpaceId: string, toSpaceId: string) => void
) {
  useYjsGameObserver(yjsDoc, { onPieceMove })
}

/**
 * Hook to observe multiple players' resources
 */
export function useYjsPlayersResourceObserver(
  yjsDoc: YjsGameDocument | null,
  playerIds: string[],
  onResourceChange: (playerId: string, resources: GameResources) => void
) {
  const callbacksRef = useRef(onResourceChange)
  callbacksRef.current = onResourceChange
  
  useEffect(() => {
    if (!yjsDoc || playerIds.length === 0) return
    
    const unsubscribers = playerIds.map(playerId =>
      observePlayer(yjsDoc, playerId, {
        onResourceChange: (resources) => callbacksRef.current(playerId, resources)
      })
    )
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [yjsDoc, playerIds.join(',')])
}