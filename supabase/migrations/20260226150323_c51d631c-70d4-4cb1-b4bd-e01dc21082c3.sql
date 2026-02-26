
-- Table to track clinic subscription/payment status
CREATE TABLE public.clinic_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'anual', -- 'anual' or 'semestral'
  payment_id text, -- Asaas payment ID
  payment_method text, -- 'pix' or 'credit_card'
  payment_status text NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'overdue', 'cancelled'
  amount numeric NOT NULL DEFAULT 0,
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_subscriptions ENABLE ROW LEVEL SECURITY;

-- Clinic owners can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.clinic_subscriptions
FOR SELECT
USING (
  (user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only backend (service role) or super admin can insert/update
CREATE POLICY "Service role and super admins can manage subscriptions"
ON public.clinic_subscriptions
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow authenticated users to insert their own subscription
CREATE POLICY "Users can create their own subscription"
ON public.clinic_subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own subscription
CREATE POLICY "Users can update their own subscription"
ON public.clinic_subscriptions
FOR UPDATE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_clinic_subscriptions_updated_at
BEFORE UPDATE ON public.clinic_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
