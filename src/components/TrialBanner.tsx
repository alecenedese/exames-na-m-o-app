import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrialBannerProps {
  daysRemaining?: number;
}

export function TrialBanner({ daysRemaining = 7 }: TrialBannerProps) {
  return (
    <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 shrink-0" />
        <span>Período de teste: {daysRemaining} dias restantes</span>
      </div>
      <Button 
        asChild 
        size="sm" 
        variant="secondary"
        className="shrink-0 bg-white text-orange-600 hover:bg-orange-50"
      >
        <Link to="/checkout">Pagar</Link>
      </Button>
    </div>
  );
}
