import React, { useState } from 'react';
import { 
  History, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  MapPin, 
  Clock, 
  Filter
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function IncidentLog() {
  const { incidents } = useSecurity();
  const [filter, setFilter] = useState('ALL');

  const filteredIncidents = incidents.filter(item => {
    if (filter === 'CRITICAL') return item.severity === 'CRITICAL';
    if (filter === 'HIGH') return item.severity === 'HIGH';
    if (filter === 'INFO') return item.severity === 'INFO' || item.severity === 'MEDIUM';
    return true;
  });

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyber-border space-y-4">
      
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyber-cyan border border-cyber-cyan/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">INCIDENT AUDIT LOG</h3>
            <p className="text-[11px] text-slate-400 font-mono">Real-Time Threat History & Forensic Trail</p>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex bg-[#070e1c] p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {['ALL', 'CRITICAL', 'HIGH', 'INFO'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === tab
                  ? 'bg-cyan-500/20 text-cyber-cyan border border-cyber-cyan/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Incident Stream */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {filteredIncidents.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500">
            No incident records found matching current filter.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isCrit = inc.severity === 'CRITICAL';
            const isHigh = inc.severity === 'HIGH';

            return (
              <div
                key={inc.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isCrit
                    ? 'bg-red-950/20 border-red-500/40 hover:border-red-500'
                    : isHigh
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                    : 'bg-[#070e1c] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    isCrit ? 'bg-red-500/20 text-cyber-red' : isHigh ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {isCrit ? <ShieldAlert className="w-4 h-4" /> : isHigh ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-white tracking-wide">{inc.title}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        isCrit ? 'bg-red-900 text-red-200' : isHigh ? 'bg-amber-900 text-amber-200' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {inc.details}
                    </p>
                    {inc.location && inc.location.address && (
                      <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono mt-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>{inc.location.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between text-[10px] font-mono text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </span>
                  <span className="text-slate-600 sm:mt-1">{inc.id}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
