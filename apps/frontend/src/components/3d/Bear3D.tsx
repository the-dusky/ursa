/**
 * Bear3D - 3D representation of a bear game piece
 *
 * A simple stylized bear model that can represent different player colors.
 * Cubs are smaller versions of bears.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GamePiece, Player } from '../../state/CoreGameState'

interface Bear3DProps {
  piece: GamePiece
  players: Player[]
  position: [number, number, number]
}

/**
 * Get the color for a player
 */
function getPlayerColor(playerId: string, players: Player[]): string {
  const player = players.find(p => p.id === playerId)
  return player?.color || '#888888'
}

/**
 * Bear body component - a stylized bear shape
 */
function BearBody({ color, scale = 1 }: { color: string; scale?: number }) {
  const bodyRef = useRef<THREE.Group>(null)

  // Gentle breathing animation
  useFrame((state) => {
    if (bodyRef.current) {
      const breathe = Math.sin(state.clock.elapsedTime * 2) * 0.02
      bodyRef.current.scale.y = scale * (1 + breathe)
    }
  })

  return (
    <group ref={bodyRef} scale={scale}>
      {/* Body - main torso */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.32, 0.05]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Snout */}
      <mesh position={[0, 0.30, 0.12]} castShadow>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.30, 0.16]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Left ear */}
      <mesh position={[-0.06, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Right ear */}
      <mesh position={[0.06, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Left eye */}
      <mesh position={[-0.03, 0.34, 0.1]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Right eye */}
      <mesh position={[0.03, 0.34, 0.1]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Front left leg */}
      <mesh position={[-0.06, 0.05, 0.06]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Front right leg */}
      <mesh position={[0.06, 0.05, 0.06]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Back left leg */}
      <mesh position={[-0.06, 0.05, -0.06]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Back right leg */}
      <mesh position={[0.06, 0.05, -0.06]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Tail (small bump) */}
      <mesh position={[0, 0.12, -0.12]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  )
}

/**
 * Status indicator ring around the bear
 */
function StatusRing({ isHibernating, isAttacking, color }: {
  isHibernating?: boolean
  isAttacking?: boolean
  color: string
}) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current && (isHibernating || isAttacking)) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 2
    }
  })

  if (!isHibernating && !isAttacking) return null

  const ringColor = isHibernating ? '#60a5fa' : '#ef4444' // Blue for hibernating, red for attacking

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[0.15, 0.18, 32]} />
      <meshBasicMaterial color={ringColor} transparent opacity={0.7} />
    </mesh>
  )
}

/**
 * Energy bar above bear
 */
function EnergyBar({ energy, maxEnergy = 10 }: { energy: number; maxEnergy?: number }) {
  const percentage = Math.min(1, Math.max(0, energy / maxEnergy))
  const barWidth = 0.2
  const barHeight = 0.03

  // Color based on energy level
  const getEnergyColor = () => {
    if (percentage > 0.6) return '#22c55e' // Green
    if (percentage > 0.3) return '#eab308' // Yellow
    return '#ef4444' // Red
  }

  return (
    <group position={[0, 0.5, 0]}>
      {/* Background bar */}
      <mesh>
        <planeGeometry args={[barWidth, barHeight]} />
        <meshBasicMaterial color="#374151" />
      </mesh>
      {/* Energy fill */}
      <mesh position={[(percentage - 1) * barWidth / 2, 0, 0.001]}>
        <planeGeometry args={[barWidth * percentage, barHeight * 0.8]} />
        <meshBasicMaterial color={getEnergyColor()} />
      </mesh>
    </group>
  )
}

/**
 * Main Bear3D component
 */
export function Bear3D({ piece, players, position }: Bear3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const color = getPlayerColor(piece.playerId, players)
  const scale = piece.type === 'cub' ? 0.6 : 1

  // Face the center of the board
  const rotation = useMemo(() => {
    const angle = Math.atan2(position[2], position[0])
    return [0, -angle + Math.PI / 2, 0] as [number, number, number]
  }, [position])

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Status ring */}
      <StatusRing
        isHibernating={piece.isHibernating}
        isAttacking={!!piece.isAttacking}
        color={color}
      />

      {/* Bear body */}
      <BearBody color={color} scale={scale} />

      {/* Energy bar */}
      <EnergyBar energy={piece.energy} />

      {/* Selection/hover highlight (can be controlled externally) */}
    </group>
  )
}

export default Bear3D
