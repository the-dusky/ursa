/**
 * AdjacencyCalculator - ISOLATED AND IMMUTABLE
 * 
 * ⚠️  WARNING: DO NOT MODIFY THIS FILE WITHOUT EXTREME CAUTION ⚠️
 * 
 * This module contains the EXACT adjacency calculation logic that was
 * painstakingly debugged and verified. Any changes risk breaking the
 * precise edge angle overlap detection.
 * 
 * Last verified: 2025-01-02
 * Test case: R1-7 (right: 4.555309) and R0-NORTH (left: 4.556582) 
 * Expected: NOT adjacent (no overlap)
 */

export interface EdgeAngles {
  left: number
  right: number
}

export interface SpaceForAdjacency {
  id: string
  ring: number
  edgeAngles?: EdgeAngles
}

/**
 * IMMUTABLE: Calculate if two spaces are adjacent based on edge angle overlap
 * 
 * Two spaces are adjacent if and only if:
 * 1. Either of space1's edges falls STRICTLY BETWEEN space2's edges, OR
 * 2. Either of space2's edges falls STRICTLY BETWEEN space1's edges
 * 
 * "Strictly between" means: left < edge < right (NOT <=)
 */
export function areSpacesAdjacent(space1: SpaceForAdjacency, space2: SpaceForAdjacency): boolean {
  // Require both spaces to have edge angles
  if (!space1.edgeAngles || !space2.edgeAngles) {
    return false
  }

  const { left: s1Left, right: s1Right } = space1.edgeAngles
  const { left: s2Left, right: s2Right } = space2.edgeAngles

  // Check if either of space1's edges fall within space2's range (strictly between)
  const s1LeftInS2Range = s1Left > s2Left && s1Left < s2Right
  const s1RightInS2Range = s1Right > s2Left && s1Right < s2Right

  // Check if either of space2's edges fall within space1's range (strictly between)
  const s2LeftInS1Range = s2Left > s1Left && s2Left < s1Right
  const s2RightInS1Range = s2Right > s1Left && s2Right < s1Right

  // Adjacent if ANY edge overlaps
  return s1LeftInS2Range || s1RightInS2Range || s2LeftInS1Range || s2RightInS1Range
}

/**
 * IMMUTABLE: Calculate same-ring adjacencies (position-based)
 * 
 * Same ring spaces are adjacent if they are immediate neighbors by position.
 * This wraps around (position 1 is adjacent to max position).
 */
export function getSameRingAdjacencies(space: SpaceForAdjacency, ringSpaceCount: number): string[] {
  const adjacentSpaces: string[] = []
  
  // Previous position (wraps to end)
  const prevPosition = space.ring === 1 ? ringSpaceCount : (space.ring - 1) || ringSpaceCount
  adjacentSpaces.push(`R${space.ring}-${prevPosition}`)
  
  // Next position (wraps to start) 
  const nextPosition = space.ring === ringSpaceCount ? 1 : space.ring + 1
  adjacentSpaces.push(`R${space.ring}-${nextPosition}`)
  
  return adjacentSpaces
}

/**
 * IMMUTABLE: Get all cross-ring adjacent spaces using edge angle overlap
 */
export function getCrossRingAdjacencies(
  space: SpaceForAdjacency, 
  allSpaces: SpaceForAdjacency[]
): string[] {
  if (!space.edgeAngles) return []
  
  const adjacentSpaces: string[] = []
  
  // Check all spaces in adjacent rings
  const adjacentRings = [space.ring - 1, space.ring + 1].filter(ring => ring > 0)
  
  adjacentRings.forEach(targetRing => {
    const targetSpaces = allSpaces.filter(s => s.ring === targetRing)
    
    targetSpaces.forEach(targetSpace => {
      if (areSpacesAdjacent(space, targetSpace)) {
        adjacentSpaces.push(targetSpace.id)
      }
    })
  })
  
  return adjacentSpaces
}

/**
 * VERIFICATION TESTS - These must always pass
 */
export const VERIFICATION_TESTS = {
  // Test case from 2025-01-02: R1-7 and R0-NORTH should NOT be adjacent
  testR1_7_R0_NORTH_NotAdjacent: () => {
    const r1_7: SpaceForAdjacency = {
      id: 'R1-7',
      ring: 1,
      edgeAngles: { left: 4.0, right: 4.555309 } // Approximated left edge
    }
    
    const r0_north: SpaceForAdjacency = {
      id: 'R0-NORTH',
      ring: 0,
      edgeAngles: { left: 4.556582, right: 4.868195 }
    }
    
    const result = areSpacesAdjacent(r1_7, r0_north)
    const expected = false
    
    if (result !== expected) {
      throw new Error(`VERIFICATION FAILED: R1-7 and R0-NORTH adjacency test. Expected: ${expected}, Got: ${result}`)
    }
    
    return true
  },
  
  // Test case: Overlapping spaces should be adjacent
  testOverlappingSpacesAdjacent: () => {
    const space1: SpaceForAdjacency = {
      id: 'TEST-1',
      ring: 1,
      edgeAngles: { left: 1.0, right: 2.0 }
    }
    
    const space2: SpaceForAdjacency = {
      id: 'TEST-2', 
      ring: 2,
      edgeAngles: { left: 1.5, right: 2.5 } // Overlaps: 1.5 is between 1.0 and 2.0
    }
    
    const result = areSpacesAdjacent(space1, space2)
    const expected = true
    
    if (result !== expected) {
      throw new Error(`VERIFICATION FAILED: Overlapping spaces test. Expected: ${expected}, Got: ${result}`)
    }
    
    return true
  },
  
  // Run all verification tests
  runAll: () => {
    VERIFICATION_TESTS.testR1_7_R0_NORTH_NotAdjacent()
    VERIFICATION_TESTS.testOverlappingSpacesAdjacent()
    console.log('✅ All adjacency verification tests passed')
    return true
  }
}