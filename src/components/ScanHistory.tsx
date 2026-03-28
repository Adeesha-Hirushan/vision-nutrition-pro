import { motion } from 'framer-motion';
import { Clock, Flame, Trash2 } from 'lucide-react';
import type { ScanResult } from '@/types/nutrition';

interface ScanHistoryProps {
  scans: ScanResult[];
  onClear: () => void;
}

export function ScanHistory({ scans, onClear }: ScanHistoryProps) {
  if (scans.length === 0) {
    return (
      <div className="glass-strong rounded-2xl p-6 text-center">
        <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No scans yet</p>
        <p className="text-muted-foreground text-xs mt-1">Point your camera at food to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-foreground text-lg">Scan History</h2>
        <button onClick={onClear} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-destructive transition-colors">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {scans.map((scan, i) => (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-3 flex items-center gap-3"
          >
            {scan.imageDataUrl && (
              <img src={scan.imageDataUrl} alt="scan" className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-semibold text-foreground truncate">
                {scan.foods.map(f => f.name).join(', ') || 'No food detected'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-primary">
                <Flame className="w-3 h-3" />
                <span className="text-sm font-display font-bold">{scan.totalCalories}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">kcal</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
