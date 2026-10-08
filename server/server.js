import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import {
  initDb,
  getDevices,
  getDevice,
  upsertDevice,
  updateDevice,
  getIncidents,
  addIncident,
  getEvidence,
  addEvidence,
  getVault,
  wipeVault,
  resetVault
} from './database.js';
import {
  evaluateMotionAnomaly,
  evaluateGeofence,
  evaluateSecurityIncident
} from './ai-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const EVIDENCE_DIR = path.join(DATA_DIR, 'evidence');
const DIST_DIR = path.join(__dirname, '..', 'dist');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10MB for base64 photo transfers
});

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static evidence storage
app.use('/evidence', express.static(EVIDENCE_DIR));

// Serve built frontend if dist exists
app.use(express.static(DIST_DIR));

// Get Local LAN IP for physical mobile device testing
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prefer Wi-Fi or standard LAN
        if (!name.toLowerCase().includes('vmware') && !name.toLowerCase().includes('virtual')) {
          return iface.address;
        }
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 5000;
const HOST_IP = getLocalIpAddress();

// REST API ROUTES

// Server & Pairing Info
app.get('/api/status', async (req, res) => {
  const devices = await getDevices();
  res.json({
    status: 'ONLINE',
    service: 'SmartGuard AI Core System',
    timestamp: new Date().toISOString(),
    hostIp: HOST_IP,
    port: PORT,
    connectedDevices: devices.length
  });
});

app.get('/api/pair-info', async (req, res) => {
  const deviceId = req.query.deviceId || 'SG-PHONE-01';
  const mobileUrl = `http://${HOST_IP}:${PORT}/?mode=mobile&deviceId=${deviceId}`;
  const localUrl = `http://localhost:${PORT}/?mode=mobile&deviceId=${deviceId}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(mobileUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#00f0ff', light: '#050b14' }
    });
    res.json({
      mobileUrl,
      localUrl,
      qrCode: qrDataUrl,
      hostIp: HOST_IP,
      deviceId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR Code', details: err.message });
  }
});

// Devices API
app.get('/api/devices', async (req, res) => {
  const devices = await getDevices();
  res.json(devices);
});

app.get('/api/devices/:id', async (req, res) => {
  const device = await getDevice(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

app.post('/api/devices/register', async (req, res) => {
  const device = await upsertDevice(req.body);
  io.emit('device_registered', device);
  res.json(device);
});

app.post('/api/devices/:id/config', async (req, res) => {
  const updated = await updateDevice(req.params.id, {
    protectionConfig: req.body.protectionConfig,
    safeZone: req.body.safeZone,
    lockdown: req.body.lockdown
  });
  if (!updated) return res.status(404).json({ error: 'Device not found' });
  io.to(`device:${req.params.id}`).emit('config_updated', updated);
  io.emit('device_updated', updated);
  res.json(updated);
});

// Remote Command Dispatch API
app.post('/api/command', async (req, res) => {
  const { deviceId, command, payload = {} } = req.body;
  if (!deviceId || !command) {
    return res.status(400).json({ error: 'deviceId and command required' });
  }

  const device = await getDevice(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const eventPayload = {
    command,
    payload,
    timestamp: new Date().toISOString()
  };

  // Perform state update in DB if applicable
  if (command === 'LOCK') {
    await updateDevice(deviceId, {
      lockdown: {
        isLocked: true,
        message: payload.message || device.lockdown.message,
        contactPhone: payload.contactPhone || device.lockdown.contactPhone
      }
    });
    await addIncident({
      deviceId,
      type: 'REMOTE_LOCK_DISPATCH',
      severity: 'INFO',
      title: '🔒 Remote Lockdown Enforced',
      details: 'Command center remotely initiated immediate screen lock down.',
      location: device.location
    });
  } else if (command === 'UNLOCK') {
    await updateDevice(deviceId, {
      lockdown: { ...device.lockdown, isLocked: false }
    });
  } else if (command === 'WIPE') {
    await wipeVault(payload.method || 'MILITARY_ZERO_OVERWRITE');
    await addIncident({
      deviceId,
      type: 'REMOTE_WIPE_DISPATCH',
      severity: 'CRITICAL',
      title: '🛡️ Remote Cryptographic Wipe Executed',
      details: 'Confidential vault sanitized. Storage sectors zero-overwritten remotely.',
      location: device.location
    });
  } else if (command === 'DECOY_MODE') {
    await updateDevice(deviceId, { decoyModeActive: !!payload.active });
  }

  // Broadcast command to specific device and notify dashboards
  io.to(`device:${deviceId}`).emit('remote_command', eventPayload);
  io.emit('command_dispatched', { deviceId, command, payload });

  res.json({ success: true, command, deviceId, timestamp: eventPayload.timestamp });
});

// Incidents Audit API
app.get('/api/incidents', async (req, res) => {
  const { deviceId } = req.query;
  const incidents = await getIncidents(deviceId);
  res.json(incidents);
});

app.post('/api/incidents', async (req, res) => {
  const incident = await addIncident(req.body);
  io.emit('new_incident', incident);
  res.json(incident);
});

// Intruder Evidence API
app.get('/api/evidence', async (req, res) => {
  const { deviceId } = req.query;
  const evidence = await getEvidence(deviceId);
  res.json(evidence);
});

app.post('/api/evidence', async (req, res) => {
  try {
    const { deviceId, photoBase64, triggerType, threatScore, metadata = {} } = req.body;
    if (!photoBase64) {
      return res.status(400).json({ error: 'photoBase64 required' });
    }

    const filename = `intruder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
    const filePath = path.join(EVIDENCE_DIR, filename);

    // Save image to disk if valid base64
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
    await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));

    const evidenceRecord = await addEvidence({
      deviceId: deviceId || 'SG-PHONE-01',
      imageUrl: `/evidence/${filename}`,
      triggerType: triggerType || 'UNAUTHORIZED_ACCESS',
      threatScore: threatScore || 85,
      location: metadata.location || null,
      deviceModel: metadata.deviceModel || 'Mobile Device',
      faceDetected: metadata.faceDetected ?? true,
      faceConfidence: metadata.faceConfidence || 0.94,
      aiAnalysis: {
        eyesOpen: true,
        threatLevel: threatScore > 75 ? 'HIGH_RISK_INTRUDER' : 'SUSPICIOUS_ACCESS',
        lighting: metadata.lighting || 'NORMAL',
        notes: 'Front camera stealth snapshot triggered upon security breach.'
      }
    });

    // Also register an incident
    const incidentData = evaluateSecurityIncident(triggerType || 'WRONG_PIN_ATTEMPTS', {
      attempts: metadata.attempts || 3
    });

    const incident = await addIncident({
      deviceId: deviceId || 'SG-PHONE-01',
      type: triggerType || 'WRONG_PIN_ATTEMPTS',
      severity: incidentData.severity,
      title: incidentData.title,
      details: incidentData.details,
      location: metadata.location,
      evidenceId: evidenceRecord.id,
      imageUrl: evidenceRecord.imageUrl
    });

    io.emit('intruder_captured', { evidence: evidenceRecord, incident });
    res.json({ success: true, evidence: evidenceRecord, incident });
  } catch (err) {
    console.error('Evidence upload error:', err);
    res.status(500).json({ error: 'Failed to process evidence', details: err.message });
  }
});

