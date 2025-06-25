/**
 * Simulation Engine - Runs complete games without UI
 * 
 * This is the core engine that:
 * 1. Creates a game state
 * 2. Manages AI players
 * 3. Executes turns
 * 4. Collects statistics
 * 
 * Now uses the shared rules engine to ensure identical mechanics with main game.
 */

import { AIPlayer, AIStrategy, GameStatistics, AIDecision } from './GameSimulator'
import { createInitialGameState, SimulationGameState } from './GameStateFactory'
import {
  executeEatFood,
  executeMovement,
  executeDailyEnergyTax,
  convertFatToEmergencyEnergy,
  executeHibernation,
  executeHarvest,
  DEFAULT_CONFIG,
  EMERGENCY_CONVERSION,
  type ResourceType,
} from '../shared/gameRules'

export interface SimulationConfig {
  playerCount: number
  strategies: AIStrategy[]
  maxTurns: number // Prevent infinite games
  maxYears: number
  logLevel: 'none' | 'summary' | 'detailed'
}

export class SimulationEngine {
  private gameState: SimulationGameState
  private aiPlayers: AIPlayer[]
  private statistics: GameStatistics
  private turnCount: number = 0
  
  constructor(private config: SimulationConfig) {
    // Initialize game with AI players
    this.aiPlayers = this.createAIPlayers()
    this.gameState = createInitialGameState(this.aiPlayers.map(ai => ({
      id: ai.id,
      name: ai.name
    })))
    
    // Initialize statistics tracking
    this.statistics = this.initializeStatistics()
  }
  
  /**
   * Run a complete game simulation
   * Returns statistics about the game
   */
  async runGame(): Promise<GameStatistics> {
    this.log('Starting game simulation', 'summary')
    
    // Main game loop
    while (!this.isGameOver()) {
      await this.runTurn()
      this.turnCount++
      
      // Safety check to prevent infinite games
      if (this.turnCount > this.config.maxTurns) {
        this.log('Game exceeded max turns, ending', 'summary')
        break
      }
    }
    
    // Finalize statistics
    this.finalizeStatistics()
    this.log(`Game completed in ${this.turnCount} turns`, 'summary')
    
    return this.statistics
  }
  
  /**
   * Run a single turn for the current player
   */
  private async runTurn() {
    const currentPlayer = this.getCurrentAIPlayer()
    if (!currentPlayer) return
    
    this.log(`Turn ${this.turnCount}: ${currentPlayer.name}'s turn`, 'detailed')
    
    // Fat burning and energy loss are now player choices during movement phase
    
    // Execute each phase of the turn
    const phases = this.getTurnPhases()
    
    for (const phase of phases) {
      this.gameState.turnPhase = phase
      
      // Special handling for automatic phases
      if (phase === 'harvest') {
        this.executeHarvest()
        continue
      }
      
      // Get AI decision for this phase
      const decision = currentPlayer.makeDecision(this.gameState, phase)
      
      // Execute the decision
      await this.executeDecision(currentPlayer, decision)
      
      // Check for deaths after each phase
      this.checkForDeaths()
    }
    
    // End turn, advance to next player
    this.advanceToNextPlayer()
  }
  
  /**
   * Execute an AI player's decision
   * This modifies the game state based on what the AI chose
   */
  private async executeDecision(player: AIPlayer, decision: AIDecision) {
    switch (decision.type) {
      case 'movement_phase':
        // Execute fat burning first (to get energy for movement)
        for (const fatBurn of decision.actions.fatBurning) {
          this.executeFatBurning(fatBurn.pieceId, fatBurn.fatAmount)
        }
        
        // Then execute energy loss (daily tax)
        for (const energyLoss of decision.actions.energyLoss) {
          this.executeEnergyLoss(energyLoss.pieceId)
        }
        
        // Finally execute movements (using available energy)
        for (const move of decision.actions.movements) {
          this.executeMove(move.pieceId, move.targetSpaceId)
        }
        break
        
      case 'eat':
        for (const eat of decision.eatDecisions) {
          this.executeEat(eat.pieceId, eat.resource, eat.amount, eat.convertTo)
        }
        break
        
      case 'hibernate':
        for (const pieceId of decision.pieceIds) {
          this.executeHibernation(pieceId)
        }
        break
        
      case 'continue':
        // No action needed
        break
    }
  }
  
