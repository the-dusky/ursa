'use client'

import { useStateCoordinator } from '@/state/StateCoordinator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBearPlacement } from '@/hooks/useBearPlacement'

export function BearPlacement() {
  const { gameState } = useStateCoordinator()
  const {
    selectedSpaceId,
    isMyTurn,
    currentPlayer,
    handleConfirmPlacement,
    handleCancelSelection,
    isInBearPlacementPhase
  } = useBearPlacement()
  
  if (!isInBearPlacementPhase || !gameState.bearPlacementState) {
    return null
  }
  
  const { playersRemaining } = gameState.bearPlacementState
  
  // Get available spaces (not occupied)
  const availableSpaces = Object.values(gameState.board.spaces).filter(space => !space.piece)
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🐻 Bear Placement Phase</span>
          <Badge variant="outline">
            {playersRemaining.length} player{playersRemaining.length !== 1 ? 's' : ''} remaining
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium">
              {isMyTurn 
                ? `Your turn to place a bear, ${currentPlayer?.name}!`
                : `Waiting for ${currentPlayer?.name} to place their bear...`
              }
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Players place bears in order: {gameState.players.map(p => p.name).join(' → ')}
            </p>
          </div>
          
          {isMyTurn && !selectedSpaceId && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium mb-2">Instructions:</h4>
              <ul className="text-sm space-y-1">
                <li>• Click on any empty space on the board to select it</li>
                <li>• Then click "Confirm Placement" to place your bear</li>
                <li>• Choose your starting position carefully - it affects your strategy!</li>
                <li>• Available spaces: {availableSpaces.length}</li>
              </ul>
            </div>
          )}
          
          {isMyTurn && selectedSpaceId && (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <h4 className="font-medium mb-3 text-green-800">Selected Space: {selectedSpaceId}</h4>
              <p className="text-sm text-green-700 mb-4">
                Ready to place your bear here? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleConfirmPlacement}
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  ✅ Confirm Placement
                </Button>
                <Button 
                  onClick={handleCancelSelection}
                  variant="outline"
                  className="px-6"
                >
                  ❌ Cancel
                </Button>
              </div>
            </div>
          )}
          
          {!isMyTurn && isMultiplayer && (
            <div className="text-center text-gray-600">
              <p>Wait for your turn to place your bear.</p>
              <p className="text-xs mt-1">
                Multiplayer: Only the current player can place bears
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}