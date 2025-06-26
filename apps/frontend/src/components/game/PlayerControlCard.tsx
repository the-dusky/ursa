'use client'

import { useGameStore } from '@/store/gameStore'
import { useUIInteractions } from '@/store/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GAME_CONFIG } from '@/engine/GameConfig'

interface PlayerControlCardProps {
  playerId: string
}

export function PlayerControlCard({ playerId }: PlayerControlCardProps) {
  // Get game state (read-only)
  const { 
    players, 
    currentPlayerIndex, 
    turnPhase,
    season,
    board,
    energyTaxPaid
  } = useGameStore()
  
  // Get UI actions (for user interactions)
  const {
    onEatResource,
    onHibernate,
    onHarvest,
    onPayTax,
    onConvertFat,
    onAdvanceTurn,
    onAdvancePhase,
    onDeath
  } = useUIInteractions()
  
  const player = players.find(p => String(p.id) === playerId)
  const isCurrentPlayer = player && String(players[currentPlayerIndex]?.id) === playerId
  
  // Helper function to get conversion tooltip
  const getConversionTooltip = (resourceType: keyof typeof GAME_CONFIG.resources.conversion.energy, convertTo: 'energy' | 'fat') => {
    const amount = GAME_CONFIG.resources.conversion[convertTo][resourceType]
    return `${amount} ${convertTo}`
  }
  
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
    
    // Cannot advance from movement phase unless energy tax is paid
    if (turnPhase === 'movement' && !energyTaxPaid && phase !== 'movement') {
      return // Block advancement until tax is paid
    }
    
    if (phase === 'complete') {
      // Use action creator for turn advancement
      onAdvanceTurn()
    } else {
      // Use action creator for phase advancement
      onAdvancePhase()
      
      // If advancing to harvest, auto-harvest for all pieces
      if (phase === 'harvest' && energyTaxPaid) {
        // Auto-harvest for each piece individually using action creators
        player?.pieces.forEach((piece) => {
          onHarvest(piece.id)
        })
      }
    }
  }

  const handleEatResource = (pieceId: string, resourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat', convertTo: 'energy' | 'fat') => {
    if (!isCurrentPlayer || turnPhase !== 'eat') return
    
    // Use action creator instead of direct game store call
    onEatResource(pieceId, resourceType, 1, convertTo)
  }

  const handleHibernate = (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'hibernation') return
    
    // Use action creator instead of direct game store call
    onHibernate(pieceId)
  }

  const handlePayEnergyTax = (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'movement') return
    
    // Use action creator with specific piece ID
    onPayTax(pieceId)
  }

  const handleConvertFat = (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'movement') return
    
    // Convert exactly 2 fat to 1 energy per click
    const fatAmount = 2
    
    onConvertFat(pieceId, fatAmount)
  }

  const handleDeath = (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'movement') return
    
    // Use action creator for death
    onDeath(pieceId)
  }

  return (
    <Card className={isCurrentPlayer ? 'ring-2 ring-blue-500 bg-blue-50' : 'opacity-75'}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span>{player.name}</span>
            <div className="flex gap-2 text-xs text-gray-600">
              <span>🐻 {player.pieceCount.bears}/{player.pieceCount.maxBears}</span>
              <span>🐼 {player.pieceCount.cubs}/{player.pieceCount.maxCubs}</span>
              <span>Score: {player.score}</span>
            </div>
          </div>
          {isCurrentPlayer && (
            <Badge variant="default">Current Turn</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>

        {/* Turn Phase Controls - At Top */}
        {!allBearsHibernating && isCurrentPlayer && (
          <div className="mb-2">
            <div className="font-medium text-sm mb-1">Turn Phase:</div>
            <div className="grid grid-cols-5 gap-1">
              {turnPhases.map((phase, index) => {
                const currentIndex = getCurrentPhaseIndex()
                const isCompleted = index < currentIndex
                const isCurrent = index === currentIndex && isCurrentPlayer
                const isNextPhase = index === currentIndex + 1
                // Can only advance to next phase if tax is paid (or staying on current phase)
                const canAdvance = energyTaxPaid || turnPhase !== 'movement' || !isNextPhase
                const isAvailable = index <= currentIndex + 1 && isCurrentPlayer && canAdvance
                
                return (
                  <Button
                    key={phase}
                    onClick={() => handlePhaseChange(phase)}
                    variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                    size="sm"
                    disabled={!isAvailable}
                    className={`text-xs p-1 h-8 ${isCompleted ? 'bg-green-100 text-green-800' : ''}`}
                  >
                    {phase === 'complete' ? 'End Turn' : phase.slice(0, 3)}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

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
        {/* Bear Cards */}
        <div className="mt-1">
          <div className="font-medium text-sm mb-1">Bears:</div>
          <div className="grid grid-cols-2 gap-3">
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
                  
                  <div className="grid grid-cols-2 gap-1 min-h-20">
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
                              title={getConversionTooltip('grains', 'energy')}
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'grains', 'fat')}
                              className="text-xs bg-orange-100 hover:bg-orange-200 rounded px-1 py-0.5"
                              title={getConversionTooltip('grains', 'fat')}
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
                          {!isEmpty && piece && piece.emergencyEnergy > 0 && (
                            <span className="text-orange-600">+{piece.emergencyEnergy}</span>
                          )}
                        </div>
                        {isCurrentPlayer && turnPhase === 'movement' && !isEmpty && piece && !energyTaxPaid && (
                          <div className="mt-0.5">
                            {(() => {
                              const space = Object.values(board.spaces).find(s => s.piece?.id === piece.id)
                              const energyCost = season === 'Winter' ? 
                                (space?.quadrant === 'Mountains' ? 2 : 5) : 1
                              const totalEnergy = piece.energy + piece.emergencyEnergy
                              const totalFat = piece.fat
                              const canPayTax = totalEnergy >= energyCost
                              // Calculate how much energy we can get from fat conversion (incremental: 2 fat = 1 energy)
                              const maxEnergyFromFat = Math.floor(totalFat / 2) // Only count complete pairs of fat
                              const totalPossibleEnergy = totalEnergy + maxEnergyFromFat
                              const canSurvive = totalPossibleEnergy >= energyCost
                              
                              if (!canSurvive) {
                                return (
                                  <button
                                    onClick={() => handleDeath(piece.id)}
                                    className="text-xs bg-red-600 hover:bg-red-700 text-white rounded px-1 py-0.5 w-full"
                                    title={`Cannot pay ${energyCost} energy tax - must die`}
                                  >
                                    💀 Die (Can&apos;t Pay)
                                  </button>
                                )
                              }
                              
                              return (
                                <button
                                  onClick={() => handlePayEnergyTax(piece.id)}
                                  className="text-xs bg-red-100 hover:bg-red-200 rounded px-1 py-0.5 w-full"
                                  disabled={!canPayTax}
                                  title={`Pay ${energyCost} energy tax`}
                                >
                                  Tax {energyCost}⚡
                                </button>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="border rounded p-0.5 bg-orange-50">
                        <div className="text-xs text-center">Fat</div>
                        <div className="text-xs text-center">
                          🟫{isEmpty ? 0 : piece.fat}
                        </div>
                        {isCurrentPlayer && turnPhase === 'movement' && !isEmpty && piece && (
                          <div className="mt-0.5">
                            {(() => {
                              const canConvert = piece.fat >= 2 // Need at least 2 fat to convert
                              
                              return (
                                <button
                                  onClick={() => handleConvertFat(piece.id)}
                                  className={`text-xs rounded px-1 py-0.5 w-full relative z-10 ${
                                    canConvert 
                                      ? 'bg-orange-100 hover:bg-orange-200' 
                                      : 'bg-gray-100 cursor-not-allowed'
                                  }`}
                                  disabled={!canConvert}
                                  title={canConvert ? `Convert 2 fat to 1 energy (have ${piece.fat} fat)` : `Need 2 fat to convert (have ${piece.fat})`}
                                >
                                  🔥→⚡ (2→1)
                                </button>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hibernation option during hibernation phase */}
                  {isCurrentPlayer && turnPhase === 'hibernation' && !isEmpty && piece && (() => {
                    const space = Object.values(board.spaces).find(s => s.piece?.id === piece.id)
                    const isInMountains = space?.quadrant === 'Mountains'
                    const isAlreadyHibernating = piece.isHibernating
                    
                    if (isInMountains && !isAlreadyHibernating) {
                      const hibernationCost = GAME_CONFIG.hibernation.fatCost
                      const hasEnoughFat = piece.fat >= hibernationCost
                      return (
                        <div className="mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-6"
                            onClick={() => handleHibernate(piece.id)}
                            disabled={!hasEnoughFat}
                            title={hasEnoughFat ? `Hibernate (costs ${hibernationCost} fat)` : `Need ${hibernationCost} fat (have ${piece.fat})`}
                          >
                            💤 Hibernate {hasEnoughFat ? '' : `(${piece.fat}/${hibernationCost})`}
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