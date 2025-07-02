/**
 * RulesDialog Component - Updated for new architecture
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function RulesDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="fixed bottom-4 right-4">
          📋 Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🐻 Seasonal Bear Game Rules</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold">Objective</h3>
            <p>Guide your bears through the seasons, gathering resources and surviving winter hibernation.</p>
          </div>
          <div>
            <h3 className="font-semibold">Game Flow</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Movement Phase: Move your bears around the board</li>
              <li>Harvest Phase: Gather resources from spaces</li>
              <li>Eat Phase: Convert resources to energy and fat</li>
              <li>Hibernation Phase: Survive winter using stored fat</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Board Layout</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>⛰️ Mountains: Caves and hunting grounds</li>
              <li>🌾 Pastures: Grain production</li>
              <li>🌲 Forests: Berries and honey</li>
              <li>🏞️ Riverlands: Salmon fishing</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}