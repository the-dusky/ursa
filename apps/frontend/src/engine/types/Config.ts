/**
 * Configuration Types
 * 
 * Type definitions for game configuration to ensure type safety
 * when passing configuration objects around.
 */

import type { CoreGamePiece, ResourceType, Season } from './GameState'

export interface MovementConfig {
  baseCost: (fat: number) => number
  winterCost: {
    mountains: number
    outside: number
  }
}

export interface HibernationConfig {
  fatCost: number
  energyReset: number
}

export interface EnergyConfig {
  maxEnergy: number
  dailyLoss: {
    winter: {
      mountains: number
      outside: number
    }
    other: number
  }
  emergencyConversion: number
  maxFatConversionPerTurn: number
}

export interface CombatConfig {
  strengthFormula: (piece: CoreGamePiece) => number
  randomnessRange: {
    min: number
    max: number
  }
  bearMeatReward: (loser: CoreGamePiece) => number
}

export interface ResourceConversionRates {
  grains: number
  berries: number
  salmon: number
  honey: number
  bearMeat: number
}

export interface SeasonalProduction {
  grains: number
  berries: number
  salmon: number
  honey: number
}

export interface ResourcesConfig {
  conversion: {
    energy: ResourceConversionRates
    fat: ResourceConversionRates
  }
  seasonalProduction: {
    Spring: SeasonalProduction
    Summer: SeasonalProduction
    Autumn: SeasonalProduction
    Winter: SeasonalProduction
  }
}

/**
 * Complete game configuration interface
 */
export interface GameConfig {
  movement: MovementConfig
  hibernation: HibernationConfig
  energy: EnergyConfig
  combat: CombatConfig
  resources: ResourcesConfig
}

/**
 * Partial config types for testing and configuration overrides
 */
export type PartialGameConfig = Partial<GameConfig>

export interface ConfigOverrides {
  movement?: Partial<MovementConfig>
  hibernation?: Partial<HibernationConfig>
  energy?: Partial<EnergyConfig>
  combat?: Partial<CombatConfig>
  resources?: Partial<ResourcesConfig>
}

/**
 * Type guards for configuration validation
 */
export const ConfigValidators = {
  isValidSeason: (value: string): value is Season => {
    return ['Spring', 'Summer', 'Autumn', 'Winter'].includes(value)
  },

  isValidResourceType: (value: string): value is ResourceType => {
    return ['grains', 'berries', 'salmon', 'honey', 'bearMeat'].includes(value)
  },

  isValidMovementConfig: (config: unknown): config is MovementConfig => {
    return (
      typeof config === 'object' &&
      config !== null &&
      'baseCost' in config &&
      typeof (config as MovementConfig).baseCost === 'function' &&
      'winterCost' in config &&
      typeof (config as MovementConfig).winterCost === 'object'
    )
  },

  isValidGameConfig: (config: unknown): config is GameConfig => {
    return (
      typeof config === 'object' &&
      config !== null &&
      'movement' in config &&
      'hibernation' in config &&
      'energy' in config &&
      'combat' in config &&
      'resources' in config
    )
  }
}