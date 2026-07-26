import React, { useEffect, useState, useMemo } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { io } from "socket.io-client";
import axios from "axios";
import config from "../config";
import ADMIN_COLORS from "../theme/colors";
import {
  MapPin,
  User,
  Briefcase,
  Target,
  Radio,
  Sliders,
  Clock,
  Wifi,
  WifiOff,
  Navigation,
  Search
} from "lucide-react";

const MAPBOX_TOKEN = config.MAPBOX_TOKEN;
const BACKEND_URL = config.SOCKET_URL;
const API_URL = config.API_URL;

const defaultCenter = {
  latitude: 20.3533, // DLF Cyber City, Patia, Bhubaneswar
  longitude: 85.8185,
  zoom: 13,
};

const createGeoJSONCircle = (center, radiusInMeters, points = 64) => {
  if (!center) return null;
  const coords = {
    latitude: center.lat,
    longitude: center.lng,
  };

  const km = radiusInMeters / 1000;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.57;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [ret],
    },
  };
};

export default function LiveMap() {
  const [viewState, setViewState] = useState(defaultCenter);
  const [techniciansMap, setTechniciansMap] = useState({});
  const [activeJobs, setActiveJobs] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'ONLINE', 'OFFLINE'
  const [searchTerm, setSearchTerm] = useState('');

  const [adminLocation, setAdminLocation] = useState(null);
  const [scannerRadius, setScannerRadius] = useState(5000);
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    fetchInitialData();

    // Socket.io Real-time connection
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socket.emit("admin:join");

    // Real-time location updates
    socket.on("admin:location:update", (data) => {
      setTechniciansMap((prev) => {
        const id = data.technicianId || data.userId;
        if (!id) return prev;
        const existing = prev[id] || {};

        return {
          ...prev,
          [id]: {
            ...existing,
            isOnline: data.isOnline !== undefined ? data.isOnline : true,
            location: {
              lat: data.location?.lat || existing.location?.lat || 20.3533,
              lng: data.location?.lng || existing.location?.lng || 85.8185,
              address: data.location?.address || existing.location?.address || 'Live Location',
              lastUpdated: data.updatedAt || Date.now(),
            }
          }
        };
      });
    });

    // Real-time Online / Offline status updates
    socket.on("admin:status:update", (data) => {
      setTechniciansMap((prev) => {
        const id = data.technicianId || data.userId;
        if (!id) return prev;
        const existing = prev[id] || {};

        return {
          ...prev,
          [id]: {
            ...existing,
            name: data.name || existing.name,
            mobile: data.mobile || existing.mobile,
            isOnline: data.isOnline,
            location: {
              lat: data.location?.lat || existing.location?.lat || 20.3533,
              lng: data.location?.lng || existing.location?.lng || 85.8185,
              address: data.location?.address || existing.location?.address || 'Last Known Location',
              lastUpdated: data.updatedAt || Date.now(),
            }
          }
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [techsRes, jobsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/technicians`),
        axios.get(`${API_URL}/admin/active-jobs`),
      ]);

      if (techsRes.data.success) {
        const map = {};
        techsRes.data.technicians.forEach((t) => {
          const techId = t.userId?._id || t._id;
          const lat = t.currentLocation?.lat || (t.location?.coordinates ? t.location.coordinates[1] : null) || 20.3533;
          const lng = t.currentLocation?.lng || (t.location?.coordinates ? t.location.coordinates[0] : null) || 85.8185;

          map[techId] = {
            id: techId,
            techDbId: t._id,
            name: t.userId?.name || "Technician",
            mobile: t.userId?.mobile || 'N/A',
            isOnline: !!t.isOnline,
            location: {
              lat: parseFloat(lat),
              lng: parseFloat(lng),
              address: t.currentLocation?.address || (t.isOnline ? 'Online Location' : 'Last Known Location'),
              lastUpdated: t.currentLocation?.lastUpdated || t.updatedAt || Date.now()
            }
          };
        });
        setTechniciansMap(map);

        // Center map to first technician with valid location
        const firstTech = Object.values(map)[0];
        if (firstTech?.location) {
          setViewState(prev => ({
            ...prev,
            latitude: firstTech.location.lat,
            longitude: firstTech.location.lng,
            zoom: 11
          }));
        }
      }

      if (jobsRes.data.success) {
        setActiveJobs(jobsRes.data.jobs || []);
      }
    } catch (e) {
      console.error("Error fetching map initial data:", e);
    }
  };

  const findMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setAdminLocation(pos);
          setScannerActive(true);
          setViewState({
            latitude: pos.lat,
            longitude: pos.lng,
            zoom: 13,
          });
        },
        () => {
          alert("Geolocation permission failed.");
        }
      );
    }
  };

  const flyToTechnician = (tech) => {
    if (tech?.location?.lat && tech?.location?.lng) {
      setViewState({
        latitude: tech.location.lat,
        longitude: tech.location.lng,
        zoom: 14,
      });
      setSelectedPin(tech);
    }
  };

  const scannerData = useMemo(() => 
    createGeoJSONCircle(adminLocation, scannerRadius), 
    [adminLocation, scannerRadius]
  );

  const technicianList = Object.values(techniciansMap).filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.mobile.includes(searchTerm);
    if (filterMode === 'ONLINE') return t.isOnline && matchesSearch;
    if (filterMode === 'OFFLINE') return !t.isOnline && matchesSearch;
    return matchesSearch;
  });

  const onlineCount = Object.values(techniciansMap).filter(t => t.isOnline).length;
  const offlineCount = Object.values(techniciansMap).filter(t => !t.isOnline).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: ADMIN_COLORS.textPrimary }}>
            <Radio size={24} style={{ color: ADMIN_COLORS.primary }} className="animate-pulse" />
            Live Map Command Center
          </h2>
          <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
            Real-time GPS tracking of active technicians & last known location for offline technicians
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={findMe}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-extrabold transition-all active:scale-95 shadow-md"
            style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
          >
            <Target size={16} style={{ color: ADMIN_COLORS.primary }} />
            <span>Center My Location</span>
          </button>

          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-2xl border"
            style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
          >
            <span className="text-xs font-bold" style={{ color: ADMIN_COLORS.textSecondary }}>Geofence</span>
            <button
              onClick={() => setScannerActive(!scannerActive)}
              className="w-10 h-5 rounded-full transition-colors relative"
              style={{ backgroundColor: scannerActive ? ADMIN_COLORS.primary : '#333' }}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${scannerActive ? "left-5 bg-[#432B1E]" : "left-0.5 bg-white"}`}
              />
            </button>
          </div>

          {scannerActive && (
            <div 
              className="flex items-center gap-3 px-4 py-2 rounded-2xl border min-w-44"
              style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
            >
              <Sliders size={14} style={{ color: ADMIN_COLORS.textMuted }} />
              <input
                type="range"
                min="1000"
                max="20000"
                step="1000"
                value={scannerRadius}
                onChange={(e) => setScannerRadius(Number(e.target.value))}
                className="w-full accent-[#E6BEAB]"
              />
              <span className="text-xs font-mono font-bold text-white">{(scannerRadius / 1000).toFixed(0)}km</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div 
          className="inline-flex p-1.5 rounded-2xl border self-start"
          style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
        >
          <button
            onClick={() => setFilterMode('ALL')}
            className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2"
            style={{ 
              backgroundColor: filterMode === 'ALL' ? ADMIN_COLORS.primary : 'transparent',
              color: filterMode === 'ALL' ? '#432B1E' : ADMIN_COLORS.textSecondary
            }}
          >
            <span>ALL FLEET</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
              {Object.keys(techniciansMap).length}
            </span>
          </button>

          <button
            onClick={() => setFilterMode('ONLINE')}
            className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2"
            style={{ 
              backgroundColor: filterMode === 'ONLINE' ? ADMIN_COLORS.primary : 'transparent',
              color: filterMode === 'ONLINE' ? '#432B1E' : ADMIN_COLORS.textSecondary
            }}
          >
            <Wifi size={13} style={{ color: filterMode === 'ONLINE' ? '#432B1E' : ADMIN_COLORS.success }} />
            <span>ONLINE</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
              {onlineCount}
            </span>
          </button>

          <button
            onClick={() => setFilterMode('OFFLINE')}
            className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2"
            style={{ 
              backgroundColor: filterMode === 'OFFLINE' ? ADMIN_COLORS.primary : 'transparent',
              color: filterMode === 'OFFLINE' ? '#432B1E' : ADMIN_COLORS.textSecondary
            }}
          >
            <WifiOff size={13} style={{ color: filterMode === 'OFFLINE' ? '#432B1E' : ADMIN_COLORS.error }} />
            <span>OFFLINE (LAST KNOWN)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
              {offlineCount}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: ADMIN_COLORS.textMuted }} />
          <input
            type="text"
            placeholder="Search technician name..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border text-xs font-medium outline-none"
            style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Map + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Technicians Registry List */}
        <div className="lg:col-span-4 space-y-3">
          <div 
            className="p-4 rounded-3xl border max-h-[calc(100vh-280px)] overflow-y-auto space-y-2.5 custom-scrollbar"
            style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
          >
            <div className="text-xs font-black uppercase tracking-wider mb-2 px-1" style={{ color: ADMIN_COLORS.textSecondary }}>
              Technician Fleet ({technicianList.length})
            </div>

            {technicianList.length === 0 ? (
              <div className="py-10 text-center text-xs font-semibold" style={{ color: ADMIN_COLORS.textMuted }}>
                No technicians matching criteria.
              </div>
            ) : (
              technicianList.map((tech) => {
                const isSelected = selectedPin?.id === tech.id;

                return (
                  <div
                    key={tech.id}
                    onClick={() => flyToTechnician(tech)}
                    className="p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: isSelected ? '#1F1A17' : '#1A1A1A',
                      borderColor: isSelected ? ADMIN_COLORS.primary : ADMIN_COLORS.border,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tech.isOnline ? ADMIN_COLORS.success : ADMIN_COLORS.error }}
                        />
                        <h4 className="font-bold text-sm text-white">{tech.name}</h4>
                      </div>

                      <span 
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider"
                        style={{
                          backgroundColor: tech.isOnline ? ADMIN_COLORS.successBg : ADMIN_COLORS.errorBg,
                          borderColor: tech.isOnline ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)',
                          color: tech.isOnline ? ADMIN_COLORS.success : ADMIN_COLORS.error
                        }}
                      >
                        {tech.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    <p className="text-xs font-medium" style={{ color: ADMIN_COLORS.textSecondary }}>
                      {tech.mobile}
                    </p>

                    <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: '#262626' }}>
                      <span className="flex items-center gap-1 font-semibold" style={{ color: ADMIN_COLORS.textMuted }}>
                        <MapPin size={12} style={{ color: tech.isOnline ? ADMIN_COLORS.primary : '#888' }} />
                        <span className="truncate max-w-[170px]">
                          {tech.location?.address || `${tech.location?.lat.toFixed(3)}, ${tech.location?.lng.toFixed(3)}`}
                        </span>
                      </span>

                      <span className="font-extrabold flex items-center gap-0.5" style={{ color: ADMIN_COLORS.primary }}>
                        <span>Locate</span>
                        <Navigation size={10} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: MapBox Map */}
        <div className="lg:col-span-8">
          <div 
            className="rounded-3xl border overflow-hidden shadow-2xl relative h-[calc(100vh-280px)] min-h-[500px]"
            style={{ borderColor: ADMIN_COLORS.border }}
          >
            <Map
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: "100%", height: "100%" }}
            >
              {scannerActive && scannerData && (
                <Source id="scanner-source" type="geojson" data={scannerData}>
                  <Layer
                    id="scanner-layer-fill"
                    type="fill"
                    paint={{
                      "fill-color": ADMIN_COLORS.primary,
                      "fill-opacity": 0.15,
                    }}
                  />
                  <Layer
                    id="scanner-layer-line"
                    type="line"
                    paint={{
                      "line-color": ADMIN_COLORS.primary,
                      "line-width": 2,
                    }}
                  />
                </Source>
              )}

              {/* Render ALL Online & Offline Technician Pins */}
              {Object.values(techniciansMap).map((tech) => {
                if (!tech.location?.lat || !tech.location?.lng) return null;
                const isSelected = selectedPin?.id === tech.id;

                return (
                  <Marker
                    key={tech.id}
                    latitude={tech.location.lat}
                    longitude={tech.location.lng}
                    anchor="center"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setSelectedPin(tech);
                    }}
                  >
                    <div 
                      className={`relative flex items-center justify-center rounded-2xl border shadow-2xl cursor-pointer transition-transform duration-200 ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                      }`}
                      style={{ 
                        width: isSelected ? 44 : 38,
                        height: isSelected ? 44 : 38,
                        backgroundColor: tech.isOnline ? ADMIN_COLORS.primary : '#222222', 
                        borderColor: tech.isOnline ? ADMIN_COLORS.borderGold : '#555555',
                        color: tech.isOnline ? '#432B1E' : '#E0E0E0'
                      }}
                    >
                      {/* Pulse Ring for Online Technicians */}
                      {tech.isOnline && (
                        <span 
                          className="absolute -inset-1 rounded-2xl animate-ping opacity-30 pointer-events-none"
                          style={{ backgroundColor: ADMIN_COLORS.primary }}
                        />
                      )}

                      <Briefcase size={isSelected ? 20 : 16} />

                      {/* Online/Offline Status Indicator Dot */}
                      <div 
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
                        style={{ backgroundColor: tech.isOnline ? ADMIN_COLORS.success : ADMIN_COLORS.error }}
                      />
                    </div>
                  </Marker>
                );
              })}

              {/* Active Jobs Pickup Location Markers */}
              {activeJobs.map((job) => {
                if (!job.pickup?.lat || !job.pickup?.lng) return null;
                return (
                  <Marker
                    key={job._id}
                    latitude={job.pickup.lat}
                    longitude={job.pickup.lng}
                    anchor="center"
                  >
                    <div 
                      className="w-8 h-8 rounded-2xl flex items-center justify-center border shadow-xl cursor-pointer"
                      style={{ 
                        backgroundColor: ADMIN_COLORS.errorBg, 
                        borderColor: 'rgba(248, 113, 113, 0.4)',
                        color: ADMIN_COLORS.error
                      }}
                    >
                      <User size={16} />
                    </div>
                  </Marker>
                );
              })}
            </Map>

            {/* Selected Pin Details Overlay Card */}
            {selectedPin && (
              <div 
                className="absolute bottom-6 left-6 right-6 md:right-auto md:w-88 p-5 rounded-3xl border shadow-2xl backdrop-blur-xl animate-fadeIn z-40"
                style={{ backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: ADMIN_COLORS.border }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span 
                      className="text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 mb-1"
                      style={{ 
                        backgroundColor: selectedPin.isOnline ? ADMIN_COLORS.successBg : ADMIN_COLORS.errorBg,
                        borderColor: selectedPin.isOnline ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)',
                        color: selectedPin.isOnline ? ADMIN_COLORS.success : ADMIN_COLORS.error
                      }}
                    >
                      {selectedPin.isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {selectedPin.isOnline ? 'ONLINE & ACTIVE' : 'OFFLINE (LAST KNOWN)'}
                    </span>
                    <h3 className="font-extrabold text-base text-white">{selectedPin.name}</h3>
                  </div>

                  <button 
                    onClick={() => setSelectedPin(null)} 
                    className="p-1 rounded-full text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between" style={{ color: ADMIN_COLORS.textSecondary }}>
                    <span>Mobile:</span>
                    <span className="font-bold text-white">{selectedPin.mobile}</span>
                  </div>

                  {selectedPin.location && (
                    <>
                      <div className="flex justify-between" style={{ color: ADMIN_COLORS.textSecondary }}>
                        <span>Coordinates:</span>
                        <span className="font-mono text-white">
                          {selectedPin.location.lat?.toFixed(4)}, {selectedPin.location.lng?.toFixed(4)}
                        </span>
                      </div>

                      <div className="pt-2 border-t" style={{ borderColor: '#2A2A2A' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: ADMIN_COLORS.textMuted }}>
                          {selectedPin.isOnline ? 'Current Address' : 'Last Known Recorded Address'}
                        </div>
                        <p className="text-xs font-semibold text-white leading-relaxed">
                          {selectedPin.location.address || 'Last Known Location'}
                        </p>
                      </div>

                      {selectedPin.location.lastUpdated && (
                        <div className="text-[10px] flex items-center gap-1 mt-2" style={{ color: ADMIN_COLORS.textMuted }}>
                          <Clock size={11} />
                          <span>Last Active: {new Date(selectedPin.location.lastUpdated).toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
