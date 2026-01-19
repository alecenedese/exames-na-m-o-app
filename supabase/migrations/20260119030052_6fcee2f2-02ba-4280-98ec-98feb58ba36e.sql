-- =============================================
-- EXAMES NA MÃO - Database Schema
-- =============================================

-- 1. PROFILES TABLE (user data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  date_of_birth DATE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'clinic_admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. CLINICS TABLE
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Ipatinga',
  state TEXT NOT NULL DEFAULT 'MG',
  phone TEXT,
  whatsapp TEXT NOT NULL,
  opening_hours TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  admin_user_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. EXAM TYPES TABLE
CREATE TABLE public.exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exame', 'consulta')),
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. CLINIC EXAM PRICES TABLE (junction table with prices)
CREATE TABLE public.clinic_exam_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, exam_type_id)
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  preferred_date DATE,
  preferred_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  whatsapp_message TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. APPOINTMENT EXAMS (junction table)
CREATE TABLE public.appointment_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
  price_at_booking NUMERIC(10, 2),
  UNIQUE(appointment_id, exam_type_id)
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Get current user's profile
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is clinic admin
CREATE OR REPLACE FUNCTION public.is_clinic_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('clinic_admin', 'super_admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is admin of specific clinic
CREATE OR REPLACE FUNCTION public.is_admin_of_clinic(clinic_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clinics c
    INNER JOIN public.profiles p ON c.admin_user_id = p.id
    WHERE c.id = clinic_id AND p.user_id = auth.uid()
  ) OR public.is_super_admin()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_exam_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_exams ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - PROFILES
-- =============================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- RLS POLICIES - CLINICS
-- =============================================

CREATE POLICY "Anyone can view active clinics"
  ON public.clinics FOR SELECT
  USING (is_active = true OR public.is_admin_of_clinic(id));

CREATE POLICY "Clinic admins can update their clinics"
  ON public.clinics FOR UPDATE
  USING (public.is_admin_of_clinic(id));

CREATE POLICY "Super admins can insert clinics"
  ON public.clinics FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete clinics"
  ON public.clinics FOR DELETE
  USING (public.is_super_admin());

-- =============================================
-- RLS POLICIES - EXAM TYPES
-- =============================================

CREATE POLICY "Anyone can view exam types"
  ON public.exam_types FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage exam types"
  ON public.exam_types FOR ALL
  USING (public.is_super_admin());

-- =============================================
-- RLS POLICIES - CLINIC EXAM PRICES
-- =============================================

CREATE POLICY "Anyone can view available prices"
  ON public.clinic_exam_prices FOR SELECT
  USING (is_available = true OR public.is_admin_of_clinic(clinic_id));

CREATE POLICY "Clinic admins can manage their prices"
  ON public.clinic_exam_prices FOR ALL
  USING (public.is_admin_of_clinic(clinic_id));

-- =============================================
-- RLS POLICIES - APPOINTMENTS
-- =============================================

CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (
    user_id = public.get_user_profile_id() 
    OR public.is_admin_of_clinic(clinic_id)
  );

CREATE POLICY "Users can create their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (user_id = public.get_user_profile_id());

CREATE POLICY "Users can update their pending appointments"
  ON public.appointments FOR UPDATE
  USING (
    (user_id = public.get_user_profile_id() AND status = 'pending')
    OR public.is_admin_of_clinic(clinic_id)
  );

CREATE POLICY "Users can delete their pending appointments"
  ON public.appointments FOR DELETE
  USING (
    (user_id = public.get_user_profile_id() AND status = 'pending')
    OR public.is_super_admin()
  );

-- =============================================
-- RLS POLICIES - APPOINTMENT EXAMS
-- =============================================

CREATE POLICY "Users can view their appointment exams"
  ON public.appointment_exams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id
      AND (a.user_id = public.get_user_profile_id() OR public.is_admin_of_clinic(a.clinic_id))
    )
  );

CREATE POLICY "Users can insert their appointment exams"
  ON public.appointment_exams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id
      AND a.user_id = public.get_user_profile_id()
    )
  );

CREATE POLICY "Users can delete their pending appointment exams"
  ON public.appointment_exams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id
      AND a.user_id = public.get_user_profile_id()
      AND a.status = 'pending'
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_exam_prices_updated_at
  BEFORE UPDATE ON public.clinic_exam_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA - EXAM TYPES
-- =============================================

