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

// Map styles to hide POIs (businesses, restaurants, etc.)
const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.attraction',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.government',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.medical',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.place_of_worship',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.school',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.sports_complex',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }]
  }
];

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
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        });

        // Apply styles after map loads to hide POIs
        map.setOptions({ styles: mapStyles });

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

        // Clinic markers with label on top
        const clinicsWithCoords = clinics.filter(c => c.latitude && c.longitude);
        
        clinicsWithCoords.forEach((clinic) => {
          const isSelected = clinic.id === selectedClinicId;
          
          // Create marker with label on top
          const markerElement = document.createElement('div');
          markerElement.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer;';
          markerElement.innerHTML = `
            <div style="
              background: white;
              padding: 4px 8px;
              border-radius: 4px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              margin-bottom: 4px;
              font-size: 11px;
              font-weight: 600;
              color: #1a1a1a;
              white-space: nowrap;
              max-width: 150px;
              overflow: hidden;
              text-overflow: ellipsis;
              border: ${isSelected ? '2px solid hsl(152, 69%, 40%)' : '1px solid #e5e5e5'};
            ">${clinic.name}</div>
            <div style="
              background: ${isSelected ? 'hsl(152, 69%, 40%)' : 'hsl(152, 69%, 30%)'};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 3px solid white;
              ${isSelected ? 'transform: scale(1.15);' : ''}
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M12 2L12 22M2 12L22 12"/>
              </svg>
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: clinic.latitude!, lng: clinic.longitude! },
            content: markerElement,
            title: clinic.name,
          });

          marker.addListener('click', () => {
            onClinicClick(clinic);
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
        marker.map = null;
      });
      markersRef.current = [];
    };
  }, [clinics, userLocation, selectedClinicId]);

  // Handle clinic selection center
  useEffect(() => {
    if (mapInstanceRef.current && selectedClinicId) {
      const clinic = clinics.find(c => c.id === selectedClinicId);
      if (clinic?.latitude && clinic?.longitude) {
        mapInstanceRef.current.panTo({ lat: clinic.latitude, lng: clinic.longitude });
      }
    }
  }, [selectedClinicId, clinics]);

  if (error) {
    return (
      <div className="h-96 rounded-xl bg-muted flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg">
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="h-96 w-full" />
    </div>
  );
}
