/**
 * Energy Tax Button Component
 * 
 * Handles energy tax payment and death scenarios
 */

import type { CoreGamePiece, CoreGameSpace, Season } from '@/engine/types/GameState'
import { calculateSurvival } from '@/utils/gameCalculations'

interface EnergyTaxButtonProps {
  piece: CoreGamePiece
  space: CoreGameSpace | undefined
  season: Season
  onPayTax: (pieceId: string) => void
  onDeath: (pieceId: string) => void
}

export function EnergyTaxButton({ 
  piece, 
  space, 
  season, 
  onPayTax, 
  onDeath 
}: EnergyTaxButtonProps) {
  const survival = calculateSurvival(piece, space, season)
  
  if (!survival.canSurvive) {
    return (
      <button
        onClick={() => onDeath(piece.id)}
        className="text-xs bg-red-600 hover:bg-red-700 text-white rounded px-1 py-0.5 w-full"
        title={`Cannot pay ${survival.energyCost} energy tax - must die`}
      >
        💀 Die (Can&apos;t Pay)
      </button>
    )
  }
  
  return (
    <button
      onClick={() => onPayTax(piece.id)}
      className="text-xs bg-red-100 hover:bg-red-200 rounded px-1 py-0.5 w-full"
      disabled={!survival.canPayTax}
      title={`Pay ${survival.energyCost} energy tax`}
    >
      Tax {survival.energyCost}⚡
    </button>
  )
}