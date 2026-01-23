import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  MessageCircle, 
  ChevronRight,
  Loader2,
  Trash2,
  RefreshCw
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
    case 'confirmed':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmado</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function Agendamentos() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const { data: appointments, isLoading, refetch } = useQuery({
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
      // First delete appointment exams
      const { error: examsError } = await supabase
        .from('appointment_exams')
        .delete()
        .eq('appointment_id', appointmentId);
      
      if (examsError) throw examsError;

      // Then delete the appointment
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
        <MobileLayout title="Agendamentos">
          <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-lg">Faça login</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Entre na sua conta para ver seus agendamentos
            </p>
            <Button onClick={() => navigate('/auth')} className="mt-4">
              Entrar
            </Button>
          </div>
        </MobileLayout>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <MobileLayout title="Agendamentos">
        <div className="px-4 pb-24">
          {/* New appointment button */}
          <div className="mt-4">
            <Button 
              onClick={() => navigate('/exames')} 
              className="w-full h-12 font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="mt-6 space-y-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{appointment.clinic?.name}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{appointment.clinic?.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Exams list */}
                  <div className="border-t pt-3 mb-3">
                    <p className="text-xs text-muted-foreground mb-2">Exames/Consultas:</p>
                    {appointment.appointment_exams.map((exam) => (
                      <div key={exam.id} className="flex justify-between text-sm py-1">
                        <span className="text-foreground">{exam.exam_type?.name}</span>
                        <span className="font-medium">
                          {exam.price_at_booking ? `R$ ${formatPrice(exam.price_at_booking)}` : '-'}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t">
                      <span className="font-semibold text-sm">Total</span>
                      <span className="font-bold text-primary">
                        R$ {formatPrice(calculateTotal(appointment.appointment_exams))}
                      </span>
                    </div>
                  </div>

                  {/* Date info */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <Clock className="w-3 h-3" />
                    <span>Criado em {format(new Date(appointment.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleResendWhatsApp(appointment)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reenviar
                    </Button>
                    {appointment.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(appointment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-display font-bold text-lg">Nenhum agendamento</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Clique no botão acima para fazer seu primeiro agendamento
              </p>
            </div>
          )}
        </div>
      </MobileLayout>
      <BottomNav />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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