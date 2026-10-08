# SmartGuard: AI-Powered Mobile Theft Detection & Data Protection System

**SmartGuard** is an end-to-end, full-stack, real-time cybersecurity platform designed to protect mobile devices against physical theft, pickpocketing, snatch-and-run grabs, unauthorized data exfiltration, and charging station theft.

---

## 🚀 Live System Architecture

The project runs simultaneously as:
1. **Owner Command Center (Desktop / Admin Dashboard)**:
   - Real-time 3D Kinetic G-Force Accelerometer Waveform Monitor (60 FPS Canvas).
   - AI Kinetic Anomaly Model (Calculates snatch-and-run probability score).
   - Live Leaflet / OpenStreetMap GPS Tracker with customizable Safe Zone Geofencing.
   - Remote Threat Response Arsenal (High-decibel synthesized siren, remote screen lockdown, stealth camera capture, military cryptographic zero-wipe).
   - AI Intruder Evidence Vault (Forensic photo gallery with facial detection HUD markers).
   - Secure Data Vault (Encrypted notes, crypto seed phrases, 2FA codes, payment card tokens).
   - Incident Audit Timeline.
2. **Protected Mobile Client (Real Smartphone or Integrated Simulator)**:
   - Direct access on any physical iPhone / Android device over Wi-Fi via QR Code or local URL.
   - Real hardware sensor fusion (`devicemotion`, `deviceorientation`, Battery API, Geolocation, MediaDevices camera).
   - Cyber Lockscreen with 4-Digit Numeric PIN Pad:
     - **Owner PIN (`1234`)**: Unlocks phone safely.
     - **Decoy PIN (`9999`)**: Opens Honeypot Fake Phone with dummy data under duress while silently beaconing distress signals to the owner.
     - **3 Failed PINs**: Covertly snaps front camera selfie, alerts dashboard with photo + GPS, and triggers ear-piercing siren!
   - Hardware Sensor Test Lab (Simulate Snatch Jerk, Charger Disconnect, Pocket Extraction, Shake SOS).

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 5, Socket.IO, QRCode, Persistent JSON Datastore.
- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet Maps, Lucide Icons.
- **AI & Forensics Engine**:
  - Kinetic Vector Jerk Model: $G = \frac{\sqrt{x^2 + y^2 + z^2}}{9.80665}$ with delta jerk rate analysis.
  - Haversine Distance Geofencing Sentinel.
  - Front Camera Biometric Face Bounding Box & HUD overlay.
  - Web Audio API dual-tone high-decibel siren synthesizer (750Hz – 1600Hz).

---

## ⚡ How to Run

The server is **currently active and running** on your machine!

### 1. Open the Owner Command Center:
Open your browser and navigate to:
```
http://localhost:5000
```

### 2. Pair your Physical Mobile Phone:
1. Connect your smartphone to the same Wi-Fi network.
2. Click **"Pair Mobile"** on the top navigation bar of the dashboard.
3. Scan the QR code with your phone camera, or open the URL:
```
http://<YOUR-LAN-IP>:5000/?mode=mobile
```
4. Move your phone around or test unplugging to see real-time hardware telemetry!

### 3. Testing on Desktop (Integrated Mobile Simulator):
Click the **"Protected Phone"** tab in the top navigation bar to test all mobile features (PIN pad, snatch simulation, charger disconnect, stealth webcam selfie capture, siren) in the desktop simulator.

---

## 🔐 Credentials & Test Codes

- **Normal Unlock PIN**: `1234`
- **Decoy Honeypot Duress PIN**: `9999`
- **Intruder Trigger**: Enter any wrong PIN 3 times (e.g. `0000`)
