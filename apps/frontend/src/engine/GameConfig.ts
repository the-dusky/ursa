/**
 * Centralized Game Configuration
 * 
 * This file contains all game parameters in one place to ensure consistency
 * across the entire codebase and make balance changes easier.
 */

import type { GamePiece } from '../store/gameStore'

export interface GameConfig {
  movement: {
    baseCost: (fat: number) => number
    winterCost: {
      mountains: number
      outside: number
    }
  }
  hibernation: {
    fatCost: number
    energyReset: number
  }
  energy: {
    maxEnergy: number
    dailyLoss: {
      winter: {
        mountains: number
        outside: number
      }
      other: number
    }
    emergencyConversion: number  // 1 fat = X emergency energy
    maxFatConversionPerTurn: number  // Maximum fat that can be auto-converted per turn
  }
  combat: {
    strengthFormula: (piece: GamePiece) => number
    randomnessRange: {
      min: number
      max: number
    }
    bearMeatReward: (loser: GamePiece) => number
  }
  resources: {
    conversion: {
      energy: {
        grains: number
        berries: number
        salmon: number
        honey: number
        bearMeat: number
      }
      fat: {
        grains: number
        berries: number
        salmon: number
        honey: number
        bearMeat: number
      }
    }
    seasonalProduction: {
      Spring: {
        grains: number
        berries: number
        salmon: number
        honey: number
      }
      Summer: {
        grains: number
        berries: number
        salmon: number
        honey: number
      }
      Autumn: {
        grains: number
        berries: number
        salmon: number
        honey: number
      }
      Winter: {
        grains: number
        berries: number
        salmon: number
        honey: number
      }
    }
  }
  board: {
    ringConfigs: Array<{
      ring: number
      spaceCount: number
      radius: number
    }>
    biomes: Array<'Mountains' | 'Pastures' | 'Forests' | 'Riverlands'>
    bridgeSystem: {
      enabled: boolean
      tunnelMode: boolean
    }
    honeySpaces: number
  }
}

/**
 * Default game configuration - all parameters centralized here
 */
export const GAME_CONFIG: GameConfig = {
  movement: {
    baseCost: (fat: number) => {
      if (fat <= 5) return 1   // Lean bears move efficiently
      if (fat <= 15) return 2  // Getting heavy
      return 3                 // Very heavy, hibernation-ready bears
    },
    winterCost: {
      mountains: 2,
      outside: 5
    }
  },
  hibernation: {
    fatCost: 35,  // Resolving inconsistency - using the gameStore value (35) as authoritative
    energyReset: 5
  },
  energy: {
    maxEnergy: 20,
    dailyLoss: {
      winter: {
        mountains: 2,
        outside: 5
      },
      other: 1
    },
    emergencyConversion: 0.5,  // 2 fat = 1 emergency energy
    maxFatConversionPerTurn: 5  // Maximum fat that can be auto-converted per turn
  },
  combat: {
    strengthFormula: (piece: GamePiece) => piece.fat + piece.energy + piece.emergencyEnergy,
    randomnessRange: {
      min: 0.8,
      max: 1.2
    },
    bearMeatReward: (loser: GamePiece) => Math.max(1, Math.floor((loser.fat + loser.energy) / 5))
  },
  resources: {
    conversion: {
      energy: {
        grains: 3,
        berries: 2,
        salmon: 1,
        honey: 4,
        bearMeat: 6
      },
      fat: {
        grains: 1,
        berries: 2,
        salmon: 4,
        honey: 3,
        bearMeat: 8
      }
    },
    seasonalProduction: {
      Spring: {
        grains: 4,
        berries: 1,
        salmon: 2,
        honey: 1
      },
      Summer: {
        grains: 3,
        berries: 3,
        salmon: 3,
        honey: 2
      },
      Autumn: {
        grains: 3,
        berries: 2,
        salmon: 4,
        honey: 1
      },
      Winter: {
        grains: 1,
        berries: 0,
        salmon: 0,
        honey: 0
      }
    }
  },
  board: {
    ringConfigs: [
      { ring: 1, spaceCount: 20, radius: 120 },  // 5 spaces per quadrant
      { ring: 2, spaceCount: 24, radius: 180 },  // 6 spaces per quadrant
      { ring: 3, spaceCount: 28, radius: 240 },  // 7 spaces per quadrant
      { ring: 4, spaceCount: 32, radius: 300 },  // 8 spaces per quadrant
      { ring: 5, spaceCount: 36, radius: 360 }   // 9 spaces per quadrant
    ],
    biomes: ['Pastures', 'Mountains', 'Riverlands', 'Forests'],
    bridgeSystem: {
      enabled: true,
      tunnelMode: true // East-West tunnel, North-South overland
    },
    honeySpaces: 5
  }
}

/**
 * Helper functions for commonly used calculations
 */
export const GameConfigHelpers = {
  /**
   * Calculate movement cost for a piece based on season and location
   */
  getMovementCost: (piece: GamePiece, season: string, fromQuadrant: string, config: GameConfig = GAME_CONFIG): number => {
    const baseCost = config.movement.baseCost(piece.fat)
    
    if (season === 'Winter') {
      const isInMountains = fromQuadrant === 'Mountains'
      return isInMountains ? config.movement.winterCost.mountains : config.movement.winterCost.outside
    }
    
    return baseCost
  },

  /**
   * Calculate energy loss for a piece at start of turn
   */
  getEnergyLoss: (season: string, quadrant: string, config: GameConfig = GAME_CONFIG): number => {
    if (season === 'Winter') {
      const isInMountains = quadrant === 'Mountains'
      return isInMountains ? config.energy.dailyLoss.winter.mountains : config.energy.dailyLoss.winter.outside
    }
    
    return config.energy.dailyLoss.other
  },

  /**
   * Get conversion rate for a resource to energy or fat
   */
  getConversionRate: (resourceType: string, convertTo: 'energy' | 'fat', config: GameConfig = GAME_CONFIG): number => {
    return config.resources.conversion[convertTo][resourceType as keyof typeof config.resources.conversion[typeof convertTo]]
  },

  /**
   * Get seasonal production for a resource type
   */
  getSeasonalProduction: (season: string, resourceType: string, config: GameConfig = GAME_CONFIG): number => {
    return config.resources.seasonalProduction[season as keyof typeof config.resources.seasonalProduction][resourceType as keyof typeof config.resources.seasonalProduction.Spring]
  }
}