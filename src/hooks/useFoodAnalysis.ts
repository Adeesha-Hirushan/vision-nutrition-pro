import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ScanResult, FoodItem } from '@/types/nutrition';

export function useFoodAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const lastAnalysisTime = useRef(0);
  const cooldownMs = 3000;

  const analyzeFrame = useCallback(async (imageDataUrl: string): Promise<ScanResult | null> => {
    const now = Date.now();
    if (now - lastAnalysisTime.current < cooldownMs || isAnalyzing) return null;
    lastAnalysisTime.current = now;
    setIsAnalyzing(true);

    try {
      const base64 = imageDataUrl.split(',')[1];
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { image: base64 },
      });

      if (error) throw error;

      const result: ScanResult = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        foods: data.foods || [],
        totalCalories: data.totalCalories || 0,
        totalProtein: data.totalProtein || 0,
        totalCarbs: data.totalCarbs || 0,
        totalFats: data.totalFats || 0,
        insights: data.insights || [],
        imageDataUrl,
      };

      setLastResult(result);
      if (result.foods.length > 0) {
        setScanHistory(prev => [result, ...prev].slice(0, 50));
      }
      return result;
    } catch (err) {
      console.error('Analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  const clearHistory = useCallback(() => setScanHistory([]), []);

  return { isAnalyzing, lastResult, scanHistory, analyzeFrame, clearHistory };
}
