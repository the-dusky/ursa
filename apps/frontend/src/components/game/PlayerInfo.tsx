/**
 * PlayerInfo Component - Shows current player information
 */

import { CoreGameState, CoreGameStateUtils } from '@/state/CoreGameState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface PlayerInfoProps {
  gameState: CoreGameState
}

export function PlayerInfo({ gameState }: PlayerInfoProps) {
  const currentPlayer = CoreGameStateUtils.getCurrentPlayer(gameState)

  if (!currentPlayer) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">No current player</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate totals
  const totalResources = currentPlayer.pieces.reduce((total, piece) => {
    return total + 
      piece.resources.grains + 
      piece.resources.berries + 
      piece.resources.salmon + 
      piece.resources.honey + 
      piece.resources.bearMeat
  }, 0)

  const totalEnergy = currentPlayer.pieces.reduce((total, piece) => total + piece.energy, 0)
  const totalFat = currentPlayer.pieces.reduce((total, piece) => total + piece.fat, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg" style={{ color: currentPlayer.color }}>
          {currentPlayer.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Score</span>
            <Badge variant="default">{currentPlayer.score}</Badge>
          </div>
        </div>

        {/* Bears and Cubs */}
        <div>
          <h4 className="text-sm font-medium mb-2">Pieces</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Bears:</span>
              <span>{currentPlayer.pieces.filter(p => p.type === 'bear').length}/{currentPlayer.pieceCount.maxBears}</span>
            </div>
            <div className="flex justify-between">
              <span>Cubs:</span>
              <span>{currentPlayer.pieces.filter(p => p.type === 'cub').length}/{currentPlayer.pieceCount.maxCubs}</span>
            </div>
          </div>
        </div>

        {/* Resources Summary */}
        <div>
          <h4 className="text-sm font-medium mb-2">Resources</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total Resources:</span>
              <Badge variant="outline">{totalResources}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Total Energy:</span>
              <Badge variant="outline">{totalEnergy}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Total Fat:</span>
              <Badge variant="outline">{totalFat}</Badge>
            </div>
          </div>
        </div>

        {/* Individual Pieces */}
        {currentPlayer.pieces.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Your Pieces</h4>
            <div className="space-y-2">
              {currentPlayer.pieces.map((piece) => (
                <div key={piece.id} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium capitalize">{piece.type}</span>
                    <span className="text-gray-500">{piece.spaceId}</span>
                  </div>
                  
                  {/* Energy/Fat bars */}
                  <div className="space-y-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Energy</span>
                        <span>{piece.energy}/10</span>
                      </div>
                      <Progress value={(piece.energy / 10) * 100} className="h-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Fat</span>
                        <span>{piece.fat}/10</span>
                      </div>
                      <Progress value={(piece.fat / 10) * 100} className="h-1" />
                    </div>
                  </div>

                  {/* Resources */}
                  {totalResources > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {piece.resources.grains > 0 && (
                          <span>🌾 {piece.resources.grains}</span>
                        )}
                        {piece.resources.berries > 0 && (
                          <span>🫐 {piece.resources.berries}</span>
                        )}
                        {piece.resources.salmon > 0 && (
                          <span>🐟 {piece.resources.salmon}</span>
                        )}
                        {piece.resources.honey > 0 && (
                          <span>🍯 {piece.resources.honey}</span>
                        )}
                        {piece.resources.bearMeat > 0 && (
                          <span>🥩 {piece.resources.bearMeat}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {piece.isHibernating && (
                      <Badge variant="outline" className="text-xs">Hibernating</Badge>
                    )}
                    {piece.movedThisTurn && (
                      <Badge variant="outline" className="text-xs">Moved</Badge>
                    )}
                    {(piece.health ?? 10) < 10 && (
                      <Badge variant="destructive" className="text-xs">Health: {piece.health ?? 0}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}