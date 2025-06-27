/**
 * Trading Dialog Component
 * 
 * Allows players to trade resources between adjacent pieces during movement phase
 */
'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGameStore, type GamePiece } from '@/store/gameStore'
import { useUIInteractions } from '@/store/actions'
import type { ResourceType } from '@/engine/types'

interface TradingDialogProps {
  isOpen: boolean
  onClose: () => void
  fromPiece: GamePiece | null
  toPiece: GamePiece | null
}

const RESOURCE_NAMES: Record<ResourceType, string> = {
  grains: 'Grains',
  berries: 'Berries', 
  salmon: 'Salmon',
  honey: 'Honey',
  bearMeat: 'Bear Meat'
}

const RESOURCE_EMOJIS: Record<ResourceType, string> = {
  grains: '🌾',
  berries: '🫐',
  salmon: '🐟',
  honey: '🍯',
  bearMeat: '🥩'
}

export function TradingDialog({ isOpen, onClose, fromPiece, toPiece }: TradingDialogProps) {
  const [fromResourceType, setFromResourceType] = useState<ResourceType>('grains')
  const [toResourceType, setToResourceType] = useState<ResourceType>('berries')
  const [fromAmount, setFromAmount] = useState<number>(1)
  const [toAmount, setToAmount] = useState<number>(1)
  const [isTrading, setIsTrading] = useState(false)

  const { currentPlayerIndex, players, turnPhase } = useGameStore()
  const { onTrade } = useUIInteractions()

  // Check if trading is allowed
  const canTrade = useMemo(() => {
    if (!fromPiece || !toPiece) return false
    if (turnPhase !== 'movement') return false
    
    // Check if one of the pieces belongs to current player
    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return false
    
    const ownsFromPiece = fromPiece.playerId === currentPlayer.id
    const ownsToPiece = toPiece.playerId === currentPlayer.id
    
    // Must own exactly one piece (can't trade with yourself, must own one piece to initiate)
    return (ownsFromPiece && !ownsToPiece) || (!ownsFromPiece && ownsToPiece)
  }, [fromPiece, toPiece, currentPlayerIndex, players, turnPhase])

  // Get available resources for each piece
  const fromPieceResources = useMemo(() => {
    if (!fromPiece) return []
    return Object.entries(fromPiece.resources)
      .filter(([, amount]) => amount > 0)
      .map(([resource, amount]) => ({ resource: resource as ResourceType, amount }))
  }, [fromPiece])

  const toPieceResources = useMemo(() => {
    if (!toPiece) return []
    return Object.entries(toPiece.resources)
      .filter(([, amount]) => amount > 0)
      .map(([resource, amount]) => ({ resource: resource as ResourceType, amount }))
  }, [toPiece])

  const handleTrade = async () => {
    if (!fromPiece || !toPiece || !canTrade) return

    setIsTrading(true)
    try {
      const success = onTrade(
        fromPiece.id, 
        toPiece.id, 
        fromResourceType, 
        toResourceType, 
        fromAmount, 
        toAmount
      )
      
      if (success) {
        onClose()
      } else {
        console.error('Trade failed - check game conditions')
      }
    } catch (error) {
      console.error('Trade failed:', error)
    } finally {
      setIsTrading(false)
    }
  }

  const handleClose = () => {
    setFromResourceType('grains')
    setToResourceType('berries')
    setFromAmount(1)
    setToAmount(1)
    onClose()
  }

  if (!fromPiece || !toPiece) return null

  const maxFromAmount = fromPiece.resources[fromResourceType] || 0
  const maxToAmount = toPiece.resources[toResourceType] || 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>🤝 Resource Trading</DialogTitle>
          <DialogDescription>
            Trade resources between adjacent bears during movement phase
          </DialogDescription>
        </DialogHeader>

        {!canTrade ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-slate-600 dark:text-slate-400">
                {turnPhase !== 'movement' ? (
                  <p>Trading is only allowed during the movement phase</p>
                ) : (
                  <p>You can only trade with pieces belonging to other players</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Piece Information */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">From: {fromPiece.id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fromPieceResources.map(({ resource, amount }) => (
                    <div key={resource} className="flex justify-between text-sm">
                      <span>{RESOURCE_EMOJIS[resource]} {RESOURCE_NAMES[resource]}</span>
                      <span className="font-mono">{amount}</span>
                    </div>
                  ))}
                  {fromPieceResources.length === 0 && (
                    <p className="text-sm text-slate-500">No resources</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">To: {toPiece.id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {toPieceResources.map(({ resource, amount }) => (
                    <div key={resource} className="flex justify-between text-sm">
                      <span>{RESOURCE_EMOJIS[resource]} {RESOURCE_NAMES[resource]}</span>
                      <span className="font-mono">{amount}</span>
                    </div>
                  ))}
                  {toPieceResources.length === 0 && (
                    <p className="text-sm text-slate-500">No resources</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Trade Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configure Trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* From Trade */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Give</label>
                    <Select value={fromResourceType} onValueChange={(value) => setFromResourceType(value as ResourceType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fromPieceResources.map(({ resource }) => (
                          <SelectItem key={resource} value={resource}>
                            {RESOURCE_EMOJIS[resource]} {RESOURCE_NAMES[resource]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      max={maxFromAmount}
                      value={fromAmount}
                      onChange={(e) => setFromAmount(parseInt(e.target.value) || 1)}
                      placeholder="Amount"
                    />
                    <p className="text-xs text-slate-500">
                      Max: {maxFromAmount}
                    </p>
                  </div>

                  {/* To Trade */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Receive</label>
                    <Select value={toResourceType} onValueChange={(value) => setToResourceType(value as ResourceType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {toPieceResources.map(({ resource }) => (
                          <SelectItem key={resource} value={resource}>
                            {RESOURCE_EMOJIS[resource]} {RESOURCE_NAMES[resource]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      max={maxToAmount}
                      value={toAmount}
                      onChange={(e) => setToAmount(parseInt(e.target.value) || 1)}
                      placeholder="Amount"
                    />
                    <p className="text-xs text-slate-500">
                      Max: {maxToAmount}
                    </p>
                  </div>
                </div>

                {/* Trade Summary */}
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Trade Summary:</strong> Give {fromAmount} {RESOURCE_EMOJIS[fromResourceType]} {RESOURCE_NAMES[fromResourceType]} 
                    {' '}→{' '} Receive {toAmount} {RESOURCE_EMOJIS[toResourceType]} {RESOURCE_NAMES[toResourceType]}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleTrade}
                    disabled={isTrading || fromAmount > maxFromAmount || toAmount > maxToAmount || fromAmount <= 0 || toAmount <= 0}
                    className="flex-1"
                  >
                    {isTrading ? 'Trading...' : 'Execute Trade'}
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}