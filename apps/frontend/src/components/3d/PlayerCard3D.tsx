/**
 * PlayerCard3D - 3D player card that sits around the board
 *
 * Each player has a card with:
 * - Main bear drawing at the top
 * - 4 cub slots below (5 total bear spaces)
 * - Player name and resources
 *
 * Card is sized like a standard playing card (2.5" x 3.5" ratio)
 */

'use client'

import { useRef } from 'react'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { Player } from '../../state/CoreGameState'

interface PlayerCard3DProps {
  player: Player
  position: [number, number, number]
  rotation: number // Y-axis rotation to face the board
  tilt?: number // X-axis tilt to make card more visible from above
  scale?: number // Scale multiplier for the card
}

/**
 * Stylized bear face drawing on the card
 */
function BearFace({ color, scale = 1, isEmpty = false }: { color: string; scale?: number; isEmpty?: boolean }) {
  if (isEmpty) {
    // Empty bear slot (outline only)
    return (
      <group scale={scale}>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.18, 0.22, 24]} />
          <meshStandardMaterial color="#6b7280" roughness={0.9} />
        </mesh>
        {/* Dashed inner circle hint */}
        <mesh position={[0, 0, 0.003]}>
          <circleGeometry args={[0.15, 24]} />
          <meshStandardMaterial color="#374151" roughness={0.95} opacity={0.3} transparent />
        </mesh>
      </group>
    )
  }

  return (
    <group scale={scale}>
      {/* Bear head - main circle */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.22, 32]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>

      {/* Left ear */}
      <mesh position={[-0.16, 0.18, 0.01]}>
        <circleGeometry args={[0.07, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Left ear inner */}
      <mesh position={[-0.16, 0.18, 0.02]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#fecaca" roughness={0.7} />
      </mesh>

      {/* Right ear */}
      <mesh position={[0.16, 0.18, 0.01]}>
        <circleGeometry args={[0.07, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Right ear inner */}
      <mesh position={[0.16, 0.18, 0.02]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#fecaca" roughness={0.7} />
      </mesh>

      {/* Snout */}
      <mesh position={[0, -0.06, 0.02]}>
        <circleGeometry args={[0.1, 24]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -0.01, 0.03]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* Left eye */}
      <mesh position={[-0.08, 0.04, 0.02]}>
        <circleGeometry args={[0.025, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      {/* Left eye shine */}
      <mesh position={[-0.075, 0.05, 0.025]}>
        <circleGeometry args={[0.008, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Right eye */}
      <mesh position={[0.08, 0.04, 0.02]}>
        <circleGeometry args={[0.025, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      {/* Right eye shine */}
      <mesh position={[0.085, 0.05, 0.025]}>
        <circleGeometry args={[0.008, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Mouth - simple smile */}
      <mesh position={[-0.025, -0.1, 0.025]}>
        <circleGeometry args={[0.006, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.11, 0.025]}>
        <circleGeometry args={[0.006, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      <mesh position={[0.025, -0.1, 0.025]}>
        <circleGeometry args={[0.006, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Main PlayerCard3D component - playing card sized
 */
export function PlayerCard3D({ player, position, rotation, tilt = 0, scale = 1 }: PlayerCard3DProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Wide card proportions (3x wider than original playing card)
  // Scale to be reasonable in 3D space
  const cardWidth = 2
  const cardHeight = 1.5
  const cardDepth = 0.001

  // Count cubs from player pieces
  const bearCount = player.pieces.filter(p => p.type === 'bear').length
  const cubCount = player.pieces.filter(p => p.type === 'cub').length
  const totalBears = Math.min(bearCount + cubCount, 5) // Max 5 bears on card

  // When card is flat (tilt = -PI/2), we need to rotate on Z axis to spin it on the table
  // When card is upright (tilt = 0), we rotate on Y axis
  const isFlat = Math.abs(tilt + Math.PI / 2) < 0.1
  const effectiveRotation: [number, number, number] = isFlat
    ? [tilt, 0, rotation]  // Flat: use Z rotation
    : [tilt, rotation, 0]  // Upright: use Y rotation

  return (
    <group ref={groupRef} position={position} rotation={effectiveRotation} scale={scale}>
      {/* Card base - wooden frame */}
      <RoundedBox
        args={[cardWidth, cardHeight, cardDepth]}
        radius={0.03}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#78350f" roughness={0.8} metalness={0.1} />
      </RoundedBox>

      {/* Card front surface - parchment color */}
      <RoundedBox
        args={[cardWidth - 0.05, cardHeight - 0.05, 0.005]}
        position={[0, 0, cardDepth / 2]}
        radius={0.02}
        smoothness={4}
      >
        <meshStandardMaterial color="#fef3c7" roughness={0.9} metalness={0} />
      </RoundedBox>

      {/* Top half: 5 bear sections in a row */}
      {[0, 1, 2, 3, 4].map((i) => {
        const sectionWidth = cardWidth / 5
        const xOffset = (i - 2) * sectionWidth // Center the 5 sections
        const yOffset = cardHeight / 4 // Top half of card
        const hasBear = i < totalBears

        return (
          <group key={i} position={[xOffset, yOffset, cardDepth / 2]}>
            {/* Section divider (vertical line between sections) */}
            {i > 0 && (
              <mesh position={[-sectionWidth / 2, 0, 0.005]}>
                <planeGeometry args={[0.008, cardHeight / 2 - 0.1]} />
                <meshStandardMaterial color="#92400e" roughness={0.8} />
              </mesh>
            )}
            {/* Bear face */}
            <BearFace
              color={player.color}
              scale={0.65}
              isEmpty={!hasBear}
            />
          </group>
        )
      })}

      {/* Horizontal divider between top and bottom halves */}
      <mesh position={[0, 0, cardDepth / 2 + 0.01]}>
        <planeGeometry args={[cardWidth - 0.1, 0.012]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>

      {/* Bottom half: Player name and info */}
      <mesh position={[0, -cardHeight / 4, cardDepth / 2 + 0.005]}>
        <planeGeometry args={[cardWidth - 0.1, cardHeight / 2 - 0.1]} />
        <meshStandardMaterial color={player.color} roughness={0.7} opacity={0.3} transparent />
      </mesh>
      <Text
        position={[0, -cardHeight / 4, cardDepth / 2 + 0.015]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.006}
        outlineColor="#000000"
      >
        {player.name}
      </Text>
    </group>
  )
}

export default PlayerCard3D
