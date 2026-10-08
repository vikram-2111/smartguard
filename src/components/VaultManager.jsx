import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Lock, 
  Key, 
  FileText, 
  CreditCard, 
  Users, 
  RotateCcw, 
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function VaultManager() {
  const { vault, wipeVault, resetVault } = useSecurity();
  const [isWiping, setIsWiping] = useState(false);
  const [wipeStep, setWipeStep] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const isWiped = vault?.isWiped;

  const handleExecuteWipe = async () => {
    setIsWiping(true);
    setShowConfirm(false);

    // Realistic military wipe sequence steps
    setWipeStep('INITIALIZING CRYPTOGRAPHIC PURGE DAEMON...');
    await new Promise(r => setTimeout(r, 600));

    setWipeStep('DISMOUNTING ENCRYPTED STORAGE PARTITIONS...');
    await new Promise(r => setTimeout(r, 600));

    setWipeStep('EXECUTING DoD 5220.22-M PSEUDO-RANDOM BIT OVERWRITE (PASS 1/3)...');
    await new Promise(r => setTimeout(r, 700));

    setWipeStep('ZERO-FILLING NAND FLASH SOLID-STATE BLOCKS (PASS 2/3)...');
    await new Promise(r => setTimeout(r, 700));

    setWipeStep('DESTROYING HARDWARE MASTER ENCRYPTION KEYS (PASS 3/3)...');
    await new Promise(r => setTimeout(r, 600));

    await wipeVault('CRYPTOGRAPHIC_ZEROING_DOD_5220');
    setWipeStep('PURGE COMPLETE: ALL SENSITIVE DATA PERMANENTLY DESTROYED.');
    await new Promise(r => setTimeout(r, 900));
    setIsWiping(false);
  };

  const handleReset = async () => {
    await resetVault();
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyber-border space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyber-cyan border border-cyber-cyan/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">SECURE DATA VAULT & AUTONOMOUS WIPE</h3>
            <p className="text-[11px] text-slate-400 font-mono">Hardware-Encrypted Storage Guardian</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isWiped ? (
            <div className="px-3 py-1 rounded-full bg-red-950/80 border border-red-500 text-red-300 text-xs font-mono font-bold flex items-center space-x-1.5 animate-pulse">
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>VAULT PURGED (SECURE ZEROED)</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256 ENCRYPTED & PROTECTED</span>
            </div>
          )}

          {isWiped ? (
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyber-cyan border border-cyber-cyan/40 rounded-lg text-xs font-mono flex items-center space-x-1 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Mock Vault</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-cyber-red border border-red-500/40 rounded-lg text-xs font-mono flex items-center space-x-1 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Simulate Remote Wipe</span>
            </button>
          )}
        </div>
      </div>

      {/* Wipe Animation Progress Overlay */}
      {isWiping && (
        <div className="p-4 rounded-xl bg-red-950/90 border border-red-500 space-y-3">
          <div className="flex items-center space-x-2 text-red-300 font-mono text-xs font-bold animate-pulse">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>MILITARY-GRADE SANITIZATION IN PROGRESS</span>
          </div>
          <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 animate-pulse w-full" />
          </div>
          <p className="text-[11px] font-mono text-red-200">{wipeStep}</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel-danger rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-cyber-red">
              <AlertOctagon className="w-7 h-7" />
              <h4 className="font-mono text-base font-bold text-white">CONFIRM REMOTE CRYPTOGRAPHIC WIPE</h4>
            </div>
            <p className="text-xs text-slate-300">
              This action simulates emergency cryptographic sector zero-overwriting. All stored passwords, contacts, banking tokens, and private notes will be permanently destroyed to prevent physical data theft.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteWipe}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-mono font-bold hover:bg-red-700 shadow-lg shadow-red-500/30"
              >
                EXECUTE PURGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault Contents Display */}
      {isWiped ? (
        <div className="rounded-xl border border-red-900/50 bg-[#140608] p-6 text-center space-y-2">
          <Trash2 className="w-8 h-8 text-red-500 mx-auto" />
          <h4 className="font-mono text-sm font-bold text-red-300">VAULT PURGED: ZERO DATA LEAKAGE</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All user data, cryptographic seeds, and banking keys have been zeroed.
          </p>
          {vault?.auditChecksum && (
            <div className="text-[10px] font-mono text-slate-500 truncate max-w-sm mx-auto pt-2">
              Audit Checksum: {vault.auditChecksum}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* 1. Sensitive Notes & Seeds */}
          <div className="bg-[#070e1c] rounded-xl p-3.5 border border-cyber-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">Confidential Notes</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">ENCRYPTED</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {(vault?.notes || []).map((note) => (
                <div key={note.id} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
                  <div className="text-slate-200 font-semibold truncate">{note.title}</div>
                  <div className="text-slate-400 text-[10px] truncate mt-0.5">{note.content}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Payment Cards & Tokens */}
          <div className="bg-[#070e1c] rounded-xl p-3.5 border border-cyber-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">Protected Cards</span>
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">TOKENIZED</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {(vault?.cards || []).map((card) => (
                <div key={card.id} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 font-semibold">{card.bank}</div>
                    <div className="text-slate-400 text-[10px]">•••• •••• •••• {card.last4}</div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">{card.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Emergency Contacts */}
          <div className="bg-[#070e1c] rounded-xl p-3.5 border border-cyber-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold">Emergency Contacts</span>
              </span>
              <span className="text-[10px] text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded">3 ENTRIES</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {(vault?.contacts || []).map((c) => (
                <div key={c.id} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 font-semibold">{c.name}</div>
                    <div className="text-slate-400 text-[10px]">{c.relationship}</div>
                  </div>
                  <span className="text-[10px] text-slate-400">{c.phone}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
