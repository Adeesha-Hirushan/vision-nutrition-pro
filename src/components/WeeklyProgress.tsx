import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ScanResult } from '@/types/nutrition';

interface WeeklyProgressProps {
  scans: ScanResult[];
  calorieGoal: number;
}

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function WeeklyProgress({ scans, calorieGoal }: WeeklyProgressProps) {
  const days = useMemo(() => getLast7Days(), []);

  const dailyData = useMemo(() => {
    return days.map(dateStr => {
      const dayScans = scans.filter(s => {
        const sDate = new Date(s.timestamp).toISOString().split('T')[0];
        return sDate === dateStr;
      });
      const calories = dayScans.reduce((sum, s) => sum + s.totalCalories, 0);
      return {
        date: dateStr,
        day: getDayLabel(dateStr),
        calories,
        goalReached: calories >= calorieGoal && calories > 0,
        protein: dayScans.reduce((sum, s) => sum + s.totalProtein, 0),
        carbs: dayScans.reduce((sum, s) => sum + s.totalCarbs, 0),
        fats: dayScans.reduce((sum, s) => sum + s.totalFats, 0),
        scanCount: dayScans.length,
      };
    });
  }, [days, scans, calorieGoal]);

  const goalDays = dailyData.filter(d => d.goalReached).length;
  const activeDays = dailyData.filter(d => d.calories > 0).length;
  const avgCalories = activeDays > 0
    ? Math.round(dailyData.reduce((s, d) => s + d.calories, 0) / activeDays)
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Target, label: 'Goal Days', value: `${goalDays}/7` },
          { icon: TrendingUp, label: 'Avg Cal', value: `${avgCalories}` },
          { icon: CheckCircle2, label: 'Active Days', value: `${activeDays}` },
        ].map(({ icon: Icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl p-3 text-center shadow-md border border-border"
          >
            <div className="w-8 h-8 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-display font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-3xl p-4 shadow-md border border-border"
      >
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Weekly Calories</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData} barCategoryGap="20%">
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} kcal`, 'Calories']}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="calories" radius={[8, 8, 0, 0]} maxBarSize={36}>
              {dailyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.goalReached ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Goal reached</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block" /> Below goal</span>
        </div>
      </motion.div>

      {/* Goal Achievement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-3xl p-4 shadow-md border border-border"
      >
        <h3 className="font-display font-bold text-foreground text-sm mb-3">
          Goal Achievement — {goalDays} of 7 days
        </h3>
        <div className="grid grid-cols-7 gap-1.5">
          {dailyData.map((d, i) => (
            <motion.div
              key={d.date}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              {d.goalReached ? (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              ) : d.calories > 0 ? (
                <XCircle className="w-6 h-6 text-destructive/60" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-muted" />
              )}
              <span className="text-[9px] text-muted-foreground">{d.day}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Daily Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <h3 className="font-display font-bold text-foreground text-sm">Daily Breakdown</h3>
        {dailyData.map((d, i) => (
          <motion.div
            key={d.date}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className={`rounded-2xl p-3 flex items-center justify-between shadow-sm border ${
              d.goalReached ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
            }`}
          >
            <div>
              <p className="text-sm font-display font-semibold text-foreground">{d.day}</p>
              <p className="text-[10px] text-muted-foreground">{d.scanCount} scan{d.scanCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-display font-bold text-foreground">{d.calories} kcal</p>
              <p className={`text-[10px] font-medium ${d.goalReached ? 'text-primary' : d.calories > 0 ? 'text-destructive/70' : 'text-muted-foreground'}`}>
                {d.goalReached ? '✓ Goal reached' : d.calories > 0 ? '✗ Below goal' : 'No data'}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
