import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Camera, 
  Trash2, 
  ShieldAlert, 
  Smartphone, 
  Radio, 
  Eye, 
  RefreshCw,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function RemoteControlPanel({ onTriggerWipeModal }) {
  const { 
    activeDevice, 
    sendCommand, 
    isSirenActive, 
    toggleSiren 
  } = useSecurity();

  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [lastActionSuccess, setLastActionSuccess] = useState('');

  const isLocked = activeDevice?.lockdown?.isLocked;
  const isDecoy = activeDevice?.decoyModeActive;

  const showNotification = (msg) => {
    setLastActionSuccess(msg);
    setTimeout(() => setLastActionSuccess(''), 3000);
  };

  const handleRemotePhoto = async () => {
    setIsPhotoLoading(true);
    await sendCommand('SNAP_PHOTO', {});
    showNotification('Covert photo capture command dispatched to device camera!');
    setTimeout(() => setIsPhotoLoading(false), 2000);
  };

  const handleToggleLock = async () => {
    const nextLocked = !isLocked;
    await sendCommand(nextLocked ? 'LOCK' : 'UNLOCK', {
      message: '🚨 SECURITY NOTICE: THIS DEVICE IS REPORTED STOLEN. GPS TRACKING TRANSMITTING LIVE TO OWNER.',
      contactPhone: '+1 (555) 019-9022'
    });
    showNotification(nextLocked ? 'Remote Screen Lockdown Enforced!' : 'Device Lockdown Lifted.');
  };

  const handleToggleDecoy = async () => {
    const nextDecoy = !isDecoy;
    await sendCommand('DECOY_MODE', { active: nextDecoy });
    showNotification(nextDecoy ? 'Decoy Honeypot Mode Activated!' : 'Decoy Mode Deactivated.');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyber-border space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyber-cyan border border-cyber-cyan/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">REMOTE THREAT RESPONSE ARSENAL</h3>
            <p className="text-[11px] text-slate-400 font-mono">Zero-Latency Bidirectional Commands</p>
          </div>
        </div>

        {lastActionSuccess && (
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg flex items-center space-x-1.5 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{lastActionSuccess}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* 1. Remote Siren Alarm */}
        <button
          onClick={() => {
            toggleSiren();
            showNotification(isSirenActive ? 'Siren Halted.' : 'High-Decibel Siren Blasting!');
          }}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 group ${
            isSirenActive
              ? 'bg-red-600/30 border-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-[#070e1c] border-cyber-border hover:border-cyber-red/50 text-slate-200 hover:bg-[#0c172d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${isSirenActive ? 'bg-red-500 text-white animate-bounce' : 'bg-red-500/10 text-cyber-red'}`}>
              {isSirenActive ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSirenActive ? 'bg-red-900 text-red-200' : 'bg-slate-800 text-slate-400'}`}>
              {isSirenActive ? 'ACTIVE' : 'READY'}
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-white group-hover:text-cyber-red transition-colors">
              {isSirenActive ? 'Stop Siren' : 'Trigger Siren'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              120dB Synthesized Wail
            </div>
          </div>
        </button>

        {/* 2. Remote Lockdown */}
        <button
          onClick={handleToggleLock}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 group ${
            isLocked
              ? 'bg-amber-600/20 border-amber-500 text-white shadow-lg shadow-amber-500/20'
              : 'bg-[#070e1c] border-cyber-border hover:border-amber-400/50 text-slate-200 hover:bg-[#0c172d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${isLocked ? 'bg-amber-500 text-black' : 'bg-amber-500/10 text-amber-400'}`}>
              {isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isLocked ? 'bg-amber-900 text-amber-200' : 'bg-slate-800 text-slate-400'}`}>
              {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
              {isLocked ? 'Lift Lockdown' : 'Remote Lock'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Immediate Screen Lock
            </div>
          </div>
        </button>

        {/* 3. Stealth Camera Snap */}
        <button
          onClick={handleRemotePhoto}
          disabled={isPhotoLoading}
          className="p-4 rounded-xl border bg-[#070e1c] border-cyber-border hover:border-cyan-400/50 text-slate-200 hover:bg-[#0c172d] text-left transition-all flex flex-col justify-between h-32 group disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyber-cyan">
              <Camera className={`w-5 h-5 ${isPhotoLoading ? 'animate-spin' : ''}`} />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {isPhotoLoading ? 'SNAPPING...' : 'COVERT'}
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
              Stealth Camera
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Snap Front Camera
            </div>
          </div>
        </button>

        {/* 4. Remote Cryptographic Wipe */}
        <button
          onClick={onTriggerWipeModal}
          className="p-4 rounded-xl border bg-[#1a080d] border-red-900/60 hover:border-cyber-red text-slate-200 hover:bg-[#280c14] text-left transition-all flex flex-col justify-between h-32 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-red-500/20 text-cyber-red">
              <Trash2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">
              IRREVERSIBLE
            </span>
          </div>
          <div>
            <div className="font-bold text-sm text-white group-hover:text-cyber-red transition-colors">
              Emergency Wipe
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Military-Grade Zero Fill
            </div>
          </div>
        </button>

      </div>

      {/* Secondary Decoy Honeypot Toggle */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>HONEYPOT DECOY PHONE MODE:</span>
          <span className="text-slate-300">
            {isDecoy ? 'ACTIVE (Fakes empty phone under duress)' : 'STANDBY'}
          </span>
        </div>
        <button
          onClick={handleToggleDecoy}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
            isDecoy 
              ? 'bg-purple-600/30 text-purple-300 border-purple-500' 
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {isDecoy ? 'DISABLE DECOY' : 'ENGAGE DECOY'}
        </button>
      </div>

    </div>
  );
}