  /**
   * Execute a move action
   * Updates piece position and energy using shared rules engine
   */
  private executeMove(pieceId: string, targetSpaceId: string) {
    const piece = this.findPiece(pieceId)
    const currentSpace = this.findPieceSpace(pieceId)
    const targetSpace = this.gameState.board.spaces[targetSpaceId]
    
    if (!piece || !currentSpace || !targetSpace || targetSpace.piece) {
      this.log(`Invalid move: ${pieceId} to ${targetSpaceId}`, 'detailed')
      return
    }
    
    // Use shared rules engine for movement
    const moveResult = executeMovement(piece, this.gameState.season, currentSpace.quadrant, DEFAULT_CONFIG)
    
    if (!moveResult.success) {
      this.log(`Move failed: ${moveResult.message}`, 'detailed')
      return
    }
    
    // Execute move on board
    currentSpace.piece = null
    targetSpace.piece = moveResult.newPiece
    
    // Update piece in player's pieces array
    const player = this.gameState.players.find(p => p.pieces.some(p => p.id === pieceId))
    if (player) {
      const pieceIndex = player.pieces.findIndex(p => p.id === pieceId)
      if (pieceIndex !== -1) {
        player.pieces[pieceIndex] = moveResult.newPiece
      }
    }
    
    // Update statistics
    const movementCost = piece.energy + piece.emergencyEnergy - (moveResult.newPiece.energy + moveResult.newPiece.emergencyEnergy)
    this.statistics.energySpentOnMovement += movementCost
    
    this.log(`Moved ${pieceId} from ${currentSpace.id} to ${targetSpace.id} (${moveResult.message})`, 'detailed')
  }
  
  /**
   * Execute eating action
   * Converts resources to energy or fat using shared rules engine
   */
  private executeEat(
    pieceId: string, 
    resource: ResourceType,
    amount: number,
    convertTo: 'energy' | 'fat'
  ) {
    const piece = this.findPiece(pieceId)
    if (!piece) {
      this.log(`Invalid eat: piece ${pieceId} not found`, 'detailed')
      return
    }
    
    // Use shared rules engine for eating
    const eatResult = executeEatFood(piece, resource, amount, convertTo, DEFAULT_CONFIG)
    
    if (!eatResult.success) {
      this.log(`Eat failed: ${eatResult.message}`, 'detailed')
      return
    }
    
    // Update piece in player's pieces array
    const player = this.gameState.players.find(p => p.pieces.some(p => p.id === pieceId))
    if (player) {
      const pieceIndex = player.pieces.findIndex(p => p.id === pieceId)
      if (pieceIndex !== -1) {
        player.pieces[pieceIndex] = eatResult.newPiece
      }
    }
    
    // Update statistics
    if (resource === 'grains' || resource === 'berries' || resource === 'salmon') {
      this.statistics.resourcesConsumed[resource] += amount
    }
    
    this.log(`${pieceId} ate ${amount} ${resource} for ${convertTo} (${eatResult.message})`, 'detailed')
  }
  
  /**
   * Execute harvest phase
   * Automatically collects resources based on location using shared rules engine
   */
  private executeHarvest() {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    
    for (const piece of currentPlayer.pieces) {
      if (piece.isHibernating) continue
      
      const space = this.findPieceSpace(piece.id)
      if (!space) continue
      
      // Use shared rules engine for harvesting
      const harvestResult = executeHarvest(piece, space, this.gameState.season, DEFAULT_CONFIG)
      
      // Update piece in player's pieces array
      const pieceIndex = currentPlayer.pieces.findIndex(p => p.id === piece.id)
      if (pieceIndex !== -1) {
        currentPlayer.pieces[pieceIndex] = harvestResult.newPiece
      }
      
      // Update statistics for tracked resources
      this.statistics.resourcesCollected.grains += harvestResult.harvested.grains
      this.statistics.resourcesCollected.berries += harvestResult.harvested.berries
      this.statistics.resourcesCollected.salmon += harvestResult.harvested.salmon
      
      this.log(`${piece.id} harvested: ${harvestResult.message}`, 'detailed')
    }
  }
  
