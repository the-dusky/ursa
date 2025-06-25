/**
 * Simple test script to demonstrate the simulation visualization
 */

// Mock the SimulationProgress interface for testing
const createMockProgress = (gameNumber, totalGames) => {
  const progress = gameNumber / totalGames
  const completedGames = gameNumber
  
  return {
    currentGame: gameNumber,
    totalGames,
    completedGames,
    currentWinRates: {
      aggressive: 0.3 + Math.random() * 0.2,
      defensive: 0.25 + Math.random() * 0.2,
      balanced: 0.22 + Math.random() * 0.2,
      opportunistic: 0.23 + Math.random() * 0.2
    },
    currentSurvivalRates: {
      aggressive: 0.6 + Math.random() * 0.3,
      defensive: 0.7 + Math.random() * 0.2,
      balanced: 0.65 + Math.random() * 0.25,
      opportunistic: 0.6 + Math.random() * 0.3
    },
    averageGameLength: 45 + Math.random() * 20,
    averageDeathsPerGame: 1.2 + Math.random() * 0.8,
    averageHibernationsPerGame: 0.8 + Math.random() * 1.2,
    resourceUtilization: {
      grains: 0.6 + Math.random() * 0.3,
      berries: 0.7 + Math.random() * 0.2,
      salmon: 0.5 + Math.random() * 0.4
    },
    lastGameSummary: {
      turns: Math.floor(30 + Math.random() * 40),
      winner: ['aggressive', 'defensive', 'balanced', 'opportunistic'][Math.floor(Math.random() * 4)],
      deaths: Math.floor(Math.random() * 3),
      hibernations: Math.floor(Math.random() * 3)
    }
  }
}

// Simple console visualization demo
async function runDemo() {
  const totalGames = 50
  console.log('🎮 Bears Game Simulation Demo')
  console.log('=============================\n')
  
  console.log('Starting simulation with real-time progress updates...\n')
  
  for (let i = 1; i <= totalGames; i++) {
    // Simulate game processing time
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const progress = createMockProgress(i, totalGames)
    
    // Clear previous line and show progress
    process.stdout.write('\r\x1b[K')
    
    const percentage = ((i / totalGames) * 100).toFixed(1)
    const progressBar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2))
    
    process.stdout.write(`⏳ Progress: [${progressBar}] ${percentage}% (${i}/${totalGames} games)`)
    
    // Show detailed update every 10 games
    if (i % 10 === 0 || i === totalGames) {
      console.log('\n')
      console.log(`📊 Update after ${i} games:`)
      console.log(`   Win Rates: Aggressive ${(progress.currentWinRates.aggressive * 100).toFixed(1)}%, Defensive ${(progress.currentWinRates.defensive * 100).toFixed(1)}%, Balanced ${(progress.currentWinRates.balanced * 100).toFixed(1)}%, Opportunistic ${(progress.currentWinRates.opportunistic * 100).toFixed(1)}%`)
      console.log(`   Avg Game Length: ${progress.averageGameLength.toFixed(1)} turns`)
      console.log(`   Resource Usage: Grains ${(progress.resourceUtilization.grains * 100).toFixed(1)}%, Berries ${(progress.resourceUtilization.berries * 100).toFixed(1)}%, Salmon ${(progress.resourceUtilization.salmon * 100).toFixed(1)}%`)
      
      if (progress.lastGameSummary) {
        console.log(`   Last Game: ${progress.lastGameSummary.turns} turns, winner: ${progress.lastGameSummary.winner}`)
      }
      console.log('')
    }
  }
  
  console.log('\n✅ Simulation Complete!')
  console.log('\n🎯 This demonstrates how the visualization would work:')
  console.log('   • Real-time progress bar')
  console.log('   • Live strategy win rate updates')
  console.log('   • Resource utilization tracking')
  console.log('   • Latest game result summary')
  console.log('   • Running averages for key metrics')
  console.log('\n📱 In the React component, this data would drive:')
  console.log('   • Animated progress bars')
  console.log('   • Strategy performance charts')
  console.log('   • Resource utilization gauges')
  console.log('   • Live metrics dashboard')
}

// Run the demo
runDemo().catch(console.error)