import React from 'react';
import { 
  Smartphone, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  ShieldCheck, 
  ShieldOff, 
  Lock, 
  Unlock,
  Radio,
  Zap,
  Clock
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function DeviceCard() {
  const { activeDevice, sendCommand, updateConfig } = useSecurity();

  if (!activeDevice) return null;

  const isArmed = activeDevice.status === 'ARMED';
  const isLocked = activeDevice.lockdown?.isLocked;
  const isDecoy = activeDevice.decoyModeActive;
  const batteryPct = activeDevice.battery || 85;

  const handleToggleArm = () => {
    const nextStatus = isArmed ? 'DISARMED' : 'ARMED';
    sendCommand('ARM_TOGGLE', { status: nextStatus });
    updateConfig({
      protectionConfig: {
        ...activeDevice.protectionConfig,
        armMotionDetection: nextStatus === 'ARMED',
        armPocketDetection: nextStatus === 'ARMED',
        armChargerDetection: nextStatus === 'ARMED'
      }
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyber-border relative overflow-hidden">
      {/* Top accent glow */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isLocked ? 'bg-cyber-red' : isArmed ? 'bg-cyber-cyan' : 'bg-slate-600'
      }`} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Device identity */}
        <div className="flex items-start space-x-3.5">
          <div className={`p-3 rounded-2xl border ${
            isLocked
              ? 'bg-red-500/20 text-cyber-red border-red-500/40 animate-pulse'
              : 'bg-cyan-500/10 text-cyber-cyan border-cyber-cyan/30'
          }`}>
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-wide">{activeDevice.name}</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {activeDevice.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{activeDevice.model}</p>
            
            <div className="flex items-center space-x-3 mt-2 text-xs font-mono text-slate-400">
              <span className="flex items-center space-x-1">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeDevice.network || '5G Mesh'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Sync: {new Date(activeDevice.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Battery & Quick Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Battery Status Pill */}
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-cyber-border flex items-center space-x-2">
            {activeDevice.isCharging ? (
              <BatteryCharging className="w-5 h-5 text-cyber-emerald animate-pulse" />
            ) : (
              <Battery className={`w-5 h-5 ${batteryPct < 20 ? 'text-cyber-red' : batteryPct < 50 ? 'text-amber-400' : 'text-cyber-emerald'}`} />
            )}
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-mono font-bold text-sm text-white">{batteryPct}%</span>
                {activeDevice.isCharging && (
                  <span className="text-[10px] font-mono text-emerald-400 px-1 bg-emerald-950/60 rounded">AC POWER</span>
                )}
              </div>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    batteryPct < 20 ? 'bg-cyber-red' : batteryPct < 50 ? 'bg-amber-400' : 'bg-cyber-emerald'
                  }`}
                  style={{ width: `${batteryPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Decoy Mode Status Pill */}
          {isDecoy && (
            <div className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-mono flex items-center space-x-1.5 animate-pulse">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>HONEYPOT DECOY ON</span>
            </div>
          )}

          {/* Armed / Disarmed Button */}
          <button
            onClick={handleToggleArm}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center space-x-2 transition-all shadow-md ${
              isArmed
                ? 'bg-cyan-500/20 text-cyber-cyan border border-cyber-cyan/50 hover:bg-cyan-500/30 shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
          >
            {isArmed ? <ShieldCheck className="w-4 h-4 text-cyber-cyan" /> : <ShieldOff className="w-4 h-4" />}
            <span>{isArmed ? 'DEFENSE: ARMED' : 'DEFENSE: DISARMED'}</span>
          </button>

          {/* Remote Lock / Unlock quick button */}
          <button
            onClick={() => sendCommand(isLocked ? 'UNLOCK' : 'LOCK', {})}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center space-x-2 transition-all shadow-md ${
              isLocked
                ? 'bg-red-600 text-white border border-red-500 hover:bg-red-700 shadow-red-500/30'
                : 'bg-slate-800 text-slate-300 border border-cyber-border hover:bg-slate-700'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{isLocked ? 'DEVICE LOCKED' : 'REMOTE LOCK'}</span>
          </button>

        </div>

      </div>
    </div>
  );
}
