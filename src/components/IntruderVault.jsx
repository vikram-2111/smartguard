import React, { useState } from 'react';
import { 
  Camera, 
  Eye, 
  MapPin, 
  Calendar, 
  ShieldAlert, 
  UserX, 
  Maximize2, 
  X,
  Sparkles
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function IntruderVault({ onTriggerCapture }) {
  const { evidence } = useSecurity();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyber-border space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyber-cyan border border-cyber-cyan/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">AI INTRUDER EVIDENCE VAULT</h3>
            <p className="text-[11px] text-slate-400 font-mono">Biometric Face Recognition & Capture Logs</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {evidence.length} EVIDENCE RECORDS
          </span>
          <button
            onClick={onTriggerCapture}
            className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyber-cyan border border-cyber-cyan/40 rounded-lg text-xs font-mono flex items-center space-x-1 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Capture</span>
          </button>
        </div>
      </div>

      {/* Grid of Evidence Photos */}
      {evidence.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-[#070e1c]">
          <UserX className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No Intruder Events Recorded Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When an unauthorized user attempts 3 wrong PINs or the theft trigger fires, a stealth front-camera photograph will be logged here.
          </p>
          <button
            onClick={onTriggerCapture}
            className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyber-cyan border border-cyber-cyan/40 text-xs font-mono hover:bg-cyan-500/30 transition-all"
          >
            Trigger Test Biometric Selfie Capture
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {evidence.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group bg-[#070e1c] rounded-xl overflow-hidden border border-cyber-border/80 hover:border-cyan-400/50 cursor-pointer transition-all flex flex-col justify-between"
            >
              {/* Photo Preview Container */}
              <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt="Intruder Snapshot"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Forensic Overlay Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] font-mono flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>THREAT: {item.threatScore || 92}%</span>
                </div>

                <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3 space-y-1.5 text-xs font-mono">
                <div className="text-white font-semibold truncate">
                  {item.triggerType?.replace(/_/g, ' ') || 'UNAUTHORIZED ACCESS'}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </span>
                  <span className="text-cyan-400 font-semibold">
                    Face Conf: {Math.round((item.faceConfidence || 0.96) * 100)}%
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Forensic Inspection Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel rounded-2xl max-w-2xl w-full border border-cyber-border overflow-hidden shadow-2xl">
            
            <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-[#070e1c]">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h4 className="font-mono text-sm font-bold text-white tracking-wide">
                  FORENSIC BIOMETRIC EVIDENCE // {selectedPhoto.id}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-cyber-border bg-black max-h-96 flex items-center justify-center">
                <img
                  src={selectedPhoto.imageUrl}
                  alt="Full Intruder Snapshot"
                  className="max-h-96 w-auto object-contain"
                />
              </div>

              {/* Forensic Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#070e1c] p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">TRIGGER EVENT:</span>
                  <div className="text-white font-semibold mt-0.5">{selectedPhoto.triggerType}</div>
                </div>
                <div>
                  <span className="text-slate-400">THREAT SCORE:</span>
                  <div className="text-cyber-red font-semibold mt-0.5">{selectedPhoto.threatScore || 92}% (CRITICAL)</div>
                </div>
                <div>
                  <span className="text-slate-400">TIMESTAMP:</span>
                  <div className="text-slate-200 mt-0.5">{new Date(selectedPhoto.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-400">BIOMETRICS:</span>
                  <div className="text-cyan-400 mt-0.5">Face Detected (Match: {Math.round((selectedPhoto.faceConfidence || 0.96) * 100)}%)</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-cyber-border bg-[#070e1c] flex justify-end">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-mono font-semibold"
              >
                Close Evidence Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
