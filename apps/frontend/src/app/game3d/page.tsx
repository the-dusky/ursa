/**
 * 3D Tabletop Game View
 *
 * A full-page 3D view of the game board using React Three Fiber.
 * This provides an immersive tabletop experience.
 */

'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useGameState } from '../../state'

// Dynamic import to avoid SSR issues with Three.js
const GameTable3D = dynamic(
  () => import('../../components/3d/GameTable3D').then(mod => mod.GameTable3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading 3D View...</p>
        </div>
      </div>
    ),
  }
)

export default function Game3DPage() {
  const { gamePhase, players, season, year, turn, board, actions, diceState } = useGameState()
  const [initialized, setInitialized] = useState(false)
  const [isRolling, setIsRolling] = useState(false)
  const [showArena, setShowArena] = useState(false)
  const [showSpaceIds, setShowSpaceIds] = useState(false)

  // Initialize board for preview if no game started
  useEffect(() => {
    if (!initialized && Object.keys(board.spaces).length === 0) {
      // Initialize the game with 4 players for preview
      actions.initializeGame?.(4)
      setInitialized(true)
    }
  }, [initialized, board.spaces, actions])

  // Handle setup dice roll
  const handleRollSetupDice = async () => {
    if (isRolling) return
    setIsRolling(true)

    // Roll position dice first
    await actions.rollDice?.('position')

    // Wait a moment, then roll direction dice
    setTimeout(async () => {
      await actions.rollDice?.('direction')
      setIsRolling(false)
    }, 500)
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; Back to 2D View
          </Link>
          <h1 className="text-white font-bold">3D Tabletop View</h1>
          <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded text-white">
            PROTOTYPE
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span>Phase: {gamePhase}</span>
          <span>Season: {season}</span>
          <span>Year {year}, Turn {turn}</span>
          <span>Players: {players.length}</span>
        </div>
      </header>

      {/* 3D Canvas */}
      <main className="flex-1 relative">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
              Loading...
            </div>
          }
        >
          <GameTable3D debug={false} showArena={showArena} showSpaceIds={showSpaceIds} />
        </Suspense>
      </main>

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
        <h3 className="font-bold mb-2">Controls</h3>
        <ul className="space-y-1 text-gray-300">
          <li>
            <kbd className="bg-gray-700 px-1 rounded">Left click + drag</kbd> Rotate
          </li>
          <li>
            <kbd className="bg-gray-700 px-1 rounded">Right click + drag</kbd> Pan
          </li>
          <li>
            <kbd className="bg-gray-700 px-1 rounded">Scroll</kbd> Zoom
          </li>
        </ul>
      </div>

      {/* Dice Roll Panel */}
      <div className="absolute top-20 right-4 bg-black/70 text-white p-4 rounded-lg text-sm w-64">
        <h3 className="font-bold mb-3">Setup Roll</h3>

        <button
          onClick={handleRollSetupDice}
          disabled={isRolling}
          className={`w-full py-2 px-4 rounded font-bold transition-colors ${
            isRolling
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {isRolling ? 'Rolling...' : 'Roll Setup Dice'}
        </button>

        <button
          onClick={() => setShowArena(!showArena)}
          className={`w-full mt-2 py-2 px-4 rounded font-bold transition-colors ${
            showArena
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          {showArena ? 'Hide Arena' : 'Show Arena'}
        </button>

        <button
          onClick={() => setShowSpaceIds(!showSpaceIds)}
          className={`w-full mt-2 py-2 px-4 rounded font-bold transition-colors ${
            showSpaceIds
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          {showSpaceIds ? 'Hide Space IDs' : 'Show Space IDs'}
        </button>

        {/* Show dice results */}
        {diceState.positionRolls && (
          <div className="mt-3">
            <p className="text-gray-400 text-xs mb-1">Position Dice:</p>
            <div className="flex gap-1">
              {diceState.positionRolls.dice.map((die, i) => (
                <span key={i} className="bg-white text-black w-6 h-6 flex items-center justify-center rounded font-bold text-sm">
                  {die}
                </span>
              ))}
            </div>
          </div>
        )}

        {diceState.directionRolls && (
          <div className="mt-2">
            <p className="text-gray-400 text-xs mb-1">Direction Dice:</p>
            <div className="flex gap-1">
              {diceState.directionRolls.dice.map((die, i) => (
                <span key={i} className={`w-6 h-6 flex items-center justify-center rounded font-bold text-sm ${
                  die >= 4 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {die >= 4 ? '→' : '←'}
                </span>
              ))}
            </div>
          </div>
        )}

        {diceState.rotations && diceState.rotations.some(r => r !== 0) && (
          <div className="mt-2">
            <p className="text-gray-400 text-xs mb-1">Ring Rotations:</p>
            <div className="flex gap-1">
              {diceState.rotations.map((rot, i) => (
                <span key={i} className="bg-gray-700 w-6 h-6 flex items-center justify-center rounded text-xs">
                  {rot > 0 ? `+${rot}` : rot}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player list */}
      {players.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <h3 className="font-bold mb-2">Players</h3>
          <ul className="space-y-1">
            {players.map((player, index) => (
              <li key={player.id} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span>{player.name}</span>
                <span className="text-gray-400">
                  ({player.pieces.length} pieces)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
