/**
 * AetherOS: JWST - Web Audio API Ambient Space Soundscape Engine
 * Generates low-frequency cosmic drone audio for mission control atmosphere.
 */

class SpaceSoundscape {
  private ctx: AudioContext | null = null;
  private subOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;

  public start() {
    if (this.isRunning) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub Bass Oscillator (55Hz A1 cosmic drone)
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.subOsc.connect(subGain);
      subGain.connect(this.masterGain);

      // Harmonic Oscillator (110Hz A2 warm drone)
      this.harmonicOsc = this.ctx.createOscillator();
      this.harmonicOsc.type = 'triangle';
      this.harmonicOsc.frequency.setValueAtTime(110, this.ctx.currentTime);

      const harmonicGain = this.ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(this.masterGain);

      // Cosmic Pink Noise (Subtle background space hiss)
      const bufferSize = this.ctx.sampleRate * 2;
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
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.015; // keep quiet
        b6 = white * 0.115926;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.noiseNode.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      this.subOsc.start();
      this.harmonicOsc.start();
      this.noiseNode.start();
      this.isRunning = true;
    } catch (e) {
      console.warn('AudioContext initialization deferred or unavailable:', e);
    }
  }

  public stop() {
    if (!this.isRunning) return;
    try {
      this.subOsc?.stop();
      this.harmonicOsc?.stop();
      this.noiseNode?.stop();
      this.ctx?.close();
    } catch (e) {
      console.warn('Error closing audio context:', e);
    }
    this.subOsc = null;
    this.harmonicOsc = null;
    this.noiseNode = null;
    this.ctx = null;
    this.isRunning = false;
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public active(): boolean {
    return this.isRunning;
  }
}

export const spaceSoundscape = new SpaceSoundscape();
