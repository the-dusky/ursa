/**
 * Board3D - 3D representation of the circular game board
 *
 * The board consists of 5 concentric rings that can rotate independently.
 * Each ring is divided into spaces based on quadrants (Mountains, Pastures, Forests, Riverlands).
 * The center contains the bridge system connecting the quadrants.
 */

'use client'

import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line, Text } from '@react-three/drei'
import type { GameBoard, Player, GameSpace } from '../../state/CoreGameState'
import { Bear3D } from './Bear3D'
import { HoneyJug3D } from './HoneyJug3D'
import { Cave3D } from './Cave3D'

// Ring configuration matching the game engine
const RING_CONFIGS = [
  { ring: 1, spaceCount: 20, innerRadius: 1.2, outerRadius: 2.0 },
  { ring: 2, spaceCount: 24, innerRadius: 2.0, outerRadius: 3.0 },
  { ring: 3, spaceCount: 28, innerRadius: 3.0, outerRadius: 4.2 },
  { ring: 4, spaceCount: 32, innerRadius: 4.2, outerRadius: 5.6 },
  { ring: 5, spaceCount: 36, innerRadius: 5.6, outerRadius: 7.2 },
]

// Base colors for each quadrant
// Layout (counter-clockwise from NW): Pastures (W) → Forests (S) → Riverlands (E) → Mountains (N)
// R1-1 is at NW corner of Pastures, positions increase counter-clockwise
const QUADRANT_COLORS: { [key: string]: string } = {
  'Forests': '#166534',    // Dark green - where honey spawns
  'Riverlands': '#3b82f6', // Blue
  'Pastures': '#b8860b',   // Dull yellow-brown (wheat field)
  'Mountains': '#6b7280',  // Gray
  'Bridge': '#78716c',     // Stone gray
}

// Secondary colors for biome patterns
const QUADRANT_ACCENT_COLORS: { [key: string]: string } = {
  'Mountains': '#9ca3af',  // Lighter gray for snow caps
  'Riverlands': '#60a5fa', // Lighter blue for water shimmer
  'Pastures': '#d4a84b',   // Lighter wheat/golden for field patches
  'Forests': '#14532d',    // Darker green for tree shadows
  'Bridge': '#a8a29e',     // Stone accent
}

interface Board3DProps {
  board: GameBoard
  players: Player[]
  rotations: number[]
  showArena?: boolean
  showSpaceIds?: boolean
}

/**
 * Thin black line drawn on top of spaces to show space divisions
 * Using drei's Line component for thicker lines
 */
function SpaceDividerLine({
  angle,
  innerRadius,
  outerRadius,
  ringHeight,
}: {
  angle: number
  innerRadius: number
  outerRadius: number
  ringHeight: number
}) {
  const points: [number, number, number][] = useMemo(() => [
    [
      Math.cos(angle) * innerRadius,
      ringHeight + 0.006,
      Math.sin(angle) * innerRadius
    ],
    [
      Math.cos(angle) * outerRadius,
      ringHeight + 0.006,
      Math.sin(angle) * outerRadius
    ],
  ], [angle, innerRadius, outerRadius, ringHeight])

  return (
    <Line
      points={points}
      color="#000000"
      lineWidth={2}
    />
  )
}

/**
 * Single space segment on a ring
 * Biome artwork will be part of the space texture - only special tokens (honey) are 3D pieces
 */
