/**
 * Lightweight Web Audio API sound synthesizer for Lucky Shop.
 * Produces warm casual-game chimes and wooden reel ticks without external audio dependencies.
 */
class SoundController {
  private ctx: AudioContext | null = null;
  private enabled = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.08,
    delaySec = 0,
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + durationSec + 0.02);
  }

  public playClick(): void {
    this.playTone(520, 0.055, 'sine', 0.05);
  }

  public playSpinStart(): void {
    const notes = [330, 392, 494, 587];
    notes.forEach((n, idx) => this.playTone(n, 0.09, 'triangle', 0.06, idx * 0.035));
  }

  public playReelStop(reelIndex: number): void {
    const scale = [293.66, 329.63, 369.99, 440, 523.25];
    const freq = scale[reelIndex % scale.length];
    this.playTone(freq, 0.09, 'triangle', 0.075);
  }

  public playWin(isBigWin: boolean): void {
    const notes = isBigWin
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [523.25, 659.25, 783.99];
    notes.forEach((n, idx) =>
      this.playTone(n, isBigWin ? 0.24 : 0.16, 'triangle', 0.09, idx * 0.07),
    );
  }

  public playUpgrade(): void {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => this.playTone(n, 0.18, 'sine', 0.08, idx * 0.06));
  }
}

export const soundFx = new SoundController();
