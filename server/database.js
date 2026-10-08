import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const EVIDENCE_DIR = path.join(DATA_DIR, 'evidence');

const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');
const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');
const EVIDENCE_FILE = path.join(DATA_DIR, 'evidence.json');
const VAULT_FILE = path.join(DATA_DIR, 'vault.json');

const DEFAULT_VAULT = {
  isWiped: false,
  wipedAt: null,
  wipeMethod: null,
  contacts: [
    { id: 'c1', name: 'Dr. Sarah Connor', phone: '+1 555-0143', relationship: 'Emergency Contact' },
    { id: 'c2', name: 'Vikram Patel (Office)', phone: '+1 555-0199', relationship: 'Work' },
    { id: 'c3', name: 'Family Group (Encrypted)', phone: '+1 555-0211', relationship: 'Personal' }
  ],
  notes: [
    { id: 'n1', title: 'Crypto Hardware Seed Phrase', content: 'ocean quantum velvet eagle orbit matrix neon silver radar echo flame dynamic', isConfidential: true },
    { id: 'n2', title: 'Work VPN & 2FA Backup Codes', content: '8910-4412 | 3390-1124 | 5562-9841', isConfidential: true },
    { id: 'n3', title: 'Home Security Gate Passcode', content: '#8849-B', isConfidential: false }
  ],
  cards: [
    { id: 'k1', bank: 'Titanium Wealth Bank', last4: '4491', expiry: '09/29', status: 'PROTECTED' },
    { id: 'k2', bank: 'Global Cyber Card', last4: '8812', expiry: '11/30', status: 'PROTECTED' }
  ]
};

const DEFAULT_DEVICES = [
  {
    id: 'SG-PHONE-01',
    name: "Vikram's Galaxy S24 Ultra",
    model: "Samsung Galaxy S24 Ultra",
    status: 'ARMED',
    battery: 87,
    isCharging: false,
    network: '5G Secure Mesh',
    lastSeen: new Date().toISOString(),
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 5,
      address: 'Cubbon Park Road, Bangalore, KA, India'
    },
    safeZone: {
      latitude: 12.9716,
      longitude: 77.5946,
      radius: 400, // meters
      name: 'Central Tech Zone'
    },
    sensors: {
      accelerometer: { x: 0.12, y: 9.81, z: 0.25, magnitude: 9.82 },
      pocketDetection: 'IN_POCKET',
      motionAlert: false,
      chargerAlert: false
    },
    protectionConfig: {
      armMotionDetection: true,
      armChargerDetection: true,
      armPocketDetection: true,
      armWrongPinLock: true,
      maxPinAttempts: 3,
      sirenVolume: 100,
      autoStealthPhoto: true
    },
    lockdown: {
      isLocked: false,
      message: '🚨 SECURITY NOTICE: THIS DEVICE IS REPORTED STOLEN. GPS TRACKING IS TRANSMITTING TO POLICE.',
      contactPhone: '+1 (555) 019-9022'
    },
    decoyModeActive: false
  }
];

const DEFAULT_INCIDENTS = [
  {
    id: 'inc-001',
    deviceId: 'SG-PHONE-01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'MOTION_SNATCH_SUSPECTED',
    severity: 'HIGH',
    title: 'Sudden High Acceleration Vector',
    details: 'Sudden spike of 2.8G jerk detected while armed. Motion profile analyzed by AI anomaly engine.',
    location: { latitude: 12.9721, longitude: 77.5952, address: 'Near Kasturba Cross' },
    status: 'INVESTIGATED',
    evidenceId: null
  },
  {
    id: 'inc-002',
    deviceId: 'SG-PHONE-01',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    type: 'POCKET_EXTRACTION',
    severity: 'MEDIUM',
    title: 'Rapid Pocket / Bag Removal',
    details: 'Light sensor and vertical jerk threshold exceeded without owner proximity handshake.',
    location: { latitude: 12.9716, longitude: 77.5946, address: 'Cubbon Park Road' },
    status: 'RESOLVED',
    evidenceId: null
  }
];

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
}

