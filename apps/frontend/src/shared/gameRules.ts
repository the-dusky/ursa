/**
 * Shared Game Rules Engine
 * 
 * Pure functions that implement the core game mechanics.
 * Used by both the main UI game (via gameStore) and the simulation system.
 * This ensures both systems use identical rules.
 */

import type { GameSpace, GamePiece, Board } from '../store/gameStore'

// Types for the rules engine
export type ResourceType = 'grains' | 'berries' | 'salmon' | 'honey' | 'bearMeat'
export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter'

export interface GameRulesConfig {
  maxEnergy: number
  hibernationFatCost: number
  emergencyEnergyConversion: number // fat to emergency energy ratio
}

export const DEFAULT_CONFIG: GameRulesConfig = {
  maxEnergy: 20,
  hibernationFatCost: 20,
  emergencyEnergyConversion: 2 // 1 fat = 2 emergency energy
}

export const EMERGENCY_CONVERSION = {
  maxFatPerTurn: 5 // Maximum fat that can be auto-converted per turn
}

export const SEASONAL_PRODUCTION = {
  Spring: { grains: 4, berries: 1, salmon: 2, honey: 1 },
  Summer: { grains: 3, berries: 3, salmon: 3, honey: 2 },
  Autumn: { grains: 3, berries: 2, salmon: 4, honey: 1 },
  Winter: { grains: 1, berries: 0, salmon: 0, honey: 0 }
}

export const FOOD_CONVERSION_RATES = {
  energy: { grains: 3, berries: 2, salmon: 1, honey: 4, bearMeat: 6 },
  fat: { grains: 1, berries: 2, salmon: 4, honey: 3, bearMeat: 8 }
}

export const MOVEMENT_COSTS = {
  baseCost: (fat: number) => {
    if (fat <= 5) return 1   // Lean bears move efficiently
    if (fat <= 15) return 2  // Getting heavy
    return 3                 // Very heavy, hibernation-ready bears
  },
  winterCost: (isInMountains: boolean) => isInMountains ? 2 : 5
}

export const ENERGY_LOSS = {
  nonWinter: 1,
  winter: (isInMountains: boolean) => isInMountains ? 2 : 5
}

/**
 * Calculate total available energy (regular + emergency)
 */
export function getTotalEnergy(piece: GamePiece): number {
  return piece.energy + piece.emergencyEnergy
}

/**
 * Check if a piece can survive (has energy OR fat reserves)
 */
export function canSurvive(piece: GamePiece): boolean {
  return piece.energy > 0 || piece.fat > 0
}

/**
 * Calculate movement cost for a piece
 */
export function calculateMovementCost(
  piece: GamePiece, 
  season: Season, 
  fromQuadrant: string,
  config: GameRulesConfig = DEFAULT_CONFIG
): number {
  const baseCost = MOVEMENT_COSTS.baseCost(piece.fat)
  
  if (season === 'Winter') {
    const isInMountains = fromQuadrant === 'Mountains'
    return MOVEMENT_COSTS.winterCost(isInMountains)
  }
  
  return baseCost
}

/**
 * Calculate energy loss for a piece at start of turn
 */
export function calculateEnergyLoss(
  piece: GamePiece,
  season: Season,
  quadrant: string,
  config: GameRulesConfig = DEFAULT_CONFIG
): number {
  if (season === 'Winter') {
    const isInMountains = quadrant === 'Mountains'
    return ENERGY_LOSS.winter(isInMountains)
  }
  
  return ENERGY_LOSS.nonWinter
}

/**
 * Execute food consumption and conversion
 */
export function executeEatFood(
  piece: GamePiece,
  resourceType: ResourceType,
  amount: number,
  convertTo: 'energy' | 'fat',
  config: GameRulesConfig = DEFAULT_CONFIG
): { success: boolean; newPiece: GamePiece; message: string } {
  
  if (piece.resources[resourceType] < amount) {
    return {
      success: false,
      newPiece: piece,
      message: `Not enough ${resourceType} (has ${piece.resources[resourceType]}, needs ${amount})`
    }
  }

  const conversionRate = FOOD_CONVERSION_RATES[convertTo][resourceType]
  const conversionAmount = amount * conversionRate

  const newResources = {
    ...piece.resources,
    [resourceType]: piece.resources[resourceType] - amount
  }

  let newEnergy = piece.energy
  let newFat = piece.fat

  if (convertTo === 'energy') {
    newEnergy = Math.min(config.maxEnergy, piece.energy + conversionAmount)
  } else {
    newFat = piece.fat + conversionAmount
  }

  const newPiece: GamePiece = {
    ...piece,
    resources: newResources,
    energy: newEnergy,
    fat: newFat
  }

  return {
    success: true,
    newPiece,
    message: `Converted ${amount} ${resourceType} to ${conversionAmount} ${convertTo}`
  }
}

