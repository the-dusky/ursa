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

export interface BoardSpace {
  id: string
  ring: number // 0 for bridge spaces
  position: number
  angle: number
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
        
        // Calculate angle for this position (FIXED - does not change with rotation)
        const angle = ((position - 0.5) / spaceCount) * 2 * Math.PI + 3*Math.PI/4
        
        const spaceId = `R${ring}-${position}`
        
        spaces[spaceId] = {
          id: spaceId,
          ring,
          position,
          angle,
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
        angle: `${(sampleSpace.angle * 180 / Math.PI).toFixed(1)}°`,
        quadrant: sampleSpace.quadrant,
        adjacentSpaces: sampleSpace.adjacentSpaces
      })
      
      // Show details of adjacent spaces
      sampleSpace.adjacentSpaces.forEach(adjId => {
        const adjSpace = spaces[adjId] || bridges[adjId]
        if (adjSpace) {
          console.log(`  -> ${adjId}: ${adjSpace.quadrant} at ${(adjSpace.angle * 180 / Math.PI).toFixed(1)}°`)
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
    // Center bridge space
    if (tunnelMode) {
      // Tunnel mode: center only connects East-West
      bridges['BRIDGE-CENTER'] = {
        id: 'BRIDGE-CENTER',
        ring: 0,
        position: 0,
        angle: 0,
        quadrant: 'Bridge',
        subArea: 'Center',
        canProduce: false,
        hasHoney: false,
        adjacentSpaces: ['BRIDGE-EAST', 'BRIDGE-WEST']
      }
    } else {
      // Full cross mode: center connects to all arms
      bridges['BRIDGE-CENTER'] = {
        id: 'BRIDGE-CENTER',
        ring: 0,
        position: 0,
        angle: 0,
        quadrant: 'Bridge',
        subArea: 'Center',
        canProduce: false,
        hasHoney: false,
        adjacentSpaces: ['BRIDGE-NORTH', 'BRIDGE-EAST', 'BRIDGE-SOUTH', 'BRIDGE-WEST']
      }
    }
    
    // Bridge arms
    const bridgeArms = [
      { id: 'BRIDGE-NORTH', subArea: 'North', angle: -Math.PI / 2 },
      { id: 'BRIDGE-EAST', subArea: 'East', angle: 0 },
      { id: 'BRIDGE-SOUTH', subArea: 'South', angle: Math.PI / 2 },
      { id: 'BRIDGE-WEST', subArea: 'West', angle: Math.PI }
    ]
    
    bridgeArms.forEach((arm, index) => {
      // Set up bridge connections based on mode
      const adjacentSpaces: string[] = []
      
      if (tunnelMode) {
        if (arm.subArea === 'North') {
          adjacentSpaces.push('BRIDGE-SOUTH') // North connects directly to South (overland)
        } else if (arm.subArea === 'South') {
          adjacentSpaces.push('BRIDGE-NORTH') // South connects directly to North (overland)
        } else if (arm.subArea === 'East') {
          adjacentSpaces.push('BRIDGE-CENTER') // East connects to tunnel
        } else if (arm.subArea === 'West') {
          adjacentSpaces.push('BRIDGE-CENTER') // West connects to tunnel
        }
      } else {
        adjacentSpaces.push('BRIDGE-CENTER') // All arms connect to center
      }
      
      bridges[arm.id] = {
        id: arm.id,
        ring: 0,
        position: index + 1,
        angle: arm.angle,
        quadrant: 'Bridge',
        subArea: arm.subArea as SubAreaType,
        canProduce: false,
        hasHoney: false,
        adjacentSpaces
      }
    })
  }

  /**
   * Set up adjacencies using angular-based logic that respects rotations
   */
  private static setupAdjacencies(
    spaces: { [spaceId: string]: BoardSpace },
    rings: { [ring: number]: BoardRing },
    bridges: { [bridgeId: string]: BoardSpace }
  ) {
    // Clear any existing adjacencies
    Object.values(spaces).forEach(space => space.adjacentSpaces = [])
    
    // Set up ring space adjacencies
    Object.values(spaces).forEach(space => {
      const adjacentSpaces: string[] = []
      const ringData = rings[space.ring]
      
      // Same ring adjacencies (left and right neighbors) - these are always based on position
      const prevPosition = space.position === 1 ? ringData.spaceCount : space.position - 1
      const nextPosition = space.position === ringData.spaceCount ? 1 : space.position + 1
      
      adjacentSpaces.push(`R${space.ring}-${prevPosition}`)
      adjacentSpaces.push(`R${space.ring}-${nextPosition}`)
      
      // For cross-ring adjacencies, we need to find spaces that are angularly adjacent
      // This ensures rotations work correctly
      
      // Helper to check if two angles are close enough to be adjacent
      const areAnglesAdjacent = (angle1: number, angle2: number, tolerance: number) => {
        const diff = Math.abs(angle1 - angle2)
        const wrappedDiff = Math.min(diff, 2 * Math.PI - diff)
        return wrappedDiff <= tolerance
      }
      
      // Check inner ring adjacencies
      if (space.ring > 1) {
        const innerRing = space.ring - 1
        const innerSpaces = Object.values(spaces).filter(s => s.ring === innerRing)
        
        // The tolerance is based on the angular size of spaces
        const tolerance = Math.PI / (ringData.spaceCount / 2) // Roughly the angular span of a space
        
        innerSpaces.forEach(innerSpace => {
          if (areAnglesAdjacent(space.angle, innerSpace.angle, tolerance)) {
            adjacentSpaces.push(innerSpace.id)
          }
        })
      }
      
      // Check outer ring adjacencies
      if (space.ring < Object.keys(rings).length) {
        const outerRing = space.ring + 1
        const outerSpaces = Object.values(spaces).filter(s => s.ring === outerRing)
        
        // The tolerance is based on the angular size of spaces
        const tolerance = Math.PI / (ringData.spaceCount / 2)
        
        outerSpaces.forEach(outerSpace => {
          if (areAnglesAdjacent(space.angle, outerSpace.angle, tolerance)) {
            adjacentSpaces.push(outerSpace.id)
          }
        })
      }
      
      // Remove duplicates and assign
      space.adjacentSpaces = [...new Set(adjacentSpaces)]
    })

    // Connect bridge arms to ring 1 spaces based on angular proximity
    Object.values(bridges).forEach(bridge => {
      if (bridge.subArea !== 'Center') {
        const ring1Spaces = Object.values(spaces).filter(s => s.ring === 1)
        
        // Find the closest ring 1 spaces to this bridge arm
        const sortedByDistance = ring1Spaces
          .map(space => {
            const diff = Math.abs(space.angle - bridge.angle)
            const distance = Math.min(diff, 2 * Math.PI - diff)
            return { space, distance }
          })
          .sort((a, b) => a.distance - b.distance)
        
        // Connect to the 2 closest spaces
        sortedByDistance.slice(0, 2).forEach(({ space }) => {
          bridge.adjacentSpaces.push(space.id)
          space.adjacentSpaces.push(bridge.id)
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