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

// Clean map style - hide ALL POIs like Uber
const cleanMapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'all',
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
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
  const markersRef = useRef<google.maps.Marker[]>([]);
  const overlaysRef = useRef<google.maps.OverlayView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultCenter = userLocation 
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: -19.4687, lng: -42.5365 }; // Ipatinga center

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (!mapRef.current || !isMounted) return;

        // Clear previous markers and overlays
        markersRef.current.forEach(marker => marker.setMap(null));
        overlaysRef.current.forEach(overlay => overlay.setMap(null));
        markersRef.current = [];
        overlaysRef.current = [];

        // Create map only once
        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 14,
            styles: cleanMapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
          });
          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        // User location marker
        if (userLocation) {
          const userMarker = new google.maps.Marker({
            map,
            position: { lat: userLocation.lat, lng: userLocation.lng },
            title: 'Você está aqui',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          });
          markersRef.current.push(userMarker);
        }

        // Clinic markers with custom label overlays
        const clinicsWithCoords = clinics.filter(c => c.latitude && c.longitude);
        
        // Custom Overlay class for clean labels
        class ClinicLabelOverlay extends google.maps.OverlayView {
          private position: google.maps.LatLng;
          private div: HTMLDivElement | null = null;
          private name: string;
          private onClick: () => void;

          constructor(position: google.maps.LatLng, name: string, onClick: () => void) {
            super();
            this.position = position;
            this.name = name;
            this.onClick = onClick;
          }

          onAdd() {
            this.div = document.createElement('div');
            this.div.style.cssText = `
              position: absolute;
              background: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              color: #16a34a;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              white-space: nowrap;
              border: 2px solid #16a34a;
              cursor: pointer;
              transform: translate(-50%, -100%);
              margin-top: -8px;
            `;
            this.div.textContent = this.name;
            this.div.addEventListener('click', this.onClick);

            const panes = this.getPanes();
            panes?.overlayMouseTarget.appendChild(this.div);
          }

          draw() {
            if (!this.div) return;
            const overlayProjection = this.getProjection();
            const pos = overlayProjection.fromLatLngToDivPixel(this.position);
            if (pos) {
              this.div.style.left = pos.x + 'px';
              this.div.style.top = (pos.y - 25) + 'px';
            }
          }

          onRemove() {
            if (this.div) {
              this.div.parentNode?.removeChild(this.div);
              this.div = null;
            }
          }
        }
        
        clinicsWithCoords.forEach((clinic) => {
          const isSelected = clinic.id === selectedClinicId;
          
          // Create the marker (pin only)
          const marker = new google.maps.Marker({
            map,
            position: { lat: clinic.latitude!, lng: clinic.longitude! },
            title: clinic.name,
            icon: {
              path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
              fillColor: isSelected ? '#22c55e' : '#16a34a',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: isSelected ? 2 : 1.5,
              anchor: new google.maps.Point(12, 22),
            },
          });

          marker.addListener('click', () => {
            onClinicClick(clinic);
          });

          markersRef.current.push(marker);

          // Create custom label overlay
          const labelOverlay = new ClinicLabelOverlay(
            new google.maps.LatLng(clinic.latitude!, clinic.longitude!),
            clinic.name,
            () => onClinicClick(clinic)
          );
          labelOverlay.setMap(map);
          overlaysRef.current.push(labelOverlay);
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
      isMounted = false;
      markersRef.current.forEach(marker => marker.setMap(null));
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      markersRef.current = [];
      overlaysRef.current = [];
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
      <div className="h-[28rem] rounded-xl bg-muted flex items-center justify-center">
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
      <div ref={mapRef} className="h-[28rem] w-full" />
    </div>
  );
}
