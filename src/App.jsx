import React, { useState, useEffect } from 'react';
import { SecurityProvider } from './context/SecurityContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MobileClient from './components/MobileClient';
import PairDeviceModal from './components/PairDeviceModal';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);

  // Check URL query param ?mode=mobile (e.g. from QR code scan on real phone)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'mobile') {
      setCurrentView('mobile');
    }
  }, []);

  return (
    <div className="min-h-screen cyber-grid flex flex-col justify-between">
      <div>
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenPairModal={() => setIsPairModalOpen(true)}
        />

        <main className="pb-12">
          {currentView === 'dashboard' ? (
            <Dashboard />
          ) : (
            <MobileClient onBackToDashboard={() => setCurrentView('dashboard')} />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-cyber-border/80 bg-[#050a14]/90 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>SmartGuard AI • Next-Gen Mobile Theft Prevention & Autonomous Data Protection</span>
          </div>
          <div>
            Built with WebSockets, Leaflet GPS, Web Audio Synthesizer & Biometric Face AI
          </div>
        </div>
      </footer>

      {/* Pair QR Modal */}
      <PairDeviceModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <SecurityProvider>
      <AppContent />
    </SecurityProvider>
  );
}
