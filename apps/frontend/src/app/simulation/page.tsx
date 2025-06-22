/**
 * Simulation page with live visualization
 */
'use client'

import React, { useState, useCallback } from 'react'
import { BatchRunner, BatchConfig } from '../../simulation/BatchRunner'
import { SimulationVisualizer, SimulationProgress } from '../../simulation/SimulationVisualizer'
import { AIStrategy } from '../../simulation/GameSimulator'

const SimulationPage: React.FC = () => {
  const [progress, setProgress] = useState<SimulationProgress | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<string | null>(null)

  const defaultConfig: BatchConfig = {
    gameCount: 50,
    playerCount: 4,
    strategies: ['aggressive' as AIStrategy, 'defensive' as AIStrategy, 'balanced' as AIStrategy, 'opportunistic' as AIStrategy],
    maxTurnsPerGame: 200,
    maxYearsPerGame: 20,
    logLevel: 'summary'
  }

  const handleProgressUpdate = useCallback((newProgress: SimulationProgress) => {
    setProgress(newProgress)
  }, [])

  const runSimulation = async () => {
    if (isRunning) return
    
    setIsRunning(true)
    setProgress(null)
    setResults(null)
    
    try {
      const runner = new BatchRunner(defaultConfig, handleProgressUpdate)
      const batchResults = await runner.runBatch()
      
      // Generate final report
      const report = runner.generateReport(batchResults)
      setResults(report)
      
    } catch (error) {
      console.error('Simulation failed:', error)
      setResults(`Simulation failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsRunning(false)
    }
  }

  const stopSimulation = () => {
    setIsRunning(false)
    // Note: In a real implementation, you'd need to add cancellation support to BatchRunner
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🐻 Bears Game Simulation Lab
          </h1>
          <p className="text-gray-600">
            Run batch simulations to analyze game balance and strategy performance
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Simulation Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Games:</span>
              <div className="font-mono text-lg">{defaultConfig.gameCount}</div>
            </div>
            <div>
              <span className="text-gray-600">Players:</span>
              <div className="font-mono text-lg">{defaultConfig.playerCount}</div>
            </div>
            <div>
              <span className="text-gray-600">Max Turns:</span>
              <div className="font-mono text-lg">{defaultConfig.maxTurnsPerGame}</div>
            </div>
            <div>
              <span className="text-gray-600">Max Years:</span>
              <div className="font-mono text-lg">{defaultConfig.maxYearsPerGame}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <span className="text-gray-600">Strategies:</span>
            <div className="flex gap-2 mt-1">
              {defaultConfig.strategies.map(strategy => (
                <span 
                  key={strategy}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm capitalize"
                >
                  {strategy}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold ${
                isRunning 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? 'Running Simulation...' : 'Start Simulation'}
            </button>
          </div>
        </div>

        {/* Live Visualization */}
        <SimulationVisualizer 
          progress={progress}
          isRunning={isRunning}
          onStop={stopSimulation}
        />

        {/* Final Results */}
        {results && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Final Results</h2>
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto whitespace-pre-wrap">
              {results}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default SimulationPage