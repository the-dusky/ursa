'use client'

import { useGameStore } from '@/store/gameStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'

export function ResourcePanel() {
  const { players, currentPlayerIndex, calculateScore } = useGameStore()
  
  // Get current player (excluding bears)
  const currentPlayer = players[currentPlayerIndex]
  const playerList = players.slice(0, -1) // Exclude bears from resource display

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
          📦 Resources
          <Badge variant="outline" className="text-xs">
            Turn {currentPlayer?.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {playerList.map((player, index) => {
          const isCurrentPlayer = index === currentPlayerIndex
          const score = calculateScore(player.id)
          
          return (
            <motion.div
              key={player.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                isCurrentPlayer 
                  ? 'border-blue-400 bg-blue-500/10' 
                  : 'border-slate-600 bg-slate-700/50'
              }`}
              animate={{
                scale: isCurrentPlayer ? 1.02 : 1,
                opacity: isCurrentPlayer ? 1 : 0.8
              }}
            >
              {/* Player Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-medium text-slate-200">
                    {player.name}
                  </span>
                  {isCurrentPlayer && (
                    <Badge className="text-xs bg-blue-500">Current</Badge>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Score: {score}
                </Badge>
              </div>

              {/* Resources - calculated from all bears */}
              <div className="space-y-2">
                {(() => {
                  const totalResources = player.pieces.reduce((total, piece) => ({
                    grains: total.grains + piece.resources.grains,
                    berries: total.berries + piece.resources.berries,
                    salmon: total.salmon + piece.resources.salmon
                  }), { grains: 0, berries: 0, salmon: 0 })
                  
                  return (
                    <>
                      {/* Grains */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>🌾</span>
                          <span className="text-sm text-slate-300">Grains</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-200">
                            {totalResources.grains}
                          </span>
                          <div className="w-16">
                            <Progress 
                              value={(totalResources.grains / 20) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Berries */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>🫐</span>
                          <span className="text-sm text-slate-300">Berries</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-200">
                            {totalResources.berries}
                          </span>
                          <div className="w-16">
                            <Progress 
                              value={(totalResources.berries / 15) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Salmon */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>🐟</span>
                          <span className="text-sm text-slate-300">Salmon</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-200">
                            {totalResources.salmon}
                          </span>
                          <div className="w-16">
                            <Progress 
                              value={(totalResources.salmon / 25) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}

                {/* Territory Count */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-600">
                  <div className="flex items-center gap-2">
                    <span>🏰</span>
                    <span className="text-sm text-slate-300">Territories</span>
                  </div>
                  <span className="text-sm font-mono text-slate-200">
                    {player.pieces.length}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Bears Info */}
        <div className="p-3 rounded-lg border-2 border-amber-600 bg-amber-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>🐻</span>
              <span className="font-medium text-amber-200">Bears</span>
            </div>
            <span className="text-sm font-mono text-amber-200">
              {players[players.length - 1]?.pieces.length || 0} surviving
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}