async function readFileOrDefault(filePath, defaultVal) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultVal, null, 2), 'utf-8');
    return defaultVal;
  }
}

async function writeFile(filePath, data) {
  await ensureDirs();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function initDb() {
  await ensureDirs();
  await readFileOrDefault(DEVICES_FILE, DEFAULT_DEVICES);
  await readFileOrDefault(INCIDENTS_FILE, DEFAULT_INCIDENTS);
  await readFileOrDefault(EVIDENCE_FILE, []);
  await readFileOrDefault(VAULT_FILE, DEFAULT_VAULT);
}

export async function getDevices() {
  return await readFileOrDefault(DEVICES_FILE, DEFAULT_DEVICES);
}

export async function getDevice(id) {
  const devices = await getDevices();
  return devices.find(d => d.id === id) || null;
}

export async function upsertDevice(deviceData) {
  const devices = await getDevices();
  const idx = devices.findIndex(d => d.id === deviceData.id);
  if (idx >= 0) {
    devices[idx] = { ...devices[idx], ...deviceData, lastSeen: new Date().toISOString() };
  } else {
    devices.push({
      ...deviceData,
      lastSeen: new Date().toISOString()
    });
  }
  await writeFile(DEVICES_FILE, devices);
  return idx >= 0 ? devices[idx] : deviceData;
}

export async function updateDevice(id, updates) {
  const devices = await getDevices();
  const idx = devices.findIndex(d => d.id === id);
  if (idx >= 0) {
    devices[idx] = { ...devices[idx], ...updates, lastSeen: new Date().toISOString() };
    await writeFile(DEVICES_FILE, devices);
    return devices[idx];
  }
  return null;
}

export async function getIncidents(deviceId = null) {
  const incidents = await readFileOrDefault(INCIDENTS_FILE, DEFAULT_INCIDENTS);
  if (deviceId) {
    return incidents.filter(i => i.deviceId === deviceId);
  }
  return incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function addIncident(incident) {
  const incidents = await readFileOrDefault(INCIDENTS_FILE, DEFAULT_INCIDENTS);
  const newInc = {
    id: incident.id || `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: incident.timestamp || new Date().toISOString(),
    status: 'ACTIVE',
    ...incident
  };
  incidents.unshift(newInc);
  // Keep last 100 incidents
  if (incidents.length > 100) incidents.length = 100;
  await writeFile(INCIDENTS_FILE, incidents);
  return newInc;
}

export async function getEvidence(deviceId = null) {
  const evidence = await readFileOrDefault(EVIDENCE_FILE, []);
  if (deviceId) {
    return evidence.filter(e => e.deviceId === deviceId);
  }
  return evidence.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function addEvidence(evidenceItem) {
  const evidence = await readFileOrDefault(EVIDENCE_FILE, []);
  const newItem = {
    id: evidenceItem.id || `ev-${Date.now()}`,
    timestamp: evidenceItem.timestamp || new Date().toISOString(),
    ...evidenceItem
  };
  evidence.unshift(newItem);
  if (evidence.length > 50) evidence.length = 50;
  await writeFile(EVIDENCE_FILE, evidence);
  return newItem;
}

export async function getVault() {
  return await readFileOrDefault(VAULT_FILE, DEFAULT_VAULT);
}

export async function wipeVault(method = 'CRYPTOGRAPHIC_ZEROING') {
  const wiped = {
    isWiped: true,
    wipedAt: new Date().toISOString(),
    wipeMethod: method,
    auditChecksum: 'SHA256:' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
    contacts: [],
    notes: [],
    cards: []
  };
  await writeFile(VAULT_FILE, wiped);
  return wiped;
}

export async function resetVault() {
  await writeFile(VAULT_FILE, DEFAULT_VAULT);
  return DEFAULT_VAULT;
}
