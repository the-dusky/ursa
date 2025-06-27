/**
 * Game Calculation Utilities
 * 
 * Pure functions for game state calculations, separated from UI concerns
 */

import type { CoreGamePiece, CoreGameSpace, Season } from '@/engine/types/GameState'

export interface SurvivalCalculation {
  energyCost: number
  totalEnergy: number
  totalFat: number
  canPayTax: boolean
  maxEnergyFromFat: number
  totalPossibleEnergy: number
  canSurvive: boolean
}

export interface FatConversionCalculation {
  canConvert: boolean
  fatRequired: number
  energyGained: number
  currentFat: number
}

/**
 * Calculate if a bear can survive the energy tax
 */
export function calculateSurvival(
  piece: CoreGamePiece,
  space: CoreGameSpace | undefined,
  season: Season
): SurvivalCalculation {
  const energyCost = season === 'Winter' ? 
    (space?.quadrant === 'Mountains' ? 2 : 5) : 1
  
  const totalEnergy = piece.energy + piece.emergencyEnergy
  const totalFat = piece.fat
  const canPayTax = totalEnergy >= energyCost
  
  // Calculate how much energy we can get from fat conversion (incremental: 2 fat = 1 energy)
  const maxEnergyFromFat = Math.floor(totalFat / 2) // Only count complete pairs of fat
  const totalPossibleEnergy = totalEnergy + maxEnergyFromFat
  const canSurvive = totalPossibleEnergy >= energyCost

  return {
    energyCost,
    totalEnergy,
    totalFat,
    canPayTax,
    maxEnergyFromFat,
    totalPossibleEnergy,
    canSurvive
  }
}

/**
 * Calculate fat conversion availability
 */
export function calculateFatConversion(piece: CoreGamePiece): FatConversionCalculation {
  const fatRequired = 2
  const energyGained = 1
  const currentFat = piece.fat
  const canConvert = currentFat >= fatRequired

  return {
    canConvert,
    fatRequired,
    energyGained,
    currentFat
  }
}

/**
 * Get energy display string with emergency energy
 */
export function getEnergyDisplayString(piece: CoreGamePiece): {
  regular: number
  emergency: number
  total: number
  hasEmergency: boolean
} {
  return {
    regular: piece.energy,
    emergency: piece.emergencyEnergy,
    total: piece.energy + piece.emergencyEnergy,
    hasEmergency: piece.emergencyEnergy > 0
  }
}