/**
 * Rules Reference Card - Clear visual guide with board game style icons and formulas
 * All values are pulled from the game config for consistency with God Mode changes
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfigStore } from '@/state/ConfigStore'

export function RulesReferenceCard() {
  const { config } = useConfigStore()
  const { energy, energyTax, movement, resourceConversion, harvestTable } = config

  // Helper to format harvest display
  const formatHarvest = (value: number, resource: string) => {
    if (value === 0) return null
    return `${value} ${resource}`
  }

  // Get season icon
  const seasonIcon = (season: string) => {
    switch (season) {
      case 'Spring': return '🌸'
      case 'Summer': return '☀️'
      case 'Autumn': return '🍂'
      case 'Winter': return '❄️'
      default: return ''
    }
  }

  // Get season colors
  const seasonColors = (season: string) => {
    switch (season) {
      case 'Spring': return { bg: 'bg-green-50 dark:bg-green-900', border: 'border-green-400', text: 'text-green-700 dark:text-green-300' }
      case 'Summer': return { bg: 'bg-yellow-50 dark:bg-yellow-900', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300' }
      case 'Autumn': return { bg: 'bg-orange-50 dark:bg-orange-900', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300' }
      case 'Winter': return { bg: 'bg-blue-50 dark:bg-blue-900', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' }
      default: return { bg: '', border: '', text: '' }
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-bold border-b pb-2">
          📋 Rules Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Movement Costs - Now by Season */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🚶 Movement Costs</h3>
          <div className="text-xs bg-slate-50 dark:bg-slate-700 p-2 rounded">
            <p className="text-xs text-gray-500 mb-2">Energy cost per move (by fat level)</p>

            {/* Header */}
            <div className="grid grid-cols-4 gap-1 mb-1 font-medium text-center border-b pb-1">
              <div></div>
              <div>≤{movement.fatThresholds.low}</div>
              <div>{movement.fatThresholds.low + 1}-{movement.fatThresholds.medium}</div>
              <div>{movement.fatThresholds.medium + 1}+</div>
            </div>

            {/* Season rows */}
            {(['Spring', 'Summer', 'Autumn', 'Winter'] as const).map((season) => (
              <div key={season} className="grid grid-cols-4 gap-1 items-center py-0.5">
                <div>{seasonIcon(season)} {season}</div>
                <div className="text-center font-mono">⚡{movement.bySeason[season].lowFat}</div>
                <div className="text-center font-mono">⚡{movement.bySeason[season].mediumFat}</div>
                <div className="text-center font-mono">⚡{movement.bySeason[season].highFat}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Harvest */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-green-700 dark:text-green-400">🌱 Seasonal Harvest</h3>
          <div className="text-xs space-y-2">

            {(['Spring', 'Summer', 'Autumn', 'Winter'] as const).map((season) => {
              const colors = seasonColors(season)
              const harvest = harvestTable[season]
              const isWinter = season === 'Winter'

              return (
                <div key={season} className={`${colors.bg} p-2 rounded border-l-2 ${colors.border}`}>
                  <div className={`font-semibold ${colors.text} mb-1`}>{seasonIcon(season)} {season}</div>
                  <div className="space-y-1">
                    {isWinter ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span>All Biomes:</span>
                          <span className="font-mono text-red-600">No harvest</span>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          • Bears must survive on stored fat
                          • Only hibernating bears survive winter
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span>🌾 Pastures:</span>
                          <span className="font-mono">{harvest.Pastures.grains > 0 ? `${harvest.Pastures.grains} grains` : <span className="text-red-600">No harvest</span>}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🌲 Forests:</span>
                          <span className="font-mono">{harvest.Forests.berries > 0 ? `${harvest.Forests.berries} berries` : <span className="text-red-600">No harvest</span>}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🏞️ Riverlands:</span>
                          <span className="font-mono">{harvest.Riverlands.salmon > 0 ? `${harvest.Riverlands.salmon} salmon` : <span className="text-red-600">No harvest</span>}</span>
                        </div>
                        {('honeyBonus' in harvest.Forests && harvest.Forests.honeyBonus && harvest.Forests.honeyBonus > 0) && (
                          <div className="flex items-center justify-between">
                            <span>🍯 Honey Spaces:</span>
                            <span className="font-mono">{harvest.Forests.honeyBonus} honey</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>⛰️ Mountains:</span>
                          <span className="font-mono text-red-600">No harvest</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Harvest Requirements */}
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">📋 Harvest Requirements</div>
              <div className="space-y-1">
                <div>• Bear must be on biome space</div>
                <div>• Only during Harvest phase</div>
                <div>• Only one harvest per bear per turn</div>
                <div>• Space must not be depleted</div>
                <div>• Resources go to bear&apos;s inventory</div>
              </div>
            </div>

            {/* Space Depletion */}
            <div className="bg-orange-50 dark:bg-orange-900 p-2 rounded border border-orange-300">
              <div className="font-semibold text-orange-700 dark:text-orange-300 mb-1">🚫 Space Depletion</div>
              <div className="space-y-1">
                <div>• Harvested spaces become depleted for that player</div>
                <div>• At turn end: previous barren spaces clear</div>
                <div>• At turn end: this turn&apos;s harvests become barren</div>
                <div>• Barren spaces replenish when player&apos;s next turn starts</div>
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
              <span className="font-mono">⚡{energy.hibernationResetEnergy} energy, 🟡0 fat</span>
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
              <span className="font-mono">1 → ⚡{resourceConversion.grains.energy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🫐 Berries:</span>
              <span className="font-mono">1 → ⚡{resourceConversion.berries.energy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🐟 Salmon:</span>
              <span className="font-mono">1 → ⚡{resourceConversion.salmon.energy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🍯 Honey:</span>
              <span className="font-mono">1 → ⚡{resourceConversion.honey.energy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🥩 Bear Meat:</span>
              <span className="font-mono">1 → ⚡{resourceConversion.bearMeat.energy}</span>
            </div>

            <div className="font-medium mt-2 mb-1">To Fat:</div>
            <div className="flex items-center justify-between">
              <span>🌾 Grains:</span>
              <span className="font-mono">1 → 🟡{resourceConversion.grains.fat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🫐 Berries:</span>
              <span className="font-mono">1 → 🟡{resourceConversion.berries.fat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🐟 Salmon:</span>
              <span className="font-mono">1 → 🟡{resourceConversion.salmon.fat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🍯 Honey:</span>
              <span className="font-mono">1 → 🟡{resourceConversion.honey.fat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🥩 Bear Meat:</span>
              <span className="font-mono">1 → 🟡{resourceConversion.bearMeat.fat}</span>
            </div>
          </div>
        </div>

        {/* Honey & Fighting */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🍯 Honey & 🥊 Fighting</h3>
          <div className="text-xs bg-amber-50 dark:bg-amber-900 p-2 rounded border-l-2 border-amber-400">
            <div className="mb-2">
              <div className="font-medium mb-1">🍯 Honey:</div>
              <div>• Only in {config.board.honeySpaces} random 🌲 Forest spaces</div>
              <div>• Best energy food (1→⚡{resourceConversion.honey.energy})</div>
            </div>
            <div>
              <div className="font-medium mb-1">🥊 Fighting:</div>
              <div>• Bears on same space can fight</div>
              <div>• Strength = fat + energy + emergency</div>
              <div>• Winner gets 🥩 bear meat</div>
              <div>• Bear meat = best fat food (1→🟡{resourceConversion.bearMeat.fat})</div>
            </div>
          </div>
        </div>

        {/* Energy Cap */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">⚡ Energy Limit</h3>
          <div className="text-xs bg-yellow-50 dark:bg-yellow-900 p-2 rounded border-l-2 border-yellow-400">
            <div className="flex items-center justify-between">
              <span>Maximum energy:</span>
              <span className="font-mono text-yellow-700">⚡{energy.maxEnergy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Maximum fat:</span>
              <span className="font-mono text-yellow-700">🟡{energy.maxFat}</span>
            </div>
          </div>
        </div>

        {/* Energy Tax */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">💸 Energy Tax (Per Turn)</h3>
          <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-700 p-2 rounded">
            <div className="flex items-center justify-between">
              <span>🌸 Spring:</span>
              <span className="font-mono">-⚡{energyTax.bySeason.Spring}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>☀️ Summer:</span>
              <span className="font-mono">-⚡{energyTax.bySeason.Summer}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🍂 Autumn:</span>
              <span className="font-mono">-⚡{energyTax.bySeason.Autumn}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>❄️ Winter (Mountains):</span>
              <span className="font-mono text-blue-600">-⚡{energyTax.bySeason.Winter.mountains}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>❄️ Winter (Outside):</span>
              <span className="font-mono text-red-600">-⚡{energyTax.bySeason.Winter.outside}</span>
            </div>
          </div>
        </div>

        {/* Fat to Emergency Energy */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🔥 Emergency Energy</h3>
          <div className="text-xs bg-orange-50 dark:bg-orange-900 p-2 rounded border-l-2 border-orange-400">
            <div className="flex items-center justify-between mb-1">
              <span>Conversion:</span>
              <span className="font-mono">🟡{energy.fatToEnergyRatio} fat → ⚡1 energy</span>
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
              <div>• Max energy = ⚡{energy.maxEnergy}</div>
              <div>• Summer tax costs ⚡{energyTax.bySeason.Summer} (highest non-winter)!</div>
              <div>• Winter movement costs ⚡{movement.bySeason.Winter.lowFat}-{movement.bySeason.Winter.highFat}!</div>
              <div>• Hibernation = only winter survival</div>
              <div>• Stay lean until autumn rush</div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
