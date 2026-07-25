import React, { useEffect, useState, useRef, useMemo } from "react";
import Map, { Marker, Source, Layer, useMap } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { io } from "socket.io-client";
import axios from "axios";
import config from "../config";
import {
  MapPin,
  User,
  Briefcase,
  Navigation,
  Clock,
  Target,
  Radio,
  Sliders,
  ChevronRight,
} from "lucide-react";

const MAPBOX_TOKEN = config.MAPBOX_TOKEN;
const BACKEND_URL = config.SOCKET_URL;
const API_URL = config.API_URL;

const defaultCenter = {
  latitude: 13.0827, // Chennai
  longitude: 80.2707,
  zoom: 12,
};

// Helper to calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper to create GeoJSON circle
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
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [adminLocation, setAdminLocation] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerRadius, setScannerRadius] = useState(5000); // meters
  const [pulseOpacity, setPulseOpacity] = useState(0.4);

  const socketRef = useRef(null);

  // Scanner animation effect
  useEffect(() => {
    let interval;
    if (scannerActive) {
      interval = setInterval(() => {
        setPulseOpacity((prev) => (prev === 0.4 ? 0.1 : 0.4));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [scannerActive]);

  useEffect(() => {
    fetchActiveJobs();

    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket"],
    });
    socketRef.current.on("connect", () => {
      socketRef.current.emit("identify", { role: "admin" });
    });

    socketRef.current.on("admin:location:update", (data) => {
      const { rideId, location } = data;
      setAllJobs((prev) =>
        prev.map((job) =>
          job.rideId === rideId ? { ...job, currentLocation: location } : job,
        ),
      );
    });

    return () => socketRef.current?.disconnect();
  }, []);

  // Filter logic
  useEffect(() => {
    if (!scannerActive || !adminLocation) {
      setFilteredJobs(allJobs);
      return;
    }

    const filtered = allJobs.filter((job) => {
      const loc = job.currentLocation || job.pickup;
      if (!loc) return false;
      const dist = calculateDistance(
        adminLocation.lat,
        adminLocation.lng,
        loc.lat,
        loc.lng,
      );
      return dist * 1000 <= scannerRadius;
    });
    setFilteredJobs(filtered);
  }, [allJobs, scannerActive, adminLocation, scannerRadius]);

  const fetchActiveJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/active-jobs`);
      if (response.data.success) {
        setAllJobs(response.data.jobs);
      }
    } catch (error) {
      console.error(error);
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
            transitionDuration: 1000
          });
        },
        () => {
          alert("Error: The Geolocation service failed.");
        },
      );
    }
  };

  const scannerData = useMemo(() => 
    createGeoJSONCircle(adminLocation, scannerRadius), 
    [adminLocation, scannerRadius]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Radio className="text-rose-500 animate-pulse" size={24} />
            Fleet Scanner (Mapbox)
          </h2>
          <p className="text-slate-500">
            Real-time geospatial monitoring & geo-fencing
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={findMe}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 text-slate-700 font-semibold transition-all"
          >
            <Target size={18} className="text-blue-600" />
            Center on Me
          </button>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <span className="text-sm font-bold text-slate-600">Scanner</span>
            <button
              onClick={() => setScannerActive(!scannerActive)}
              className={`w-12 h-6 rounded-full transition-colors relative ${scannerActive ? "bg-blue-600" : "bg-gray-200"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${scannerActive ? "left-7" : "left-1"}`}
              />
            </button>
          </div>

          {scannerActive && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 min-w-48">
              <Sliders size={16} className="text-slate-400" />
              <input
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={scannerRadius}
                onChange={(e) => setScannerRadius(parseInt(e.target.value))}
                className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-bold text-blue-600 w-12">
                {(scannerRadius / 1000).toFixed(1)}km
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[650px]">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Navigation size={18} className="text-blue-600" />
              {scannerActive ? "In Range" : "All Jobs"}
            </h3>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-lg font-bold">
              {filteredJobs.length} FOUND
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center p-6 text-gray-400">
                <Radio size={48} className="mb-4 opacity-10" />
                <p className="text-sm font-medium">
                  No technicians detected in this zone
                </p>
                <p className="text-xs mt-1">Try expanding the scanner radius</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <button
                  key={job.rideId}
                  onClick={() => {
                    setSelectedJob(job);
                    const loc = job.currentLocation || job.pickup;
                    if (loc) {
                      setViewState({
                        latitude: loc.lat,
                        longitude: loc.lng,
                        zoom: 15,
                        transitionDuration: 1000
                      });
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all border group ${
                    selectedJob?.rideId === job.rideId
                      ? "bg-blue-50 border-blue-200"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {job.serviceType.toUpperCase()}
                    </p>
                    <ChevronRight
                      size={14}
                      className="text-slate-300 group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span
                      className={`w-2 h-2 rounded-full ${job.status === "IN_PROGRESS" ? "bg-emerald-500" : "bg-blue-500"}`}
                    />
                    <span className="font-medium">{job.status}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-mono text-[9px]">
                      #{job.rideId.slice(-6)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative" style={{ height: "650px" }}>
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            {/* Geo-Fence Circle */}
            {scannerActive && adminLocation && scannerData && (
              <Source id="scanner-circle" type="geojson" data={scannerData}>
                <Layer
                  id="scanner-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#3B82F6",
                    "fill-opacity": pulseOpacity,
                  }}
                />
                <Layer
                  id="scanner-outline"
                  type="line"
                  paint={{
                    "line-color": "#3B82F6",
                    "line-width": 2,
                    "line-opacity": 0.3,
                  }}
                />
              </Source>
            )}

            {/* Admin Location Marker */}
            {adminLocation && (
              <Marker
                latitude={adminLocation.lat}
                longitude={adminLocation.lng}
                anchor="center"
              >
                <div className="w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-lg" />
              </Marker>
            )}

            {/* Job Markers */}
            {filteredJobs.map((job) => {
              const loc = job.currentLocation || job.pickup;
              if (!loc) return null;
              return (
                <Marker
                  key={job.rideId}
                  latitude={loc.lat}
                  longitude={loc.lng}
                  anchor="bottom"
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    setSelectedJob(job);
                  }}
                >
                  <div className="cursor-pointer group">
                    <div className="bg-white p-1 rounded-full shadow-md border-2 border-slate-800 transition-transform group-hover:scale-110">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" 
                        alt="technician" 
                        className="w-8 h-8"
                      />
                    </div>
                    {selectedJob?.rideId === job.rideId && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-10 font-bold">
                        {job.serviceType.toUpperCase()}
                      </div>
                    )}
                  </div>
                </Marker>
              );
            })}
          </Map>
        </div>
      </div>
    </div>
  );
}
