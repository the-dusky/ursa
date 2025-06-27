/**
 * Energy Display Component
 * 
 * Shows regular and emergency energy
 */

import type { CoreGamePiece } from '@/engine/types/GameState'
import { getEnergyDisplayString } from '@/utils/gameCalculations'

interface EnergyDisplayProps {
  piece: CoreGamePiece | null
  isEmpty: boolean
}

export function EnergyDisplay({ piece, isEmpty }: EnergyDisplayProps) {
  if (isEmpty || !piece) {
    return (
      <div className="text-xs text-center">
        ⚡0
      </div>
    )
  }

  const energy = getEnergyDisplayString(piece)

  return (
    <div className="text-xs text-center">
      ⚡{energy.regular}
      {energy.hasEmergency && (
        <span className="text-orange-600">+{energy.emergency}</span>
      )}
    </div>
  )
}