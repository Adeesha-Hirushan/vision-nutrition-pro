import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { CameraScanner } from '@/components/CameraScanner';
import { NutritionOverlay } from '@/components/NutritionOverlay';
import { DailyTracker } from '@/components/DailyTracker';
import { ScanHistory } from '@/components/ScanHistory';
import { BottomNav } from '@/components/BottomNav';
import { useFoodAnalysis } from '@/hooks/useFoodAnalysis';

type Tab = 'scan' | 'dashboard' | 'history';

const Index = () => {
  const [tab, setTab] = useState<Tab>('scan');
  const { isAnalyzing, lastResult, scanHistory, analyzeFrame, clearHistory } = useFoodAnalysis();

  const handleFrame = useCallback((dataUrl: string) => {
    analyzeFrame(dataUrl);
  }, [analyzeFrame]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="gradient-bg rounded-lg p-1.5">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-foreground text-lg">CalorieVision <span className="gradient-text">Pro</span></h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-2 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col gap-3"
            >
              <div className="relative flex-1 min-h-0">
                <CameraScanner onFrame={handleFrame} isAnalyzing={isAnalyzing} />
                <NutritionOverlay result={lastResult} />
              </div>
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
              <DailyTracker scans={scanHistory} />
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

      {/* Bottom Nav */}
      <div className="px-4 pb-4">
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
};

export default Index;
