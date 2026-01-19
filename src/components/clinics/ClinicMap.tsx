import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ClinicWithDistance } from '@/types';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ClinicMapProps {
  clinics: ClinicWithDistance[];
  userLocation: { lat: number; lng: number } | null;
  selectedClinicId?: string;
  onClinicClick: (clinic: ClinicWithDistance) => void;
}

export function ClinicMap({ clinics, userLocation, selectedClinicId, onClinicClick }: ClinicMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [-19.4687, -42.5365]; // Ipatinga center

  const clinicsWithCoords = clinics.filter(c => c.latitude && c.longitude);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    const initMap = async () => {
      const container = document.getElementById('clinic-map');
      if (!container || (container as any)._leaflet_id) return;

      const map = L.map(container).setView(defaultCenter, 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // User location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="
              background: hsl(217, 91%, 60%);
              width: 20px;
              height: 20px;
              border-radius: 50%;
              box-shadow: 0 0 0 6px hsla(217, 91%, 60%, 0.3);
              border: 3px solid white;
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<span class="font-medium">Você está aqui</span>');
      }

      // Clinic markers
      clinicsWithCoords.forEach((clinic) => {
        const isSelected = clinic.id === selectedClinicId;
        const clinicIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
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
              ${isSelected ? 'transform: scale(1.2);' : ''}
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M12 2L12 22M2 12L22 12"/>
              </svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });

        const popupContent = `
          <div style="min-width: 180px;">
            <h3 style="font-weight: bold; font-size: 0.875rem;">${clinic.name}</h3>
            <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${clinic.address}</p>
            ${clinic.distance !== undefined ? `
              <p style="font-size: 0.75rem; color: #16a34a; margin-top: 0.25rem; font-weight: 500;">
                ${clinic.distance.toFixed(1)} km de você
              </p>
            ` : ''}
          </div>
        `;

        L.marker([Number(clinic.latitude), Number(clinic.longitude)], { icon: clinicIcon })
          .addTo(map)
          .bindPopup(popupContent)
          .on('click', () => onClinicClick(clinic));
      });

      setMapLoaded(true);

      return () => {
        map.remove();
      };
    };

    initMap();
  }, []);

  return (
    <div className="map-container shadow-medium">
      <div id="clinic-map" className="w-full h-full" />
    </div>
  );
}