/**
 * Arena Panel - Interface for bear combat
 */

import React, { useState } from 'react'
import { useGameState } from '@/state'
import type { Player, GamePiece } from '@/state/CoreGameState'

export function ArenaPanel() {
  const { gameState, actions } = useGameState()
  const { arenaState } = gameState
  const [selectedEnergy, setSelectedEnergy] = useState<{ [bearId: string]: number }>({})

  if (!arenaState) {
    return null
  }

  const handleCommitEnergy = (bearId: string) => {
    const energy = selectedEnergy[bearId] || 0
    const bear = gameState.players
      .flatMap((p: Player) => p.pieces)
      .find((piece: GamePiece) => piece.id === bearId)
    
    if (bear) {
      actions.commitEnergy(bearId, energy, bear.playerId)
    }
  }

  const handleJoinArena = (bearId: string) => {
    const bear = gameState.players
      .flatMap((p: Player) => p.pieces)
      .find((piece: GamePiece) => piece.id === bearId)
    
    if (bear) {
      actions.joinArena(bearId, bear.playerId)
    }
  }

  const getAdjacentBears = () => {
    const arenaSpace = gameState.board.spaces[arenaState.spaceId]
    if (!arenaSpace) return []

    return gameState.players
      .flatMap((p: Player) => p.pieces)
      .filter((piece: GamePiece) => 
        arenaSpace.adjacentSpaces.includes(piece.spaceId) &&
        !arenaState.participants.includes(piece.id) &&
        piece.energy >= 1
      )
  }

  const getParticipatingBears = () => {
    return gameState.players
      .flatMap((p: Player) => p.pieces)
      .filter((piece: GamePiece) => arenaState.participants.includes(piece.id))
  }

  return (
    <div className="bg-red-900 text-white p-4 rounded-lg border-2 border-red-700">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">⚔️</span>
        <h2 className="text-xl font-bold">Arena Combat</h2>
        <span className="bg-red-700 px-2 py-1 rounded text-sm">{arenaState.phase}</span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-red-200">
          Combat at space: <span className="font-mono">{arenaState.spaceId}</span>
        </p>
      </div>

      {/* Joining Phase */}
      {arenaState.phase === 'joining' && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Adjacent Bears Can Join (1 energy)</h3>
          <div className="space-y-2">
            {getAdjacentBears().map((bear: GamePiece) => (
              <div key={bear.id} className="flex items-center justify-between bg-red-800 p-2 rounded">
                <span className="font-mono text-sm">
                  {bear.id} (Energy: {bear.energy}, Fat: {bear.fat})
                </span>
                <button
                  onClick={() => handleJoinArena(bear.id)}
                  className="bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded text-sm"
                >
                  Join Arena
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Participants ({arenaState.participants.length})</h3>
        <div className="space-y-2">
          {getParticipatingBears().map((bear: GamePiece) => {
            const hasCommitted = bear.id in arenaState.energyCommitments
            return (
              <div key={bear.id} className="bg-red-800 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm">
                    {bear.id} (Player {bear.playerId})
                  </span>
                  <span className="text-sm text-red-200">
                    Energy: {bear.energy}, Fat: {bear.fat}
                  </span>
                </div>

                {/* Energy Commitment */}
                {arenaState.phase === 'committing' && !hasCommitted && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Commit Energy:</label>
                    <input
                      type="range"
                      min="0"
                      max={bear.energy}
                      value={selectedEnergy[bear.id] || 0}
                      onChange={(e) => setSelectedEnergy(prev => ({
                        ...prev,
                        [bear.id]: parseInt(e.target.value)
                      }))}
                      className="flex-1"
                    />
                    <span className="text-sm w-8">{selectedEnergy[bear.id] || 0}</span>
                    <button
                      onClick={() => handleCommitEnergy(bear.id)}
                      className="bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-sm"
                    >
                      Commit
                    </button>
                  </div>
                )}

                {hasCommitted && (
                  <div className="text-green-400 text-sm">
                    ✓ Energy committed (hidden)
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Resolution */}
      {arenaState.phase === 'committing' && (
        <div className="mb-4">
          <p className="text-sm text-red-200 mb-2">
            Waiting for all participants to commit energy...
          </p>
          {arenaState.participants.every(bearId => bearId in arenaState.energyCommitments) && (
            <button
              onClick={() => actions.resolveArena()}
              className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded font-semibold"
            >
              🎲 Resolve Combat!
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {arenaState.phase === 'resolved' && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Combat Results</h3>
          
          {/* Team Scores */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold mb-1">Team Totals:</h4>
            {Object.entries(arenaState.teams).map(([playerId, team]) => (
              <div key={playerId} className="text-sm">
                Player {playerId}: <span className="font-mono">{team.totalScore}</span>
                {arenaState.winner === playerId && <span className="text-yellow-400 ml-2">👑 WINNER!</span>}
              </div>
            ))}
          </div>

          {/* Individual Results */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold mb-1">Individual Scores:</h4>
            {arenaState.participants.map(bearId => {
              const bear = gameState.players.flatMap(p => p.pieces).find(p => p.id === bearId)
              const dice = arenaState.skillRolls[bearId] || []
              const energy = arenaState.energyCommitments[bearId] || 0
              const skillTotal = dice.reduce((sum, die) => sum + die, 0)
              const fightScore = (bear?.fat || 0) + energy + Math.floor(skillTotal / 2)
              
              return (
                <div key={bearId} className="text-xs bg-red-700 p-2 rounded mb-1">
                  <div className="font-mono">{bearId}:</div>
                  <div>Fat({bear?.fat}) + Energy({energy}) + Skill({skillTotal}÷2={Math.floor(skillTotal / 2)}) = {fightScore}</div>
                  <div>Dice: [{dice.join(', ')}]</div>
                </div>
              )
            })}
          </div>

          {/* Casualties */}
          {arenaState.casualties.length > 0 && (
            <div className="bg-black bg-opacity-30 p-2 rounded">
              <h4 className="text-sm font-semibold text-red-300">💀 Casualties:</h4>
              <div className="text-sm">
                {arenaState.casualties.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}