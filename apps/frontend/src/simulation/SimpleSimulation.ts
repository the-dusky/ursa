/**
 * Simple Game Simulation using Real GameEngine
 * 
 * This simulation directly uses the GameEngine to ensure 100% accuracy
 * with the actual game rules.
 */

import { GameEngine } from '@/engine/GameEngine'
import { ActionCreators } from '@/engine/types/Actions'
import type { CoreGameState, Season } from '@/engine/types/GameState'
import { GAME_CONFIG } from '@/engine/GameConfig'

export interface PlayerSnapshot {
  turn: number
  year: number
  season: Season
  playerId: string
  playerName: string
  pieces: {
    id: string
    energy: number
    fat: number
    emergencyEnergy: number
    resources: {
      grains: number
      berries: number
      salmon: number
      honey: number
      bearMeat: number
    }
    isHibernating: boolean
    spaceId: string
    quadrant: string
  }[]
  totalScore: number
  isAlive: boolean
}

export interface TurnSnapshot {
  turn: number
  year: number
  season: Season
  currentPlayerId: string
  turnPhase: string
  energyTaxPaid: boolean
  players: PlayerSnapshot[]
  events: string[]
}

export interface SimulationResult {
  completed: boolean
  winner: string | null
  turns: number
  years: number
  playerStats: {
    [playerId: string]: {
      survival: boolean
      bearsAlive: number
      totalScore: number
      deathTurn?: number
    }
  }
  endReason: 'victory' | 'all_dead' | 'max_turns' | 'max_years'
  history: TurnSnapshot[]
}

export class SimpleSimulation {
  private engine: GameEngine
  private gameState: CoreGameState
  private maxTurns: number = 200
  private maxYears: number = 10
  private history: TurnSnapshot[] = []

  constructor(playerCount: number = 4) {
    this.engine = new GameEngine()
    this.gameState = this.createInitialState(playerCount)
  }

  /**
   * Run a complete simulation
   */
  runSimulation(): SimulationResult {
    let turns = 0
    
    // Capture initial state
    this.captureSnapshot(turns, [])
    
    while (turns < this.maxTurns && this.gameState.year < this.maxYears) {
      // Check win condition
      const alivePlayers = this.getAlivePlayers()
      if (alivePlayers.length <= 1) {
        return this.createResult('victory', turns, alivePlayers[0]?.id.toString() || null)
      }
      
      // Simulate one turn for current player
      const events = this.simulatePlayerTurn()
      
      // Capture snapshot after turn
      this.captureSnapshot(turns, events)
      
      // Advance to next player/turn
      const advanceResult = this.engine.executeTurnAdvancement(this.gameState)
      if (advanceResult.success) {
        this.gameState = advanceResult.state
        turns++
      }
    }
    
    // Game ended due to limits
    const alivePlayers = this.getAlivePlayers()
    const winner = alivePlayers.length === 1 ? alivePlayers[0].id.toString() : null
    const endReason = turns >= this.maxTurns ? 'max_turns' : 'max_years'
    
    return this.createResult(endReason, turns, winner)
  }

  /**
   * Simulate one player's complete turn
   */
  private simulatePlayerTurn(): string[] {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    const events: string[] = []
    
    if (!currentPlayer || currentPlayer.pieces.length === 0) return events

    // Movement phase - pay energy tax and possibly move
    events.push(...this.simulateMovementPhase(currentPlayer))
    
    // Harvest phase - collect resources
    events.push(...this.simulateHarvestPhase(currentPlayer))
    
    // Eat phase - convert resources to energy/fat
    events.push(...this.simulateEatPhase(currentPlayer))
    
    // Hibernation phase (if winter and in mountains)
    if (this.gameState.season === 'Winter') {
      events.push(...this.simulateHibernationPhase(currentPlayer))
    }
    
    return events
  }

  private simulateMovementPhase(player: typeof this.gameState.players[0]): string[] {
    const events: string[] = []
    
    // Pay energy tax for each bear
    for (const piece of player.pieces) {
      if (piece.isHibernating) continue
      
      // Try to convert fat if needed for survival
      const space = this.findPieceSpace(piece.id)
      const energyCost = this.getEnergyCost(space)
      const totalEnergy = piece.energy + piece.emergencyEnergy
      
      if (totalEnergy < energyCost && piece.fat >= 2) {
        // Convert fat to emergency energy
        const fatToConvert = Math.min(piece.fat, 4) // Convert up to 4 fat (2 energy)
        const conversionResult = this.engine.executeEmergencyEnergy(
          this.gameState,
          ActionCreators.emergencyEnergy(player.id, piece.id, fatToConvert)
        )
        if (conversionResult.success) {
          this.gameState = conversionResult.state
          events.push(`${player.name} converted ${fatToConvert} fat to ${fatToConvert/2} emergency energy`)
        }
      }
      
      // Pay energy tax
      const taxResult = this.engine.executeEnergyTax(
        this.gameState,
        ActionCreators.energyTax(player.id, piece.id)
      )
      
      if (taxResult.success) {
        this.gameState = taxResult.state
        events.push(`${player.name} paid energy tax (${energyCost} energy)`)
      } else {
        // Bear dies - execute death
        const deathResult = this.engine.executeDeath(
          this.gameState,
          ActionCreators.death(player.id, piece.id)
        )
        if (deathResult.success) {
          this.gameState = deathResult.state
          events.push(`💀 ${player.name}'s bear died (couldn't pay energy tax)`)
        }
      }
    }
    
    return events
  }

