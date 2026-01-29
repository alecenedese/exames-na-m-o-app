import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight, Building2, AlertCircle } from 'lucide-react';
import { ClinicWithDistance, ClinicExamPrice, ExamType } from '@/types';
import { cn } from '@/lib/utils';

interface ClinicCardProps {
  clinic: ClinicWithDistance;
  onClick: () => void;
  selected?: boolean;
  selectedExams?: ExamType[];
  clinicPrices?: ClinicExamPrice[];
}

const formatPrice = (price: number) => {
  return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function ClinicCard({ clinic, onClick, selected, selectedExams = [], clinicPrices = [] }: ClinicCardProps) {
  // Calculate total price for selected exams at this clinic
  const examPrices = selectedExams.map(exam => {
    const price = clinicPrices.find(p => p.exam_type_id === exam.id);
    return { exam, price: price?.price };
  });

  const availableExams = examPrices.filter(ep => ep.price !== undefined);
  const totalPrice = availableExams.reduce((sum, ep) => sum + (ep.price || 0), 0);
  const hasAllPrices = availableExams.length === selectedExams.length && selectedExams.length > 0;
  const hasNoExams = selectedExams.length > 0 && availableExams.length === 0;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl text-left transition-all overflow-hidden',
        selected 
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
          : '',
        hasNoExams 
          ? 'opacity-60' 
          : ''
      )}
    >
      <div className={cn(
        'p-4 transition-colors',
        selected 
          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20' 
          : 'bg-card border border-border hover:border-primary/30 shadow-sm'
      )}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            selected ? 'bg-primary text-white' : 'bg-muted'
          )}>
            <Building2 className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn(
                'font-bold text-sm',
                selected ? 'text-primary' : 'text-foreground'
              )}>
                {clinic.name}
              </h3>
              {clinic.distance !== undefined && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium flex-shrink-0">
                  {clinic.distance.toFixed(1)} km
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
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
            'w-5 h-5 flex-shrink-0 mt-3',
            selected ? 'text-primary' : 'text-muted-foreground/50'
          )} />
        </div>

        {/* Prices for selected exams */}
        {selectedExams.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            {hasNoExams ? (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Exames não disponíveis</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  {examPrices.map(({ exam, price }) => (
                    <div key={exam.id} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground truncate mr-2">{exam.name}</span>
                      {price !== undefined ? (
                        <span className="font-semibold text-foreground">R$ {formatPrice(price)}</span>
                      ) : (
                        <span className="text-orange-500 font-medium">Indisponível</span>
                      )}
                    </div>
                  ))}
                </div>
                {availableExams.length > 0 && (
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/50">
                    <span className="font-bold text-sm">
                      {hasAllPrices ? 'Total' : 'Subtotal'}
                    </span>
                    <span className="font-bold text-primary text-base">
                      R$ {formatPrice(totalPrice)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}