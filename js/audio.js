/**
 * NAVI // PARTITION.SYS - PROCEDURAL WEB AUDIO SYNTHESIZER
 * Synthesizes mechanical HDD seeks, fan hum, circuit breaker trips, PC beeps & cyber ambient.
 */

class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Persistent audio nodes
    this.fanGain = null;
    this.fanFilter = null;
    this.ambientGain = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.isInitialized = true;
      this.setupContinuousSounds();
    } catch (e) {
      console.warn("Web Audio API niedostępne:", e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.fanGain && this.ctx) {
      this.fanGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.03, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  setupContinuousSounds() {
    if (!this.ctx) return;

    // 1. Fan noise generator (Pink-ish filtered noise buffer)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.15;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.fanFilter = this.ctx.createBiquadFilter();
    this.fanFilter.type = 'lowpass';
    this.fanFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.fanGain = this.ctx.createGain();
    this.fanGain.gain.setValueAtTime(this.isMuted ? 0 : 0.03, this.ctx.currentTime);

    whiteNoise.connect(this.fanFilter);
    this.fanFilter.connect(this.fanGain);
    this.fanGain.connect(this.ctx.destination);
    whiteNoise.start();

    // 2. Ambient Cyber Drone (Sub-bass layered sines)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 harmonic

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.02, this.ctx.currentTime);

    const ambientFilter = this.ctx.createBiquadFilter();
    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

    osc1.connect(ambientFilter);
    osc2.connect(ambientFilter);
    ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
  }

  updateFanSpeed(loadFraction, temp) {
    if (!this.ctx || this.isMuted || !this.fanFilter || !this.fanGain) return;
    const targetFreq = 300 + (loadFraction * 400) + (temp > 35 ? (temp - 35) * 40 : 0);
    const targetGain = 0.02 + (loadFraction * 0.05);
    this.fanFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);
    this.fanGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
  }

  // Mechanical HDD head seek / chatter effect
  playHddSeek(intensity = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const delay = i * 0.035 + (Math.random() * 0.015);
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 + Math.random() * 1200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.02);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(3, now);

        gain.gain.setValueAtTime(0.06 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.03);
      }, delay * 1000);
    }
  }

  // Circuit breaker fuse trip (Heavy relay CLACK-POP)
  playFuseTrip() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Low thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    // Spark pop
    const bufferSize = this.ctx.sampleRate * 0.05;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  // PC Speaker Beep
  playBeep(freq = 880, duration = 0.1, type = 'sine') {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // UI Key Clack
  playClick() {
    this.playBeep(1200 + Math.random() * 400, 0.02, 'triangle');
  }

  // Alert alarm beep
  playAlert() {
    this.playBeep(440, 0.1, 'square');
    setTimeout(() => this.playBeep(880, 0.15, 'square'), 120);
  }
}

// Global audio singleton
window.audioEngine = new RetroAudioEngine();
