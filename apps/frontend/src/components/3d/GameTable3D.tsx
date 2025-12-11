/**
 * GameTable3D - Main 3D scene container
 *
 * This is the root component for the 3D tabletop view.
 * It sets up the Three.js canvas, camera, lighting, and contains the game board.
 */

'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'
import { Board3D } from './Board3D'
import { PlayerCard3D } from './PlayerCard3D'
import { GrainPile, BerryPile, SalmonPile, HoneyPile, EnergyPile, FatPile } from './ResourcePiles3D'
import { useGameState } from '../../state'
import type { CoreGameState } from '../../state/CoreGameState'

interface GameTable3DProps {
  /** Optional: Override game state for preview/testing */
  previewState?: CoreGameState
  /** Show debug helpers like axes */
  debug?: boolean
  /** Show the combat arena platform */
  showArena?: boolean
  /** Show space IDs on the board */
  showSpaceIds?: boolean
}

/**
 * Loading fallback for the 3D scene
 */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  )
}

/**
 * Table surface the board sits on
 */
function TableSurface() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <circleGeometry args={[15, 64]} />
      <meshStandardMaterial
        color="#2d4a3e"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

/**
 * Main 3D game table component
 */
export function GameTable3D({ previewState, debug = false, showArena = false, showSpaceIds = false }: GameTable3DProps) {
  const { board, players, diceState } = useGameState()

  // Use preview state or actual game state
  const gameBoard = previewState?.board || board
  const gamePlayers = previewState?.players || players
  const rotations = previewState?.diceState?.rotations || diceState.rotations

  return (
    <div className="w-full h-full min-h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      <Canvas shadows>
        {/* Camera setup - angled view looking down at the board */}
        <PerspectiveCamera
          makeDefault
          position={[0, 12, 12]}
          fov={50}
        />

        {/* Orbital controls for user interaction */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={25}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />

        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight
          position={[-5, 10, -5]}
          intensity={0.3}
        />

        {/* Environment for reflections */}
        <Environment preset="apartment" />

        {/* Content with suspense for async loading */}
        <Suspense fallback={<LoadingFallback />}>
          {/* Table surface */}
          <TableSurface />

          {/* The game board */}
          <Board3D
            board={gameBoard}
            players={gamePlayers}
            rotations={rotations}
            showArena={showArena}
            showSpaceIds={showSpaceIds}
          />

          {/* Resource piles arranged in a circle around the board */}
          {(() => {
            const pileDistance = 9 // Distance from board center
            const piles = [
              { Component: GrainPile, angle: Math.PI * 0.85 },
              { Component: BerryPile, angle: Math.PI * 0.65 },
              { Component: SalmonPile, angle: Math.PI * 0.35 },
              { Component: HoneyPile, angle: Math.PI * 0.15 },
              { Component: EnergyPile, angle: -Math.PI * 0.15 },
              { Component: FatPile, angle: -Math.PI * 0.35 },
            ]
            return piles.map(({ Component, angle }, i) => {
              const x = Math.sin(angle) * pileDistance
              const z = Math.cos(angle) * pileDistance
              return (
                <Component
                  key={i}
                  position={[x, 0.05, z]}
                  rotation={angle}
                  scale={3}
                />
              )
            })
          })()}

          {/* Player cards around the board - laying flat on the table */}
          {gamePlayers.map((player, index) => {
            // Position cards around the board at 4 corners
            const cardDistance = 11 // Distance from board center
            const angles = [
              Math.PI * 1,   // Top (N)
              Math.PI * 0.5,   // Right (E)
              -Math.PI * 0.0,  // Bottom (S)
              -Math.PI * 0.5  // Left (W)
            ]
            const angle = angles[index % 4]
            const x = Math.sin(angle) * cardDistance
            const z = Math.cos(angle) * cardDistance

            // Rotation to face the board center
            const rotationY = angle

            return (
              <PlayerCard3D
                key={player.id}
                player={player}
                position={[x, 0.05, z]}
                rotation={rotationY}
                tilt={-Math.PI / 2}
                scale={3}
              />
            )
          })}

          {/* Contact shadows for grounding */}
          <ContactShadows
            position={[0, -0.09, 0]}
            opacity={0.4}
            scale={20}
            blur={2}
          />
        </Suspense>

        {/* Debug helpers */}
        {debug && (
          <>
            <axesHelper args={[5]} />
            <gridHelper args={[20, 20]} />
          </>
        )}
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black/50 p-2 rounded">
        <p>3D Tabletop View (Prototype)</p>
        <p className="text-xs text-gray-400">Drag to rotate, scroll to zoom</p>
      </div>
    </div>
  )
}

export default GameTable3D
