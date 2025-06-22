/**
 * Batch Runner - Executes many simulations for statistical analysis
 * 
 * This runs hundreds/thousands of games and aggregates results
 * to find patterns and optimal balance parameters
 */

import { SimulationEngine, SimulationConfig } from './SimulationEngine'
import { AIStrategy, GameStatistics } from './GameSimulator'
import { SimulationProgress } from './SimulationVisualizer'

export interface BatchConfig {
  gameCount: number
  playerCount: number
  strategies: AIStrategy[]
  maxTurnsPerGame: number
  maxYearsPerGame: number
  logLevel: 'none' | 'summary' | 'detailed'
}

export interface BatchResults {
  totalGames: number
  completedGames: number
  averageGameLength: number
  averageYears: number
  
  // Strategy analysis
  strategyWinRates: { [strategy: string]: number }
  strategySurvivalRates: { [strategy: string]: number }
  
  // Resource analysis
  averageResourcesCollected: { grains: number; berries: number; salmon: number }
  averageResourcesConsumed: { grains: number; berries: number; salmon: number }
  resourceUtilizationRate: { grains: number; berries: number; salmon: number }
  
  // Game flow analysis
  averageDeathsPerGame: number
  averageHibernationsPerGame: number
  averageEnergySpentOnMovement: number
  eliminationTiming: number[] // Turn when players were eliminated
  
  // Balance indicators
  gameVariance: number // How much game lengths vary
  strategyBalance: number // How balanced are the strategies
  resourceScarcity: { grains: number; berries: number; salmon: number }
  
  // Individual game results
  gameResults: GameStatistics[]
}

export class BatchRunner {
  private progressCallback?: (progress: SimulationProgress) => void
  
  constructor(private config: BatchConfig, progressCallback?: (progress: SimulationProgress) => void) {
    this.progressCallback = progressCallback
  }
  
  /**
   * Run a batch of games and analyze results
   */
  async runBatch(): Promise<BatchResults> {
    console.log(`Starting batch of ${this.config.gameCount} games...`)
    const startTime = Date.now()
    
    const gameResults: GameStatistics[] = []
    
    // Run games
    for (let i = 0; i < this.config.gameCount; i++) {
      if (i % 10 === 0) {
        console.log(`Progress: ${i}/${this.config.gameCount} games completed`)
      }
      
      try {
        const result = await this.runSingleGame()
        gameResults.push(result)
        
        // Emit progress update after each game
        if (this.progressCallback && gameResults.length > 0) {
          const currentProgress = this.calculateCurrentProgress(i + 1, gameResults)
          this.progressCallback(currentProgress)
        }
      } catch (error) {
        console.error(`Game ${i} failed:`, error)
      }
    }
    
    const endTime = Date.now()
    console.log(`Batch completed in ${(endTime - startTime) / 1000}s`)
    
    // Analyze results
    const analysis = this.analyzeResults(gameResults)
    
    return analysis
  }
  
  /**
   * Run a single game simulation
   */
  private async runSingleGame(): Promise<GameStatistics> {
    const simConfig: SimulationConfig = {
      playerCount: this.config.playerCount,
      strategies: this.config.strategies,
      maxTurns: this.config.maxTurnsPerGame,
      maxYears: this.config.maxYearsPerGame,
      logLevel: this.config.logLevel
    }
    
    const engine = new SimulationEngine(simConfig)
    return await engine.runGame()
  }
  
