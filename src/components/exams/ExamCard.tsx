import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamType } from '@/types';

interface ExamCardProps {
  exam: ExamType;
  selected: boolean;
  price?: number;
  onToggle: () => void;
}

export function ExamCard({ exam, selected, price, onToggle }: ExamCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={cn(
        'w-full p-4 rounded-2xl text-left transition-all relative overflow-hidden',
        selected 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
          : 'bg-card border border-border hover:border-primary/30 shadow-sm'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <div className={cn(
          'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
          selected 
            ? 'bg-white/20' 
            : 'border-2 border-muted-foreground/30'
        )}>
          {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-sm',
            selected ? 'text-white' : 'text-foreground'
          )}>
            {exam.name}
          </h3>
          {exam.description && (
            <p className={cn(
              'text-xs mt-0.5 line-clamp-1',
              selected ? 'text-white/70' : 'text-muted-foreground'
            )}>
              {exam.description}
            </p>
          )}
        </div>
        
        {price !== undefined && (
          <span className={cn(
            'text-sm font-bold flex-shrink-0',
            selected ? 'text-white' : 'text-primary'
          )}>
            R$ {price.toFixed(2)}
          </span>
        )}
      </div>
    </motion.button>
  );
}
