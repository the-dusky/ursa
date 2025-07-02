'use client'

import { useGameStore, GameSpace as GameSpaceType } from '@/store/gameStore'
import { useSelectionState, useDevState } from '@/store/uiStore'
import { useUIInteractions } from '@/store/actions'
import { Button } from '@/components/ui/button'

export function GameBoard() {
  const { board } = useGameStore()
  const { showCoordinates, toggleCoordinates } = useDevState()

  // Use a fixed viewBox for consistent proportions, let CSS handle sizing
  const viewBoxSize = 800
  const centerX = viewBoxSize / 2
  const centerY = viewBoxSize / 2
  const ringRadii = [120, 180, 240, 300, 360]

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Coordinates Toggle Button - Top Right Corner */}
      <div className="absolute top-2 right-2 z-10">
        <Button
          onClick={toggleCoordinates}
          variant="outline"
          size="sm"
          className="bg-white/90 hover:bg-white shadow-md"
        >
          {showCoordinates ? '🎨' : '📍'}
        </Button>
      </div>
      
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

        {/* Quadrant divider lines - rotated 135° (-45°) */}
        {[0, 1, 2, 3].map(i => {
          const angle = (i * Math.PI) / 2 + Math.PI/4
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

        {/* Quadrant Labels - Rotated 45° so Mountains are at top */}
        <text x={centerX} y={centerY - 320} textAnchor="middle" className="fill-slate-300 text-lg font-medium">
          ⛰️ Mountains
        </text>
        <text x={centerX - 226} y={centerY - 226} textAnchor="middle" className="fill-slate-300 text-lg font-medium">
          🌾 Pastures
        </text>
        <text x={centerX} y={centerY + 320} textAnchor="middle" className="fill-slate-300 text-lg font-medium">
          🌲 Forests
        </text>
        <text x={centerX + 226} y={centerY - 226} textAnchor="middle" className="fill-slate-300 text-lg font-medium">
          🏞️ Riverlands
        </text>



        {/* Space Numbers for Ring 5 (outermost) */}
        {(() => {
          const ring5Spaces = Object.values(board.spaces)
            .filter(space => space.ring === 5)
            .sort((a, b) => a.angle - b.angle)
          
          // Find the leftmost mountain space to start numbering from
          // Mountains should be around 270° (left side) with our board rotation
          const mountainSpaces = ring5Spaces.filter(space => space.quadrant === 'Mountains')
          const leftmostMountain = mountainSpaces.reduce((leftmost, current) => {
            // Find the space closest to 270° (3π/2 radians)
            const leftmostDistance = Math.abs(leftmost.angle - (3 * Math.PI / 2))
            const currentDistance = Math.abs(current.angle - (3 * Math.PI / 2))
            return currentDistance < leftmostDistance ? current : leftmost
          })
          
          // Find the starting index
          const startIndex = ring5Spaces.findIndex(space => space.id === leftmostMountain.id)
          
          return ring5Spaces.map((space, index) => {
            // Calculate space number (1-36) starting from leftmost mountain
            const spaceNumber = ((index - startIndex + 36) % 36) + 1
            
            // Convert to position markers centered around space 33
            let displayText: string
            if (spaceNumber === 33) {
              displayText = "+1"
            } else if (spaceNumber === 32) {
              displayText = "-1"
            } else if (spaceNumber === 31) {
              displayText = "-2"
            } else if (spaceNumber === 30) {
              displayText = "-3"
            } else if (spaceNumber === 29) {
              displayText = "-4"
            } else if (spaceNumber === 28) {
              displayText = "-5"
            } else if (spaceNumber === 27) {
              displayText = "-6"
            } else if (spaceNumber === 34) {
              displayText = "+2"
            } else if (spaceNumber === 35) {
              displayText = "+3"
            } else if (spaceNumber === 36) {
              displayText = "+4"
            } else if (spaceNumber === 1) {
              displayText = "+5"
            } else if (spaceNumber === 2) {
              displayText = "+6"
            } else {
              displayText = "" // Hide other numbers
            }
            
            // Calculate position for space number - position over the LEFT edge line of the space
            const ringRadii = [0, 120, 180, 240, 300, 360]
            const outerRadius = ringRadii[5]
            const numberRadius = outerRadius + 20
            const centerX = 400
            const centerY = 400
            
            // Calculate the space's sector boundaries
            const ringConfig = board.rings[space.ring]
            const spaceCount = ringConfig.spaceCount
            const anglePerSpace = (2 * Math.PI) / spaceCount
            const leftEdgeAngle = space.angle - anglePerSpace / 2 // Left edge of the space
            
            const x = centerX + Math.cos(leftEdgeAngle) * numberRadius
            const y = centerY + Math.sin(leftEdgeAngle) * numberRadius
            
            return (
              <text
                key={`space-number-${space.id}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-slate-700 text-xs font-medium pointer-events-none"
              >
                {displayText}
              </text>
            )
          })
        })()}

        {/* Game Spaces - trapezoid sectors */}
        {Object.values(board.spaces).map(space => (
          <GameSpaceSVG
            key={space.id}
            space={space}
          />
        ))}

        {/* Bridge System - Cross-shaped center */}
        {board.bridges && Object.values(board.bridges).map(bridge => (
          <BridgeSpaceSVG
            key={bridge.id}
            space={bridge}
          />
        ))}
      </svg>
    </div>
  )
}

// SVG-based GameSpace component for trapezoid sectors
interface GameSpaceSVGProps {
  space: GameSpaceType
}

function GameSpaceSVG({ space }: GameSpaceSVGProps) {
  // Game state
  const { 
    board,
    areSpacesAdjacent
  } = useGameStore()
  
  // UI state
  const {
    selectedSpaceId,
    highlightedSpaces,
    hoveredSpaceId
  } = useSelectionState()
  
  // Dev state
  const { showCoordinates } = useDevState()
  
  // UI actions
  const {
    onSpaceClick,
    onSpaceHover
  } = useUIInteractions()
  

  const handleClick = () => {
    console.log("clicked " + space.id)
    // Use the UI action which handles all the logic
    onSpaceClick(space.id)
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
    if (selectedSpaceId === space.id) {
      return '#fbbf24' // yellow-400
    }
    
    if (highlightedSpaces.includes(space.id)) {
      return '#10b981' // green-500
    }

    // Show adjacent spaces in light blue when hovering
    if (hoveredSpaceId && areSpacesAdjacent(hoveredSpaceId, space.id)) {
      return '#93c5fd' // blue-300
    }

    // All mountains are gray now (no pink)
    if (space.quadrant === 'Mountains') {
      return '#64748b' // slate-500 - all mountains are gray
    }

    switch (space.quadrant) {
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
    if (space.quadrant === 'Mountains') return '⛰️'
    if (space.quadrant === 'Pastures') return '🌾'
    if (space.quadrant === 'Forests') return space.hasHoney ? '🍯' : '🌲'
    if (space.quadrant === 'Riverlands') return '🐟'
    return ''
  }

  return (
    <g>
      {/* Trapezoid Space Background */}
      <path
        d={createTrapezoidPath()}
        fill={getSpaceColor()}
        stroke={selectedSpaceId === space.id ? '#fbbf24' : '#374151'}
        strokeWidth={selectedSpaceId === space.id ? 3 : 1}
        className="cursor-pointer hover:stroke-white transition-all duration-200"
        onClick={handleClick}
        onMouseEnter={() => onSpaceHover(space.id)}
        onMouseLeave={() => onSpaceHover(null)}
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

      {/* Text content for pieces, coordinates, or indicators */}
      <text
        x={centerPoint.x}
        y={centerPoint.y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-sm font-bold pointer-events-none select-none"
      >
        {space.piece 
          ? (space.piece.type === 'bear' ? '🐻' : '🐼')  // Adult bear vs cub
          : showCoordinates 
            ? `R${space.ring}-${space.position}` // Show coordinates in dev mode
            : (!space.piece && getIndicator() ? getIndicator() : '')
        }
      </text>

      {/* Selection Highlight */}
      {(selectedSpaceId === space.id) && (
        <path
          d={createTrapezoidPath()}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="4"
          className="animate-pulse"
        />
      )}

      {/* Highlight for Valid Moves */}
      {highlightedSpaces.includes(space.id) && (
        <path
          d={createTrapezoidPath()}
          fill="rgba(16, 185, 129, 0.3)"
          stroke="#10b981"
          strokeWidth="3"
          className="animate-pulse"
          onClick={handleClick}
        />
      )}

      {/* Left stroke highlight for leftmost Mountain space */}
      {(() => {
        if (space.quadrant !== 'Mountains') return null
        
        // Find all mountain spaces on this specific ring
        const mountainSpacesOnRing = Object.values(board.spaces)
          .filter(s => s.quadrant === 'Mountains' && s.ring === space.ring)
        
        // Find the leftmost mountain space on this ring
        const leftmostMountain = mountainSpacesOnRing.reduce((leftmost, current) => {
          const leftmostDistance = Math.abs(leftmost.angle - Math.PI)
          const currentDistance = Math.abs(current.angle - Math.PI)
          return currentDistance < leftmostDistance ? current : leftmost
        })
        
        // If this is the leftmost mountain space, highlight its left edge
        if (space.id === leftmostMountain.id) {
          const centerX = 400
          const centerY = 400
          const ringConfig = board.rings[space.ring]
          const spaceCount = ringConfig.spaceCount
          const anglePerSpace = (2 * Math.PI) / spaceCount
          const leftEdgeAngle = space.angle - anglePerSpace / 2
          
          const ringRadii = [0, 120, 180, 240, 300, 360]
          const innerRadius = space.ring === 1 ? 60 : ringRadii[space.ring - 1]
          const outerRadius = ringRadii[space.ring]
          
          const x1 = centerX + Math.cos(leftEdgeAngle) * innerRadius
          const y1 = centerY + Math.sin(leftEdgeAngle) * innerRadius
          const x2 = centerX + Math.cos(leftEdgeAngle) * outerRadius
          const y2 = centerY + Math.sin(leftEdgeAngle) * outerRadius
          
          return (
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#ef4444"
              strokeWidth="4"
              opacity="0.8"
            />
          )
        }
        
        return null
      })()}
    </g>
  )
}

// Bridge Space component for center cross system
interface BridgeSpaceSVGProps {
  space: GameSpaceType
}

function BridgeSpaceSVG({ space }: BridgeSpaceSVGProps) {
  // Game state
  const { areSpacesAdjacent } = useGameStore()
  
  // UI state
  const {
    selectedSpaceId,
    highlightedSpaces,
    hoveredSpaceId
  } = useSelectionState()
  
  // Dev state
  const { showCoordinates } = useDevState()
  
  // UI actions
  const {
    onSpaceClick,
    onSpaceHover
  } = useUIInteractions()

  const handleClick = () => {
    console.log("clicked bridge " + space.id)
    onSpaceClick(space.id)
  }

  const getBridgeColor = () => {
    if (selectedSpaceId === space.id) {
      return '#fbbf24' // yellow-400 (selected)
    }
    
    if (highlightedSpaces.includes(space.id)) {
      return '#10b981' // green-500 (valid move)
    }

    // Show adjacent spaces in light blue when hovering
    if (hoveredSpaceId && areSpacesAdjacent(hoveredSpaceId, space.id)) {
      return '#93c5fd' // blue-300 (adjacent to hovered)
    }

    return '#64748b' // slate-500 (default bridge color)
  }

  const centerX = 400
  const centerY = 400
  
  // Different rendering based on bridge type
  if (space.subArea === 'Center') {
    // Center tunnel space - east-west tunnel with openings only on sides
    const tunnelWidth = 40
    const tunnelHeight = 20
    const openingWidth = 8
    
    return (
      <g>
        {/* Tunnel body - horizontal rectangle */}
        <rect
          x={centerX - tunnelWidth / 2}
          y={centerY - tunnelHeight / 2}
          width={tunnelWidth}
          height={tunnelHeight}
          fill={getBridgeColor()}
          className="cursor-pointer"
          onClick={handleClick}
          onMouseEnter={() => onSpaceHover(space.id)}
          onMouseLeave={() => onSpaceHover(null)}
        />
        
        {/* North and South walls to show it's a tunnel */}
        <rect
          x={centerX - tunnelWidth / 2 + openingWidth}
          y={centerY - tunnelHeight / 2 - 3}
          width={tunnelWidth - 2 * openingWidth}
          height={3}
          fill="#374151"
          className="pointer-events-none"
        />
        <rect
          x={centerX - tunnelWidth / 2 + openingWidth}
          y={centerY + tunnelHeight / 2}
          width={tunnelWidth - 2 * openingWidth}
          height={3}
          fill="#374151"
          className="pointer-events-none"
        />
        
        {/* Inner stroke for tunnel */}
        <rect
          x={centerX - tunnelWidth / 2 + (selectedSpaceId === space.id ? 1.5 : 1)}
          y={centerY - tunnelHeight / 2 + (selectedSpaceId === space.id ? 1.5 : 1)}
          width={tunnelWidth - (selectedSpaceId === space.id ? 3 : 2)}
          height={tunnelHeight - (selectedSpaceId === space.id ? 3 : 2)}
          fill="none"
          stroke={selectedSpaceId === space.id ? '#fbbf24' : '#374151'}
          strokeWidth={selectedSpaceId === space.id ? 3 : 2}
          className="pointer-events-none"
        />
        
        {/* Tunnel icon or coordinates */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white text-sm font-bold pointer-events-none select-none"
        >
          {showCoordinates ? space.id : '🚇'}
        </text>
        
        {/* Piece if present */}
        {space.piece && (
          <circle
            cx={centerX}
            cy={centerY}
            r={6}
            fill={space.piece.playerId === 1 ? '#dc2626' : '#2563eb'}
            stroke="#1f2937"
            strokeWidth="1"
            className="cursor-pointer"
            onClick={handleClick}
          />
        )}
        
        {/* Selection highlight - inset */}
        {selectedSpaceId === space.id && (
          <rect
            x={centerX - tunnelWidth / 2 + 2}
            y={centerY - tunnelHeight / 2 + 2}
            width={tunnelWidth - 4}
            height={tunnelHeight - 4}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            className="animate-pulse pointer-events-none"
          />
        )}
      </g>
    )
  } else {
    // Bridge arms - extend from center circle to touch Ring 1 inner edge
    const centerRadius = 20
    const ring1InnerRadius = 60
    const armLength = ring1InnerRadius - centerRadius  // 40px to reach Ring 1
    // Calculate width to match Ring 1 space width at inner edge
    const ring1SpaceCount = 20
    const ring1SpaceWidthAtInnerEdge = (2 * Math.PI * ring1InnerRadius) / ring1SpaceCount
    const armWidth = ring1SpaceWidthAtInnerEdge  // ~18.85px
    
    let x, y, width, height
    
    switch (space.subArea) {
      case 'North':
        x = centerX - armWidth / 2
        y = centerY - centerRadius - armLength
        width = armWidth
        height = armLength
        break
      case 'East':
        x = centerX + centerRadius
        y = centerY - armWidth / 2
        width = armLength
        height = armWidth
        break
      case 'South':
        x = centerX - armWidth / 2
        y = centerY + centerRadius
        width = armWidth
        height = armLength
        break
      case 'West':
        x = centerX - centerRadius - armLength
        y = centerY - armWidth / 2
        width = armLength
        height = armWidth
        break
      default:
        return null
    }
    
    return (
      <g>
        {/* Background rectangle for full size */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={getBridgeColor()}
          className="cursor-pointer"
          onClick={handleClick}
          onMouseEnter={() => onSpaceHover(space.id)}
          onMouseLeave={() => onSpaceHover(null)}
        />
        {/* Inner stroke rectangle */}
        <rect
          x={x + (selectedSpaceId === space.id ? 1.5 : 1)}
          y={y + (selectedSpaceId === space.id ? 1.5 : 1)}
          width={width - (selectedSpaceId === space.id ? 3 : 2)}
          height={height - (selectedSpaceId === space.id ? 3 : 2)}
          fill="none"
          stroke={selectedSpaceId === space.id ? '#fbbf24' : '#374151'}
          strokeWidth={selectedSpaceId === space.id ? 3 : 2}
          className="pointer-events-none"
        />
        
        {/* Direction indicator or coordinates */}
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white text-xs font-bold pointer-events-none select-none"
        >
          {showCoordinates ? space.id : space.subArea?.charAt(0)}
        </text>
        
        {/* Piece if present */}
        {space.piece && (
          <circle
            cx={x + width / 2}
            cy={y + height / 2}
            r={5}
            fill={space.piece.playerId === 1 ? '#dc2626' : '#2563eb'}
            stroke="#1f2937"
            strokeWidth="1"
            className="cursor-pointer"
            onClick={handleClick}
          />
        )}
        
        {/* Selection highlight - using inset stroke instead */}
        {selectedSpaceId === space.id && (
          <rect
            x={x + 2}
            y={y + 2}
            width={width - 4}
            height={height - 4}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="4"
            className="animate-pulse pointer-events-none"
          />
        )}
        
        {/* Highlight for Valid Moves - using inset stroke instead */}
        {highlightedSpaces.includes(space.id) && (
          <rect
            x={x + 1.5}
            y={y + 1.5}
            width={width - 3}
            height={height - 3}
            fill="rgba(16, 185, 129, 0.3)"
            stroke="#10b981"
            strokeWidth="3"
            className="animate-pulse pointer-events-none"
          />
        )}
      </g>
    )
  }
}