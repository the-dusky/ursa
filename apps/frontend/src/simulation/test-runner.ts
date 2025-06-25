/**
 * Test Runner - Quick way to test our simulation system
 * 
 * Run this to see if our simulation works and get initial balance insights
 */

import { BatchRunner, BatchConfig } from './BatchRunner'
import { SimulationProgress } from './SimulationVisualizer'

/**
 * Run a quick balance test
 */
async function runQuickTest() {
  console.log('🎮 Starting quick balance test...')
  
  const config: BatchConfig = {
    gameCount: 50, // Small sample for quick testing
    playerCount: 4,
    strategies: ['aggressive', 'conservative', 'balanced', 'hibernation-focused'],
    maxTurnsPerGame: 200,
    maxYearsPerGame: 10,
    logLevel: 'none' // Quiet for batch testing
  }
  
  // Add progress callback for console visualization
  const progressCallback = (progress: SimulationProgress) => {
    if (progress.completedGames % 10 === 0) {
      console.log(`\r⏳ Progress: ${progress.completedGames}/${progress.totalGames} games completed`)
    }
  }
  
  const runner = new BatchRunner(config, progressCallback)
  const results = await runner.runBatch()
  
  // Print analysis
  console.log('\n' + runner.generateReport(results))
  
  // Detailed strategy breakdown
  console.log('\n🔍 DETAILED STRATEGY ANALYSIS:')
  console.log('Win Rate Details:')
  Object.entries(results.strategyWinRates).forEach(([strategy, rate]) => {
    console.log(`  ${strategy}: ${(rate * 100).toFixed(1)}% wins, ${(results.strategySurvivalRates[strategy] * 100).toFixed(1)}% survival`)
  })
  
  return results
}

/**
 * Test different parameter sets
 */
async function runParameterComparison() {
  console.log('🔬 Testing different parameter sets...')
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _testConfigs = [
    {
      name: 'Current Settings',
      // This would use current game parameters
    },
    {
      name: 'More Salmon',
      // This would test increased salmon production
    },
    {
      name: 'Cheaper Hibernation',
      // This would test 15 fat instead of 20
    }
  ]
  
  // For now, just run current settings
  // Later we'd modify the game factory to test different parameters
  
  const results = await runQuickTest()
  
  console.log('\n💡 KEY INSIGHTS:')
  
  // Check strategy balance
  const winRates = Object.values(results.strategyWinRates)
  const maxWinRate = Math.max(...winRates)
  const minWinRate = Math.min(...winRates)
  
  if (maxWinRate - minWinRate > 0.3) {
    console.log('⚠️  Major strategy imbalance detected!')
  } else if (maxWinRate - minWinRate > 0.15) {
    console.log('⚠️  Minor strategy imbalance detected')
  } else {
    console.log('✅ Strategies appear well balanced')
  }
  
  // Check hibernation usage
  if (results.averageHibernationsPerGame < 0.5) {
    console.log('⚠️  Hibernation rarely used - may need to be more accessible')
  } else if (results.averageHibernationsPerGame > 2.5) {
    console.log('⚠️  Hibernation very common - may be too easy')
  } else {
    console.log('✅ Hibernation usage seems reasonable')
  }
  
  // Check resource usage
  const salmonUsage = results.resourceUtilizationRate.salmon
  if (salmonUsage < 0.3) {
    console.log('⚠️  Salmon underutilized - consider making more available or valuable')
  } else {
    console.log('✅ Salmon usage seems good')
  }
  
  return results
}

/**
 * Main test function
 */
async function main() {
  try {
    console.log('🚀 Bears Game Balance Tester')
    console.log('============================\n')
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _results = await runParameterComparison()
    
    console.log('\n🎯 NEXT STEPS:')
    console.log('1. Review the recommendations above')
    console.log('2. Adjust game parameters based on insights')
    console.log('3. Run larger batches (500+ games) for more reliable data')
    console.log('4. Test parameter variations to find optimal balance')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Uncomment to run the test
// main()

export { runQuickTest, runParameterComparison, main }