/**
 * Execute movement and energy cost
 */
export function executeMovement(
  piece: GamePiece,
  season: Season,
  fromQuadrant: string,
  config: GameRulesConfig = DEFAULT_CONFIG
): { success: boolean; newPiece: GamePiece; message: string } {
  
  const movementCost = calculateMovementCost(piece, season, fromQuadrant, config)
  const totalEnergy = getTotalEnergy(piece)
  
  if (totalEnergy < movementCost) {
    return {
      success: false,
      newPiece: piece,
      message: `Insufficient energy to move! Needs ${movementCost}, has ${totalEnergy} total`
    }
  }

  // Use regular energy first, then emergency energy
  let newRegularEnergy = piece.energy
  let newEmergencyEnergy = piece.emergencyEnergy

  if (piece.energy >= movementCost) {
    newRegularEnergy -= movementCost
  } else {
    const regularUsed = piece.energy
    const emergencyUsed = movementCost - regularUsed
    newRegularEnergy = 0
    newEmergencyEnergy -= emergencyUsed
  }

  const newPiece: GamePiece = {
    ...piece,
    energy: newRegularEnergy,
    emergencyEnergy: newEmergencyEnergy
  }

  return {
    success: true,
    newPiece,
    message: `Moved using ${movementCost} energy`
  }
}

/**
 * Execute daily energy tax (player choice during movement phase)
 */
export function executeDailyEnergyTax(
  piece: GamePiece,
  season: Season,
  quadrant: string,
  config: GameRulesConfig = DEFAULT_CONFIG
): { newPiece: GamePiece; message: string } {
  
  const energyLoss = calculateEnergyLoss(piece, season, quadrant, config)
  const totalEnergy = getTotalEnergy(piece)
  
  if (totalEnergy < energyLoss) {
    return {
      newPiece: piece,
      message: `Cannot pay energy tax! Need ${energyLoss} energy, only have ${totalEnergy}`
    }
  }
  
  // Deduct from regular energy first, then emergency energy if needed
  let newRegularEnergy = piece.energy
  let newEmergencyEnergy = piece.emergencyEnergy
  
  if (piece.energy >= energyLoss) {
    newRegularEnergy -= energyLoss
  } else {
    const regularUsed = piece.energy
    const emergencyUsed = energyLoss - regularUsed
    newRegularEnergy = 0
    newEmergencyEnergy -= emergencyUsed
  }
  
  const newPiece: GamePiece = {
    ...piece,
    energy: newRegularEnergy,
    emergencyEnergy: newEmergencyEnergy
  }

  return {
    newPiece,
    message: `Paid ${energyLoss} energy tax (${getTotalEnergy(newPiece)} energy remaining)`
  }
}

/**
 * Execute turn end energy cleanup (clears emergency energy)
 */
export function executeTurnEnergyLoss(
  piece: GamePiece,
  season: Season,
  quadrant: string,
  config: GameRulesConfig = DEFAULT_CONFIG
): { newPiece: GamePiece; message: string } {
  
  // Emergency energy is lost at end of turn regardless
  const newPiece: GamePiece = {
    ...piece,
    emergencyEnergy: 0
  }

  return {
    newPiece,
    message: `Emergency energy cleared at turn end`
  }
}

/**
 * Convert fat to emergency energy
 */
export function convertFatToEmergencyEnergy(
  piece: GamePiece,
  fatAmount: number,
  config: GameRulesConfig = DEFAULT_CONFIG
): { success: boolean; newPiece: GamePiece; message: string } {
  
  if (piece.fat < fatAmount) {
    return {
      success: false,
      newPiece: piece,
      message: `Not enough fat to convert (has ${piece.fat}, needs ${fatAmount})`
    }
  }

  const emergencyEnergyGained = fatAmount * config.emergencyEnergyConversion

  const newPiece: GamePiece = {
    ...piece,
    fat: piece.fat - fatAmount,
    emergencyEnergy: piece.emergencyEnergy + emergencyEnergyGained
  }

  return {
    success: true,
    newPiece,
    message: `Converted ${fatAmount} fat to ${emergencyEnergyGained} emergency energy`
  }
}