function RingSpace({
  space,
  ringIndex,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  height = 0.15,
  showSpaceId = false,
  cavePlayerColor,
}: {
  space: GameSpace
  ringIndex: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  height?: number
  showSpaceId?: boolean
  cavePlayerColor?: string // If set, this space has a cave with this player's color
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Create the sector geometry
  // COORDINATE SYSTEM NOTE (DO NOT CHANGE):
  // - The shape uses y = -sin(angle) to flip the geometry visually
  // - After rotation by -PI/2, shape's Y becomes world Z
  // - Items (honey, caves, labels) use POSITIVE sin: centerZ = sin(angle)
  // - This mismatch is intentional: geometry flip + item position = correct visual alignment
  // - If you change this, the board colors will be correct but items will appear on wrong spaces
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const segments = 8

    // Inner arc
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments)
      const x = Math.cos(angle) * innerRadius
      const y = -Math.sin(angle) * innerRadius  // Negate Y to flip North/South
      if (i === 0) {
        shape.moveTo(x, y)
      } else {
        shape.lineTo(x, y)
      }
    }

    // Outer arc (reverse direction)
    for (let i = segments; i >= 0; i--) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments)
      const x = Math.cos(angle) * outerRadius
      const y = -Math.sin(angle) * outerRadius  // Negate Y to flip North/South
      shape.lineTo(x, y)
    }

    shape.closePath()

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false, // Disabled to remove the fence-like borders between rings
    }

    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [innerRadius, outerRadius, startAngle, endAngle, height])

  const baseColor = QUADRANT_COLORS[space.quadrant] || '#888888'

  // Check if space has honey (only exists in forests)
  const isHoney = space.hasHoney

  // Calculate center position for items (honey, caves, labels)
  // DO NOT NEGATE centerZ - see coordinate system note above
  const centerAngle = (startAngle + endAngle) / 2
  const centerRadius = (innerRadius + outerRadius) / 2
  const centerX = Math.cos(centerAngle) * centerRadius
  const centerZ = Math.sin(centerAngle) * centerRadius  // MUST be positive sin

  const itemPos: [number, number, number] = [centerX, height + 0.02, centerZ]

  // Calculate cave position at the outer-right corner of the space
  // Offset toward outer edge and toward the right edge angle
  const caveAngle = endAngle - (endAngle - startAngle) * 0.15 // Near right edge
  const caveRadius = outerRadius - (outerRadius - innerRadius) * 0.25 // Near outer edge
  const caveX = Math.cos(caveAngle) * caveRadius
  const caveZ = Math.sin(caveAngle) * caveRadius
  const cavePos: [number, number, number] = [caveX, height + 0.02, caveZ]

  // Calculate rotation for cave to face outward from center
  const caveRotation = -caveAngle + Math.PI // Face away from center

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={baseColor}
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>

      {/* Honey jug on spaces with honey */}
      {isHoney && (
        <HoneyJug3D
          position={itemPos}
          scale={1.4 + (ringIndex * 0.1)}
        />
      )}

      {/* Cave entrance on mountain spaces with caves - positioned at outer-right corner */}
      {cavePlayerColor && (
        <>
          <Cave3D
            position={cavePos}
            rotation={caveRotation}
            scale={1.0 + (ringIndex * 0.1)}
            playerColor={cavePlayerColor}
          />
          {/* Bear at the center of the space (next to their cave) */}
          <Bear3D
            piece={{
              id: `bear-cave-${cavePlayerColor}`,
              playerId: cavePlayerColor, // Will be matched by color
              spaceId: space.id,
              type: 'bear',
              energy: 10,
              fat: 0,
              emergencyEnergy: 0,
              bearTurn: 0,
              resources: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 },
              isHibernating: false,
            }}
            players={[{ id: cavePlayerColor, name: '', color: cavePlayerColor, pieces: [], resources: { grains: 0, berries: 0, salmon: 0, honey: 0, bearMeat: 0 } }]}
            position={[centerX, height + 0.12, centerZ]}
          />
        </>
      )}

      {/* Space ID label */}
      {showSpaceId && (
        <Text
          position={[centerX, height + 0.05, centerZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {space.id}
        </Text>
      )}
    </group>
  )
}

/**
 * A single ring containing multiple spaces
 */
