import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import siren from '../utils/audioSiren';

const SecurityContext = createContext(null);

export function SecurityProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState('SG-PHONE-01');
  const [incidents, setIncidents] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [vault, setVault] = useState(null);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [pairInfo, setPairInfo] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [serverStatus, setServerStatus] = useState('CONNECTING');

  const activeDevice = devices.find(d => d.id === activeDeviceId) || devices[0] || null;

  // Initialize Socket.io and fetch initial state
  useEffect(() => {
    // Socket connection
    const socketUrl = window.location.origin.includes('3000') || window.location.origin.includes('5173')
      ? 'http://localhost:5000'
      : window.location.origin;

    const newSocket = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setServerStatus('ONLINE');
      newSocket.emit('join_dashboard');
    });

    newSocket.on('disconnect', () => {
      setServerStatus('OFFLINE');
    });

    // Real-time telemetry feed
    newSocket.on('telemetry_update', (data) => {
      setDevices(prev => prev.map(dev => {
        if (dev.id === data.deviceId) {
          return {
            ...dev,
            sensors: { ...dev.sensors, ...data.sensors, aiAnalysis: data.motionEvaluation },
            location: data.location || dev.location,
            battery: data.battery !== undefined ? data.battery : dev.battery,
            isCharging: data.isCharging !== undefined ? data.isCharging : dev.isCharging,
            status: data.status || dev.status,
            lastSeen: data.timestamp
          };
        }
        return dev;
      }));
    });

    // Security alert broadcast
    newSocket.on('security_alert', (data) => {
      if (data.incident) {
        setIncidents(prev => [data.incident, ...prev]);
        setActiveAlert(data.incident);
        // Play warning beep
        siren.playBeep(980, 0.3);
      }
    });

    // New incident
    newSocket.on('new_incident', (incident) => {
      setIncidents(prev => [incident, ...prev]);
    });

    // Intruder evidence capture event
    newSocket.on('intruder_captured', (data) => {
      if (data.evidence) {
        setEvidence(prev => [data.evidence, ...prev]);
      }
      if (data.incident) {
        setIncidents(prev => [data.incident, ...prev]);
        setActiveAlert(data.incident);
      }
      siren.playBeep(1200, 0.4);
    });

    // Command dispatch event
    newSocket.on('command_dispatched', (cmd) => {
      if (cmd.command === 'ALARM_START') {
        setIsSirenActive(true);
        siren.startSiren('POLICE');
      } else if (cmd.command === 'ALARM_STOP') {
        setIsSirenActive(false);
        siren.stopSiren();
      } else if (cmd.command === 'LOCK') {
        setDevices(prev => prev.map(d => d.id === cmd.deviceId ? {
          ...d,
          lockdown: { ...d.lockdown, isLocked: true }
        } : d));
      } else if (cmd.command === 'UNLOCK') {
        setDevices(prev => prev.map(d => d.id === cmd.deviceId ? {
          ...d,
          lockdown: { ...d.lockdown, isLocked: false }
        } : d));
      }
    });

    // Vault updates
    newSocket.on('vault_wiped', ({ wiped, incident }) => {
      setVault(wiped);
      if (incident) setIncidents(prev => [incident, ...prev]);
    });

    newSocket.on('vault_reset', (resetData) => {
      setVault(resetData);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch initial REST data
  const refreshData = useCallback(async () => {
    try {
      const [devRes, incRes, evRes, vRes, pairRes] = await Promise.all([
        fetch('/api/devices').then(r => r.json()).catch(() => []),
        fetch('/api/incidents').then(r => r.json()).catch(() => []),
        fetch('/api/evidence').then(r => r.json()).catch(() => []),
        fetch('/api/vault').then(r => r.json()).catch(() => null),
        fetch(`/api/pair-info?deviceId=${activeDeviceId}`).then(r => r.json()).catch(() => null)
      ]);

      if (Array.isArray(devRes) && devRes.length > 0) setDevices(devRes);
      if (Array.isArray(incRes)) setIncidents(incRes);
      if (Array.isArray(evRes)) setEvidence(evRes);
      if (vRes) setVault(vRes);
      if (pairRes) setPairInfo(pairRes);
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  }, [activeDeviceId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Send Remote Command
  const sendCommand = async (command, payload = {}) => {
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: activeDeviceId,
          command,
          payload
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Send command error:', err);
    }
  };

  // Toggle siren
  const toggleSiren = (forceState = null) => {
    const nextState = forceState !== null ? forceState : !isSirenActive;
    setIsSirenActive(nextState);
    if (nextState) {
      siren.startSiren('POLICE');
      sendCommand('ALARM_START');
    } else {
      siren.stopSiren();
      sendCommand('ALARM_STOP');
    }
  };

  // Upload intruder snapshot evidence
  const uploadEvidence = async (photoBase64, triggerType = 'WRONG_PIN_ATTEMPTS', threatScore = 92, metadata = {}) => {
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: activeDeviceId,
          photoBase64,
          triggerType,
          threatScore,
          metadata: {
            ...metadata,
            location: activeDevice?.location
          }
        })
      });
      return await res.json();
    } catch (err) {
      console.error('Evidence upload error:', err);
    }
  };

  // Wipe Vault
  const wipeVault = async (method = 'CRYPTOGRAPHIC_ZEROING') => {
    try {
      const res = await fetch('/api/vault/wipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, deviceId: activeDeviceId })
      });
      const wiped = await res.json();
      setVault(wiped);
      return wiped;
    } catch (err) {
      console.error('Wipe error:', err);
    }
  };

  // Reset Vault
  const resetVault = async () => {
    try {
      const res = await fetch('/api/vault/reset', { method: 'POST' });
      const data = await res.json();
      setVault(data);
      return data;
    } catch (err) {}
  };

  // Update Config
  const updateConfig = async (config) => {
    try {
      const res = await fetch(`/api/devices/${activeDeviceId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const updated = await res.json();
      setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
    } catch (err) {}
  };

  return (
    <SecurityContext.Provider
      value={{
        socket,
        serverStatus,
        devices,
        activeDevice,
        activeDeviceId,
        setActiveDeviceId,
        incidents,
        evidence,
        vault,
        isSirenActive,
        pairInfo,
        activeAlert,
        setActiveAlert,
        sendCommand,
        toggleSiren,
        uploadEvidence,
        wipeVault,
        resetVault,
        updateConfig,
        refreshData
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  return useContext(SecurityContext);
}
