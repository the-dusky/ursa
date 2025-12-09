/**
 * Arena Panel - Dramatic bear combat interface with sequential dice rolling
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useGameState } from '@/state'
import type { Player, GamePiece } from '@/state/CoreGameState'

// Die face display component
function DieFace({ value, rolling = false, revealed = false }: { value: number; rolling?: boolean; revealed?: boolean }) {
  const dots: { [key: number]: string } = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  }

  return (
    <span className={`text-3xl ${rolling ? 'animate-bounce' : ''} ${revealed ? 'text-yellow-300' : 'text-white'}`}>
      {rolling ? '🎲' : dots[value] || '?'}
    </span>
  )
}

// Bear card component for the face-off view
function BearCard({
  bear,
  player,
  energyCommitted,
  dice,
  isRolling,
  revealedDice,
  fightScore,
  isWinner,
  isDead,
  side
}: {
  bear: GamePiece
  player: Player
  energyCommitted: number
  dice: number[]
  isRolling: boolean
  revealedDice: number
  fightScore: number | null
  isWinner: boolean
  isDead: boolean
  side: 'left' | 'right'
}) {
  const skillTotal = dice.slice(0, revealedDice).reduce((sum, die) => sum + die, 0)
  const currentScore = revealedDice > 0
    ? bear.fat + energyCommitted + Math.floor(skillTotal / 2)
    : null

  return (
    <div className={`flex-1 p-4 rounded-lg border-2 ${
      isDead
        ? 'bg-gray-800 border-gray-600 opacity-60'
        : isWinner
          ? 'bg-yellow-900 border-yellow-500'
          : 'bg-red-800 border-red-600'
    }`}>
      {/* Player name and bear emoji */}
      <div className="text-center mb-3">
        <div className={`text-4xl mb-2 ${side === 'left' ? '' : 'transform scale-x-[-1]'}`}>
          {isDead ? '💀' : '🐻'}
        </div>
        <div className="font-bold text-lg" style={{ color: player.color }}>
          {player.name}
        </div>
        <div className="text-sm text-gray-300">{bear.id}</div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Fat:</span>
          <span className="font-mono font-bold">{bear.fat}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Energy Spent:</span>
          <span className="font-mono font-bold text-yellow-400">{energyCommitted}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Base Score:</span>
          <span className="font-mono">{bear.fat + energyCommitted}</span>
        </div>
      </div>

      {/* Dice row */}
      <div className="bg-black bg-opacity-30 rounded p-2 mb-3">
        <div className="text-xs text-gray-400 mb-1 text-center">Skill Dice</div>
        <div className="flex justify-center gap-1">
          {dice.map((die, i) => (
            <DieFace
              key={i}
              value={die}
              rolling={isRolling && i === revealedDice}
              revealed={i < revealedDice}
            />
          ))}
        </div>
        {revealedDice > 0 && (
          <div className="text-center text-sm mt-1">
            <span className="text-gray-400">Skill Total:</span>{' '}
            <span className="font-mono">{skillTotal}</span>
            <span className="text-gray-500"> ÷2 = </span>
            <span className="font-mono text-yellow-300">{Math.floor(skillTotal / 2)}</span>
          </div>
        )}
      </div>

      {/* Current/Final Score */}
      <div className={`text-center py-2 rounded ${
        isWinner ? 'bg-yellow-600' : isDead ? 'bg-gray-700' : 'bg-red-700'
      }`}>
        <div className="text-xs text-gray-300">
          {fightScore !== null ? 'FINAL SCORE' : currentScore !== null ? 'Current Score' : 'Awaiting Roll'}
        </div>
        <div className="text-3xl font-bold">
          {fightScore ?? currentScore ?? '?'}
        </div>
      </div>

      {/* Status badge */}
      {isWinner && (
        <div className="text-center mt-2 text-yellow-400 font-bold">
          👑 WINNER!
        </div>
      )}
      {isDead && (
        <div className="text-center mt-2 text-red-400 font-bold">
          💀 DEFEATED
        </div>
      )}
    </div>
  )
}

