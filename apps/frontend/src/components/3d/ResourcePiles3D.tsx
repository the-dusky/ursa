/**
 * ResourcePiles3D - Communal resource piles for the game
 *
 * Contains:
 * - Food piles: grains, berries, salmon, honey
 * - Energy chips (yellow)
 * - Fat chips (white/cream)
 */

'use client'

import { Text } from '@react-three/drei'

interface ResourcePileProps {
  position: [number, number, number]
  rotation?: number
  scale?: number
}

/**
 * Single grain token - wheat/grain shape
 */
function GrainToken({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Grain stalk */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.04, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      {/* Grain head */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#f5deb3" roughness={0.6} />
      </mesh>
    </group>
  )
}

/**
 * Single berry token - small red sphere
 */
function BerryToken({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.025, 12, 12]} />
      <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

/**
 * Single salmon token - fish shape
 */
function SalmonToken({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, Math.PI / 2]}>
      {/* Fish body */}
      <mesh>
        <capsuleGeometry args={[0.015, 0.05, 8, 8]} />
        <meshStandardMaterial color="#fa8072" roughness={0.5} />
      </mesh>
      {/* Tail */}
      <mesh position={[0, -0.035, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.025, 0.02, 0.005]} />
        <meshStandardMaterial color="#fa8072" roughness={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Single honey token - golden drop
 */
function HoneyToken({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.022, 12, 12]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.3} />
    </mesh>
  )
}

/**
 * Energy chip - yellow poker chip style
 */
function EnergyChip({ position, stackIndex = 0 }: { position: [number, number, number]; stackIndex?: number }) {
  const yOffset = stackIndex * 0.012
  return (
    <mesh position={[position[0], position[1] + yOffset, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.2} />
    </mesh>
  )
}

/**
 * Fat chip - white/cream poker chip style
 */
function FatChip({ position, stackIndex = 0 }: { position: [number, number, number]; stackIndex?: number }) {
  const yOffset = stackIndex * 0.012
  return (
    <mesh position={[position[0], position[1] + yOffset, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
      <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

/**
 * Grain pile with multiple tokens
 */
export function GrainPile({ position, rotation = 0, scale = 1 }: ResourcePileProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Base/container */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.02, 16]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      {/* Grain tokens in pile */}
      <GrainToken position={[-0.04, 0.02, -0.02]} rotation={0.3} />
      <GrainToken position={[0.03, 0.02, 0.03]} rotation={1.2} />
      <GrainToken position={[0, 0.02, -0.04]} rotation={2.1} />
      <GrainToken position={[-0.02, 0.02, 0.04]} rotation={0.8} />
      <GrainToken position={[0.05, 0.02, -0.01]} rotation={1.5} />
      {/* Label */}
      <Text
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.04}
        color="#78350f"
        anchorX="center"
        anchorY="middle"
      >
        GRAINS
      </Text>
    </group>
  )
}

/**
 * Berry pile with multiple tokens
 */
export function BerryPile({ position, rotation = 0, scale = 1 }: ResourcePileProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Base/container */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.02, 16]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      {/* Berry tokens in pile */}
      <BerryToken position={[-0.04, 0.04, -0.02]} />
      <BerryToken position={[0.03, 0.04, 0.03]} />
      <BerryToken position={[0, 0.04, -0.04]} />
      <BerryToken position={[-0.02, 0.04, 0.04]} />
      <BerryToken position={[0.05, 0.04, -0.01]} />
      <BerryToken position={[0, 0.06, 0]} />
      {/* Label */}
      <Text
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.04}
        color="#991b1b"
        anchorX="center"
        anchorY="middle"
      >
        BERRIES
      </Text>
    </group>
  )
}

/**
 * Salmon pile with multiple tokens
 */
export function SalmonPile({ position, rotation = 0, scale = 1 }: ResourcePileProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Base/container */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.02, 16]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      {/* Salmon tokens in pile */}
      <SalmonToken position={[-0.03, 0.04, -0.02]} rotation={0.5} />
      <SalmonToken position={[0.02, 0.04, 0.03]} rotation={1.8} />
      <SalmonToken position={[0, 0.06, 0]} rotation={0.9} />
      <SalmonToken position={[-0.04, 0.04, 0.02]} rotation={2.5} />
      {/* Label */}
      <Text
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.04}
        color="#9f1239"
        anchorX="center"
        anchorY="middle"
      >
        SALMON
      </Text>
    </group>
  )
}

/**
 * Honey pile with multiple tokens
 */
export function HoneyPile({ position, rotation = 0, scale = 1 }: ResourcePileProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Base/container */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.02, 16]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      {/* Honey tokens in pile */}
      <HoneyToken position={[-0.04, 0.04, -0.02]} />
      <HoneyToken position={[0.03, 0.04, 0.03]} />
      <HoneyToken position={[0, 0.04, -0.04]} />
      <HoneyToken position={[-0.02, 0.04, 0.04]} />
      <HoneyToken position={[0.04, 0.04, 0]} />
      <HoneyToken position={[0, 0.06, 0]} />
      {/* Label */}
      <Text
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.04}
        color="#92400e"
        anchorX="center"
        anchorY="middle"
      >
        HONEY
      </Text>
    </group>
  )
}

/**
 * Energy chip pile - stacked yellow chips
 */
export function EnergyPile({ position, rotation = 0, scale = 1 }: ResourcePileProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Stack of energy chips */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <EnergyChip key={i} position={[0, 0.02, 0]} stackIndex={i} />
      ))}
      {/* Second smaller stack */}
      {[0, 1, 2, 3, 4].map((i) => (
        <EnergyChip key={`b-${i}`} position={[0.1, 0.02, 0]} stackIndex={i} />
      ))}
      {/* Label */}
      <Text
        position={[0.05, 0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.04}
        color="#92400e"
        anchorX="center"
        anchorY="middle"
      >
        ENERGY
      </Text>
    </group>
  )
}

/**
 * Fat chip pile - stacked white/cream chips
 */
export function FatPile({ position, rotation = 0, scale = 1 }: ResourcePileProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Stack of fat chips */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <FatChip key={i} position={[0, 0.02, 0]} stackIndex={i} />
      ))}
      {/* Second smaller stack */}
      {[0, 1, 2, 3, 4].map((i) => (
        <FatChip key={`b-${i}`} position={[0.1, 0.02, 0]} stackIndex={i} />
      ))}
      {/* Label */}
      <Text
        position={[0.05, 0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.04}
        color="#78350f"
        anchorX="center"
        anchorY="middle"
      >
        FAT
      </Text>
    </group>
  )
}

/**
 * All communal resource piles grouped together
 */
export function CommunalResources({ position, rotation = 0, scale = 1 }: ResourcePileProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Food piles in a row */}
      <GrainPile position={[-0.5, 0, 0]} />
      <BerryPile position={[-0.17, 0, 0]} />
      <SalmonPile position={[0.17, 0, 0]} />
      <HoneyPile position={[0.5, 0, 0]} />

      {/* Chip piles below */}
      <EnergyPile position={[-0.25, 0, 0.35]} />
      <FatPile position={[0.25, 0, 0.35]} />
    </group>
  )
}

export default CommunalResources
