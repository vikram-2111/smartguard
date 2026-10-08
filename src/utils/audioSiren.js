/**
 * SmartGuard Web Audio API Synthesizer
 * Produces real-time, high-decibel multi-tone defense alarm & sirens directly in the browser
 */

class SirenSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.oscillator1 = null;
    this.oscillator2 = null;
    this.gainNode = null;
    this.modulator = null;
    this.isPlaying = false;
    this.intervalId = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  startSiren(type = 'POLICE') {
    if (this.isPlaying) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // Master Gain & Compressor
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.7, now + 0.1);

      const compressor = this.audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-10, now);
      compressor.knee.setValueAtTime(40, now);
      compressor.ratio.setValueAtTime(12, now);
      compressor.attack.setValueAtTime(0, now);
      compressor.release.setValueAtTime(0.25, now);

      // Primary Oscillator
      this.oscillator1 = this.audioCtx.createOscillator();
      this.oscillator1.type = 'sawtooth';

      // Harmonic Oscillator for harsh piercing presence
      this.oscillator2 = this.audioCtx.createOscillator();
      this.oscillator2.type = 'square';
      this.oscillator2.detune.setValueAtTime(15, now);

      this.oscillator1.connect(this.gainNode);
      this.oscillator2.connect(this.gainNode);
      this.gainNode.connect(compressor);
      compressor.connect(this.audioCtx.destination);

      this.oscillator1.start(now);
      this.oscillator2.start(now);
      this.isPlaying = true;

      // Alternating frequency modulation
      let highTone = false;
      const baseFreq = type === 'HIGH_PITCH' ? 1200 : 800;
      const peakFreq = type === 'HIGH_PITCH' ? 1900 : 1350;

      this.oscillator1.frequency.setValueAtTime(baseFreq, now);
      this.oscillator2.frequency.setValueAtTime(baseFreq * 1.5, now);

      this.intervalId = setInterval(() => {
        if (!this.isPlaying || !this.audioCtx) return;
        const targetFreq = highTone ? peakFreq : baseFreq;
        const curTime = this.audioCtx.currentTime;
        this.oscillator1.frequency.exponentialRampToValueAtTime(targetFreq, curTime + 0.25);
        this.oscillator2.frequency.exponentialRampToValueAtTime(targetFreq * 1.5, curTime + 0.25);
        highTone = !highTone;
      }, 350);

    } catch (err) {
      console.warn('AudioContext start error:', err);
    }
  }

  stopSiren() {
    if (!this.isPlaying) return;
    try {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (this.gainNode && this.audioCtx) {
        const curTime = this.audioCtx.currentTime;
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, curTime + 0.1);
        setTimeout(() => {
          if (this.oscillator1) {
            this.oscillator1.stop();
            this.oscillator1.disconnect();
          }
          if (this.oscillator2) {
            this.oscillator2.stop();
            this.oscillator2.disconnect();
          }
          this.isPlaying = false;
        }, 120);
      } else {
        this.isPlaying = false;
      }
    } catch (err) {
      console.warn('AudioContext stop error:', err);
      this.isPlaying = false;
    }
  }

  playBeep(frequency = 880, duration = 0.15) {
    this.initContext();
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }
}

export const siren = new SirenSynthesizer();
export default siren;
