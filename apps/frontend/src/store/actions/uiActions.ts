/**
 * UI Actions - Higher-level UI interaction patterns
 * 
 * These actions coordinate between UI state and game actions to provide
 * common interaction patterns that components can use.
 */

import { useUIStore } from '../uiStore'
import { useGameActions } from './gameActions'
import { useGameStore } from '../gameStore'

/**
 * UI Action Creators - Higher-level UI patterns
 */
export const useUIActions = () => {
  const gameActions = useGameActions()
  const uiStore = useUIStore()

  return {
    /**
     * Select a piece and highlight its valid moves
     */
    selectPiece: (pieceId: string) => {
      uiStore.setSelectedPiece(pieceId)
      
      // Get valid moves and highlight them
      const validMoves = gameActions.getValidMoves(pieceId)
      uiStore.setHighlightedSpaces(validMoves)
      
      // Clear space selection since we're selecting a piece
      uiStore.setSelectedSpace(null)
    },

    /**
     * Select a space (and handle piece movement if applicable)
     */
    selectSpace: (spaceId: string) => {
      const selectedPieceId = uiStore.selectedPieceId
      const gameState = useGameStore.getState()
      
      // Get the space being clicked
      const clickedSpace = gameState.board.spaces[spaceId] || gameState.board.bridges[spaceId]
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]
      
      
      // If the space contains a piece belonging to current player, select that piece
      if (clickedSpace?.piece && clickedSpace.piece.playerId === currentPlayer?.id) {
        uiStore.setSelectedPiece(clickedSpace.piece.id)
        
        // Get valid moves and highlight them
        const validMoves = gameActions.getValidMoves(clickedSpace.piece.id)
        uiStore.setHighlightedSpaces(validMoves)
        
        // Clear space selection since we're selecting a piece
        uiStore.setSelectedSpace(null)
        return
      }
      
      // If we have a piece selected and this space is highlighted (valid move)
      if (selectedPieceId && uiStore.highlightedSpaces.includes(spaceId)) {
        // Find the piece's current space
        const piece = gameState.players.flatMap(p => p.pieces).find(p => p.id === selectedPieceId)
        
        if (piece) {
          const success = gameActions.movePiece(selectedPieceId, piece.spaceId, spaceId)
          
          if (success) {
            // Clear selections after successful move
            uiStore.clearSelections()
          }
        }
      } else {
        // Just select the space
        uiStore.setSelectedSpace(spaceId)
        uiStore.setSelectedPiece(null)
        uiStore.setHighlightedSpaces([])
      }
    },

    /**
     * Handle piece eating with UI feedback
     */
    eatWithFeedback: (pieceId: string, resourceType: string, amount: number, convertTo: 'energy' | 'fat') => {
      const success = gameActions.eatFood(pieceId, resourceType as 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat', amount, convertTo)
      
      if (success) {
        uiStore.addLogMessage(`Successfully converted ${amount} ${resourceType} to ${convertTo}`)
      }
      
      return success
    },

    /**
     * Handle hibernation with UI feedback
     */
    hibernateWithFeedback: (pieceId: string) => {
      const success = gameActions.hibernate(pieceId)
      
      if (success) {
        uiStore.addLogMessage('Bear entered hibernation')
        // Clear selections since hibernating bear is no longer active
        uiStore.clearSelections()
      }
      
      return success
    },

    /**
     * Handle harvest with UI feedback
     */
    harvestWithFeedback: (pieceId: string) => {
      const success = gameActions.harvest(pieceId)
      
      if (success) {
        uiStore.addLogMessage('Resources harvested')
      }
      
      return success
    },

    /**
     * Handle daily energy expense payment with UI feedback
     */
    payEnergyTaxWithFeedback: (pieceId: string) => {
      const success = gameActions.payEnergyTax(pieceId)
      
      if (success) {
        uiStore.addLogMessage('⚡ Daily energy expense paid')
      }
      
      return success
    },

    /**
     * Handle fat conversion with UI feedback
     */
    convertFatWithFeedback: (pieceId: string, fatAmount: number) => {
      const success = gameActions.convertFatToEmergencyEnergy(pieceId, fatAmount)
      
      if (success) {
        uiStore.addLogMessage(`Converted ${fatAmount} fat to emergency energy`)
      }
      
      return success
    },

    /**
     * Handle bear death with UI feedback
     */
    deathWithFeedback: (pieceId: string) => {
      const success = gameActions.death(pieceId)
      
      if (success) {
        uiStore.addLogMessage('💀 Bear died of starvation')
        // Clear selections since the bear is dead
        uiStore.clearSelections()
      }
      
      return success
    },

    /**
     * Advance turn with UI state cleanup
     */
    advanceTurnWithCleanup: () => {
      const success = gameActions.advanceTurn()
      
      if (success) {
        // Clear all UI selections when turn advances
        uiStore.clearSelections()
        uiStore.addLogMessage('Turn advanced')
      }
      
      return success
    },

    /**
     * Advance phase with UI state cleanup
     */
    advancePhaseWithCleanup: () => {
      const success = gameActions.advancePhase()
      
      if (success) {
        // Clear selections when phase changes
        uiStore.clearSelections()
        uiStore.addLogMessage('Phase advanced')
      }
      
      return success
    },

    /**
     * Handle space hover for visual feedback
     */
    hoverSpace: (spaceId: string | null) => {
      uiStore.setHoveredSpace(spaceId)
    },

    /**
     * Show error message in UI
     */
    showError: (message: string) => {
      uiStore.addLogMessage(`Error: ${message}`)
      uiStore.setError(message)
    },

    /**
     * Clear all error states
     */
    clearErrors: () => {
      uiStore.setError(null)
    },

    /**
     * Toggle game rules display
     */
    toggleRules: () => {
      uiStore.toggleRules()
    },

    /**
     * Toggle multiplayer controls
     */
    toggleMultiplayer: () => {
      uiStore.toggleMultiplayerControls()
    }
  }
}

/**
 * Hook for common UI interaction patterns
 */
export const useUIInteractions = () => {
  const uiActions = useUIActions()
  
  return {
    // Piece interaction
    onPieceClick: uiActions.selectPiece,
    onPieceHover: () => {
      // Could add piece hover effects here
    },
    
    // Space interaction  
    onSpaceClick: uiActions.selectSpace,
    onSpaceHover: uiActions.hoverSpace,
    
    // Action buttons
    onEatResource: uiActions.eatWithFeedback,
    onHibernate: uiActions.hibernateWithFeedback,
    onHarvest: uiActions.harvestWithFeedback,
    onPayTax: uiActions.payEnergyTaxWithFeedback,
    onConvertFat: uiActions.convertFatWithFeedback,
    onDeath: uiActions.deathWithFeedback,
    
    // Turn management
    onAdvanceTurn: uiActions.advanceTurnWithCleanup,
    onAdvancePhase: uiActions.advancePhaseWithCleanup,
    
    // UI controls
    onToggleRules: uiActions.toggleRules,
    onToggleMultiplayer: uiActions.toggleMultiplayer,
    
    // Error handling
    onError: uiActions.showError,
    onClearError: uiActions.clearErrors
  }
}