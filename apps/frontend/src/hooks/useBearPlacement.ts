/**
 * Bear Placement Hook - Manages two-step bear placement process
 * 
 * This hook handles the selection and confirmation flow for bear placement:
 * 1. Player clicks space to select it
 * 2. Player clicks confirm to place the bear
 * 3. Selection is cleared and next player's turn begins
 */

import { useState } from 'react'
import { useStateCoordinator, useCoordinatedGameActions } from '@/state/StateCoordinator'
import { useMultiplayerStore } from '@/state/MultiplayerStore'

export function useBearPlacement() {
  const { gameState } = useStateCoordinator()
  const gameActions = useCoordinatedGameActions()
  const { isConnected: isMultiplayer, playerNumber } = useMultiplayerStore()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  
  const { bearPlacementState } = gameState
  const currentPlayer = bearPlacementState ? gameState.players[bearPlacementState.currentPlayerIndex] : null
  const isMyTurn = !isMultiplayer || (currentPlayer && playerNumber === currentPlayer.playerNumber)
  
  // Clear selection when it's not my turn
  if (!isMyTurn && selectedSpaceId) {
    setSelectedSpaceId(null)
  }
  
  const handleSpaceSelect = (spaceId: string) => {
    if (!isMyTurn || !currentPlayer || gameState.gamePhase !== 'bear_placement') return
    
    // Check if space is available
    const space = gameState.board.spaces[spaceId]
    if (!space || space.piece) return
    
    setSelectedSpaceId(spaceId)
  }
  
  const handleConfirmPlacement = async () => {
    if (!selectedSpaceId || !isMyTurn || !currentPlayer) return
    
    try {
      await gameActions.placeBear(selectedSpaceId, String(currentPlayer.id))
      setSelectedSpaceId(null) // Clear selection after successful placement
    } catch (error) {
      console.error('Failed to place bear:', error)
    }
  }
  
  const handleCancelSelection = () => {
    setSelectedSpaceId(null)
  }
  
  return {
    selectedSpaceId,
    isMyTurn,
    currentPlayer,
    handleSpaceSelect,
    handleConfirmPlacement,
    handleCancelSelection,
    isInBearPlacementPhase: gameState.gamePhase === 'bear_placement'
  }
}