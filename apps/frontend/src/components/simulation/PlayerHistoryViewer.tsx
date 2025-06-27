/**
 * Player History Viewer - Shows player cards accumulating over time
 */
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TurnSnapshot, PlayerSnapshot } from '@/simulation/SimpleSimulation'

interface PlayerHistoryViewerProps {
  history: TurnSnapshot[]
}

export function PlayerHistoryViewer({ history }: PlayerHistoryViewerProps) {
  const [currentTurn, setCurrentTurn] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  const currentSnapshot = history[currentTurn]
  
  // Auto-play functionality
  React.useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      setCurrentTurn(prev => {
        if (prev >= history.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000) // 1 second per turn
    
    return () => clearInterval(interval)
  }, [isPlaying, history.length])

  if (!currentSnapshot) {
    return <div>No simulation data available</div>
  }

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayer(selectedPlayer === playerId ? null : playerId)
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>🎬 Turn-by-Turn Player History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={currentTurn >= history.length - 1}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </Button>
            
            <Button
              onClick={() => setCurrentTurn(Math.max(0, currentTurn - 1))}
              disabled={currentTurn === 0}
            >
              ⏮️ Previous
            </Button>
            
            <Button
              onClick={() => setCurrentTurn(Math.min(history.length - 1, currentTurn + 1))}
              disabled={currentTurn >= history.length - 1}
            >
              ⏭️ Next
            </Button>
            
            <Button
              onClick={() => setCurrentTurn(0)}
            >
              ⏪ Reset
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Turn: {currentTurn + 1} / {history.length}</span>
            <span>Year: {currentSnapshot.year}</span>
            <span>Season: {currentSnapshot.season}</span>
            <span>Phase: {currentSnapshot.turnPhase}</span>
            <span>Current Player: {currentSnapshot.currentPlayerId}</span>
          </div>
          
          <div className="mt-2">
            <input
              type="range"
              min="0"
              max={history.length - 1}
              value={currentTurn}
              onChange={(e) => setCurrentTurn(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events */}
      {currentSnapshot.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📝 Turn Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {currentSnapshot.events.map((event, index) => (
                <div key={index} className="text-sm p-2 bg-blue-50 rounded">
                  {event}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentSnapshot.players.map((player) => (
          <PlayerCard
            key={player.playerId}
            player={player}
            isSelected={selectedPlayer === player.playerId}
            onSelect={() => handlePlayerSelect(player.playerId)}
            isCurrentPlayer={player.playerId === currentSnapshot.currentPlayerId}
          />
        ))}
      </div>

      {/* Selected Player History */}
      {selectedPlayer && (
        <PlayerProgressChart
          playerId={selectedPlayer}
          history={history}
          currentTurn={currentTurn}
        />
      )}
    </div>
  )
}

function PlayerCard({ 
  player, 
  isSelected, 
  onSelect, 
  isCurrentPlayer 
}: { 
  player: PlayerSnapshot
  isSelected: boolean
  onSelect: () => void
  isCurrentPlayer: boolean
}) {
  const totalEnergy = player.pieces.reduce((sum, piece) => sum + piece.energy + piece.emergencyEnergy, 0)
  const totalFat = player.pieces.reduce((sum, piece) => sum + piece.fat, 0)
  const totalResources = player.pieces.reduce((sum, piece) => 
    sum + Object.values(piece.resources).reduce((resourceSum, amount) => resourceSum + amount, 0), 0
  )

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${
        isCurrentPlayer ? 'bg-yellow-50 border-yellow-300' : ''
      } ${
        !player.isAlive ? 'bg-red-50 border-red-300 opacity-75' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{player.playerName}</span>
          {isCurrentPlayer && <span className="text-xs bg-yellow-200 px-2 py-1 rounded">Current</span>}
          {!player.isAlive && <span className="text-xs bg-red-200 px-2 py-1 rounded">💀 Dead</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Bears:</span>
            <span className="font-mono">{player.pieces.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Energy:</span>
            <span className="font-mono text-blue-600">{totalEnergy}</span>
          </div>
          <div className="flex justify-between">
            <span>Fat:</span>
            <span className="font-mono text-orange-600">{totalFat}</span>
          </div>
          <div className="flex justify-between">
            <span>Resources:</span>
            <span className="font-mono text-green-600">{totalResources}</span>
          </div>
          <div className="flex justify-between">
            <span>Score:</span>
            <span className="font-mono text-purple-600">{player.totalScore}</span>
          </div>
        </div>

        {/* Individual Bears */}
        <div className="space-y-1">
          {player.pieces.map((piece, index) => (
            <div key={piece.id} className="text-xs p-2 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <span>🐻 Bear {index + 1}</span>
                <span className="text-xs">{piece.quadrant}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>⚡{piece.energy}</span>
                {piece.emergencyEnergy > 0 && <span className="text-orange-600">+{piece.emergencyEnergy}</span>}
                <span>🟡{piece.fat}</span>
                {piece.isHibernating && <span>😴</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PlayerProgressChart({ 
  playerId, 
  history, 
  currentTurn 
}: { 
  playerId: string
  history: TurnSnapshot[]
  currentTurn: number
}) {
  const playerHistory = history.slice(0, currentTurn + 1).map(snapshot => {
    const player = snapshot.players.find(p => p.playerId === playerId)
    if (!player) return null
    
    const totalEnergy = player.pieces.reduce((sum, piece) => sum + piece.energy + piece.emergencyEnergy, 0)
    const totalFat = player.pieces.reduce((sum, piece) => sum + piece.fat, 0)
    const totalResources = player.pieces.reduce((sum, piece) => 
      sum + Object.values(piece.resources).reduce((resourceSum, amount) => resourceSum + amount, 0), 0
    )
    
    return {
      turn: snapshot.turn,
      energy: totalEnergy,
      fat: totalFat,
      resources: totalResources,
      bearCount: player.pieces.length,
      score: player.totalScore
    }
  }).filter(Boolean)

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Player Progress: {history[currentTurn]?.players.find(p => p.playerId === playerId)?.playerName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Energy Over Time</h4>
            <div className="space-y-1">
              {playerHistory.map((data, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>Turn {data?.turn || 0}:</span>
                  <span className="text-blue-600">{data?.energy || 0}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Fat Over Time</h4>
            <div className="space-y-1">
              {playerHistory.map((data, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>Turn {data?.turn || 0}:</span>
                  <span className="text-orange-600">{data?.fat || 0}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Resources Over Time</h4>
            <div className="space-y-1">
              {playerHistory.map((data, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>Turn {data?.turn || 0}:</span>
                  <span className="text-green-600">{data?.resources || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}