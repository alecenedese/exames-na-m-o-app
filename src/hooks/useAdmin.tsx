import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClinicRegistration {
  id: string;
  user_id: string;
  clinic_name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  whatsapp: string;
  opening_hours: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  created_at: string;
}

export interface ClinicExamPrice {
  id: string;
  clinic_id: string;
  exam_type_id: string;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  clinic?: { name: string };
  exam_type?: { name: string; category: string };
}

export interface Appointment {
  id: string;
  user_id: string;
  clinic_id: string;
  status: string;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  created_at: string;
  clinic?: { name: string };
  profile?: { name: string };
  appointment_exams?: { exam_type: { name: string } }[];
}

export interface Clinic {
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

export function useAdmin() {
  const queryClient = useQueryClient();

  // Check if current user is super admin
  const { data: isSuperAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['is-super-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (error) throw error;
      return data as boolean;
    },
  });

  // Fetch pending clinic registrations
  const { data: pendingClinics, isLoading: loadingPending } = useQuery({
    queryKey: ['clinic-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClinicRegistration[];
    },
    enabled: isSuperAdmin === true,
  });

  // Fetch all clinics
  const { data: clinics, isLoading: loadingClinics } = useQuery({
    queryKey: ['admin-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Clinic[];
    },
    enabled: isSuperAdmin === true,
  });

  // Fetch exam types
  const { data: examTypes, isLoading: loadingExamTypes } = useQuery({
    queryKey: ['exam-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_types')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as ExamType[];
    },
    enabled: isSuperAdmin === true,
  });

  // Fetch clinic exam prices
  const { data: clinicPrices, isLoading: loadingPrices } = useQuery({
    queryKey: ['clinic-exam-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_exam_prices')
        .select(`
          *,
          clinic:clinics(name),
          exam_type:exam_types(name, category)
        `)
        .order('clinic_id');
      if (error) throw error;
      return data as ClinicExamPrice[];
    },
    enabled: isSuperAdmin === true,
  });

  // Fetch all appointments
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(name),
          profile:profiles!appointments_user_id_fkey(name),
          appointment_exams(exam_type:exam_types(name))
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: isSuperAdmin === true,
  });

  // Approve clinic registration
  const approveClinic = useMutation({
    mutationFn: async (registration: ClinicRegistration) => {
      // Create the clinic
      const { data: newClinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: registration.clinic_name,
          address: registration.address,
          city: registration.city,
          state: registration.state,
          phone: registration.phone,
          whatsapp: registration.whatsapp,
          opening_hours: registration.opening_hours,
        })
        .select()
        .single();

      if (clinicError) throw clinicError;

      // Update registration status
      const { error: updateError } = await supabase
        .from('clinic_registrations')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', registration.id);

      if (updateError) throw updateError;

      // Update user role to clinic_admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'clinic_admin' })
        .eq('user_id', registration.user_id);

      if (roleError) {
        // If no existing role, insert it
        await supabase
          .from('user_roles')
          .insert({ user_id: registration.user_id, role: 'clinic_admin' });
      }

      // Update profile role
      await supabase
        .from('profiles')
        .update({ role: 'clinic_admin' })
        .eq('user_id', registration.user_id);

      // Link clinic to admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', registration.user_id)
        .single();

      if (profileData) {
        await supabase
          .from('clinics')
          .update({ admin_user_id: profileData.id })
          .eq('id', newClinic.id);
      }

      return newClinic;
    },
    onSuccess: () => {
      toast.success('Clínica aprovada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clinic-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
    },
    onError: (error) => {
      toast.error('Erro ao aprovar clínica: ' + error.message);
    },
  });

  // Reject clinic registration
  const rejectClinic = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('clinic_registrations')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cadastro rejeitado');
      queryClient.invalidateQueries({ queryKey: ['clinic-registrations'] });
    },
    onError: (error) => {
      toast.error('Erro ao rejeitar: ' + error.message);
    },
  });

  // Create exam type
  const createExamType = useMutation({
    mutationFn: async (exam: Omit<ExamType, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('exam_types')
        .insert(exam)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Exame criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['exam-types'] });
    },
    onError: (error) => {
      toast.error('Erro ao criar exame: ' + error.message);
    },
  });

  // Update exam type
  const updateExamType = useMutation({
    mutationFn: async ({ id, ...exam }: Partial<ExamType> & { id: string }) => {
      const { error } = await supabase
        .from('exam_types')
        .update(exam)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Exame atualizado!');
      queryClient.invalidateQueries({ queryKey: ['exam-types'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Delete exam type
  const deleteExamType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exam_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Exame removido!');
      queryClient.invalidateQueries({ queryKey: ['exam-types'] });
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  // Delete clinic
  const deleteClinic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Clínica removida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
    },
    onError: (error) => {
      toast.error('Erro ao remover clínica: ' + error.message);
    },
  });

  // Delete appointment
  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      // Delete appointment exams first
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
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    },
  });

  // Set clinic exam price
  const setClinicPrice = useMutation({
    mutationFn: async ({ 
      clinic_id, 
      exam_type_id, 
      price, 
      is_available = true 
    }: { 
      clinic_id: string; 
      exam_type_id: string; 
      price: number;
      is_available?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('clinic_exam_prices')
        .upsert({
          clinic_id,
          exam_type_id,
          price,
          is_available,
        }, { 
          onConflict: 'clinic_id,exam_type_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Preço atualizado!');
      queryClient.invalidateQueries({ queryKey: ['clinic-exam-prices'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar preço: ' + error.message);
    },
  });

  return {
    isSuperAdmin,
    checkingAdmin,
    pendingClinics,
    loadingPending,
    clinics,
    loadingClinics,
    examTypes,
    loadingExamTypes,
    clinicPrices,
    loadingPrices,
    appointments,
    loadingAppointments,
    approveClinic,
    rejectClinic,
    deleteClinic,
    deleteAppointment,
    createExamType,
    updateExamType,
    deleteExamType,
    setClinicPrice,
  };
}
