/**
 * Board3D - 3D representation of the circular game board
 *
 * The board consists of 5 concentric rings that can rotate independently.
 * Each ring is divided into spaces based on quadrants (Mountains, Pastures, Forests, Riverlands).
 * The center contains the bridge system connecting the quadrants.
 */

'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import type { GameBoard, Player, GameSpace } from '../../state/CoreGameState'
import { Bear3D } from './Bear3D'

// Ring configuration matching the game engine
const RING_CONFIGS = [
  { ring: 1, spaceCount: 20, innerRadius: 1.2, outerRadius: 2.0 },
  { ring: 2, spaceCount: 24, innerRadius: 2.0, outerRadius: 3.0 },
  { ring: 3, spaceCount: 28, innerRadius: 3.0, outerRadius: 4.2 },
  { ring: 4, spaceCount: 32, innerRadius: 4.2, outerRadius: 5.6 },
  { ring: 5, spaceCount: 36, innerRadius: 5.6, outerRadius: 7.2 },
]

// Base colors for each quadrant
// Layout (clockwise from top): Mountains (top), Riverlands (right), Pastures (bottom), Forests (left)
const QUADRANT_COLORS: { [key: string]: string } = {
  'Mountains': '#6b7280',  // Gray - top
  'Riverlands': '#3b82f6', // Blue - right side
  'Pastures': '#b8860b',   // Dull yellow-brown (wheat field) - bottom
  'Forests': '#166534',    // Dark green - left
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
 * Biome decoration element (tree, rock, wave, grass)
 */
function BiomeDecoration({
  quadrant,
  position,
  scale = 1,
}: {
  quadrant: string
  position: [number, number, number]
  scale?: number
}) {
  const decorationRef = useRef<THREE.Group>(null)

  // Different decorations based on biome
  if (quadrant === 'Forests') {
    // Simple tree shape (cone + cylinder)
    return (
      <group ref={decorationRef} position={position} scale={scale * 0.15}>
        {/* Tree trunk */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.3, 6]} />
          <meshStandardMaterial color="#5c4033" roughness={0.9} />
        </mesh>
        {/* Tree foliage */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <coneGeometry args={[0.25, 0.5, 6]} />
          <meshStandardMaterial color="#0f5132" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <coneGeometry args={[0.18, 0.35, 6]} />
          <meshStandardMaterial color="#0d6b3f" roughness={0.8} />
        </mesh>
      </group>
    )
  }

  if (quadrant === 'Mountains') {
    // Simple mountain/rock shape
    return (
      <group ref={decorationRef} position={position} scale={scale * 0.12}>
        {/* Rock/mountain peak */}
        <mesh position={[0, 0.2, 0]} rotation={[0, Math.random() * Math.PI, 0]} castShadow>
          <coneGeometry args={[0.3, 0.5, 5]} />
          <meshStandardMaterial color="#4b5563" roughness={0.95} />
        </mesh>
        {/* Snow cap */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <coneGeometry args={[0.15, 0.15, 5]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
        </mesh>
      </group>
    )
  }

  if (quadrant === 'Riverlands') {
    // Wave/water indication
    return (
      <group ref={decorationRef} position={position} scale={scale * 0.2}>
        {/* Water ripple */}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.15, 16]} />
          <meshStandardMaterial
            color="#93c5fd"
            transparent
            opacity={0.6}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.23, 16]} />
          <meshStandardMaterial
            color="#60a5fa"
            transparent
            opacity={0.4}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
      </group>
    )
  }

  if (quadrant === 'Pastures') {
    // Wheat stalks
    return (
      <group ref={decorationRef} position={position} scale={scale * 0.15}>
        {/* Wheat stalks */}
        {[0, 0.4, 0.8, 1.2, 1.6].map((rot, i) => (
          <group key={i}>
            {/* Stalk */}
            <mesh
              position={[Math.cos(rot * Math.PI) * 0.05, 0.12, Math.sin(rot * Math.PI) * 0.05]}
              rotation={[0.15, rot * Math.PI, 0]}
            >
              <boxGeometry args={[0.015, 0.18, 0.01]} />
              <meshStandardMaterial color="#c9a227" roughness={0.9} />
            </mesh>
            {/* Wheat head */}
            <mesh
              position={[Math.cos(rot * Math.PI) * 0.05, 0.22, Math.sin(rot * Math.PI) * 0.05]}
              rotation={[0.15, rot * Math.PI, 0]}
            >
              <cylinderGeometry args={[0.015, 0.01, 0.06, 6]} />
              <meshStandardMaterial color="#daa520" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  return null
}

/**
 * Single space segment on a ring with biome decorations
 */
function RingSpace({
  space,
  ringIndex,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  height = 0.15,
}: {
  space: GameSpace
  ringIndex: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  height?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Create the sector geometry
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const segments = 8

    // Inner arc
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments)
      const x = Math.cos(angle) * innerRadius
      const y = Math.sin(angle) * innerRadius
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
      const y = Math.sin(angle) * outerRadius
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

  // Highlight honey spaces
  const isHoney = space.hasHoney
  const emissiveColor = isHoney ? '#fbbf24' : '#000000'
  const emissiveIntensity = isHoney ? 0.4 : 0

  // Calculate center position for decoration
  const centerAngle = (startAngle + endAngle) / 2
  const centerRadius = (innerRadius + outerRadius) / 2
  const decorationPos: [number, number, number] = [
    Math.cos(centerAngle) * centerRadius,
    height + 0.02,
    Math.sin(centerAngle) * centerRadius,
  ]

  // Determine if this space should have a decoration (not all spaces)
  // Use space position to create a pseudo-random but consistent pattern
  const hasDecoration = (space.position % 3 === 0) && !space.piece

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
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Honey indicator */}
      {isHoney && (
        <mesh
          position={[decorationPos[0], height + 0.05, decorationPos[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.08, 6]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#fbbf24"
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      )}

      {/* Biome decoration */}
      {hasDecoration && !isHoney && (
        <BiomeDecoration
          quadrant={space.quadrant}
          position={decorationPos}
          scale={0.8 + (ringIndex * 0.1)}
        />
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
}: {
  ringConfig: typeof RING_CONFIGS[0]
  spaces: GameSpace[]
  rotation: number
  players: Player[]
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
      {sortedSpaces.map((space, index) => {
        // Offset by 3π/4 to match the 2D board orientation
        // Spaces start exactly at quadrant boundaries (no half-space offset)
        const startAngle = (index * anglePerSpace) + (3 * Math.PI / 4)
        const endAngle = startAngle + anglePerSpace

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
                  startAngle + anglePerSpace / 2,
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
      {/* Two crossing bridges - one N-S, one E-W (rotated to align with biome centers) */}
      {[0, 1].map((i) => {
        // Rotate 45° from quadrant boundaries to align with biome centers
        const angle = (i * Math.PI / 2) + Math.PI  // 180° and 270° (through biome centers)

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
export function Board3D({ board, players, rotations, showArena = false }: Board3DProps) {
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
