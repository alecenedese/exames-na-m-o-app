import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { ExamCard } from '@/components/exams/ExamCard';
import { ClinicCard } from '@/components/clinics/ClinicCard';
import { ClinicMap } from '@/components/clinics/ClinicMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExamTypes, useClinics } from '@/hooks/useClinics';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ExamType, ClinicWithDistance, ClinicExamPrice } from '@/types';
import { cn } from '@/lib/utils';
import { MapIcon, List, MessageCircle, Loader2, Search } from 'lucide-react';

type Step = 'exams' | 'clinics' | 'confirm';
type Category = 'exame' | 'consulta';

export default function Exames() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('exams');
  const [category, setCategory] = useState<Category>(
    (searchParams.get('categoria') as Category) || 'exame'
  );
  const [selectedExams, setSelectedExams] = useState<ExamType[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDistance | null>(null);
  const [clinicPrices, setClinicPrices] = useState<ClinicExamPrice[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [searchQuery, setSearchQuery] = useState('');

  const { exams, consultas, loading: loadingExams } = useExamTypes();
  const { clinics, loading: loadingClinics, userLocation, getClinicExams } = useClinics();
  const { createAppointment, openWhatsApp, loading: creatingAppointment } = useAppointments();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentExamTypes = category === 'exame' ? exams : consultas;
  
  const filteredExamTypes = useMemo(() => {
    if (!searchQuery.trim()) return currentExamTypes;
    const query = searchQuery.toLowerCase().trim();
    return currentExamTypes.filter(exam => 
      exam.name.toLowerCase().includes(query) ||
      exam.description?.toLowerCase().includes(query)
    );
  }, [currentExamTypes, searchQuery]);

  const toggleExam = (exam: ExamType) => {
    setSelectedExams(prev => 
      prev.find(e => e.id === exam.id)
        ? prev.filter(e => e.id !== exam.id)
        : [...prev, exam]
    );
  };

  const handleClinicSelect = async (clinic: ClinicWithDistance) => {
    setSelectedClinic(clinic);
    const prices = await getClinicExams(clinic.id);
    setClinicPrices(prices);
  };

  const handleConfirm = async () => {
    if (!selectedClinic || selectedExams.length === 0) return;

    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para agendar',
        variant: 'destructive',
      });
      return;
    }

    const { error, whatsappMessage } = await createAppointment({
      clinic: selectedClinic,
      selectedExams,
      examPrices: clinicPrices,
    });

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (whatsappMessage) {
      openWhatsApp(selectedClinic.whatsapp, whatsappMessage);
    }

    toast({
      title: 'Agendamento enviado!',
      description: 'Você será redirecionado para o WhatsApp',
    });
  };

  const totalPrice = clinicPrices
    .filter(p => selectedExams.some(e => e.id === p.exam_type_id))
    .reduce((sum, p) => sum + p.price, 0);

  return (
    <>
      <MobileLayout title={step === 'exams' ? 'Selecione os Exames' : step === 'clinics' ? 'Escolha a Clínica' : 'Confirmar'}>
        <div className="px-4 pb-32">
          {step === 'exams' && (
            <>
              {/* Category tabs */}
              <div className="flex gap-2 mt-4 sticky top-14 bg-background py-2 z-10">
                <button
                  onClick={() => { setCategory('exame'); setSearchQuery(''); }}
                  className={cn('category-pill flex-1', category === 'exame' ? 'category-pill-active' : 'category-pill-inactive')}
                >
                  Exames
                </button>
                <button
                  onClick={() => { setCategory('consulta'); setSearchQuery(''); }}
                  className={cn('category-pill flex-1', category === 'consulta' ? 'category-pill-active' : 'category-pill-inactive')}
                >
                  Consultas
                </button>
              </div>

              {/* Search field */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={`Buscar ${category === 'exame' ? 'exames' : 'consultas'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Exam list */}
              <div className="mt-4 space-y-3">
                {loadingExams ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredExamTypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum resultado encontrado para "{searchQuery}"
                  </div>
                ) : (
                  filteredExamTypes.map(exam => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      selected={selectedExams.some(e => e.id === exam.id)}
                      onToggle={() => toggleExam(exam)}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {step === 'clinics' && (
            <>
              {/* View toggle */}
              <div className="flex gap-2 mt-4 sticky top-14 bg-background py-2 z-10">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('category-pill flex-1 flex items-center justify-center gap-2', viewMode === 'list' ? 'category-pill-active' : 'category-pill-inactive')}
                >
                  <List className="w-4 h-4" /> Lista
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={cn('category-pill flex-1 flex items-center justify-center gap-2', viewMode === 'map' ? 'category-pill-active' : 'category-pill-inactive')}
                >
                  <MapIcon className="w-4 h-4" /> Mapa
                </button>
              </div>

              {viewMode === 'map' && (
                <div className="mt-4">
                  <ClinicMap
                    clinics={clinics}
                    userLocation={userLocation}
                    selectedClinicId={selectedClinic?.id}
                    onClinicClick={handleClinicSelect}
                  />
                </div>
              )}

              {/* Clinic list */}
              <div className="mt-4 space-y-3">
                {loadingClinics ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  clinics.map(clinic => (
                    <ClinicCard
                      key={clinic.id}
                      clinic={clinic}
                      selected={selectedClinic?.id === clinic.id}
                      onClick={() => handleClinicSelect(clinic)}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {step === 'confirm' && selectedClinic && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
              <div className="card-elevated">
                <h3 className="font-semibold">{selectedClinic.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedClinic.address}</p>
              </div>

              <div className="card-elevated">
                <h4 className="font-medium mb-3">Exames selecionados:</h4>
                {selectedExams.map(exam => {
                  const price = clinicPrices.find(p => p.exam_type_id === exam.id);
                  return (
                    <div key={exam.id} className="flex justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{exam.name}</span>
                      <span className="font-medium">R$ {price?.price?.toFixed(2) || '-'}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-3 mt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom action bar */}
        {selectedExams.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t max-w-md mx-auto">
            {step === 'exams' && (
              <Button onClick={() => setStep('clinics')} className="w-full h-12 font-semibold">
                Continuar ({selectedExams.length} {selectedExams.length === 1 ? 'item' : 'itens'})
              </Button>
            )}
            {step === 'clinics' && selectedClinic && (
              <Button onClick={() => setStep('confirm')} className="w-full h-12 font-semibold">
                Ver resumo
              </Button>
            )}
            {step === 'confirm' && (
              <Button onClick={handleConfirm} disabled={creatingAppointment} className="w-full h-12 font-semibold">
                {creatingAppointment ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Enviar pelo WhatsApp
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </MobileLayout>
      <BottomNav />
    </>
  );
}
