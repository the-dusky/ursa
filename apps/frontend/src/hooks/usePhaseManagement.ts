/**
 * Phase Management Hook
 * 
 * Separates turn phase logic from UI components
 */

import { useCallback, useMemo } from 'react'
import type { TurnPhase, Season, CoreGameSpace } from '@/engine/types'
import type { Player } from '@/store/gameStore'

interface UsePhaseManagementProps {
  player: Player | undefined
  turnPhase: TurnPhase
  season: Season
  energyTaxPaid: boolean
  isCurrentPlayer: boolean
  board: { spaces: { [spaceId: string]: CoreGameSpace } }
  onAdvanceTurn: () => void
  onAdvancePhase: () => void
  onHarvest: (pieceId: string) => void
}

export function usePhaseManagement({
  player,
  turnPhase,
  season,
  energyTaxPaid,
  isCurrentPlayer,
  board,
  onAdvanceTurn,
  onAdvancePhase,
  onHarvest
}: UsePhaseManagementProps) {
  // Check if player has bears in mountains during winter (for hibernation phase)
  const hasBearsInMountainsDuringWinter = season === 'Winter' && player?.pieces.some(piece => {
    const space = Object.values(board.spaces).find(s => s.piece?.id === piece.id)
    return space?.quadrant === 'Mountains'
  })

  // Check if all player's bears are hibernating
  const allBearsHibernating = (player?.pieces?.length ?? 0) > 0 && player?.pieces?.every(piece => piece.isHibernating) === true

  const turnPhases = useMemo(() => {
    const baseTurnPhases = ['movement', 'harvest', 'eat'] as const
    return hasBearsInMountainsDuringWinter 
      ? [...baseTurnPhases, 'hibernation', 'complete'] as const
      : [...baseTurnPhases, 'complete'] as const
  }, [hasBearsInMountainsDuringWinter])

  const getCurrentPhaseIndex = useCallback(() => {
    const currentIndex = turnPhases.findIndex(phase => phase === turnPhase)
    return currentIndex === -1 ? 0 : currentIndex
  }, [turnPhase, turnPhases])

  const handlePhaseChange = useCallback((phase: typeof turnPhases[number]) => {
    if (!isCurrentPlayer) return
    
    const currentIndex = getCurrentPhaseIndex()
    const targetIndex = turnPhases.findIndex(p => p === phase)
    
    // Only allow forward progression or staying on current phase
    if (targetIndex < currentIndex) return
    
    // Cannot advance from movement phase unless energy tax is paid
    if (turnPhase === 'movement' && !energyTaxPaid && phase !== 'movement') {
      return // Block advancement until tax is paid
    }
    
    if (phase === 'complete') {
      // Use action creator for turn advancement
      onAdvanceTurn()
    } else {
      // Use action creator for phase advancement
      onAdvancePhase()
      
      // If advancing to harvest, auto-harvest for all pieces
      if (phase === 'harvest' && energyTaxPaid) {
        // Auto-harvest for each piece individually using action creators
        player?.pieces.forEach((piece) => {
          onHarvest(piece.id)
        })
      }
    }
  }, [
    isCurrentPlayer, 
    getCurrentPhaseIndex, 
    turnPhase, 
    energyTaxPaid, 
    onAdvanceTurn, 
    onAdvancePhase, 
    onHarvest, 
    player?.pieces,
    turnPhases
  ])

  const getPhaseButtonProps = useCallback((phase: typeof turnPhases[number], index: number) => {
    const currentIndex = getCurrentPhaseIndex()
    const isCompleted = index < currentIndex
    const isCurrent = index === currentIndex && isCurrentPlayer
    const isNextPhase = index === currentIndex + 1
    // Can only advance to next phase if tax is paid (or staying on current phase)
    const canAdvance = energyTaxPaid || turnPhase !== 'movement' || !isNextPhase
    const isAvailable = index <= currentIndex + 1 && isCurrentPlayer && canAdvance

    return {
      isCompleted,
      isCurrent,
      isAvailable,
      onClick: () => handlePhaseChange(phase),
      label: phase === 'complete' ? 'End Turn' : phase.slice(0, 3)
    }
  }, [getCurrentPhaseIndex, isCurrentPlayer, energyTaxPaid, turnPhase, handlePhaseChange])

  return {
    turnPhases,
    allBearsHibernating,
    hasBearsInMountainsDuringWinter,
    getCurrentPhaseIndex,
    handlePhaseChange,
    getPhaseButtonProps
  }
}