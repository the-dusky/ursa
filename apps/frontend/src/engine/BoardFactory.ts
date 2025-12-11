/**
 * Board Factory - Pure Board Generation Logic
 * 
 * This factory handles all board creation logic including:
 * - Ring and space generation
 * - Adjacency calculations
 * - Bridge system creation
 * - Biome distribution and rotation
 */

import type { QuadrantType, SubAreaType } from './types'
import { areSpacesAdjacent, VERIFICATION_TESTS } from './AdjacencyCalculator'

export interface BoardSpace {
  id: string
  ring: number // 0 for bridge spaces
  position: number
  centerAngle: number
  edgeAngles?: {
    left: number
    right: number
  }
  quadrant: QuadrantType
  subArea?: SubAreaType
  canProduce: boolean
  hasHoney?: boolean
  adjacentSpaces: string[]
}

export interface BoardRing {
  spaceCount: number
  radius: number
}

export interface Board {
  spaces: { [spaceId: string]: BoardSpace }
  rings: { [ring: number]: BoardRing }
  bridges: { [bridgeId: string]: BoardSpace }
  rotations: number[]
}

export interface BoardConfig {
  ringConfigs: Array<{
    ring: number
    spaceCount: number
    radius: number
  }>
  biomes: QuadrantType[]
  bridgeSystem: {
    enabled: boolean
    tunnelMode: boolean // true = East-West tunnel, false = full cross
  }
  honeySpaces: number
}

export class BoardFactory {
  /**
   * Create a complete board with the given configuration and rotations
   */
  static createBoard(config: BoardConfig, rotations: number[] = [0, 0, 0, 0, 0]): Board {
    const spaces: { [spaceId: string]: BoardSpace } = {}
    const rings: { [ring: number]: BoardRing } = {}
    const bridges: { [bridgeId: string]: BoardSpace } = {}

    // Create ring spaces
    config.ringConfigs.forEach(({ ring, spaceCount, radius }) => {
      rings[ring] = { spaceCount, radius }
      
      // Calculate how many spaces per biome (exactly 25% each)
      const spacesPerBiome = spaceCount / 4
      
      for (let position = 1; position <= spaceCount; position++) {
        // Apply ring rotation (handle negative rotations)
        const rotation = rotations[ring - 1] || 0
        
        const rotatedBiomePosition = ((position - 1 - rotation + spaceCount) % spaceCount) + 1
        const rotatedBiomeIndex = Math.floor((rotatedBiomePosition - 1) / spacesPerBiome)
        const finalQuadrant = config.biomes[rotatedBiomeIndex]
        
        // Debug: Log rotation for first position of each ring
        if (position === 1) {
          console.log(`Ring ${ring}: rotation ${rotation} spaces (from rotations[${ring - 1}])`)
          console.log(`  Example: Position 1 was ${config.biomes[0]}, now ${finalQuadrant}`)
        }
        
        // Calculate angle for this position
        // Counter-clockwise direction: negate position-based angle
        // Offset 5π/4 (225°) so that R1-18 is at North (270°), R1-8 at South (90°)
        // Biomes: Pastures (W, R1-1 to R1-5) → Forests (S, R1-6 to R1-10) → Riverlands (E, R1-11 to R1-15) → Mountains (N, R1-16 to R1-20)
        const anglePerSpace = (2 * Math.PI) / spaceCount
        const baseAngle = -((position - 0.5) / spaceCount) * 2 * Math.PI + (5 * Math.PI / 4)
        const angle = baseAngle

        // Calculate corner angles for this space (sector/trapezoid)
        // For counter-clockwise, "left" is the higher angle, "right" is lower
        const leftAngle = angle + anglePerSpace / 2
        const rightAngle = angle - anglePerSpace / 2
        
        const spaceId = `R${ring}-${position}`
        
        spaces[spaceId] = {
          id: spaceId,
          ring,
          position,
          centerAngle: angle,
          edgeAngles: {
            left: leftAngle,
            right: rightAngle
          },
          quadrant: finalQuadrant,
          subArea: finalQuadrant === 'Mountains' ? BoardFactory.getMountainSubArea(ring) : undefined,
          canProduce: finalQuadrant !== 'Mountains',
          hasHoney: false,
          adjacentSpaces: [] // Will be calculated below
        }
      }
    })

    // Create bridge system if enabled
    if (config.bridgeSystem.enabled) {
      BoardFactory.createBridgeSystem(bridges, config.bridgeSystem.tunnelMode)
    }

    // Set up adjacencies using pre-defined patterns
    BoardFactory.setupAdjacencies(spaces, rings, bridges)

    // Add honey to random forest spaces
    if (config.honeySpaces > 0) {
      BoardFactory.addHoneySpaces(spaces, config.honeySpaces)
    }

    // Debug: Log sample spaces to show the structure with rotations
    console.log('Board created with rotations:', rotations)
    
    const sampleSpace = Object.values(spaces).find(s => s.id === 'R3-4')
    if (sampleSpace) {
      console.log('Sample space R3-4:', {
        id: sampleSpace.id,
        ring: sampleSpace.ring,
        position: sampleSpace.position,
        centerAngle: `${(sampleSpace.centerAngle * 180 / Math.PI).toFixed(1)}°`,
        quadrant: sampleSpace.quadrant,
        adjacentSpaces: sampleSpace.adjacentSpaces
      })
      
      // Show details of adjacent spaces
      sampleSpace.adjacentSpaces.forEach(adjId => {
        const adjSpace = spaces[adjId] || bridges[adjId]
        if (adjSpace) {
          console.log(`  -> ${adjId}: ${adjSpace.quadrant} at ${(adjSpace.centerAngle * 180 / Math.PI).toFixed(1)}°`)
        }
      })
    }

    return { spaces, rings, bridges, rotations }
  }

