DROP POLICY IF EXISTS "Users can update their pending registration" ON public.clinic_registrations;

CREATE POLICY "Users can update their own registration"
ON public.clinic_registrations
FOR UPDATE
USING (
  (user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role)
);