'use client'

import { useGameStore } from '@/store/gameStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PlayerInfo() {
  const { players, currentPlayerIndex } = useGameStore()

  return (
    <div className="space-y-4">
      {players.filter(p => p.id !== 'bears').map((player, index) => (
        <Card key={player.id} className={index === currentPlayerIndex ? 'ring-2 ring-blue-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>{player.name}</span>
              {index === currentPlayerIndex && (
                <Badge variant="default">Current</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="font-medium">Grains</div>
                <div>{player.resources.grains}</div>
              </div>
              <div>
                <div className="font-medium">Berries</div>
                <div>{player.resources.berries}</div>
              </div>
              <div>
                <div className="font-medium">Salmon</div>
                <div>{player.resources.salmon}</div>
              </div>
            </div>
            <div className="mt-2">
              <div className="font-medium">Pieces: {player.pieces.length}</div>
              <div className="font-medium">Score: {player.score}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}