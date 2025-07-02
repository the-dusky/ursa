'use client'

import React, { Suspense, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'

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
import { BearPlacement } from '@/components/game/BearPlacement'
import { useStateCoordinator } from '@/state/StateCoordinator'
import { useMultiplayerStore } from '@/state/MultiplayerStore'

function HomeContent() {
  const { gameState } = useStateCoordinator()
  const { 
    isConnected: isMultiplayer,
    playerName,
    playerNumber,
    roomId,
    connectedPlayers
  } = useMultiplayerStore()
  
  const searchParams = useSearchParams()
  const router = useRouter()

  const isValidPlayerInRoom = () => {
    return isMultiplayer && playerNumber && Object.keys(connectedPlayers).length > 0
  }

  // Check if we should show the game interface or the initial setup screen
  const shouldShowGameInterface = gameState.players.length > 0

  // Check if user is accessing a room URL without being properly registered
  useEffect(() => {
    const roomIdParam = searchParams?.get('room')
    const playerId = searchParams?.get('player')
    
    if (roomIdParam && (gameState.gamePhase === 'dice_roll' || gameState.gamePhase === 'board_setup')) {
      // If there's a player ID in the URL, they have a valid invite - give more time
      const timeoutDuration = playerId ? 5000 : 3000 // 5 seconds with player ID, 3 without
      
      const checkTimeout = setTimeout(() => {
        // Don't redirect if they have a valid player ID - let them see an error message instead
        if (!playerId && !isValidPlayerInRoom()) {
          console.log('Invalid room access without player ID - redirecting to lobby')
          router.push('/')
        }
      }, timeoutDuration)

      return () => clearTimeout(checkTimeout)
    }
  }, [searchParams, gameState.gamePhase, router])

  // Sort players so current player appears first
  const sortedPlayers = React.useMemo(() => {
    if (!isMultiplayer || !playerNumber || gameState.players.length <= 1) {
      return gameState.players // For single player or when not in multiplayer, use default order
    }

    // Find current player and other players
    const currentPlayer = gameState.players.find(p => p.id === String(playerNumber))
    const otherPlayers = gameState.players.filter(p => p.id !== String(playerNumber))
    
    // Return array with current player first, then others
    return currentPlayer ? [currentPlayer, ...otherPlayers] : gameState.players
  }, [gameState.players, isMultiplayer, playerNumber])

  // Show initial setup screen only when no game has been initialized
  if (!shouldShowGameInterface) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading game setup...</p>
        </div>
      </div>}>
        <GameSetup />
      </Suspense>
    )
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
            {/* Bear Placement Phase */}
            <BearPlacement />
            
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

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>}>
      <HomeContent />
    </Suspense>
  )
}