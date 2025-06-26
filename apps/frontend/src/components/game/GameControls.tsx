'use client'

import { useGameStore } from '@/store/gameStore'
import { useSelectionState, useModalState } from '@/store/uiStore'
import { useUIInteractions } from '@/store/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GameControls() {
  // Game state
  const { 
    resetGame, 
    initializeGame,
    currentPlayerIndex, 
    players, 
    season,
    gamePhase,
    board
  } = useGameStore()
  
  // UI state
  const { selectedSpaceId, clearSelections } = useSelectionState()
  const { toggleRules } = useModalState()
  
  // UI actions
  const { onAdvanceTurn } = useUIInteractions()

  const currentPlayer = players[currentPlayerIndex]
  const selectedSpace = selectedSpaceId ? board.spaces[selectedSpaceId] : null
  const selectedPiece = selectedSpace?.piece
  const canMoveSelectedPiece = selectedPiece && selectedPiece.playerId === currentPlayer?.id
  

  // Simplified - these actions are now handled through the new architecture
  const handleHighlightMoves = () => {
    console.log("highlight moves - handled by UI actions")
  }

  const handlePlaceBear = () => {
    console.log("place bear - not implemented in new architecture yet")
  }

  const handlePlaceCub = () => {
    console.log("place cub - not implemented in new architecture yet")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p><strong>Current Player:</strong> {currentPlayer?.name}</p>
          <p><strong>Season:</strong> {season}</p>
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
                  <p>Location: {selectedSpace.quadrant}</p>
                  {selectedSpace.subArea && <p>Area: {selectedSpace.subArea}</p>}
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
                
                {currentPlayer && gamePhase === 'playing' && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={handlePlaceBear} 
                      variant="outline" 
                      size="sm"
                      disabled={currentPlayer.pieceCount.bears >= currentPlayer.pieceCount.maxBears}
                    >
                      🐻 Place Bear ({currentPlayer.pieceCount.bears}/{currentPlayer.pieceCount.maxBears})
                    </Button>
                    <Button 
                      onClick={handlePlaceCub} 
                      variant="outline" 
                      size="sm"
                      disabled={currentPlayer.pieceCount.cubs >= currentPlayer.pieceCount.maxCubs}
                    >
                      🐼 Place Cub ({currentPlayer.pieceCount.cubs}/{currentPlayer.pieceCount.maxCubs})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {gamePhase === 'setup' && (
            <Button onClick={initializeGame} variant="default">
              Start Game
            </Button>
          )}
          {gamePhase === 'playing' && (
            <>
              <Button onClick={onAdvanceTurn} variant="outline">
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
          <Button onClick={resetGame} variant="destructive">
            Reset Game
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