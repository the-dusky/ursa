'use client'

import { useGameStore } from '@/store/gameStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RulesDialog() {
  const { showRules, toggleRules } = useGameStore()

  return (
    <Dialog open={showRules} onOpenChange={toggleRules}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seasonal Board Game Rules</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>A strategic board game about surviving and thriving through the seasons alongside bears in their natural habitat.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Board Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Mountains:</strong> Caves (safe) vs Hunting Grounds (risky)</li>
                <li><strong>Pastures:</strong> Produce grains</li>
                <li><strong>Forests:</strong> Produce berries</li>
                <li><strong>Riverlands:</strong> Produce salmon</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Mechanics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Spring:</strong> Grains 2, Berries 1, Salmon 3</li>
                <li><strong>Summer:</strong> Grains 3, Berries 3, Salmon 2</li>
                <li><strong>Autumn:</strong> Grains 3, Berries 2, Salmon 1</li>
                <li><strong>Winter:</strong> Grains 1, Berries 0, Salmon 1 + Bear survival</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Play</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Click on spaces to select them</li>
                <li>Use controls to advance seasons and turns</li>
                <li>Collect resources based on your territories</li>
                <li>Survive winter alongside the bears</li>
              </ol>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={toggleRules}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}