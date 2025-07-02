/**
 * PlayerInventoryBoard Component - Simplified for new architecture
 */

'use client'

import { CoreGameState } from '@/state/CoreGameState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PlayerInventoryBoardProps {
  gameState: CoreGameState
}

export function PlayerInventoryBoard({ gameState }: PlayerInventoryBoardProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  if (!currentPlayer) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">No current player</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Player Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-gray-600">
          {currentPlayer.name} - {currentPlayer.pieces.length} pieces
        </div>
      </CardContent>
    </Card>
  )
}