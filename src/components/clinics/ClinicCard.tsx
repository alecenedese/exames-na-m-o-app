import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, ChevronRight } from 'lucide-react';
import { ClinicWithDistance } from '@/types';
import { cn } from '@/lib/utils';

interface ClinicCardProps {
  clinic: ClinicWithDistance;
  onClick: () => void;
  selected?: boolean;
}

export function ClinicCard({ clinic, onClick, selected }: ClinicCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all',
        selected 
          ? 'border-primary bg-primary-light' 
          : 'border-border bg-card hover:border-primary/50'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              'font-semibold truncate',
              selected ? 'text-primary-dark' : 'text-foreground'
            )}>
              {clinic.name}
            </h3>
            {clinic.distance !== undefined && (
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                {clinic.distance.toFixed(1)} km
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs truncate">{clinic.address}</span>
          </div>
          
          {clinic.opening_hours && (
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs">{clinic.opening_hours}</span>
            </div>
          )}
        </div>
        
        <ChevronRight className={cn(
          'w-5 h-5 flex-shrink-0',
          selected ? 'text-primary' : 'text-muted-foreground'
        )} />
      </div>
    </motion.button>
  );
}
