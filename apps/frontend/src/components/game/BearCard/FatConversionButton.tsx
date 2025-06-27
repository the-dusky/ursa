/**
 * Fat Conversion Button Component
 * 
 * Handles fat to emergency energy conversion
 */

import type { CoreGamePiece } from '@/engine/types/GameState'
import { calculateFatConversion } from '@/utils/gameCalculations'

interface FatConversionButtonProps {
  piece: CoreGamePiece
  onConvertFat: (pieceId: string) => void
}

export function FatConversionButton({ piece, onConvertFat }: FatConversionButtonProps) {
  const conversion = calculateFatConversion(piece)
  
  return (
    <button
      onClick={() => onConvertFat(piece.id)}
      className={`text-xs rounded px-1 py-0.5 w-full relative z-10 ${
        conversion.canConvert 
          ? 'bg-orange-100 hover:bg-orange-200' 
          : 'bg-gray-100 cursor-not-allowed'
      }`}
      disabled={!conversion.canConvert}
      title={
        conversion.canConvert 
          ? `Convert ${conversion.fatRequired} fat to ${conversion.energyGained} energy (have ${conversion.currentFat} fat)` 
          : `Need ${conversion.fatRequired} fat to convert (have ${conversion.currentFat})`
      }
    >
      🔥→⚡ ({conversion.fatRequired}→{conversion.energyGained})
    </button>
  )
}