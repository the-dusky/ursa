/**
 * HoneyJug3D - 3D representation of a honey jug/pot token
 *
 * A stylized ceramic jug filled with honey that sits on spaces
 * where honey is available to be collected.
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface HoneyJug3DProps {
  position: [number, number, number]
  scale?: number
}

/**
 * Main HoneyJug3D component - a ceramic pot with honey
 */
export function HoneyJug3D({ position, scale = 1 }: HoneyJug3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const honeyRef = useRef<THREE.Mesh>(null)

  // Gentle honey shimmer animation
  useFrame((state) => {
    if (honeyRef.current) {
      const shimmer = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.5
      ;(honeyRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = shimmer
    }
    // Gentle bobbing
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.005
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale * 0.4}>
      {/* Jug body - rounded pot shape using lathe geometry approximation */}
      {/* Base of jug */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.08, 0.1, 16]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Middle bulge of jug */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Upper body */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.12, 16]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Neck of jug */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.08, 16]} />
        <meshStandardMaterial color="#92400e" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Rim */}
      <mesh position={[0, 0.29, 0]} castShadow>
        <torusGeometry args={[0.07, 0.015, 8, 16]} />
        <meshStandardMaterial color="#78350f" roughness={0.5} metalness={0.15} />
      </mesh>

      {/* Honey inside - visible from top */}
      <mesh ref={honeyRef} position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Honey drip on side */}
      <mesh position={[0.08, 0.18, 0.04]} rotation={[0, 0, -0.3]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Handle */}
      <mesh position={[-0.14, 0.18, 0]} rotation={[0, 0, Math.PI / 6]}>
        <torusGeometry args={[0.05, 0.015, 8, 12, Math.PI]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Decorative band around middle */}
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.135, 0.008, 8, 24]} />
        <meshStandardMaterial color="#78350f" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Small base shadow/ground contact */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

export default HoneyJug3D
