'use client'

import { useState } from 'react'
import { useStateCoordinator, useCoordinatedGameActions } from '@/state/StateCoordinator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GameControls() {
  const { gameState } = useStateCoordinator()
  const gameActions = useCoordinatedGameActions()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const selectedSpace = selectedSpaceId ? gameState.board.spaces[selectedSpaceId] : null
  const selectedPiece = selectedSpace?.piece
  const canMoveSelectedPiece = selectedPiece && selectedPiece.playerId === currentPlayer?.id

  const clearSelections = () => {
    setSelectedSpaceId(null)
  }

  const handleAdvanceTurn = async () => {
    try {
      await gameActions.advanceTurn()
    } catch (error) {
      console.error('Failed to advance turn:', error)
    }
  }

  const handleResetGame = async () => {
    if (confirm('Are you sure you want to reset the game?')) {
      try {
        await gameActions.initializeGame(gameState.players.length)
      } catch (error) {
        console.error('Failed to reset game:', error)
      }
    }
  }

  const handleHighlightMoves = () => {
    console.log("highlight moves - to be implemented with new architecture")
  }

  const handlePlaceBear = () => {
    console.log("place bear - to be implemented with new architecture")
  }

  const handlePlaceCub = () => {
    console.log("place cub - to be implemented with new architecture")
  }

  const toggleRules = () => {
    console.log("toggle rules - to be implemented")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p><strong>Current Player:</strong> {currentPlayer?.name}</p>
          <p><strong>Season:</strong> {gameState.season}</p>
          <p><strong>Phase:</strong> {gameState.gamePhase}</p>
          {selectedSpace && (
            <p><strong>Selected:</strong> {selectedSpace.quadrant} (Ring {selectedSpace.ring})</p>
          )}
        </div>

        {/* Selected Space Actions */}
        {selectedSpace && (
          <div className="border rounded-lg p-3 bg-slate-50">
            {selectedPiece ? (
              <div>
                <h4 className="font-medium mb-2">Selected Piece</h4>
                <div className="text-sm space-y-1">
                  <p>Type: {selectedPiece.type === 'bear' ? '🐻 Adult Bear' : '🐼 Cub'}</p>
                  <p>Owner: Player {selectedPiece.playerId}</p>
                </div>
                
                {canMoveSelectedPiece && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={handleHighlightMoves} 
                      variant="outline" 
                      size="sm"
                    >
                      Show Valid Moves
                    </Button>
                    <Button 
                      onClick={clearSelections} 
                      variant="outline" 
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                
                {selectedPiece && selectedPiece.playerId !== currentPlayer?.id && (
                  <p className="text-xs text-red-600 mt-2">
                    Not your piece - can&apos;t move
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h4 className="font-medium mb-2">Empty Space</h4>
                <div className="text-sm space-y-1">
                  <p>Location: {selectedSpace.quadrant}</p>
                  {selectedSpace.subArea && <p>Area: {selectedSpace.subArea}</p>}
                  <p>Ring: {selectedSpace.ring}</p>
                </div>
                
                {currentPlayer && gameState.gamePhase === 'playing' && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={handlePlaceBear} 
                      variant="outline" 
                      size="sm"
                      disabled={currentPlayer.pieceCount.maxBears <= currentPlayer.pieces.filter(p => p.type === 'bear').length}
                    >
                      🐻 Place Bear
                    </Button>
                    <Button 
                      onClick={handlePlaceCub} 
                      variant="outline" 
                      size="sm"
                      disabled={currentPlayer.pieceCount.maxCubs <= currentPlayer.pieces.filter(p => p.type === 'cub').length}
                    >
                      🐼 Place Cub
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {gameState.gamePhase === 'setup' && (
            <Button onClick={() => gameActions.initializeGame(2)} variant="default">
              Start Game
            </Button>
          )}
          {gameState.gamePhase === 'playing' && (
            <>
              <Button onClick={handleAdvanceTurn} variant="outline">
                Next Turn
              </Button>
            </>
          )}
          <Button onClick={clearSelections} variant="outline">
            Clear Selection
          </Button>
          <Button onClick={toggleRules} variant="outline">
            Rules
          </Button>
          <Button onClick={handleResetGame} variant="destructive">
            New Game
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-600 border-t pt-2">
          <p><strong>How to play:</strong></p>
          <p>• Click empty spaces to place new bears/cubs</p>
          <p>• Click your pieces to move them</p>
          <p>• Each player can have max 5 🐻 bears and 3 🐼 cubs</p>
          <p>• Bears are stronger, cubs are more agile</p>
        </div>
      </CardContent>
    </Card>
  )
}