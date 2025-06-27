/**
 * Game Actions - Clean Interface Between UI and Game Engine
 * 
 * These action creators provide a clean interface between UI components
 * and the game engine. They handle the coordination between the game engine,
 * game store, and UI store.
 */

import { GameEngine } from '../../engine/GameEngine'
import { StateAdapter } from '../../engine/StateAdapter'
import { ActionCreators } from '../../engine/types'
import type { 
  ResourceType, 
  ConversionType, 
  CoreGameState,
  GameAction 
} from '../../engine/types'
import { useGameStore } from '../gameStore'
import { useUIStore } from '../uiStore'

// Create a singleton game engine instance
const gameEngine = new GameEngine()

/**
 * Convert the current gameStore state to CoreGameState format
 */
function convertToEngineState(): CoreGameState {
  const state = useGameStore.getState()
  return StateAdapter.toEngineState(state)
}

/**
 * Apply engine result to the game store
 */
function applyEngineResult(result: { success: boolean; state?: CoreGameState; message?: string; error?: string }) {
  if (result.success) {
    // Update the game store with the new state
    // Note: This will need to be updated once we replace the old gameStore
    try {
      const gameStore = useGameStore.getState()
      
      // Check if the new updateFromEngineState method exists
      if ('updateFromEngineState' in gameStore) {
        (gameStore as typeof gameStore & { updateFromEngineState: (state: CoreGameState) => void }).updateFromEngineState(result.state!)
      }
      
      // Add message to UI log
      if (result.message) {
        useUIStore.getState().addLogMessage(result.message)
      }
    } catch {
      console.warn('Game store update failed - this will be fixed when gameStore is fully migrated')
      useUIStore.getState().addLogMessage(result.message || 'Action completed')
    }
  } else {
    // Handle error
    if (result.error) {
      useUIStore.getState().addLogMessage(`Error: ${result.error}`)
    }
  }
  
  return result.success
}

/**
 * Game Action Creators - Used by UI components
 */
