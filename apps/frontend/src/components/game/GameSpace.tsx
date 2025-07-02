/**
 * GameSpace Component - Simplified for new architecture
 */

'use client'

import { CoreGameState } from '@/state/CoreGameState'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface GameSpaceProps {
  spaceId: string
  x: number
  y: number
  size: number
  gameState: CoreGameState
  selectedSpaceId: string | null
  onSpaceClick: (spaceId: string) => void
}

export function GameSpace({ 
  spaceId, 
  x, 
  y, 
  size, 
  gameState, 
  selectedSpaceId, 
  onSpaceClick 
}: GameSpaceProps) {
  const handleClick = () => {
    console.log("clicked space " + spaceId)
    onSpaceClick(spaceId)
  }

  // Find piece on this space
  const piece = gameState.players.flatMap(p => p.pieces).find(p => p.spaceId === spaceId)

  const getSpaceColor = () => {
    if (selectedSpaceId === spaceId) {
      return 'bg-yellow-400/70 border-yellow-400'
    }

    // Default space colors - could be enhanced with actual space data
    return 'bg-slate-400 border-slate-500'
  }

  const getPieceColor = (piece: any) => {
    if (!piece) return ''
    
    // Player pieces
    const player = piece.playerId
    if (player === 'player-1') return 'bg-red-500 border-red-400'
    if (player === 'player-2') return 'bg-blue-500 border-blue-400'
    return 'bg-purple-500 border-purple-400'
  }

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: x - size,
        top: y - size,
        width: size * 2,
        height: size * 2,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
    >
      {/* Space Background */}
      <div
        className={cn(
          'w-full h-full rounded-full border-2 transition-all duration-200',
          'hover:border-white/50 hover:shadow-lg',
          getSpaceColor()
        )}
      >
        {/* Game Piece */}
        {piece && (
          <motion.div
            className={cn(
              'absolute inset-1 rounded-full border-2 flex items-center justify-center',
              'shadow-lg text-white font-bold text-xs',
              getPieceColor(piece)
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {piece.type === 'bear' ? '🐻' : piece.type === 'cub' ? '🐻‍❄️' : '●'}
          </motion.div>
        )}

        {/* Selection Ring */}
        {selectedSpaceId === spaceId && (
          <motion.div
            className="absolute -inset-1 rounded-full border-2 border-yellow-400"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    </motion.div>
  )
}