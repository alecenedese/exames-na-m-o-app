import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ClinicData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  whatsapp: string;
  opening_hours: string | null;
  is_active: boolean;
  admin_user_id: string | null;
}

export interface ClinicRegistrationData {
  id: string;
  clinic_name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  whatsapp: string;
  opening_hours: string | null;
  status: string;
  created_at: string;
}

export interface ExamType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
}

export interface ClinicExamPrice {
  id: string;
  clinic_id: string;
  exam_type_id: string;
  price: number;
  is_available: boolean;
  requires_prescription: boolean;
}

export interface ClinicAppointment {
  id: string;
  user_id: string;
  clinic_id: string;
  status: string;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  created_at: string;
  profile?: { name: string; phone: string | null };
  appointment_exams?: { exam_type: { name: string }; price_at_booking: number | null }[];
}

export function useClinicAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get the current user's clinic
  const { data: clinic, isLoading: loadingClinic } = useQuery({
    queryKey: ['my-clinic', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('admin_user_id', (await supabase.from('profiles').select('id').eq('user_id', user!.id).single()).data?.id)
        .single();
      
      if (error) throw error;
      return data as ClinicData;
    },
    enabled: !!user,
  });

  // Get clinic registration (for CNPJ and other registration data)
  const { data: registration, isLoading: loadingRegistration } = useQuery({
    queryKey: ['my-registration', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_registrations')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as ClinicRegistrationData | null;
    },
    enabled: !!user,
  });

  // Get all exam types
  const { data: examTypes, isLoading: loadingExamTypes } = useQuery({
    queryKey: ['exam-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_types')
        .select('*')
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data as ExamType[];
    },
  });

  // Get clinic's prices
  const { data: clinicPrices, isLoading: loadingPrices } = useQuery({
    queryKey: ['my-clinic-prices', clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_exam_prices')
        .select('*')
        .eq('clinic_id', clinic!.id);
      
      if (error) throw error;
      return data as ClinicExamPrice[];
    },
    enabled: !!clinic?.id,
  });

  // Get clinic's appointments
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['my-clinic-appointments', clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profile:profiles!appointments_user_id_fkey(name, phone),
          appointment_exams(exam_type:exam_types(name), price_at_booking)
        `)
        .eq('clinic_id', clinic!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClinicAppointment[];
    },
    enabled: !!clinic?.id,
  });

  // Update clinic info
  const updateClinic = useMutation({
    mutationFn: async (data: Partial<ClinicData>) => {
      if (!clinic?.id) throw new Error('Clínica não encontrada');
      
      const { error } = await supabase
        .from('clinics')
        .update(data)
        .eq('id', clinic.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dados atualizados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['my-clinic'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Update registration info (CNPJ etc)
  const updateRegistration = useMutation({
    mutationFn: async (data: Partial<ClinicRegistrationData>) => {
      if (!registration?.id) throw new Error('Registro não encontrado');
      
      const { error } = await supabase
        .from('clinic_registrations')
        .update(data)
        .eq('id', registration.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dados atualizados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['my-registration'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Set exam price
  const setExamPrice = useMutation({
    mutationFn: async ({ 
      exam_type_id, 
      price, 
      is_available = true,
      requires_prescription = false
    }: { 
      exam_type_id: string; 
      price: number;
      is_available?: boolean;
      requires_prescription?: boolean;
    }) => {
      if (!clinic?.id) throw new Error('Clínica não encontrada');
      
      const { data, error } = await supabase
        .from('clinic_exam_prices')
        .upsert({
          clinic_id: clinic.id,
          exam_type_id,
          price,
          is_available,
          requires_prescription,
        } as any, { 
          onConflict: 'clinic_id,exam_type_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Preço atualizado!');
      queryClient.invalidateQueries({ queryKey: ['my-clinic-prices'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar preço: ' + error.message);
    },
  });

  // Update appointment status
  const updateAppointmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['my-clinic-appointments'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Delete appointment
  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error: examsError } = await supabase
        .from('appointment_exams')
        .delete()
        .eq('appointment_id', id);
      if (examsError) throw examsError;

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agendamento excluído!');
      queryClient.invalidateQueries({ queryKey: ['my-clinic-appointments'] });
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    },
  });

  return {
    clinic,
    registration,
    loadingClinic,
    loadingRegistration,
    examTypes,
    loadingExamTypes,
    clinicPrices,
    loadingPrices,
    appointments,
    loadingAppointments,
    updateClinic,
    updateRegistration,
    setExamPrice,
    updateAppointmentStatus,
    deleteAppointment,
  };
}