export const useGameActions = () => {
  return {
    /**
     * Move a piece from one space to another
     */
    movePiece: (pieceId: string, fromSpaceId: string, toSpaceId: string): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      const action = ActionCreators.movement(
        currentPlayer.id,
        pieceId,
        fromSpaceId,
        toSpaceId
      )
      
      const result = gameEngine.executeMovement(currentState, action)
      return applyEngineResult(result)
    },

    /**
     * Make a piece eat a resource and convert it to energy or fat
     */
    eatFood: (pieceId: string, resourceType: ResourceType, amount: number, convertTo: ConversionType): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      const action = ActionCreators.eating(
        currentPlayer.id,
        pieceId,
        resourceType,
        amount,
        convertTo
      )
      
      const result = gameEngine.executeEating(currentState, action)
      return applyEngineResult(result)
    },

    /**
     * Make a piece hibernate (Winter only, Mountains only)
     */
    hibernate: (pieceId: string): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      const action = ActionCreators.hibernation(currentPlayer.id, pieceId)
      
      const result = gameEngine.executeHibernation(currentState, action)
      return applyEngineResult(result)
    },

    /**
     * Harvest resources at a piece's current location
     */
    harvest: (pieceId: string): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      // Find the piece's current space
      const piece = currentState.players
        .flatMap(p => p.pieces)
        .find(p => p.id === pieceId)
      
      if (!piece) {
        useUIStore.getState().addLogMessage('Error: Piece not found')
        return false
      }
      
      const action = ActionCreators.harvest(currentPlayer.id, pieceId, piece.spaceId)
      
      const result = gameEngine.executeHarvest(currentState, action)
      return applyEngineResult(result)
    },

    /**
     * Pay daily energy tax for a piece
     */
    payEnergyTax: (pieceId: string): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      const action = ActionCreators.energyTax(currentPlayer.id, pieceId)
      
      const result = gameEngine.executeEnergyTax(currentState, action)
      return applyEngineResult(result)
    },

    /**
     * Convert fat to emergency energy
     */
    convertFatToEmergencyEnergy: (pieceId: string, fatAmount: number): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      const action = ActionCreators.emergencyEnergy(currentPlayer.id, pieceId, fatAmount)
      
      const result = gameEngine.executeEmergencyEnergy(currentState, action)
      
      return applyEngineResult(result)
    },

    /**
     * Advance to the next turn
     */
    advanceTurn: (): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      ActionCreators.turnAdvancement(currentPlayer.id)
      
      const result = gameEngine.executeTurnAdvancement(currentState)
      return applyEngineResult(result)
    },

    /**
     * Advance to the next phase of the current turn
     */
    advancePhase: (): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      ActionCreators.phaseAdvancement(currentPlayer.id)
      
      const result = gameEngine.executePhaseAdvancement(currentState)
      return applyEngineResult(result)
    },

    /**
     * Validate if an action can be performed without executing it
     */
    canPerformAction: (action: GameAction): boolean => {
      const currentState = convertToEngineState()
      
      switch (action.type) {
        case 'movement':
          return gameEngine.validateMovement(currentState, action).valid
        case 'eating':
          return gameEngine.validateEating(currentState, action).valid
        case 'hibernation':
          return gameEngine.validateHibernation(currentState, action).valid
        case 'trading':
          return gameEngine.validateTrading(currentState, action).valid
        default:
          return false
      }
    },

    /**
     * Kill a bear due to starvation
     */
    death: (pieceId: string): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      const action = ActionCreators.death(currentPlayer.id, pieceId)
      
      const result = gameEngine.executeDeath(currentState, action)
      return applyEngineResult(result)
    },

    /**
     * Get valid moves for a piece (useful for highlighting)
     */
    getValidMoves: (pieceId: string): string[] => {
      const currentState = convertToEngineState()
      const piece = currentState.players
        .flatMap(p => p.pieces)
        .find(p => p.id === pieceId)
      
      if (!piece) return []
      
      const currentSpace = currentState.board.spaces[piece.spaceId]
      if (!currentSpace) return []
      
      // Get adjacent spaces that are not occupied
      return currentSpace.adjacentSpaces.filter(spaceId => {
        const space = currentState.board.spaces[spaceId]
        return space && !space.piece
      })
    },

    /**
     * Execute a trade between two pieces
     */
    trade: (fromPieceId: string, toPieceId: string, fromResourceType: ResourceType, toResourceType: ResourceType, fromAmount: number, toAmount: number): boolean => {
      const currentState = convertToEngineState()
      const currentPlayer = currentState.players[currentState.currentPlayerIndex]
      
      const action = ActionCreators.trading(
        currentPlayer.id, 
        fromPieceId, 
        toPieceId, 
        fromResourceType, 
        toResourceType, 
        fromAmount, 
        toAmount
      )
      
      const result = gameEngine.executeTrading(currentState, action)
      return applyEngineResult(result)
    },

    /**
     * Get pieces that can trade with a given piece (adjacent pieces from other players)
     */
    getAvailableTradePartners: (pieceId: string): Array<{ pieceId: string; playerId: string | number; spaceId: string }> => {
      const currentState = convertToEngineState()
      const piece = gameEngine['findPiece'](currentState, pieceId)
      
      if (!piece) return []
      
      const pieceSpace = gameEngine['findPieceSpace'](currentState, pieceId)
      if (!pieceSpace) return []
      
      const tradePartners: Array<{ pieceId: string; playerId: string | number; spaceId: string }> = []
      
      // Check all adjacent spaces for pieces from other players
      pieceSpace.adjacentSpaces.forEach(spaceId => {
        const space = currentState.board.spaces[spaceId]
        if (space?.piece && space.piece.playerId !== piece.playerId) {
          tradePartners.push({
            pieceId: space.piece.id,
            playerId: space.piece.playerId,
            spaceId: space.id
          })
        }
      })
      
      return tradePartners
    },

    /**
     * Initialize game with players using engine setup logic
     */
    initializeGameWithPlayers: (players: CoreGameState['players'], board: CoreGameState['board']): boolean => {
      const result = gameEngine.initializeGameWithPlayers(board, players)
      return applyEngineResult(result)
    }
  }
}