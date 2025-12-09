'use client'

import { useState } from 'react'
import { useConfigStore } from '@/state/ConfigStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ConfigSection = 'energy' | 'energyTax' | 'movement' | 'seasons' | 'resources' | 'harvest' | 'board' | 'players'

export function GodModePanel() {
  const {
    config,
    godModeEnabled,
    isDirty,
    toggleGodMode,
    updateEnergy,
    updateEnergyTax,
    updateMovement,
    updateSeasonalMovement,
    updateSeasons,
    updateResourceConversion,
    updateHarvestTable,
    updateBoard,
    updatePlayers,
    resetToDefaults,
    pushToConfigFile,
    exportConfig
  } = useConfigStore()

  const [activeSection, setActiveSection] = useState<ConfigSection>('energy')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  const handleSaveToFile = async () => {
    setSaveStatus('saving')
    const success = await pushToConfigFile()
    setSaveStatus(success ? 'success' : 'error')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleExport = () => {
    const configJson = JSON.stringify(exportConfig(), null, 2)
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'game-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const NumberInput = ({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1
  }: {
    label: string
    value: number
    onChange: (val: number) => void
    min?: number
    max?: number
    step?: number
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={!godModeEnabled}
        className="w-20 px-2 py-1 text-sm border rounded text-right disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  )

  const sections: { id: ConfigSection; label: string; icon: string }[] = [
    { id: 'energy', label: 'Energy', icon: '⚡' },
    { id: 'energyTax', label: 'Energy Tax', icon: '💸' },
    { id: 'movement', label: 'Movement', icon: '🚶' },
    { id: 'seasons', label: 'Seasons', icon: '🌸' },
    { id: 'resources', label: 'Resources', icon: '🍯' },
    { id: 'harvest', label: 'Harvest', icon: '🌾' },
    { id: 'board', label: 'Board', icon: '🎯' },
    { id: 'players', label: 'Players', icon: '🐻' }
  ]

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>🔧</span>
            <span>God Mode</span>
            {godModeEnabled && <Badge className="bg-red-500">ACTIVE</Badge>}
            {isDirty && <Badge variant="outline" className="text-orange-500 border-orange-500">Unsaved</Badge>}
          </CardTitle>
          <Button
            onClick={toggleGodMode}
            variant={godModeEnabled ? 'destructive' : 'default'}
            size="sm"
          >
            {godModeEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Section Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 pb-2 border-b">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(section.id)}
              className="text-xs"
            >
              {section.icon} {section.label}
            </Button>
          ))}
        </div>

        {/* Energy Section */}
        {activeSection === 'energy' && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Energy Settings</h3>
            <NumberInput
              label="Max Energy"
              value={config.energy.maxEnergy}
              onChange={(val) => updateEnergy({ maxEnergy: val })}
            />
            <NumberInput
              label="Max Fat"
              value={config.energy.maxFat}
              onChange={(val) => updateEnergy({ maxFat: val })}
              max={500}
            />
            <NumberInput
              label="Fat to Energy Ratio"
              value={config.energy.fatToEnergyRatio}
              onChange={(val) => updateEnergy({ fatToEnergyRatio: val })}
              min={1}
              max={10}
            />
            <NumberInput
              label="Starting Energy"
              value={config.energy.startingEnergy}
              onChange={(val) => updateEnergy({ startingEnergy: val })}
            />
            <NumberInput
              label="Hibernation Reset Energy"
              value={config.energy.hibernationResetEnergy}
              onChange={(val) => updateEnergy({ hibernationResetEnergy: val })}
            />
          </div>
        )}

        {/* Energy Tax Section */}
        {activeSection === 'energyTax' && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Energy Tax Settings (per turn)</h3>
            <p className="text-xs text-gray-500 mb-2">Energy cost at start of each turn by season</p>

            {/* Non-winter seasons */}
            <div className="border rounded p-2 mb-2">
              <NumberInput
                label="🌸 Spring"
                value={config.energyTax.bySeason.Spring}
                onChange={(val) => updateEnergyTax({ bySeason: { ...config.energyTax.bySeason, Spring: val } })}
                max={10}
              />
              <NumberInput
                label="☀️ Summer"
                value={config.energyTax.bySeason.Summer}
                onChange={(val) => updateEnergyTax({ bySeason: { ...config.energyTax.bySeason, Summer: val } })}
                max={10}
              />
              <NumberInput
                label="🍂 Autumn"
                value={config.energyTax.bySeason.Autumn}
                onChange={(val) => updateEnergyTax({ bySeason: { ...config.energyTax.bySeason, Autumn: val } })}
                max={10}
              />
            </div>

            {/* Winter (location-dependent) */}
            <div className="border rounded p-2 bg-blue-50 dark:bg-blue-900">
              <div className="font-medium text-sm mb-2">❄️ Winter (location-dependent)</div>
              <NumberInput
                label="🏔️ Mountains"
                value={config.energyTax.bySeason.Winter.mountains}
                onChange={(val) => updateEnergyTax({ bySeason: { ...config.energyTax.bySeason, Winter: { ...config.energyTax.bySeason.Winter, mountains: val } } })}
                max={20}
              />
              <NumberInput
                label="🌲 Outside Mountains"
                value={config.energyTax.bySeason.Winter.outside}
                onChange={(val) => updateEnergyTax({ bySeason: { ...config.energyTax.bySeason, Winter: { ...config.energyTax.bySeason.Winter, outside: val } } })}
                max={20}
              />
            </div>
          </div>
        )}

        {/* Movement Section */}
        {activeSection === 'movement' && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Movement Settings</h3>

            {/* Fat Thresholds */}
            <div className="border rounded p-2 mb-3">
              <p className="text-xs text-gray-500 mb-2">Fat thresholds determine which cost tier applies</p>
              <NumberInput
                label="Low Fat Threshold (≤)"
                value={config.movement.fatThresholds.low}
                onChange={(val) => updateMovement({ fatThresholds: { ...config.movement.fatThresholds, low: val } })}
                max={50}
              />
              <NumberInput
                label="Medium Fat Threshold (≤)"
                value={config.movement.fatThresholds.medium}
                onChange={(val) => updateMovement({ fatThresholds: { ...config.movement.fatThresholds, medium: val } })}
                max={50}
              />
            </div>

            {/* Movement Costs Grid by Season */}
            <div className="border rounded p-2">
              <p className="text-xs text-gray-500 mb-2">Movement costs by season and fat level (energy per move)</p>

              {/* Header Row */}
              <div className="grid grid-cols-4 gap-1 mb-2 text-xs font-medium text-center">
                <div></div>
                <div>Low Fat</div>
                <div>Med Fat</div>
                <div>High Fat</div>
              </div>

              {/* Season Rows */}
              {(['Spring', 'Summer', 'Autumn', 'Winter'] as const).map((season) => (
                <div key={season} className="grid grid-cols-4 gap-1 items-center mb-1">
                  <div className="text-sm font-medium">
                    {season === 'Spring' && '🌸'}
                    {season === 'Summer' && '☀️'}
                    {season === 'Autumn' && '🍂'}
                    {season === 'Winter' && '❄️'}
                    {' '}{season}
                  </div>
                  <input
                    type="number"
                    value={config.movement.bySeason[season].lowFat}
                    onChange={(e) => updateSeasonalMovement(season, { lowFat: Number(e.target.value) })}
                    min={0}
                    max={20}
                    disabled={!godModeEnabled}
                    className="w-full px-2 py-1 text-sm border rounded text-center disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <input
                    type="number"
                    value={config.movement.bySeason[season].mediumFat}
                    onChange={(e) => updateSeasonalMovement(season, { mediumFat: Number(e.target.value) })}
                    min={0}
                    max={20}
                    disabled={!godModeEnabled}
                    className="w-full px-2 py-1 text-sm border rounded text-center disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <input
                    type="number"
                    value={config.movement.bySeason[season].highFat}
                    onChange={(e) => updateSeasonalMovement(season, { highFat: Number(e.target.value) })}
                    min={0}
                    max={20}
                    disabled={!godModeEnabled}
                    className="w-full px-2 py-1 text-sm border rounded text-center disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seasons Section */}
        {activeSection === 'seasons' && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Season Settings</h3>
            <NumberInput
              label="Turns Per Season"
              value={config.seasons.turnsPerSeason}
              onChange={(val) => updateSeasons({ turnsPerSeason: val })}
              min={1}
              max={20}
            />
            <p className="text-xs text-gray-500 mt-2">Season order: {config.seasons.order.join(' → ')}</p>
          </div>
        )}

        {/* Resources Section */}
        {activeSection === 'resources' && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Resource Conversion Rates</h3>
            <p className="text-xs text-gray-500 mb-2">Energy/Fat gained per unit of resource eaten</p>

            {(Object.keys(config.resourceConversion) as Array<keyof typeof config.resourceConversion>).map((resource) => (
              <div key={resource} className="border rounded p-2 mb-2">
                <div className="font-medium text-sm capitalize mb-1">
                  {resource === 'grains' && '🌾'}
                  {resource === 'berries' && '🫐'}
                  {resource === 'salmon' && '🐟'}
                  {resource === 'honey' && '🍯'}
                  {resource === 'bearMeat' && '🥩'}
                  {' '}{resource}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="Energy"
                    value={config.resourceConversion[resource].energy}
                    onChange={(val) => updateResourceConversion(resource, { energy: val })}
                    max={20}
                  />
                  <NumberInput
                    label="Fat"
                    value={config.resourceConversion[resource].fat}
                    onChange={(val) => updateResourceConversion(resource, { fat: val })}
                    max={20}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Harvest Section */}
        {activeSection === 'harvest' && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Harvest Table</h3>
            <p className="text-xs text-gray-500 mb-2">Resources gained from each biome per season</p>

            {(['Spring', 'Summer', 'Autumn'] as const).map((season) => (
              <div key={season} className="border rounded p-2 mb-2">
                <div className="font-medium text-sm mb-2">
                  {season === 'Spring' && '🌸'}
                  {season === 'Summer' && '☀️'}
                  {season === 'Autumn' && '🍂'}
                  {' '}{season}
                </div>
                {(['Pastures', 'Forests', 'Riverlands'] as const).map((biome) => (
                  <div key={biome} className="ml-2 mb-2">
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {biome === 'Pastures' && '🌾'}
                      {biome === 'Forests' && '🌲'}
                      {biome === 'Riverlands' && '🏞️'}
                      {' '}{biome}
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <NumberInput
                        label="Grains"
                        value={config.harvestTable[season][biome].grains}
                        onChange={(val) => updateHarvestTable(season, biome, { grains: val })}
                        max={10}
                      />
                      <NumberInput
                        label="Berries"
                        value={config.harvestTable[season][biome].berries}
                        onChange={(val) => updateHarvestTable(season, biome, { berries: val })}
                        max={10}
                      />
                      <NumberInput
                        label="Salmon"
                        value={config.harvestTable[season][biome].salmon}
                        onChange={(val) => updateHarvestTable(season, biome, { salmon: val })}
                        max={10}
                      />
                      {biome === 'Forests' && 'honeyBonus' in config.harvestTable[season][biome] && (
                        <NumberInput
                          label="Honey*"
                          value={config.harvestTable[season][biome].honeyBonus || 0}
                          onChange={(val) => updateHarvestTable(season, biome, { honeyBonus: val })}
                          max={10}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <p className="text-xs text-gray-400">* Honey only on designated honey spaces in forests</p>
          </div>
        )}

        {/* Board Section */}
        {activeSection === 'board' && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Board Settings</h3>
            <NumberInput
              label="Honey Spaces"
              value={config.board.honeySpaces}
              onChange={(val) => updateBoard({ honeySpaces: val })}
              max={20}
            />
            <p className="text-xs text-gray-500 mt-2">
              Ring sizes: {config.board.ringsConfig.join(', ')} spaces
            </p>
          </div>
        )}

        {/* Players Section */}
        {activeSection === 'players' && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm mb-2">Player Settings</h3>
            <NumberInput
              label="Max Bears per Player"
              value={config.players.maxBears}
              onChange={(val) => updatePlayers({ maxBears: val })}
              min={1}
              max={10}
            />
            <NumberInput
              label="Max Cubs per Player"
              value={config.players.maxCubs}
              onChange={(val) => updatePlayers({ maxCubs: val })}
              max={20}
            />
            <NumberInput
              label="Starting Bears"
              value={config.players.startingBears}
              onChange={(val) => updatePlayers({ startingBears: val })}
              min={1}
              max={5}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            onClick={handleSaveToFile}
            disabled={!godModeEnabled || !isDirty || saveStatus === 'saving'}
            size="sm"
            className="flex-1"
          >
            {saveStatus === 'saving' ? 'Saving...' :
             saveStatus === 'success' ? '✓ Saved!' :
             saveStatus === 'error' ? '✗ Failed' :
             '💾 Save to Config'}
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
          >
            📤 Export
          </Button>
          <Button
            onClick={resetToDefaults}
            variant="outline"
            size="sm"
            disabled={!godModeEnabled}
          >
            🔄 Reset
          </Button>
        </div>

        {!godModeEnabled && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Enable God Mode to edit configuration values
          </p>
        )}
      </CardContent>
    </Card>
  )
}