  /**
   * Analyze batch results for balance insights
   */
  private analyzeResults(gameResults: GameStatistics[]): BatchResults {
    const results: BatchResults = {
      totalGames: this.config.gameCount,
      completedGames: gameResults.length,
      averageGameLength: 0,
      averageYears: 0,
      strategyWinRates: {},
      strategySurvivalRates: {},
      averageResourcesCollected: { grains: 0, berries: 0, salmon: 0 },
      averageResourcesConsumed: { grains: 0, berries: 0, salmon: 0 },
      resourceUtilizationRate: { grains: 0, berries: 0, salmon: 0 },
      averageDeathsPerGame: 0,
      averageHibernationsPerGame: 0,
      averageEnergySpentOnMovement: 0,
      eliminationTiming: [],
      gameVariance: 0,
      strategyBalance: 0,
      resourceScarcity: { grains: 0, berries: 0, salmon: 0 },
      gameResults
    }
    
    if (gameResults.length === 0) return results
    
    // Basic averages
    results.averageGameLength = this.average(gameResults.map(g => g.turns))
    results.averageYears = this.average(gameResults.map(g => g.years))
    results.averageDeathsPerGame = this.average(gameResults.map(g => g.deathsByStarvation))
    results.averageHibernationsPerGame = this.average(gameResults.map(g => g.hibernationCount))
    results.averageEnergySpentOnMovement = this.average(gameResults.map(g => g.energySpentOnMovement))
    
    // Resource analysis
    results.averageResourcesCollected = {
      grains: this.average(gameResults.map(g => g.resourcesCollected.grains)),
      berries: this.average(gameResults.map(g => g.resourcesCollected.berries)),
      salmon: this.average(gameResults.map(g => g.resourcesCollected.salmon))
    }
    
    results.averageResourcesConsumed = {
      grains: this.average(gameResults.map(g => g.resourcesConsumed.grains)),
      berries: this.average(gameResults.map(g => g.resourcesConsumed.berries)),
      salmon: this.average(gameResults.map(g => g.resourcesConsumed.salmon))
    }
    
    // Resource utilization rate (consumed / collected)
    results.resourceUtilizationRate = {
      grains: results.averageResourcesConsumed.grains / Math.max(1, results.averageResourcesCollected.grains),
      berries: results.averageResourcesConsumed.berries / Math.max(1, results.averageResourcesCollected.berries),
      salmon: results.averageResourcesConsumed.salmon / Math.max(1, results.averageResourcesCollected.salmon)
    }
    
    // Strategy performance
    results.strategyWinRates = this.calculateStrategyWinRates(gameResults)
    results.strategySurvivalRates = this.calculateStrategySurvivalRates(gameResults)
    
    // Elimination timing
    results.eliminationTiming = gameResults.flatMap(g => 
      g.playerEliminations.map(e => e.turn)
    )
    
    // Balance metrics
    results.gameVariance = this.calculateVariance(gameResults.map(g => g.turns))
    results.strategyBalance = this.calculateStrategyBalance(results.strategyWinRates)
    results.resourceScarcity = this.calculateResourceScarcity(results.resourceUtilizationRate)
    
    return results
  }
  
  /**
   * Calculate win rates by strategy
   */
  private calculateStrategyWinRates(gameResults: GameStatistics[]): { [strategy: string]: number } {
    const wins: { [strategy: string]: number } = {}
    const totals: { [strategy: string]: number } = {}
    
    // Initialize counts
    for (const strategy of this.config.strategies) {
      wins[strategy] = 0
      totals[strategy] = 0
    }
    
    // Count wins and totals
    for (const game of gameResults) {
      for (const [strategy, perf] of Object.entries(game.strategyPerformance)) {
        wins[strategy] = (wins[strategy] || 0) + perf.wins
        totals[strategy] = (totals[strategy] || 0) + 1
      }
    }
    
    // Calculate rates
    const rates: { [strategy: string]: number } = {}
    for (const strategy of Object.keys(wins)) {
      rates[strategy] = totals[strategy] > 0 ? wins[strategy] / totals[strategy] : 0
    }
    
    return rates
  }
  
  /**
   * Calculate survival rates by strategy
   */
  private calculateStrategySurvivalRates(gameResults: GameStatistics[]): { [strategy: string]: number } {
    const survivals: { [strategy: string]: number } = {}
    const totals: { [strategy: string]: number } = {}
    
    // Initialize counts
    for (const strategy of this.config.strategies) {
      survivals[strategy] = 0
      totals[strategy] = 0
    }
    
    // Count survivals
    for (const game of gameResults) {
      for (const [strategy, perf] of Object.entries(game.strategyPerformance)) {
        survivals[strategy] = (survivals[strategy] || 0) + perf.survivals
        totals[strategy] = (totals[strategy] || 0) + 1
      }
    }
    
    // Calculate rates
    const rates: { [strategy: string]: number } = {}
    for (const strategy of Object.keys(survivals)) {
      rates[strategy] = totals[strategy] > 0 ? survivals[strategy] / totals[strategy] : 0
    }
    
    return rates
  }
  
