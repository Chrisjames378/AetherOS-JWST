class CosmicSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private active = false;
  private nodes: { stop: () => void }[] = [];

  private init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.0001;
    this.masterGain.connect(this.ctx.destination);
  }

  public setSound(enabled: boolean): boolean {
    this.init();
    if (!this.ctx || !this.masterGain) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!enabled) {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      for (const node of this.nodes) {
        node.stop();
      }
      this.nodes = [];
      this.active = false;
      return false;
    }

    if (this.nodes.length > 0) {
      this.masterGain.gain.setTargetAtTime(0.07, this.ctx.currentTime, 0.08);
      this.active = true;
      return true;
    }

    this.masterGain.gain.setTargetAtTime(0.07, this.ctx.currentTime, 0.1);

    // Deep cosmic carrier drone at 55 Hz (A1)
    const osc55 = this.ctx.createOscillator();
    osc55.type = 'sine';
    osc55.frequency.value = 55;
    const gain55 = this.ctx.createGain();
    gain55.gain.value = 0.6;
    osc55.connect(gain55);
    gain55.connect(this.masterGain);
    osc55.start();

    // Harmonic atmospheric texture at 220 Hz (A3)
    const osc220 = this.ctx.createOscillator();
    osc220.type = 'triangle';
    osc220.frequency.value = 220;
    const gain220 = this.ctx.createGain();
    gain220.gain.value = 0.05;
    osc220.connect(gain220);
    gain220.connect(this.masterGain);
    osc220.start();

    this.nodes = [
      {
        stop: () => {
          try {
            osc55.stop();
          } catch {}
          osc55.disconnect();
        },
      },
      {
        stop: () => {
          try {
            osc220.stop();
          } catch {}
          osc220.disconnect();
        },
      },
    ];

    this.active = true;
    return true;
  }

  public toggle(): boolean {
    return this.setSound(!this.active);
  }

  public isActive(): boolean {
    return this.active;
  }
}

export const soundscape = new CosmicSoundscape();
