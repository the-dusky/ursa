'use client'

import { useState } from 'react'
import { useStateCoordinator, useCoordinatedGameActions } from '@/state/StateCoordinator'
import { useMultiplayerStore } from '@/state/MultiplayerStore'
import { CoreGameState, GameSpace as GameSpaceType } from '@/state/CoreGameState'
import { Button } from '@/components/ui/button'
import { useBearPlacement } from '@/hooks/useBearPlacement'

export function GameBoard() {
  const { gameState } = useStateCoordinator()
  const gameActions = useCoordinatedGameActions()
  const { isConnected: isMultiplayer, playerNumber } = useMultiplayerStore()
  const [showCoordinates, setShowCoordinates] = useState(false)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null)
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [hoveredAdjacentSpaces, setHoveredAdjacentSpaces] = useState<string[]>([])
  
  // Bear placement hook for two-step placement process
  const { handleSpaceSelect, selectedSpaceId: bearPlacementSelection, isInBearPlacementPhase } = useBearPlacement()
  
  const board = gameState.board
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const isMyTurn = !isMultiplayer || (currentPlayer && String(currentPlayer.id) === String(playerNumber))
  const isMovementPhase = gameState.turnPhase === 'movement'
  
  const toggleCoordinates = () => setShowCoordinates(!showCoordinates)
  
  // Get adjacent spaces using pre-calculated adjacency from BoardFactory
  const getAdjacentSpaces = (spaceId: string): string[] => {
    const space = board.spaces[spaceId] || board.bridges[spaceId]
    return space?.adjacentSpaces || []
  }
  
  // Get valid move spaces for selected piece
  const getValidMoveSpaces = (): string[] => {
    if (!selectedPieceId || !isMyTurn || !isMovementPhase) return []
    
    const piece = gameState.players
      .flatMap(p => p.pieces)
      .find(p => p.id === selectedPieceId)
    
    // During movement phase, allow multiple moves per turn until energy runs out
    // During other phases, respect the movedThisTurn flag for harvest rules
    if (!piece || (!isMovementPhase && piece.movedThisTurn)) return []
    
    const currentSpace = Object.values(board.spaces).find(s => s.piece?.id === selectedPieceId) ||
                        Object.values(board.bridges).find(s => s.piece?.id === selectedPieceId)
    
    if (!currentSpace) return []
    
    const adjacentSpaces = getAdjacentSpaces(currentSpace.id)
    
    // Filter out occupied spaces
    return adjacentSpaces.filter(spaceId => {
      const space = board.spaces[spaceId] || board.bridges[spaceId]
      return space && !space.piece
    })
  }
  
  const onSpaceClick = async (spaceId: string) => {
    console.log('Space clicked:', spaceId)
    
    // Handle bear placement during bear_placement phase
    if (gameState.gamePhase === 'bear_placement' && gameState.bearPlacementState) {
      const { currentPlayerIndex } = gameState.bearPlacementState
      const currentPlayer = gameState.players[currentPlayerIndex]
      const isMyTurn = !isMultiplayer || playerNumber === currentPlayer?.playerNumber
      
      if (isMyTurn && currentPlayer) {
        const space = board.spaces[spaceId]
        if (space && !space.piece) {
          try {
            await gameActions.placeBear(spaceId, String(currentPlayer.id))
          } catch (error) {
            console.error('Failed to place bear:', error)
          }
        }
      }
      return
    }
    
    // Handle piece movement during movement phase
    if (isMovementPhase && isMyTurn) {
      const clickedSpace = board.spaces[spaceId] || board.bridges[spaceId]
      
      // If clicking on a space with my piece, select it
      if (clickedSpace?.piece && 
          clickedSpace.piece.playerId === String(currentPlayer?.id)) {
        setSelectedPieceId(clickedSpace.piece.id)
        setSelectedSpaceId(spaceId)
        return
      }
      
      // If I have a piece selected and clicking on a valid move space, move there
      if (selectedPieceId && getValidMoveSpaces().includes(spaceId)) {
        const piece = gameState.players
          .flatMap(p => p.pieces)
          .find(p => p.id === selectedPieceId)
        
        const currentSpace = Object.values(board.spaces).find(s => s.piece?.id === selectedPieceId) ||
                            Object.values(board.bridges).find(s => s.piece?.id === selectedPieceId)
        
        if (piece && currentSpace) {
          try {
            await gameActions.movePiece(selectedPieceId, currentSpace.id, spaceId, String(currentPlayer?.id))
            setSelectedPieceId(null)
            setSelectedSpaceId(null)
          } catch (error) {
            console.error('Failed to move piece:', error)
          }
        }
        return
      }
    }
    
    // Default behavior - just select the space
    setSelectedSpaceId(selectedSpaceId === spaceId ? null : spaceId)
    setSelectedPieceId(null)
  }
  
  const onSpaceHover = (spaceId: string | null) => {
    setHoveredSpaceId(spaceId)
    
    // Only show adjacent spaces when coordinates are visible and when hovering
    if (spaceId && showCoordinates) {
      const adjacentSpaces = getAdjacentSpaces(spaceId)
      setHoveredAdjacentSpaces(adjacentSpaces)
    } else {
      setHoveredAdjacentSpaces([])
    }
  }

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


        {/* Mountain/Pasture Boundary Line (Position 0 Reference) */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + Math.cos(3 * Math.PI / 4) * 395}
          y2={centerY + Math.sin(3 * Math.PI / 4) * 395}
          stroke="#eab308"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.6"
        />


        {/* Space Numbers for Ring 5 (outermost) */}
        {(() => {
          const ring5Spaces = Object.values(board.spaces)
            .filter(space => space.ring === 5)
            .sort((a, b) => a.centerAngle - b.centerAngle)
          
          // Find the leftmost mountain space to start numbering from
          // Mountains should be around 270° (left side) with our board rotation
          const mountainSpaces = ring5Spaces.filter(space => space.quadrant === 'Mountains')
          const leftmostMountain = mountainSpaces.length > 0 ? mountainSpaces.reduce((leftmost, current) => {
            // Find the space closest to 270° (3π/2 radians)
            const leftmostDistance = Math.abs(leftmost.centerAngle - (3 * Math.PI / 2))
            const currentDistance = Math.abs(current.centerAngle - (3 * Math.PI / 2))
            return currentDistance < leftmostDistance ? current : leftmost
          }) : ring5Spaces[0] // Fallback to first space if no mountains found
          
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
            const leftEdgeAngle = space.centerAngle - anglePerSpace / 2 // Left edge of the space
            
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
            gameState={gameState}
            gameActions={gameActions}
            showCoordinates={showCoordinates}
            selectedSpaceId={selectedSpaceId}
            hoveredSpaceId={hoveredSpaceId}
            hoveredAdjacentSpaces={hoveredAdjacentSpaces}
            validMoveSpaces={getValidMoveSpaces()}
            selectedPieceId={selectedPieceId}
            isMyTurn={isMyTurn}
            isMovementPhase={isMovementPhase}
            onSpaceClick={onSpaceClick}
            onSpaceHover={onSpaceHover}
          />
        ))}

        {/* Bridge System - Cross-shaped center */}
        {board.bridges && Object.values(board.bridges).map(bridge => (
          <BridgeSpaceSVG
            key={bridge.id}
            space={bridge}
            gameState={gameState}
            gameActions={gameActions}
            showCoordinates={showCoordinates}
            selectedSpaceId={selectedSpaceId}
            hoveredSpaceId={hoveredSpaceId}
            hoveredAdjacentSpaces={hoveredAdjacentSpaces}
            validMoveSpaces={getValidMoveSpaces()}
            selectedPieceId={selectedPieceId}
            isMyTurn={isMyTurn}
            isMovementPhase={isMovementPhase}
            onSpaceClick={onSpaceClick}
            onSpaceHover={onSpaceHover}
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

function GameSpaceSVG({ space, gameState, gameActions, showCoordinates, selectedSpaceId, hoveredSpaceId, hoveredAdjacentSpaces, validMoveSpaces, selectedPieceId, isMyTurn, isMovementPhase, onSpaceClick, onSpaceHover }: GameSpaceSVGProps & {
  gameState: CoreGameState
  gameActions: ReturnType<typeof useCoordinatedGameActions>
  showCoordinates: boolean
  selectedSpaceId: string | null
  hoveredSpaceId: string | null
  hoveredAdjacentSpaces: string[]
  validMoveSpaces: string[]
  selectedPieceId: string | null
  isMyTurn: boolean
  isMovementPhase: boolean
  onSpaceClick: (spaceId: string) => void
  onSpaceHover: (spaceId: string | null) => void
}) {
  const board = gameState.board
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  

  const handleClick = () => {
    console.log("clicked " + space.id)
    console.log("Space object:", space)
    console.log("Adjacent spaces:", space.adjacentSpaces)
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
    const startAngle = space.centerAngle - anglePerSpace / 2
    const endAngle = space.centerAngle + anglePerSpace / 2
    
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
      x: centerX + Math.cos(space.centerAngle) * midRadius,
      y: centerY + Math.sin(space.centerAngle) * midRadius
    }
  }

  const centerPoint = getCenterPoint()

  const getSpaceColor = () => {
    // Highlight valid move destinations in bright green
    if (validMoveSpaces.includes(space.id)) {
      return '#10b981' // green-500
    }
    
    // Highlight selected piece in yellow
    if (selectedPieceId && space.piece?.id === selectedPieceId) {
      return '#fbbf24' // yellow-400
    }
    
    // Highlight selected space
    if (selectedSpaceId === space.id) {
      return '#fbbf24' // yellow-400
    }

    // Normal biome colors for all other spaces
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
    if (player === 'player-1' || player?.toString() === '1') return '#dc2626' // red-600
    if (player === 'player-2' || player?.toString() === '2') return '#2563eb' // blue-600
    return '#7c3aed' // purple-600 (fallback)
  }

  const getIndicator = () => {
    if (space.quadrant === 'Mountains') return '⛰️'
    if (space.quadrant === 'Pastures') return '🌾'
    if (space.quadrant === 'Forests') return space.hasHoney ? '🍯' : '🌲'
    if (space.quadrant === 'Riverlands') return '🐟'
    return ''
  }

  // Determine if this space should be highlighted as adjacent
  const isAdjacentToHovered = hoveredAdjacentSpaces.includes(space.id)
  const isHovered = hoveredSpaceId === space.id

  return (
    <g>
      {/* Trapezoid Space Background */}
      <path
        d={createTrapezoidPath()}
        fill={getSpaceColor()}
        stroke="#374151"
        strokeWidth="1"
        className="cursor-pointer transition-all duration-200"
        onClick={handleClick}
        onMouseEnter={() => onSpaceHover(space.id)}
        onMouseLeave={() => onSpaceHover(null)}
      />

      {/* Game Piece */}
      {space.piece && (
        <>
          {/* Movement indicator glow */}
          {isMovementPhase && isMyTurn && space.piece.playerId === String(currentPlayer?.id) && (() => {
            const fat = space.piece.fat || 0
            const movementCost = fat <= 5 ? 1 : fat <= 15 ? 2 : 3
            const hasEnergy = space.piece.energy >= movementCost
            
            if (hasEnergy) {
              return (
                <circle
                  cx={centerPoint.x}
                  cy={centerPoint.y}
                  r={24}
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="3"
                  className="animate-pulse"
                />
              )
            }
            return null
          })()}
          
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
        </>
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

      {/* Selection Highlight - no stroke, just fill overlay */}
      {(selectedSpaceId === space.id) && (
        <path
          d={createTrapezoidPath()}
          fill="rgba(251, 191, 36, 0.3)"
          stroke="none"
          className="animate-pulse pointer-events-none"
        />
      )}

      {/* Highlight for Valid Moves */}
      {validMoveSpaces.includes(space.id) && (
        <path
          d={createTrapezoidPath()}
          fill="rgba(16, 185, 129, 0.4)"
          stroke="none"
          className="animate-pulse pointer-events-none"
        />
      )}

    </g>
  )
}

// Bridge Space component for center cross system
interface BridgeSpaceSVGProps {
  space: GameSpaceType
}

function BridgeSpaceSVG({ space, gameState, gameActions, showCoordinates, selectedSpaceId, hoveredSpaceId, hoveredAdjacentSpaces, validMoveSpaces, selectedPieceId, isMyTurn, isMovementPhase, onSpaceClick, onSpaceHover }: BridgeSpaceSVGProps & {
  gameState: CoreGameState
  gameActions: ReturnType<typeof useCoordinatedGameActions>
  showCoordinates: boolean
  selectedSpaceId: string | null
  hoveredSpaceId: string | null
  hoveredAdjacentSpaces: string[]
  validMoveSpaces: string[]
  selectedPieceId: string | null
  isMyTurn: boolean
  isMovementPhase: boolean
  onSpaceClick: (spaceId: string) => void
  onSpaceHover: (spaceId: string | null) => void
}) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  const handleClick = () => {
    console.log("clicked bridge " + space.id)
    console.log("Bridge space object:", space)
    console.log("Adjacent spaces:", space.adjacentSpaces)
    if (space.edgeAngles) {
      console.log("Edge angles:", {
        left: `${(space.edgeAngles.left * 180 / Math.PI).toFixed(1)}°`,
        right: `${(space.edgeAngles.right * 180 / Math.PI).toFixed(1)}°`
      })
    } else {
      console.log("No edge angles found for bridge space")
    }
    onSpaceClick(space.id)
  }

  const getBridgeColor = () => {
    // Highlight valid move destinations in bright green
    if (validMoveSpaces.includes(space.id)) {
      return '#10b981' // green-500
    }
    
    // Highlight selected piece in yellow
    if (selectedPieceId && space.piece?.id === selectedPieceId) {
      return '#fbbf24' // yellow-400
    }
    
    // Highlight selected space
    if (selectedSpaceId === space.id) {
      return '#fbbf24' // yellow-400 (selected)
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
    
    // Determine if this space should be highlighted as adjacent
    const isAdjacentToHovered = hoveredAdjacentSpaces.includes(space.id)
    const isHovered = hoveredSpaceId === space.id
    
    return (
      <g>
        {/* Tunnel body - horizontal rectangle */}
        <rect
          x={centerX - tunnelWidth / 2}
          y={centerY - tunnelHeight / 2}
          width={tunnelWidth}
          height={tunnelHeight}
          fill={getBridgeColor()}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer transition-all duration-200"
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
          x={centerX - tunnelWidth / 2 + 1}
          y={centerY - tunnelHeight / 2 + 1}
          width={tunnelWidth - 2}
          height={tunnelHeight - 2}
          fill="none"
          stroke="#374151"
          strokeWidth="2"
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
          <>
            {/* Movement indicator glow */}
            {isMovementPhase && isMyTurn && space.piece.playerId === String(currentPlayer?.id) && (() => {
              const fat = space.piece.fat || 0
              const movementCost = fat <= 5 ? 1 : fat <= 15 ? 2 : 3
              const hasEnergy = space.piece.energy >= movementCost
              
              if (hasEnergy) {
                return (
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={10}
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )
              }
              return null
            })()}
            
            <circle
              cx={centerX}
              cy={centerY}
              r={6}
              fill={space.piece.playerId === 'player-1' || space.piece.playerId?.toString() === '1' ? '#dc2626' : '#2563eb'}
              stroke="#1f2937"
              strokeWidth="1"
              className="cursor-pointer"
              onClick={handleClick}
            />
          </>
        )}
        
        {/* Selection highlight - fill overlay */}
        {selectedSpaceId === space.id && (
          <rect
            x={centerX - tunnelWidth / 2}
            y={centerY - tunnelHeight / 2}
            width={tunnelWidth}
            height={tunnelHeight}
            fill="rgba(251, 191, 36, 0.3)"
            stroke="none"
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
          x={x + 1}
          y={y + 1}
          width={width - 2}
          height={height - 2}
          fill="none"
          stroke="#374151"
          strokeWidth="2"
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
          <>
            {/* Movement indicator glow */}
            {isMovementPhase && isMyTurn && space.piece.playerId === String(currentPlayer?.id) && (() => {
              const fat = space.piece.fat || 0
              const movementCost = fat <= 5 ? 1 : fat <= 15 ? 2 : 3
              const hasEnergy = space.piece.energy >= movementCost
              
              if (hasEnergy) {
                return (
                  <circle
                    cx={x + width / 2}
                    cy={y + height / 2}
                    r={9}
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )
              }
              return null
            })()}
            
            <circle
              cx={x + width / 2}
              cy={y + height / 2}
              r={5}
              fill={space.piece.playerId === 'player-1' || space.piece.playerId?.toString() === '1' ? '#dc2626' : '#2563eb'}
              stroke="#1f2937"
              strokeWidth="1"
              className="cursor-pointer"
              onClick={handleClick}
            />
          </>
        )}
        
        {/* Selection highlight - fill overlay */}
        {selectedSpaceId === space.id && (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="rgba(251, 191, 36, 0.3)"
            stroke="none"
            className="animate-pulse pointer-events-none"
          />
        )}
        
        {/* Highlight for Valid Moves - fill only */}
        {validMoveSpaces.includes(space.id) && (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="rgba(16, 185, 129, 0.4)"
            stroke="none"
            className="animate-pulse pointer-events-none"
          />
        )}
      </g>
    )
  }
}