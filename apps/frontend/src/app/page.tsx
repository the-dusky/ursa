'use client'

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
import { useGameStore } from '@/store/gameStore'
import { useEffect } from 'react'

export default function Home() {
  const { initializeGame, gamePhase, players } = useGameStore()

  useEffect(() => {
    if (gamePhase === 'setup') {
      initializeGame()
    }
  }, [gamePhase, initializeGame])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Seasonal Board Game
          </h1>
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
            {/* Player 1 Controls - Above board */}
            {players.length > 0 && (
              <PlayerControlCard playerId={String(players[0]?.id)} />
            )}
            
            {/* Game Board */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 sm:p-6 w-full">
              <GameBoard />
            </div>
            
            {/* Player 2 Controls - Below board */}
            {players.length > 1 && (
              <PlayerControlCard playerId={String(players[1]?.id)} />
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