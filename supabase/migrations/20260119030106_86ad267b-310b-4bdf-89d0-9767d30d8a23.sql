-- Fix function search_path security warnings
ALTER FUNCTION public.get_user_profile_id() SET search_path = public;
ALTER FUNCTION public.is_super_admin() SET search_path = public;
ALTER FUNCTION public.is_clinic_admin() SET search_path = public;
ALTER FUNCTION public.is_admin_of_clinic(UUID) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;