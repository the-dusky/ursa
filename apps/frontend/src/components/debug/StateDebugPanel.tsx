'use client'

import { useState } from 'react'
import { useStateCoordinator } from '@/state/StateCoordinator'
import { useMultiplayerStore } from '@/state/MultiplayerStore'
import { useBearPlacement } from '@/hooks/useBearPlacement'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function StateDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { gameState } = useStateCoordinator()
  const { 
    isConnected,
    playerNumber,
    playerName,
    connectedPlayers,
    roomId
  } = useMultiplayerStore()
  const {
    isMyTurn,
    currentPlayer,
    isInBearPlacementPhase,
    selectedSpaceId
  } = useBearPlacement()

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          🐛 Debug State
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center text-sm">
            <span>🐛 State Debug Panel</span>
            <Button 
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="sm"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-3">
          {/* Player Info */}
          <div className="bg-blue-100 p-2 rounded">
            <div className="font-bold text-blue-800">Player Info:</div>
            <div>Name: {playerName || 'N/A'}</div>
            <div>Number: {playerNumber || 'N/A'}</div>
            <div>Connected: {isConnected ? '✅' : '❌'}</div>
            <div>Room: {roomId || 'N/A'}</div>
          </div>

          {/* Game State */}
          <div className="bg-green-100 p-2 rounded">
            <div className="font-bold text-green-800">Game State:</div>
            <div>Phase: <span className="font-mono bg-white px-1">{gameState.gamePhase}</span></div>
            <div>Turn Phase: <span className="font-mono bg-white px-1">{gameState.turnPhase}</span></div>
            <div>Current Player: {gameState.currentPlayerIndex}</div>
            <div>Game Started: {gameState.isGameStarted ? '✅' : '❌'}</div>
            <div>Expected Players: {gameState.expectedPlayerCount}</div>
            <div>Actual Players: {gameState.players.length}</div>
          </div>

          {/* Bear Placement State */}
          {gameState.bearPlacementState ? (
            <div className="bg-yellow-100 p-2 rounded">
              <div className="font-bold text-yellow-800">Bear Placement:</div>
              <div>Current Index: {gameState.bearPlacementState.currentPlayerIndex}</div>
              <div>Current Player: {gameState.players[gameState.bearPlacementState.currentPlayerIndex]?.name}</div>
              <div>Remaining: [{gameState.bearPlacementState.playersRemaining.join(', ')}]</div>
              <div>Complete: {gameState.bearPlacementState.isComplete ? '✅' : '❌'}</div>
              <div className="mt-2 border-t pt-2">
                <div className="font-bold text-yellow-800">Turn Logic:</div>
                <div>Is My Turn: {isMyTurn ? '✅' : '❌'}</div>
                <div>Current Player ID: {currentPlayer?.id}</div>
                <div>Current Player Number: {currentPlayer?.playerNumber}</div>
                <div>My Player Number: {playerNumber}</div>
                <div>In Bear Phase: {isInBearPlacementPhase ? '✅' : '❌'}</div>
                <div>Selected Space: {selectedSpaceId || 'None'}</div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-2 rounded">
              <div className="font-bold text-gray-800">Bear Placement: NULL</div>
            </div>
          )}

          {/* Connected Players */}
          <div className="bg-orange-100 p-2 rounded">
            <div className="font-bold text-orange-800">Connected Players:</div>
            {Object.values(connectedPlayers).map(player => (
              <div key={player.id}>
                {player.name} (#{player.playerNumber})
              </div>
            ))}
          </div>

          {/* Players in Game */}
          <div className="bg-red-100 p-2 rounded">
            <div className="font-bold text-red-800">Game Players:</div>
            {gameState.players.map(player => (
              <div key={player.id}>
                {player.name} (ID: {player.id}, Bears: {player.pieceCount.bears})
              </div>
            ))}
          </div>

          {/* Timestamps */}
          <div className="bg-gray-100 p-2 rounded">
            <div className="font-bold text-gray-800">Timestamps:</div>
            <div>Created: {new Date(gameState.createdAt).toLocaleTimeString()}</div>
            <div>Updated: {new Date(gameState.lastUpdated).toLocaleTimeString()}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}