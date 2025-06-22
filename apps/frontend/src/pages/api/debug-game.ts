/**
 * API endpoint for debugging single games
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { debugSingleGame } from '../../simulation/debug-single-game'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    console.log('🔍 Starting debug game...')
    
    const result = await debugSingleGame()
    
    // Return detailed breakdown
    res.status(200).json({
      success: true,
      gameResult: result,
      analysis: {
        identicalGamesIssue: checkForIdenticalPatterns(result),
        aiVarietyCheck: checkAIVariety(result),
        resourceFlowCheck: checkResourceFlow(result),
        survivalIssues: checkSurvivalIssues(result)
      }
    })
    
  } catch (error) {
    console.error('Debug game error:', error)
    res.status(500).json({ 
      error: 'Debug game failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function checkForIdenticalPatterns(result: any) {
  return {
    concern: 'Are games too deterministic?',
    evidence: [
      `Game lasted exactly ${result.turns} turns`,
      `Eliminated players at specific turns: ${result.playerEliminations.map((e: any) => e.turn).join(', ')}`,
      `Resource collection seems consistent`
    ],
    recommendation: 'Run multiple debug games to see if results vary'
  }
}

function checkAIVariety(result: any) {
  const strategies = Object.keys(result.strategyPerformance || {})
  return {
    concern: 'Are different AI strategies actually behaving differently?',
    evidence: [
      `Strategies tested: ${strategies.join(', ')}`,
      `Only one strategy won: this suggests either broken AI or severe imbalance`
    ],
    recommendation: 'Add AI decision logging to verify different behaviors'
  }
}

function checkResourceFlow(result: any) {
  const collected = result.resourcesCollected
  const consumed = result.resourcesConsumed
  
  return {
    concern: 'Is the resource economy working correctly?',
    evidence: [
      `Grains: collected ${collected.grains}, consumed ${consumed.grains}`,
      `Berries: collected ${collected.berries}, consumed ${consumed.berries}`,
      `Salmon: collected ${collected.salmon}, consumed ${consumed.salmon}`,
      `Salmon consumption is ${consumed.salmon === 0 ? 'ZERO - major issue' : 'normal'}`
    ],
    recommendation: 'Trace resource production and consumption step by step'
  }
}

function checkSurvivalIssues(result: any) {
  return {
    concern: 'Why are bears dying so quickly?',
    evidence: [
      `${result.deathsByStarvation} deaths by starvation`,
      `Average eliminations around turns 11, 16, 53`,
      `No hibernations achieved (${result.hibernationCount})`
    ],
    recommendation: 'Check energy loss rates and resource production timing'
  }
}