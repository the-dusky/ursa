/**
 * Game Simulation System for Balance Testing
 * 
 * This system runs automated games to test balance by:
 * 1. Creating AI players with different strategies
 * 2. Running complete games without UI
 * 3. Collecting statistics about outcomes
 * 4. Analyzing patterns to find optimal parameters
 */

import { GameSpace, GamePiece } from '@/store/gameStore'
import { SimulationGameState } from './GameStateFactory'
import { DEFAULT_CONFIG, FOOD_CONVERSION_RATES } from '../shared/gameRules'

// Strategy types for AI players - each plays differently
export type AIStrategy = 'aggressive' | 'conservative' | 'balanced' | 'hibernation-focused'

// Statistics we'll track for each game
export interface GameStatistics {
  gameId: string
  winner: string | null
  turns: number
  years: number
  playerEliminations: { playerId: string; turn: number; reason: string }[]
  hibernationCount: number
  resourcesCollected: { grains: number; berries: number; salmon: number }
  resourcesConsumed: { grains: number; berries: number; salmon: number }
  energySpentOnMovement: number
  deathsByStarvation: number
  finalScores: { [playerId: string]: number }
  strategyPerformance: { [strategy: string]: { wins: number; survivals: number } }
}

// AI Player that makes decisions based on strategy
export class AIPlayer {
  constructor(
    public id: string,
    public strategy: AIStrategy,
    public name: string
  ) {}

  /**
   * Main decision-making function - called each turn phase
   * This is where AI "thinks" about what to do
   */
  makeDecision(gameState: SimulationGameState, phase: SimulationGameState['turnPhase']): AIDecision {
    const debug = false // Set to true for debugging
    
    if (debug) {
      console.log(`${this.strategy} AI deciding for phase: ${phase}`)
    }
    
    switch (phase) {
      case 'movement':
        const moveDecision = this.decideMovement(gameState)
        if (debug && moveDecision.type === 'movement_phase') {
          console.log(`${this.strategy} wants to make ${moveDecision.actions.movements.length} moves`)
        }
        return moveDecision
      case 'harvest':
        // Harvest is automatic, no decision needed
        return { type: 'continue' }
      case 'eat':
        const eatDecision = this.decideEating(gameState)
        if (debug && eatDecision.type === 'eat') {
          console.log(`${this.strategy} wants to eat ${eatDecision.eatDecisions.length} items`)
        }
        return eatDecision
      case 'hibernation':
        const hibernateDecision = this.decideHibernation(gameState)
        if (debug && hibernateDecision.type === 'hibernate') {
          console.log(`${this.strategy} wants to hibernate ${hibernateDecision.pieceIds.length} bears`)
        }
        return hibernateDecision
      default:
        return { type: 'continue' }
    }
  }

  /**
   * Movement phase decision - fat burning, energy loss, and movement
   * AI decides optimal order of actions for each piece
   */
  private decideMovement(gameState: SimulationGameState): AIDecision {
    const myPieces = this.getMyPieces(gameState)
    const fatBurning: FatBurnDecision[] = []
    const energyLoss: EnergyLossDecision[] = []
    const movements: MoveDecision[] = []

    for (const piece of myPieces) {
      if (piece.isHibernating) continue

      // Find current space
      const currentSpace = this.findPieceSpace(gameState, piece.id)
      if (!currentSpace) continue

      // Decide if we should burn fat (if we have no energy and have fat)
      if (piece.energy === 0 && piece.fat > 0) {
        fatBurning.push({ pieceId: piece.id })
      }

      // Always need to take daily energy loss (unless hibernating)
      energyLoss.push({ pieceId: piece.id })

      // Get valid moves and decide on movement
      const validMoves = this.getValidMoves(gameState, currentSpace)
      const targetSpace = this.chooseMoveTarget(gameState, piece, currentSpace, validMoves)
      
      if (targetSpace && targetSpace.id !== currentSpace.id) {
        movements.push({
          pieceId: piece.id,
          targetSpaceId: targetSpace.id
        })
      }
    }

    return { 
      type: 'movement_phase', 
      actions: { fatBurning, energyLoss, movements }
    }
  }

