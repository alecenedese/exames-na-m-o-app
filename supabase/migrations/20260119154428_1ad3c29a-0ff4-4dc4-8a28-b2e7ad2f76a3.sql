-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'clinic_admin', 'super_admin');

-- Create user_roles table (following security best practices)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Create clinic_registrations table for pending clinic registrations
CREATE TABLE public.clinic_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    clinic_name text NOT NULL,
    cnpj text NOT NULL,
    address text NOT NULL,
    city text NOT NULL DEFAULT 'Ipatinga',
    state text NOT NULL DEFAULT 'MG',
    phone text,
    whatsapp text NOT NULL,
    opening_hours text,
    latitude numeric,
    longitude numeric,
    status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid REFERENCES auth.users(id),
    rejection_reason text
);

-- Enable RLS on clinic_registrations
ALTER TABLE public.clinic_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for clinic_registrations
CREATE POLICY "Users can view their own registrations"
ON public.clinic_registrations
FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can create their own registration"
ON public.clinic_registrations
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending registration"
ON public.clinic_registrations
FOR UPDATE
USING ((user_id = auth.uid() AND status = 'pending') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete registrations"
ON public.clinic_registrations
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_clinic_registrations_updated_at
BEFORE UPDATE ON public.clinic_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();