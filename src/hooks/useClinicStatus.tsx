import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ClinicRegistrationStatus {
  isClinicOwner: boolean;
  isTrialPeriod: boolean;
  daysRemaining: number;
  registrationStatus: 'pending' | 'approved' | 'rejected' | null;
}

export function useClinicStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ClinicRegistrationStatus>({
    isClinicOwner: false,
    isTrialPeriod: false,
    daysRemaining: 0,
    registrationStatus: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!user) {
        setStatus({
          isClinicOwner: false,
          isTrialPeriod: false,
          daysRemaining: 0,
          registrationStatus: null,
        });
        setLoading(false);
        return;
      }

      try {
        // Check if user has a clinic registration
        const { data: registration } = await supabase
          .from('clinic_registrations')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (registration) {
          // Calculate days remaining in trial (7 days from registration)
          const createdAt = new Date(registration.created_at);
          const now = new Date();
          const daysPassed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, 7 - daysPassed);

          setStatus({
            isClinicOwner: true,
            isTrialPeriod: daysRemaining > 0,
            daysRemaining,
            registrationStatus: registration.status as 'pending' | 'approved' | 'rejected',
          });
        } else {
          setStatus({
            isClinicOwner: false,
            isTrialPeriod: false,
            daysRemaining: 0,
            registrationStatus: null,
          });
        }
      } catch (error) {
        console.error('Error checking clinic status:', error);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, [user]);

  return { ...status, loading };
}
