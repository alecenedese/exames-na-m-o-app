
-- Drop the problematic restrictive ALL policy that blocks regular users
DROP POLICY "Service role and super admins can manage subscriptions" ON public.clinic_subscriptions;

-- Recreate as PERMISSIVE so it doesn't block other policies
CREATE POLICY "Super admins can manage all subscriptions"
ON public.clinic_subscriptions
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