  /**
   * Choose where to move based on strategy
   * This is where different AI personalities shine
   */
  private chooseMoveTarget(
    gameState: SimulationGameState,
    piece: GamePiece,
    currentSpace: GameSpace,
    validMoves: GameSpace[]
  ): GameSpace | null {
    if (validMoves.length === 0) return null

    switch (this.strategy) {
      case 'aggressive':
        // Aggressive: Move toward resources and other players
        return this.findBestResourceSpace(gameState, validMoves)
      
      case 'conservative':
        // Conservative: Stay in safe areas with steady resources
        return this.findSafestSpace(gameState, validMoves)
      
      case 'hibernation-focused':
        // Hibernation-focused: Move toward mountains in autumn
        if (gameState.season === 'Autumn') {
          return this.findMountainPath(validMoves)
        }
        return this.findBestResourceSpace(gameState, validMoves)
      
      case 'balanced':
      default:
        // Balanced: Mix of resource gathering and safety
        return this.balancedMoveChoice(gameState, piece, validMoves)
    }
  }

  /**
   * Eating decisions - convert to energy or fat?
   * This is a key strategic choice
   */
  private decideEating(gameState: SimulationGameState): AIDecision {
    const myPieces = this.getMyPieces(gameState)
    const eatDecisions: EatDecision[] = []

    for (const piece of myPieces) {
      if (piece.isHibernating) continue

      // Decide what to eat based on strategy and game state
      const decisions = this.planEating(gameState, piece)
      eatDecisions.push(...decisions)
    }

    return { type: 'eat', eatDecisions }
  }

  /**
   * Plan what to eat and how to convert it
   * Key considerations: current energy, fat goals, season
   */
  private planEating(gameState: SimulationGameState, piece: GamePiece): EatDecision[] {
    const decisions: EatDecision[] = []
    
    // Basic rule: maintain minimum energy for survival
    const minEnergy = 5 // Enough to move a few spaces
    const targetFat = DEFAULT_CONFIG.hibernationFatCost // For hibernation
    
    switch (this.strategy) {
      case 'aggressive':
        // Prioritize energy for movement
        if (piece.energy < minEnergy + 3) {
          decisions.push(...this.eatForEnergy(piece, minEnergy + 3))
        }
        break
        
      case 'hibernation-focused':
        // Build fat in summer/autumn
        if (gameState.season === 'Summer' || gameState.season === 'Autumn') {
          decisions.push(...this.eatForFat(piece, targetFat))
        } else if (piece.energy < minEnergy) {
          decisions.push(...this.eatForEnergy(piece, minEnergy))
        }
        break
        
      case 'conservative':
        // Maintain balance of both
        if (piece.energy < minEnergy) {
          decisions.push(...this.eatForEnergy(piece, minEnergy))
        } else if (piece.fat < 10) {
          decisions.push(...this.eatForFat(piece, 10))
        }
        break
        
      case 'balanced':
      default:
        // Smart eating based on season
        if (gameState.season === 'Winter' || piece.energy < minEnergy) {
          decisions.push(...this.eatForEnergy(piece, minEnergy))
        } else if (gameState.season === 'Autumn' && piece.fat < targetFat) {
          decisions.push(...this.eatForFat(piece, targetFat))
        }
    }
    
    return decisions
  }

  // Helper methods for finding spaces, making decisions, etc.
  private getMyPieces(gameState: SimulationGameState): GamePiece[] {
    const player = gameState.players.find(p => p.id === this.id)
    return player?.pieces || []
  }

  private findPieceSpace(gameState: SimulationGameState, pieceId: string): GameSpace | null {
    return Object.values(gameState.board.spaces).find(s => s.piece?.id === pieceId) || null
  }

  private getValidMoves(gameState: SimulationGameState, currentSpace: GameSpace): GameSpace[] {
    // Get adjacent spaces the piece can move to
    return currentSpace.adjacentSpaces
      .map(id => gameState.board.spaces[id])
      .filter(space => space && !space.piece) // Empty spaces only
  }

