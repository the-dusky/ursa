/**
 * Simulation Page - Game Balance Testing
 * 
 * Tests the actual game using the real GameEngine
 */
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerHistoryViewer } from '@/components/simulation/PlayerHistoryViewer'
import type { TurnSnapshot } from '@/simulation/SimpleSimulation'

interface SimulationResults {
  success: boolean
  summary?: {
    gamesCompleted: number
    averageGameLength: number
    averageYears: number
    strategyWinRates: { [strategy: string]: number }
    resourceUtilization: {
      grains: number
      berries: number
      salmon: number
    }
    averageHibernations: number
    averageDeaths: number
    balanceScore: number
    insights: string[]
  }
  fullResults?: {
    games: Array<{
      history: TurnSnapshot[]
    }>
  }
  error?: string
}

export default function SimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<SimulationResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedGameIndex, setSelectedGameIndex] = useState(0)

  const runSimulation = async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed')
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🎮 Game Balance Simulation</h1>
        <p className="text-gray-600 mb-6">
          Test game balance using the real GameEngine to ensure accurate results
        </p>
        
        <Button 
          onClick={runSimulation} 
          disabled={isRunning}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Running Simulation...
            </>
          ) : (
            'Run Game Balance Test'
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">❌ Simulation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {results?.success && results.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Game Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Games Completed:</span>
                <span className="font-mono">{results.summary.gamesCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Game Length:</span>
                <span className="font-mono">{results.summary.averageGameLength} turns</span>
              </div>
              <div className="flex justify-between">
                <span>Average Years:</span>
                <span className="font-mono">{results.summary.averageYears}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Hibernations:</span>
                <span className="font-mono">{results.summary.averageHibernations}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Deaths:</span>
                <span className="font-mono">{results.summary.averageDeaths}</span>
              </div>
            </CardContent>
          </Card>

          {/* Player Balance */}
          <Card>
            <CardHeader>
              <CardTitle>⚖️ Player Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {Object.entries(results.summary.strategyWinRates).map(([player, winRate]) => (
                  <div key={player} className="flex justify-between items-center">
                    <span>{player}:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${winRate}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm w-12">{winRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between">
                  <span>Balance Score:</span>
                  <span className={`font-mono ${
                    results.summary.balanceScore > 0.8 ? 'text-green-600' : 
                    results.summary.balanceScore > 0.6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(results.summary.balanceScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>🌾 Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {Object.entries(results.summary.resourceUtilization).map(([resource, usage]) => (
                  <div key={resource} className="flex justify-between items-center">
                    <span className="capitalize">{resource}:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${usage}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm w-12">{usage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>💡 Balance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.summary.insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg text-sm ${
                      insight.startsWith('✅') ? 'bg-green-50 text-green-700' :
                      insight.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700' :
                      insight.startsWith('❌') ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Player History Viewer */}
      {results?.success && results.fullResults?.games && results.fullResults.games.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🎬 Game History Viewer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <label htmlFor="gameSelect" className="text-sm font-medium">
                  Select Game:
                </label>
                <select
                  id="gameSelect"
                  value={selectedGameIndex}
                  onChange={(e) => setSelectedGameIndex(parseInt(e.target.value))}
                  className="px-3 py-1 border rounded"
                >
                  {results.fullResults.games.map((_, index) => (
                    <option key={index} value={index}>
                      Game {index + 1}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">
                  ({results.fullResults.games[selectedGameIndex]?.history?.length || 0} turns)
                </span>
              </div>
            </CardContent>
          </Card>

          {results.fullResults.games[selectedGameIndex]?.history && (
            <PlayerHistoryViewer history={results.fullResults.games[selectedGameIndex].history} />
          )}
        </div>
      )}

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700">ℹ️ About This Simulation</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 space-y-2">
          <p>
            This simulation uses the <strong>actual GameEngine</strong> to test game balance, 
            ensuring results accurately reflect the real game mechanics.
          </p>
          <p>
            All recent changes are included: death mechanics, incremental fat conversion (2→1), 
            energy tax cycles, and emergency energy system.
          </p>
          <p>
            The simulation runs multiple AI games and analyzes win rates, resource usage, 
            and game flow to identify balance issues.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}