// Secure Data Vault API
app.get('/api/vault', async (req, res) => {
  const vault = await getVault();
  res.json(vault);
});

app.post('/api/vault/wipe', async (req, res) => {
  const { method = 'CRYPTOGRAPHIC_ZEROING', deviceId = 'SG-PHONE-01' } = req.body;
  const wiped = await wipeVault(method);
  
  const incident = await addIncident({
    deviceId,
    type: 'REMOTE_WIPE_DISPATCH',
    severity: 'CRITICAL',
    title: '🛡️ Vault Remotely Sanitized',
    details: `Zero-fill protocol executed via ${method}. Checksum: ${wiped.auditChecksum}`,
  });

  io.emit('vault_wiped', { wiped, incident });
  res.json(wiped);
});

app.post('/api/vault/reset', async (req, res) => {
  const vault = await resetVault();
  io.emit('vault_reset', vault);
  res.json(vault);
});

// Fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
    if (err) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>SmartGuard Backend Running</title></head>
        <body style="font-family: sans-serif; background: #070d19; color: #00f0ff; padding: 40px; text-align: center;">
          <h1>🛡️ SmartGuard AI Backend Operational</h1>
          <p>API is active on port ${PORT}. Please run Vite dev server or run <code>npm run build</code>.</p>
          <p><a href="/api/status" style="color:#38bdf8;">Check API Status</a> | <a href="/api/pair-info" style="color:#38bdf8;">Pair Info</a></p>
        </body>
        </html>
      `);
    }
  });
});

// REAL-TIME SOCKET.IO ENGINE
io.on('connection', (socket) => {
  // Client joins room
  socket.on('join_device', (deviceId) => {
    socket.join(`device:${deviceId}`);
    socket.deviceId = deviceId;
  });

  socket.on('join_dashboard', () => {
    socket.join('dashboards');
  });

  // Device telemetry stream (accelerometer, GPS, battery, etc.)
  socket.on('device_telemetry', async (data) => {
    const { deviceId, sensors = {}, location, battery, isCharging, status } = data;
    if (!deviceId) return;

    // AI Kinetic Anomaly Analysis
    const motionEvaluation = evaluateMotionAnomaly(sensors);
    
    // Geofence Evaluation
    const device = await getDevice(deviceId);
    let geofenceEvaluation = { isBreached: false };
    if (device && location) {
      geofenceEvaluation = evaluateGeofence(location, device.safeZone);
    }

    const updates = {
      sensors: {
        ...sensors,
        aiAnalysis: motionEvaluation
      },
      lastSeen: new Date().toISOString()
    };

    if (location) updates.location = location;
    if (battery !== undefined) updates.battery = battery;
    if (isCharging !== undefined) updates.isCharging = isCharging;
    if (status) updates.status = status;

    await updateDevice(deviceId, updates);

    // Broadcast live telemetry to all connected owner dashboards
    io.emit('telemetry_update', {
      deviceId,
      sensors,
      location,
      battery,
      isCharging,
      status,
      motionEvaluation,
      geofenceEvaluation,
      timestamp: new Date().toISOString()
    });

    // Check if AI detected high probability snatch automatically
    if (motionEvaluation.isAlert && motionEvaluation.threatScore >= 70 && device?.protectionConfig?.armMotionDetection) {
      const incident = await addIncident({
        deviceId,
        type: 'SNATCH_AND_RUN',
        severity: 'CRITICAL',
        title: '🚨 High-Speed Kinetic Snatch Detected',
        details: motionEvaluation.explanation,
        location: location || device?.location
      });
      io.emit('security_alert', {
        deviceId,
        trigger: 'MOTION_SNATCH',
        incident,
        evaluation: motionEvaluation
      });
    }

    // Check Geofence breach alert
    if (geofenceEvaluation.isBreached && !device?.geofenceAlertActive) {
      const incident = await addIncident({
        deviceId,
        type: 'GEOFENCE_BREACH',
        severity: 'CRITICAL',
        title: '📍 Safe Perimeter Breached',
        details: geofenceEvaluation.explanation,
        location: location || device?.location
      });
      io.emit('security_alert', {
        deviceId,
        trigger: 'GEOFENCE_BREACH',
        incident,
        evaluation: geofenceEvaluation
      });
    }
  });

  // Theft Trigger event explicitly fired by mobile agent
  socket.on('theft_alert', async (data) => {
    const { deviceId, triggerType, details, location, sensorSnapshot } = data;
    const incidentData = evaluateSecurityIncident(triggerType, details || {});
    
    const incident = await addIncident({
      deviceId: deviceId || 'SG-PHONE-01',
      type: triggerType,
      severity: incidentData.severity,
      title: incidentData.title,
      details: incidentData.details,
      location: location || null,
      sensorSnapshot
    });

    io.emit('security_alert', {
      deviceId,
      trigger: triggerType,
      incident,
      timestamp: new Date().toISOString()
    });
  });

  // Remote command from dashboard
  socket.on('send_command', async ({ deviceId, command, payload }) => {
    io.to(`device:${deviceId}`).emit('remote_command', { command, payload, timestamp: new Date().toISOString() });
    io.emit('command_dispatched', { deviceId, command, payload });
  });

  // Alarm sound toggle sync
  socket.on('alarm_state_change', ({ deviceId, isAlarming }) => {
    io.emit('alarm_state_synced', { deviceId, isAlarming });
  });
});

// START SERVER
async function start() {
  await initDb();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🛡️  SMARTGUARD AI SYSTEM IS ACTIVE & RUNNING`);
    console.log(`======================================================`);
    console.log(`📡 Local Command Center : http://localhost:${PORT}`);
    console.log(`📱 Physical Phone Access: http://${HOST_IP}:${PORT}`);
    console.log(`⚡ WebSocket / REST API : Ready on Port ${PORT}`);
    console.log(`======================================================\n`);
  });
}

start().catch(err => {
  console.error('Fatal initialization error:', err);
});