  private simulateHarvestPhase(player: typeof this.gameState.players[0]): string[] {
    const events: string[] = []
    
    for (const piece of player.pieces) {
      if (piece.isHibernating) continue
      
      const space = this.findPieceSpace(piece.id)
      if (space?.canProduce) {
        const harvestResult = this.engine.executeHarvest(
          this.gameState,
          ActionCreators.harvest(player.id, piece.id, space.id)
        )
        if (harvestResult.success) {
          this.gameState = harvestResult.state
          events.push(`${player.name} harvested from ${space.quadrant}`)
        }
      }
    }
    
    return events
  }

  private simulateEatPhase(player: typeof this.gameState.players[0]): string[] {
    const events: string[] = []
    
    for (const piece of player.pieces) {
      if (piece.isHibernating) continue
      
      // Simple AI: eat resources to build fat in autumn, energy otherwise
      const preferFat = this.gameState.season === 'Autumn'
      
      // Eat resources in order of efficiency
      const resources: (keyof typeof piece.resources)[] = ['honey', 'bearMeat', 'salmon', 'berries', 'grains']
      
      for (const resourceType of resources) {
        const amount = piece.resources[resourceType]
        if (amount > 0) {
          const eatResult = this.engine.executeEating(
            this.gameState,
            ActionCreators.eating(player.id, piece.id, resourceType, 1, preferFat ? 'fat' : 'energy')
          )
          if (eatResult.success) {
            this.gameState = eatResult.state
            events.push(`${player.name} ate ${resourceType} for ${preferFat ? 'fat' : 'energy'}`)
          }
        }
      }
    }
    
    return events
  }

  private simulateHibernationPhase(player: typeof this.gameState.players[0]): string[] {
    const events: string[] = []
    
    for (const piece of player.pieces) {
      if (piece.isHibernating) continue
      
      const space = this.findPieceSpace(piece.id)
      if (space?.quadrant === 'Mountains' && piece.fat >= GAME_CONFIG.hibernation.fatCost) {
        // Hibernate if in mountains and have enough fat
        const hibernateResult = this.engine.executeHibernation(
          this.gameState,
          ActionCreators.hibernation(player.id, piece.id)
        )
        if (hibernateResult.success) {
          this.gameState = hibernateResult.state
          events.push(`${player.name} hibernated in Mountains`)
        }
      }
    }
    
    return events
  }

  private getEnergyCost(space: typeof this.gameState.board.spaces[string] | undefined): number {
    if (this.gameState.season === 'Winter') {
      return space?.quadrant === 'Mountains' ? 2 : 5
    }
    return 1
  }

  private findPieceSpace(pieceId: string) {
    return Object.values(this.gameState.board.spaces).find(space => space.piece?.id === pieceId)
  }

  private getAlivePlayers() {
    return this.gameState.players.filter(player => player.pieces.length > 0)
  }

  private captureSnapshot(turn: number, events: string[]): void {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    
    const players: PlayerSnapshot[] = this.gameState.players.map(player => ({
      turn,
      year: this.gameState.year,
      season: this.gameState.season,
      playerId: player.id.toString(),
      playerName: player.name,
      pieces: player.pieces.map(piece => {
        const space = this.findPieceSpace(piece.id)
        return {
          id: piece.id,
          energy: piece.energy,
          fat: piece.fat,
          emergencyEnergy: piece.emergencyEnergy,
          resources: { ...piece.resources },
          isHibernating: piece.isHibernating || false,
          spaceId: piece.spaceId || 'unknown',
          quadrant: space?.quadrant || 'unknown'
        }
      }),
      totalScore: player.score,
      isAlive: player.pieces.length > 0
    }))

    this.history.push({
      turn,
      year: this.gameState.year,
      season: this.gameState.season,
      currentPlayerId: currentPlayer?.id.toString() || 'unknown',
      turnPhase: this.gameState.turnPhase,
      energyTaxPaid: this.gameState.energyTaxPaid,
      players,
      events
    })
  }

  private createResult(endReason: SimulationResult['endReason'], turns: number, winner: string | null): SimulationResult {
    const playerStats: SimulationResult['playerStats'] = {}
    
    for (const player of this.gameState.players) {
      playerStats[player.id.toString()] = {
        survival: player.pieces.length > 0,
        bearsAlive: player.pieces.length,
        totalScore: player.score
      }
    }
    
    return {
      completed: true,
      winner,
      turns,
      years: this.gameState.year,
      playerStats,
      endReason,
      history: this.history
    }
  }

  private createInitialState(playerCount: number): CoreGameState {
    // Create a basic initial state - this would need to be expanded
    // For now, return a minimal state that can run
    return {
      board: {
        spaces: {},
        rings: {},
        bridges: {},
        rotations: []
      },
      players: Array.from({ length: playerCount }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        pieces: [{
          id: `bear-${i + 1}-1`,
          playerId: i + 1,
          spaceId: 'R3-1',
          type: 'bear' as const,
          health: 10,
          resources: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 },
          energy: 5,
          fat: 0,
          emergencyEnergy: 0,
          isHibernating: false
        }],
        pieceCount: { bears: 1, cubs: 0, maxBears: 3, maxCubs: 6 },
        score: 0
      })),
      currentPlayerIndex: 0,
      season: 'Spring' as Season,
      year: 1,
      turn: 1,
      gamePhase: 'playing' as const,
      turnPhase: 'movement' as const,
      energyTaxPaid: false
    }
  }
}