import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  Loader2,
  Trash2,
  Send,
  Building2,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AppointmentExam {
  id: string;
  exam_type_id: string;
  price_at_booking: number | null;
  exam_type: {
    id: string;
    name: string;
    category: string;
  };
}

interface Appointment {
  id: string;
  clinic_id: string;
  status: string;
  preferred_date: string | null;
  preferred_time: string | null;
  whatsapp_message: string | null;
  created_at: string;
  clinic: {
    id: string;
    name: string;
    address: string;
    whatsapp: string;
  };
  appointment_exams: AppointmentExam[];
}

const formatPrice = (price: number) => {
  return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    case 'confirmed':
      return { label: 'Confirmado', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    case 'completed':
      return { label: 'Concluído', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    case 'cancelled':
      return { label: 'Cancelado', className: 'bg-red-500/10 text-red-600 border-red-500/20' };
    default:
      return { label: status, className: '' };
  }
};

export default function Agendamentos() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['user-appointments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(*),
          appointment_exams(
            *,
            exam_type:exam_types(*)
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!profile?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error: examsError } = await supabase
        .from('appointment_exams')
        .delete()
        .eq('appointment_id', appointmentId);
      
      if (examsError) throw examsError;

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
      toast({
        title: 'Agendamento excluído',
        description: 'O agendamento foi removido com sucesso',
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAppointmentId) {
      deleteMutation.mutate(selectedAppointmentId);
    }
  };

  const handleResendWhatsApp = (appointment: Appointment) => {
    if (appointment.whatsapp_message && appointment.clinic?.whatsapp) {
      let formattedNumber = appointment.clinic.whatsapp.replace(/\D/g, '');
      if (!formattedNumber.startsWith('55')) {
        formattedNumber = '55' + formattedNumber;
      }
      const encodedMessage = encodeURIComponent(appointment.whatsapp_message);
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const calculateTotal = (exams: AppointmentExam[]) => {
    return exams.reduce((sum, exam) => sum + (exam.price_at_booking || 0), 0);
  };

  if (!user) {
    return (
      <>
        <MobileLayout showHeader={false}>
          <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 pt-12 pb-8 safe-area-top">
              <h1 className="text-xl font-bold">Meus Agendamentos</h1>
              <p className="text-slate-300 text-sm mt-1">Acompanhe seus pedidos</p>
            </div>
            
            <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-bold text-xl">Faça login</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Entre na sua conta para ver seus agendamentos
              </p>
              <Button 
                onClick={() => navigate('/auth')} 
                size="lg"
                className="mt-6 rounded-xl font-semibold"
              >
                Entrar na conta
              </Button>
            </div>
          </div>
        </MobileLayout>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <MobileLayout showHeader={false}>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 pt-12 pb-6 safe-area-top">
            <h1 className="text-xl font-bold">Meus Agendamentos</h1>
            <p className="text-slate-300 text-sm mt-1">Acompanhe seus pedidos</p>
          </div>

          <div className="px-4 pb-24 -mt-2">
            {/* New appointment button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Button 
                onClick={() => navigate('/exames')} 
                className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/25"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Agendamento
              </Button>
            </motion.div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className="mt-6 space-y-4">
                {appointments.map((appointment, index) => {
                  const statusConfig = getStatusConfig(appointment.status);
                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-2xl border shadow-sm overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-4 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-foreground truncate">
                                {appointment.clinic?.name}
                              </h3>
                              <Badge className={`${statusConfig.className} font-medium text-xs`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-xs truncate">{appointment.clinic?.address}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Exams list */}
                      <div className="px-4 py-3 bg-muted/30 border-t border-b">
                        <div className="space-y-2">
                          {appointment.appointment_exams.map((exam) => (
                            <div key={exam.id} className="flex justify-between items-center">
                              <span className="text-sm text-foreground">{exam.exam_type?.name}</span>
                              <span className="text-sm font-semibold">
                                {exam.price_at_booking ? `R$ ${formatPrice(exam.price_at_booking)}` : '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-border/50">
                          <span className="font-bold">Total</span>
                          <span className="font-bold text-lg text-primary">
                            R$ {formatPrice(calculateTotal(appointment.appointment_exams))}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-4 pt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>{format(new Date(appointment.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-10 rounded-xl font-semibold"
                            onClick={() => handleResendWhatsApp(appointment)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Reenviar
                          </Button>
                          {appointment.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-10 w-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                              onClick={() => handleDelete(appointment.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <CalendarDays className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="font-bold text-xl">Nenhum agendamento</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                  Clique no botão acima para fazer seu primeiro agendamento
                </p>
              </div>
            )}
          </div>
        </div>
      </MobileLayout>
      <BottomNav />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}