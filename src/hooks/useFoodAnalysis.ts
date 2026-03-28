import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ScanResult } from '@/types/nutrition';

export function useFoodAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  const analyzeFrame = useCallback(async (imageDataUrl: string): Promise<ScanResult | null> => {
    if (isAnalyzing) return null;
    setIsAnalyzing(true);

    try {
      const base64 = imageDataUrl.split(',')[1];
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { image: base64 },
      });

      if (error) {
        const errorMsg = error.message || '';
        if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit')) {
          toast.error('Rate limited — please try again shortly', { id: 'rate-limit' });
          return null;
        }
        if (errorMsg.includes('402')) {
          toast.error('AI credits exhausted.', { id: 'credits' });
          return null;
        }
        throw error;
      }

      if (data?.error?.includes('Rate limited') || data?.error?.includes('429')) {
        toast.error('Rate limited — please try again shortly', { id: 'rate-limit' });
        return null;
      }

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
      toast.error('Failed to analyze food');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  const clearHistory = useCallback(() => setScanHistory([]), []);

  return { isAnalyzing, lastResult, scanHistory, analyzeFrame, clearHistory };
}