  /**
   * Get ring rotations from dice rolls or configuration
   */
  static getRingRotations(config?: number[], useDiceRolls?: boolean): number[] {
    // If a specific configuration is provided, use it
    if (config && config.length === 5) {
      return config
    }
    
    // Use dice-based ring rotation system
    if (useDiceRolls) {
      return BoardFactory.generateDiceBasedRotations()
    }
    
    // Default: no rotations
    return [0, 0, 0, 0, 0]
  }

  /**
   * Generate dice-based rotations
   */
  private static generateDiceBasedRotations(): number[] {
    const rollD6 = () => Math.floor(Math.random() * 6) + 1
    
    // Roll 1: Position dice (1-6)
    const positionRolls = Array(5).fill(0).map(() => rollD6())
    
    // Roll 2: Direction dice (1-3 = negative, 4-6 = positive)
    const directionRolls = Array(5).fill(0).map(() => rollD6())
    
    // Convert to rotations (dice 1 = no rotation, 2-6 = 1-5 rotations)
    const rotations = positionRolls.map((position, index) => {
      const direction = directionRolls[index]
      const isPositive = direction >= 4 // 4,5,6 = positive (clockwise)
      const rotationAmount = position - 1 // Convert 1-6 dice to 0-5 rotations
      return isPositive ? rotationAmount : -rotationAmount
    })
    
    console.log('Dice-based ring rotations:')
    console.log('Position rolls:', positionRolls)
    console.log('Direction rolls:', directionRolls)
    console.log('Final rotations:', rotations)
    
    return rotations
  }

  /**
   * Create bridge system
   */
  private static createBridgeSystem(bridges: { [bridgeId: string]: BoardSpace }, tunnelMode: boolean) {
    // Center bridge space - tunnel is horizontal rectangle, so calculate edge angles
    const tunnelWidth = 40 // From GameBoard.tsx
    const centerX = 400
    const centerY = 400
    
    // Calculate angular width of the tunnel at Ring 1 radius (60px)
    const ring1Radius = 60
    const tunnelAngularHalfWidth = Math.atan(tunnelWidth / 2 / ring1Radius)
    const boardRotation = 3 * Math.PI / 4 // Same rotation as board spaces
    
    if (tunnelMode) {
      // Tunnel mode: center only connects East-West
      bridges['R0-CENTER'] = {
        id: 'R0-CENTER',
        ring: 0,
        position: 0,
        centerAngle: boardRotation,  // 135° to match ring coordinate system
        edgeAngles: {
          left: -tunnelAngularHalfWidth + boardRotation,  // Left edge of horizontal tunnel
          right: tunnelAngularHalfWidth + boardRotation   // Right edge of horizontal tunnel
        },
        quadrant: 'Bridge',
        subArea: 'Center',
        canProduce: false,
        hasHoney: false,
        adjacentSpaces: ['R0-EAST', 'R0-WEST']
      }
    } else {
      // Full cross mode: center connects to all arms - covers full 360°
      bridges['R0-CENTER'] = {
        id: 'R0-CENTER',
        ring: 0,
        position: 0,
        centerAngle: boardRotation,  // 135° to match ring coordinate system  
        edgeAngles: {
          left: -Math.PI + boardRotation,  // Full circle
          right: Math.PI + boardRotation
        },
        quadrant: 'Bridge',
        subArea: 'Center',
        canProduce: false,
        hasHoney: false,
        adjacentSpaces: ['R0-NORTH', 'R0-EAST', 'R0-SOUTH', 'R0-WEST']
      }
    }
    
    // Bridge arms - align with ring space coordinate system
    // R0-NORTH should align with R1-8 (270°), etc.
    const bridgeArms = [
      { id: 'R0-NORTH', subArea: 'North', angle: 3 * Math.PI / 2 },  // 270° to match R1-8
      { id: 'R0-EAST', subArea: 'East', angle: 0 },                  // 0° to align with "right" spaces
      { id: 'R0-SOUTH', subArea: 'South', angle: Math.PI / 2 },      // 90° to align with "bottom" spaces  
      { id: 'R0-WEST', subArea: 'West', angle: Math.PI }             // 180° to align with "left" spaces
    ]
    
    bridgeArms.forEach((arm, index) => {
      // Set up bridge connections based on mode
      const adjacentSpaces: string[] = []
      
      if (tunnelMode) {
        if (arm.subArea === 'North') {
          adjacentSpaces.push('R0-SOUTH') // North connects directly to South (overland)
        } else if (arm.subArea === 'South') {
          adjacentSpaces.push('R0-NORTH') // South connects directly to North (overland)
        } else if (arm.subArea === 'East') {
          adjacentSpaces.push('R0-CENTER') // East connects to tunnel
        } else if (arm.subArea === 'West') {
          adjacentSpaces.push('R0-CENTER') // West connects to tunnel
        }
      } else {
        adjacentSpaces.push('R0-CENTER') // All arms connect to center
      }
      
      // Calculate edge angles for rectangular bridge arms
      // Bridge arms extend from center (radius 20) to Ring 1 (radius 60)
      const armLength = 40 // 60 - 20
      const ring1SpaceCount = 20
      const ring1SpaceWidthAtInnerEdge = (2 * Math.PI * ring1Radius) / ring1SpaceCount
      const armWidth = ring1SpaceWidthAtInnerEdge // ~18.85px
      
      // Calculate angular width based on arm width at the connection point to Ring 1
      const armAngularHalfWidth = Math.atan(armWidth / 2 / ring1Radius)
      
      bridges[arm.id] = {
        id: arm.id,
        ring: 0,
        position: index + 1,
        centerAngle: arm.angle,
        edgeAngles: {
          left: arm.angle - armAngularHalfWidth,
          right: arm.angle + armAngularHalfWidth
        },
        quadrant: 'Bridge',
        subArea: arm.subArea as SubAreaType,
        canProduce: false,
        hasHoney: false,
        adjacentSpaces
      }
    })
  }

