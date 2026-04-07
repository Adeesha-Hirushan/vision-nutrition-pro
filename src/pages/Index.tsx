import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Menu, X } from 'lucide-react';
import { CameraScanner } from '@/components/CameraScanner';
import { NutritionOverlay } from '@/components/NutritionOverlay';
import { DailyTracker } from '@/components/DailyTracker';
import { ScanHistory } from '@/components/ScanHistory';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { BottomNav } from '@/components/BottomNav';
import { useFoodAnalysis } from '@/hooks/useFoodAnalysis';
import { useVoice } from '@/hooks/useVoice';
import { toast } from 'sonner';

type Tab = 'scan' | 'dashboard' | 'history' | 'weekly';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

const Index = () => {
  const [tab, setTab] = useState<Tab>('scan');
  const [menuOpen, setMenuOpen] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState<number>(() => {
    const saved = localStorage.getItem('calorieGoal');
    return saved ? Number(saved) : 2000;
  });
  const { isAnalyzing, lastResult, scanHistory, analyzeMultipleFrames, updateFoodName, clearHistory } = useFoodAnalysis();
  const { speak } = useVoice();

  useEffect(() => {
    localStorage.setItem('calorieGoal', String(calorieGoal));
  }, [calorieGoal]);

  // Global daily calorie total
  const todayCalories = useMemo(() => {
    const todayKey = getTodayKey();
    return scanHistory
      .filter(s => new Date(s.timestamp).toISOString().split('T')[0] === todayKey)
      .reduce((sum, s) => sum + s.totalCalories, 0);
  }, [scanHistory]);

  // Global goal detection — works on any tab
  const checkAndTriggerGoal = useCallback((totalCal: number) => {
    if (totalCal >= calorieGoal && totalCal > 0) {
      const todayKey = getTodayKey();
      const stored = localStorage.getItem('goalReachedDate');
      if (stored !== todayKey) {
        localStorage.setItem('goalReachedDate', todayKey);
        toast.success('🎉 Congratulations! You reached your daily calorie goal!', { id: 'daily-goal', duration: 3000 });
        // Delay goal voice so it doesn't overlap food voice
        setTimeout(() => {
          speak('Congratulations! You have reached your daily calorie goal.');
        }, 1500);
      }
    }
  }, [calorieGoal, speak]);

  const handleCapture = useCallback(async (dataUrls: string[]) => {
    const result = await analyzeMultipleFrames(dataUrls);
    if (result) {
      if (result.lowConfidence || result.foods.length === 0) {
        speak('Sorry, I could not recognize the food. Please try again.');
      } else if (result.totalCalories > 0) {
        const foodName = result.foods.map(f => f.name).join(' and ');
        const msg = `This is ${foodName}. It contains ${result.totalCalories} calories, ${result.totalProtein} grams protein, ${result.totalCarbs} grams carbs, and ${result.totalFats} grams fat.`;
        speak(msg);

        // Check goal after scan (with delay for food voice)
        const todayKey = getTodayKey();
        const newTotal = scanHistory
          .filter(s => new Date(s.timestamp).toISOString().split('T')[0] === todayKey)
          .reduce((sum, s) => sum + s.totalCalories, 0) + result.totalCalories;
        setTimeout(() => checkAndTriggerGoal(newTotal), 4000);
      }
    } else {
      speak('Sorry, I could not recognize the food. Please try again.');
    }
  }, [analyzeMultipleFrames, speak, scanHistory, checkAndTriggerGoal]);

  const handleCameraOpened = useCallback(() => {
    speak('Camera opened. Get ready to scan.');
  }, [speak]);

  const handleTabChange = useCallback((newTab: Tab) => {
    setTab(newTab);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header
        className="px-5 pt-12 pb-6 flex items-center justify-between relative"
        style={{ background: 'var(--gradient-header)', borderRadius: '0 0 1.5rem 1.5rem' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2.5">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-bold text-white text-3xl tracking-tight">CalorieLens</h1>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-4">
          <button onClick={() => setTab('scan')} className="text-white/90 hover:text-white text-sm font-medium transition-colors">Home</button>
          <button onClick={() => setTab('weekly')} className="text-white/90 hover:text-white text-sm font-medium transition-colors">Weekly</button>
          <button onClick={() => setTab('dashboard')} className="text-white/90 hover:text-white text-sm font-medium transition-colors">Recipes</button>
        </nav>

        {/* Mobile hamburger */}
        <button className="sm:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mx-4 mt-2 bg-card rounded-2xl shadow-lg border border-border overflow-hidden z-50"
            >
              {[
                { label: 'Home', tab: 'scan' as Tab },
                { label: 'Weekly', tab: 'weekly' as Tab },
                { label: 'Recipes', tab: 'dashboard' as Tab },
              ].map(({ label, tab: t }, i) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setMenuOpen(false); }}
                  className={`w-full px-5 py-3.5 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 px-4 pt-4 pb-2 overflow-auto">
        <AnimatePresence mode="wait">
          {tab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="relative min-h-[320px] max-h-[400px]">
                <CameraScanner
                  onCapture={handleCapture}
                  isAnalyzing={isAnalyzing}
                  capturedImage={lastResult?.imageDataUrl}
                  onCameraOpened={handleCameraOpened}
                  scanFailed={lastResult?.lowConfidence || (lastResult !== null && lastResult.foods.length === 0)}
                />
              </div>
              <NutritionOverlay result={lastResult} onUpdateFoodName={updateFoodName} />
            </motion.div>
          )}

          {tab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pb-4"
            >
              <DailyTracker
                scans={scanHistory}
                calorieGoal={calorieGoal}
                onCalorieGoalChange={setCalorieGoal}
              />
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pb-4"
            >
              <ScanHistory scans={scanHistory} onClear={clearHistory} />
            </motion.div>
          )}

          {tab === 'weekly' && (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pb-4"
            >
              <WeeklyProgress scans={scanHistory} calorieGoal={calorieGoal} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="px-4 pb-4">
        <BottomNav active={tab} onChange={handleTabChange} />
      </div>
    </div>
  );
};

export default Index;