/**
 * Execute hibernation
 */
export function executeHibernation(
  piece: GamePiece,
  quadrant: string,
  season: Season,
  config: GameRulesConfig = DEFAULT_CONFIG
): { success: boolean; newPiece: GamePiece; message: string } {
  
  if (quadrant !== 'Mountains') {
    return {
      success: false,
      newPiece: piece,
      message: 'Bear must be in Mountains to hibernate'
    }
  }

  if (season !== 'Winter') {
    return {
      success: false,
      newPiece: piece,
      message: 'Bears can only hibernate during Winter'
    }
  }

  if (piece.fat < config.hibernationFatCost) {
    return {
      success: false,
      newPiece: piece,
      message: `Bear needs ${config.hibernationFatCost} fat to hibernate (has ${piece.fat})`
    }
  }

  const newPiece: GamePiece = {
    ...piece,
    isHibernating: true,
    energy: 5,
    fat: 0,
    emergencyEnergy: 0,
    resources: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 }
  }

  return {
    success: true,
    newPiece,
    message: `Bear entered hibernation (consumed ${config.hibernationFatCost} fat, reset to 5 energy)`
  }
}

/**
 * Execute resource harvesting for a piece on a space
 */
export function executeHarvest(
  piece: GamePiece,
  space: GameSpace,
  season: Season,
  config: GameRulesConfig = DEFAULT_CONFIG
): { newPiece: GamePiece; harvested: { [key in ResourceType]: number }; message: string } {
  
  if (!space.canProduce) {
    return {
      newPiece: piece,
      harvested: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 },
      message: 'This space cannot produce resources'
    }
  }

  const production = SEASONAL_PRODUCTION[season]
  const newResources = { ...piece.resources }
  const harvested = { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 }

  // Harvest based on quadrant
  switch (space.quadrant) {
    case 'Pastures':
      newResources.grains += production.grains
      harvested.grains = production.grains
      break
    case 'Forests':
      newResources.berries += production.berries
      harvested.berries = production.berries
      if (space.hasHoney) {
        newResources.honey += production.honey
        harvested.honey = production.honey
      }
      break
    case 'Riverlands':
      newResources.salmon += production.salmon
      harvested.salmon = production.salmon
      break
  }

  const newPiece: GamePiece = {
    ...piece,
    resources: newResources
  }

  const harvestedItems = Object.entries(harvested)
    .filter(([_, amount]) => amount > 0)
    .map(([resource, amount]) => `${amount} ${resource}`)
    .join(', ')

  return {
    newPiece,
    harvested,
    message: harvestedItems ? `Harvested: ${harvestedItems}` : 'No resources harvested'
  }
}

/**
 * Execute bear combat
 */
export function executeFight(
  attacker: GamePiece,
  defender: GamePiece
): { 
  winner: GamePiece; 
  loser: GamePiece; 
  bearMeatGained: number; 
  message: string 
} {
  
  // Fight mechanics: larger bears (more fat + energy) are stronger
  const attackerStrength = attacker.fat + attacker.energy + attacker.emergencyEnergy
  const defenderStrength = defender.fat + defender.energy + defender.emergencyEnergy
  
  // Add some randomness (±20%)
  const attackerRoll = attackerStrength * (0.8 + Math.random() * 0.4)
  const defenderRoll = defenderStrength * (0.8 + Math.random() * 0.4)
  
  const winner = attackerRoll > defenderRoll ? attacker : defender
  const loser = attackerRoll > defenderRoll ? defender : attacker
  
  // Winner gains bear meat based on loser's size
  const bearMeatGained = Math.max(1, Math.floor((loser.fat + loser.energy) / 5))
  
  const newWinner: GamePiece = {
    ...winner,
    resources: {
      ...winner.resources,
      bearMeat: winner.resources.bearMeat + bearMeatGained
    }
  }

  return {
    winner: newWinner,
    loser,
    bearMeatGained,
    message: `${winner.type} defeated ${loser.type} and gained ${bearMeatGained} bear meat!`
  }
}