/**
 * Simulation Runner using Real GameEngine
 * 
 * Runs multiple simulations to test game balance
 */

import { SimpleSimulation, SimulationResult } from './SimpleSimulation'

export interface BatchResults {
  totalGames: number
  completedGames: number
  averageGameLength: number
  averageYears: number
  strategyWinRates: { [strategy: string]: number }
  strategyBalance: number
  averageHibernationsPerGame: number
  averageDeathsPerGame: number
  resourceUtilizationRate: {
    grains: number
    berries: number
    salmon: number
  }
  games: Array<{
    result: SimulationResult
    history: SimulationResult['history']
  }>
}

export async function runQuickTest(): Promise<BatchResults> {
  console.log('🎮 Starting simulation with real GameEngine...')
  
  const gameCount = 10 // Small number for testing
  const results: SimulationResult[] = []
  
  for (let i = 0; i < gameCount; i++) {
    console.log(`Running game ${i + 1}/${gameCount}`)
    
    const simulation = new SimpleSimulation(4)
    const result = simulation.runSimulation()
    results.push(result)
  }
  
  // Analyze results
  const completedGames = results.filter(r => r.completed).length
  const averageGameLength = results.reduce((sum, r) => sum + r.turns, 0) / results.length
  const averageYears = results.reduce((sum, r) => sum + r.years, 0) / results.length
  
  // Calculate win rates by player position (since we don't have strategies yet)
  const winCounts: { [position: string]: number } = {}
  const totalGames = results.length
  
  for (const result of results) {
    if (result.winner) {
      const position = `Player ${result.winner}`
      winCounts[position] = (winCounts[position] || 0) + 1
    }
  }
  
  const strategyWinRates: { [strategy: string]: number } = {}
  for (let i = 1; i <= 4; i++) {
    const position = `Player ${i}`
    strategyWinRates[position] = (winCounts[position] || 0) / totalGames
  }
  
  // Calculate strategy balance (how even are the win rates)
  const winRates = Object.values(strategyWinRates)
  const maxWinRate = Math.max(...winRates)
  const minWinRate = Math.min(...winRates)
  const strategyBalance = 1 - (maxWinRate - minWinRate)
  
  // Collect individual game data
  const games = results.map(result => ({
    result,
    history: result.history
  }))
  
  return {
    totalGames,
    completedGames,
    averageGameLength,
    averageYears,
    strategyWinRates,
    strategyBalance,
    averageHibernationsPerGame: 0, // TODO: track hibernations
    averageDeathsPerGame: 0, // TODO: track deaths
    resourceUtilizationRate: {
      grains: 0.5, // TODO: track resource usage
      berries: 0.5,
      salmon: 0.3
    },
    games
  }
}