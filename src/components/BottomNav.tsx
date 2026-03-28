import { motion } from 'framer-motion';
import { ScanLine, BarChart3, Clock } from 'lucide-react';

type Tab = 'scan' | 'dashboard' | 'history';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'scan', icon: ScanLine, label: 'Scan' },
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
  { id: 'history', icon: Clock, label: 'History' },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bg-card rounded-2xl p-1.5 flex items-center gap-1 shadow-lg border border-border">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="relative flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors"
        >
          {active === id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary/10 rounded-xl"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          )}
          <Icon className={`w-5 h-5 relative z-10 ${active === id ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-xs font-display relative z-10 ${active === id ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
