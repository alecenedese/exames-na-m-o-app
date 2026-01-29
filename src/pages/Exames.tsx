import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { MapIcon, List, MessageCircle, Loader2, Search, ChevronLeft, Check, MapPin, Building2 } from 'lucide-react';

// Key for storing pending order in localStorage
const PENDING_ORDER_KEY = 'pending_order';

type Step = 'exams' | 'clinics' | 'confirm';
type Category = 'exame' | 'consulta';

export default function Exames() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('exams');
  const [category, setCategory] = useState<Category>(
    (searchParams.get('categoria') as Category) || 'exame'
  );
  const [selectedExams, setSelectedExams] = useState<ExamType[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDistance | null>(null);
  const [clinicPrices, setClinicPrices] = useState<ClinicExamPrice[]>([]);
  const [allClinicsPrices, setAllClinicsPrices] = useState<Map<string, ClinicExamPrice[]>>(new Map());
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [searchQuery, setSearchQuery] = useState('');

  const { exams, consultas, loading: loadingExams, examTypes } = useExamTypes();
  const { clinics, loading: loadingClinics, userLocation, getClinicExams, getClinicsPricesForExams } = useClinics();
  const { createAppointment, openWhatsApp, loading: creatingAppointment } = useAppointments();
  const { user } = useAuth();
  const { toast } = useToast();

  // Restore pending order after login
  useEffect(() => {
    const restorePendingOrder = async () => {
      const pendingOrderStr = localStorage.getItem(PENDING_ORDER_KEY);
      if (pendingOrderStr && user && examTypes.length > 0 && clinics.length > 0) {
        try {
          const pendingOrder = JSON.parse(pendingOrderStr);
          
          // Restore selected exams
          const restoredExams = examTypes.filter(e => pendingOrder.examIds.includes(e.id));
          if (restoredExams.length > 0) {
            setSelectedExams(restoredExams);
          }
          
          // Restore selected clinic
          const restoredClinic = clinics.find(c => c.id === pendingOrder.clinicId);
          if (restoredClinic) {
            setSelectedClinic(restoredClinic);
            const prices = await getClinicExams(restoredClinic.id);
            setClinicPrices(prices);
          }
          
          // Go to confirm step
          setStep('confirm');
          
          // Clear the pending order
          localStorage.removeItem(PENDING_ORDER_KEY);
          
          toast({
            title: 'Pedido restaurado!',
            description: 'Continue para finalizar seu agendamento',
          });
        } catch (err) {
          console.error('Error restoring pending order:', err);
          localStorage.removeItem(PENDING_ORDER_KEY);
        }
      }
    };
    
    restorePendingOrder();
  }, [user, examTypes, clinics]);

  const currentExamTypes = category === 'exame' ? exams : consultas;
  
  const filteredExamTypes = useMemo(() => {
    if (!searchQuery.trim()) return currentExamTypes;
    const query = searchQuery.toLowerCase().trim();
    return currentExamTypes.filter(exam => 
      exam.name.toLowerCase().includes(query) ||
      exam.description?.toLowerCase().includes(query)
    );
  }, [currentExamTypes, searchQuery]);

  // Fetch prices for all clinics when moving to clinics step
  useEffect(() => {
    if (step === 'clinics' && selectedExams.length > 0) {
      const fetchAllPrices = async () => {
        const examIds = selectedExams.map(e => e.id);
        const prices = await getClinicsPricesForExams(examIds);
        setAllClinicsPrices(prices);
      };
      fetchAllPrices();
    }
  }, [step, selectedExams]);

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

  const handleBack = () => {
    if (step === 'clinics') {
      setStep('exams');
    } else if (step === 'confirm') {
      setStep('clinics');
    }
  };

  const handleConfirm = async () => {
    if (!selectedClinic || selectedExams.length === 0) return;

    if (!user) {
      // Save the current order to localStorage
      const pendingOrder = {
        examIds: selectedExams.map(e => e.id),
        clinicId: selectedClinic.id,
      };
      localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pendingOrder));
      
      toast({
        title: 'Faça login para continuar',
        description: 'Você será redirecionado para a tela de login',
      });
      
      // Redirect to login
      navigate('/auth');
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

    // Clear pending order if exists
    localStorage.removeItem(PENDING_ORDER_KEY);

    // Open WhatsApp
    if (whatsappMessage) {
      openWhatsApp(selectedClinic.whatsapp, whatsappMessage);
    }

    toast({
      title: 'Agendamento salvo!',
      description: 'Acompanhe seus agendamentos na aba Agendamentos',
    });

    // Redirect to appointments page
    navigate('/agendamentos');
  };

  const totalPrice = clinicPrices
    .filter(p => selectedExams.some(e => e.id === p.exam_type_id))
    .reduce((sum, p) => sum + p.price, 0);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const stepTitles = {
    exams: 'Selecione os serviços',
    clinics: 'Escolha a clínica',
    confirm: 'Confirmar agendamento',
  };

  return (
    <>
      <MobileLayout showHeader={false}>
        <div className="min-h-screen bg-background">
          {/* Custom Header */}
          <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 text-white safe-area-top">
            <div className="flex items-center gap-3 px-4 h-14">
              {step !== 'exams' && (
                <button onClick={handleBack} className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className="font-semibold text-base flex-1">{stepTitles[step]}</h1>
              {selectedExams.length > 0 && step === 'exams' && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                  {selectedExams.length}
                </span>
              )}
            </div>
            
            {/* Progress indicator */}
            <div className="flex gap-1.5 px-4 pb-3">
              {['exams', 'clinics', 'confirm'].map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i <= ['exams', 'clinics', 'confirm'].indexOf(step)
                      ? 'bg-primary'
                      : 'bg-white/20'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="px-4 pb-32">
            <AnimatePresence mode="wait">
              {step === 'exams' && (
                <motion.div
                  key="exams"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Category tabs - pill style */}
                  <div className="flex gap-2 mt-4 p-1 bg-muted rounded-xl">
                    <button
                      onClick={() => { setCategory('exame'); setSearchQuery(''); }}
                      className={cn(
                        'flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all',
                        category === 'exame' 
                          ? 'bg-white text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Exames
                    </button>
                    <button
                      onClick={() => { setCategory('consulta'); setSearchQuery(''); }}
                      className={cn(
                        'flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all',
                        category === 'consulta' 
                          ? 'bg-white text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Consultas
                    </button>
                  </div>

                  {/* Search field - modern style */}
                  <div className="relative mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={`Buscar ${category === 'exame' ? 'exames' : 'consultas'}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 rounded-xl bg-card border-0 shadow-sm text-base"
                    />
                  </div>

                  {/* Exam list */}
                  <div className="mt-4 space-y-2">
                    {loadingExams ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                      </div>
                    ) : filteredExamTypes.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                          Nenhum resultado para "{searchQuery}"
                        </p>
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
                </motion.div>
              )}

              {step === 'clinics' && (
                <motion.div
                  key="clinics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* View toggle - modern pills */}
                  <div className="flex gap-2 mt-4 p-1 bg-muted rounded-xl">
                    <button
                      onClick={() => setViewMode('map')}
                      className={cn(
                        'flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                        viewMode === 'map' 
                          ? 'bg-white text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <MapIcon className="w-4 h-4" /> Mapa
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                        viewMode === 'list' 
                          ? 'bg-white text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <List className="w-4 h-4" /> Lista
                    </button>
                  </div>

                  {/* Selected exams summary */}
                  <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {selectedExams.map(exam => (
                      <div 
                        key={exam.id} 
                        className="flex-shrink-0 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3" />
                        {exam.name}
                      </div>
                    ))}
                  </div>

                  {viewMode === 'map' && (
                    <div className="mt-4">
                      <ClinicMap
                        clinics={clinics}
                        userLocation={userLocation}
                        selectedClinicId={selectedClinic?.id}
                        onClinicClick={handleClinicSelect}
                        selectedExams={selectedExams}
                        clinicsPrices={allClinicsPrices}
                      />
                    </div>
                  )}

                  {/* Clinic list */}
                  <div className={cn("mt-4 space-y-3", viewMode === 'map' && "mt-4")}>
                    {loadingClinics ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Buscando clínicas...</p>
                      </div>
                    ) : (
                      clinics.map(clinic => (
                        <ClinicCard
                          key={clinic.id}
                          clinic={clinic}
                          selected={selectedClinic?.id === clinic.id}
                          onClick={() => handleClinicSelect(clinic)}
                          selectedExams={selectedExams}
                          clinicPrices={allClinicsPrices.get(clinic.id) || []}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {step === 'confirm' && selectedClinic && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 space-y-4"
                >
                  {/* Clinic info card */}
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{selectedClinic.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-sm truncate">{selectedClinic.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exams breakdown */}
                  <div className="bg-card rounded-2xl p-4 shadow-sm border">
                    <h4 className="font-bold text-foreground mb-4">Resumo do pedido</h4>
                    <div className="space-y-3">
                      {selectedExams.map(exam => {
                        const price = clinicPrices.find(p => p.exam_type_id === exam.id);
                        return (
                          <div key={exam.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium">{exam.name}</span>
                            </div>
                            <span className="font-semibold">
                              R$ {price?.price ? formatPrice(price.price) : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-border">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-xl text-primary">R$ {formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom action bar - floating style */}
          {selectedExams.length > 0 && (
            <div className="fixed bottom-16 left-0 right-0 p-4 max-w-md mx-auto">
              <div className="bg-card/95 backdrop-blur-lg rounded-2xl p-3 shadow-xl border">
                {step === 'exams' && (
                  <Button 
                    onClick={() => setStep('clinics')} 
                    className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25"
                  >
                    Ver clínicas ({selectedExams.length} {selectedExams.length === 1 ? 'item' : 'itens'})
                  </Button>
                )}
                {step === 'clinics' && selectedClinic && (
                  <Button 
                    onClick={() => setStep('confirm')} 
                    className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25"
                  >
                    Continuar • R$ {formatPrice(
                      (allClinicsPrices.get(selectedClinic.id) || [])
                        .filter(p => selectedExams.some(e => e.id === p.exam_type_id))
                        .reduce((sum, p) => sum + p.price, 0)
                    )}
                  </Button>
                )}
                {step === 'confirm' && (
                  <Button 
                    onClick={handleConfirm} 
                    disabled={creatingAppointment} 
                    className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25 bg-[#25D366] hover:bg-[#20bd5a]"
                  >
                    {creatingAppointment ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Enviar pelo WhatsApp
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </MobileLayout>
      <BottomNav />
    </>
  );
}