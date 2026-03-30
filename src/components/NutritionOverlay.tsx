import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Drumstick, Wheat, Droplets, Sparkles, ChevronDown, Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ScanResult } from '@/types/nutrition';
import { useState, useMemo } from 'react';

interface NutritionOverlayProps {
  result: ScanResult | null;
}

function MacroCard({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType; label: string; value: number; unit: string; color: string;
}) {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-card rounded-2xl p-3 flex flex-col items-center gap-1 shadow-md border border-border"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-primary-foreground" />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-display font-bold text-foreground">{value}{unit}</span>
    </motion.div>
  );
}

function HealthScoreBar({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 7) return 'bg-primary';
    if (s >= 4) return 'bg-yellow-400';
    return 'bg-destructive';
  };
  const getLabel = (s: number) => {
    if (s >= 7) return 'Healthy';
    if (s >= 4) return 'Moderate';
    return 'Unhealthy';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-semibold text-foreground">Health Score</span>
        </div>
        <span className="text-xs font-display font-bold text-foreground">{score}/10 · {getLabel(score)}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${getColor(score)}`}
        />
      </div>
    </div>
  );
}

export function NutritionOverlay({ result }: NutritionOverlayProps) {
  const [expanded, setExpanded] = useState(false);

  const healthScore = useMemo(() => {
    if (!result || result.foods.length === 0) return 5;
    const cal = result.totalCalories;
    const protein = result.totalProtein;
    const fats = result.totalFats;
    let score = 5;
    if (protein > 15) score += 2;
    if (fats < 15) score += 1;
    if (cal < 400) score += 1;
    if (cal > 800) score -= 2;
    if (fats > 30) score -= 1;
    return Math.max(1, Math.min(10, score));
  }, [result]);

  if (!result || result.foods.length === 0) return null;

  return (
    <motion.div
      key={result.id}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="space-y-3"
    >
      {/* Captured image with labels */}
      {result.imageDataUrl && (
        <div className="relative rounded-3xl overflow-hidden shadow-lg">
          <img src={result.imageDataUrl} alt="Scanned food" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {result.foods.map((food, i) => (
              <span key={i} className="bg-primary/90 text-primary-foreground text-xs font-display font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                {food.name} · {Math.round(food.confidence * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Food name + total calories */}
      <div className="bg-card rounded-3xl p-4 shadow-md border border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-foreground text-base">
              {result.foods.map(f => f.name).join(', ')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {result.foods.length} item{result.foods.length > 1 ? 's' : ''} detected
            </p>
          </div>
          <div className="text-right">
            <motion.span
              key={result.totalCalories}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-3xl font-display font-bold gradient-text"
            >
              {result.totalCalories}
            </motion.span>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
        </div>

        {/* Macro cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MacroCard icon={Wheat} label="Carbs" value={result.totalCarbs} unit="g" color="bg-secondary" />
          <MacroCard icon={Drumstick} label="Protein" value={result.totalProtein} unit="g" color="bg-primary" />
          <MacroCard icon={Droplets} label="Fats" value={result.totalFats} unit="g" color="bg-accent" />
        </div>

        {/* Health Score */}
        <HealthScoreBar score={healthScore} />

        {/* Insights */}
        {result.insights.length > 0 && (
          <div className="mt-3">
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
                  <div className="space-y-1.5 pt-2">
                    {result.insights.map((insight, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {insight}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
