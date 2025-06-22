'use client'

import { useGameStore } from '@/store/gameStore'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

export function SeasonIndicator() {
  const { season, year } = useGameStore()

  const seasonData = {
    Spring: { emoji: '🌸', color: 'bg-green-500', textColor: 'text-green-100' },
    Summer: { emoji: '☀️', color: 'bg-yellow-500', textColor: 'text-yellow-100' },
    Autumn: { emoji: '🍂', color: 'bg-orange-500', textColor: 'text-orange-100' },
    Winter: { emoji: '❄️', color: 'bg-blue-500', textColor: 'text-blue-100' }
  }

  const currentSeasonData = seasonData[season as keyof typeof seasonData]

  return (
    <motion.div 
      className="flex items-center gap-3"
      key={season}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Season Badge */}
      <Badge 
        className={`${currentSeasonData.color} ${currentSeasonData.textColor} px-3 py-1 text-sm font-medium border-0`}
      >
        <span className="mr-2 text-lg">{currentSeasonData.emoji}</span>
        {season}
      </Badge>

      {/* Year Indicator */}
      <Badge variant="outline" className="text-slate-300 border-slate-500">
        Year {year}
      </Badge>

      {/* Season Progress Dots */}
      <div className="flex gap-1">
        {['Spring', 'Summer', 'Autumn', 'Winter'].map((s) => (
          <motion.div
            key={s}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              s === season 
                ? currentSeasonData.color.replace('bg-', 'bg-') + ' scale-125' 
                : 'bg-slate-600'
            }`}
            animate={{
              scale: s === season ? 1.25 : 1,
              opacity: s === season ? 1 : 0.5
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}