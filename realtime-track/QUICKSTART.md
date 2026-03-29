# 🚀 Quick Start Guide

Get your Uber-like tracking system running in **5 minutes**!

## ⚡ Fast Setup

### 1. Backend Setup (2 minutes)

```bash
# Navigate to backend
cd "Realtime Track/backend"

# Install dependencies
npm install

# Start server
npm start
```

✅ Server should be running on `http://localhost:3000`

---

### 2. Mobile App Setup (3 minutes)

```bash
# Navigate to mobile app
cd "Realtime Track/mobile-app"

# Install dependencies
npm install

# Start Expo
npx expo start
```

---

### 3. Configure Environment

Create a `.env` file in the `mobile-app/` directory:

```env
EXPO_PUBLIC_BACKEND_URL=http://<YOUR_COMPUTER_IP>:3000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAQCa64PcTvWMOJ7anLefPuW9FQC5DcHzw
```

> [!IMPORTANT]
> Use your local network IP (e.g., 192.168.1.50). You can find it by running `hostname -I` on Linux/Mac.

---

### 4. Run the App

1. **Scan QR code** with Expo Go app (on your phone)
2. OR press **`i`** for iOS simulator / **`a`** for Android emulator

---

## 🧪 Testing in 30 Seconds

### Test Locally (2 devices/simulators)

**Device 1 - Driver:**

1. Enter Ride ID: `test123`
2. Select **Driver**
3. Press **Start Tracking**
4. Grant location permissions

**Device 2 - Customer:**

1. Enter Ride ID: `test123` (same ID!)
2. Select **Customer**
3. Watch the driver marker appear and move

### Simulate Movement (iOS Simulator)

- Features → Location → **Freeway Drive**

### Simulate Movement (Android Emulator)

- Extended Controls (⋮) → Location → **Routes** → Play

---

## ✅ Verification Checklist

- [ ] Backend server started successfully
- [ ] Mobile app opened in Expo Go
- [ ] Driver can start tracking
- [ ] Customer sees driver on map
- [ ] Marker moves smoothly (no jumping)
- [ ] Connection status shows "Connected"

---

## 🐛 Common Issues & Fixes

### "Cannot connect to server"

- ✅ Use your IP address, NOT `localhost`
- ✅ Ensure devices are on same WiFi network
- ✅ Check backend server is running

### "Map not loading"

- ✅ Add Google Maps API Key to `.env`
- ✅ Enable Maps SDK in Google Cloud Console

### "Location permission denied"

- ✅ Go to device Settings → App → Permissions
- ✅ Grant Location permission
- ✅ Restart the app

---

## 📱 Google Maps API Key

### Get Your Free API Key (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Maps SDK for Android**
4. Enable **Maps SDK for iOS**
5. Create credentials → API Key
6. Copy the API key
7. Add to:
   - `mobile-app/.env` → `GOOGLE_MAPS_API_KEY=YOUR_KEY`
   - `mobile-app/app.json` → Replace both instances of `YOUR_GOOGLE_MAPS_API_KEY`

---

## 🎯 Next Steps

Once everything works:

1. ✨ Customize marker icon (`mobile-app/assets/car-icon.png`)
2. 🎨 Adjust animation speeds in `config.js`
3. 🔧 Fine-tune GPS settings
4. 📊 Add analytics/logging
5. 🚀 Deploy to production

---

## 📚 Full Documentation

See [README.md](README.md) for:

- Complete API documentation
- Advanced configuration
- Production deployment
- Troubleshooting guide

---

**Ready to track! 🚗💨**
