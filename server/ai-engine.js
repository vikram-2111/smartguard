/**
 * SmartGuard AI Anomaly & Threat Detection Engine
 * Real-time heuristics, motion vector profiling, and threat classification
 */

// Haversine distance in meters
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function evaluateMotionAnomaly(currentSensors, previousSensors = null) {
  const { x = 0, y = 9.8, z = 0 } = currentSensors.accelerometer || {};
  // Compute total acceleration magnitude
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  // Gravity normalized g-force (1.0 = normal static gravity)
  const gForce = magnitude / 9.80665;

  let jerk = 0;
  if (previousSensors && previousSensors.accelerometer) {
    const prevMag = Math.sqrt(
      previousSensors.accelerometer.x ** 2 +
      previousSensors.accelerometer.y ** 2 +
      previousSensors.accelerometer.z ** 2
    );
    jerk = Math.abs(magnitude - prevMag);
  }

  let threatScore = 0;
  let threatType = 'NORMAL';
  let isAlert = false;
  let explanation = 'Motion within normal everyday baseline.';

  if (gForce > 2.8 || jerk > 18) {
    threatScore = Math.min(99, Math.round(75 + (gForce - 2.8) * 15 + jerk * 0.5));
    threatType = 'HIGH_PROBABILITY_SNATCH';
    isAlert = true;
    explanation = `Violent kinetic jerk detected (${gForce.toFixed(2)}G). High correlation with bike/pedestrian grab & snatch.`;
  } else if (gForce > 1.8 || jerk > 10) {
    threatScore = Math.min(74, Math.round(45 + (gForce - 1.8) * 20));
    threatType = 'SUSPICIOUS_MOTION';
    isAlert = true;
    explanation = `Rapid sudden acceleration spike (${gForce.toFixed(2)}G). Exceeds normal walking/pocket dynamics.`;
  } else if (gForce > 1.35) {
    threatScore = 20;
    threatType = 'ELEVATED_HANDLING';
    isAlert = false;
    explanation = 'Elevated handling motion detected.';
  }

  return {
    threatScore,
    threatType,
    isAlert,
    gForce: parseFloat(gForce.toFixed(2)),
    magnitude: parseFloat(magnitude.toFixed(2)),
    jerk: parseFloat(jerk.toFixed(2)),
    explanation,
    analyzedAt: new Date().toISOString()
  };
}

export function evaluateGeofence(currentLocation, safeZone) {
  if (!safeZone || !currentLocation || !currentLocation.latitude || !safeZone.latitude) {
    return { isBreached: false, distance: 0, threatScore: 0 };
  }

  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    safeZone.latitude,
    safeZone.longitude
  );

  const radius = safeZone.radius || 300;
  const isBreached = distance > radius;
  let threatScore = 0;
  let explanation = `Device is inside safe perimeter (${Math.round(distance)}m / ${radius}m limit).`;

  if (isBreached) {
    const excess = distance - radius;
    threatScore = Math.min(95, Math.round(50 + (excess / 100) * 10));
    explanation = `GEOFENCE VIOLATION: Device has exited safe perimeter '${safeZone.name || 'Safe Zone'}'. Distance: ${Math.round(distance)}m (exceeded by ${Math.round(excess)}m).`;
  }

  return {
    isBreached,
    distance: Math.round(distance),
    radius,
    excessDistance: isBreached ? Math.round(distance - radius) : 0,
    threatScore,
    explanation,
    analyzedAt: new Date().toISOString()
  };
}

export function evaluateSecurityIncident(triggerType, data = {}) {
  let severity = 'LOW';
  let title = 'Security Event';
  let details = '';

  switch (triggerType) {
    case 'SNATCH_AND_RUN':
      severity = 'CRITICAL';
      title = '🚨 Violent Snatch-and-Run Detected';
      details = `AI Kinetic Model detected high G-force acceleration (${data.gForce || '2.9'}G) characteristic of sudden snatching.`;
      break;
    case 'WRONG_PIN_ATTEMPTS':
      severity = 'HIGH';
      title = '⚠️ Multiple Unauthorized PIN Failures';
      details = `Failed unlock attempts reached threshold (${data.attempts || 3}). Stealth camera activated & evidence locked.`;
      break;
    case 'CHARGER_UNPLUG':
      severity = 'HIGH';
      title = '⚡ Public Charger Disconnected';
      details = 'External power cord removed while device was locked in public anti-theft charge guard mode.';
      break;
    case 'POCKET_EXTRACTION':
      severity = 'HIGH';
      title = '👖 Pickpocket / Pocket Removal Triggered';
      details = 'Device extracted from pocket/bag without owner biometric authentication.';
      break;
    case 'GEOFENCE_BREACH':
      severity = 'CRITICAL';
      title = '📍 Safe Zone Geofence Breach';
      details = `Device moved outside permitted perimeter. Distance: ${data.distance || 'Unknown'}m.`;
      break;
    case 'PANIC_SOS':
      severity = 'CRITICAL';
      title = '🆘 Emergency SOS Beacon Activated';
      details = 'Owner or automated fail-safe triggered silent panic beacon with live GPS broadcast.';
      break;
    case 'REMOTE_LOCK_DISPATCH':
      severity = 'INFO';
      title = '🔒 Remote Lockdown Executed';
      details = 'Command center issued immediate screen freeze and security banner.';
      break;
    case 'REMOTE_WIPE_DISPATCH':
      severity = 'CRITICAL';
      title = '🛡️ Emergency Vault Wipe Triggered';
      details = 'Zero-overwrite cryptographic wipe dispatched to prevent data exfiltration.';
      break;
    default:
      severity = 'MEDIUM';
      title = 'Security Anomaly';
      details = data.details || 'Suspicious activity logged by SmartGuard.';
  }

  return { severity, title, details };
}
