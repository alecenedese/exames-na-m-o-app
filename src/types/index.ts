// Database types for the app
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  cpf: string | null;
  rg: string | null;
  date_of_birth: string | null;
  phone: string | null;
  role: 'user' | 'clinic_admin' | 'super_admin';
  created_at: string;
  updated_at: string;
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
  latitude: number | null;
  longitude: number | null;
  admin_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamType {
  id: string;
  name: string;
  category: 'exame' | 'consulta';
  description: string | null;
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
  // Joined data
  exam_type?: ExamType;
  clinic?: Clinic;
}

export interface Appointment {
  id: string;
  user_id: string;
  clinic_id: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  whatsapp_message: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  clinic?: Clinic;
  appointment_exams?: AppointmentExam[];
}

export interface AppointmentExam {
  id: string;
  appointment_id: string;
  exam_type_id: string;
  price_at_booking: number | null;
  // Joined data
  exam_type?: ExamType;
}

// UI types
export interface SelectedExam {
  examType: ExamType;
  clinicPrice?: ClinicExamPrice;
}

export interface ClinicWithDistance extends Clinic {
  distance?: number; // in km
  exams?: ClinicExamPrice[];
}
