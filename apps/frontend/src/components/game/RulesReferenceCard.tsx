/**
 * Rules Reference Card - Clear visual guide with board game style icons and formulas
 */
import React from 'react'
import { GAME_CONFIG } from '@/engine/GameConfig'

export const RulesReferenceCard: React.FC = () => {
  // Get movement costs from config for display
  const leanMoveCost = GAME_CONFIG.movement.baseCost(3) // Example with 3 fat (≤5)
  const heavyMoveCost = GAME_CONFIG.movement.baseCost(10) // Example with 10 fat (6-15)
  const veryHeavyMoveCost = GAME_CONFIG.movement.baseCost(20) // Example with 20 fat (16+)
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 space-y-4">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
        📋 Rules Reference
      </h2>

      {/* Movement Costs */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🚶 Movement Costs</h3>
        <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-700 p-2 rounded">
          <div className="flex items-center justify-between">
            <span>🐻 ≤5 fat:</span>
            <span className="font-mono">⚡{leanMoveCost} energy</span>
          </div>
          <div className="flex items-center justify-between">
            <span>🐻 6-15 fat:</span>
            <span className="font-mono">⚡{heavyMoveCost} energy</span>
          </div>
          <div className="flex items-center justify-between">
            <span>🐻 16+ fat:</span>
            <span className="font-mono">⚡{veryHeavyMoveCost} energy</span>
          </div>
        </div>
      </div>

      {/* Hibernation */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">💤 Hibernation</h3>
        <div className="text-xs bg-slate-50 dark:bg-slate-700 p-2 rounded">
          <div className="flex items-center justify-between mb-1">
            <span>Required:</span>
            <span className="font-mono">🟡{GAME_CONFIG.hibernation.fatCost} fat + 🏔️ Mountains</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span>Cost:</span>
            <span className="font-mono">🟡{GAME_CONFIG.hibernation.fatCost} fat → 💤</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Reset to:</span>
            <span className="font-mono">⚡{GAME_CONFIG.hibernation.energyReset} energy, 🟡0 fat</span>
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
            <span className="font-mono">1 → ⚡3</span>
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
            <span>🏔️ Mountains:</span>
            <span className="font-mono text-red-600">-⚡2 energy</span>
          </div>
          <div className="flex items-center justify-between">
            <span>🌲 Outside:</span>
            <span className="font-mono text-red-700">-⚡5 energy</span>
          </div>
        </div>
      </div>

      {/* Winter Movement */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">❄️ Winter Movement</h3>
        <div className="text-xs space-y-1 bg-red-50 dark:bg-red-900 p-2 rounded border-l-2 border-red-400">
          <div className="flex items-center justify-between">
            <span>🏔️ Mountains:</span>
            <span className="font-mono text-red-600">⚡2 energy</span>
          </div>
          <div className="flex items-center justify-between">
            <span>🌲 Outside:</span>
            <span className="font-mono text-red-700">⚡5 energy</span>
          </div>
          <div className="text-xs text-red-600 mt-1">
            ⚠️ Moving in winter is deadly!
          </div>
        </div>
      </div>

      {/* Other Seasons */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🌸🌞🍂 Other Seasons</h3>
        <div className="text-xs bg-green-50 dark:bg-green-900 p-2 rounded">
          <div className="flex items-center justify-between">
            <span>Energy loss:</span>
            <span className="font-mono text-green-600">-⚡1 energy</span>
          </div>
        </div>
      </div>

      {/* Fat to Emergency Energy */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🔥 Emergency Energy</h3>
        <div className="text-xs bg-orange-50 dark:bg-orange-900 p-2 rounded border-l-2 border-orange-400">
          <div className="flex items-center justify-between mb-1">
            <span>Conversion:</span>
            <span className="font-mono">🟡1 fat → ⚡2 energy</span>
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
    </div>
  )
}

export default RulesReferenceCard