  /**
   * Execute fat burning for a specific piece
   * Converts fat to emergency energy as player choice
   */
  private executeFatBurning(pieceId: string, fatAmount?: number) {
    const piece = this.findPiece(pieceId)
    if (!piece || piece.isHibernating) {
      this.log(`Cannot burn fat: ${pieceId} not found or hibernating`, 'detailed')
      return
    }
    
    const amountToConvert = fatAmount || Math.min(piece.fat, EMERGENCY_CONVERSION.maxFatPerTurn)
    
    if (amountToConvert <= 0) {
      this.log(`${pieceId} has no fat to burn`, 'detailed')
      return
    }
    
    const conversionResult = convertFatToEmergencyEnergy(piece, amountToConvert, DEFAULT_CONFIG)
    
    if (!conversionResult.success) {
      this.log(`Fat burning failed: ${conversionResult.message}`, 'detailed')
      return
    }
    
    // Update piece in player's pieces array
    const player = this.gameState.players.find(p => p.pieces.some(p => p.id === pieceId))
    if (player) {
      const pieceIndex = player.pieces.findIndex(p => p.id === pieceId)
      if (pieceIndex !== -1) {
        player.pieces[pieceIndex] = conversionResult.newPiece
        this.log(`${pieceId} burned ${amountToConvert} fat for emergency energy`, 'detailed')
      }
    }
  }
  
  /**
   * Execute daily energy loss for a specific piece
   * Applies the daily energy tax as player choice
   */
  private executeEnergyLoss(pieceId: string) {
    const piece = this.findPiece(pieceId)
    const space = this.findPieceSpace(pieceId)
    
    if (!piece || !space || piece.isHibernating) {
      this.log(`Cannot apply energy loss: ${pieceId} not found or hibernating`, 'detailed')
      return
    }
    
    const energyLossResult = executeDailyEnergyTax(piece, this.gameState.season, space.quadrant, DEFAULT_CONFIG)
    
    // Update piece in player's pieces array
    const player = this.gameState.players.find(p => p.pieces.some(p => p.id === pieceId))
    if (player) {
      const pieceIndex = player.pieces.findIndex(p => p.id === pieceId)
      if (pieceIndex !== -1) {
        player.pieces[pieceIndex] = energyLossResult.newPiece
        this.log(`${pieceId} daily energy loss: ${energyLossResult.message}`, 'detailed')
      }
    }
  }
  
  /**
   * Execute hibernation
   * Uses shared rules engine for hibernation logic
   */
  private executeHibernation(pieceId: string) {
    const piece = this.findPiece(pieceId)
    const space = this.findPieceSpace(pieceId)
    
    if (!piece || !space) {
      this.log(`Cannot hibernate: ${pieceId} not found`, 'detailed')
      return
    }
    
    // Use shared rules engine for hibernation
    const hibernationResult = executeHibernation(piece, space.quadrant, this.gameState.season, DEFAULT_CONFIG)
    
    if (!hibernationResult.success) {
      this.log(`Hibernation failed: ${hibernationResult.message}`, 'detailed')
      return
    }
    
    // Update piece in player's pieces array
    const player = this.gameState.players.find(p => p.pieces.some(p => p.id === pieceId))
    if (player) {
      const pieceIndex = player.pieces.findIndex(p => p.id === pieceId)
      if (pieceIndex !== -1) {
        player.pieces[pieceIndex] = hibernationResult.newPiece
      }
    }
    
    // Update statistics
    this.statistics.hibernationCount++
    
    this.log(`${pieceId} hibernation: ${hibernationResult.message}`, 'detailed')
  }
  
  /**
   * Check for bear deaths
   * Bears die if they have 0 energy at turn end
   */
  private checkForDeaths() {
    for (const player of this.gameState.players) {
      const alivePieces = player.pieces.filter(piece => {
        if (piece.energy <= 0 && !piece.isHibernating) {
          // Bear dies
          this.log(`${piece.id} died from starvation`, 'summary')
          
          // Remove from board
          const space = this.findPieceSpace(piece.id)
          if (space) space.piece = null
          
          // Track in statistics
          this.statistics.deathsByStarvation++
          
          return false
        }
        return true
      })
      
      // Check if player is eliminated
      if (alivePieces.length === 0 && player.pieces.length > 0) {
        this.statistics.playerEliminations.push({
          playerId: player.id.toString(),
          turn: this.turnCount,
          reason: 'all bears died'
        })
      }
      
      player.pieces = alivePieces
    }
  }
  
  /**
   * Advance to next player and handle turn/season changes
   */
  private advanceToNextPlayer() {
    // Energy loss is now handled as player choice during movement phase
    const nextPlayerIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length
    
    // Update game state
    this.gameState.currentPlayerIndex = nextPlayerIndex
    this.gameState.turn++
    
    // Check for season change
    if (this.gameState.turn >= 4) { // 4 turns per season
      this.advanceSeason()
      this.gameState.turn = 0
    }
  }
  
