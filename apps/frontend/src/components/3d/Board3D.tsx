/**
 * Board3D - 3D representation of the circular game board
 *
 * The board consists of 5 concentric rings that can rotate independently.
 * Each ring is divided into spaces based on quadrants (Mountains, Pastures, Forests, Riverlands).
 * The center contains the bridge system connecting the quadrants.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
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

// Colors for each quadrant
const QUADRANT_COLORS: { [key: string]: string } = {
  'Mountains': '#6b7280',  // Gray
  'Pastures': '#22c55e',   // Green
  'Forests': '#166534',    // Dark green
  'Riverlands': '#3b82f6', // Blue
  'Bridge': '#78716c',     // Stone gray
}

interface Board3DProps {
  board: GameBoard
  players: Player[]
  rotations: number[]
}

/**
 * Single space segment on a ring
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
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    }

    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [innerRadius, outerRadius, startAngle, endAngle, height])

  const color = QUADRANT_COLORS[space.quadrant] || '#888888'

  // Highlight honey spaces
  const isHoney = space.hasHoney
  const emissiveColor = isHoney ? '#fbbf24' : '#000000'
  const emissiveIntensity = isHoney ? 0.3 : 0

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.7}
        metalness={0.1}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
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

  // Sort spaces by position
  const sortedSpaces = useMemo(() => {
    return [...spaces].sort((a, b) => a.position - b.position)
  }, [spaces])

  // Calculate rotation in radians (each unit is one space width)
  const rotationRadians = (rotation * 2 * Math.PI) / ringConfig.spaceCount

  return (
    <group ref={groupRef} rotation={[0, rotationRadians, 0]}>
      {sortedSpaces.map((space, index) => {
        const anglePerSpace = (2 * Math.PI) / ringConfig.spaceCount
        // Offset by 3π/4 to match the 2D board orientation
        const startAngle = (index * anglePerSpace) + (3 * Math.PI / 4) - (anglePerSpace / 2)
        const endAngle = startAngle + anglePerSpace

        return (
          <group key={space.id}>
            <RingSpace
              space={space}
              ringIndex={ringConfig.ring}
              innerRadius={ringConfig.innerRadius}
              outerRadius={ringConfig.outerRadius}
              startAngle={startAngle}
              endAngle={endAngle}
              height={0.1 + ringConfig.ring * 0.02} // Slight height variation per ring
            />
            {/* Render bear if space has a piece */}
            {space.piece && (
              <Bear3D
                piece={space.piece}
                players={players}
                position={calculateSpacePosition(
                  startAngle + anglePerSpace / 2,
                  (ringConfig.innerRadius + ringConfig.outerRadius) / 2
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
function calculateSpacePosition(angle: number, radius: number): [number, number, number] {
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const y = 0.2 // Slightly above the board
  return [x, y, z]
}

/**
 * Center bridge system
 */
function BridgeCenter({ bridges, players }: { bridges: { [key: string]: GameSpace }, players: Player[] }) {
  return (
    <group>
      {/* Center platform */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.16, 32]} />
        <meshStandardMaterial color="#78716c" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Bridge arms */}
      {['NORTH', 'EAST', 'SOUTH', 'WEST'].map((direction, index) => {
        const angle = (index * Math.PI / 2) + (3 * Math.PI / 4)
        const bridgeLength = 0.6
        const bridgeWidth = 0.3
        const x = Math.cos(angle) * 0.6
        const z = Math.sin(angle) * 0.6

        const bridgeId = `R0-${direction}`
        const bridge = bridges[bridgeId]

        return (
          <group key={direction}>
            <mesh
              position={[x, 0.06, z]}
              rotation={[0, -angle, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[bridgeLength, 0.12, bridgeWidth]} />
              <meshStandardMaterial color="#78716c" roughness={0.6} metalness={0.2} />
            </mesh>
            {/* Render bear if bridge has a piece */}
            {bridge?.piece && (
              <Bear3D
                piece={bridge.piece}
                players={players}
                position={[x, 0.2, z]}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}

/**
 * Ring border/divider
 */
function RingBorder({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
      <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
      <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.3} />
    </mesh>
  )
}

/**
 * Main Board3D component
 */
export function Board3D({ board, players, rotations }: Board3DProps) {
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
      {/* Base plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[7.5, 64]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} metalness={0.1} />
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

      {/* Ring borders */}
      {RING_CONFIGS.map(ringConfig => (
        <RingBorder key={`border-${ringConfig.ring}`} radius={ringConfig.outerRadius} />
      ))}

      {/* Center bridge system */}
      <BridgeCenter bridges={board.bridges} players={players} />

      {/* Outer rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[7.2, 7.4, 64]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  )
}

export default Board3D
