/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import { ClinicWithDistance } from '@/types';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: typeof google;
  }
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCMh-I_OgUOqWmr884bNUgwH8bVci6xY_4';

interface ClinicMapProps {
  clinics: ClinicWithDistance[];
  userLocation: { lat: number; lng: number } | null;
  selectedClinicId?: string;
  onClinicClick: (clinic: ClinicWithDistance) => void;
}

// Load Google Maps script dynamically
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

export function ClinicMap({ clinics, userLocation, selectedClinicId, onClinicClick }: ClinicMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultCenter = userLocation 
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: -19.4687, lng: -42.5365 }; // Ipatinga center

  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (!mapRef.current || mapInstanceRef.current) return;

        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        const map = new Map(mapRef.current, {
          center: defaultCenter,
          zoom: 14,
          mapId: 'clinic-map-id',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        });

        mapInstanceRef.current = map;

        // User location marker
        if (userLocation) {
          const userMarkerElement = document.createElement('div');
          userMarkerElement.innerHTML = `
            <div style="
              background: hsl(217, 91%, 60%);
              width: 20px;
              height: 20px;
              border-radius: 50%;
              box-shadow: 0 0 0 6px hsla(217, 91%, 60%, 0.3);
              border: 3px solid white;
            "></div>
          `;

          new AdvancedMarkerElement({
            map,
            position: { lat: userLocation.lat, lng: userLocation.lng },
            content: userMarkerElement,
            title: 'Você está aqui',
          });
        }

        // Clinic markers
        const clinicsWithCoords = clinics.filter(c => c.latitude && c.longitude);
        
        clinicsWithCoords.forEach((clinic) => {
          const isSelected = clinic.id === selectedClinicId;
          
          const markerElement = document.createElement('div');
          markerElement.innerHTML = `
            <div style="
              background: ${isSelected ? 'hsl(152, 69%, 40%)' : 'hsl(152, 69%, 30%)'};
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 3px solid white;
              cursor: pointer;
              ${isSelected ? 'transform: scale(1.2);' : ''}
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M12 2L12 22M2 12L22 12"/>
              </svg>
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: Number(clinic.latitude), lng: Number(clinic.longitude) },
            content: markerElement,
            title: clinic.name,
          });

          marker.addListener('click', () => {
            onClinicClick(clinic);
            
            // Show info window
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="min-width: 180px; padding: 4px;">
                  <h3 style="font-weight: bold; font-size: 0.875rem; margin: 0;">${clinic.name}</h3>
                  <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${clinic.address}</p>
                  ${clinic.distance !== undefined ? `
                    <p style="font-size: 0.75rem; color: #16a34a; margin-top: 0.25rem; font-weight: 500;">
                      ${clinic.distance.toFixed(1)} km de você
                    </p>
                  ` : ''}
                </div>
              `,
            });
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
        });

        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Erro ao carregar o mapa');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach(marker => {
        if (marker.map) marker.map = null;
      });
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [clinics, userLocation, selectedClinicId, onClinicClick]);

  if (error) {
    return (
      <div className="map-container shadow-medium flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="map-container shadow-medium relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
