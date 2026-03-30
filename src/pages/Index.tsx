import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf } from 'lucide-react';
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

  const handleCapture = useCallback((dataUrl: string) => {
    analyzeFrame(dataUrl);
  }, [analyzeFrame]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Green gradient header — taller & centered */}
      <header
        className="px-5 pt-12 pb-8 flex items-center justify-center"
        style={{ background: 'var(--gradient-header)', borderRadius: '0 0 1.5rem 1.5rem' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-white text-2xl tracking-tight">CalorieLens</h1>
        </div>
      </header>

      {/* Content */}
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
                />
              </div>
              <NutritionOverlay result={lastResult} />
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
