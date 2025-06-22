/**
 * API endpoint to run game simulation
 * This allows us to run the simulation through Next.js
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { runQuickTest } from '../../simulation/test-runner'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    console.log('🎮 Starting game balance simulation...')
    
    const results = await runQuickTest()
    
    // Format response for easy reading
    const summary = {
      gamesCompleted: results.completedGames,
      averageGameLength: Math.round(results.averageGameLength * 10) / 10,
      averageYears: Math.round(results.averageYears * 10) / 10,
      
      strategyWinRates: Object.fromEntries(
        Object.entries(results.strategyWinRates).map(([strategy, rate]) => [
          strategy, 
          Math.round(rate * 1000) / 10 // Convert to percentage with 1 decimal
        ])
      ),
      
      resourceUtilization: {
        grains: Math.round(results.resourceUtilizationRate.grains * 1000) / 10,
        berries: Math.round(results.resourceUtilizationRate.berries * 1000) / 10,
        salmon: Math.round(results.resourceUtilizationRate.salmon * 1000) / 10
      },
      
      averageHibernations: Math.round(results.averageHibernationsPerGame * 10) / 10,
      averageDeaths: Math.round(results.averageDeathsPerGame * 10) / 10,
      
      balanceScore: Math.round(results.strategyBalance * 1000) / 1000,
      
      insights: generateInsights(results)
    }
    
    res.status(200).json({
      success: true,
      summary,
      fullResults: results
    })
    
  } catch (error) {
    console.error('Simulation error:', error)
    res.status(500).json({ 
      error: 'Simulation failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function generateInsights(results: any): string[] {
  const insights: string[] = []
  
  // Strategy balance check
  const winRates = Object.values(results.strategyWinRates) as number[]
  const maxWinRate = Math.max(...winRates)
  const minWinRate = Math.min(...winRates)
  const spread = maxWinRate - minWinRate
  
  if (spread > 0.3) {
    insights.push(`❌ Major strategy imbalance: ${(spread * 100).toFixed(1)}% spread between best and worst`)
  } else if (spread > 0.15) {
    insights.push(`⚠️ Minor strategy imbalance: ${(spread * 100).toFixed(1)}% spread`)
  } else {
    insights.push(`✅ Good strategy balance: ${(spread * 100).toFixed(1)}% spread`)
  }
  
  // Hibernation usage
  if (results.averageHibernationsPerGame < 0.5) {
    insights.push(`⚠️ Hibernation rarely used (${results.averageHibernationsPerGame.toFixed(1)} per game)`)
  } else if (results.averageHibernationsPerGame > 2.5) {
    insights.push(`⚠️ Hibernation very common (${results.averageHibernationsPerGame.toFixed(1)} per game)`)
  } else {
    insights.push(`✅ Hibernation usage looks good (${results.averageHibernationsPerGame.toFixed(1)} per game)`)
  }
  
  // Resource utilization
  const salmonUsage = results.resourceUtilizationRate.salmon
  if (salmonUsage < 0.3) {
    insights.push(`⚠️ Salmon underutilized (${(salmonUsage * 100).toFixed(1)}% usage)`)
  } else {
    insights.push(`✅ Salmon usage looks good (${(salmonUsage * 100).toFixed(1)}% usage)`)
  }
  
  // Game length
  if (results.averageGameLength > 100) {
    insights.push(`⚠️ Games quite long (${results.averageGameLength.toFixed(1)} turns average)`)
  } else if (results.averageGameLength < 20) {
    insights.push(`⚠️ Games quite short (${results.averageGameLength.toFixed(1)} turns average)`)
  } else {
    insights.push(`✅ Game length looks good (${results.averageGameLength.toFixed(1)} turns average)`)
  }
  
  return insights
}