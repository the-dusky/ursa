/**
 * ConfigStore - Runtime-editable game configuration
 *
 * Loads defaults from game-config.json, allows runtime editing via "God Mode",
 * and can push changes back to the config file.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import defaultConfig from '@/config/game-config.json'

// Types for game configuration
export interface EnergyConfig {
  maxEnergy: number
  maxFat: number
  fatToEnergyRatio: number
  startingEnergy: number
  hibernationResetEnergy: number
}

export interface WinterEnergyTax {
  mountains: number
  outside: number
}

export interface EnergyTaxConfig {
  bySeason: {
    Spring: number
    Summer: number
    Autumn: number
    Winter: WinterEnergyTax
  }
}

export interface SeasonMovementCosts {
  lowFat: number
  mediumFat: number
  highFat: number
}

export interface MovementConfig {
  fatThresholds: {
    low: number
    medium: number
  }
  bySeason: {
    Spring: SeasonMovementCosts
    Summer: SeasonMovementCosts
    Autumn: SeasonMovementCosts
    Winter: SeasonMovementCosts
  }
}

export interface SeasonsConfig {
  turnsPerSeason: number
  order: string[]
}

export interface ResourceConversionRate {
  energy: number
  fat: number
}

export interface ResourceConversionConfig {
  grains: ResourceConversionRate
  berries: ResourceConversionRate
  salmon: ResourceConversionRate
  honey: ResourceConversionRate
  bearMeat: ResourceConversionRate
}

export interface HarvestYield {
  grains: number
  berries: number
  salmon: number
  honey?: number
  honeyBonus?: number
}

export interface SeasonHarvestConfig {
  Pastures: HarvestYield
  Forests: HarvestYield
  Riverlands: HarvestYield
  Mountains: HarvestYield
}

export interface HarvestTableConfig {
  Spring: SeasonHarvestConfig
  Summer: SeasonHarvestConfig
  Autumn: SeasonHarvestConfig
  Winter: SeasonHarvestConfig
}

export interface BoardConfig {
  honeySpaces: number
  ringsConfig: number[]
}

export interface PlayersConfig {
  maxBears: number
  maxCubs: number
  startingBears: number
}

export interface CombatConfig {
  attackCost: number
  fleeFirstMoveCostMultiplier: number
  attackerBonus: number
  defenderBonus: number
}

export interface GameConfig {
  version: string
  energy: EnergyConfig
  energyTax: EnergyTaxConfig
  movement: MovementConfig
  seasons: SeasonsConfig
  resourceConversion: ResourceConversionConfig
  harvestTable: HarvestTableConfig
  board: BoardConfig
  players: PlayersConfig
  combat: CombatConfig
}

interface ConfigStoreState {
  // The active configuration (can be modified at runtime)
  config: GameConfig

  // Whether God Mode is enabled
  godModeEnabled: boolean

  // Track if config has been modified from defaults
  isDirty: boolean

  // Actions
  setConfig: (config: Partial<GameConfig>) => void
  updateEnergy: (updates: Partial<EnergyConfig>) => void
  updateEnergyTax: (updates: Partial<EnergyTaxConfig>) => void
  updateMovement: (updates: Partial<MovementConfig>) => void
  updateSeasonalMovement: (season: 'Spring' | 'Summer' | 'Autumn' | 'Winter', updates: Partial<SeasonMovementCosts>) => void
  updateSeasons: (updates: Partial<SeasonsConfig>) => void
  updateResourceConversion: (resource: keyof ResourceConversionConfig, updates: Partial<ResourceConversionRate>) => void
  updateHarvestTable: (season: keyof HarvestTableConfig, biome: keyof SeasonHarvestConfig, updates: Partial<HarvestYield>) => void
  updateBoard: (updates: Partial<BoardConfig>) => void
  updatePlayers: (updates: Partial<PlayersConfig>) => void
  updateCombat: (updates: Partial<CombatConfig>) => void

  // God Mode controls
  enableGodMode: () => void
  disableGodMode: () => void
  toggleGodMode: () => void

  // Config management
  resetToDefaults: () => void
  exportConfig: () => GameConfig
  importConfig: (config: GameConfig) => void
  pushToConfigFile: () => Promise<boolean>
}

// Load default config from JSON file
const getDefaultConfig = (): GameConfig => {
  return JSON.parse(JSON.stringify(defaultConfig)) as GameConfig
}

export const useConfigStore = create<ConfigStoreState>()(
  subscribeWithSelector((set, get) => ({
    config: getDefaultConfig(),
    godModeEnabled: false,
    isDirty: false,

    setConfig: (newConfig) => set((state) => ({
      config: { ...state.config, ...newConfig },
      isDirty: true
    })),

    updateEnergy: (updates) => set((state) => ({
      config: {
        ...state.config,
        energy: { ...state.config.energy, ...updates }
      },
      isDirty: true
    })),

    updateEnergyTax: (updates) => set((state) => ({
      config: {
        ...state.config,
        energyTax: { ...state.config.energyTax, ...updates }
      },
      isDirty: true
    })),

    updateMovement: (updates) => set((state) => ({
      config: {
        ...state.config,
        movement: {
          ...state.config.movement,
          ...updates,
          fatThresholds: updates.fatThresholds
            ? { ...state.config.movement.fatThresholds, ...updates.fatThresholds }
            : state.config.movement.fatThresholds,
          bySeason: updates.bySeason
            ? { ...state.config.movement.bySeason, ...updates.bySeason }
            : state.config.movement.bySeason
        }
      },
      isDirty: true
    })),

    updateSeasonalMovement: (season, updates) => set((state) => ({
      config: {
        ...state.config,
        movement: {
          ...state.config.movement,
          bySeason: {
            ...state.config.movement.bySeason,
            [season]: { ...state.config.movement.bySeason[season], ...updates }
          }
        }
      },
      isDirty: true
    })),

    updateSeasons: (updates) => set((state) => ({
      config: {
        ...state.config,
        seasons: { ...state.config.seasons, ...updates }
      },
      isDirty: true
    })),

    updateResourceConversion: (resource, updates) => set((state) => ({
      config: {
        ...state.config,
        resourceConversion: {
          ...state.config.resourceConversion,
          [resource]: { ...state.config.resourceConversion[resource], ...updates }
        }
      },
      isDirty: true
    })),

    updateHarvestTable: (season, biome, updates) => set((state) => ({
      config: {
        ...state.config,
        harvestTable: {
          ...state.config.harvestTable,
          [season]: {
            ...state.config.harvestTable[season],
            [biome]: { ...state.config.harvestTable[season][biome], ...updates }
          }
        }
      },
      isDirty: true
    })),

    updateBoard: (updates) => set((state) => ({
      config: {
        ...state.config,
        board: { ...state.config.board, ...updates }
      },
      isDirty: true
    })),

    updatePlayers: (updates) => set((state) => ({
      config: {
        ...state.config,
        players: { ...state.config.players, ...updates }
      },
      isDirty: true
    })),

    updateCombat: (updates) => set((state) => ({
      config: {
        ...state.config,
        combat: { ...state.config.combat, ...updates }
      },
      isDirty: true
    })),

    enableGodMode: () => set({ godModeEnabled: true }),
    disableGodMode: () => set({ godModeEnabled: false }),
    toggleGodMode: () => set((state) => ({ godModeEnabled: !state.godModeEnabled })),

    resetToDefaults: () => set({
      config: getDefaultConfig(),
      isDirty: false
    }),

    exportConfig: () => {
      return JSON.parse(JSON.stringify(get().config))
    },

    importConfig: (config) => set({
      config: JSON.parse(JSON.stringify(config)),
      isDirty: true
    }),

    pushToConfigFile: async () => {
      const config = get().config
      try {
        const response = await fetch('/api/config/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config, null, 2),
        })

        if (response.ok) {
          set({ isDirty: false })
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to save config:', error)
        return false
      }
    }
  }))
)

// Selector hooks for accessing specific config sections
export const useEnergyConfig = () => useConfigStore((state) => state.config.energy)
export const useEnergyTaxConfig = () => useConfigStore((state) => state.config.energyTax)
export const useMovementConfig = () => useConfigStore((state) => state.config.movement)
export const useSeasonsConfig = () => useConfigStore((state) => state.config.seasons)
export const useResourceConversionConfig = () => useConfigStore((state) => state.config.resourceConversion)
export const useHarvestTableConfig = () => useConfigStore((state) => state.config.harvestTable)
export const useBoardConfig = () => useConfigStore((state) => state.config.board)
export const usePlayersConfig = () => useConfigStore((state) => state.config.players)
export const useCombatConfig = () => useConfigStore((state) => state.config.combat)
export const useGodMode = () => useConfigStore((state) => state.godModeEnabled)
