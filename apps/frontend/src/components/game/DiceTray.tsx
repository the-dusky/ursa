'use client'

import { useStateCoordinator, useCoordinatedGameActions } from '@/state/StateCoordinator'
import { useMultiplayerStore } from '@/state/MultiplayerStore'
import { rollDice } from '@/engine/utils/dice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DiceTray() {
  const { gameState } = useStateCoordinator()
  const gameActions = useCoordinatedGameActions()
  const { isConnected: isMultiplayer, playerNumber } = useMultiplayerStore()

  const rollForBoardSetup = async () => {
    // In multiplayer, only Player 1 should actually roll dice
    // Other players will just show the rolling animation and wait for sync
    const shouldActuallyRoll = !isMultiplayer || playerNumber === 1
    
    if (shouldActuallyRoll) {
      try {
        // First roll position dice
        await gameActions.rollDice('position')
        
        // Small delay then roll direction dice
        setTimeout(async () => {
          try {
            await gameActions.rollDice('direction')
          } catch (error) {
            console.error('Failed to roll direction dice:', error)
          }
        }, 300)
        
      } catch (error) {
        console.error('Failed to roll position dice:', error)
      }
    }
  }

  const applyToBoard = async () => {
    if (gameState.diceState.rotations.length > 0) {
      // In multiplayer, only Player 1 should actually apply board changes
      // Other players will see the changes via Y.js sync
      const shouldActuallyApply = !isMultiplayer || playerNumber === 1
      
      if (shouldActuallyApply) {
        try {
          await gameActions.updateBoardRotations(gameState.diceState.rotations)
          // After applying rotations, start bear placement phase
          await gameActions.startBearPlacement()
        } catch (error) {
          console.error('Failed to apply board rotations:', error)
        }
      }
    }
  }

  const resetToStandard = async () => {
    // In multiplayer, only Player 1 should actually reset
    const shouldActuallyReset = !isMultiplayer || playerNumber === 1
    
    if (shouldActuallyReset) {
      try {
        await gameActions.resetDice()
      } catch (error) {
        console.error('Failed to reset dice:', error)
      }
    }
  }

  const getDieEmoji = (value: number) => {
    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    return diceEmojis[value] || '❓'
  }

  const getDirectionText = (value: number) => {
    return value >= 4 ? 'Clockwise ↻' : 'Counter ↺'
  }

  // Show Arena instead of dice during bear placement and playing phases  
  if (gameState.gamePhase === 'bear_placement' || gameState.gamePhase === 'playing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            ⚔️ Arena
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">🏟️</div>
          <p className="text-slate-600">Fighting Arena</p>
          <p className="text-sm text-slate-500 mt-2">
            Combat and special actions happen here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎲 Dice Tray
          {(gameState.gamePhase === 'dice_roll' || gameState.gamePhase === 'board_setup') && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {gameState.gamePhase === 'dice_roll' ? 'DICE ROLL' : 'BOARD SETUP'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Buttons - only show during dice and board setup phases */}
        {(gameState.gamePhase === 'dice_roll' || gameState.gamePhase === 'board_setup') && (
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={rollForBoardSetup}
              disabled={gameState.diceState.isRolling || (isMultiplayer && playerNumber !== 1) || gameState.gamePhase === 'board_setup'}
              className="flex-1"
            >
              {gameState.diceState.isRolling ? '🎲 Rolling...' : 
               gameState.gamePhase === 'board_setup' ? '🎲 Dice Rolled' :
               isMultiplayer && playerNumber !== 1 ? '🎲 Player 1 Rolls' : 
               '🎲 Roll for Board Setup'}
            </Button>
            {gameState.diceState.positionRolls && gameState.diceState.directionRolls && !gameState.diceState.isRolling && gameState.diceState.rotations.length > 0 && (
              <Button 
                onClick={applyToBoard}
                disabled={isMultiplayer && playerNumber !== 1}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Apply to Board & Start
              </Button>
            )}
            <Button 
              onClick={resetToStandard}
              variant="outline"
              size="sm"
              disabled={isMultiplayer && playerNumber !== 1}
            >
              Reset
            </Button>
          </div>
        )}
        
        {/* Show setup instructions during dice/board setup phases */}
        {(gameState.gamePhase === 'dice_roll' || gameState.gamePhase === 'board_setup') && (
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">
              🎯 {gameState.gamePhase === 'dice_roll' ? 'Dice Roll Phase' : 'Board Setup Phase'}
            </h4>
            <p className="text-sm text-blue-700">
              {gameState.gamePhase === 'dice_roll' && !gameState.diceState.positionRolls
                ? "First, roll dice to set up the board rotation"
                : gameState.gamePhase === 'dice_roll' && !gameState.diceState.directionRolls
                ? "Rolling direction dice..."
                : gameState.gamePhase === 'board_setup' && gameState.diceState.rotations.length > 0
                ? "Click 'Apply to Board & Start' to begin bear placement"
                : "Calculating board rotations..."
              }
            </p>
          </div>
        )}

        {/* Dice Results */}
        {gameState.diceState.isRolling && (
          <div className="text-center py-4">
            <div className="text-2xl animate-bounce">🎲🎲🎲🎲🎲</div>
            <p className="text-sm text-slate-600 mt-2">Rolling dice...</p>
          </div>
        )}

        {gameState.diceState.positionRolls && gameState.diceState.directionRolls && !gameState.diceState.isRolling && (
          <div className="space-y-3">
            {/* Position Roll */}
            <div className="border rounded-lg p-3 bg-slate-50">
              <h4 className="font-medium text-sm mb-2">Position Roll:</h4>
              <div className="flex gap-2 text-lg">
                {gameState.diceState.positionRolls.dice.map((die, index) => (
                  <span key={index} className="w-8 text-center">{getDieEmoji(die)}</span>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Values: [{gameState.diceState.positionRolls.dice.join(', ')}]
              </p>
            </div>

            {/* Direction Roll */}
            <div className="border rounded-lg p-3 bg-slate-50">
              <h4 className="font-medium text-sm mb-2">Direction Roll:</h4>
              <div className="flex gap-2 text-lg">
                {gameState.diceState.directionRolls.dice.map((die, index) => (
                  <span key={index} className="w-8 text-center">{getDieEmoji(die)}</span>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Values: [{gameState.diceState.directionRolls.dice.join(', ')}]
              </p>
            </div>

            {/* Calculated Rotations */}
            <div className="border rounded-lg p-3 bg-blue-50">
              <h4 className="font-medium text-sm mb-2">Ring Rotations:</h4>
              <div className="space-y-1 text-sm">
                {gameState.diceState.rotations.map((rotation, index) => (
                  <div key={index} className="flex justify-between">
                    <span>Ring {index + 1}:</span>
                    <span className="font-mono">
                      {rotation > 0 ? '+' : ''}{rotation} 
                      <span className="text-xs ml-1 text-slate-600">
                        ({gameState.diceState.directionRolls && getDirectionText(gameState.diceState.directionRolls.dice[index])})
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
              disabled={isMultiplayer && playerNumber !== 1}
            >
              {isMultiplayer && playerNumber !== 1 ? '📐 Player 1 Applies' : '📐 Apply to Board'}
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-slate-600 border-t pt-2">
          <p><strong>Board Setup:</strong></p>
          <p>• Position roll: 1=stay, 2-6=rotate 1-5 positions</p>
          <p>• Direction roll: 1-3=↺, 4-6=↻</p>
          <p>• Red line stays fixed, rings rotate around it</p>
          {isMultiplayer && (
            <p className="text-blue-600 font-medium mt-1">
              • Multiplayer: Player 1 controls dice and board setup
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}