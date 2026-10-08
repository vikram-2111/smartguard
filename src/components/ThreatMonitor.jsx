import React, { useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  ShieldAlert, 
  Zap, 
  Eye, 
  Smartphone, 
  AlertOctagon,
  Radar
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function ThreatMonitor() {
  const { activeDevice } = useSecurity();
  const canvasRef = useRef(null);
  const waveHistoryRef = useRef([]);

  const sensors = activeDevice?.sensors || {
    accelerometer: { x: 0.1, y: 9.8, z: 0.2, magnitude: 9.81 },
    pocketDetection: 'IN_POCKET',
    aiAnalysis: { threatScore: 12, threatType: 'NORMAL', gForce: 1.0, jerk: 0.2 }
  };

  const ai = sensors.aiAnalysis || {
    threatScore: 8,
    threatType: 'NORMAL',
    gForce: (sensors.accelerometer?.magnitude || 9.81) / 9.81,
    jerk: 0.2,
    explanation: 'Normal baseline handling.'
  };

  const gForceVal = ai.gForce || ((sensors.accelerometer?.magnitude || 9.81) / 9.81);
  const threatScore = Math.min(100, Math.max(0, ai.threatScore || Math.round(gForceVal > 2.0 ? 88 : 12)));

  // Real-time canvas waveform for kinetic G-Force
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Add current gForce to wave history
    waveHistoryRef.current.push(gForceVal);
    if (waveHistoryRef.current.length > 50) {
      waveHistoryRef.current.shift();
    }

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Draw baseline 1G line
    const baselineY = h - (1.0 / 3.5) * h;
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(w, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw waveform
    if (waveHistoryRef.current.length > 1) {
      ctx.beginPath();
      const isCritical = threatScore > 70;
      ctx.strokeStyle = isCritical ? '#ff1744' : threatScore > 40 ? '#ffab00' : '#00f0ff';
      ctx.lineWidth = 2.5;

      const step = w / 50;
      waveHistoryRef.current.forEach((val, index) => {
        const normalizedY = h - Math.min(h - 5, Math.max(5, (val / 3.5) * h));
        const x = index * step;
        if (index === 0) {
          ctx.moveTo(x, normalizedY);
        } else {
          ctx.lineTo(x, normalizedY);
        }
      });
      ctx.stroke();

      // Draw subtle glow gradient under curve
      ctx.lineTo((waveHistoryRef.current.length - 1) * step, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, isCritical ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 240, 255, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, [gForceVal, threatScore]);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyber-border space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyber-cyan border border-cyber-cyan/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">AI THEFT & KINETIC ANOMALY RADAR</h3>
            <p className="text-[11px] text-slate-400 font-mono">Neural Jerk Model & Sensor Fusion</p>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1.5 ${
          threatScore > 70
            ? 'bg-red-500/20 text-cyber-red border-cyber-red animate-pulse'
            : threatScore > 40
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-emerald-500/20 text-cyber-emerald border-emerald-500/40'
        }`}>
          <div className={`w-2 h-2 rounded-full ${threatScore > 70 ? 'bg-red-500' : threatScore > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span>{ai.threatType || (threatScore > 70 ? 'CRITICAL SNATCH' : 'NORMAL')}</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Kinetic G-Force Meter */}
        <div className="bg-[#070e1c] rounded-xl p-3.5 border border-cyber-border/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>KINETIC G-FORCE</span>
            </span>
            <span className="text-[10px] text-slate-500">PEAK: 3.5G</span>
          </div>
          <div className="my-2 flex items-baseline space-x-1">
            <span className={`text-2xl font-bold font-mono ${gForceVal > 2.5 ? 'text-cyber-red' : gForceVal > 1.6 ? 'text-amber-400' : 'text-white'}`}>
              {gForceVal.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">G</span>
            <span className="text-[11px] font-mono text-slate-500 ml-2">
              ({sensors.accelerometer?.magnitude ? sensors.accelerometer.magnitude.toFixed(1) : '9.8'} m/s²)
            </span>
          </div>
          {/* Axis breakdowns */}
          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <div>X: <span className="text-slate-200">{sensors.accelerometer?.x?.toFixed(1) || '0.1'}</span></div>
            <div>Y: <span className="text-slate-200">{sensors.accelerometer?.y?.toFixed(1) || '9.8'}</span></div>
            <div>Z: <span className="text-slate-200">{sensors.accelerometer?.z?.toFixed(1) || '0.2'}</span></div>
          </div>
        </div>

        {/* AI Snatch Probability Gauge */}
        <div className="bg-[#070e1c] rounded-xl p-3.5 border border-cyber-border/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>THEFT PROBABILITY</span>
            </span>
            <span className="text-[10px] text-slate-500">AI SCORE</span>
          </div>
          
          <div className="my-2 flex items-baseline space-x-1">
            <span className={`text-2xl font-bold font-mono ${threatScore > 70 ? 'text-cyber-red' : threatScore > 40 ? 'text-amber-400' : 'text-cyber-emerald'}`}>
              {threatScore}%
            </span>
            <span className="text-xs font-mono text-slate-400 ml-2">
              {threatScore > 70 ? 'HIGH THREAT' : threatScore > 40 ? 'ELEVATED' : 'LOW RISK'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                threatScore > 70 
                  ? 'bg-gradient-to-r from-amber-500 to-cyber-red' 
                  : threatScore > 40 
                  ? 'bg-amber-400' 
                  : 'bg-cyber-emerald'
              }`}
              style={{ width: `${threatScore}%` }}
            />
          </div>
        </div>

        {/* Real-time Waveform Canvas */}
        <div className="bg-[#070e1c] rounded-xl p-3 border border-cyber-border/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center space-x-1">
              <Radar className="w-3 h-3 text-cyber-cyan" />
              <span>LIVE KINETIC WAVE</span>
            </span>
            <span className="text-[9px] text-emerald-400">● 60 FPS</span>
          </div>
          <canvas 
            ref={canvasRef} 
            width={240} 
            height={60} 
            className="w-full h-14 rounded bg-slate-950/60 border border-slate-800"
          />
        </div>

      </div>

      {/* Active Sensor Shields Matrix */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span>AUTONOMOUS SHIELD MATRIX</span>
          <span className="text-cyan-400">4 / 4 OPERATIONAL</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-xs">
              <div className="font-semibold text-slate-200">Pocket Extraction</div>
              <div className="text-[10px] font-mono text-slate-400">Proximity & Light</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-xs">
              <div className="font-semibold text-slate-200">Charger Unplug</div>
              <div className="text-[10px] font-mono text-slate-400">Public Station Lock</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-xs">
              <div className="font-semibold text-slate-200">PIN Intruder AI</div>
              <div className="text-[10px] font-mono text-slate-400">Stealth Selfie Snap</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-xs">
              <div className="font-semibold text-slate-200">Safe Geofence</div>
              <div className="text-[10px] font-mono text-slate-400">GPS Perimeter Watch</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
