/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Procedural Web Audio API sound generator.
 * Zero external mp3/wav files (zero 404 dependencies).
 */
export class DelhiAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted = true;
  private masterGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.createProceduralAmbience();
    } catch {
      // AudioContext not allowed or not supported
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx) {
      if (!muted) {
        this.init();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, this.ctx.currentTime, 0.1);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Generates continuous filtered pink-noise evening breeze ambient wash.
   */
  private createProceduralAmbience() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.02;
      b6 = white * 0.115926;
    }

    this.ambientSource = this.ctx.createBufferSource();
    this.ambientSource.buffer = noiseBuffer;
    this.ambientSource.loop = true;

    // Warm Low-pass filter for evening breeze
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.ambientSource.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientSource.start();
  }

  /**
   * Plays a resonant Indian bronze temple bell (ghanta) harmonic chime.
   */
  public playBellChime(freq = 528) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const partials = [1, 2.02, 2.78, 4.15];
    const gains = [0.45, 0.22, 0.14, 0.08];

    partials.forEach((ratio, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * ratio, now);

      gain.gain.setValueAtTime(gains[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8 - idx * 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 3.0);
    });
  }

  /**
   * Plays a subtle ceremonial bugle / trumpet fanfare note for India Gate / Republic Day.
   */
  public playFanfare() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5

    notes.forEach((freq, i) => {
      const startTime = now + i * 0.14;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }
}

export const audioSynth = new DelhiAudioSynthesizer();
