import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import { MapPin, Truck, Navigation, Layers } from 'lucide-react';
import { STATUS_CONFIG, RANCHI_CENTER } from '../constants/blood';

function MapEffects({ sidebarCollapsed, focusedHospital }) {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 320);
    const onResize = () => map.invalidateSize({ animate: false });
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [map, sidebarCollapsed]);

  useEffect(() => {
    if (focusedHospital?.lat && focusedHospital?.lng) {
      map.flyTo([focusedHospital.lat, focusedHospital.lng], 13, { duration: 0.7 });
    }
  }, [map, focusedHospital]);

  return null;
}

function createHospitalIcon(hospital, isSelected) {
  const sc = STATUS_CONFIG[hospital.status] || STATUS_CONFIG.safe;
  const symbol = hospital.type === 'blood_bank' ? 'BB' : '+';
  const size = isSelected ? 32 : 26;
  const shortName =
    hospital.name.length > 20 ? `${hospital.name.slice(0, 18)}…` : hospital.name;
  const isCritical = hospital.status === 'critical';

  const html = `
    <div class="hemo-node">
      <div class="relative flex items-center justify-center" style="width:${size}px;height:${size}px;">
        ${
          isCritical
            ? `<span class="hemo-node-ring hemo-node-ring-critical" style="background:${sc.glow};border:1.5px solid ${sc.color};"></span>`
            : ''
        }
        <div class="hemo-node-core" style="
          width:${size}px;
          height:${size}px;
          background:${sc.color};
          box-shadow:0 0 ${isSelected ? '16px' : '10px'} ${sc.glow};
          border-color:${isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)'};
        ">${symbol}</div>
      </div>
      <div class="hemo-node-label">${shortName}</div>
    </div>
  `;

  return L.divIcon({
    className: 'hemo-marker-wrap',
    html,
    iconSize: [140, 48],
    iconAnchor: [70, size / 2],
  });
}

export default function HospitalMap({
  hospitals,
  loading,
  selectedHospital,
  onSelectHospital,
  activeRoutes = [],
  sidebarCollapsed = false,
}) {
  const markerIcons = useMemo(() => {
    const map = {};
    for (const h of hospitals) {
      map[h.id] = createHospitalIcon(h, selectedHospital?.id === h.id);
    }
    return map;
  }, [hospitals, selectedHospital]);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 sm:p-4 h-full flex flex-col lg:min-h-[470px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin size={15} className="text-rose-500" />
            Live Ranchi Network Map
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              OSM Dark Grid
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranchi, Jharkhand · {hospitals.length} live nodes · Click any marker to open facility drawer
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          {['safe', 'low', 'critical'].map(key => {
            const cfg = STATUS_CONFIG[key];
            return (
              <span key={key} className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.glow}` }}
                />
                {cfg.shortLabel}
              </span>
            );
          })}
          {activeRoutes.length > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[11px]">
              <Truck size={11} />
              {activeRoutes.length} active {activeRoutes.length === 1 ? 'route' : 'routes'}
            </span>
          )}
        </div>
      </div>

      {/* Map Viewport */}
      {loading && hospitals.length === 0 ? (
        <div className="h-[320px] lg:h-[460px] rounded-xl animate-pulse bg-slate-800/40 border border-slate-800" />
      ) : (
        <div className="relative h-[320px] lg:h-[460px] rounded-xl overflow-hidden border border-slate-800">
          <MapContainer
            center={RANCHI_CENTER}
            zoom={12}
            scrollWheelZoom
            className="w-full h-full"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c']}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MapEffects
              sidebarCollapsed={sidebarCollapsed}
              focusedHospital={selectedHospital}
            />

            {/* Animated Dashed Routes for Dispatched Transfers */}
            {activeRoutes.map(route => {
              const fromPos = [route.from_lat, route.from_lng];
              const toPos = [route.to_lat, route.to_lng];
              const midLat = (route.from_lat + route.to_lat) / 2;
              const midLng = (route.from_lng + route.to_lng) / 2;
              const isHigh = route.priority === 'HIGH';
              const strokeColor = isHigh ? '#f43f5e' : '#38bdf8';

              return (
                <div key={route.dispatch_id || route.transfer_id}>
                  {/* Glow underlay */}
                  <Polyline
                    positions={[fromPos, toPos]}
                    pathOptions={{
                      color: strokeColor,
                      weight: 7,
                      opacity: 0.22,
                    }}
                  />
                  {/* Animated dashed line */}
                  <Polyline
                    positions={[fromPos, toPos]}
                    pathOptions={{
                      color: strokeColor,
                      weight: 3,
                      opacity: 0.95,
                      dashArray: '8 6',
                      className: 'animated-route-line',
                    }}
                  >
                    <Tooltip sticky className="hemo-leaflet-tooltip">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white text-xs">
                          {route.vehicle_id || 'AMB-DEL'} · {route.units}u {route.blood_group}
                        </p>
                        <p className="text-[11px] text-slate-300">
                          {route.from_hospital} → {route.to_hospital}
                        </p>
                        <p className="text-[10px] font-mono text-emerald-400">
                          {route.temp_c ?? 4.2}°C Cold-Chain · {route.distance_km} km
                        </p>
                      </div>
                    </Tooltip>
                  </Polyline>
                  {/* Midpoint courier beacon */}
                  <CircleMarker
                    center={[midLat, midLng]}
                    radius={5}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 2,
                      fillColor: strokeColor,
                      fillOpacity: 1,
                    }}
                  />
                </div>
              );
            })}

            {/* Glowing Pulsing Hospital Markers */}
            {hospitals.map(h => {
              const oNeg = h.inventory?.['O-']?.units ?? 0;
              const totalUnits = Object.values(h.inventory || {}).reduce(
                (acc, item) => acc + item.units,
                0
              );
              const sc = STATUS_CONFIG[h.status] || STATUS_CONFIG.safe;

              return (
                <Marker
                  key={h.id}
                  position={[h.lat, h.lng]}
                  icon={markerIcons[h.id]}
                  eventHandlers={{
                    click: () => onSelectHospital(h),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -14]} className="hemo-leaflet-tooltip">
                    <div className="min-w-[165px]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white text-xs">{h.name}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {sc.shortLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{h.city}</p>
                      <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1 border-t border-slate-800">
                        <span className="text-slate-300">
                          O-: <strong className="text-rose-400 font-mono">{oNeg}u</strong>
                        </span>
                        <span className="text-slate-300 font-mono">{totalUnits}u total</span>
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Bottom-left overlay legend */}
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-[400] max-w-[calc(100%-1.25rem)] flex-wrap bg-slate-950/95 border border-slate-800 rounded-lg px-2.5 sm:px-3 py-1.5 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <Layers size={12} className="text-sky-400" />
              <span className="font-mono">BB</span> = Blood Bank
            </span>
            <span className="text-slate-600">|</span>
            <span>
              <span className="font-mono font-bold">+</span> = Trauma / Hospital
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1 text-rose-300">
              <Navigation size={11} /> Dashed = Live Dispatch
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
