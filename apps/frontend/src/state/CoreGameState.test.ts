/**
 * CoreGameState Tests - Test the single source of truth
 * 
 * These tests ensure our core state interface and utilities work correctly
 * and maintain data consistency across all operations.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  CoreGameState,
  createInitialGameState,
  CoreGameStateUtils,
  Player,
  GamePiece,
  GameSpace
} from './CoreGameState'
import { 
  createTestGameState,
  createTestPlayer,
  createTestPiece,
  createTestSpace,
  createCompleteTestGameState,
  testAssertions
} from '@/test/utils/testUtils'

describe('CoreGameState', () => {
  describe('createInitialGameState', () => {
    it('should create valid initial state with defaults', () => {
      const state = createInitialGameState()
      
      testAssertions.stateValid(state)
      expect(state.gamePhase).toBe('setup')
      expect(state.season).toBe('Spring')
      expect(state.year).toBe(1)
      expect(state.turn).toBe(1)
      expect(state.turnPhase).toBe('movement')
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.players).toEqual([])
      expect(state.isGameStarted).toBe(false)
      expect(state.energyTaxPaid).toBe(false)
    })
    
    it('should create state with custom gameId', () => {
      const customId = 'custom-game-123'
      const state = createInitialGameState(customId)
      
      expect(state.gameId).toBe(customId)
    })
    
    it('should create state with timestamps', () => {
      const before = Date.now()
      const state = createInitialGameState()
      const after = Date.now()
      
      expect(state.createdAt).toBeWithinRange(before, after)
      expect(state.lastUpdated).toBeWithinRange(before, after)
    })
  })
  
  describe('CoreGameStateUtils', () => {
    let gameState: CoreGameState
    
    beforeEach(() => {
      gameState = createCompleteTestGameState()
    })
    
    describe('clone', () => {
      it('should create deep copy of state', () => {
        const cloned = CoreGameStateUtils.clone(gameState)
        
        expect(cloned).toEqual(gameState)
        expect(cloned).not.toBe(gameState)
        expect(cloned.players).not.toBe(gameState.players)
        expect(cloned.board).not.toBe(gameState.board)
      })
      
      it('should allow modifications without affecting original', () => {
        const cloned = CoreGameStateUtils.clone(gameState)
        cloned.turn = 999
        cloned.players[0].name = 'Modified Player'
        
        expect(gameState.turn).not.toBe(999)
        expect(gameState.players[0].name).not.toBe('Modified Player')
      })
    })
    
    describe('touch', () => {
      it('should update lastUpdated timestamp', () => {
        const originalTimestamp = gameState.lastUpdated
        const newTimestamp = originalTimestamp + 1000 // Explicitly control timestamp
        
        const touched = CoreGameStateUtils.touch(gameState, newTimestamp)
        
        expect(touched.lastUpdated).toBe(newTimestamp)
        expect(touched.lastUpdated).toBeGreaterThan(originalTimestamp)
      })
      
      it('should preserve all other state', () => {
        const touched = CoreGameStateUtils.touch(gameState)
        
        expect(touched.gameId).toBe(gameState.gameId)
        expect(touched.players).toBe(gameState.players)
        expect(touched.board).toBe(gameState.board)
        expect(touched.turn).toBe(gameState.turn)
      })
    })
    
    describe('getPiece', () => {
      it('should find piece by ID', () => {
        const piece = CoreGameStateUtils.getPiece(gameState, 'bear-1-1')
        
        expect(piece).toBeDefined()
        expect(piece?.id).toBe('bear-1-1')
        expect(piece?.playerId).toBe('player-1')
      })
      
      it('should return null for non-existent piece', () => {
        const piece = CoreGameStateUtils.getPiece(gameState, 'non-existent')
        
        expect(piece).toBeNull()
      })
      
      it('should search across all players', () => {
        const piece1 = CoreGameStateUtils.getPiece(gameState, 'bear-1-1')
        const piece2 = CoreGameStateUtils.getPiece(gameState, 'bear-2-1')
        
        expect(piece1?.playerId).toBe('player-1')
        expect(piece2?.playerId).toBe('player-2')
      })
    })
    
    describe('getSpace', () => {
      it('should find regular space by ID', () => {
        const space = CoreGameStateUtils.getSpace(gameState, 'space-1')
        
        expect(space).toBeDefined()
        expect(space?.id).toBe('space-1')
        expect(space?.quadrant).toBe('Pastures')
      })
      
      it('should find bridge space by ID', () => {
        // Add bridge space to test state
        const bridgeSpace = createTestSpace({ 
          id: 'bridge-center',
          ring: 0,
          quadrant: 'Bridge',
          subArea: 'Center'
        })
        gameState.board.bridges['bridge-center'] = bridgeSpace
        
        const space = CoreGameStateUtils.getSpace(gameState, 'bridge-center')
        
        expect(space).toBeDefined()
        expect(space?.id).toBe('bridge-center')
        expect(space?.quadrant).toBe('Bridge')
      })
      
      it('should return null for non-existent space', () => {
        const space = CoreGameStateUtils.getSpace(gameState, 'non-existent')
        
        expect(space).toBeNull()
      })
    })
    
    describe('getCurrentPlayer', () => {
      it('should return current player based on index', () => {
        gameState.currentPlayerIndex = 0
        const player = CoreGameStateUtils.getCurrentPlayer(gameState)
        
        expect(player?.id).toBe('player-1')
        expect(player?.name).toBe('Player 1')
      })
      
      it('should return second player when index is 1', () => {
        gameState.currentPlayerIndex = 1
        const player = CoreGameStateUtils.getCurrentPlayer(gameState)
        
        expect(player?.id).toBe('player-2')
        expect(player?.name).toBe('Player 2')
      })
      
      it('should return null for invalid index', () => {
        gameState.currentPlayerIndex = 999
        const player = CoreGameStateUtils.getCurrentPlayer(gameState)
        
        expect(player).toBeNull()
      })
      
      it('should return null when no players exist', () => {
        gameState.players = []
        gameState.currentPlayerIndex = 0
        const player = CoreGameStateUtils.getCurrentPlayer(gameState)
        
        expect(player).toBeNull()
      })
    })
    
    describe('getPlayer', () => {
      it('should find player by ID', () => {
        const player = CoreGameStateUtils.getPlayer(gameState, 'player-1')
        
        expect(player).toBeDefined()
        expect(player?.id).toBe('player-1')
        expect(player?.name).toBe('Player 1')
      })
      
      it('should return null for non-existent player', () => {
        const player = CoreGameStateUtils.getPlayer(gameState, 'non-existent')
        
        expect(player).toBeNull()
      })
    })
  })
  
  describe('State Consistency', () => {
    it('should maintain piece-space relationships', () => {
      const state = createCompleteTestGameState()
      
      // Check that pieces reference correct spaces
      const piece1 = state.players[0].pieces[0]
      const space1 = state.board.spaces[piece1.spaceId]
      
      expect(space1.piece?.id).toBe(piece1.id)
      expect(piece1.spaceId).toBe(space1.id)
    })
    
    it('should maintain player-piece relationships', () => {
      const state = createCompleteTestGameState()
      
      state.players.forEach(player => {
        player.pieces.forEach(piece => {
          expect(piece.playerId).toBe(player.id)
        })
      })
    })
    
    it('should have valid piece counts', () => {
      const state = createCompleteTestGameState()
      
      state.players.forEach(player => {
        const bearCount = player.pieces.filter(p => p.type === 'bear').length
        const cubCount = player.pieces.filter(p => p.type === 'cub').length
        
        expect(player.pieceCount.bears).toBe(bearCount)
        expect(player.pieceCount.cubs).toBe(cubCount)
        expect(player.pieceCount.bears).toBeLessThanOrEqual(player.pieceCount.maxBears)
        expect(player.pieceCount.cubs).toBeLessThanOrEqual(player.pieceCount.maxCubs)
      })
    })
  })
  
  describe('Test Utilities', () => {
    it('should create valid test player', () => {
      const player = createTestPlayer({ name: 'Custom Player' })
      
      expect(player.id).toBeDefined()
      expect(player.name).toBe('Custom Player')
      expect(player.color).toBeDefined()
      expect(player.pieceCount).toBeDefined()
      expect(player.score).toBe(0)
    })
    
    it('should create valid test piece', () => {
      const piece = createTestPiece({ type: 'cub', energy: 5 })
      
      expect(piece.id).toBeDefined()
      expect(piece.type).toBe('cub')
      expect(piece.energy).toBe(5)
      expect(piece.resources).toBeDefined()
      expect(piece.fat).toBeGreaterThan(0)
    })
    
    it('should create valid test space', () => {
      const space = createTestSpace({ quadrant: 'Mountains', hasHoney: true })
      
      expect(space.id).toBeDefined()
      expect(space.quadrant).toBe('Mountains')
      expect(space.hasHoney).toBe(true)
      expect(space.ring).toBeGreaterThan(0)
      expect(space.adjacentSpaces).toEqual([])
    })
    
    it('should create complete test game state', () => {
      const state = createCompleteTestGameState()
      
      testAssertions.stateValid(state)
      expect(state.gamePhase).toBe('playing')
      expect(state.isGameStarted).toBe(true)
      expect(state.players).toHaveLength(2)
      expect(Object.keys(state.board.spaces)).toHaveLength(2)
      
      // Check consistency
      state.players.forEach(player => {
        expect(player.pieces).toHaveLength(1)
        expect(player.pieceCount.bears).toBe(1)
      })
    })
  })
  
  describe('Type Safety', () => {
    it('should enforce quadrant types', () => {
      const space = createTestSpace({ quadrant: 'Forests' })
      expect(space.quadrant).toBe('Forests')
      
      // TypeScript should prevent invalid quadrants at compile time
      // This test verifies the interface is properly typed
    })
    
    it('should enforce game phase types', () => {
      const state = createTestGameState({ gamePhase: 'playing' })
      expect(state.gamePhase).toBe('playing')
    })
    
    it('should enforce piece types', () => {
      const piece = createTestPiece({ type: 'bear' })
      expect(piece.type).toBe('bear')
    })
  })
})