  /**
   * Calculate game variance (how consistent are game lengths?)
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    
    const mean = this.average(values)
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return this.average(squaredDiffs)
  }
  
  /**
   * Calculate strategy balance (how equal are win rates?)
   * Lower values = more balanced
   */
  private calculateStrategyBalance(winRates: { [strategy: string]: number }): number {
    const rates = Object.values(winRates)
    if (rates.length === 0) return 0
    
    const variance = this.calculateVariance(rates)
    
    // Normalize by expected equal distribution
    const expectedRate = 1 / rates.length
    return variance / (expectedRate * expectedRate)
  }
  
  /**
   * Calculate resource scarcity metrics
   * Higher values = more scarce (low utilization suggests abundance)
   */
  private calculateResourceScarcity(utilization: { grains: number; berries: number; salmon: number }) {
    return {
      grains: Math.max(0, 1 - utilization.grains), // Lower utilization = higher scarcity score
      berries: Math.max(0, 1 - utilization.berries),
      salmon: Math.max(0, 1 - utilization.salmon)
    }
  }
  
  /**
   * Helper: calculate average of array
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
  
  /**
   * Generate a detailed report
   */
  generateReport(results: BatchResults): string {
    return `
GAME BALANCE ANALYSIS REPORT
============================

BASIC STATISTICS
- Total Games: ${results.totalGames}
- Completed Games: ${results.completedGames}
- Success Rate: ${(results.completedGames / results.totalGames * 100).toFixed(1)}%

GAME FLOW
- Average Game Length: ${results.averageGameLength.toFixed(1)} turns
- Average Game Duration: ${results.averageYears.toFixed(1)} years
- Game Length Variance: ${results.gameVariance.toFixed(1)} (${results.gameVariance < 100 ? 'consistent' : 'highly variable'})

STRATEGY BALANCE
- Strategy Balance Score: ${results.strategyBalance.toFixed(3)} (${results.strategyBalance < 0.1 ? 'well balanced' : 'imbalanced'})

Win Rates by Strategy:
${Object.entries(results.strategyWinRates)
  .map(([strategy, rate]) => `  ${strategy}: ${(rate * 100).toFixed(1)}%`)
  .join('\\n')}

Survival Rates by Strategy:
${Object.entries(results.strategySurvivalRates)
  .map(([strategy, rate]) => `  ${strategy}: ${(rate * 100).toFixed(1)}%`)
  .join('\\n')}

RESOURCE ECONOMY
Resources Collected (avg per game):
  Grains: ${results.averageResourcesCollected.grains.toFixed(1)}
  Berries: ${results.averageResourcesCollected.berries.toFixed(1)}
  Salmon: ${results.averageResourcesCollected.salmon.toFixed(1)}

Resource Utilization Rates:
  Grains: ${(results.resourceUtilizationRate.grains * 100).toFixed(1)}%
  Berries: ${(results.resourceUtilizationRate.berries * 100).toFixed(1)}%
  Salmon: ${(results.resourceUtilizationRate.salmon * 100).toFixed(1)}%

Resource Scarcity Indicators:
  Grains: ${(results.resourceScarcity.grains * 100).toFixed(1)}% (${results.resourceScarcity.grains > 0.5 ? 'scarce' : 'abundant'})
  Berries: ${(results.resourceScarcity.berries * 100).toFixed(1)}% (${results.resourceScarcity.berries > 0.5 ? 'scarce' : 'abundant'})
  Salmon: ${(results.resourceScarcity.salmon * 100).toFixed(1)}% (${results.resourceScarcity.salmon > 0.5 ? 'scarce' : 'abundant'})

SURVIVAL ANALYSIS
- Average Deaths per Game: ${results.averageDeathsPerGame.toFixed(1)}
- Average Hibernations per Game: ${results.averageHibernationsPerGame.toFixed(1)}
- Average Energy Spent on Movement: ${results.averageEnergySpentOnMovement.toFixed(1)}

BALANCE RECOMMENDATIONS
${this.generateRecommendations(results)}
    `.trim()
  }
  
