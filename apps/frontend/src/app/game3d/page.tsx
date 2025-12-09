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
  const { gamePhase, players, season, year, turn, board, actions } = useGameState()
  const [initialized, setInitialized] = useState(false)

  // Initialize board for preview if no game started
  useEffect(() => {
    if (!initialized && Object.keys(board.spaces).length === 0) {
      // Initialize the game with a sample configuration for preview
      actions.initializeGame?.({
        playerCount: 2,
        playerNames: ['Player 1', 'Player 2'],
        playerColors: ['#ef4444', '#3b82f6']
      })
      setInitialized(true)
    }
  }, [initialized, board.spaces, actions])

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
          <GameTable3D debug={false} />
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
