/**
 * Test page for running game simulations
 * Visit /test-simulation to run balance tests
 */

import { useState } from 'react'

interface SimulationResult {
  success: boolean
  summary: {
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
}

export default function TestSimulation() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const runSimulation = async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)
    
    try {
      console.log('🎮 Starting simulation...')
      
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResults(data)
        console.log('✅ Simulation completed!', data.summary)
      } else {
        setError(data.error || 'Simulation failed')
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run simulation')
      console.error('Simulation error:', err)
    } finally {
      setIsRunning(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎮 Bears Game Balance Tester
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Simulation</h2>
          <p className="text-gray-600 mb-4">
            This will run 50 automated games with different AI strategies to test game balance.
          </p>
          
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-semibold ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            } text-white transition-colors`}
          >
            {isRunning ? '🔄 Running Simulation...' : '🚀 Start Simulation'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {results && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">📊 Results Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.summary.gamesCompleted}
                  </div>
                  <div className="text-sm text-gray-600">Games Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary.averageGameLength}
                  </div>
                  <div className="text-sm text-gray-600">Avg Game Length</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.summary.averageYears}
                  </div>
                  <div className="text-sm text-gray-600">Avg Years</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {results.summary.balanceScore.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">Balance Score</div>
                </div>
              </div>
            </div>
            
            {/* Strategy Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🏆 Strategy Performance</h2>
              <div className="space-y-2">
                {Object.entries(results.summary.strategyWinRates).map(([strategy, rate]) => (
                  <div key={strategy} className="flex justify-between items-center">
                    <span className="font-medium capitalize">{strategy}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12">{rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Resource Usage */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🍯 Resource Utilization</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">🌾 Grains</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {results.summary.resourceUtilization.grains}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">🫐 Berries</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {results.summary.resourceUtilization.berries}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">🐟 Salmon</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.summary.resourceUtilization.salmon}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Game Mechanics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">⚙️ Game Mechanics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">💤 Hibernations</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.summary.averageHibernations}
                  </div>
                  <div className="text-sm text-gray-600">per game</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">💀 Deaths</div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.summary.averageDeaths}
                  </div>
                  <div className="text-sm text-gray-600">per game</div>
                </div>
              </div>
            </div>
            
            {/* Insights */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">💡 AI Analysis & Recommendations</h2>
              <div className="space-y-2">
                {results.summary.insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg ${
                      insight.startsWith('✅') ? 'bg-green-100 text-green-800' :
                      insight.startsWith('⚠️') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}