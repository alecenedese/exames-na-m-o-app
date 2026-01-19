/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import { ClinicWithDistance } from '@/types';
import { Loader2, MapPin } from 'lucide-react';

declare global {
  interface Window {
    google?: typeof google;
  }
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCMh-I_OgUOqWmr884bNUgwH8bVci6xY_4';

// Map styles to hide POIs (businesses, restaurants, etc.)
const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.park',
    stylers: [{ visibility: 'on' }]
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

  const clinicsWithCoords = clinics.filter(c => c.latitude && c.longitude);

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
          styles: mapStyles,
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
            position: { lat: clinic.latitude!, lng: clinic.longitude! },
            content: markerElement,
            title: clinic.name,
          });

          // Info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 150px;">
                <h3 style="font-weight: bold; margin-bottom: 4px; color: #1a1a1a;">${clinic.name}</h3>
                <p style="color: #666; font-size: 12px; margin: 0;">${clinic.address}</p>
                ${clinic.distance ? `<p style="color: #16a34a; font-size: 12px; margin-top: 4px;">${clinic.distance.toFixed(1)} km</p>` : ''}
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
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
      <div className="h-64 rounded-xl bg-muted flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg">
      {/* Legend */}
      <div className="absolute top-2 left-2 right-2 z-10 bg-background/95 backdrop-blur-sm rounded-lg shadow-md p-2 max-h-24 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {clinicsWithCoords.map((clinic) => (
            <button
              key={clinic.id}
              onClick={() => onClinicClick(clinic)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                clinic.id === selectedClinicId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{clinic.name}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="h-72 w-full" />
    </div>
  );
}
