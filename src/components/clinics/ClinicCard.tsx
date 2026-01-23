import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
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
      <div className="flex items-start justify-between gap-3">
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

          {/* Prices for selected exams */}
          {selectedExams.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              {hasAllPrices ? (
                <>
                  {examPrices.map(({ exam, price }) => (
                    <div key={exam.id} className="flex justify-between text-xs py-0.5">
                      <span className="text-muted-foreground truncate mr-2">{exam.name}</span>
                      <span className="font-medium text-foreground">R$ {formatPrice(price!)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between mt-2 pt-2 border-t border-border/50">
                    <span className="font-semibold text-sm">Total</span>
                    <span className="font-bold text-primary text-sm">R$ {formatPrice(totalPrice)}</span>
                  </div>
                </>
              ) : availableExams.length > 0 ? (
                <>
                  {examPrices.map(({ exam, price }) => (
                    <div key={exam.id} className="flex justify-between text-xs py-0.5">
                      <span className="text-muted-foreground truncate mr-2">{exam.name}</span>
                      {price !== undefined ? (
                        <span className="font-medium text-foreground">R$ {formatPrice(price)}</span>
                      ) : (
                        <span className="text-orange-500 text-xs">Indisponível</span>
                      )}
                    </div>
                  ))}
                  {availableExams.length > 0 && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-border/50">
                      <span className="font-semibold text-sm">Subtotal</span>
                      <span className="font-bold text-primary text-sm">R$ {formatPrice(totalPrice)}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-orange-500">Exames não disponíveis nesta clínica</p>
              )}
            </div>
          )}
        </div>
        
        <ChevronRight className={cn(
          'w-5 h-5 flex-shrink-0 mt-1',
          selected ? 'text-primary' : 'text-muted-foreground'
        )} />
      </div>
    </motion.button>
  );
}