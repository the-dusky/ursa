/**
 * Dice rolling utility for the game engine
 * Supports rolling 1-5 dice with standard 1-6 values
 */

export interface DiceRoll {
  dice: number[]      // Individual die values
  total: number       // Sum of all dice
  count: number       // Number of dice rolled
}

/**
 * Roll dice and return the results
 * @param count - Number of dice to roll (1-5)
 * @returns DiceRoll object with individual values and total
 */
export function rollDice(count: number): DiceRoll {
  // Validate input
  if (count < 1 || count > 5) {
    throw new Error('Can only roll 1-5 dice')
  }

  // Roll each die
  const dice: number[] = []
  for (let i = 0; i < count; i++) {
    // Generate random number 1-6
    const roll = Math.floor(Math.random() * 6) + 1
    dice.push(roll)
  }

  // Calculate total
  const total = dice.reduce((sum, die) => sum + die, 0)

  return {
    dice,
    total,
    count
  }
}

/**
 * Roll a single die
 * @returns number between 1-6
 */
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1
}

/**
 * Roll two dice and return as a tuple
 * @returns [die1, die2] tuple
 */
export function roll2D6(): [number, number] {
  return [rollD6(), rollD6()]
}

/**
 * Get the highest value from a dice roll
 * @param roll - DiceRoll result
 * @returns highest individual die value
 */
export function getHighest(roll: DiceRoll): number {
  return Math.max(...roll.dice)
}

/**
 * Get the lowest value from a dice roll
 * @param roll - DiceRoll result
 * @returns lowest individual die value
 */
export function getLowest(roll: DiceRoll): number {
  return Math.min(...roll.dice)
}