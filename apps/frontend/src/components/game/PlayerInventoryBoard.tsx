'use client'

import React from 'react'
import { useGameStore, GamePiece } from '@/store/gameStore'

interface PlayerInventoryBoardProps {
  playerId: string | number
}

interface BearInventoryProps {
  bearId: string
  bearType: 'bear' | 'cub'
  resources: {
    grains: number
    berries: number
    salmon: number
  }
  energy: number
  fat: number
}

const ResourceToken = ({ type, count }: { type: 'grains' | 'berries' | 'salmon', count: number }) => {
  const colors = {
    grains: 'bg-yellow-600',
    berries: 'bg-purple-600',
    salmon: 'bg-pink-600'
  }
  
  if (count === 0) return null
  
  return (
    <div className={`w-6 h-6 rounded-full ${colors[type]} flex items-center justify-center text-white text-xs font-bold`}>
      {count}
    </div>
  )
}

const EnergyToken = ({ count }: { count: number }) => {
  if (count === 0) return null
  
  return (
    <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xs font-bold">
      ⚡{count}
    </div>
  )
}

const BearInventory = ({ bearId, bearType, resources, energy, fat }: BearInventoryProps) => {
  return (
    <div className="flex items-center space-x-4 p-4 border-2 border-gray-300 rounded-lg bg-white">
      {/* Basket - to the side */}
      <div className="flex flex-col items-center space-y-2">
        <div className="text-sm font-medium text-gray-700">Basket</div>
        <div className="w-20 h-24 border-2 border-amber-600 rounded-lg bg-amber-50 flex flex-col items-center justify-center space-y-1 p-2">
          <div className="flex space-x-1">
            <ResourceToken type="grains" count={resources.grains} />
            <ResourceToken type="berries" count={resources.berries} />
            <ResourceToken type="salmon" count={resources.salmon} />
          </div>
        </div>
      </div>
      
      {/* Bear with stomach and energy */}
      <div className="flex flex-col items-center space-y-2">
        <div className="text-sm font-medium text-gray-700 capitalize">{bearType}</div>
        <div className="relative">
          {/* Energy circle (outer) */}
          <div className="w-24 h-24 rounded-full border-4 border-yellow-400 bg-yellow-100 flex items-center justify-center">
            {/* Energy tokens around the edge */}
            <div className="absolute -top-1 -right-1">
              <EnergyToken count={energy} />
            </div>
            
            {/* Fat area (inner) */}
            <div className="w-16 h-16 rounded-full border-2 border-orange-400 bg-orange-50 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-1">
                <div className="text-sm font-bold text-orange-700">🟫{fat}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500">{bearId}</div>
      </div>
    </div>
  )
}

export const PlayerInventoryBoard = ({ playerId }: PlayerInventoryBoardProps) => {
  const { players, board } = useGameStore()
  
  const player = players.find(p => p.id === playerId)
  if (!player) return null
  
  // Get all pieces for this player
  const playerPieces = Object.values(board.spaces)
    .map(space => space.piece)
    .filter(piece => piece && piece.playerId === playerId) as GamePiece[]
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">{player.name}&apos;s Inventory</h2>
        <div className="text-sm text-gray-600">
          Bears: {player.pieceCount.bears} | Cubs: {player.pieceCount.cubs} | Pieces: {player.pieces.length}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {playerPieces.map((piece) => (
          <BearInventory
            key={piece.id}
            bearId={piece.id}
            bearType={piece.type}
            resources={piece.resources}
            energy={piece.energy}
            fat={piece.fat}
          />
        ))}
        
        {/* Show empty slots for remaining bears */}
        {Array.from({ length: 5 - playerPieces.length }, (_, index) => (
          <div key={`empty-${index}`} className="flex items-center space-x-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="flex flex-col items-center space-y-2">
              <div className="text-sm font-medium text-gray-400">Empty</div>
              <div className="w-20 h-24 border-2 border-dashed border-gray-400 rounded-lg bg-gray-100"></div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="text-sm font-medium text-gray-400">No Bear</div>
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 bg-gray-100"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}