import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  LocateFixed, 
  Layers, 
  Sliders
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function LiveMap() {
  const { activeDevice, updateConfig } = useSecurity();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const loc = activeDevice?.location || {
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 5,
    address: 'Cubbon Park Road, Bangalore, KA, India'
  };

  const safeZone = activeDevice?.safeZone || {
    latitude: 12.9716,
    longitude: 77.5946,
    radius: 400,
    name: 'Home / Safe Perimeter'
  };

  const [radius, setRadius] = useState(safeZone.radius || 400);

  // Calculate distance from safe zone center
  const calculateDist = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const currentDistance = calculateDist(
    loc.latitude,
    loc.longitude,
    safeZone.latitude,
    safeZone.longitude
  );

  const isBreached = currentDistance > radius;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window === 'undefined' || !window.L) return;

    const L = window.L;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [loc.latitude, loc.longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // Dark style tiles using CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Custom pulsing radar marker icon
      const customIcon = L.divIcon({
        className: 'custom-radar-pin',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; width: 24px; height: 24px; background: rgba(0, 240, 255, 0.4); border-radius: 50%;" class="radar-ring"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #00f0ff; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px #00f0ff;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(map);
      marker.bindPopup(`<b>${activeDevice?.name || 'Device'}</b><br/>${loc.address}`);

      // Safe Zone Circle
      const circle = L.circle([safeZone.latitude, safeZone.longitude], {
        radius: radius,
        color: isBreached ? '#ff1744' : '#00e676',
        fillColor: isBreached ? '#ff1744' : '#00e676',
        fillOpacity: 0.12,
        weight: 2
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    } else {
      // Update existing map
      const map = mapInstanceRef.current;
      if (markerRef.current) {
        markerRef.current.setLatLng([loc.latitude, loc.longitude]);
      }
      if (circleRef.current) {
        circleRef.current.setLatLng([safeZone.latitude, safeZone.longitude]);
        circleRef.current.setRadius(radius);
        circleRef.current.setStyle({
          color: isBreached ? '#ff1744' : '#00e676',
          fillColor: isBreached ? '#ff1744' : '#00e676'
        });
      }
    }
  }, [loc.latitude, loc.longitude, safeZone.latitude, safeZone.longitude, radius, isBreached]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([loc.latitude, loc.longitude], 16, { animate: true });
    }
  };

  const handleRadiusChange = (newVal) => {
    const val = parseInt(newVal);
    setRadius(val);
    updateConfig({
      safeZone: {
        ...safeZone,
        radius: val
      }
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyber-border space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyber-cyan border border-cyber-cyan/30">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">LIVE GPS TRACKER & GEOFENCE RADAR</h3>
            <p className="text-[11px] text-slate-400 font-mono">Real-Time OpenStreetMap Telemetry</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Geofence Status Badge */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1.5 ${
            isBreached 
              ? 'bg-red-500/20 text-cyber-red border-cyber-red animate-pulse' 
              : 'bg-emerald-500/20 text-cyber-emerald border-emerald-500/40'
          }`}>
            {isBreached ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{isBreached ? `BREACHED (+${currentDistance - radius}m)` : `SAFE ZONE INTACT (${currentDistance}m)`}</span>
          </div>

          <button
            onClick={handleRecenter}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyber-cyan border border-cyber-border transition-all"
            title="Center on Device"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-cyber-border/80 h-72">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Floating coordinates chip */}
        <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-cyber-border text-[11px] font-mono text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400">LAT:</span> <span>{loc.latitude.toFixed(5)}°</span>
            <span className="text-cyan-400">LON:</span> <span>{loc.longitude.toFixed(5)}°</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">±{loc.accuracy || 5}m</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
            {loc.address}
          </div>
        </div>
      </div>

      {/* Geofence Perimeter Controls */}
      <div className="bg-[#070e1c] rounded-xl p-3 border border-cyber-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-300 w-full sm:w-auto">
          <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>SAFE PERIMETER RADIUS:</span>
          <span className="font-bold text-cyan-400">{radius} METERS</span>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-1/2">
          <span className="text-[10px] text-slate-500">100m</span>
          <input
            type="range"
            min="100"
            max="1500"
            step="50"
            value={radius}
            onChange={(e) => handleRadiusChange(e.target.value)}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[10px] text-slate-500">1500m</span>
        </div>
      </div>

    </div>
  );
}
