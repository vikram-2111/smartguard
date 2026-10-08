import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  Camera, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Smartphone, 
  Zap, 
  ArrowLeft,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { SensorEngine } from '../utils/sensors';
import { captureIntruderSnapshot } from '../utils/cameraCapture';
import siren from '../utils/audioSiren';

export default function MobileClient({ onBackToDashboard }) {
  const { 
    activeDevice, 
    activeDeviceId, 
    socket, 
    isSirenActive, 
    toggleSiren, 
    uploadEvidence 
  } = useSecurity();

  // Phone states
  const [pin, setPin] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDecoyMode, setIsDecoyMode] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Enter PIN to unlock (Default: 1234)');
  const [isCapturing, setIsCapturing] = useState(false);
  const [recentCapture, setRecentCapture] = useState(null);

  // Local sensor state
  const [sensorData, setSensorData] = useState({
    accelerometer: { x: 0.1, y: 9.8, z: 0.2, magnitude: 9.81 },
    isCharging: false,
    isPocket: false,
    batteryLevel: 87,
    location: { latitude: 12.9716, longitude: 77.5946, address: 'Cubbon Park Road' }
  });

  const sensorEngineRef = useRef(null);
  const isLockedRemotely = activeDevice?.lockdown?.isLocked;
  const isArmed = activeDevice?.status === 'ARMED';

  // Initialize Sensors
  useEffect(() => {
    const engine = new SensorEngine((data) => {
      setSensorData(data);
      // Stream telemetry to backend if socket connected
      if (socket) {
        socket.emit('device_telemetry', {
          deviceId: activeDeviceId,
          sensors: {
            accelerometer: data.accelerometer,
            pocketDetection: data.isPocket ? 'IN_POCKET' : 'REMOVED',
            isCharging: data.isCharging
          },
          location: data.location,
          battery: data.batteryLevel,
          isCharging: data.isCharging
        });
      }
    });

    engine.startListening();
    sensorEngineRef.current = engine;

    return () => {
      engine.stopListening();
    };
  }, [socket, activeDeviceId]);

  // Handle remote commands received over socket
  useEffect(() => {
    if (!socket) return;

    const handleRemoteCmd = async (data) => {
      const { command, payload } = data;
      if (command === 'ALARM_START') {
        setAlarmTriggered(true);
        siren.startSiren('POLICE');
      } else if (command === 'ALARM_STOP') {
        setAlarmTriggered(false);
        siren.stopSiren();
      } else if (command === 'SNAP_PHOTO') {
        await executeStealthCapture('REMOTE_SNAP_DISPATCH');
      } else if (command === 'DECOY_MODE') {
        setIsDecoyMode(!!payload.active);
      }
    };

    socket.on('remote_command', handleRemoteCmd);
    return () => {
      socket.off('remote_command', handleRemoteCmd);
    };
  }, [socket]);

  // Execute stealth intruder photo capture & upload
  const executeStealthCapture = async (reason) => {
    setIsCapturing(true);
    try {
      const result = await captureIntruderSnapshot({
        triggerReason: reason,
        deviceId: activeDeviceId,
        location: sensorData.location
      });

      if (result && result.photoBase64) {
        setRecentCapture(result.photoBase64);
        await uploadEvidence(result.photoBase64, reason, 95, {
          attempts: failedAttempts + 1,
          faceDetected: true,
          faceConfidence: 0.97
        });
      }
    } catch (err) {
      console.error('Stealth capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // PIN keypad handling
  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const verifyPin = async (inputPin) => {
    // 1. Correct PIN (1234)
    if (inputPin === '1234') {
      setIsUnlocked(true);
      setFailedAttempts(0);
      setStatusMessage('Device Unlocked Successfully');
      setAlarmTriggered(false);
      siren.stopSiren();
      return;
    }

    // 2. Decoy / Honeypot PIN (9999)
    if (inputPin === '9999') {
      setIsUnlocked(true);
      setIsDecoyMode(true);
      setStatusMessage('Decoy Mode Active');
      // Silently beacon emergency alert to server
      if (socket) {
        socket.emit('theft_alert', {
          deviceId: activeDeviceId,
          triggerType: 'PANIC_SOS',
          details: { details: 'DURESS CODE ENTERED (9999). Honeypot decoy active while transmitting silent alert!' },
          location: sensorData.location
        });
      }
      return;
    }

    // 3. Wrong PIN
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    setPin('');

    if (nextAttempts >= 3) {
      setStatusMessage(`🚨 3 FAILED PIN ATTEMPTS! INTRUDER EVIDENCE LOGGED`);
      setAlarmTriggered(true);
      siren.startSiren('POLICE');
      await executeStealthCapture('WRONG_PIN_ATTEMPTS');
      
      if (socket) {
        socket.emit('theft_alert', {
          deviceId: activeDeviceId,
          triggerType: 'WRONG_PIN_ATTEMPTS',
          details: { attempts: nextAttempts },
          location: sensorData.location
        });
      }
    } else {
      setStatusMessage(`Incorrect PIN! Attempt ${nextAttempts} of 3.`);
    }
  };

  // Test simulation triggers
  const handleSimulateSnatch = () => {
    if (sensorEngineRef.current) {
      sensorEngineRef.current.simulateSnatch();
      if (isArmed) {
        setAlarmTriggered(true);
        siren.startSiren('POLICE');
        if (socket) {
          socket.emit('theft_alert', {
            deviceId: activeDeviceId,
            triggerType: 'SNATCH_AND_RUN',
            details: { gForce: 3.32 },
            location: sensorData.location
          });
        }
      }
    }
  };

  const handleSimulateChargerUnplug = () => {
    if (sensorEngineRef.current) {
      const isCharging = sensorEngineRef.current.simulateChargerUnplug();
      if (!isCharging && isArmed) {
        setAlarmTriggered(true);
        siren.startSiren('POLICE');
        if (socket) {
          socket.emit('theft_alert', {
            deviceId: activeDeviceId,
            triggerType: 'CHARGER_UNPLUG',
            details: { details: 'Charger pulled out at public charging spot.' },
            location: sensorData.location
          });
        }
      }
    }
  };

  const handleSimulatePocketExtract = () => {
    if (sensorEngineRef.current) {
      const inPocket = sensorEngineRef.current.simulatePocketExtraction();
      if (!inPocket && isArmed) {
        setAlarmTriggered(true);
        siren.startSiren('POLICE');
        if (socket) {
          socket.emit('theft_alert', {
            deviceId: activeDeviceId,
            triggerType: 'POCKET_EXTRACTION',
            details: { details: 'Device extracted from pocket without biometric unlock.' },
            location: sensorData.location
          });
        }
      }
    }
  };

  const handlePanicShake = () => {
    setAlarmTriggered(true);
    siren.startSiren('POLICE');
    if (socket) {
      socket.emit('theft_alert', {
        deviceId: activeDeviceId,
        triggerType: 'PANIC_SOS',
        details: { details: 'Vigorous shake motion panic SOS triggered by user!' },
        location: sensorData.location
      });
    }
  };

  const resetLockState = () => {
    setIsUnlocked(false);
    setIsDecoyMode(false);
    setPin('');
    setFailedAttempts(0);
    setAlarmTriggered(false);
    siren.stopSiren();
    setStatusMessage('Enter PIN to unlock (Default: 1234)');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-cyber-border text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Owner Dashboard</span>
        </button>

        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyber-cyan/30 flex items-center space-x-1.5">
          <Smartphone className="w-4 h-4" />
          <span>RUNNING DEVICE: {activeDeviceId}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* SMARTPHONE DEVICE CHASSIS (Phone Simulator / Mobile View)                  */}
        {/* ========================================================================= */}
        <div className="md:col-span-6 flex justify-center">
          <div className={`relative w-[340px] h-[680px] bg-[#070b14] rounded-[44px] p-3.5 border-4 shadow-2xl transition-all duration-300 ${
            alarmTriggered || isLockedRemotely
              ? 'border-red-500 shadow-red-500/40 animate-pulse'
              : 'border-slate-700 shadow-cyan-500/10'
          }`}>
            
            {/* Speaker & Front Camera Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-5 bg-black rounded-full z-30 flex items-center justify-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-cyan-400/40 relative">
                {isCapturing && (
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Inner Phone Screen */}
            <div className={`w-full h-full rounded-[34px] overflow-hidden flex flex-col justify-between p-5 relative select-none ${
              isLockedRemotely
                ? 'bg-gradient-to-b from-red-950 via-[#180509] to-black text-white'
                : alarmTriggered
                ? 'bg-gradient-to-b from-[#24060b] via-[#100408] to-black text-white'
                : 'bg-gradient-to-b from-[#0a1426] via-[#050a14] to-black text-white'
            }`}>
              
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pt-3 z-20">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex items-center space-x-2">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="flex items-center space-x-1">
                    {sensorData.isCharging ? (
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Battery className="w-3.5 h-3.5 text-slate-300" />
                    )}
                    <span>{sensorData.batteryLevel}%</span>
                  </span>
                </div>
              </div>

              {/* SCREEN CONTENT BASED ON STATE */}

              {/* 1. REMOTE LOCKDOWN OVERLAY */}
              {isLockedRemotely ? (
                <div className="my-auto text-center space-y-4 z-20">
                  <div className="w-16 h-16 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center mx-auto animate-bounce text-red-400">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-mono text-lg font-bold text-red-400">DEVICE LOCKED</h3>
                    <p className="text-[11px] text-slate-300 mt-2 leading-relaxed px-2">
                      {activeDevice?.lockdown?.message || 'THIS PHONE IS REPORTED STOLEN. LIVE GPS BEACON IS TRANSMITTING TO POLICE & OWNER.'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs font-mono text-red-200">
                    OWNER EMERGENCY PHONE:<br />
                    <span className="font-bold text-white text-sm">
                      {activeDevice?.lockdown?.contactPhone || '+1 (555) 019-9022'}
                    </span>
                  </div>
                </div>
              ) : isUnlocked ? (
                // 2. UNLOCKED VIEW (Normal or Decoy Honeypot)
                <div className="my-auto text-center space-y-5 z-20">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border ${
                    isDecoyMode 
                      ? 'bg-purple-950/50 border-purple-500 text-purple-400' 
                      : 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                  }`}>
                    {isDecoyMode ? <Zap className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                  </div>

                  <div>
                    <h3 className="font-mono text-base font-bold text-white">
                      {isDecoyMode ? 'HONEYPOT DECOY PHONE' : 'AUTHENTICATED OWNER'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isDecoyMode
                        ? 'Dummy decoy state active. Silent SOS beacon broadcasted!'
                        : 'Biometric & PIN authorized. All systems normal.'}
                    </p>
                  </div>

                  {/* Dummy Decoy App Icons */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-800 text-[10px] font-mono text-slate-300">
                    <div className="p-2 rounded-xl bg-slate-800 flex flex-col items-center">
                      <Smartphone className="w-5 h-5 text-cyan-400 mb-1" />
                      <span>Phone</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800 flex flex-col items-center">
                      <Camera className="w-5 h-5 text-amber-400 mb-1" />
                      <span>Photos (0)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800 flex flex-col items-center">
                      <Lock className="w-5 h-5 text-emerald-400 mb-1" />
                      <span>Vault</span>
                    </div>
                  </div>

                  <button
                    onClick={resetLockState}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center space-x-1.5 mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Lock Device Again</span>
                  </button>
                </div>
              ) : (
                // 3. SECURE LOCKSCREEN & PIN KEYPAD
                <div className="flex flex-col justify-between h-full pt-6 pb-2 z-20">
                  
                  {/* Top clock & status */}
                  <div className="text-center space-y-1">
                    <div className="text-3xl font-tech font-bold text-white">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 flex items-center justify-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>SMARTGUARD SHIELDS ACTIVE</span>
                    </div>

                    <div className={`text-[10px] font-mono px-2 py-0.5 rounded mt-2 ${
                      failedAttempts > 0 ? 'text-red-400 bg-red-950/60 font-bold' : 'text-slate-400'
                    }`}>
                      {statusMessage}
                    </div>

                    {/* PIN Dots */}
                    <div className="flex justify-center space-x-3 pt-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-full border transition-all ${
                            idx < pin.length
                              ? 'bg-cyan-400 border-cyan-300 scale-110 shadow-sm shadow-cyan-400'
                              : 'bg-transparent border-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 10-Digit Cyber Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-2 px-3 my-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                      <button
                        key={digit}
                        onClick={() => handleDigit(digit.toString())}
                        className="h-12 rounded-2xl bg-slate-900/80 hover:bg-cyan-950/60 active:scale-95 border border-slate-800 hover:border-cyan-500/40 text-base font-mono font-semibold text-white transition-all flex items-center justify-center shadow"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      onClick={handleClear}
                      className="h-12 rounded-2xl bg-slate-900/80 hover:bg-red-950/50 active:scale-95 border border-slate-800 text-xs font-mono text-red-400 transition-all flex items-center justify-center"
                    >
                      CLEAR
                    </button>
                    <button
                      onClick={() => handleDigit('0')}
                      className="h-12 rounded-2xl bg-slate-900/80 hover:bg-cyan-950/60 active:scale-95 border border-slate-800 text-base font-mono font-semibold text-white transition-all flex items-center justify-center"
                    >
                      0
                    </button>
                    <button
                      onClick={() => verifyPin(pin)}
                      className="h-12 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 border border-cyan-500/50 text-xs font-mono font-bold text-cyber-cyan transition-all flex items-center justify-center"
                    >
                      OK
                    </button>
                  </div>

                  {/* Lockscreen footer */}
                  <div className="text-center text-[10px] font-mono text-slate-500">
                    PIN: <span className="text-cyan-400">1234</span> | Decoy: <span className="text-purple-400">9999</span>
                  </div>

                </div>
              )}

              {/* Siren Alarm Flashing Ribbon if sounding */}
              {alarmTriggered && (
                <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] pointer-events-none border-4 border-red-500 animate-strobe flex items-center justify-center z-40">
                  <div className="bg-red-950/90 border border-red-500 px-4 py-2 rounded-xl text-center shadow-xl">
                    <div className="text-red-400 font-mono font-bold text-xs animate-bounce">
                      🚨 ANTI-THEFT SIREN ACTIVE
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE SENSOR TEST LAB (Right Side Column)                            */}
        {/* ========================================================================= */}
        <div className="md:col-span-6 space-y-4">
          
          <div className="glass-panel rounded-2xl p-5 border border-cyber-border space-y-4">
            
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyber-cyan border border-cyber-cyan/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm tracking-wide">HARDWARE SENSOR & THEFT TEST LAB</h3>
                <p className="text-[11px] text-slate-400 font-mono">Test physical triggers or simulate them instantly</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If running on a mobile phone via Wi-Fi, real hardware sensors are reading continuously. You can also trigger the security tests below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* 1. Simulate Violent Snatch */}
              <button
                onClick={handleSimulateSnatch}
                className="p-3.5 rounded-xl bg-[#070e1c] border border-cyber-border hover:border-cyber-red text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-white group-hover:text-cyber-red">
                    💥 Snatch-and-Run
                  </span>
                  <span className="text-[10px] font-mono text-red-400 bg-red-950 px-1.5 py-0.5 rounded">3.3G</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Generates violent kinetic jerk. Triggers siren & camera if armed.
                </p>
              </button>

              {/* 2. Simulate Charger Unplug */}
              <button
                onClick={handleSimulateChargerUnplug}
                className="p-3.5 rounded-xl bg-[#070e1c] border border-cyber-border hover:border-amber-400 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-white group-hover:text-amber-400">
                    ⚡ Charger Unplug
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">
                    {sensorData.isCharging ? 'PLUGGED' : 'UNPLUGGED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Simulates cord disconnect at coffee shop or airport station.
                </p>
              </button>

              {/* 3. Simulate Pocket Extraction */}
              <button
                onClick={handleSimulatePocketExtract}
                className="p-3.5 rounded-xl bg-[#070e1c] border border-cyber-border hover:border-cyan-400 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-white group-hover:text-cyan-400">
                    👖 Pocket Removal
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">
                    {sensorData.isPocket ? 'IN POCKET' : 'REMOVED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pickpocket detection using vertical velocity & light changes.
                </p>
              </button>

              {/* 4. Panic Shake SOS */}
              <button
                onClick={handlePanicShake}
                className="p-3.5 rounded-xl bg-[#070e1c] border border-cyber-border hover:border-red-500 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-white group-hover:text-red-400">
                    🆘 Panic SOS Shake
                  </span>
                  <span className="text-[10px] font-mono text-red-400 bg-red-950 px-1.5 py-0.5 rounded">EMERGENCY</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Vigorous physical shake activates silent distress beacon.
                </p>
              </button>

            </div>

            {/* Live Sensor Telemetry readout */}
            <div className="bg-[#070e1c] p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="text-slate-400 text-[10px] flex items-center justify-between">
                <span>DEVICE SENSOR TELEMETRY READOUT</span>
                <span className="text-emerald-400">LIVE FEED</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
                <div>Acceleration: <span className="text-cyan-400">{sensorData.accelerometer.magnitude.toFixed(2)} m/s²</span></div>
                <div>Battery Level: <span className="text-cyan-400">{sensorData.batteryLevel}%</span></div>
                <div>Power Cable: <span className={sensorData.isCharging ? 'text-emerald-400' : 'text-slate-400'}>{sensorData.isCharging ? 'Connected' : 'Disconnected'}</span></div>
                <div>Pocket Sensor: <span className="text-cyan-400">{sensorData.isPocket ? 'Covered' : 'Exposed'}</span></div>
              </div>
            </div>

            {/* Siren toggle on phone */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">LOCAL PHONE SIREN AUDIO:</span>
              <button
                onClick={() => {
                  if (alarmTriggered) {
                    setAlarmTriggered(false);
                    siren.stopSiren();
                  } else {
                    setAlarmTriggered(true);
                    siren.startSiren('POLICE');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                  alarmTriggered
                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {alarmTriggered ? 'SILENCE PHONE ALARM' : 'TEST SIREN AUDIO'}
              </button>
            </div>

          </div>

          {/* Biometric Snapshot Preview if recently snapped */}
          {recentCapture && (
            <div className="glass-panel rounded-2xl p-4 border border-cyber-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center space-x-1.5 text-cyan-400">
                  <Camera className="w-4 h-4" />
                  <span className="font-bold">RECENT INTRUDER SELFIE EVIDENCE</span>
                </span>
                <span className="text-[10px] text-red-400 bg-red-950 px-1.5 py-0.5 rounded">UPLOADED TO VAULT</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-cyber-border/80 max-h-48 flex justify-center bg-black">
                <img src={recentCapture} alt="Recent Intruder Capture" className="h-48 object-contain" />
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