  /**
   * Advance to next season
   */
  private advanceSeason() {
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'] as const
    const currentIndex = seasons.indexOf(this.gameState.season)
    const nextIndex = (currentIndex + 1) % seasons.length
    
    this.gameState.season = seasons[nextIndex]
    
    // Handle year advancement
    if (nextIndex === 0) {
      this.gameState.year++
      
      // Wake hibernating bears in spring
      this.wakeHibernatingBears()
    }
    
    this.log(`Season changed to ${this.gameState.season}, Year ${this.gameState.year}`, 'summary')
  }
  
  /**
   * Wake all hibernating bears (happens in Spring)
   */
  private wakeHibernatingBears() {
    for (const player of this.gameState.players) {
      for (const piece of player.pieces) {
        if (piece.isHibernating) {
          piece.isHibernating = false
          this.log(`${piece.id} woke from hibernation`, 'detailed')
          
          // Check if bear gets a cub (simplified - would need more logic)
          // For now, we'll skip cub spawning in simulation
        }
      }
    }
  }
  
  /**
   * Check if game is over
   */
  private isGameOver(): boolean {
    // Game ends if only one player remains
    const alivePlayers = this.gameState.players.filter(p => p.pieces.length > 0)
    
    if (alivePlayers.length <= 1) {
      if (alivePlayers.length === 1) {
        this.statistics.winner = alivePlayers[0].id.toString()
      }
      return true
    }
    
    // Game ends if we exceed max years
    if (this.gameState.year > this.config.maxYears) {
      // Winner is player with most pieces
      const winner = this.gameState.players.reduce((best, player) => 
        player.pieces.length > best.pieces.length ? player : best
      )
      this.statistics.winner = winner.id.toString()
      return true
    }
    
    return false
  }
  
  // Helper methods
  private createAIPlayers(): AIPlayer[] {
    const players: AIPlayer[] = []
    
    for (let i = 0; i < this.config.playerCount; i++) {
      const strategy = this.config.strategies[i % this.config.strategies.length]
      players.push(new AIPlayer(
        `player-${i}`,
        strategy,
        `${strategy}-${i}`
      ))
    }
    
    return players
  }
  
  private getCurrentAIPlayer(): AIPlayer | null {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    return this.aiPlayers.find(ai => ai.id === currentPlayer.id) || null
  }
  
  private getTurnPhases() {
    // Simplified - would need hibernation phase logic
    return ['movement', 'harvest', 'eat'] as const
  }
  
  private findPiece(pieceId: string) {
    for (const player of this.gameState.players) {
      const piece = player.pieces.find(p => p.id === pieceId)
      if (piece) return piece
    }
    return null
  }
  
  private findPieceSpace(pieceId: string) {
    return Object.values(this.gameState.board.spaces)
      .find(space => space.piece?.id === pieceId) || null
  }
  
  private initializeStatistics(): GameStatistics {
    return {
      gameId: `sim-${Date.now()}`,
      winner: null,
      turns: 0,
      years: 0,
      playerEliminations: [],
      hibernationCount: 0,
      resourcesCollected: { grains: 0, berries: 0, salmon: 0 },
      resourcesConsumed: { grains: 0, berries: 0, salmon: 0 },
      energySpentOnMovement: 0,
      deathsByStarvation: 0,
      finalScores: {},
      strategyPerformance: {}
    }
  }
  
  private finalizeStatistics() {
    this.statistics.turns = this.turnCount
    this.statistics.years = this.gameState.year
    
    // Calculate final scores
    for (const player of this.gameState.players) {
      this.statistics.finalScores[player.id.toString()] = player.pieces.length
    }
    
    // Track strategy performance
    for (const ai of this.aiPlayers) {
      if (!this.statistics.strategyPerformance[ai.strategy]) {
        this.statistics.strategyPerformance[ai.strategy] = { wins: 0, survivals: 0 }
      }
      
      const perf = this.statistics.strategyPerformance[ai.strategy]
      if (this.statistics.winner === ai.id) {
        perf.wins++
      }
      const playerPieces = this.gameState.players.find(p => p.id === ai.id)?.pieces
      if (playerPieces && playerPieces.length > 0) {
        perf.survivals++
      }
    }
  }
  
  private log(message: string, level: 'summary' | 'detailed') {
    if (this.config.logLevel === 'none') return
    if (this.config.logLevel === 'summary' && level === 'detailed') return
    
    console.log(`[SIM] ${message}`)
  }
}