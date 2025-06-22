'use client'

import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlayerControlCardProps {
  playerId: string
}

export function PlayerControlCard({ playerId }: PlayerControlCardProps) {
  const { 
    players, 
    currentPlayerIndex, 
    nextPlayer,
    turnPhase,
    setTurnPhase,
    harvestAllPlayerResources
  } = useGameStore()
  
  const player = players.find(p => String(p.id) === playerId)
  const isCurrentPlayer = player && String(players[currentPlayerIndex]?.id) === playerId
  
  if (!player || player.id === 'bears') return null

  const turnPhases = ['eat', 'movement', 'harvest', 'digestion', 'complete'] as const
  
  const getCurrentPhaseIndex = () => {
    const currentIndex = turnPhases.findIndex(phase => phase === turnPhase)
    return currentIndex === -1 ? 0 : currentIndex
  }
  
  const handlePhaseChange = (phase: typeof turnPhases[number]) => {
    if (!isCurrentPlayer) return
    
    const currentIndex = getCurrentPhaseIndex()
    const targetIndex = turnPhases.findIndex(p => p === phase)
    
    // Only allow forward progression or staying on current phase
    if (targetIndex < currentIndex) return
    
    if (phase === 'complete') {
      nextPlayer()
    } else if (phase === 'harvest') {
      // Automatically harvest resources for all player's bears
      harvestAllPlayerResources(playerId)
      setTurnPhase('harvest')
    } else {
      setTurnPhase(phase as 'eat' | 'movement' | 'harvest' | 'digestion')
    }
  }

  return (
    <Card className={isCurrentPlayer ? 'ring-2 ring-blue-500 bg-blue-50' : 'opacity-75'}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{player.name}</span>
          {isCurrentPlayer && (
            <Badge variant="default">Current Turn</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Player Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <div className="font-medium">🐻 Bears</div>
            <div>{player.pieceCount.bears}/{player.pieceCount.maxBears}</div>
          </div>
          <div>
            <div className="font-medium">🐼 Cubs</div>
            <div>{player.pieceCount.cubs}/{player.pieceCount.maxCubs}</div>
          </div>
          <div>
            <div className="font-medium">Score</div>
            <div>{player.score}</div>
          </div>
        </div>

        {/* Turn Phase Controls */}
        <div className="space-y-2">
          <div className="font-medium text-sm">Turn Phase:</div>
          <div className="grid grid-cols-5 gap-1">
            {turnPhases.map((phase, index) => {
              const currentIndex = getCurrentPhaseIndex()
              const isCompleted = index < currentIndex
              const isCurrent = index === currentIndex && isCurrentPlayer
              const isAvailable = index <= currentIndex + 1 && isCurrentPlayer
              
              return (
                <Button
                  key={phase}
                  onClick={() => handlePhaseChange(phase)}
                  variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                  size="sm"
                  disabled={!isAvailable}
                  className={`text-xs p-1 h-8 ${isCompleted ? 'bg-green-100 text-green-800' : ''}`}
                >
                  {phase === 'complete' ? '✓' : phase.slice(0, 3)}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Bear Cards */}
        <div className="mt-3">
          <div className="font-medium text-sm mb-2">Bears:</div>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 5 }, (_, index) => {
              const piece = player.pieces[index]
              const isEmpty = !piece
              
              return (
                <div 
                  key={index} 
                  className={`border rounded p-1 text-xs ${isEmpty ? 'bg-gray-100 opacity-50' : 'bg-white'}`}
                >
                  {/* Bear indicator */}
                  <div className="text-center mb-1">
                    {isEmpty ? '🐻' : (piece.type === 'bear' ? '🐻' : '🐼')}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 h-16">
                    {/* Left column - Resources */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>🌾</span>
                        <span className="text-xs">{isEmpty ? 0 : piece.resources.grains}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>🫐</span>
                        <span className="text-xs">{isEmpty ? 0 : piece.resources.berries}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>🐟</span>
                        <span className="text-xs">{isEmpty ? 0 : piece.resources.salmon}</span>
                      </div>
                    </div>
                    
                    {/* Right column - Stomach & Energy */}
                    <div className="space-y-0.5">
                      <div className="border rounded p-0.5 bg-orange-50">
                        <div className="text-xs text-center">Stomach</div>
                        <div className="text-xs text-center">
                          {isEmpty ? 0 : (piece.stomach.grains + piece.stomach.berries + piece.stomach.salmon)}
                        </div>
                      </div>
                      <div className="border rounded p-0.5 bg-yellow-50">
                        <div className="text-xs text-center">Energy</div>
                        <div className="text-xs text-center">
                          ⚡{isEmpty ? 0 : piece.energy}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}