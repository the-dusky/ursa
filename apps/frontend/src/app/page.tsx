'use client'

import dynamic from 'next/dynamic'

const GameBoard = dynamic(() => import('@/components/game/GameBoard').then(mod => ({ default: mod.GameBoard })), {
  ssr: false
})
import { GameControls } from '@/components/game/GameControls'
import { PlayerInfo } from '@/components/game/PlayerInfo'
import { ResourcePanel } from '@/components/game/ResourcePanel'
import { SeasonIndicator } from '@/components/game/SeasonIndicator'
import { GameLog } from '@/components/game/GameLog'
import { MultiplayerControls } from '@/components/game/MultiplayerControls'
import { RulesDialog } from '@/components/game/RulesDialog'
import { useGameStore } from '@/store/gameStore'
import { useEffect } from 'react'

export default function Home() {
  const { initializeGame, gamePhase } = useGameStore()

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
          <SeasonIndicator />
        </div>

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Player Info & Resources */}
          <aside className="lg:col-span-1 space-y-4">
            <PlayerInfo />
            <ResourcePanel />
          </aside>

          {/* Center - Game Board */}
          <main className="lg:col-span-2 flex justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 sm:p-6 w-full">
              <GameBoard />
              <div className="mt-4">
                <GameControls />
              </div>
            </div>
          </main>

          {/* Right Sidebar - Game Log */}
          <aside className="lg:col-span-1 space-y-4">
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