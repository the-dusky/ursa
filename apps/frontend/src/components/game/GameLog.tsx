/**
 * GameLog Component - Updated for new architecture
 */

'use client'

import { useStateCoordinator } from '@/state/StateCoordinator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GameLog() {
  const { gameState } = useStateCoordinator()

  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle className="text-sm">📜 Game Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-gray-600 space-y-1 h-64 overflow-y-auto">
          <p>Game started with {gameState.players.length} players</p>
          <p>Current season: {gameState.season}</p>
          <p>Turn: {gameState.turn}</p>
          <p>Phase: {gameState.turnPhase}</p>
          <p>Energy tax: {gameState.energyTaxPaid ? 'Paid' : 'Not paid'}</p>
          {/* TODO: Add proper action logging */}
        </div>
      </CardContent>
    </Card>
  )
}