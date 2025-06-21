'use client'

import { useGameStore, GameSpace as GameSpaceType } from '@/store/gameStore'

export function GameBoard() {
  const { spaces } = useGameStore()

  // Group spaces by rings for rendering
  const rings = [0, 1, 2, 3, 4]
  const spacesByRing = rings.map(ring => 
    spaces.filter(space => space.ring === ring)
  )

  // Use a fixed viewBox for consistent proportions, let CSS handle sizing
  const viewBoxSize = 800
  const centerX = viewBoxSize / 2
  const centerY = viewBoxSize / 2
  const ringRadii = [120, 180, 240, 300, 360]

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Board Container */}
      <svg 
        className="w-full h-auto overflow-visible" 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background circles for visual reference */}
        {ringRadii.map((radius, index) => (
          <circle
            key={index}
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* Quadrant divider lines */}
        {[0, 1, 2, 3].map(i => {
          const angle = (i * Math.PI) / 2
          const x1 = centerX + Math.cos(angle) * 80
          const y1 = centerY + Math.sin(angle) * 80
          const x2 = centerX + Math.cos(angle) * 380
          const y2 = centerY + Math.sin(angle) * 380
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="3"
            />
          )
        })}

        {/* Mountain area boundary (between caves and hunting grounds) */}
        <path
          d={`M ${centerX + Math.cos(0) * 270} ${centerY + Math.sin(0) * 270}
              A 270 270 0 0 1 ${centerX + Math.cos(Math.PI/2) * 270} ${centerY + Math.sin(Math.PI/2) * 270}`}
          fill="none"
          stroke="rgba(239, 68, 68, 0.6)"
          strokeWidth="3"
          strokeDasharray="8,8"
        />

        {/* Quadrant Labels */}
        <text x={centerX + 320} y={centerY - 20} textAnchor="middle" className="fill-slate-300 text-lg font-medium">
          ⛰️ Mountains
        </text>
        <text x={centerX - 20} y={centerY - 320} textAnchor="middle" className="fill-slate-300 text-lg font-medium">
          🌾 Pastures
        </text>
        <text x={centerX - 320} y={centerY + 20} textAnchor="middle" className="fill-slate-300 text-lg font-medium">
          🌲 Forests
        </text>
        <text x={centerX + 20} y={centerY + 320} textAnchor="middle" className="fill-slate-300 text-lg font-medium">
          🏞️ Riverlands
        </text>

        {/* Mountain sub-area labels */}
        <text x={centerX + 160} y={centerY - 80} textAnchor="middle" className="fill-slate-400 text-sm">
          🐻 Caves (Safe)
        </text>
        <text x={centerX + 260} y={centerY - 160} textAnchor="middle" className="fill-red-400 text-sm">
          ⚔️ Hunting (Danger)
        </text>

        {/* Game Spaces - now inside SVG for proper scaling */}
        {spacesByRing.map((ringSpaces, ringIndex) =>
          ringSpaces.map(space => {
            const radius = ringRadii[ringIndex]
            const angle = space.angle
            // Round coordinates to avoid hydration mismatches
            const x = Math.round((centerX + Math.cos(angle) * radius) * 100) / 100
            const y = Math.round((centerY + Math.sin(angle) * radius) * 100) / 100
            const size = getSpaceSize(ringIndex)
            
            return (
              <GameSpaceSVG
                key={space.id}
                space={space}
                x={x}
                y={y}
                size={size}
              />
            )
          })
        )}
      </svg>

      {/* Center logo/indicator */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                   w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-700 border-2 border-slate-500 
                   flex items-center justify-center text-sm sm:text-xl"
      >
        🎯
      </div>
    </div>
  )
}

function getSpaceSize(ringIndex: number): number {
  // Smaller spaces for inner rings, larger for outer rings
  // Responsive sizing will be handled by SVG scaling
  return 12 + ringIndex * 3
}

// SVG-based GameSpace component for proper scaling
interface GameSpaceSVGProps {
  space: GameSpaceType
  x: number
  y: number
  size: number
}

function GameSpaceSVG({ space, x, y, size }: GameSpaceSVGProps) {
  const { 
    selectSpace, 
    selectedSpaceId, 
    selectedPieceId,
    movePiece,
    clearSelection,
    addToLog,
    currentPlayerIndex,
    players
  } = useGameStore()

  const currentPlayer = players[currentPlayerIndex]

  const handleClick = () => {
    // If this space is highlighted and we have a selected piece, try to move
    if (space.isHighlighted && selectedPieceId) {
      const success = movePiece(selectedPieceId, space.id)
      if (success) {
        clearSelection()
        addToLog(`${currentPlayer?.name} moved piece to ${space.quadrant}`)
      } else {
        addToLog('Move failed - invalid target')
      }
    } else {
      // Normal selection behavior
      selectSpace(space.id)
    }
  }

  const getSpaceColor = () => {
    if (space.isSelected || selectedSpaceId === space.id) {
      return '#fbbf24' // yellow-400
    }
    
    if (space.isHighlighted) {
      return '#10b981' // green-500
    }

    switch (space.quadrant) {
      case 'Mountains':
        return space.subArea === 'Caves' 
          ? '#64748b' // slate-500
          : '#ea580c' // orange-600
      case 'Pastures':
        return '#16a34a' // green-600
      case 'Forests':
        return '#166534' // green-800
      case 'Riverlands':
        return '#2563eb' // blue-600
      default:
        return '#64748b' // slate-500
    }
  }

  const getPieceColor = () => {
    if (!space.piece) return ''
    
    // All pieces are now bears or cubs - color by player
    const player = space.piece.playerId
    if (player === 1) return '#dc2626' // red-600
    if (player === 2) return '#2563eb' // blue-600
    return '#7c3aed' // purple-600 (fallback)
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
    <g>
      {/* Space Background */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={getSpaceColor()}
        stroke={space.isSelected || selectedSpaceId === space.id ? '#fbbf24' : '#374151'}
        strokeWidth={space.isSelected || selectedSpaceId === space.id ? 3 : 1}
        className="cursor-pointer hover:stroke-white transition-all duration-200"
        onClick={handleClick}
      />

      {/* Game Piece */}
      {space.piece && (
        <circle
          cx={x}
          cy={y}
          r={size * 0.7}
          fill={getPieceColor()}
          stroke="#1f2937"
          strokeWidth="1"
          className="cursor-pointer"
          onClick={handleClick}
        />
      )}

      {/* Text content for pieces or indicators */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-xs font-bold pointer-events-none select-none"
        fontSize={size * 0.6}
      >
        {space.piece 
          ? (space.piece.type === 'bear' ? '🐻' : '🐼')  // Adult bear vs cub
          : (!space.piece && getIndicator() ? getIndicator() : '')
        }
      </text>

      {/* Selection Ring */}
      {(space.isSelected || selectedSpaceId === space.id) && (
        <circle
          cx={x}
          cy={y}
          r={size + 2}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          className="animate-pulse"
        />
      )}

      {/* Highlight Ring for Valid Moves */}
      {space.isHighlighted && (
        <circle
          cx={x}
          cy={y}
          r={size + 2}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          className="animate-pulse"
        />
      )}
    </g>
  )
}