import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Flame, Trash2, X, Drumstick, Wheat, Droplets } from 'lucide-react';
import type { ScanResult } from '@/types/nutrition';
import { useState } from 'react';

interface ScanHistoryProps {
  scans: ScanResult[];
  onClear: () => void;
}

function DetailModal({ scan, onClose }: { scan: ScanResult; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        exit={{ y: 200 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
      >
        <div className="relative">
          {scan.imageDataUrl && (
            <img src={scan.imageDataUrl} alt="Food" className="w-full h-48 object-cover rounded-t-3xl" />
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm rounded-full p-1.5 shadow-md">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-foreground text-lg">
              {scan.foods.map(f => f.name).join(', ')}
            </h3>
            <div className="text-right">
              <span className="text-2xl font-display font-bold gradient-text">{scan.totalCalories}</span>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {new Date(scan.timestamp).toLocaleString()}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Wheat, label: 'Carbs', value: scan.totalCarbs, color: 'bg-secondary' },
              { icon: Drumstick, label: 'Protein', value: scan.totalProtein, color: 'bg-primary' },
              { icon: Droplets, label: 'Fats', value: scan.totalFats, color: 'bg-accent' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-muted rounded-2xl p-3 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${color} mb-1`}>
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-display font-bold text-foreground">{value}g</p>
              </div>
            ))}
          </div>

          {scan.insights.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-display font-semibold text-foreground">AI Insights</p>
              {scan.insights.map((insight, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {insight}</p>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ScanHistory({ scans, onClear }: ScanHistoryProps) {
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  if (scans.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-6 text-center shadow-md border border-border">
        <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No scans yet</p>
        <p className="text-muted-foreground text-xs mt-1">Point your camera at food to start</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-foreground text-lg">Scan History</h2>
          <button onClick={onClear} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-destructive transition-colors">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {scans.map((scan, i) => (
            <motion.button
              key={scan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedScan(scan)}
              className="w-full bg-card rounded-2xl p-3 flex items-center gap-3 shadow-md border border-border text-left"
            >
              {scan.imageDataUrl && (
                <img src={scan.imageDataUrl} alt="scan" className="w-12 h-12 rounded-xl object-cover" />
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
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedScan && (
          <DetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
