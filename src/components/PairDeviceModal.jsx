import React, { useState } from 'react';
import { 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Wifi, 
  Radio
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export default function PairDeviceModal({ isOpen, onClose }) {
  const { pairInfo, activeDeviceId } = useSecurity();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const url = pairInfo?.mobileUrl || `${window.location.origin}/?mode=mobile&deviceId=${activeDeviceId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLocal = () => {
    window.open(`/?mode=mobile&deviceId=${activeDeviceId}`, '_blank', 'width=420,height=840');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel rounded-2xl max-w-md w-full border border-cyber-border overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-[#070e1c]">
          <div className="flex items-center space-x-2 text-cyan-400">
            <QrCode className="w-5 h-5" />
            <h4 className="font-mono text-sm font-bold text-white tracking-wide">
              PAIR PHYSICAL SMARTPHONE
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          
          <p className="text-xs text-slate-300 leading-relaxed">
            Scan this QR code with your smartphone camera (connected to the same Wi-Fi) to run the 
            <span className="text-cyan-400 font-bold"> SmartGuard Mobile Defense Agent</span> with real hardware sensors!
          </p>

          {/* QR Code Container */}
          <div className="p-4 bg-slate-950 rounded-2xl inline-block border border-cyber-border shadow-inner">
            {pairInfo?.qrCode ? (
              <img
                src={pairInfo.qrCode}
                alt="Mobile Pairing QR Code"
                className="w-56 h-56 rounded-xl mx-auto"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-500 font-mono text-xs">
                Generating QR Code...
              </div>
            )}
          </div>

          {/* URL Display & Copy */}
          <div className="flex items-center space-x-2 bg-[#070e1c] p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 truncate flex-1 text-left px-2">
              {url}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyber-cyan border border-cyber-cyan/30 text-xs font-mono transition-all shrink-0"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick simulator alternative */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Testing on this computer?</span>
            <button
              onClick={handleOpenLocal}
              className="text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>Open Phone Popup</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
