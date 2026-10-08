import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  MapPin, 
  Lock, 
  AlertOctagon,
  Eye,
  Radio,
  FileCheck
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import DeviceCard from './DeviceCard';
import ThreatMonitor from './ThreatMonitor';
import LiveMap from './LiveMap';
import RemoteControlPanel from './RemoteControlPanel';
import IntruderVault from './IntruderVault';
import VaultManager from './VaultManager';
import IncidentLog from './IncidentLog';
import { captureIntruderSnapshot } from '../utils/cameraCapture';

export default function Dashboard() {
  const { 
    activeDevice, 
    activeDeviceId, 
    incidents, 
    evidence, 
    vault, 
    isSirenActive, 
    uploadEvidence 
  } = useSecurity();

  const [wipeModalOpen, setWipeModalOpen] = useState(false);

  // Quick test capture from dashboard
  const handleTestCapture = async () => {
    try {
      const snap = await captureIntruderSnapshot({
        triggerReason: 'DASHBOARD_TEST_CAPTURE',
        deviceId: activeDeviceId,
        location: activeDevice?.location
      });
      if (snap && snap.photoBase64) {
        await uploadEvidence(snap.photoBase64, 'MANUAL_INSPECTION_CAPTURE', 88, {
          faceDetected: true,
          faceConfidence: 0.98
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isLocked = activeDevice?.lockdown?.isLocked;
  const isWiped = vault?.isWiped;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Threat Alert Banner if Siren or Lock is active */}
      {(isSirenActive || isLocked) && (
        <div className="glass-panel-danger rounded-2xl p-4 border border-cyber-red animate-pulse flex items-center justify-between">
          <div className="flex items-center space-x-3 text-cyber-red">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
            <div>
              <div className="font-mono font-bold text-sm text-white">
                CRITICAL SECURITY EVENT IN PROGRESS
              </div>
              <div className="text-xs text-red-300">
                {isSirenActive && isLocked
                  ? 'High-decibel acoustic defense siren active and device is locked down!'
                  : isSirenActive
                  ? 'Emergency acoustic siren is sounding on device.'
                  : 'Remote screen lockdown has locked the physical device screen.'}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-red-600 text-white rounded-lg">
            CODE RED
          </span>
        </div>
      )}

      {/* Quick Status KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Active Devices */}
        <div className="glass-panel rounded-2xl p-4 border border-cyber-border">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>PROTECTED DEVICES</span>
            <Radio className="w-4 h-4 text-cyber-cyan" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">1</span>
            <span className="text-xs text-emerald-400 font-mono">ONLINE (5G)</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
            {activeDevice?.name || 'Primary Phone'}
          </div>
        </div>

        {/* KPI 2: AI Defense Status */}
        <div className="glass-panel rounded-2xl p-4 border border-cyber-border">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>DEFENSE SYSTEM</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-xl font-bold font-mono ${activeDevice?.status === 'ARMED' ? 'text-cyber-cyan' : 'text-slate-400'}`}>
              {activeDevice?.status === 'ARMED' ? 'ARMED' : 'STANDBY'}
            </span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">
            Kinetic & Snatch AI Active
          </div>
        </div>

        {/* KPI 3: Geofence Integrity */}
        <div className="glass-panel rounded-2xl p-4 border border-cyber-border">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>GEOFENCE PERIMETER</span>
            <MapPin className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-emerald-400">SAFE</span>
            <span className="text-xs text-slate-400 font-mono">(400m)</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
            {activeDevice?.location?.address || 'Verified Coordinates'}
          </div>
        </div>

        {/* KPI 4: Cryptographic Vault */}
        <div className="glass-panel rounded-2xl p-4 border border-cyber-border">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>DATA VAULT</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-xl font-bold font-mono ${isWiped ? 'text-cyber-red' : 'text-white'}`}>
              {isWiped ? 'PURGED' : 'PROTECTED'}
            </span>
          </div>
          <div className={`text-[10px] font-mono mt-1 ${isWiped ? 'text-red-400' : 'text-emerald-400'}`}>
            {isWiped ? 'Zero Residual Data' : 'Hardware AES-256 Vault'}
          </div>
        </div>

      </div>

      {/* Main Grid: Device Info & Remote Control Pad */}
      <DeviceCard />

      {/* Remote Commands Arsenal */}
      <RemoteControlPanel onTriggerWipeModal={() => setWipeModalOpen(true)} />

      {/* Telemetry and Map Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatMonitor />
        <LiveMap />
      </div>

      {/* Intruder Biometric Evidence Vault */}
      <IntruderVault onTriggerCapture={handleTestCapture} />

      {/* Sensitive Data Vault & Cryptographic Wipe Simulation */}
      <VaultManager />

      {/* Incident Audit Log */}
      <IncidentLog />

    </div>
  );
}
