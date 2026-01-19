import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ExamType, Clinic, ClinicExamPrice } from '@/types';

interface CreateAppointmentData {
  clinic: Clinic;
  selectedExams: ExamType[];
  examPrices: ClinicExamPrice[];
  preferredDate?: string;
  preferredTime?: string;
}

export function useAppointments() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const createAppointment = async (data: CreateAppointmentData) => {
    if (!profile) {
      return { error: new Error('Você precisa estar logado para agendar'), appointment: null };
    }

    setLoading(true);

    try {
      // Generate WhatsApp message
      const whatsappMessage = generateWhatsAppMessage(data, profile.name);

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: profile.id,
          clinic_id: data.clinic.id,
          preferred_date: data.preferredDate || null,
          preferred_time: data.preferredTime || null,
          whatsapp_message: whatsappMessage,
          status: 'pending',
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create appointment exams
      const appointmentExams = data.selectedExams.map(exam => {
        const price = data.examPrices.find(p => p.exam_type_id === exam.id);
        return {
          appointment_id: appointment.id,
          exam_type_id: exam.id,
          price_at_booking: price?.price || null,
        };
      });

      const { error: examsError } = await supabase
        .from('appointment_exams')
        .insert(appointmentExams);

      if (examsError) throw examsError;

      return { error: null, appointment, whatsappMessage };
    } catch (err) {
      return { 
        error: err instanceof Error ? err : new Error('Erro ao criar agendamento'), 
        appointment: null 
      };
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppMessage = (data: CreateAppointmentData, userName: string): string => {
    const examsList = data.selectedExams.map(exam => {
      const price = data.examPrices.find(p => p.exam_type_id === exam.id);
      return `• ${exam.name}${price ? ` - R$ ${price.price.toFixed(2)}` : ''}`;
    }).join('\n');

    const total = data.examPrices
      .filter(p => data.selectedExams.some(e => e.id === p.exam_type_id))
      .reduce((sum, p) => sum + p.price, 0);

    let message = `🩺 *Solicitação de Agendamento - Exames na Mão*\n\n`;
    message += `👤 *Nome:* ${userName}\n`;
    
    if (data.preferredDate) {
      const date = new Date(data.preferredDate);
      message += `📅 *Data Preferida:* ${date.toLocaleDateString('pt-BR')}\n`;
    }
    
    if (data.preferredTime) {
      message += `🕐 *Horário Preferido:* ${data.preferredTime}\n`;
    }
    
    message += `\n📋 *Exames/Consultas Selecionados:*\n${examsList}\n`;
    message += `\n💰 *Total Estimado:* R$ ${total.toFixed(2)}\n`;
    message += `\n_Enviado pelo app Exames na Mão_`;

    return message;
  };

  const openWhatsApp = (whatsappNumber: string, message: string) => {
    // Format number: remove non-digits and ensure country code
    let formattedNumber = whatsappNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('55')) {
      formattedNumber = '55' + formattedNumber;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return {
    createAppointment,
    openWhatsApp,
    loading,
  };
}
