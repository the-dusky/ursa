'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { rollDice, type DiceRoll } from '@/engine/utils/dice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface DiceTrayState {
  positionRolls: DiceRoll | null
  directionRolls: DiceRoll | null
  rotations: number[]
  isRolling: boolean
}

export function DiceTray() {
  const { updateBoardRotations } = useGameStore()
  const [diceState, setDiceState] = useState<DiceTrayState>({
    positionRolls: null,
    directionRolls: null,
    rotations: [],
    isRolling: false
  })

  const rollForBoardSetup = async () => {
    setDiceState(prev => ({ ...prev, isRolling: true }))
    
    // Simulate rolling animation delay
    setTimeout(() => {
      // Roll 1: Position dice (1-6 for each ring)
      const positionRolls = rollDice(5)
      
      // Small delay before second roll
      setTimeout(() => {
        // Roll 2: Direction dice (1-3 = negative, 4-6 = positive)
        const directionRolls = rollDice(5)
        
        // Convert to rotations (dice 1 = no rotation, 2-6 = 1-5 rotations)
        const rotations = positionRolls.dice.map((position, index) => {
          const direction = directionRolls.dice[index]
          const isPositive = direction >= 4 // 4,5,6 = positive (clockwise)
          const rotationAmount = position - 1 // Convert 1-6 dice to 0-5 rotations
          return isPositive ? rotationAmount : -rotationAmount
        })
        
        setDiceState({
          positionRolls,
          directionRolls: directionRolls,
          rotations,
          isRolling: false
        })
      }, 200)
    }, 300)
  }

  const applyToBoard = () => {
    if (diceState.rotations.length > 0) {
      // This will trigger board regeneration with new rotations
      // We need to update the gameStore to use these rotations
      updateBoardRotations(diceState.rotations)
    }
  }

  const resetToStandard = () => {
    setDiceState({
      positionRolls: null,
      directionRolls: null,
      rotations: [],
      isRolling: false
    })
    // Reset board to standard [0, 0, 0, 0, 0] configuration (no rotations)
    updateBoardRotations([0, 0, 0, 0, 0])
  }

  // Apply rotations to the board via the game store

  const getDieEmoji = (value: number) => {
    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    return diceEmojis[value] || '❓'
  }

  const getDirectionText = (value: number) => {
    return value >= 4 ? 'Clockwise ↻' : 'Counter ↺'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎲 Dice Tray
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={rollForBoardSetup}
            disabled={diceState.isRolling}
            className="flex-1"
          >
            {diceState.isRolling ? '🎲 Rolling...' : '🎲 Roll for Board'}
          </Button>
          <Button 
            onClick={resetToStandard}
            variant="outline"
            size="sm"
          >
            Reset
          </Button>
        </div>

        {/* Dice Results */}
        {diceState.isRolling && (
          <div className="text-center py-4">
            <div className="text-2xl animate-bounce">🎲🎲🎲🎲🎲</div>
            <p className="text-sm text-slate-600 mt-2">Rolling dice...</p>
          </div>
        )}

        {diceState.positionRolls && diceState.directionRolls && !diceState.isRolling && (
          <div className="space-y-3">
            {/* Position Roll */}
            <div className="border rounded-lg p-3 bg-slate-50">
              <h4 className="font-medium text-sm mb-2">Position Roll:</h4>
              <div className="flex gap-2 text-lg">
                {diceState.positionRolls.dice.map((die, index) => (
                  <span key={index} className="w-8 text-center">{getDieEmoji(die)}</span>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Values: [{diceState.positionRolls.dice.join(', ')}]
              </p>
            </div>

            {/* Direction Roll */}
            <div className="border rounded-lg p-3 bg-slate-50">
              <h4 className="font-medium text-sm mb-2">Direction Roll:</h4>
              <div className="flex gap-2 text-lg">
                {diceState.directionRolls.dice.map((die, index) => (
                  <span key={index} className="w-8 text-center">{getDieEmoji(die)}</span>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Values: [{diceState.directionRolls.dice.join(', ')}]
              </p>
            </div>

            {/* Calculated Rotations */}
            <div className="border rounded-lg p-3 bg-blue-50">
              <h4 className="font-medium text-sm mb-2">Ring Rotations:</h4>
              <div className="space-y-1 text-sm">
                {diceState.rotations.map((rotation, index) => (
                  <div key={index} className="flex justify-between">
                    <span>Ring {index + 1}:</span>
                    <span className="font-mono">
                      {rotation > 0 ? '+' : ''}{rotation} 
                      <span className="text-xs ml-1 text-slate-600">
                        ({getDirectionText(diceState.directionRolls!.dice[index])})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <Button 
              onClick={applyToBoard}
              className="w-full"
              variant="default"
            >
              📐 Apply to Board
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-slate-600 border-t pt-2">
          <p><strong>Board Setup:</strong></p>
          <p>• Position roll: 1=stay, 2-6=rotate 1-5 positions</p>
          <p>• Direction roll: 1-3=↺, 4-6=↻</p>
          <p>• Red line stays fixed, rings rotate around it</p>
        </div>
      </CardContent>
    </Card>
  )
}