  private findBestResourceSpace(gameState: SimulationGameState, spaces: GameSpace[]): GameSpace {
    // Score spaces by expected resource production
    const scores = spaces.map(space => ({
      space,
      score: this.scoreSpaceResources(gameState, space)
    }))
    
    scores.sort((a, b) => b.score - a.score)
    return scores[0].space
  }

  private scoreSpaceResources(gameState: SimulationGameState, space: GameSpace): number {
    // Calculate expected resources based on biome and season
    // This is simplified - real implementation would use SEASONAL_PRODUCTION
    let score = 0
    
    switch (space.quadrant) {
      case 'Pastures':
        score += 3 // Good for grains
        break
      case 'Forests':
        score += 2 // Good for berries
        break
      case 'Riverlands':
        score += gameState.season === 'Autumn' ? 4 : 1 // Salmon in autumn
        break
      case 'Mountains':
        score += 1 // Less resources but hibernation option
        break
    }
    
    return score
  }

  private findSafestSpace(gameState: SimulationGameState, spaces: GameSpace[]): GameSpace {
    // Prefer spaces away from other players
    const scores = spaces.map(space => ({
      space,
      score: this.scoreSafety(gameState, space)
    }))
    
    scores.sort((a, b) => b.score - a.score)
    return scores[0].space
  }

  private scoreSafety(gameState: SimulationGameState, space: GameSpace): number {
    // Count nearby enemy pieces (lower is safer)
    let threatScore = 0
    
    for (const adjId of space.adjacentSpaces) {
      const adjSpace = gameState.board.spaces[adjId]
      if (adjSpace?.piece && adjSpace.piece.playerId !== this.id) {
        threatScore += 1
      }
    }
    
    return 10 - threatScore // Invert so higher is safer
  }

  private findMountainPath(spaces: GameSpace[]): GameSpace {
    // Prefer mountain spaces or spaces leading to mountains
    const mountainSpaces = spaces.filter(s => s.quadrant === 'Mountains')
    if (mountainSpaces.length > 0) {
      return mountainSpaces[0]
    }
    
    // Otherwise, pick any space (simplified pathfinding)
    return spaces[0]
  }

  private balancedMoveChoice(gameState: SimulationGameState, piece: GamePiece, spaces: GameSpace[]): GameSpace {
    // Combine resource and safety scores
    const scores = spaces.map(space => ({
      space,
      score: this.scoreSpaceResources(gameState, space) * 0.7 + 
             this.scoreSafety(gameState, space) * 0.3
    }))
    
    scores.sort((a, b) => b.score - a.score)
    return scores[0].space
  }

  private eatForEnergy(piece: GamePiece, targetEnergy: number): EatDecision[] {
    const decisions: EatDecision[] = []
    let currentEnergy = piece.energy
    
    // Honey gives best energy - use shared conversion rates
    while (currentEnergy < targetEnergy && piece.resources.honey > 0) {
      decisions.push({
        pieceId: piece.id,
        resource: 'honey',
        amount: 1,
        convertTo: 'energy'
      })
      currentEnergy += FOOD_CONVERSION_RATES.energy.honey
      piece.resources.honey -= 1
    }
    
    // Grains - use shared conversion rates
    while (currentEnergy < targetEnergy && piece.resources.grains > 0) {
      decisions.push({
        pieceId: piece.id,
        resource: 'grains',
        amount: 1,
        convertTo: 'energy'
      })
      currentEnergy += FOOD_CONVERSION_RATES.energy.grains
      piece.resources.grains -= 1
    }
    
    // Berries - use shared conversion rates
    while (currentEnergy < targetEnergy && piece.resources.berries > 0) {
      decisions.push({
        pieceId: piece.id,
        resource: 'berries',
        amount: 1,
        convertTo: 'energy'
      })
      currentEnergy += FOOD_CONVERSION_RATES.energy.berries
      piece.resources.berries -= 1
    }
    
    // Bear meat - use shared conversion rates
    while (currentEnergy < targetEnergy && piece.resources.bearMeat > 0) {
      decisions.push({
        pieceId: piece.id,
        resource: 'bearMeat',
        amount: 1,
        convertTo: 'energy'
      })
      currentEnergy += FOOD_CONVERSION_RATES.energy.bearMeat
      piece.resources.bearMeat -= 1
    }
    
    return decisions
  }

