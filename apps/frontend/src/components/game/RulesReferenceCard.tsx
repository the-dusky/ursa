/**
 * Rules Reference Card - Clear visual guide with board game style icons and formulas
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RulesReferenceCard() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-bold border-b pb-2">
          📋 Rules Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Movement Costs */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🚶 Movement Costs</h3>
          <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-700 p-2 rounded">
            <div className="flex items-center justify-between">
              <span>🐻 ≤5 fat:</span>
              <span className="font-mono">⚡1 energy</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🐻 6-15 fat:</span>
              <span className="font-mono">⚡2 energy</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🐻 16+ fat:</span>
              <span className="font-mono">⚡3 energy</span>
            </div>
          </div>
        </div>

        {/* Seasonal Harvest */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-green-700 dark:text-green-400">🌱 Seasonal Harvest</h3>
          <div className="text-xs space-y-2">
            
            {/* Spring */}
            <div className="bg-green-50 dark:bg-green-900 p-2 rounded border-l-2 border-green-400">
              <div className="font-semibold text-green-700 dark:text-green-300 mb-1">🌸 Spring</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>🌾 Pastures:</span>
                  <span className="font-mono">2 grains</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🌲 Forests:</span>
                  <span className="font-mono">1 berries</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🏞️ Riverlands:</span>
                  <span className="font-mono">1 salmon</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>⛰️ Mountains:</span>
                  <span className="font-mono text-red-600">No harvest</span>
                </div>
              </div>
            </div>

            {/* Summer */}
            <div className="bg-yellow-50 dark:bg-yellow-900 p-2 rounded border-l-2 border-yellow-400">
              <div className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">☀️ Summer</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>🌾 Pastures:</span>
                  <span className="font-mono">3 grains</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🌲 Forests:</span>
                  <span className="font-mono">2 berries</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🏞️ Riverlands:</span>
                  <span className="font-mono">3 salmon</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🍯 Honey Spaces:</span>
                  <span className="font-mono">1 honey</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>⛰️ Mountains:</span>
                  <span className="font-mono text-red-600">No harvest</span>
                </div>
              </div>
            </div>

            {/* Autumn */}
            <div className="bg-orange-50 dark:bg-orange-900 p-2 rounded border-l-2 border-orange-400">
              <div className="font-semibold text-orange-700 dark:text-orange-300 mb-1">🍂 Autumn</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>🌾 Pastures:</span>
                  <span className="font-mono">4 grains</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🌲 Forests:</span>
                  <span className="font-mono">3 berries</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🏞️ Riverlands:</span>
                  <span className="font-mono">2 salmon</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🍯 Honey Spaces:</span>
                  <span className="font-mono">2 honey</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>⛰️ Mountains:</span>
                  <span className="font-mono text-red-600">No harvest</span>
                </div>
              </div>
            </div>

            {/* Winter */}
            <div className="bg-blue-50 dark:bg-blue-900 p-2 rounded border-l-2 border-blue-400">
              <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">❄️ Winter</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>All Biomes:</span>
                  <span className="font-mono text-red-600">No harvest</span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  • Bears must survive on stored fat
                  • Only hibernating bears survive winter
                </div>
              </div>
            </div>

            {/* Harvest Requirements */}
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">📋 Harvest Requirements</div>
              <div className="space-y-1">
                <div>• Bear must be on biome space</div>
                <div>• Only during Harvest phase</div>
                <div>• Only one harvest per bear per turn</div>
                <div>• Space must not be depleted</div>
                <div>• Resources go to bear's inventory</div>
              </div>
            </div>
            
            {/* Space Depletion */}
            <div className="bg-orange-50 dark:bg-orange-900 p-2 rounded border border-orange-300">
              <div className="font-semibold text-orange-700 dark:text-orange-300 mb-1">🚫 Space Depletion</div>
              <div className="space-y-1">
                <div>• Harvested spaces become depleted for that player</div>
                <div>• At turn end: previous barren spaces clear</div>
                <div>• At turn end: this turn's harvests become barren</div>
                <div>• Barren spaces replenish when player's next turn starts</div>
                <div>• Each player tracks their own depleted spaces</div>
                <div>• Other players can harvest the same spaces</div>
                <div>• Forces strategic movement between spaces</div>
              </div>
            </div>

          </div>
        </div>

        {/* Hibernation */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">💤 Hibernation</h3>
          <div className="text-xs bg-slate-50 dark:bg-slate-700 p-2 rounded">
            <div className="flex items-center justify-between mb-1">
              <span>Required:</span>
              <span className="font-mono">🟡35 fat + 🏔️ Mountains</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span>Cost:</span>
              <span className="font-mono">🟡35 fat → 💤</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Reset to:</span>
              <span className="font-mono">⚡5 energy, 🟡0 fat</span>
            </div>
          </div>
        </div>

        {/* Food Conversion */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🍽️ Food Conversion</h3>
          <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-700 p-2 rounded">
            <div className="font-medium mb-1">To Energy:</div>
            <div className="flex items-center justify-between">
              <span>🌾 Grains:</span>
              <span className="font-mono">1 → ⚡1</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🫐 Berries:</span>
              <span className="font-mono">1 → ⚡2</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🐟 Salmon:</span>
              <span className="font-mono">1 → ⚡1</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🍯 Honey:</span>
              <span className="font-mono">1 → ⚡4</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🥩 Bear Meat:</span>
              <span className="font-mono">1 → ⚡6</span>
            </div>
            
            <div className="font-medium mt-2 mb-1">To Fat:</div>
            <div className="flex items-center justify-between">
              <span>🌾 Grains:</span>
              <span className="font-mono">1 → 🟡1</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🫐 Berries:</span>
              <span className="font-mono">1 → 🟡2</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🐟 Salmon:</span>
              <span className="font-mono">1 → 🟡4</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🍯 Honey:</span>
              <span className="font-mono">1 → 🟡3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🥩 Bear Meat:</span>
              <span className="font-mono">1 → 🟡8</span>
            </div>
          </div>
        </div>

        {/* Honey & Fighting */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🍯 Honey & 🥊 Fighting</h3>
          <div className="text-xs bg-amber-50 dark:bg-amber-900 p-2 rounded border-l-2 border-amber-400">
            <div className="mb-2">
              <div className="font-medium mb-1">🍯 Honey:</div>
              <div>• Only in 5 random 🌲 Forest spaces</div>
              <div>• Best energy food (1→⚡4)</div>
            </div>
            <div>
              <div className="font-medium mb-1">🥊 Fighting:</div>
              <div>• Bears on same space can fight</div>
              <div>• Strength = fat + energy + emergency</div>
              <div>• Winner gets 🥩 bear meat</div>
              <div>• Bear meat = best fat food (1→🟡8)</div>
            </div>
          </div>
        </div>

        {/* Energy Cap */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">⚡ Energy Limit</h3>
          <div className="text-xs bg-yellow-50 dark:bg-yellow-900 p-2 rounded border-l-2 border-yellow-400">
            <div className="flex items-center justify-between">
              <span>Maximum energy:</span>
              <span className="font-mono text-yellow-700">⚡20</span>
            </div>
          </div>
        </div>

        {/* Winter Survival */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">❄️ Winter (Per Day)</h3>
          <div className="text-xs space-y-1 bg-blue-50 dark:bg-blue-900 p-2 rounded border-l-2 border-blue-400">
            <div className="flex items-center justify-between">
              <span>All Biomes:</span>
              <span className="font-mono text-red-600">-⚡5 energy</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              • Only hibernating bears survive winter
            </div>
          </div>
        </div>

        {/* Fat to Emergency Energy */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🔥 Emergency Energy</h3>
          <div className="text-xs bg-orange-50 dark:bg-orange-900 p-2 rounded border-l-2 border-orange-400">
            <div className="flex items-center justify-between mb-1">
              <span>Conversion:</span>
              <span className="font-mono">🟡2 fat → ⚡1 energy</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span>When:</span>
              <span className="text-xs">Start of turn only</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Duration:</span>
              <span className="text-xs text-orange-600">Lost at turn end</span>
            </div>
          </div>
        </div>

        {/* Death Condition */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-red-700 dark:text-red-400">💀 Death</h3>
          <div className="text-xs bg-red-50 dark:bg-red-900 p-2 rounded border-l-2 border-red-400">
            <div className="flex items-center justify-between">
              <span>Occurs when:</span>
              <span className="font-mono text-red-600">⚡0 energy AND 🟡0 fat</span>
            </div>
          </div>
        </div>

        {/* Strategy Tip */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-amber-700 dark:text-amber-400">💡 Critical Strategy</h3>
          <div className="text-xs bg-amber-50 dark:bg-amber-900 p-2 rounded border-l-2 border-amber-400">
            <div className="space-y-1">
              <div>• Build 🟡35 fat in autumn</div>
              <div>• Reach 🏔️ Mountains before winter</div>
              <div>• Max energy = ⚡20</div>
              <div>• Winter movement = DEATH</div>
              <div>• Hibernation = only winter survival</div>
              <div>• Stay lean until autumn rush</div>
            </div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  )
}