  /**
   * Set up adjacencies using the ISOLATED AdjacencyCalculator
   * DO NOT MODIFY - Uses immutable adjacency logic
   */
  private static setupAdjacencies(
    spaces: { [spaceId: string]: BoardSpace },
    rings: { [ring: number]: BoardRing },
    bridges: { [bridgeId: string]: BoardSpace }
  ) {
    // RUN VERIFICATION TESTS FIRST - Fail fast if logic is broken
    VERIFICATION_TESTS.runAll()
    
    // Clear any existing adjacencies
    Object.values(spaces).forEach(space => space.adjacentSpaces = [])
    
    // Set up ring space adjacencies using IMMUTABLE calculator
    Object.values(spaces).forEach(space => {
      const adjacentSpaces: string[] = []
      const ringData = rings[space.ring]
      
      // Same ring adjacencies (left and right neighbors) - always position-based
      const prevPosition = space.position === 1 ? ringData.spaceCount : space.position - 1
      const nextPosition = space.position === ringData.spaceCount ? 1 : space.position + 1
      
      adjacentSpaces.push(`R${space.ring}-${prevPosition}`)
      adjacentSpaces.push(`R${space.ring}-${nextPosition}`)
      
      // Cross-ring adjacencies using IMMUTABLE areSpacesAdjacent function
      const allSpaces = Object.values(spaces)
      const adjacentRings = [space.ring - 1, space.ring + 1].filter(ring => ring > 0 && ring <= Object.keys(rings).length)
      
      adjacentRings.forEach(targetRing => {
        const targetSpaces = allSpaces.filter(s => s.ring === targetRing)
        
        targetSpaces.forEach(targetSpace => {
          if (areSpacesAdjacent(space, targetSpace)) {
            adjacentSpaces.push(targetSpace.id)
          }
        })
      })
      
      // Remove duplicates and assign
      space.adjacentSpaces = [...new Set(adjacentSpaces)]
    })

    // Connect bridge arms to ring 1 spaces using IMMUTABLE areSpacesAdjacent function
    Object.values(bridges).forEach(bridge => {
      if (bridge.subArea !== 'Center') {
        const ring1Spaces = Object.values(spaces).filter(s => s.ring === 1)
        
        ring1Spaces.forEach(space => {
          if (areSpacesAdjacent(bridge, space)) {
            bridge.adjacentSpaces.push(space.id)
            space.adjacentSpaces.push(bridge.id)
          }
        })
      }
    })

    // Bridge-to-bridge connections are already set up in createBridgeSystem
  }


  /**
   * Add honey to random forest spaces
   */
  private static addHoneySpaces(spaces: { [spaceId: string]: BoardSpace }, count: number) {
    const forestSpaces = Object.values(spaces).filter(s => s.quadrant === 'Forests')
    const honeySpaces = forestSpaces.sort(() => Math.random() - 0.5).slice(0, count)
    honeySpaces.forEach(space => {
      space.hasHoney = true
    })
  }

  /**
   * Get mountain sub-area based on ring
   */
  private static getMountainSubArea(ring: number): SubAreaType {
    return ring <= 2 ? 'Caves' : 'Hunting Grounds'
  }
}