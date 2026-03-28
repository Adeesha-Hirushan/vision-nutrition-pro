export interface FoodItem {
  name: string;
  confidence: number;
  portion: 'small' | 'medium' | 'large';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
}

export interface ScanResult {
  id: string;
  timestamp: Date;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  insights: string[];
  imageDataUrl?: string;
}

export interface DailyLog {
  date: string;
  scans: ScanResult[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}
