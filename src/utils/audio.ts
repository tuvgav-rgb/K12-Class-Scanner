/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      // Create audio context lazily on first user interaction
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume if suspended (browsers auto-suspend untriggered audio)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSuccess() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime); // High-pitched clean beep
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio context failed to play success sound:', e);
    }
  }

  playError() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const playBuzz = (delay: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime + delay); // Low-pitched buzz

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.15);
      };

      // Play double-buzz
      playBuzz(0);
      playBuzz(0.18);
    } catch (e) {
      console.warn('Audio context failed to play error sound:', e);
    }
  }

  playCheckout() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();

      // Arpeggio chime
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      gain1.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6
      gain2.gain.setValueAtTime(0.06, this.ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08 + 0.2);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc1.start();
      osc1.stop(this.ctx.currentTime + 0.15);

      osc2.start(this.ctx.currentTime + 0.08);
      osc2.stop(this.ctx.currentTime + 0.08 + 0.2);
    } catch (e) {
      console.warn('Audio context failed to play checkout sound:', e);
    }
  }
}

export const scannerAudio = new AudioSynthesizer();