INSERT INTO public.exam_types (name, category, description, icon) VALUES
-- Exames
('Admissional', 'exame', 'Exame médico obrigatório para admissão de funcionários', 'clipboard-check'),
('Demissional', 'exame', 'Exame médico obrigatório para desligamento de funcionários', 'clipboard-x'),
('Periódico', 'exame', 'Exame médico periódico para acompanhamento da saúde do trabalhador', 'calendar-check'),
('Retorno ao Trabalho', 'exame', 'Exame para retorno após afastamento superior a 30 dias', 'refresh-cw'),
('Mudança de Função', 'exame', 'Exame para alteração de cargo ou função', 'shuffle'),
('Toxicológico', 'exame', 'Exame toxicológico para detecção de substâncias', 'flask'),
('Hemograma Completo', 'exame', 'Análise completa das células sanguíneas', 'droplet'),
('Glicemia', 'exame', 'Medição do nível de açúcar no sangue', 'activity'),
('Colesterol Total', 'exame', 'Medição dos níveis de colesterol', 'heart'),
('Raio-X de Tórax', 'exame', 'Radiografia torácica', 'scan'),
('Eletrocardiograma', 'exame', 'ECG - Avaliação da atividade elétrica do coração', 'heart-pulse'),
('Audiometria', 'exame', 'Avaliação da capacidade auditiva', 'ear'),
('Acuidade Visual', 'exame', 'Teste de visão', 'eye'),
('Espirometria', 'exame', 'Avaliação da função pulmonar', 'wind'),
('HIV', 'exame', 'Teste para detecção do vírus HIV', 'shield'),
('Hepatite B e C', 'exame', 'Testes para hepatites virais', 'shield-check'),
-- Consultas
('Clínico Geral', 'consulta', 'Consulta médica geral', 'stethoscope'),
('Médico do Trabalho', 'consulta', 'Consulta com especialista em medicina ocupacional', 'briefcase-medical'),
('Oftalmologista', 'consulta', 'Consulta com especialista em visão', 'eye'),
('Psicólogo', 'consulta', 'Avaliação psicológica', 'brain'),
('Fonoaudiólogo', 'consulta', 'Consulta com especialista em audição e fala', 'mic'),
('Cardiologista', 'consulta', 'Consulta com especialista em coração', 'heart-pulse'),
('Pneumologista', 'consulta', 'Consulta com especialista em pulmão', 'wind');

-- =============================================
-- SEED DATA - CLINICS (Ipatinga-MG)
-- =============================================

INSERT INTO public.clinics (name, address, city, state, phone, whatsapp, opening_hours, latitude, longitude) VALUES
('Medipa Saúde Ocupacional', 'Av. Itabira, 1.117 - Centro', 'Ipatinga', 'MG', '(31) 3821-5000', '5531988215000', 'Seg-Sex: 07:00-17:00, Sáb: 07:00-11:00', -19.4687, -42.5365),
('CTS Ocupacional', 'Rua Diamantina, 320 - Veneza I', 'Ipatinga', 'MG', '(31) 3822-3344', '5531988223344', 'Seg-Sex: 07:30-17:30', -19.4723, -42.5412),
('Grupo Gestor Vida', 'Av. Pedro Linhares Gomes, 1.500 - Cidade Nobre', 'Ipatinga', 'MG', '(31) 3824-8899', '5531988248899', 'Seg-Sex: 08:00-18:00', -19.4801, -42.5289);

-- Add sample prices for clinics (we'll link them by name since we don't have IDs yet)
DO $$
DECLARE
  medipa_id UUID;
  cts_id UUID;
  gestor_id UUID;
  exam_rec RECORD;
BEGIN
  SELECT id INTO medipa_id FROM public.clinics WHERE name LIKE 'Medipa%';
  SELECT id INTO cts_id FROM public.clinics WHERE name LIKE 'CTS%';
  SELECT id INTO gestor_id FROM public.clinics WHERE name LIKE 'Grupo Gestor%';
  
  FOR exam_rec IN SELECT id, category FROM public.exam_types LOOP
    -- Medipa prices
    INSERT INTO public.clinic_exam_prices (clinic_id, exam_type_id, price) 
    VALUES (medipa_id, exam_rec.id, 
      CASE exam_rec.category 
        WHEN 'exame' THEN 45 + (random() * 150)::numeric(10,2)
        WHEN 'consulta' THEN 80 + (random() * 120)::numeric(10,2)
      END
    );
    
    -- CTS prices (slightly higher)
    INSERT INTO public.clinic_exam_prices (clinic_id, exam_type_id, price) 
    VALUES (cts_id, exam_rec.id, 
      CASE exam_rec.category 
        WHEN 'exame' THEN 50 + (random() * 160)::numeric(10,2)
        WHEN 'consulta' THEN 90 + (random() * 130)::numeric(10,2)
      END
    );
    
    -- Gestor Vida prices
    INSERT INTO public.clinic_exam_prices (clinic_id, exam_type_id, price) 
    VALUES (gestor_id, exam_rec.id, 
      CASE exam_rec.category 
        WHEN 'exame' THEN 40 + (random() * 140)::numeric(10,2)
        WHEN 'consulta' THEN 75 + (random() * 110)::numeric(10,2)
      END
    );
  END LOOP;
END $$;