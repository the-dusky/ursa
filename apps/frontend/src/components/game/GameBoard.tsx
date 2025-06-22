'use client'

import { useGameStore, GameSpace as GameSpaceType } from '@/store/gameStore'

export function GameBoard() {
  const { board } = useGameStore()

  // No longer needed - rendering all spaces directly

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

        {/* Game Spaces - trapezoid sectors */}
        {Object.values(board.spaces).map(space => (
          <GameSpaceSVG
            key={space.id}
            space={space}
          />
        ))}
      </svg>

      {/* Center sun indicator */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                   w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-yellow-400 border-2 border-yellow-500 
                   flex items-center justify-center text-sm sm:text-xl"
      >
        ☀️
      </div>
    </div>
  )
}

// SVG-based GameSpace component for trapezoid sectors
interface GameSpaceSVGProps {
  space: GameSpaceType
}

function GameSpaceSVG({ space }: GameSpaceSVGProps) {
  const { 
    selectSpace, 
    selectedSpaceId, 
    selectedPieceId,
    movePiece,
    clearSelection,
    addToLog,
    currentPlayerIndex,
    players,
    highlightValidMoves,
    board,
    hoveredSpaceId,
    setHoveredSpace,
    areSpacesAdjacent
  } = useGameStore()

  const currentPlayer = players[currentPlayerIndex]

  const handleClick = () => {
    console.log("clicked " + space.id)
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
      
      // If selecting a piece that belongs to current player, immediately highlight moves
      if (space.piece && space.piece.playerId === currentPlayer?.id) {
        console.log("highlighted moves")
        highlightValidMoves(space.id)
      }
    }
  }

  // Calculate trapezoid sector path
  const createTrapezoidPath = () => {
    const centerX = 400 // viewBox center
    const centerY = 400 // viewBox center
    const ringConfig = board.rings[space.ring]
    const spaceCount = ringConfig.spaceCount
    const anglePerSpace = (2 * Math.PI) / spaceCount
    const startAngle = space.angle - anglePerSpace / 2
    const endAngle = space.angle + anglePerSpace / 2
    
    // Ring radii
    const ringRadii = [0, 120, 180, 240, 300, 360] // index 0 unused, rings 1-5
    const innerRadius = space.ring === 1 ? 60 : ringRadii[space.ring - 1]
    const outerRadius = ringRadii[space.ring]
    
    // Calculate the four corners of the trapezoid
    const innerStart = {
      x: centerX + Math.cos(startAngle) * innerRadius,
      y: centerY + Math.sin(startAngle) * innerRadius
    }
    const innerEnd = {
      x: centerX + Math.cos(endAngle) * innerRadius,
      y: centerY + Math.sin(endAngle) * innerRadius
    }
    const outerEnd = {
      x: centerX + Math.cos(endAngle) * outerRadius,
      y: centerY + Math.sin(endAngle) * outerRadius
    }
    const outerStart = {
      x: centerX + Math.cos(startAngle) * outerRadius,
      y: centerY + Math.sin(startAngle) * outerRadius
    }
    
    // Create path for trapezoid sector
    return `M ${innerStart.x} ${innerStart.y} 
            L ${outerStart.x} ${outerStart.y} 
            A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}
            L ${innerEnd.x} ${innerEnd.y} 
            A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y} 
            Z`
  }

  // Calculate center point for text and pieces
  const getCenterPoint = () => {
    const centerX = 400
    const centerY = 400
    const ringRadii = [0, 120, 180, 240, 300, 360]
    const innerRadius = space.ring === 1 ? 60 : ringRadii[space.ring - 1]
    const outerRadius = ringRadii[space.ring]
    const midRadius = (innerRadius + outerRadius) / 2
    
    return {
      x: centerX + Math.cos(space.angle) * midRadius,
      y: centerY + Math.sin(space.angle) * midRadius
    }
  }

  const centerPoint = getCenterPoint()

  const getSpaceColor = () => {
    if (space.isSelected || selectedSpaceId === space.id) {
      return '#fbbf24' // yellow-400
    }
    
    if (space.isHighlighted) {
      return '#10b981' // green-500
    }

    // Show adjacent spaces in light blue when hovering
    if (hoveredSpaceId && areSpacesAdjacent(hoveredSpaceId, space.id)) {
      return '#93c5fd' // blue-300
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
      {/* Trapezoid Space Background */}
      <path
        d={createTrapezoidPath()}
        fill={getSpaceColor()}
        stroke={space.isSelected || selectedSpaceId === space.id ? '#fbbf24' : '#374151'}
        strokeWidth={space.isSelected || selectedSpaceId === space.id ? 3 : 1}
        className="cursor-pointer hover:stroke-white transition-all duration-200"
        onClick={handleClick}
        onMouseEnter={() => setHoveredSpace(space.id)}
        onMouseLeave={() => setHoveredSpace(null)}
      />

      {/* Game Piece */}
      {space.piece && (
        <circle
          cx={centerPoint.x}
          cy={centerPoint.y}
          r={20}
          fill={getPieceColor()}
          stroke="#1f2937"
          strokeWidth="2"
          className="cursor-pointer"
          onClick={handleClick}
        />
      )}

      {/* Text content for pieces or indicators */}
      <text
        x={centerPoint.x}
        y={centerPoint.y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-sm font-bold pointer-events-none select-none"
      >
        {space.piece 
          ? (space.piece.type === 'bear' ? '🐻' : '🐼')  // Adult bear vs cub
          : (!space.piece && getIndicator() ? getIndicator() : '')
        }
      </text>

      {/* Selection Highlight */}
      {(space.isSelected || selectedSpaceId === space.id) && (
        <path
          d={createTrapezoidPath()}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="4"
          className="animate-pulse"
        />
      )}

      {/* Highlight for Valid Moves */}
      {space.isHighlighted && (
        <path
          d={createTrapezoidPath()}
          fill="rgba(16, 185, 129, 0.3)"
          stroke="#10b981"
          strokeWidth="3"
          className="animate-pulse"
          onClick={handleClick}
        />
      )}
    </g>
  )
}