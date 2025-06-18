'use client'

import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GameControls() {
  const { 
    nextPlayer, 
    advanceSeason, 
    resetGame, 
    currentPlayerIndex, 
    players, 
    season,
    clearSelection,
    toggleRules
  } = useGameStore()

  const currentPlayer = players[currentPlayerIndex]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p><strong>Current Player:</strong> {currentPlayer?.name}</p>
          <p><strong>Season:</strong> {season}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={nextPlayer} variant="outline">
            Next Player
          </Button>
          <Button onClick={advanceSeason} variant="outline">
            Advance Season
          </Button>
          <Button onClick={clearSelection} variant="outline">
            Clear Selection
          </Button>
          <Button onClick={toggleRules} variant="outline">
            Rules
          </Button>
          <Button onClick={resetGame} variant="destructive">
            Reset Game
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}