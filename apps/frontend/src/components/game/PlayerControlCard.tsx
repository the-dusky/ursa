'use client'

import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EMERGENCY_CONVERSION } from '@/shared/gameRules'

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
    harvestAllPlayerResources,
    eatFood,
    season,
    board,
    hibernateBear,
    energyTaxPaid,
    payEnergyTax,
    burnFatForEmergencyEnergy
  } = useGameStore()
  
  const player = players.find(p => String(p.id) === playerId)
  const isCurrentPlayer = player && String(players[currentPlayerIndex]?.id) === playerId
  
  if (!player || player.id === 'bears') return null

  // Check if player has bears in mountains during winter (for hibernation phase)
  const hasBearsInMountainsDuringWinter = season === 'Winter' && player?.pieces.some(piece => {
    const space = Object.values(board.spaces).find(s => s.piece?.id === piece.id)
    return space?.quadrant === 'Mountains'
  })
  
  // Check if all player's bears are hibernating
  const allBearsHibernating = player?.pieces.length > 0 && player.pieces.every(piece => piece.isHibernating)
  
  const baseTurnPhases = ['movement', 'harvest', 'eat'] as const
  const turnPhases = hasBearsInMountainsDuringWinter 
    ? [...baseTurnPhases, 'hibernation', 'complete'] as const
    : [...baseTurnPhases, 'complete'] as const
  
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
      // Check if energy tax is paid before allowing harvest
      if (!energyTaxPaid) {
        return // Block harvest if tax not paid
      }
      
      // Automatically harvest resources for all player's bears
      const success = harvestAllPlayerResources(playerId)
      if (success) {
        setTurnPhase('harvest')
      }
    } else if (phase === 'hibernation') {
      // Show hibernation options for bears in mountains
      setTurnPhase('hibernation')
    } else {
      setTurnPhase(phase as 'movement' | 'harvest' | 'eat' | 'hibernation')
    }
  }

  const handleEatResource = (pieceId: string, resourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat', convertTo: 'energy' | 'fat') => {
    if (!isCurrentPlayer || turnPhase !== 'eat') return
    
    // Convert 1 unit of the resource directly to energy or fat
    const piece = player?.pieces.find(p => p.id === pieceId)
    if (!piece || piece.resources[resourceType] <= 0) return
    
    eatFood(pieceId, resourceType, 1, convertTo)
  }

  const handleHibernate = (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'hibernation') return
    
    hibernateBear(pieceId)
  }

  const handlePayEnergyTax = () => {
    if (!isCurrentPlayer || turnPhase !== 'movement') return
    payEnergyTax()
  }

  const handleConvertFat = (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'movement') return
    burnFatForEmergencyEnergy(pieceId)
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

        {/* Hibernation-only interface */}
        {allBearsHibernating && isCurrentPlayer ? (
          <div className="space-y-3">
            <div className="text-center text-sm text-blue-600 font-medium">
              💤 All Bears Hibernating 💤
            </div>
            <div className="text-center text-xs text-gray-600">
              Bears will wake up in Spring
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => handlePhaseChange('complete')}
                variant="default"
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                ✓ Complete Turn
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Movement Phase Actions */}
            {isCurrentPlayer && turnPhase === 'movement' && (
              <div className="space-y-2 mb-4">
                <div className="font-medium text-sm">Movement Phase Actions:</div>
                
                {/* Pay Energy Tax Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handlePayEnergyTax}
                    variant={energyTaxPaid ? "secondary" : "default"}
                    size="sm"
                    disabled={energyTaxPaid}
                    className={`flex-1 ${energyTaxPaid ? 'bg-green-100 text-green-800' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                  >
                    {energyTaxPaid ? '✓ Tax Paid' : '💰 Pay Energy Tax'}
                  </Button>
                </div>

                {/* Convert Fat Buttons - Individual Bears */}
                <div className="space-y-1">
                  {player?.pieces
                    .filter(piece => !piece.isHibernating && piece.fat > 0)
                    .map((piece, index) => {
                      const space = Object.values(board.spaces).find(s => s.piece?.id === piece.id)
                      const fatToConvert = Math.min(piece.fat, EMERGENCY_CONVERSION?.maxFatPerTurn || 5)
                      const energyGained = fatToConvert * 2
                      
                      return (
                        <div key={piece.id} className="border rounded p-2 bg-gray-50">
                          <div className="flex gap-2 items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              🐻 Bear #{index + 1} in {space?.quadrant}
                            </span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Button
                              onClick={() => handleConvertFat(piece.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                              disabled={piece.fat === 0}
                            >
                              🔥 Burn {fatToConvert} Fat → +{energyGained} Energy
                            </Button>
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              E:{piece.energy} F:{piece.fat}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  }
                  {player?.pieces.filter(piece => !piece.isHibernating && piece.fat > 0).length === 0 && (
                    <div className="text-xs text-gray-500 italic">
                      No bears with fat available
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
                  
                  <div className="grid grid-cols-2 gap-1 h-20">
                    {/* Left column - Resources */}
                    <div className="space-y-0.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>🌾</span>
                          <span className="text-xs">{isEmpty ? 0 : piece.resources.grains}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && piece.resources.grains > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'grains', 'energy')}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="3 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'grains', 'fat')}
                              className="text-xs bg-orange-100 hover:bg-orange-200 rounded px-1 py-0.5"
                              title="1 fat"
                            >
                              🟫
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>🫐</span>
                          <span className="text-xs">{isEmpty ? 0 : piece.resources.berries}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && piece.resources.berries > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'berries', 'energy')}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="2 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'berries', 'fat')}
                              className="text-xs bg-orange-100 hover:bg-orange-200 rounded px-1 py-0.5"
                              title="2 fat"
                            >
                              🟫
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>🐟</span>
                          <span className="text-xs">{isEmpty ? 0 : piece.resources.salmon}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && piece.resources.salmon > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'salmon', 'energy')}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="1 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'salmon', 'fat')}
                              className="text-xs bg-orange-100 hover:bg-orange-200 rounded px-1 py-0.5"
                              title="4 fat"
                            >
                              🟫
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>🍯</span>
                          <span className="text-xs">{isEmpty ? 0 : piece.resources.honey}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && piece.resources.honey > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'honey', 'energy')}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="4 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'honey', 'fat')}
                              className="text-xs bg-orange-100 hover:bg-orange-200 rounded px-1 py-0.5"
                              title="3 fat"
                            >
                              🟫
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>🥩</span>
                          <span className="text-xs">{isEmpty ? 0 : piece.resources.bearMeat}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && piece.resources.bearMeat > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'bearMeat', 'energy')}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="6 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'bearMeat', 'fat')}
                              className="text-xs bg-orange-100 hover:bg-orange-200 rounded px-1 py-0.5"
                              title="8 fat"
                            >
                              🟫
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Right column - Energy & Fat */}
                    <div className="space-y-0.5">
                      <div className="border rounded p-0.5 bg-yellow-50">
                        <div className="text-xs text-center">Energy</div>
                        <div className="text-xs text-center">
                          ⚡{isEmpty ? 0 : piece.energy}
                        </div>
                      </div>
                      <div className="border rounded p-0.5 bg-orange-50">
                        <div className="text-xs text-center">Fat</div>
                        <div className="text-xs text-center">
                          🟫{isEmpty ? 0 : piece.fat}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hibernation option during hibernation phase */}
                  {isCurrentPlayer && turnPhase === 'hibernation' && !isEmpty && piece && (() => {
                    const space = Object.values(board.spaces).find(s => s.piece?.id === piece.id)
                    const isInMountains = space?.quadrant === 'Mountains'
                    const isAlreadyHibernating = piece.isHibernating
                    
                    if (isInMountains && !isAlreadyHibernating) {
                      const hasEnoughFat = piece.fat >= 20
                      return (
                        <div className="mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-6"
                            onClick={() => handleHibernate(piece.id)}
                            disabled={!hasEnoughFat}
                            title={hasEnoughFat ? "Hibernate (costs 20 fat)" : `Need 20 fat (have ${piece.fat})`}
                          >
                            💤 Hibernate {hasEnoughFat ? '' : `(${piece.fat}/20)`}
                          </Button>
                        </div>
                      )
                    }
                    
                    if (isAlreadyHibernating) {
                      return (
                        <div className="mt-1 text-center text-xs text-blue-600">
                          💤 Hibernating
                        </div>
                      )
                    }
                    
                    return null
                  })()}
                </div>
              )
            })}
          </div>
        </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}