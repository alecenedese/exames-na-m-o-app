
-- Allow clinic admins to delete appointments from their clinic
DROP POLICY IF EXISTS "Users can delete their pending appointments" ON public.appointments;
CREATE POLICY "Users can delete their pending appointments"
ON public.appointments
FOR DELETE
USING (
  (user_id = get_user_profile_id() AND status = 'pending')
  OR is_admin_of_clinic(clinic_id)
  OR is_super_admin()
);

-- Allow clinic admins to delete appointment exams from their clinic
DROP POLICY IF EXISTS "Users can delete their pending appointment exams" ON public.appointment_exams;
CREATE POLICY "Users can delete their pending appointment exams"
ON public.appointment_exams
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.id = appointment_exams.appointment_id
    AND (
      (a.user_id = get_user_profile_id() AND a.status = 'pending')
      OR is_admin_of_clinic(a.clinic_id)
      OR is_super_admin()
    )
  )
);
