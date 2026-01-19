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
        'w-full p-4 rounded-xl border-2 text-left transition-all',
        selected 
          ? 'border-primary bg-primary-light' 
          : 'border-border bg-card hover:border-primary/50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-sm',
            selected ? 'text-primary-dark' : 'text-foreground'
          )}>
            {exam.name}
          </h3>
          {exam.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {exam.description}
            </p>
          )}
          {price !== undefined && (
            <p className={cn(
              'text-sm font-bold mt-2',
              selected ? 'text-primary' : 'text-foreground'
            )}>
              R$ {price.toFixed(2)}
            </p>
          )}
        </div>
        <div className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
          selected 
            ? 'bg-primary border-primary' 
            : 'border-muted-foreground/30'
        )}>
          {selected && <Check className="w-4 h-4 text-primary-foreground" />}
        </div>
      </div>
    </motion.button>
  );
}
