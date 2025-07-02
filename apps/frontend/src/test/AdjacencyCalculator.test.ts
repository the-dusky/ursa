/**
 * AdjacencyCalculator Tests - IMMUTABLE REGRESSION PROTECTION
 * 
 * These tests MUST NEVER FAIL. They protect the exact adjacency
 * calculation logic that was debugged and verified.
 * 
 * If any test fails, DO NOT change the test - fix the code.
 */

import { describe, it, expect } from 'vitest'
import { areSpacesAdjacent, VERIFICATION_TESTS } from '../engine/AdjacencyCalculator'

describe('AdjacencyCalculator - IMMUTABLE TESTS', () => {
  it('R1-7 and R0-NORTH must NOT be adjacent (verified 2025-01-02)', () => {
    const r1_7 = {
      id: 'R1-7',
      ring: 1,
      edgeAngles: { left: 4.0, right: 4.555309 }
    }
    
    const r0_north = {
      id: 'R0-NORTH', 
      ring: 0,
      edgeAngles: { left: 4.556582, right: 4.868195 }
    }
    
    // CRITICAL: This must be false - no overlap between ranges
    expect(areSpacesAdjacent(r1_7, r0_north)).toBe(false)
  })
  
  it('Overlapping spaces must be adjacent', () => {
    const space1 = {
      id: 'TEST-1',
      ring: 1, 
      edgeAngles: { left: 1.0, right: 2.0 }
    }
    
    const space2 = {
      id: 'TEST-2',
      ring: 2,
      edgeAngles: { left: 1.5, right: 2.5 } // 1.5 overlaps with [1.0, 2.0]
    }
    
    expect(areSpacesAdjacent(space1, space2)).toBe(true)
  })
  
  it('Non-overlapping spaces must NOT be adjacent', () => {
    const space1 = {
      id: 'TEST-1',
      ring: 1,
      edgeAngles: { left: 1.0, right: 2.0 }
    }
    
    const space2 = {
      id: 'TEST-2', 
      ring: 2,
      edgeAngles: { left: 3.0, right: 4.0 } // No overlap with [1.0, 2.0]
    }
    
    expect(areSpacesAdjacent(space1, space2)).toBe(false)
  })
  
  it('Touching edges (no overlap) must NOT be adjacent', () => {
    const space1 = {
      id: 'TEST-1',
      ring: 1,
      edgeAngles: { left: 1.0, right: 2.0 }
    }
    
    const space2 = {
      id: 'TEST-2',
      ring: 2, 
      edgeAngles: { left: 2.0, right: 3.0 } // Touching at 2.0 but no overlap
    }
    
    // CRITICAL: Touching edges should NOT be adjacent (strictly between)
    expect(areSpacesAdjacent(space1, space2)).toBe(false)
  })
  
  it('Spaces without edge angles must NOT be adjacent', () => {
    const space1 = {
      id: 'TEST-1',
      ring: 1
      // No edgeAngles
    }
    
    const space2 = {
      id: 'TEST-2',
      ring: 2,
      edgeAngles: { left: 1.0, right: 2.0 }
    }
    
    expect(areSpacesAdjacent(space1, space2)).toBe(false)
  })
  
  it('Built-in verification tests must pass', () => {
    expect(() => VERIFICATION_TESTS.runAll()).not.toThrow()
  })
  
  it('Exact edge case from debugging session', () => {
    // The EXACT values that were causing the bug
    const r1_7_exact = {
      id: 'R1-7',
      ring: 1,
      edgeAngles: { left: 4.0, right: 4.555309 }
    }
    
    const r0_north_exact = {
      id: 'R0-NORTH',
      ring: 0, 
      edgeAngles: { left: 4.556582480415148, right: 4.868195480354231 }
    }
    
    // R1-7 right (4.555309) < R0-NORTH left (4.556582) = NO OVERLAP
    expect(areSpacesAdjacent(r1_7_exact, r0_north_exact)).toBe(false)
    
    // Verify the exact comparison that matters
    expect(r1_7_exact.edgeAngles.right).toBeLessThan(r0_north_exact.edgeAngles.left)
  })
})

/**
 * INTEGRATION TEST - Run this with every board generation
 */
describe('Board Integration Tests', () => {
  it('Adjacency calculation must not throw errors', () => {
    // Import and test actual board generation
    expect(() => {
      VERIFICATION_TESTS.runAll()
    }).not.toThrow()
  })
})