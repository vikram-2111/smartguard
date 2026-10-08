/**
 * SmartGuard Hardware & Simulated Sensor Engine
 * Reads real mobile accelerometer & battery APIs when on physical device,
 * or allows simulated testing triggers from browser.
 */

export class SensorEngine {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.isListening = false;
    this.motionHandler = null;
    this.batteryHandler = null;

    this.currentData = {
      accelerometer: { x: 0.1, y: 9.8, z: 0.2, magnitude: 9.81 },
      orientation: { alpha: 0, beta: 0, gamma: 0 },
      isPocket: false,
      isCharging: false,
      batteryLevel: 88,
      location: {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 4,
        address: 'Cubbon Park Road, Bangalore, KA, India'
      }
    };
  }

  async startListening() {
    if (this.isListening) return;
    this.isListening = true;

    // 1. Accelerometer / Motion API
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      this.motionHandler = (e) => {
        const acc = e.accelerationIncludingGravity || e.acceleration;
        if (acc && acc.x !== null) {
          const x = acc.x || 0;
          const y = acc.y || 9.8;
          const z = acc.z || 0;
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          this.currentData.accelerometer = {
            x: parseFloat(x.toFixed(2)),
            y: parseFloat(y.toFixed(2)),
            z: parseFloat(z.toFixed(2)),
            magnitude: parseFloat(magnitude.toFixed(2))
          };
          this.notify();
        }
      };

      try {
        // Request iOS 13+ permission if required
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          const perm = await DeviceMotionEvent.requestPermission();
          if (perm === 'granted') {
            window.addEventListener('devicemotion', this.motionHandler);
          }
        } else {
          window.addEventListener('devicemotion', this.motionHandler);
        }
      } catch (err) {
        console.warn('Motion sensor permission prompt skipped:', err.message);
      }
    }

    // 2. Battery API
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.currentData.batteryLevel = Math.round(battery.level * 100);
        this.currentData.isCharging = battery.charging;
        this.notify();

        battery.addEventListener('chargingchange', () => {
          this.currentData.isCharging = battery.charging;
          this.notify();
        });
        battery.addEventListener('levelchange', () => {
          this.currentData.batteryLevel = Math.round(battery.level * 100);
          this.notify();
        });
      } catch (err) {
        console.warn('Battery API not supported in this browser:', err.message);
      }
    }

    // 3. Geolocation API
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.currentData.location = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
              address: 'Current Verified GPS Location'
            };
            this.notify();
          },
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } catch {}
    }

    this.notify();
  }

  stopListening() {
    if (this.motionHandler && typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.motionHandler);
    }
    this.isListening = false;
  }

  notify() {
    if (this.onUpdate) {
      this.onUpdate({ ...this.currentData });
    }
  }

  // Simulation Triggers for Desktop and Testing
  simulateSnatch() {
    // Generate sudden 3.4G kinetic jerk
    this.currentData.accelerometer = {
      x: 18.5,
      y: 22.8,
      z: -14.2,
      magnitude: 32.6 // ~3.3G
    };
    this.notify();

    // Gradually decay back to normal gravity baseline over 1.5 seconds
    setTimeout(() => {
      this.currentData.accelerometer = { x: 0.1, y: 9.8, z: 0.2, magnitude: 9.81 };
      this.notify();
    }, 1500);
  }

  simulateChargerUnplug() {
    this.currentData.isCharging = !this.currentData.isCharging;
    this.notify();
    return this.currentData.isCharging;
  }

  simulatePocketExtraction() {
    this.currentData.isPocket = !this.currentData.isPocket;
    this.notify();
    return this.currentData.isPocket;
  }

  simulateGeofenceBreach() {
    // Offset GPS by ~1.2 km
    this.currentData.location = {
      ...this.currentData.location,
      latitude: this.currentData.location.latitude + 0.012,
      longitude: this.currentData.location.longitude + 0.014,
      address: 'Outer Ring Road (Outside Safe Zone)'
    };
    this.notify();
  }

  resetLocation() {
    this.currentData.location = {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 5,
      address: 'Cubbon Park Road, Bangalore, KA, India'
    };
    this.notify();
  }
}
