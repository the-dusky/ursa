'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const GameBoard = dynamic(() => import('@/components/game/GameBoard').then(mod => ({ default: mod.GameBoard })), {
  ssr: false
})
import { GameControls } from '@/components/game/GameControls'
import { PlayerControlCard } from '@/components/game/PlayerControlCard'
import { SeasonIndicator } from '@/components/game/SeasonIndicator'
import { GameLog } from '@/components/game/GameLog'
import { DiceTray } from '@/components/game/DiceTray'
import { MultiplayerControls } from '@/components/game/MultiplayerControls'
import { RulesDialog } from '@/components/game/RulesDialog'
import { RulesReferenceCard } from '@/components/game/RulesReferenceCard'
import { GameSetup } from '@/components/game/GameSetup'
import { useGameStore } from '@/store/gameStore'

export default function Home() {
  const { gamePhase, players, isMultiplayer, playerName, playerNumber } = useGameStore()

  // Sort players so current player appears first
  const sortedPlayers = React.useMemo(() => {
    if (!isMultiplayer || !playerNumber || players.length <= 1) {
      return players // For single player or when not in multiplayer, use default order
    }

    // Find current player and other players
    const currentPlayer = players.find(p => p.id === playerNumber)
    const otherPlayers = players.filter(p => p.id !== playerNumber)
    
    // Return array with current player first, then others
    return currentPlayer ? [currentPlayer, ...otherPlayers] : players
  }, [players, isMultiplayer, playerNumber])

  // Show setup screen if game is in setup phase
  if (gamePhase === 'setup') {
    return <GameSetup />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              Seasonal Board Game
            </h1>
            {isMultiplayer && playerName && playerNumber && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Playing as: {playerName}
                </span>
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                  Player {playerNumber}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/simulation"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              🧪 Simulation Lab
            </a>
            <SeasonIndicator />
          </div>
        </div>

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Rules Reference */}
          <aside className="lg:col-span-1 space-y-4">
            <RulesReferenceCard />
          </aside>
          
          {/* Center Column - Player Controls & Game Board */}
          <main className="lg:col-span-2 space-y-4">
            {/* Current Player Controls - Above board */}
            {sortedPlayers.length > 0 && (
              <PlayerControlCard playerId={String(sortedPlayers[0]?.id)} />
            )}
            
            {/* Game Board */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 sm:p-6 w-full">
              <GameBoard />
            </div>
            
            {/* Other Player Controls - Below board */}
            {sortedPlayers.length > 1 && (
              <PlayerControlCard playerId={String(sortedPlayers[1]?.id)} />
            )}
          </main>

          {/* Right Sidebar - Game Controls & Log */}
          <aside className="lg:col-span-1 space-y-4">
            <GameControls />
            <DiceTray />
            <GameLog />
            <MultiplayerControls />
          </aside>
        </div>


        {/* Rules Dialog */}
        <RulesDialog />
      </div>
    </div>
  )
}