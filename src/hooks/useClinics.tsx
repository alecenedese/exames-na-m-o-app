import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clinic, ClinicWithDistance, ClinicExamPrice, ExamType } from '@/types';

export function useClinics() {
  const [clinics, setClinics] = useState<ClinicWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to Ipatinga center if geolocation fails
          setUserLocation({ lat: -19.4687, lng: -42.5365 });
        }
      );
    }
  }, []);

  useEffect(() => {
    fetchClinics();
  }, [userLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const clinicsWithDistance = (data as Clinic[]).map(clinic => ({
        ...clinic,
        distance: userLocation && clinic.latitude && clinic.longitude
          ? calculateDistance(
              userLocation.lat,
              userLocation.lng,
              Number(clinic.latitude),
              Number(clinic.longitude)
            )
          : undefined,
      })).sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

      setClinics(clinicsWithDistance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clínicas');
    } finally {
      setLoading(false);
    }
  };

  const getClinicExams = async (clinicId: string): Promise<ClinicExamPrice[]> => {
    const { data, error } = await supabase
      .from('clinic_exam_prices')
      .select(`
        *,
        exam_type:exam_types(*)
      `)
      .eq('clinic_id', clinicId)
      .eq('is_available', true);

    if (error) {
      console.error('Error fetching clinic exams:', error);
      return [];
    }

    return data as unknown as ClinicExamPrice[];
  };

  return {
    clinics,
    loading,
    error,
    userLocation,
    getClinicExams,
    refetch: fetchClinics,
  };
}

export function useExamTypes() {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExamTypes();
  }, []);

  const fetchExamTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exam_types')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;
      setExamTypes(data as ExamType[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tipos de exames');
    } finally {
      setLoading(false);
    }
  };

  const exams = examTypes.filter(e => e.category === 'exame');
  const consultas = examTypes.filter(e => e.category === 'consulta');

  return {
    examTypes,
    exams,
    consultas,
    loading,
    error,
    refetch: fetchExamTypes,
  };
}
