import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Drumstick, Wheat, Droplets, Sparkles, ChevronDown } from 'lucide-react';
import type { ScanResult } from '@/types/nutrition';
import { useState } from 'react';

interface NutritionOverlayProps {
  result: ScanResult | null;
}

function MacroChip({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType; label: string; value: number; unit: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`glass rounded-xl p-2 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-display font-semibold text-foreground">{value}{unit}</span>
    </div>
  );
}

export function NutritionOverlay({ result }: NutritionOverlayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {result && result.foods.length > 0 && (
        <motion.div
          key={result.id}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 p-3"
        >
          <div className="glass-strong rounded-2xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-foreground text-sm">
                  {result.foods.map(f => f.name).join(', ')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {result.foods.length} item{result.foods.length > 1 ? 's' : ''} detected
                  {' · '}
                  {Math.round(result.foods[0]?.confidence * 100)}% confidence
                </p>
              </div>
              <div className="text-right">
                <motion.span
                  key={result.totalCalories}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-display font-bold gradient-text"
                >
                  {result.totalCalories}
                </motion.span>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2">
              <MacroChip icon={Drumstick} label="Protein" value={result.totalProtein} unit="g" color="text-primary" />
              <MacroChip icon={Wheat} label="Carbs" value={result.totalCarbs} unit="g" color="text-accent" />
              <MacroChip icon={Droplets} label="Fats" value={result.totalFats} unit="g" color="text-foreground" />
              <MacroChip icon={Flame} label="Calories" value={result.totalCalories} unit="" color="text-primary" />
            </div>

            {/* Insights toggle */}
            {result.insights.length > 0 && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-primary w-full"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI Insights</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        {result.insights.map((insight, i) => (
                          <p key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            {insight}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
