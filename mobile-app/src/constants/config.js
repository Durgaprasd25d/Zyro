/**
 * Application Configuration
 *
 * Centralized config for backend URLs, intervals, and thresholds
 */

// Load from .env file (create .env from .env.example)
// In Expo SDK 49+, use EXPO_PUBLIC_ prefix for automatic environment variable injection
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.1.45:4000";
console.log(
  "📡 [Config] process.env.EXPO_PUBLIC_BACKEND_URL:",
  process.env.EXPO_PUBLIC_BACKEND_URL,
);
console.log("📡 [Config] Final BACKEND_URL:", BACKEND_URL);
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_API_KEY || "pk.eyJ1IjoiZHVyZ2EwNyIsImEiOiJjbW14bXo2ZWsyenRvMnJyMG5yOXBtczlrIn0.opLR_TbZiRjBsPfgIOu83g";

if (!MAPBOX_ACCESS_TOKEN) {
  console.warn(
    "⚠️ Mapbox Access Token is missing! Map features will not work.",
  );
}

const RAZORPAY_KEYID =
  process.env.EXPO_PUBLIC_RAZORPAY_KEYID || "";
const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "djsdp7cns";
const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "zyro-ac";

export default {
  // Backend
  BACKEND_URL,
  SOCKET_URL: BACKEND_URL,

  // Mapbox SDK
  MAPBOX_ACCESS_TOKEN,

  RAZORPAY_KEYID,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,

  // Driver Location Updates
  DRIVER_LOCATION_INTERVAL: 2000, // 2 seconds (Uber-level response)
  DRIVER_DISTANCE_FILTER: 1, // 1 meter (Catch small movements)
  DRIVER_LOCATION_ACCURACY: "highest", // Match user recommendation

  // Customer Polling Fallback
  POLLING_INTERVAL: 3000, // 3 seconds (was 5)

  // Animation
  MARKER_ANIMATION_DURATION: 1100, // Slightly longer than interval to ensure continuity
  CAMERA_ANIMATION_DURATION: 800, // Smoother camera follow

  // Stale Detection
  LOCATION_STALE_THRESHOLD: 15000, // 15 seconds (was 30)

  // GPS Noise Filtering
  GPS_NOISE_THRESHOLD: 1, // 1 meter (was 5) - more sensitive for smooth movement
  MAX_SPEED_THRESHOLD: 250, // km/h

  // Map Settings
  DEFAULT_ZOOM_LEVEL: 16,
  MIN_ZOOM_LEVEL: 10,
  MAX_ZOOM_LEVEL: 20,

  // Background Task
  BACKGROUND_TASK_NAME: "DRIVER_LOCATION_TRACKING",
};
