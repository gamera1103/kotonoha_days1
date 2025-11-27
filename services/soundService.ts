
// Web Audio API Synthesizer & Sequencer
// Features: 4-track sequencer (Kick, Snare, HiHat, Synth), Master/BGM/SFX Volume control.
// Updated: 8 Bars (128 steps), Theme support.

export class SoundService {
  private audioCtx: AudioContext | null = null;
  
  // Volume Nodes
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Volumes (0.0 - 1.0)
  private _masterVol: number = 0.5;
  private _bgmVol: number = 0.5;
  private _sfxVol: number = 0.5;

  // BGM State
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private tempo: number = 124; 
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s

  // Sequencer Patterns (8 bars = 128 steps of 16th notes)
  private SEQUENCE_LENGTH = 128;
  
  private KICK_PATTERN: number[] = [];
  private SNARE_PATTERN: number[] = [];
  private HIHAT_PATTERN: number[] = [];
  private BASS_LINE: number[] = [];
  private MELODY_LINE: number[] = [];
  
  private currentTheme: 'happy' | 'calm' | 'tense' | 'melancholy' = 'happy';

  private NOTES = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
  };

  constructor() {
    this.generatePatterns('happy');
  }

  // --- Pattern Generation ---
  private generatePatterns(theme: 'happy' | 'calm' | 'tense' | 'melancholy') {
    this.currentTheme = theme;
    this.KICK_PATTERN = new Array(this.SEQUENCE_LENGTH).fill(0);
    this.SNARE_PATTERN = new Array(this.SEQUENCE_LENGTH).fill(0);
    this.HIHAT_PATTERN = new Array(this.SEQUENCE_LENGTH).fill(0);
    this.BASS_LINE = new Array(this.SEQUENCE_LENGTH).fill(0);
    this.MELODY_LINE = new Array(this.SEQUENCE_LENGTH).fill(0);

    const scale = theme === 'melancholy' || theme === 'tense' 
      ? [this.NOTES.A4, this.NOTES.C5, this.NOTES.D5, this.NOTES.E5, this.NOTES.G5] // Minorish
      : [this.NOTES.C5, this.NOTES.D5, this.NOTES.E5, this.NOTES.G5, this.NOTES.A5]; // Major

    for (let i = 0; i < this.SEQUENCE_LENGTH; i++) {
      const bar = Math.floor(i / 16);
      const stepInBar = i % 16;
      
      // Rhythm
      if (theme === 'happy' || theme === 'tense') {
          if (stepInBar % 4 === 0) this.KICK_PATTERN[i] = 1; // 4-on-floor
          if (stepInBar === 4 || stepInBar === 12) this.SNARE_PATTERN[i] = 1;
          if (stepInBar % 2 === 0) this.HIHAT_PATTERN[i] = 1;
      } else {
          // Calm / Melancholy - Slower feel
          if (stepInBar === 0) this.KICK_PATTERN[i] = 1;
          if (stepInBar === 8) this.SNARE_PATTERN[i] = 1;
          if (stepInBar % 4 === 0) this.HIHAT_PATTERN[i] = 1;
      }

      // Bass (Root notes progression)
      // Happy: C - G - Am - F (I-V-vi-IV)
      // Calm: F - G - Em - Am (IV-V-iii-vi)
      let bassFreq = 0;
      if (stepInBar === 0 || stepInBar === 10) {
        if (theme === 'happy') {
           if (bar % 4 === 0) bassFreq = this.NOTES.C3;
           else if (bar % 4 === 1) bassFreq = this.NOTES.G3;
           else if (bar % 4 === 2) bassFreq = this.NOTES.A3;
           else if (bar % 4 === 3) bassFreq = this.NOTES.F3;
        } else if (theme === 'calm') {
           if (bar % 4 === 0) bassFreq = this.NOTES.F3;
           else if (bar % 4 === 1) bassFreq = this.NOTES.G3;
           else if (bar % 4 === 2) bassFreq = this.NOTES.E3;
           else if (bar % 4 === 3) bassFreq = this.NOTES.A3;
        }
      }
      this.BASS_LINE[i] = bassFreq;

      // Melody
      if (stepInBar % 2 === 0 && Math.random() > 0.4) {
         // Add some rests
         const note = scale[Math.floor(Math.random() * scale.length)];
         this.MELODY_LINE[i] = note;
      }
    }
  }

  private initCtx() {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = this._masterVol;
        this.masterGain.connect(this.audioCtx.destination);
        this.bgmGain = this.audioCtx.createGain();
        this.bgmGain.gain.value = this._bgmVol;
        this.bgmGain.connect(this.masterGain);
        this.sfxGain = this.audioCtx.createGain();
        this.sfxGain.gain.value = this._sfxVol;
        this.sfxGain.connect(this.masterGain);
      } catch (e) {
        console.warn("Web Audio API not supported");
      }
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // --- Volume Control ---
  setVolumes(bgm: number, sfx: number) {
    this._bgmVol = Math.max(0, Math.min(1, bgm));
    this._sfxVol = Math.max(0, Math.min(1, sfx));
    if (this.bgmGain) this.bgmGain.gain.setTargetAtTime(this._bgmVol, this.audioCtx?.currentTime || 0, 0.1);
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this._sfxVol, this.audioCtx?.currentTime || 0, 0.1);
  }

  // --- Sequencer Logic ---

  startBGM(theme: 'happy' | 'calm' | 'tense' | 'melancholy' = 'happy') {
    this.initCtx();
    if (this.currentTheme !== theme) {
        this.generatePatterns(theme);
    }
    
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    if (this.audioCtx) {
      this.nextNoteTime = this.audioCtx.currentTime;
      this.scheduler();
    }
  }

  stopBGM() {
    this.isPlaying = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduler() {
    if (!this.audioCtx) return;
    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.nextNote();
    }
    if (this.isPlaying) {
      this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.currentStep = (this.currentStep + 1) % this.SEQUENCE_LENGTH;
  }

  private scheduleNote(stepIndex: number, time: number) {
    if (this.KICK_PATTERN[stepIndex]) this.playKick(time);
    if (this.SNARE_PATTERN[stepIndex]) this.playSnare(time);
    if (this.HIHAT_PATTERN[stepIndex]) this.playHiHat(time);

    const bassFreq = this.BASS_LINE[stepIndex];
    if (bassFreq) this.playBass(bassFreq, time, 0.2);

    const melFreq = this.MELODY_LINE[stepIndex];
    if (melFreq) this.playSynth(melFreq, time, 0.1);
  }

  // --- Synthesizers ---
  private playKick(time: number) {
    if (!this.audioCtx || !this.bgmGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number) {
    if (!this.audioCtx || !this.bgmGain) return;
    const bufferSize = this.audioCtx.sampleRate * 0.1; 
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(this.bgmGain);
    noise.start(time);
  }

  private playHiHat(time: number) {
    if (!this.audioCtx || !this.bgmGain) return;
    const bufferSize = this.audioCtx.sampleRate * 0.05;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    source.start(time);
  }

  private playBass(freq: number, time: number, duration: number) {
    if (!this.audioCtx || !this.bgmGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  private playSynth(freq: number, time: number, duration: number) {
    if (!this.audioCtx || !this.bgmGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.linearRampToValueAtTime(0.0, time + duration);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  // --- SFX (One-shots) ---
  playConfirm() { this.initCtx(); this.playTone(880, 'sine', 0.1); }
  playCancel() { this.initCtx(); this.playTone(300, 'square', 0.1); }
  playCardDraw() { this.initCtx(); this.playNoise(0.05); }
  playPositive() { this.initCtx(); this.playTone(523.25, 'sine', 0.1, 0); this.playTone(659.25, 'sine', 0.1, 0.1); this.playTone(783.99, 'sine', 0.2, 0.2); }
  playNegative() { this.initCtx(); this.playTone(150, 'sawtooth', 0.3); }

  private playTone(freq: number, type: OscillatorType, duration: number, delay: number = 0) {
    if (!this.audioCtx || !this.sfxGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(this.audioCtx.currentTime + delay);
    osc.stop(this.audioCtx.currentTime + delay + duration);
  }

  private playNoise(duration: number) {
    if (!this.audioCtx || !this.sfxGain) return;
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
    noise.connect(gain);
    gain.connect(this.sfxGain);
    noise.start();
  }
}

export const soundService = new SoundService();
