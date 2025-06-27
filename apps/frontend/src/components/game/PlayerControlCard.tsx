'use client'

import { useGameStore } from '@/store/gameStore'
import { useUIInteractions } from '@/store/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GAME_CONFIG } from '@/engine/GameConfig'
import { usePhaseManagement } from '@/hooks/usePhaseManagement'
import { EnergyTaxButton, FatConversionButton, EnergyDisplay } from '@/components/game/BearCard'

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
    energyTaxPaid,
    isMultiplayer,
    playerNumber
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
  const isCurrentPlayer = Boolean(player && String(players[currentPlayerIndex]?.id) === playerId)
  const isMyCard = isMultiplayer ? Boolean(player && player.id === playerNumber) : isCurrentPlayer
  
  // Use phase management hook (must be called before any conditional returns)
  const phaseManagement = usePhaseManagement({
    player,
    turnPhase,
    season,
    energyTaxPaid,
    isCurrentPlayer,
    board,
    onAdvanceTurn,
    onAdvancePhase,
    onHarvest
  })
  
  // Helper function to get conversion tooltip
  const getConversionTooltip = (resourceType: keyof typeof GAME_CONFIG.resources.conversion.energy, convertTo: 'energy' | 'fat') => {
    const amount = GAME_CONFIG.resources.conversion[convertTo][resourceType]
    return `${amount} ${convertTo}`
  }
  
  if (!player || player.id === 'bears') return null


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
    <Card className={isMyCard ? 'ring-2 ring-blue-500 bg-blue-50' : 'opacity-75'}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>{player.name}</span>
              {isMyCard && (
                <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                  YOUR CARD
                </Badge>
              )}
            </div>
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
        {!phaseManagement.allBearsHibernating && isCurrentPlayer && (
          <div className="mb-2">
            <div className="font-medium text-sm mb-1">Turn Phase:</div>
            <div className="grid grid-cols-5 gap-1">
              {phaseManagement.turnPhases.map((phase, index) => {
                const buttonProps = phaseManagement.getPhaseButtonProps(phase, index)
                
                return (
                  <Button
                    key={phase}
                    onClick={buttonProps.onClick}
                    variant={buttonProps.isCurrent ? "default" : buttonProps.isCompleted ? "secondary" : "outline"}
                    size="sm"
                    disabled={!buttonProps.isAvailable}
                    className={`text-xs p-1 h-8 ${buttonProps.isCompleted ? 'bg-green-100 text-green-800' : ''}`}
                  >
                    {buttonProps.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Hibernation-only interface */}
        {phaseManagement.allBearsHibernating && isCurrentPlayer ? (
          <div className="space-y-3">
            <div className="text-center text-sm text-blue-600 font-medium">
              💤 All Bears Hibernating 💤
            </div>
            <div className="text-center text-xs text-gray-600">
              Bears will wake up in Spring
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => phaseManagement.handlePhaseChange('complete')}
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
                        <EnergyDisplay piece={piece} isEmpty={isEmpty} />
                        {isCurrentPlayer && turnPhase === 'movement' && !isEmpty && piece && !energyTaxPaid && (
                          <div className="mt-0.5">
                            <EnergyTaxButton
                              piece={piece}
                              space={Object.values(board.spaces).find(s => s.piece?.id === piece.id)}
                              season={season}
                              onPayTax={handlePayEnergyTax}
                              onDeath={handleDeath}
                            />
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
                            <FatConversionButton
                              piece={piece}
                              onConvertFat={handleConvertFat}
                            />
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