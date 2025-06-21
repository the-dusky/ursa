'use client'

import { useGameStore } from '@/store/gameStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PlayerInfo() {
  const { players, currentPlayerIndex, spaces } = useGameStore()

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
            <div className="mt-2 space-y-1">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="font-medium">🐻 Bears</div>
                  <div>{player.pieceCount.bears}/{player.pieceCount.maxBears}</div>
                </div>
                <div>
                  <div className="font-medium">🐼 Cubs</div>
                  <div>{player.pieceCount.cubs}/{player.pieceCount.maxCubs}</div>
                </div>
              </div>
              <div className="font-medium">Score: {player.score}</div>
            </div>
            
            {/* Show individual bear resources */}
            <div className="mt-3">
              <div className="font-medium text-sm mb-2">Bear Resources:</div>
              <div className="space-y-1">
                {player.pieces.map(piece => {
                  const space = spaces.find(s => s.id === piece.spaceId)
                  
                  return (
                    <div key={piece.id} className="text-xs bg-slate-100 p-2 rounded">
                      <div className="font-medium">
                        {piece.type === 'bear' ? '🐻' : '🐼'} {space?.quadrant}
                      </div>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        <div>🌾 {piece.resources.grains}</div>
                        <div>🫐 {piece.resources.berries}</div>
                        <div>🐟 {piece.resources.salmon}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}