export function ArenaPanel() {
  const { gameState, actions } = useGameState()
  const { arenaState } = gameState
  const [selectedEnergy, setSelectedEnergy] = useState<{ [bearId: string]: number }>({})

  // Animation state for sequential dice rolling
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentRollingBear, setCurrentRollingBear] = useState<number>(0)
  const [revealedDice, setRevealedDice] = useState<{ [bearId: string]: number }>({})
  const [animationComplete, setAnimationComplete] = useState(false)

  // Start the sequential roll animation
  const startRollAnimation = useCallback(() => {
    if (!arenaState) return

    setIsAnimating(true)
    setCurrentRollingBear(0)
    setRevealedDice({})
    setAnimationComplete(false)

    // First, resolve the arena to get the dice rolls
    actions.resolveArena()
  }, [arenaState, actions])

  // Animate dice one by one after resolution
  useEffect(() => {
    if (!arenaState || arenaState.phase !== 'resolved' || !isAnimating || animationComplete) return

    const participants = arenaState.participants
    const bearId = participants[currentRollingBear]
    if (!bearId) {
      // All bears done
      setIsAnimating(false)
      setAnimationComplete(true)
      return
    }

    const currentRevealed = revealedDice[bearId] || 0
    const totalDice = arenaState.skillRolls[bearId]?.length || 5

    if (currentRevealed < totalDice) {
      // Reveal next die for current bear
      const timer = setTimeout(() => {
        setRevealedDice(prev => ({
          ...prev,
          [bearId]: currentRevealed + 1
        }))
      }, 400) // 400ms per die
      return () => clearTimeout(timer)
    } else {
      // Move to next bear after a pause
      const timer = setTimeout(() => {
        setCurrentRollingBear(prev => prev + 1)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [arenaState, isAnimating, currentRollingBear, revealedDice, animationComplete])

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

  const getBearWithPlayer = (bearId: string) => {
    for (const player of gameState.players) {
      const bear = player.pieces.find(p => p.id === bearId)
      if (bear) return { bear, player }
    }
    return null
  }

  // Show face-off view during resolved phase (or when animating)
  const showFaceOff = arenaState.phase === 'resolved' || isAnimating

  return (
    <div className="bg-gradient-to-b from-red-900 to-red-950 text-white p-6 rounded-lg border-2 border-red-700 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">⚔️</div>
        <h2 className="text-2xl font-bold tracking-wide">ARENA COMBAT</h2>
        <p className="text-red-300 text-sm">
          {arenaState.spaceId}
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

      {/* Attacker Committing Phase */}
      {arenaState.phase === 'attacker_committing' && !isAnimating && (
        <>
          <div className="mb-6">
            <div className="text-center mb-4 py-3 bg-orange-800 rounded-lg border border-orange-600">
              <div className="text-lg font-bold text-orange-300">ATTACKER'S TURN</div>
              <div className="text-sm text-orange-200">Commit energy first - defender will see your choice!</div>
            </div>
            <div className="space-y-3">
              {getParticipatingBears().map((bear: GamePiece) => {
                const isAttacker = bear.id === arenaState.attackerId
                const player = gameState.players.find(p => p.id === bear.playerId)

                if (!isAttacker) {
                  // Show defender waiting
                  return (
                    <div key={bear.id} className="bg-gray-700 p-4 rounded-lg opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🐻</span>
                          <div>
                            <div className="font-bold" style={{ color: player?.color }}>
                              {player?.name} (Defender)
                            </div>
                            <div className="text-xs text-gray-400">{bear.id}</div>
                          </div>
                        </div>
                        <div className="text-gray-400 italic">Waiting for attacker...</div>
                      </div>
                    </div>
                  )
                }

                // Show attacker's commitment UI
                return (
                  <div key={bear.id} className="bg-orange-900 p-4 rounded-lg border-2 border-orange-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        <div>
                          <div className="font-bold" style={{ color: player?.color }}>
                            {player?.name} (Attacker)
                          </div>
                          <div className="text-xs text-gray-400">{bear.id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className="text-gray-400">Fat:</span> <span className="font-bold">{bear.fat}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Energy:</span> <span className="font-bold text-yellow-400">{bear.energy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm whitespace-nowrap">Commit:</span>
                        <input
                          type="range"
                          min="0"
                          max={bear.energy}
                          value={selectedEnergy[bear.id] || 0}
                          onChange={(e) => setSelectedEnergy(prev => ({
                            ...prev,
                            [bear.id]: parseInt(e.target.value)
                          }))}
                          className="flex-1 h-2 bg-orange-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-lg font-bold w-8 text-center text-yellow-400">
                          {selectedEnergy[bear.id] || 0}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCommitEnergy(bear.id)}
                        className="w-full bg-orange-600 hover:bg-orange-500 py-2 rounded font-semibold transition-colors"
                      >
                        Lock In Attack Energy
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Defender Committing Phase - Can see attacker's commitment! */}
      {arenaState.phase === 'defender_committing' && !isAnimating && (
        <>
          <div className="mb-6">
            <div className="text-center mb-4 py-3 bg-blue-800 rounded-lg border border-blue-600">
              <div className="text-lg font-bold text-blue-300">DEFENDER'S ADVANTAGE</div>
              <div className="text-sm text-blue-200">You can see the attacker's commitment!</div>
            </div>
            <div className="space-y-3">
              {getParticipatingBears().map((bear: GamePiece) => {
                const isAttacker = bear.id === arenaState.attackerId
                const isDefender = bear.id === arenaState.defenderId
                const player = gameState.players.find(p => p.id === bear.playerId)

                if (isAttacker) {
                  // Show attacker's committed energy (REVEALED to defender!)
                  const attackerEnergy = arenaState.energyCommitments[bear.id] || 0
                  return (
                    <div key={bear.id} className="bg-orange-900 p-4 rounded-lg border-2 border-orange-500">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">⚔️</span>
                          <div>
                            <div className="font-bold" style={{ color: player?.color }}>
                              {player?.name} (Attacker)
                            </div>
                            <div className="text-xs text-gray-400">{bear.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="text-gray-400">Fat:</span> <span className="font-bold">{bear.fat}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center py-3 bg-orange-800 rounded">
                        <div className="text-sm text-orange-300">Energy Committed:</div>
                        <div className="text-3xl font-bold text-yellow-400">{attackerEnergy}</div>
                        <div className="text-xs text-orange-300 mt-1">
                          Base Score: {bear.fat + attackerEnergy}
                        </div>
                      </div>
                    </div>
                  )
                }

                if (isDefender) {
                  // Show defender's commitment UI
                  return (
                    <div key={bear.id} className="bg-blue-900 p-4 rounded-lg border-2 border-blue-500">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🛡️</span>
                          <div>
                            <div className="font-bold" style={{ color: player?.color }}>
                              {player?.name} (Defender)
                            </div>
                            <div className="text-xs text-gray-400">{bear.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="text-gray-400">Fat:</span> <span className="font-bold">{bear.fat}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-400">Energy:</span> <span className="font-bold text-yellow-400">{bear.energy}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm whitespace-nowrap">Commit:</span>
                          <input
                            type="range"
                            min="0"
                            max={bear.energy}
                            value={selectedEnergy[bear.id] || 0}
                            onChange={(e) => setSelectedEnergy(prev => ({
                              ...prev,
                              [bear.id]: parseInt(e.target.value)
                            }))}
                            className="flex-1 h-2 bg-blue-600 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-lg font-bold w-8 text-center text-yellow-400">
                            {selectedEnergy[bear.id] || 0}
                          </span>
                        </div>
                        <div className="text-xs text-blue-300 text-center mb-2">
                          Your Base Score: {bear.fat + (selectedEnergy[bear.id] || 0)}
                        </div>
                        <button
                          onClick={() => handleCommitEnergy(bear.id)}
                          className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-semibold transition-colors"
                        >
                          Lock In Defense Energy
                        </button>
                      </div>
                    </div>
                  )
                }

                return null
              })}
            </div>
          </div>
        </>
      )}

      {/* Revealing Phase - Both committed, ready to fight */}
      {arenaState.phase === 'revealing' && !isAnimating && (
        <>
          <div className="mb-6">
            <div className="text-center mb-4 py-3 bg-purple-800 rounded-lg border border-purple-600">
              <div className="text-lg font-bold text-purple-300">BOTH COMMITTED!</div>
              <div className="text-sm text-purple-200">Ready to roll the dice and determine the winner!</div>
            </div>
            <div className="flex gap-4 mb-4">
              {getParticipatingBears().map((bear: GamePiece) => {
                const isAttacker = bear.id === arenaState.attackerId
                const player = gameState.players.find(p => p.id === bear.playerId)
                const committed = arenaState.energyCommitments[bear.id] || 0

                return (
                  <div key={bear.id} className={`flex-1 p-4 rounded-lg border-2 ${
                    isAttacker ? 'bg-orange-900 border-orange-500' : 'bg-blue-900 border-blue-500'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">{isAttacker ? '⚔️' : '🛡️'}</div>
                      <div className="font-bold" style={{ color: player?.color }}>{player?.name}</div>
                      <div className="text-xs text-gray-400">{isAttacker ? 'Attacker' : 'Defender'}</div>
                      <div className="mt-2 text-xl font-bold text-yellow-400">
                        Energy: {committed}
                      </div>
                      <div className="text-sm text-gray-300">
                        Base: {bear.fat + committed}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              onClick={startRollAnimation}
              className="w-full bg-purple-600 hover:bg-purple-500 px-6 py-4 rounded-lg font-bold text-xl transition-colors animate-pulse"
            >
              ⚔️ BEGIN COMBAT! ⚔️
            </button>
          </div>
        </>
      )}

      {/* Face-Off View - During Animation and Results */}
      {showFaceOff && (
        <>
          {/* VS Banner */}
          <div className="text-center mb-4">
            <div className="inline-block bg-black bg-opacity-50 px-6 py-2 rounded-full">
              <span className="text-2xl font-bold text-red-400">⚔️ FIGHT! ⚔️</span>
            </div>
          </div>

          {/* Bear Face-Off Cards */}
          <div className="flex gap-4 mb-6">
            {arenaState.participants.map((bearId, index) => {
              const data = getBearWithPlayer(bearId)
              if (!data) return null

              const { bear, player } = data
              const dice = arenaState.skillRolls[bearId] || [0, 0, 0, 0, 0]
              const energyCommitted = arenaState.energyCommitments[bearId] || 0
              const revealed = revealedDice[bearId] || 0
              const isCurrentlyRolling = isAnimating && arenaState.participants[currentRollingBear] === bearId

              // Calculate if fully revealed
              const fullyRevealed = revealed >= 5 || animationComplete
              const skillTotal = dice.reduce((sum: number, die: number) => sum + die, 0)
              const fightScore = fullyRevealed
                ? bear.fat + energyCommitted + Math.floor(skillTotal / 2)
                : null

              const isWinner = arenaState.winner === bear.playerId && animationComplete
              const isDead = arenaState.casualties.includes(bearId) && animationComplete

              return (
                <BearCard
                  key={bearId}
                  bear={bear}
                  player={player}
                  energyCommitted={energyCommitted}
                  dice={dice}
                  isRolling={isCurrentlyRolling && revealed < 5}
                  revealedDice={animationComplete ? 5 : revealed}
                  fightScore={fightScore}
                  isWinner={isWinner}
                  isDead={isDead}
                  side={index === 0 ? 'left' : 'right'}
                />
              )
            })}
          </div>

          {/* Winner Announcement */}
          {animationComplete && arenaState.winner && (
            <div className="text-center mb-4 py-4 bg-yellow-900 rounded-lg border-2 border-yellow-500">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-xl font-bold text-yellow-400">
                {gameState.players.find(p => p.id === arenaState.winner)?.name} Wins!
              </div>
              {arenaState.casualties.length > 0 && (
                <div className="text-red-400 text-sm mt-2">
                  💀 {arenaState.casualties.length} bear{arenaState.casualties.length > 1 ? 's' : ''} defeated
                </div>
              )}
            </div>
          )}

          {/* Return to Game Button - Only show when animation is complete */}
          {animationComplete && (
            <button
              onClick={() => actions.clearArena()}
              className="w-full bg-green-600 hover:bg-green-500 px-4 py-4 rounded-lg font-bold text-xl transition-colors"
            >
              ✓ Return to Game
            </button>
          )}
        </>
      )}
    </div>
  )
}
