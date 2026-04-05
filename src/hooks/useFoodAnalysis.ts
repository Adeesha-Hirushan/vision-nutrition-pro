import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ScanResult, FoodItem } from '@/types/nutrition';

const MIN_CONFIDENCE = 0.7;

interface AnalyzeResult {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  insights: string[];
  error?: string;
}

async function analyzeImage(base64: string): Promise<AnalyzeResult | null> {
  const { data, error } = await supabase.functions.invoke('analyze-food', {
    body: { image: base64 },
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
      toast.error('Rate limited — please try again shortly', { id: 'rate-limit' });
      return null;
    }
    if (msg.includes('402')) {
      toast.error('AI credits exhausted.', { id: 'credits' });
      return null;
    }
    throw error;
  }

  if (data?.error?.includes('Rate limited') || data?.error?.includes('429')) {
    toast.error('Rate limited — please try again shortly', { id: 'rate-limit' });
    return null;
  }

  return data as AnalyzeResult;
}

export function useFoodAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  const analyzeMultipleFrames = useCallback(async (imageDataUrls: string[]): Promise<ScanResult | null> => {
    if (isAnalyzing) return null;
    setIsAnalyzing(true);

    try {
      // Use the last (best quality) frame only for speed
      const url = imageDataUrls[imageDataUrls.length - 1];
      const base64 = url.split(',')[1];
      const data = await analyzeImage(base64);
      if (!data) return null;
      const best = { data, imageDataUrl: url };

      // Filter low-confidence foods
      const filteredFoods = (best.data.foods || []).filter((f: FoodItem) => f.confidence >= MIN_CONFIDENCE);

      if (filteredFoods.length === 0) {
        // Low confidence — return a "low confidence" result
        const lowResult: ScanResult = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          foods: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
          insights: ['Could not identify food with enough confidence. Please try again with better lighting.'],
          imageDataUrl: best.imageDataUrl,
          lowConfidence: true,
        };
        setLastResult(lowResult);
        return lowResult;
      }

      const result: ScanResult = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        foods: filteredFoods,
        totalCalories: filteredFoods.reduce((s, f) => s + f.calories, 0),
        totalProtein: filteredFoods.reduce((s, f) => s + f.protein, 0),
        totalCarbs: filteredFoods.reduce((s, f) => s + f.carbs, 0),
        totalFats: filteredFoods.reduce((s, f) => s + f.fats, 0),
        insights: best.data.insights || [],
        imageDataUrl: best.imageDataUrl,
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

  // Single frame fallback
  const analyzeFrame = useCallback(async (imageDataUrl: string): Promise<ScanResult | null> => {
    return analyzeMultipleFrames([imageDataUrl]);
  }, [analyzeMultipleFrames]);

  const updateFoodName = useCallback((scanId: string, foodIndex: number, newName: string) => {
    setLastResult(prev => {
      if (!prev || prev.id !== scanId) return prev;
      const updated = { ...prev, foods: prev.foods.map((f, i) => i === foodIndex ? { ...f, name: newName } : f) };
      return updated;
    });
    setScanHistory(prev => prev.map(scan => {
      if (scan.id !== scanId) return scan;
      return { ...scan, foods: scan.foods.map((f, i) => i === foodIndex ? { ...f, name: newName } : f) };
    }));
    toast.success('Food name updated');
  }, []);

  const clearHistory = useCallback(() => setScanHistory([]), []);

  return { isAnalyzing, lastResult, scanHistory, analyzeFrame, analyzeMultipleFrames, updateFoodName, clearHistory };
}
