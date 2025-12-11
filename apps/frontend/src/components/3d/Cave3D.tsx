/**
 * Cave3D - 3D representation of a cave entrance in the Mountains
 *
 * A rocky cave entrance that sits on mountain spaces.
 * Caves are used for hibernation during winter.
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Cave3DProps {
  position: [number, number, number]
  rotation?: number // Y-axis rotation to face outward from center
  scale?: number
  playerColor?: string // Optional color accent for the player's cave
}

/**
 * Main Cave3D component - a rocky cave entrance
 */
export function Cave3D({ position, rotation = 0, scale = 1, playerColor }: Cave3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Subtle glow animation for the cave interior
  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.15 + 0.4
      ;(glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]} scale={scale * 0.5}>
      {/* Cave entrance arch - made of stacked rocks */}

      {/* Base rocks on left side */}
      <mesh position={[-0.18, 0.05, 0]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.12, 0.1, 0.15]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[-0.16, 0.14, 0.02]} rotation={[0, -0.1, 0.1]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.12]} />
        <meshStandardMaterial color="#374151" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[-0.14, 0.21, 0]} rotation={[0.1, 0.15, 0.15]} castShadow>
        <boxGeometry args={[0.09, 0.07, 0.1]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Base rocks on right side */}
      <mesh position={[0.18, 0.05, 0]} rotation={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[0.12, 0.1, 0.15]} />
        <meshStandardMaterial color="#374151" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0.16, 0.14, -0.02]} rotation={[0, 0.1, -0.1]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.12]} />
        <meshStandardMaterial color="#4b5563" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0.14, 0.21, 0]} rotation={[-0.1, -0.15, -0.15]} castShadow>
        <boxGeometry args={[0.09, 0.07, 0.1]} />
        <meshStandardMaterial color="#374151" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Top arch rocks */}
      <mesh position={[-0.08, 0.26, 0]} rotation={[0, 0.1, 0.3]} castShadow>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[0.05, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.1]} />
        <meshStandardMaterial color="#374151" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0.08, 0.26, 0]} rotation={[0, -0.1, -0.3]} castShadow>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Keystone at top */}
      <mesh position={[0, 0.32, 0.02]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.05, 0.08]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} metalness={0.15} />
      </mesh>

      {/* Dark cave interior (back wall) */}
      <mesh position={[0, 0.12, -0.08]}>
        <planeGeometry args={[0.22, 0.24]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} metalness={0} />
      </mesh>

      {/* Cave interior glow - subtle warm light from inside */}
      <mesh ref={glowRef} position={[0, 0.1, -0.06]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Player color marker on the cave (if assigned) */}
      {playerColor && (
        <mesh position={[0, 0.34, 0.05]} rotation={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
          <meshStandardMaterial
            color={playerColor}
            emissive={playerColor}
            emissiveIntensity={0.3}
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
      )}

      {/* Some scattered rocks around the entrance */}
      <mesh position={[-0.25, 0.02, 0.08]} rotation={[0.2, 0.5, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.04, 0]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.02, 0.1]} rotation={[-0.1, 0.3, 0.2]} castShadow>
        <dodecahedronGeometry args={[0.035, 0]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.015, 0.12]} rotation={[0.3, 0.1, 0]} castShadow>
        <dodecahedronGeometry args={[0.025, 0]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} />
      </mesh>

      {/* Ground shadow/dirt around entrance */}
      <mesh position={[0, 0.002, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#1f2937" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

export default Cave3D
