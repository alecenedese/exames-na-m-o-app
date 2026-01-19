import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Calendar } from 'lucide-react';

export default function Agendamentos() {
  return (
    <>
      <MobileLayout title="Agendamentos">
        <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-lg">Nenhum agendamento</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Seus agendamentos aparecerão aqui após você selecionar exames e escolher uma clínica.
          </p>
        </div>
      </MobileLayout>
      <BottomNav />
    </>
  );
}
