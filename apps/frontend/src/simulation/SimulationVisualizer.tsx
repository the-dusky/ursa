/**
 * Minimal real-time visualization for simulation results
 * Shows progress and key metrics as simulations run
 */
import React, { useState, useEffect } from 'react'

export interface SimulationProgress {
  currentGame: number
  totalGames: number
  completedGames: number
  
  // Running statistics
  currentWinRates: { [strategy: string]: number }
  currentSurvivalRates: { [strategy: string]: number }
  averageGameLength: number
  averageDeathsPerGame: number
  averageHibernationsPerGame: number
  
  // Resource metrics
  resourceUtilization: {
    grains: number
    berries: number
    salmon: number
  }
  
  // Latest game result summary
  lastGameSummary?: {
    turns: number
    winner?: string
    deaths: number
    hibernations: number
  }
}

interface Props {
  progress: SimulationProgress | null
  isRunning: boolean
  onStop?: () => void
}

export const SimulationVisualizer: React.FC<Props> = ({ progress, isRunning, onStop }) => {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (isRunning && !startTime) {
      setStartTime(Date.now())
    } else if (!isRunning) {
      setStartTime(null)
    }
  }, [isRunning, startTime])

  useEffect(() => {
    if (!startTime) return

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 100)

    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    if (!progress) return 0
    return (progress.completedGames / progress.totalGames) * 100
  }

  const getStrategyColor = (strategy: string) => {
    const colors = {
      'aggressive': '#ef4444',
      'defensive': '#3b82f6', 
      'balanced': '#10b981',
      'opportunistic': '#f59e0b',
      'conservative': '#8b5cf6'
    }
    return colors[strategy as keyof typeof colors] || '#6b7280'
  }

  if (!progress && !isRunning) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          No simulation running
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          🎮 Simulation Progress
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {formatTime(elapsedTime)}
          </div>
          {isRunning && (
            <button
              onClick={onStop}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {progress && (
        <>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Games: {progress.completedGames} / {progress.totalGames}</span>
              <span>{getProgressPercentage().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Strategy Performance */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">🏆 Win Rates</h3>
              <div className="space-y-2">
                {Object.entries(progress.currentWinRates).map(([strategy, rate]) => (
                  <div key={strategy} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStrategyColor(strategy) }}
                      />
                      <span className="text-sm capitalize">{strategy}</span>
                    </div>
                    <span className="text-sm font-mono">
                      {(rate * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">💚 Survival Rates</h3>
              <div className="space-y-2">
                {Object.entries(progress.currentSurvivalRates).map(([strategy, rate]) => (
                  <div key={strategy} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStrategyColor(strategy) }}
                      />
                      <span className="text-sm capitalize">{strategy}</span>
                    </div>
                    <span className="text-sm font-mono">
                      {(rate * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Flow Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {progress.averageGameLength.toFixed(1)}
              </div>
              <div className="text-sm text-blue-800">Avg Turns</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {progress.averageDeathsPerGame.toFixed(1)}
              </div>
              <div className="text-sm text-red-800">Avg Deaths</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {progress.averageHibernationsPerGame.toFixed(1)}
              </div>
              <div className="text-sm text-purple-800">Avg Hibernations</div>
            </div>
          </div>

          {/* Resource Utilization */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">🍯 Resource Utilization</h3>
            <div className="space-y-3">
              {Object.entries(progress.resourceUtilization).map(([resource, utilization]) => (
                <div key={resource}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{resource}</span>
                    <span>{(utilization * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        resource === 'grains' ? 'bg-yellow-500' :
                        resource === 'berries' ? 'bg-purple-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, utilization * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Game Summary */}
          {progress.lastGameSummary && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-sm font-semibold mb-2 text-gray-800">🎯 Latest Game</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Turns:</span>
                  <div className="font-mono">{progress.lastGameSummary.turns}</div>
                </div>
                <div>
                  <span className="text-gray-600">Winner:</span>
                  <div className="font-mono">{progress.lastGameSummary.winner || 'None'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Deaths:</span>
                  <div className="font-mono">{progress.lastGameSummary.deaths}</div>
                </div>
                <div>
                  <span className="text-gray-600">Hibernations:</span>
                  <div className="font-mono">{progress.lastGameSummary.hibernations}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Running indicator */}
      {isRunning && (
        <div className="flex items-center justify-center mt-4 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm">Running simulation...</span>
        </div>
      )}
    </div>
  )
}

export default SimulationVisualizer