function Ring3D({
  ringConfig,
  spaces,
  rotation,
  players,
  showSpaceIds = false,
  caveAssignments = {},
}: {
  ringConfig: typeof RING_CONFIGS[0]
  spaces: GameSpace[]
  rotation: number
  players: Player[]
  showSpaceIds?: boolean
  caveAssignments?: { [spaceId: string]: string } // spaceId -> playerColor
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [currentRotation, setCurrentRotation] = useState(0)

  // Sort spaces by position
  const sortedSpaces = useMemo(() => {
    return [...spaces].sort((a, b) => a.position - b.position)
  }, [spaces])

  // Calculate target rotation in radians (each unit is one space width)
  const targetRotation = (rotation * 2 * Math.PI) / ringConfig.spaceCount
  const anglePerSpace = (2 * Math.PI) / ringConfig.spaceCount

  // Animate rotation smoothly
  useFrame((_, delta) => {
    if (groupRef.current) {
      const diff = targetRotation - currentRotation
      if (Math.abs(diff) > 0.001) {
        // Smooth interpolation with speed factor
        const speed = 3 // Adjust for faster/slower animation
        const step = diff * Math.min(delta * speed, 1)
        const newRotation = currentRotation + step
        setCurrentRotation(newRotation)
        groupRef.current.rotation.y = newRotation
      }
    }
  })

  return (
    <group ref={groupRef} rotation={[0, currentRotation, 0]}>
      {sortedSpaces.map((space) => {
        // Use the space's stored angles from game engine (already has correct 3π/4 offset)
        // This ensures 3D board matches 2D board exactly
        const startAngle = space.edgeAngles?.left ?? (space.centerAngle - anglePerSpace / 2)
        const endAngle = space.edgeAngles?.right ?? (space.centerAngle + anglePerSpace / 2)

        const ringHeight = 0.1 + ringConfig.ring * 0.02
        return (
          <group key={space.id}>
            <RingSpace
              space={space}
              ringIndex={ringConfig.ring}
              innerRadius={ringConfig.innerRadius + 0.02}
              outerRadius={ringConfig.outerRadius - 0.02}
              startAngle={startAngle}
              endAngle={endAngle}
              height={ringHeight}
              showSpaceId={showSpaceIds}
              cavePlayerColor={caveAssignments[space.id]}
            />
            {/* Thin black line to divide spaces */}
            <SpaceDividerLine
              angle={startAngle}
              innerRadius={ringConfig.innerRadius}
              outerRadius={ringConfig.outerRadius}
              ringHeight={ringHeight}
            />
            {/* Render bear if space has a piece */}
            {space.piece && (
              <Bear3D
                piece={space.piece}
                players={players}
                position={calculateSpacePosition(
                  space.centerAngle,
                  (ringConfig.innerRadius + ringConfig.outerRadius) / 2,
                  0.12 + ringConfig.ring * 0.02
                )}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}

/**
 * Calculate 3D position for a space center
 */
function calculateSpacePosition(angle: number, radius: number, baseHeight: number = 0.2): [number, number, number] {
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const y = baseHeight + 0.1 // Slightly above the board
  return [x, y, z]
}

/**
 * Crossing Bridges - Flat bridges connecting biomes through the center
 * This is the default state when no combat is occurring
 */
function CrossingBridges({ bridges, players }: { bridges: { [key: string]: GameSpace }, players: Player[] }) {
  const bridgeWidth = 0.3
  const bridgeHeight = 0.08
  const bridgeY = 0.04

  // Bridge extends from inner edge of ring 1 through center to opposite side
  const ring1Inner = RING_CONFIGS[0].innerRadius
  const bridgeLength = ring1Inner * 2 // Full diameter through center

  return (
    <group>
      {/* Two crossing bridges - one connects Pastures-Riverlands, one connects Mountains-Forests */}
      {[0, 1].map((i) => {
        // Use same 3π/4 offset as game engine
        // Biome centers: Pastures at π (West), Mountains at 3π/2 (North), Riverlands at 0 (East), Forests at π/2 (South)
        const angle = (i * Math.PI / 2) + Math.PI  // Through biome centers with 3π/4 base

        return (
          <group key={i}>
            {/* Main bridge plank */}
            <mesh
              position={[0, bridgeY, 0]}
              rotation={[0, angle, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[bridgeLength, bridgeHeight, bridgeWidth]} />
              <meshStandardMaterial color="#8B7355" roughness={0.9} metalness={0} />
            </mesh>

            {/* Wood plank lines (decorative) */}
            {[-0.1, 0, 0.1].map((offset, j) => (
              <mesh
                key={j}
                position={[
                  Math.cos(angle + Math.PI/2) * offset,
                  bridgeY + bridgeHeight/2 + 0.002,
                  Math.sin(angle + Math.PI/2) * offset
                ]}
                rotation={[-Math.PI/2, 0, angle]}
              >
                <planeGeometry args={[bridgeLength - 0.05, 0.02]} />
                <meshStandardMaterial color="#5D4037" roughness={1} />
              </mesh>
            ))}

            {/* Low railings on both sides */}
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[
                  Math.cos(angle + Math.PI/2) * (bridgeWidth/2 + 0.02) * side,
                  bridgeY + bridgeHeight/2 + 0.03,
                  Math.sin(angle + Math.PI/2) * (bridgeWidth/2 + 0.02) * side
                ]}
                rotation={[0, angle, 0]}
              >
                <boxGeometry args={[bridgeLength, 0.04, 0.02]} />
                <meshStandardMaterial color="#5D4037" roughness={0.85} />
              </mesh>
            ))}
          </group>
        )
      })}

      {/* Center intersection - slightly raised platform */}
      <mesh position={[0, bridgeY + 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, bridgeHeight + 0.02, 8]} />
        <meshStandardMaterial color="#6D5D4D" roughness={0.85} />
      </mesh>

      {/* Center marker */}
      <mesh position={[0, bridgeY + bridgeHeight/2 + 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.06, 6]} />
        <meshStandardMaterial color="#A67C52" roughness={0.7} />
      </mesh>

      {/* Bridge connection points to ring 1 (4 directions aligned with biome centers) */}
      {['NORTH', 'EAST', 'SOUTH', 'WEST'].map((direction, index) => {
        // Bridge entry points at biome centers - use same offset as game engine (3π/4)
        const angle = (index * Math.PI / 2) + Math.PI // Aligned with biome centers
        const connectionRadius = ring1Inner - 0.05

        const bridgeId = `R0-${direction}`
        const bridge = bridges[bridgeId]

        // Position for bear on bridge
        const bearX = Math.cos(angle) * (ring1Inner * 0.5)
        const bearZ = Math.sin(angle) * (ring1Inner * 0.5)

        return (
          <group key={direction}>
            {/* Connection ramp to ring */}
            <mesh
              position={[
                Math.cos(angle) * connectionRadius,
                bridgeY + 0.02,
                Math.sin(angle) * connectionRadius
              ]}
              rotation={[0, -angle + Math.PI/2, 0]}
            >
              <boxGeometry args={[bridgeWidth + 0.1, bridgeHeight + 0.04, 0.15]} />
              <meshStandardMaterial color="#7D6D5D" roughness={0.9} />
            </mesh>

            {/* Render bear if bridge has a piece */}
            {bridge?.piece && (
              <Bear3D
                piece={bridge.piece}
                players={players}
                position={[bearX, 0.18, bearZ]}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}

/**
 * Combat Arena Platform - Solid piece that sits on top during combat
 *
 * Design: A solid disc that fills the entire center circle area.
 * The bottom has a recessed cross that fits over the crossing bridges.
 * When placed down, it slots onto the bridges and sits elevated.
 * Platform extends over half of ring 1 with low walls around the edge.
 */
function CombatArenaPlatform({ visible }: { visible: boolean }) {
  if (!visible) return null

  // The pillar fills the entire center circle (inner radius of ring 1)
  const centerRadius = RING_CONFIGS[0].innerRadius
  const pillarHeight = 0.5   // ~1 inch in scale - elevated above bridges
  const platformHeight = 0.08
  const wallHeight = 0.12
  const baseY = 0.12         // Sits on top of the bridge area (recessed cross on bottom fits over bridges)
  const platformY = baseY + pillarHeight + platformHeight / 2

  // Platform extends over half of ring 1
  const platformRadius = RING_CONFIGS[0].innerRadius + (RING_CONFIGS[0].outerRadius - RING_CONFIGS[0].innerRadius) / 2

  return (
    <group>
      {/* Solid cylindrical base - fills entire center circle */}
      <mesh position={[0, baseY + pillarHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[centerRadius - 0.02, centerRadius, pillarHeight, 32]} />
        <meshStandardMaterial color="#57534e" roughness={0.8} metalness={0.15} />
      </mesh>

      {/* Carved patterns on pillar - vertical grooves */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const grooveAngle = (i * Math.PI / 4)
        const grooveX = Math.cos(grooveAngle) * (centerRadius - 0.04)
        const grooveZ = Math.sin(grooveAngle) * (centerRadius - 0.04)
        return (
          <mesh key={i} position={[grooveX, baseY + pillarHeight / 2, grooveZ]} rotation={[0, -grooveAngle, 0]}>
            <boxGeometry args={[0.02, pillarHeight * 0.7, 0.08]} />
            <meshStandardMaterial color="#44403c" roughness={0.85} />
          </mesh>
        )
      })}

      {/* Transition ledge from pillar to platform */}
      <mesh position={[0, baseY + pillarHeight + 0.02, 0]}>
        <cylinderGeometry args={[centerRadius + 0.1, centerRadius, 0.04, 32]} />
        <meshStandardMaterial color="#4a4541" roughness={0.75} />
      </mesh>

      {/* Main platform on top - extends over half of ring 1 */}
      <mesh position={[0, platformY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[platformRadius, platformRadius - 0.05, platformHeight, 32]} />
        <meshStandardMaterial color="#d4a574" roughness={0.95} metalness={0} />
      </mesh>

      {/* Platform floor pattern - outer combat ring */}
      <mesh position={[0, platformY + platformHeight/2 + 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshStandardMaterial color="#c4956a" roughness={0.9} />
      </mesh>
      {/* Platform floor pattern - inner combat ring */}
      <mesh position={[0, platformY + platformHeight/2 + 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.0, 1.1, 32]} />
        <meshStandardMaterial color="#c4956a" roughness={0.9} />
      </mesh>

      {/* Low walls around the edge */}
      <mesh position={[0, platformY + platformHeight/2 + wallHeight/2, 0]}>
        <cylinderGeometry args={[platformRadius, platformRadius, wallHeight, 32, 1, true]} />
        <meshStandardMaterial color="#57534e" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Corner pillars with torches - positioned between biomes */}
      {[0, 1, 2, 3].map((i) => {
        const pillarAngle = (i * Math.PI / 2) + Math.PI / 4  // 45° offset - between biome centers
        const pillarX = Math.cos(pillarAngle) * (platformRadius - 0.05)
        const pillarZ = Math.sin(pillarAngle) * (platformRadius - 0.05)

        return (
          <group key={i}>
            <mesh position={[pillarX, platformY + platformHeight/2 + wallHeight/2 + 0.05, pillarZ]}>
              <cylinderGeometry args={[0.06, 0.07, wallHeight + 0.1, 8]} />
              <meshStandardMaterial color="#292524" roughness={0.7} metalness={0.3} />
            </mesh>
            {/* Torch on pillar */}
            <mesh position={[pillarX, platformY + platformHeight/2 + wallHeight + 0.15, pillarZ]}>
              <coneGeometry args={[0.04, 0.1, 8]} />
              <meshStandardMaterial
                color="#f97316"
                emissive="#ea580c"
                emissiveIntensity={0.8}
                roughness={0.5}
              />
            </mesh>
            {/* Torch glow (point light effect with a small sphere) */}
            <mesh position={[pillarX, platformY + platformHeight/2 + wallHeight + 0.18, pillarZ]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#fbbf24"
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>
        )
      })}

      {/* Center combat marker - hexagonal */}
      <mesh position={[0, platformY + platformHeight/2 + 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.15, 6]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#b91c1c"
          emissiveIntensity={0.4}
          roughness={0.4}
        />
      </mesh>
      {/* Inner marker */}
      <mesh position={[0, platformY + platformHeight/2 + 0.025, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.08, 6]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

/**
 * Center Area - Shows crossing bridges normally, arena platform during combat
 */
function CenterArea({
  bridges,
  players,
  showArena = false
}: {
  bridges: { [key: string]: GameSpace }
  players: Player[]
  showArena?: boolean
}) {
  return (
    <group>
      {/* Always show crossing bridges underneath */}
      <CrossingBridges bridges={bridges} players={players} />

      {/* Show arena platform on top during combat */}
      <CombatArenaPlatform visible={showArena} />
    </group>
  )
}


/**
 * Main Board3D component
 */
export function Board3D({ board, players, rotations, showArena = false, showSpaceIds = false }: Board3DProps) {
  const boardRef = useRef<THREE.Group>(null)

  // Organize spaces by ring
  const spacesByRing = useMemo(() => {
    const result: { [ring: number]: GameSpace[] } = {}
    Object.values(board.spaces).forEach(space => {
      if (!result[space.ring]) {
        result[space.ring] = []
      }
      result[space.ring].push(space)
    })
    return result
  }, [board.spaces])

  // Generate cave assignments - one random mountain space per player
  // RULE: No two caves can be on the same ring (each player gets a different ring)
  // Uses a seeded random based on player IDs for consistency across renders
  // Bears are rendered inside RingSpace next to their caves so they rotate with the board
  const caveAssignments = useMemo(() => {
    const assignments: { [spaceId: string]: string } = {}

    if (players.length === 0) return assignments

    // Get all mountain spaces grouped by ring
    const mountainSpaces = Object.values(board.spaces).filter(
      space => space.quadrant === 'Mountains'
    )

    if (mountainSpaces.length === 0) return assignments

    // Group mountain spaces by ring
    const spacesByRing: { [ring: number]: typeof mountainSpaces } = {}
    mountainSpaces.forEach(space => {
      if (!spacesByRing[space.ring]) {
        spacesByRing[space.ring] = []
      }
      spacesByRing[space.ring].push(space)
    })

    // Get available rings (1-5)
    const availableRings = Object.keys(spacesByRing).map(Number).sort((a, b) => a - b)

    // Create a simple seeded random based on player IDs for consistency
    const seed = players.map(p => p.id).join('').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index * 9999) * 10000
      return x - Math.floor(x)
    }

    // Shuffle rings deterministically
    const shuffledRings = [...availableRings].sort((a, b) => {
      return seededRandom(a + seed) - seededRandom(b + seed)
    })

    // Assign one cave per player, each on a different ring
    players.forEach((player, playerIndex) => {
      if (playerIndex < shuffledRings.length) {
        const ring = shuffledRings[playerIndex]
        const ringSpaces = spacesByRing[ring]

        // Pick a random space within this ring
        const shuffledSpaces = [...ringSpaces].sort((a, b) => {
          const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), seed + playerIndex)
          const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), seed + playerIndex)
          return seededRandom(hashA) - seededRandom(hashB)
        })

        if (shuffledSpaces.length > 0) {
          const spaceId = shuffledSpaces[0].id
          assignments[spaceId] = player.color
        }
      }
    })

    return assignments
  }, [board.spaces, players])

  return (
    <group ref={boardRef}>
      {/* Base plate with subtle texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[7.5, 64]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Render each ring */}
      {RING_CONFIGS.map((ringConfig, index) => (
        <Ring3D
          key={ringConfig.ring}
          ringConfig={ringConfig}
          spaces={spacesByRing[ringConfig.ring] || []}
          rotation={rotations[index] || 0}
          players={players}
          showSpaceIds={showSpaceIds}
          caveAssignments={caveAssignments}
        />
      ))}


      {/* Center crossing bridges (arena platform shown during combat) */}
      <CenterArea bridges={board.bridges} players={players} showArena={showArena} />

      {/* Outer rim with wood texture look */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[7.2, 7.5, 64]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Outer rim accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <ringGeometry args={[7.35, 7.45, 64]} />
        <meshStandardMaterial color="#92400e" roughness={0.5} metalness={0.15} />
      </mesh>
    </group>
  )
}

export default Board3D
