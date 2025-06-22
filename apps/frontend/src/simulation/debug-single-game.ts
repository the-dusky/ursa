/**
 * Debug Single Game - Run one game with detailed logging
 * This helps us understand if our simulation logic is correct
 */

import { SimulationEngine, SimulationConfig } from './SimulationEngine'

export async function debugSingleGame() {
  console.log('🔍 DEBUGGING SINGLE GAME')
  console.log('========================\n')
  
  const config: SimulationConfig = {
    playerCount: 4,
    strategies: ['aggressive', 'conservative', 'balanced', 'hibernation-focused'],
    maxTurns: 200,
    maxYears: 10,
    logLevel: 'detailed' // Full logging
  }
  
  console.log('🎮 Starting single game with detailed logging...\n')
  
  const engine = new SimulationEngine(config)
  const result = await engine.runGame()
  
  console.log('\n📊 GAME COMPLETED')
  console.log('=================')
  console.log(`Winner: ${result.winner}`)
  console.log(`Turns: ${result.turns}`)
  console.log(`Years: ${result.years}`)
  console.log(`Deaths: ${result.deathsByStarvation}`)
  console.log(`Hibernations: ${result.hibernationCount}`)
  
  console.log('\n📈 RESOURCE BREAKDOWN')
  console.log('====================')
  console.log('Collected:', result.resourcesCollected)
  console.log('Consumed:', result.resourcesConsumed)
  
  console.log('\n🏆 PLAYER PERFORMANCE')
  console.log('====================')
  Object.entries(result.finalScores).forEach(([player, score]) => {
    console.log(`${player}: ${score} bears surviving`)
  })
  
  console.log('\n⚡ ELIMINATIONS')
  console.log('===============')
  result.playerEliminations.forEach(elim => {
    console.log(`${elim.playerId} eliminated on turn ${elim.turn}: ${elim.reason}`)
  })
  
  return result
}

// Create a version that runs with AI debugging enabled
export async function debugWithAILogging() {
  console.log('🧠 DEBUGGING WITH AI DECISION LOGGING')
  console.log('=====================================\n')
  
  // First, we need to temporarily enable AI debugging
  // We'll modify the GameSimulator to log decisions
  
  const result = await debugSingleGame()
  
  console.log('\n🤔 ANALYSIS QUESTIONS:')
  console.log('======================')
  console.log('1. Are all players making different decisions?')
  console.log('2. Are bears actually moving to different spaces?')
  console.log('3. Are resources being collected and consumed?')
  console.log('4. Why are bears dying so early?')
  console.log('5. Are any bears ever reaching high fat levels?')
  
  return result
}