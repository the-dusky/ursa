/**
 * ResourcePanel Component - Simplified for new architecture
 */

'use client'

import { CoreGameState } from '@/state/CoreGameState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ResourcePanelProps {
  gameState: CoreGameState
}

export function ResourcePanel({ gameState }: ResourcePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-gray-600">
          Season: {gameState.season}
        </div>
      </CardContent>
    </Card>
  )
}