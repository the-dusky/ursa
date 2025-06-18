'use client'

import { useGameStore, GameSpace as GameSpaceType } from '@/store/gameStore'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface GameSpaceProps {
  space: GameSpaceType
  x: number
  y: number
  size: number
}

export function GameSpace({ space, x, y, size }: GameSpaceProps) {
  const { selectSpace, selectedSpaceId } = useGameStore()

  const handleClick = () => {
    selectSpace(space.id)
  }

  const getSpaceColor = () => {
    if (space.isSelected || selectedSpaceId === space.id) {
      return 'bg-selection border-yellow-400'
    }
    
    if (space.isHighlighted) {
      return 'bg-green-500/70 border-green-400'
    }

    switch (space.quadrant) {
      case 'Mountains':
        return space.subArea === 'Caves' 
          ? 'bg-cave border-slate-600' 
          : 'bg-hunting border-orange-600'
      case 'Pastures':
        return 'bg-pasture border-green-600'
      case 'Forests':
        return 'bg-forest border-green-800'
      case 'Riverlands':
        return 'bg-riverland border-blue-600'
      default:
        return 'bg-slate-600 border-slate-500'
    }
  }

  const getPieceColor = () => {
    if (!space.piece) return ''
    
    if (space.piece.type === 'bear') {
      return 'bg-amber-700 border-amber-600'
    }
    
    // Player pieces
    const player = space.piece.playerId
    if (player === 1) return 'bg-red-500 border-red-400'
    if (player === 2) return 'bg-blue-500 border-blue-400'
    return 'bg-purple-500 border-purple-400'
  }

  const getIndicator = () => {
    if (space.subArea === 'Caves') return '🕳️'
    if (space.subArea === 'Hunting Grounds') return '⚔️'
    if (space.quadrant === 'Pastures') return '🌾'
    if (space.quadrant === 'Forests') return '🌲'
    if (space.quadrant === 'Riverlands') return '🐟'
    return ''
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
        {/* Resource/Area Indicator */}
        {!space.piece && getIndicator() && (
          <div className="absolute inset-0 flex items-center justify-center text-xs opacity-70">
            {getIndicator()}
          </div>
        )}

        {/* Game Piece */}
        {space.piece && (
          <motion.div
            className={cn(
              'absolute inset-1 rounded-full border-2 flex items-center justify-center',
              'shadow-lg text-white font-bold text-xs',
              getPieceColor()
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {space.piece.type === 'bear' ? '🐻' : space.piece.playerId}
          </motion.div>
        )}

        {/* Selection Ring */}
        {(space.isSelected || selectedSpaceId === space.id) && (
          <motion.div
            className="absolute -inset-1 rounded-full border-2 border-yellow-400"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Highlight Ring for Valid Moves */}
        {space.isHighlighted && (
          <motion.div
            className="absolute -inset-1 rounded-full border-2 border-green-400 animate-pulse"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-500">
          {space.ring}-{space.segment}
        </div>
      )}
    </motion.div>
  )
}