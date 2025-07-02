'use client'

import { useStateCoordinator, useCoordinatedGameActions } from '@/state/StateCoordinator'
import { useMultiplayerStore } from '@/state/MultiplayerStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlayerControlCardProps {
  playerId: string
}

export function PlayerControlCard({ playerId }: PlayerControlCardProps) {
  // Get game state from new architecture
  const { gameState } = useStateCoordinator()
  const gameActions = useCoordinatedGameActions()
  const { isConnected: isMultiplayer, playerNumber } = useMultiplayerStore()
  
  const { 
    players, 
    currentPlayerIndex, 
    turnPhase,
    season,
    board,
    energyTaxPaid
  } = gameState
  
  const player = players.find(p => String(p.id) === playerId)
  const isCurrentPlayer = Boolean(player && String(players[currentPlayerIndex]?.id) === playerId)
  const isMyCard = isMultiplayer ? Boolean(player && String(player.id) === String(playerNumber)) : isCurrentPlayer
  
  // Helper function to get conversion tooltip
  const getConversionTooltip = (resourceType: string, convertTo: 'energy' | 'fat') => {
    // Simple conversion rates for now
    const rates = {
      grains: { energy: 1, fat: 1 },
      berries: { energy: 2, fat: 2 },
      salmon: { energy: 1, fat: 4 },
      honey: { energy: 4, fat: 3 },
      bearMeat: { energy: 6, fat: 8 }
    }
    const amount = rates[resourceType as keyof typeof rates]?.[convertTo] || 1
    return `${amount} ${convertTo}`
  }
  
  if (!player || String(player.id) === 'bears') return null

  const handleEatResource = async (pieceId: string, resourceType: 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat', amount: number, playerId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'eat') return
    
    try {
      await gameActions.eatResource(pieceId, resourceType, amount, playerId)
    } catch (error) {
      console.error('Failed to eat resource:', error)
    }
  }

  const handleHibernate = async (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'hibernation') return
    
    // TODO: Add hibernation action when implemented
    console.log('Hibernate piece:', pieceId)
  }

  const handlePayEnergyTax = async (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'movement') return
    
    try {
      await gameActions.payEnergyTax(pieceId, String(player.id))
    } catch (error) {
      console.error('Failed to pay energy tax:', error)
    }
  }

  const handleConvertFat = async (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'movement') return
    
    // TODO: Add fat conversion action when implemented
    console.log('Convert fat for piece:', pieceId)
  }

  const handleDeath = async (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'movement') return
    
    // TODO: Add death action when implemented
    console.log('Death for piece:', pieceId)
  }


  const handleAdvancePhase = async () => {
    if (!isCurrentPlayer) return
    
    try {
      await gameActions.advancePhase()
    } catch (error) {
      console.error('Failed to advance phase:', error)
    }
  }

  const handleAdvanceTurn = async () => {
    if (!isCurrentPlayer) return
    
    try {
      await gameActions.advanceTurn()
    } catch (error) {
      console.error('Failed to advance turn:', error)
    }
  }

  const handleHarvest = async (pieceId: string) => {
    if (!isCurrentPlayer || turnPhase !== 'harvest') return
    
    try {
      await gameActions.harvest(pieceId, String(player.id))
    } catch (error) {
      console.error('Failed to harvest:', error)
    }
  }

  // Check if all bears are hibernating (only if there are actual pieces)
  const allBearsHibernating = player.pieces.length > 0 && player.pieces.every(piece => piece.isHibernating)

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
              <span>🐻 {player.pieceCount?.bears || 0}/{player.pieceCount?.maxBears || 3}</span>
              <span>🐼 {player.pieceCount?.cubs || 0}/{player.pieceCount?.maxCubs || 6}</span>
              <span>Score: {player.score}</span>
            </div>
          </div>
          {isCurrentPlayer && (
            <Badge variant="default">Current Turn</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>

        {/* Setup Phase Display */}
        {gameState.gamePhase === 'setup' && (
          <div className="mb-2">
            <div className="text-center space-y-2">
              <div className="font-medium text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded">
                🎯 Setup Phase
              </div>
              <p className="text-sm text-gray-600">
                Waiting for board setup to complete...
              </p>
              {isMultiplayer && playerNumber !== 1 && (
                <p className="text-xs text-gray-500">
                  Player 1 controls dice and board setup
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bear Placement Phase Display */}
        {gameState.gamePhase === 'bear_placement' && gameState.bearPlacementState && (
          <div className="mb-2">
            <div className="text-center space-y-2">
              <div className="font-medium text-sm bg-orange-100 text-orange-800 px-3 py-2 rounded">
                🐻 Bear Placement Phase
              </div>
              {(() => {
                const { currentPlayerIndex } = gameState.bearPlacementState
                const currentBearPlacementPlayer = gameState.players[currentPlayerIndex]
                const isMyBearPlacementTurn = isMultiplayer 
                  ? Boolean(currentBearPlacementPlayer && String(currentBearPlacementPlayer.id) === String(playerNumber))
                  : Boolean(currentBearPlacementPlayer && String(currentBearPlacementPlayer.id) === playerId)
                
                if (isMyBearPlacementTurn && isMyCard) {
                  return (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-700">
                        Your turn to place a bear!
                      </p>
                      <Button
                        onClick={async () => {
                          try {
                            // The button just provides instructions - actual placement happens by clicking the board
                            console.log('Bear placement activated - click an empty space on the board')
                          } catch (error) {
                            console.error('Bear placement error:', error)
                          }
                        }}
                        variant="default"
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        🐻 Click Empty Board Space to Place Bear
                      </Button>
                      <p className="text-xs text-gray-600">
                        Choose your starting position carefully!
                      </p>
                    </div>
                  )
                } else {
                  return (
                    <p className="text-sm text-gray-600">
                      Waiting for {currentBearPlacementPlayer?.name} to place their bear...
                    </p>
                  )
                }
              })()}
            </div>
          </div>
        )}

        {/* Current Turn Phase Display */}
        {gameState.gamePhase === 'playing' && !allBearsHibernating && isCurrentPlayer && (
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">Turn Phase: 
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {turnPhase.charAt(0).toUpperCase() + turnPhase.slice(1)}
                </span>
              </div>
              <div className="flex gap-1">
                {/* Phase advancement button */}
                {turnPhase !== 'hibernation' && (
                  <Button
                    onClick={handleAdvancePhase}
                    variant="outline"
                    size="sm"
                    className="text-xs border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    Next Phase →
                  </Button>
                )}
                {/* Turn completion button - only show after hibernation phase or when all actions complete */}
                {turnPhase === 'hibernation' && (
                  <Button
                    onClick={handleAdvanceTurn}
                    variant="default"
                    size="sm"
                    className="text-xs bg-green-500 hover:bg-green-600 text-white"
                  >
                    ✓ End Turn
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bear Cards - only show during playing phase */}
        {gameState.gamePhase === 'playing' && (
          <>
        {/* Bear Cards */}
        <div className="mt-1">
          <div className="font-medium text-sm mb-1">Bears:</div>
          {player.pieces.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-4">
              🐻 0/5 bears placed. Use placement actions to add your first bear to the board.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {player.pieces.map((piece, index) => {
                const isEmpty = false // We only show actual pieces now
              
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
                          <span className="text-xs">{isEmpty ? 0 : piece.resources?.grains || 0}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && (piece.resources?.grains || 0) > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'grains', 1, String(player.id))}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title={getConversionTooltip('grains', 'energy')}
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'grains', 1, String(player.id))}
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
                          <span className="text-xs">{isEmpty ? 0 : piece.resources?.berries || 0}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && (piece.resources?.berries || 0) > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'berries', 1, String(player.id))}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="2 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'berries', 1, String(player.id))}
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
                          <span className="text-xs">{isEmpty ? 0 : piece.resources?.salmon || 0}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && (piece.resources?.salmon || 0) > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'salmon', 1, String(player.id))}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="1 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'salmon', 1, String(player.id))}
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
                          <span className="text-xs">{isEmpty ? 0 : piece.resources?.honey || 0}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && (piece.resources?.honey || 0) > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'honey', 1, String(player.id))}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="4 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'honey', 1, String(player.id))}
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
                          <span className="text-xs">{isEmpty ? 0 : piece.resources?.bearMeat || 0}</span>
                        </div>
                        {isCurrentPlayer && turnPhase === 'eat' && !isEmpty && piece && (piece.resources?.bearMeat || 0) > 0 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <button
                              onClick={() => handleEatResource(piece.id, 'bearMeat', 1, String(player.id))}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 rounded px-1 py-0.5"
                              title="6 energy"
                            >
                              ⚡
                            </button>
                            <button
                              onClick={() => handleEatResource(piece.id, 'bearMeat', 1, String(player.id))}
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
                          ⚡{isEmpty ? 0 : piece.energy || 0}
                        </div>
                        {isCurrentPlayer && turnPhase === 'movement' && !isEmpty && piece && !energyTaxPaid && (
                          <div className="mt-0.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-6"
                              onClick={() => handlePayEnergyTax(piece.id)}
                              title="Pay energy tax"
                            >
                              💰 Tax
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="border rounded p-0.5 bg-orange-50">
                        <div className="text-xs text-center">Fat</div>
                        <div className="text-xs text-center">
                          🟫{isEmpty ? 0 : piece.fat || 0}
                        </div>
                        {isCurrentPlayer && turnPhase === 'movement' && !isEmpty && piece && (
                          <div className="mt-0.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-6"
                              onClick={() => handleConvertFat(piece.id)}
                              disabled={(piece.fat || 0) < 2}
                              title="Convert 2 fat to 1 energy"
                            >
                              🔄 Convert
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Harvest button during harvest phase */}
                  {isCurrentPlayer && turnPhase === 'harvest' && !isEmpty && piece && (() => {
                    const space = Object.values(board.spaces).find(s => s.piece?.id === piece.id)
                    const isSpaceBarren = space && player.barrenSpaces && player.barrenSpaces.includes(space.id)
                    const canHarvest = space && space.canProduce && season !== 'Winter' && !piece.harvestedThisTurn && !isSpaceBarren
                    const isOnMountains = space?.quadrant === 'Mountains'
                    
                    if (canHarvest) {
                      return (
                        <div className="mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-6 bg-green-50 hover:bg-green-100 border-green-300"
                            onClick={() => handleHarvest(piece.id)}
                            title={`Harvest ${space.quadrant} resources`}
                          >
                            🌾 Harvest
                          </Button>
                        </div>
                      )
                    }
                    
                    if (isOnMountains) {
                      return (
                        <div className="mt-1 text-center text-xs text-gray-500">
                          🏔️ No harvest in Mountains
                        </div>
                      )
                    }
                    
                    if (season === 'Winter') {
                      return (
                        <div className="mt-1 text-center text-xs text-blue-600">
                          ❄️ No harvest in Winter
                        </div>
                      )
                    }
                    
                    if (piece.harvestedThisTurn) {
                      return (
                        <div className="mt-1 text-center text-xs text-green-600">
                          ✅ Already harvested this turn
                        </div>
                      )
                    }
                    
                    if (isSpaceBarren) {
                      return (
                        <div className="mt-1 text-center text-xs text-orange-600">
                          🚫 Space depleted - replenishing
                        </div>
                      )
                    }
                    
                    return null
                  })()}
                  
                  {/* Hibernation option during hibernation phase */}
                  {isCurrentPlayer && turnPhase === 'hibernation' && !isEmpty && piece && (() => {
                    const space = Object.values(board.spaces).find(s => s.piece?.id === piece.id)
                    const isInMountains = space?.quadrant === 'Mountains'
                    const isAlreadyHibernating = piece.isHibernating
                    
                    if (isInMountains && !isAlreadyHibernating) {
                      const hibernationCost = 3 // Default hibernation cost
                      const hasEnoughFat = (piece.fat || 0) >= hibernationCost
                      return (
                        <div className="mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-6"
                            onClick={() => handleHibernate(piece.id)}
                            disabled={!hasEnoughFat}
                            title={hasEnoughFat ? `Hibernate (costs ${hibernationCost} fat)` : `Need ${hibernationCost} fat (have ${piece.fat || 0})`}
                          >
                            💤 Hibernate {hasEnoughFat ? '' : `(${piece.fat || 0}/${hibernationCost})`}
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
          )}
        </div>
          </>
        )}

        {/* Simple bear count during setup and bear placement */}
        {(gameState.gamePhase === 'setup' || gameState.gamePhase === 'bear_placement') && (
          <div className="mt-1">
            <div className="font-medium text-sm mb-1">Bears:</div>
            <div className="text-center text-sm text-gray-500 py-2">
              🐻 {player.pieces.length}/{player.pieceCount?.maxBears || 5} bears placed
            </div>
          </div>
        )}

        {/* Hibernation-only interface */}
        {gameState.gamePhase === 'playing' && allBearsHibernating && isCurrentPlayer && (
          <div className="space-y-3">
            <div className="text-center text-sm text-blue-600 font-medium">
              💤 All Bears Hibernating 💤
            </div>
            <div className="text-center text-xs text-gray-600">
              Bears will wake up in Spring
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleAdvanceTurn}
                variant="default"
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                ✓ Complete Turn
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}