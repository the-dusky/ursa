'use client'

import { useGameLog } from '@/store/uiStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GameLog() {
  const { gameLog } = useGameLog()

  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle>Game Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 overflow-y-auto h-64 text-sm">
          {gameLog.length === 0 ? (
            <p className="text-muted-foreground">No game events yet...</p>
          ) : (
            gameLog.map((entry: string, index: number) => (
              <div key={index} className="py-1 border-b border-gray-100 last:border-b-0">
                {entry}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}