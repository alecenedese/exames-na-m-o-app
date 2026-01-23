-- Function to auto-create a clinic when a registration is created
CREATE OR REPLACE FUNCTION public.auto_create_clinic_from_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_clinic_id uuid;
  profile_id uuid;
BEGIN
  -- Get the profile id for this user
  SELECT id INTO profile_id FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create the clinic
  INSERT INTO public.clinics (
    name, 
    address, 
    city, 
    state, 
    phone, 
    whatsapp, 
    opening_hours,
    admin_user_id,
    is_active
  ) VALUES (
    NEW.clinic_name,
    NEW.address,
    NEW.city,
    NEW.state,
    NEW.phone,
    NEW.whatsapp,
    NEW.opening_hours,
    profile_id,
    true
  ) RETURNING id INTO new_clinic_id;
  
  -- Update user role to clinic_admin
  UPDATE public.user_roles 
  SET role = 'clinic_admin' 
  WHERE user_id = NEW.user_id;
  
  -- If no role exists, create it
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.user_id, 'clinic_admin');
  END IF;
  
  -- Update profile role
  UPDATE public.profiles 
  SET role = 'clinic_admin' 
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create clinic on registration
DROP TRIGGER IF EXISTS trigger_auto_create_clinic ON public.clinic_registrations;
CREATE TRIGGER trigger_auto_create_clinic
  AFTER INSERT ON public.clinic_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_clinic_from_registration();

-- Function to get current user's clinic id
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id 
  FROM public.clinics c
  INNER JOIN public.profiles p ON c.admin_user_id = p.id
  WHERE p.user_id = auth.uid()
  LIMIT 1
$$;