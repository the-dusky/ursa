/**
 * ActionDispatcher Tests - Test single entry point for all actions
 * 
 * These tests ensure the ActionDispatcher properly validates, processes,
 * and coordinates all game actions while maintaining the clean architecture.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  AnyGameAction,
  MovePieceAction,
  ActionDispatcher,
  ActionCreators
} from './ActionDispatcher'
import { StateManager } from './StateManager'
import { CoreGameState } from './CoreGameState'
import {
  createTestGameState,
  createCompleteTestGameState,
  createTestStateManager,
  createTestActionDispatcher,
  testAssertions
} from '@/test/utils/testUtils'

// Use strict types where possible and remove 'as any' where avoidable

describe('ActionDispatcher', () => {
  let stateManager: StateManager
  let actionDispatcher: ActionDispatcher
  let gameState: CoreGameState

  beforeEach(() => {
    gameState = createCompleteTestGameState()
    stateManager = createTestStateManager(gameState)
    actionDispatcher = new ActionDispatcher(stateManager)
  })

  describe('Validation', () => {
    it('fails without type', async () => {
      const invalidAction = {} as unknown as AnyGameAction
      const result = await actionDispatcher.dispatch(invalidAction)
      testAssertions.actionFailed(result, 'Action type is required')
    })

    it('fails for missing player', async () => {
      const action = ActionCreators.movePiece('bear-1-1', 'space-1', 'space-2', 'non-existent-player')
      const result = await actionDispatcher.dispatch(action)
      testAssertions.actionFailed(result, 'Player non-existent-player not found')
    })

    it('fails for non-existent piece', async () => {
      const action = ActionCreators.movePiece('bad-piece', 'space-1', 'space-2', 'player-1')
      const result = await actionDispatcher.dispatch(action)
      testAssertions.actionFailed(result, 'Piece bad-piece not found')
    })

    it('fails for wrong owner', async () => {
      const action = ActionCreators.movePiece('bear-2-1', 'space-2', 'space-1', 'player-1')
      const result = await actionDispatcher.dispatch(action)
      testAssertions.actionFailed(result, 'Cannot move piece belonging to another player')
    })

    it('fails for bad spaces', async () => {
      const action = ActionCreators.movePiece('bear-1-1', 'space-1', 'bad-space', 'player-1')
      const result = await actionDispatcher.dispatch(action)
      testAssertions.actionFailed(result, 'Invalid space IDs')
    })

    it('fails for wrong piece location', async () => {
      const piece = gameState.players[0].pieces[0]
      gameState.board.spaces['space-1'].piece = null
      gameState.board.spaces['space-2'].piece = piece
      piece.spaceId = 'space-2'
      const action = ActionCreators.movePiece(piece.id, 'space-1', 'space-2', piece.playerId)
      const result = await actionDispatcher.dispatch(action)
      testAssertions.actionFailed(result, 'location mismatch')
    })
  })

  describe('Dispatching Actions', () => {
    it('adds timestamp and logs action', async () => {
      const before = Date.now()
      const action = ActionCreators.rollDice('position')
      const result = await actionDispatcher.dispatch(action)
      const after = Date.now()
      const history = actionDispatcher.getActionHistory()
      expect(history[0].action.timestamp).toBeWithinRange(before, after)
      expect(history).toHaveLength(1)
    })

    it('keeps last 100 actions only', async () => {
      for (let i = 0; i < 105; i++) {
        await actionDispatcher.dispatch(ActionCreators.rollDice('position'))
      }
      expect(actionDispatcher.getActionHistory()).toHaveLength(100)
    })

    it('handles missing handler', async () => {
      const result = await actionDispatcher.dispatch({ type: 'UNKNOWN' } as unknown as AnyGameAction)
      testAssertions.actionFailed(result, 'No handler registered')
    })

    it('handles handler exceptions', async () => {
      actionDispatcher.registerHandler('BOOM' as any, () => { throw new Error('Boom') })
      const result = await actionDispatcher.dispatch({ type: 'BOOM' } as unknown as AnyGameAction)
      testAssertions.actionFailed(result, 'Boom')
    })
  })

  describe('State Updates', () => {
    it('updates state on success', async () => {
      const result = await actionDispatcher.dispatch(ActionCreators.rollDice('position'))
      testAssertions.actionSucceeded(result)
      expect(stateManager.state.diceState.positionRolls?.dice).toBeDefined()
      expect(stateManager.state.diceState.positionRolls?.dice.length).toBe(5)
      stateManager.state.diceState.positionRolls?.dice.forEach(die => {
        expect(die).toBeWithinRange(1, 6)
      })
    })

    it('does not update state on failure', async () => {
      const originalState = stateManager.state
      const result = await actionDispatcher.dispatch(ActionCreators.movePiece('bad', 'space-1', 'space-2', 'player-1'))
      testAssertions.actionFailed(result)
      expect(stateManager.state).toEqual(originalState)
    })

    it('handles state update failure', async () => {
      vi.spyOn(stateManager, 'updateState').mockReturnValueOnce({
        success: false,
        error: 'Mock failure',
        state: gameState
      })

      actionDispatcher.registerHandler('MOCK_UPDATE' as any, () => ({
        success: true,
        state: gameState,
        newState: gameState
      }))

      const result = await actionDispatcher.dispatch({ type: 'MOCK_UPDATE' } as unknown as AnyGameAction)
      testAssertions.actionFailed(result, 'Mock failure')
    })
  })

  describe('Custom Logic', () => {
    it('allows custom handlers', async () => {
      const handler = vi.fn().mockReturnValue({ success: true, state: gameState, newState: gameState })
      actionDispatcher.registerHandler('CUSTOM', handler)
      const result = await actionDispatcher.dispatch({ type: 'CUSTOM' } as unknown as AnyGameAction)
      testAssertions.actionSucceeded(result)
      expect(handler).toHaveBeenCalled()
    })

    it('allows custom validators', async () => {
      const validator = vi.fn().mockReturnValue({ valid: false, reason: 'Nope' })
      actionDispatcher.registerValidator('ROLL_DICE', validator)
      const result = await actionDispatcher.dispatch(ActionCreators.rollDice('position'))
      testAssertions.actionFailed(result, 'Nope')
    })
  })

  describe('Game Lifecycle', () => {
    it('starts game', async () => {
      const action = ActionCreators.startGame(2)
      const result = await actionDispatcher.dispatch(action)
      testAssertions.actionSucceeded(result)
      expect(stateManager.state.isGameStarted).toBe(true)
    })

    it('resets game and retains ID', async () => {
      const originalId = gameState.gameId
      const result = await actionDispatcher.dispatch(ActionCreators.resetGame())
      testAssertions.actionSucceeded(result)
      expect(stateManager.state.gameId).toBe(originalId)
    })
  })

  describe('Performance', () => {
    it('can process 100 actions quickly', async () => {
      const start = performance.now()
      await Promise.all(
        Array.from({ length: 100 }, () =>
          actionDispatcher.dispatch(ActionCreators.rollDice('position'))
        )
      )
      const duration = performance.now() - start
      expect(duration).toBeLessThan(1000)
    })
  })
})