  /**
   * Calculate current progress for live updates
   */
  private calculateCurrentProgress(currentGame: number, gameResults: GameStatistics[]): SimulationProgress {
    const completedGames = gameResults.length
    
    if (completedGames === 0) {
      return {
        currentGame,
        totalGames: this.config.gameCount,
        completedGames: 0,
        currentWinRates: {},
        currentSurvivalRates: {},
        averageGameLength: 0,
        averageDeathsPerGame: 0,
        averageHibernationsPerGame: 0,
        resourceUtilization: { grains: 0, berries: 0, salmon: 0 }
      }
    }
    
    // Calculate running averages
    const averageGameLength = this.average(gameResults.map(g => g.turns))
    const averageDeathsPerGame = this.average(gameResults.map(g => g.deathsByStarvation))
    const averageHibernationsPerGame = this.average(gameResults.map(g => g.hibernationCount))
    
    // Calculate current strategy performance
    const currentWinRates = this.calculateStrategyWinRates(gameResults)
    const currentSurvivalRates = this.calculateStrategySurvivalRates(gameResults)
    
    // Calculate resource utilization
    const collected = {
      grains: this.average(gameResults.map(g => g.resourcesCollected.grains)),
      berries: this.average(gameResults.map(g => g.resourcesCollected.berries)),
      salmon: this.average(gameResults.map(g => g.resourcesCollected.salmon))
    }
    
    const consumed = {
      grains: this.average(gameResults.map(g => g.resourcesConsumed.grains)),
      berries: this.average(gameResults.map(g => g.resourcesConsumed.berries)),
      salmon: this.average(gameResults.map(g => g.resourcesConsumed.salmon))
    }
    
    const resourceUtilization = {
      grains: consumed.grains / Math.max(1, collected.grains),
      berries: consumed.berries / Math.max(1, collected.berries),
      salmon: consumed.salmon / Math.max(1, collected.salmon)
    }
    
    // Get last game summary
    const lastGame = gameResults[gameResults.length - 1]
    const lastGameSummary = lastGame ? {
      turns: lastGame.turns,
      winner: lastGame.winner || undefined,
      deaths: lastGame.deathsByStarvation,
      hibernations: lastGame.hibernationCount
    } : undefined
    
    return {
      currentGame,
      totalGames: this.config.gameCount,
      completedGames,
      currentWinRates,
      currentSurvivalRates,
      averageGameLength,
      averageDeathsPerGame,
      averageHibernationsPerGame,
      resourceUtilization,
      lastGameSummary
    }
  }

  /**
   * Generate balance recommendations based on analysis
   */
  private generateRecommendations(results: BatchResults): string {
    const recommendations: string[] = []
    
    // Strategy balance check
    if (results.strategyBalance > 0.1) {
      const winRates = Object.entries(results.strategyWinRates)
      const sorted = winRates.sort((a, b) => b[1] - a[1])
      recommendations.push(`⚠️  Strategy imbalance detected: ${sorted[0][0]} wins ${(sorted[0][1] * 100).toFixed(1)}% vs ${sorted[sorted.length-1][0]} at ${(sorted[sorted.length-1][1] * 100).toFixed(1)}%`)
    }
    
    // Resource scarcity checks
    if (results.resourceScarcity.salmon > 0.8) {
      recommendations.push(`🐟 Salmon too scarce - consider increasing autumn production`)
    }
    if (results.resourceScarcity.grains > 0.7) {
      recommendations.push(`🌾 Grains too scarce - consider increasing spring production`)
    }
    if (results.resourceScarcity.berries > 0.7) {
      recommendations.push(`🫐 Berries too scarce - consider increasing summer production`)
    }
    
    // Hibernation frequency
    if (results.averageHibernationsPerGame < 0.5) {
      recommendations.push(`💤 Hibernation rarely used - consider reducing fat requirement or increasing benefits`)
    }
    if (results.averageHibernationsPerGame > 3) {
      recommendations.push(`💤 Hibernation too common - consider increasing fat requirement`)
    }
    
    // Death rate
    if (results.averageDeathsPerGame > 2) {
      recommendations.push(`💀 High death rate - game may be too harsh`)
    }
    if (results.averageDeathsPerGame < 0.5) {
      recommendations.push(`💀 Low death rate - game may be too easy`)
    }
    
    // Game length
    if (results.averageGameLength > 100) {
      recommendations.push(`⏱️  Games too long - consider increasing elimination pressure`)
    }
    if (results.averageGameLength < 20) {
      recommendations.push(`⏱️  Games too short - consider reducing elimination pressure`)
    }
    
    if (recommendations.length === 0) {
      recommendations.push(`✅ Balance looks good! No major issues detected.`)
    }
    
    return recommendations.join('\\n')
  }
}