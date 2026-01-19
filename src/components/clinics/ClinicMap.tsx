import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Custom marker icon
const createClinicIcon = (selected: boolean) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background: ${selected ? 'hsl(152, 69%, 40%)' : 'hsl(152, 69%, 30%)'};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
        ${selected ? 'transform: scale(1.2);' : ''}
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
};

const userLocationIcon = L.divIcon({
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

interface MapCenterProps {
  center: [number, number];
}

function MapCenter({ center }: MapCenterProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

interface ClinicMapProps {
  clinics: ClinicWithDistance[];
  userLocation: { lat: number; lng: number } | null;
  selectedClinicId?: string;
  onClinicClick: (clinic: ClinicWithDistance) => void;
}

export function ClinicMap({ clinics, userLocation, selectedClinicId, onClinicClick }: ClinicMapProps) {
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [-19.4687, -42.5365]; // Ipatinga center

  const clinicsWithCoords = clinics.filter(c => c.latitude && c.longitude);

  return (
    <div className="map-container shadow-medium">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenter center={defaultCenter} />

        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userLocationIcon}
          >
            <Popup>
              <span className="font-medium">Você está aqui</span>
            </Popup>
          </Marker>
        )}

        {/* Clinic markers */}
        {clinicsWithCoords.map((clinic) => (
          <Marker
            key={clinic.id}
            position={[Number(clinic.latitude), Number(clinic.longitude)]}
            icon={createClinicIcon(clinic.id === selectedClinicId)}
            eventHandlers={{
              click: () => onClinicClick(clinic),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <h3 className="font-bold text-sm">{clinic.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{clinic.address}</p>
                {clinic.distance !== undefined && (
                  <p className="text-xs text-primary mt-1 font-medium">
                    {clinic.distance.toFixed(1)} km de você
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
