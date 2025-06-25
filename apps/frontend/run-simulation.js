/**
 * Simple Node.js runner for our game simulation
 * This bypasses TypeScript compilation for quick testing
 */

// Import our test runner
const { runQuickTest } = require('./src/simulation/test-runner')

async function main() {
  console.log('🎮 Bears Game Balance Simulation')
  console.log('================================\n')
  
  try {
    const results = await runQuickTest()
    
    console.log('\n🎯 SIMULATION COMPLETE!')
    console.log(`Ran ${results.completedGames} games successfully`)
    
    // Quick insights
    console.log('\n📊 QUICK INSIGHTS:')
    
    // Strategy performance
    const strategies = Object.entries(results.strategyWinRates)
    const bestStrategy = strategies.reduce((best, curr) => curr[1] > best[1] ? curr : best)
    const worstStrategy = strategies.reduce((worst, curr) => curr[1] < worst[1] ? curr : worst)
    
    console.log(`🏆 Best performing strategy: ${bestStrategy[0]} (${(bestStrategy[1] * 100).toFixed(1)}% win rate)`)
    console.log(`📉 Worst performing strategy: ${worstStrategy[0]} (${(worstStrategy[1] * 100).toFixed(1)}% win rate)`)
    
    // Balance assessment
    const winRateSpread = bestStrategy[1] - worstStrategy[1]
    if (winRateSpread < 0.15) {
      console.log('✅ Good strategy balance!')
    } else if (winRateSpread < 0.3) {
      console.log('⚠️  Minor strategy imbalance')
    } else {
      console.log('❌ Major strategy imbalance!')
    }
    
    // Resource insights
    console.log(`\n🍯 Resource Usage:`)
    console.log(`Grains: ${(results.resourceUtilizationRate.grains * 100).toFixed(1)}% utilization`)
    console.log(`Berries: ${(results.resourceUtilizationRate.berries * 100).toFixed(1)}% utilization`)
    console.log(`Salmon: ${(results.resourceUtilizationRate.salmon * 100).toFixed(1)}% utilization`)
    
    // Game flow
    console.log(`\n⏱️  Game Flow:`)
    console.log(`Average game length: ${results.averageGameLength.toFixed(1)} turns`)
    console.log(`Average hibernations: ${results.averageHibernationsPerGame.toFixed(1)} per game`)
    console.log(`Average deaths: ${results.averageDeathsPerGame.toFixed(1)} per game`)
    
  } catch (error) {
    console.error('❌ Simulation failed:', error.message)
    console.error('This might be due to TypeScript compilation. Let\'s fix this...')
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { main }