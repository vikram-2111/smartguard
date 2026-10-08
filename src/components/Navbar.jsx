import React from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Smartphone, 
  QrCode, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function Navbar({ currentView, setCurrentView, onOpenPairModal }) {
  const { 
    serverStatus, 
    activeDevice, 
    isSirenActive, 
    toggleSiren, 
    incidents 
  } = useSecurity();

  const isLocked = activeDevice?.lockdown?.isLocked;
  const recentCritical = incidents.slice(0, 5).some(i => i.severity === 'CRITICAL');

  return (
    <header className="sticky top-0 z-40 bg-[#050a14]/90 backdrop-blur-md border-b border-cyber-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              isSirenActive || isLocked 
                ? 'bg-red-500/20 text-cyber-red border border-cyber-red animate-pulse' 
                : 'bg-cyan-500/10 text-cyber-cyan border border-cyber-cyan/30'
            }`}>
              {isSirenActive || isLocked ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-tech text-2xl font-bold tracking-wider text-white">SMARTGUARD</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-cyan-950 text-cyber-cyan border border-cyber-cyan/40">
                  AI v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Mobile Theft Detection & Autonomous Data Protection
              </p>
            </div>
          </div>

          {/* System Threat Badge */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-xs font-mono">
            <div className={`w-2.5 h-2.5 rounded-full ${
              isSirenActive || isLocked
                ? 'bg-red-500 animate-ping'
                : recentCritical
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400'
            }`} />
            <span className="text-slate-400">DEFENSE STATUS:</span>
            <span className={`font-semibold ${
              isSirenActive || isLocked ? 'text-cyber-red font-bold' : recentCritical ? 'text-amber-400' : 'text-cyber-emerald'
            }`}>
              {isSirenActive ? 'SIREN BLASTING' : isLocked ? 'LOCKDOWN ACTIVE' : 'SHIELDS ARMED'}
            </span>
          </div>

          {/* Actions & View Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* View Switcher: Dashboard vs Phone Client */}
            <div className="flex bg-[#0a1426] p-1 rounded-xl border border-cyber-border text-xs font-medium">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  currentView === 'dashboard'
                    ? 'bg-cyan-500/20 text-cyber-cyan border border-cyber-cyan/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Owner</span> Dashboard
              </button>
              <button
                onClick={() => setCurrentView('mobile')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  currentView === 'mobile'
                    ? 'bg-cyan-500/20 text-cyber-cyan border border-cyber-cyan/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Protected</span> Phone
              </button>
            </div>

            {/* Siren Emergency Quick Toggle */}
            <button
              onClick={() => toggleSiren()}
              className={`p-2 rounded-xl transition-all border flex items-center space-x-1 ${
                isSirenActive
                  ? 'bg-red-600 text-white border-red-500 animate-strobe shadow-lg shadow-red-500/50'
                  : 'bg-slate-800/80 text-slate-300 hover:text-cyber-red hover:border-red-500/50 border-cyber-border'
              }`}
              title={isSirenActive ? "Stop Siren Alarm" : "Trigger Emergency Siren"}
            >
              {isSirenActive ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5" />}
              <span className="text-xs font-bold font-mono hidden xl:inline">
                {isSirenActive ? 'STOP SIREN' : 'SIREN'}
              </span>
            </button>

            {/* QR Code / Pair Mobile */}
            <button
              onClick={onOpenPairModal}
              className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyber-cyan border border-cyber-cyan/30 text-xs font-mono font-medium flex items-center space-x-1.5 transition-all"
              title="Pair Physical Phone via WiFi"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Pair Mobile</span>
            </button>

            {/* Connection Status */}
            <div className="flex items-center text-xs font-mono pl-1" title={serverStatus === 'ONLINE' ? 'Server Connected' : 'Server Disconnected'}>
              {serverStatus === 'ONLINE' ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
