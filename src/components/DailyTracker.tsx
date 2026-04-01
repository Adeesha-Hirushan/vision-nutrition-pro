import { motion } from 'framer-motion';
import { Flame, Drumstick, Wheat, Droplets, Pencil, Check } from 'lucide-react';
import type { ScanResult } from '@/types/nutrition';
import { useMemo, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface DailyTrackerProps {
  scans: ScanResult[];
  calorieGoal: number;
  onCalorieGoalChange: (goal: number) => void;
  onGoalReached?: () => void;
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function ProgressRing({ value, max, color, children }: {
  value: number; max: number; color: string; children: React.ReactNode;
}) {
  const pct = Math.min(value / max, 1);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">{children}</div>
    </div>
  );
}

export function DailyTracker({ scans, calorieGoal, onCalorieGoalChange, onGoalReached }: DailyTrackerProps) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(calorieGoal));

  const totals = useMemo(() => {
    return scans.reduce((acc, s) => ({
      calories: acc.calories + s.totalCalories,
      protein: acc.protein + s.totalProtein,
      carbs: acc.carbs + s.totalCarbs,
      fats: acc.fats + s.totalFats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [scans]);

  const remaining = Math.max(0, calorieGoal - totals.calories);

  // Goal reached — check localStorage for date-based one-time trigger
  useEffect(() => {
    if (totals.calories >= calorieGoal && totals.calories > 0) {
      const todayKey = getTodayKey();
      const stored = localStorage.getItem('goalReachedDate');
      if (stored !== todayKey) {
        localStorage.setItem('goalReachedDate', todayKey);
        toast.success('🎉 You have reached your daily calorie goal!', { id: 'daily-goal', duration: 3000 });
        onGoalReached?.();
      }
    }
  }, [totals.calories, calorieGoal, onGoalReached]);

  const handleGoalSave = () => {
    const num = parseInt(goalInput, 10);
    if (num > 0 && num <= 10000) {
      onCalorieGoalChange(num);
      // Reset goal reached flag when goal changes
      localStorage.removeItem('goalReachedDate');
    } else {
      setGoalInput(String(calorieGoal));
    }
    setEditingGoal(false);
  };

  return (
    <div className="bg-card rounded-3xl p-5 space-y-4 shadow-md border border-border">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-foreground text-lg">Today's Summary</h2>
        {editingGoal ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-20 h-8 text-sm rounded-xl"
              min={100}
              max={10000}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleGoalSave()}
            />
            <button onClick={handleGoalSave} className="bg-primary text-primary-foreground rounded-full p-1.5">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setGoalInput(String(calorieGoal)); setEditingGoal(true); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Goal: {calorieGoal} kcal
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <ProgressRing value={totals.calories} max={calorieGoal} color="hsl(var(--primary))">
          <motion.span
            key={totals.calories}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-xl font-display font-bold gradient-text"
          >
            {totals.calories}
          </motion.span>
          <p className="text-[10px] text-muted-foreground">/ {calorieGoal} kcal</p>
        </ProgressRing>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          <span className="font-display font-bold text-foreground">{remaining}</span> kcal remaining
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Drumstick, label: 'Protein', value: totals.protein, color: 'bg-primary' },
          { icon: Wheat, label: 'Carbs', value: totals.carbs, color: 'bg-secondary' },
          { icon: Droplets, label: 'Fats', value: totals.fats, color: 'bg-accent' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-muted rounded-2xl p-3 text-center">
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${color} mb-1`}>
              <Icon className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-display font-semibold text-foreground">{value}g</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {scans.length} scan{scans.length !== 1 ? 's' : ''} today
      </p>
    </div>
  );
}
