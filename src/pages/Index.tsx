import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Menu, X } from 'lucide-react';
import { CameraScanner } from '@/components/CameraScanner';
import { NutritionOverlay } from '@/components/NutritionOverlay';
import { DailyTracker } from '@/components/DailyTracker';
import { ScanHistory } from '@/components/ScanHistory';
import { BottomNav } from '@/components/BottomNav';
import { useFoodAnalysis } from '@/hooks/useFoodAnalysis';
import { useVoice } from '@/hooks/useVoice';

type Tab = 'scan' | 'dashboard' | 'history';

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

  const handleCapture = useCallback(async (dataUrls: string[]) => {
    const result = await analyzeMultipleFrames(dataUrls);
    if (result) {
      if (result.lowConfidence || result.foods.length === 0) {
        speak('Sorry, I could not recognize the food. Please try again.');
      } else if (result.totalCalories > 0) {
        const foodName = result.foods.map(f => f.name).join(' and ');
        const msg = `This is ${foodName}. It contains ${result.totalCalories} calories, ${result.totalProtein} grams protein, ${result.totalCarbs} grams carbs, and ${result.totalFats} grams fat.`;
        speak(msg);
      }
    } else {
      speak('Sorry, I could not recognize the food. Please try again.');
    }
  }, [analyzeMultipleFrames, speak]);

  const handleCameraOpened = useCallback(() => {
    speak('Camera opened. Get ready to scan.');
  }, [speak]);

  const handleGoalReached = useCallback(() => {
    // Only called once per day by DailyTracker via localStorage check
    speak('Congratulations! You have reached your daily calorie goal.');
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
          <button onClick={() => { setTab('scan'); }} className="text-white/90 hover:text-white text-sm font-medium transition-colors">Home</button>
          <button onClick={() => { setTab('dashboard'); }} className="text-white/90 hover:text-white text-sm font-medium transition-colors">Recipes</button>
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
              <button
                onClick={() => { setTab('scan'); setMenuOpen(false); }}
                className="w-full px-5 py-3.5 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => { setTab('dashboard'); setMenuOpen(false); }}
                className="w-full px-5 py-3.5 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors border-t border-border"
              >
                Recipes
              </button>
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
              <div className="relative min-h-[260px] max-h-[320px]">
                <CameraScanner
                  onCapture={handleCapture}
                  isAnalyzing={isAnalyzing}
                  capturedImage={lastResult?.imageDataUrl}
                  onCameraOpened={handleCameraOpened}
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
                onGoalReached={handleGoalReached}
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
        </AnimatePresence>
      </main>

      <div className="px-4 pb-4">
        <BottomNav active={tab} onChange={handleTabChange} />
      </div>
    </div>
  );
};

export default Index;
