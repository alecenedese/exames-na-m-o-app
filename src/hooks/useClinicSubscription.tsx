import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ClinicSubscription {
  isPaid: boolean;
  isExpired: boolean;
  daysRemaining: number;
  paymentStatus: string | null;
  plan: string | null;
  expiresAt: string | null;
}

export function useClinicSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<ClinicSubscription>({
    isPaid: false,
    isExpired: false,
    daysRemaining: 0,
    paymentStatus: null,
    plan: null,
    expiresAt: null,
  });
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('clinic_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        const diffMs = expiresAt.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const isExpired = daysRemaining <= 0;

        setSubscription({
          isPaid: !isExpired,
          isExpired,
          daysRemaining,
          paymentStatus: data.payment_status,
          plan: data.plan,
          expiresAt: data.expires_at,
        });
      } else {
        setSubscription({
          isPaid: false,
          isExpired: false,
          daysRemaining: 0,
          paymentStatus: null,
          plan: null,
          expiresAt: null,
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [user]);

  return { ...subscription, loading, refetch };
}