  private eatForFat(piece: GamePiece, targetFat: number): EatDecision[] {
    const decisions: EatDecision[] = []
    let currentFat = piece.fat
    
    // Bear meat - use shared conversion rates
    while (currentFat < targetFat && piece.resources.bearMeat > 0) {
      decisions.push({
        pieceId: piece.id,
        resource: 'bearMeat',
        amount: 1,
        convertTo: 'fat'
      })
      currentFat += FOOD_CONVERSION_RATES.fat.bearMeat
      piece.resources.bearMeat -= 1
    }
    
    // Salmon - use shared conversion rates
    while (currentFat < targetFat && piece.resources.salmon > 0) {
      decisions.push({
        pieceId: piece.id,
        resource: 'salmon',
        amount: 1,
        convertTo: 'fat'
      })
      currentFat += FOOD_CONVERSION_RATES.fat.salmon
      piece.resources.salmon -= 1
    }
    
    // Honey - use shared conversion rates
    while (currentFat < targetFat && piece.resources.honey > 0) {
      decisions.push({
        pieceId: piece.id,
        resource: 'honey',
        amount: 1,
        convertTo: 'fat'
      })
      currentFat += FOOD_CONVERSION_RATES.fat.honey
      piece.resources.honey -= 1
    }
    
    // Berries - use shared conversion rates
    while (currentFat < targetFat && piece.resources.berries > 0) {
      decisions.push({
        pieceId: piece.id,
        resource: 'berries',
        amount: 1,
        convertTo: 'fat'
      })
      currentFat += FOOD_CONVERSION_RATES.fat.berries
      piece.resources.berries -= 1
    }
    
    return decisions
  }

  private decideHibernation(gameState: SimulationGameState): AIDecision {
    // Only relevant in winter for bears in mountains
    if (gameState.season !== 'Winter') {
      return { type: 'continue' }
    }
    
    const hibernationDecisions: string[] = [] // piece IDs to hibernate
    
    for (const piece of this.getMyPieces(gameState)) {
      if (piece.isHibernating) continue
      
      const space = this.findPieceSpace(gameState, piece.id)
      if (space?.quadrant === 'Mountains' && piece.fat >= DEFAULT_CONFIG.hibernationFatCost) {
        // Decide based on strategy
        const shouldHibernate = this.shouldHibernate(gameState, piece)
        if (shouldHibernate) {
          hibernationDecisions.push(piece.id)
        }
      }
    }
    
    return { type: 'hibernate', pieceIds: hibernationDecisions }
  }

  private shouldHibernate(gameState: SimulationGameState, piece: GamePiece): boolean {
    switch (this.strategy) {
      case 'hibernation-focused':
        return true // Always hibernate when possible
        
      case 'aggressive':
        return false // Never hibernate, stay active
        
      case 'conservative':
        // Hibernate if it's late winter
        return gameState.turn > 2
        
      case 'balanced':
      default:
        // Hibernate if energy is low or it's first day (for cubs)
        return piece.energy < 5 || gameState.turn === 1
    }
  }
}

// Types for AI decisions
interface MoveDecision {
  pieceId: string
  targetSpaceId: string
}

interface EatDecision {
  pieceId: string
  resource: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat'
  amount: number
  convertTo: 'energy' | 'fat'
}

interface FatBurnDecision {
  pieceId: string
  fatAmount?: number
}

interface EnergyLossDecision {
  pieceId: string
}

interface MovementPhaseDecision {
  fatBurning: FatBurnDecision[]
  energyLoss: EnergyLossDecision[]
  movements: MoveDecision[]
}

export type AIDecision = 
  | { type: 'continue' }
  | { type: 'movement_phase'; actions: MovementPhaseDecision }
  | { type: 'eat'; eatDecisions: EatDecision[] }
  | { type: 'hibernate'; pieceIds: string[] }