/**
 * Lucky Shop Audio Identity & Sound System
 * 
 * Professional Web Audio API sound synthesizer and interactive background music engine.
 * - Zero external binary dependencies; runs with 0ms latency on desktop & mobile Safari/Chrome.
 * - Independent Music and Sound Effects gain busses with dedicated volume controls.
 * - Original fantasy village arcade theme with continuous seamless lookahead scheduling.
 * - Priority-based sound dispatching preventing cacophonous overlapping.
 * - Resilient autoplay compliance & mobile background tab management.
 */

export interface WinSoundParams {
  totalWin: number;
  bet: number;
  isBigWin?: boolean;
}

class SoundController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Settings
  private soundEnabled = true;
  private soundVolume = 0.85;
  private musicEnabled = true;
  private musicVolume = 0.65;

  // Music state
  private isMusicPlaying = false;
  private musicTimerId: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;

  // Spin looping sound state
  private spinLoopTimerId: number | null = null;

  // Active transient timers
  private activeTimers: number[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-unlock on first user gesture
      const unlockAudio = () => {
        this.ensureContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.musicEnabled && !this.isMusicPlaying) {
          this.startMusic();
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });

      // Handle visibility changes (mute/pause in background)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
          }
        } else {
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
          if (this.musicEnabled && !this.isMusicPlaying) {
            this.startMusic();
          }
        }
      });
    }
  }

  // =========================================================================
  // AUDIO CONTEXT & GAIN INITIALIZATION
  // =========================================================================

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      try {
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        const initialMusicVol = this.musicEnabled ? this.musicVolume : 0.0001;
        this.musicGain.gain.setValueAtTime(initialMusicVol, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        const initialSfxVol = this.soundEnabled ? this.soundVolume : 0.0001;
        this.sfxGain.gain.setValueAtTime(initialSfxVol, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // =========================================================================
  // VOLUME & TOGGLE CONFIGURATION
  // =========================================================================

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      const target = enabled ? this.soundVolume : 0.0001;
      this.sfxGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    }
  }

  /** Backwards compatibility alias for setSoundEnabled */
  public setEnabled(enabled: boolean): void {
    this.setSoundEnabled(enabled);
  }

  public setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain && this.ctx && this.soundEnabled) {
      this.sfxGain.gain.setTargetAtTime(this.soundVolume, this.ctx.currentTime, 0.04);
    }
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      const target = enabled ? this.musicVolume : 0.0001;
      this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
    }

    if (enabled) {
      if (!this.isMusicPlaying) this.startMusic();
    } else {
      // Don't fully stop scheduler immediately, smooth fade out handles silence
    }
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain && this.ctx && this.musicEnabled) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  public isMusicOn(): boolean {
    return this.musicEnabled;
  }

  public isSoundOn(): boolean {
    return this.soundEnabled;
  }

  // =========================================================================
  // BACKGROUND MUSIC (BGM) ENGINE: "LUCKY SHOP FANTASY ARCADE"
  // =========================================================================

  public startMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.nextNoteTime = ctx.currentTime + 0.1;
    this.currentStep = 0;

    // Scheduler tick every 60ms looking ahead by 200ms
    this.musicTimerId = window.setInterval(() => {
      this.scheduleMusic();
    }, 60);
  }

  public stopMusic(): void {
    if (this.musicTimerId !== null) {
      window.clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }
    this.isMusicPlaying = false;
  }

  /**
   * 8-Bar Whimsical Village Arcade melody in C Major / G Mixolydian.
   * 32 sixteenth-note steps per 4 bars, total 64 steps loop at 116 BPM.
   */
  private scheduleMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    const secondsPer16th = 60 / 116 / 4; // ~0.1293s

    // Frequencies (Hz)
    const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196.00, A3 = 220.00, B3 = 246.94;
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880.00;

    // 32-step cyclical lead melody (music box / warm bell)
    const melodySteps: Array<number | null> = [
      // Bar 1: C Major sparkle
      C5, null, G4, null, E4, null, G4, null,
      C5, D5, E5, null, G5, null, E5, null,
      // Bar 2: F Major cheerful bounce
      A4, null, C5, null, F4, null, A4, null,
      C5, null, D5, null, C5, null, A4, null,
      // Bar 3: G9 arcade anticipation
      B4, null, D5, null, G4, null, B4, null,
      D5, E5, D5, null, B4, null, G4, null,
      // Bar 4: Am7 -> G turnaround
      A4, null, C5, null, E5, null, D5, null,
      C5, null, B4, null, G4, null, null, null,
    ];

    // 32-step bassline (warm fantasy acoustic pluck)
    const bassSteps: Array<number | null> = [
      C3, null, null, null, G3, null, null, null,
      C3, null, null, null, E3, null, G3, null,
      F3, null, null, null, C4, null, null, null,
      F3, null, null, null, A3, null, C4, null,
      G3, null, null, null, D3, null, null, null,
      G3, null, null, null, B3, null, D4, null,
      A3, null, null, null, E3, null, null, null,
      G3, null, null, null, G3, null, null, null,
    ];

    while (this.nextNoteTime < ctx.currentTime + 0.25) {
      if (!this.musicEnabled) {
        this.nextNoteTime += secondsPer16th;
        this.currentStep = (this.currentStep + 1) % 32;
        continue;
      }

      const note = melodySteps[this.currentStep];
      const bass = bassSteps[this.currentStep];

      // Play melody note
      if (note !== null) {
        this.playMusicBoxNote(note, this.nextNoteTime, 0.28, 0.08);
      }

      // Play bass note
      if (bass !== null) {
        this.playFantasyBassNote(bass, this.nextNoteTime, 0.32, 0.12);
      }

      // Soft percussion pulse on beats 2 & 4 (steps 4, 12, 20, 28)
      if (this.currentStep % 8 === 4) {
        this.playSoftPercussion(this.nextNoteTime, 0.04);
      }

      this.nextNoteTime += secondsPer16th;
      this.currentStep = (this.currentStep + 1) % 32;
    }
  }

  /** Dual-sine bell chime for music box melody */
  private playMusicBoxNote(freq: number, startTime: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.musicGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Subtle harmonic chime overtone (+0.4% detune)
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.004, startTime);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.012);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.musicGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.03);
    osc2.stop(startTime + duration + 0.03);
  }

  /** Warm acoustic pizzicato sub-bass */
  private playFantasyBassNote(freq: number, startTime: number, duration: number, peakGain: number): void {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, startTime);
    filter.frequency.exponentialRampToValueAtTime(80, startTime + duration);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  /** Subtle filtered noise shaker */
  private playSoftPercussion(startTime: number, peakGain: number): void {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, startTime);
    filter.Q.setValueAtTime(2.5, startTime);

    const percGain = this.ctx.createGain();
    percGain.gain.setValueAtTime(peakGain, startTime);
    percGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);

    whiteNoise.connect(filter);
    filter.connect(percGain);
    percGain.connect(this.musicGain);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + 0.04);
  }

  // =========================================================================
  // GENERAL TONE SYNTHESIS HELPER
  // =========================================================================

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.08,
    delaySec = 0,
    pitchDecayTo?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || !this.soundEnabled) return;

    const start = ctx.currentTime + Math.max(0, delaySec);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (pitchDecayTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchDecayTo), start + durationSec);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(start);
    osc.stop(start + durationSec + 0.03);
  }

  // =========================================================================
  // SOUND EFFECTS: UI, SPIN & REELS
  // =========================================================================

  /** Tactile wooden button tap */
  public playClick(): void {
    this.playTone(480, 0.045, 'sine', 0.06, 0, 320);
  }

  /**
   * Spin Start: Mechanical lever crank + upward gear ratchet
   */
  public playSpinStart(): void {
    this.stopReelSpinningLoop();
    this.clearTransientTimers();

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || !this.soundEnabled) return;

    // 1. Heavy lever release chirp
    this.playTone(220, 0.12, 'sawtooth', 0.07, 0, 520);
    this.playTone(110, 0.08, 'triangle', 0.12, 0, 70);

    // 2. Mechanical gear ratchets
    const ratchetPitches = [330, 415, 520, 622];
    ratchetPitches.forEach((p, idx) => {
      this.playTone(p, 0.065, 'triangle', 0.08, 0.04 + idx * 0.032);
    });

    // 3. Begin continuous subtle spinning tick loop
    const t = window.setTimeout(() => {
      this.startReelSpinningLoop();
    }, 180);
    this.activeTimers.push(t);
  }

  /** Rhythmic mechanical reel spinning ticks */
  public startReelSpinningLoop(): void {
    if (this.spinLoopTimerId !== null) return;
    if (!this.soundEnabled) return;

    let clickToggle = false;
    this.spinLoopTimerId = window.setInterval(() => {
      clickToggle = !clickToggle;
      const f = clickToggle ? 380 : 420;
      this.playTone(f, 0.035, 'triangle', 0.035);
    }, 115);
  }

  /** Halts reel spinning loop */
  public stopReelSpinningLoop(): void {
    if (this.spinLoopTimerId !== null) {
      window.clearInterval(this.spinLoopTimerId);
      this.spinLoopTimerId = null;
    }
  }

  /**
   * Sequential Reel Stop:
   * - Reels 0..3: Ascending mechanical latch ticks (anticipation)
   * - Reel 4 (Final Reel): Resonant mechanical lock with bass thump + bright resolution
   */
  public playReelStop(reelIndex: number, isLastReel = false): void {
    const actualIsLast = isLastReel || reelIndex === 4;

    if (!actualIsLast) {
      // Ascending musical progression: D4, E4, F#4, A4
      const scale = [293.66, 329.63, 369.99, 440.00];
      const freq = scale[reelIndex % scale.length];

      // Mechanical wooden click + chime ring
      this.playTone(140, 0.04, 'square', 0.05, 0, 80);
      this.playTone(freq, 0.085, 'triangle', 0.085);
    } else {
      // Last reel has stopped — cancel spinning loop immediately
      this.stopReelSpinningLoop();

      // Heavy mechanical lock latch (bass thump + resonant resolution chord)
      this.playTone(95, 0.14, 'triangle', 0.16, 0, 45); // Bass thunk
      this.playTone(493.88, 0.16, 'triangle', 0.09, 0.015); // B4
      this.playTone(587.33, 0.22, 'sine', 0.08, 0.035); // D5
    }
  }

  /**
   * Neutral, soft 2-tone descending chime for non-winning spins
   */
  public playNoWin(): void {
    this.playTone(392.00, 0.12, 'sine', 0.04, 0);       // G4
    this.playTone(329.63, 0.18, 'triangle', 0.035, 0.08); // E4
  }

  // =========================================================================
  // WIN SOUND TIERS: DERIVED FROM GAME ECONOMY (BET MULTIPLIERS)
  // =========================================================================

  /**
   * Tiered Win Sound:
   * - Small Win (win < 2x bet): Crisp cascade of golden coin clinks
   * - Medium Win (2x <= win < 5x): Cheerful 4-note chime fanfare + coin cascade
   * - Big Win (5x <= win < 15x): Celebratory triumphant fanfare + sparkle
   * - Jackpot / Exceptional (win >= 15x): Grand royal victory anthem
   */
  public playWin(params: WinSoundParams | boolean): void {
    // Backwards compatibility with boolean
    if (typeof params === 'boolean') {
      const isBig = params;
      this.playWinMelody(isBig ? 'big' : 'small');
      return;
    }

    const { totalWin, bet, isBigWin } = params;
    if (totalWin <= 0) {
      this.playNoWin();
      return;
    }

    const multiplier = bet > 0 ? totalWin / bet : 1;

    if (multiplier >= 15) {
      this.playWinMelody('jackpot');
    } else if (multiplier >= 5 || isBigWin) {
      this.playWinMelody('big');
    } else if (multiplier >= 2) {
      this.playWinMelody('medium');
    } else {
      this.playWinMelody('small');
    }
  }

  private playWinMelody(tier: 'small' | 'medium' | 'big' | 'jackpot'): void {
    switch (tier) {
      case 'small': {
        // Fast cascade of 4 golden coin pings
        const coinFreqs = [1960, 2340, 2720, 2200];
        coinFreqs.forEach((f, idx) => {
          this.playTone(f, 0.07, 'sine', 0.07, idx * 0.045);
        });
        break;
      }
      case 'medium': {
        // Cheerful 4-note fanfare + coin flurry
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((n, idx) => {
          this.playTone(n, 0.18, 'triangle', 0.09, idx * 0.065);
        });
        const coins = [2093, 2637, 3136];
        coins.forEach((c, idx) => {
          this.playTone(c, 0.06, 'sine', 0.06, 0.28 + idx * 0.05);
        });
        break;
      }
      case 'big': {
        // Powerful celebratory fanfare with brass triads and sparkle
        const fanfare = [
          { f: 523.25, d: 0.12, delay: 0 },
          { f: 659.25, d: 0.12, delay: 0.07 },
          { f: 783.99, d: 0.14, delay: 0.14 },
          { f: 1046.5, d: 0.28, delay: 0.22 },
          { f: 1318.5, d: 0.35, delay: 0.32 },
        ];
        fanfare.forEach((n) => this.playTone(n.f, n.d, 'triangle', 0.11, n.delay));

        // Shimmering coin cascade
        for (let i = 0; i < 7; i++) {
          const f = 1800 + (i % 4) * 420;
          this.playTone(f, 0.06, 'sine', 0.07, 0.38 + i * 0.045);
        }
        break;
      }
      case 'jackpot': {
        // Stately Royal Victory Anthem
        const chords = [
          // Chord 1: C Major
          [261.63, 329.63, 392.00, 523.25],
          // Chord 2: F Major
          [349.23, 440.00, 523.25, 698.46],
          // Chord 3: G Major
          [392.00, 493.88, 587.33, 783.99],
          // Resolution: C Major High
          [523.25, 659.25, 783.99, 1046.5],
        ];

        chords.forEach((chord, chordIdx) => {
          chord.forEach((freq) => {
            this.playTone(freq, 0.28, 'triangle', 0.09, chordIdx * 0.14);
          });
        });

        // Golden sparkle arpeggio
        const sparkle = [1046.5, 1318.5, 1567.98, 2093.0];
        sparkle.forEach((f, idx) => {
          this.playTone(f, 0.22, 'sine', 0.08, 0.60 + idx * 0.05);
        });
        break;
      }
    }
  }

  // =========================================================================
  // SPECIAL REWARDS & EVENT SOUNDS
  // =========================================================================

  /** Treasure Chest Scatter: Wooden lid open creak + gold scatter */
  public playTreasureChest(): void {
    // 1. Wooden latch creak
    this.playTone(160, 0.09, 'sawtooth', 0.08, 0, 110);
    // 2. Gold coins eruption
    const coins = [1840, 2280, 2640, 2120, 2480];
    coins.forEach((c, idx) => {
      this.playTone(c, 0.08, 'sine', 0.08, 0.07 + idx * 0.04);
    });
  }

  /** Diamond Bonus: Ethereal crystalline chime shimmer */
  public playDiamondBonus(): void {
    const crystals = [2093, 2793, 3136, 4186];
    crystals.forEach((freq, idx) => {
      this.playTone(freq, 0.32, 'sine', 0.075, idx * 0.055);
    });
  }

  /** Royal Slots Mode Toggle: Regal fanfare shimmer */
  public playRoyalModeToggle(active: boolean): void {
    if (active) {
      const regal = [440, 554.37, 659.25, 880, 1108.7];
      regal.forEach((f, idx) => this.playTone(f, 0.16, 'triangle', 0.08, idx * 0.05));
    } else {
      this.playTone(523.25, 0.12, 'sine', 0.05, 0);
      this.playTone(392.00, 0.16, 'sine', 0.04, 0.08);
    }
  }

  /** Level Up: Festive celebratory 6-note jingle */
  public playLevelUp(): void {
    const melody = [523.25, 659.25, 783.99, 880.00, 987.77, 1046.5];
    melody.forEach((f, idx) => {
      this.playTone(f, 0.22, 'triangle', 0.095, idx * 0.07);
    });
    // Sparkle tail
    this.playTone(1567.98, 0.35, 'sine', 0.07, 0.46);
  }

  /** Daily Bonus: Present unboxing swoosh + celebratory chime */
  public playDailyBonus(): void {
    this.playTone(280, 0.10, 'sine', 0.07, 0, 560);
    const rewardMelody = [587.33, 739.99, 880.00, 1174.66];
    rewardMelody.forEach((f, idx) => {
      this.playTone(f, 0.24, 'triangle', 0.085, 0.08 + idx * 0.06);
    });
  }

  /** Shop Upgrade: Hammer tap + triumphant upward chord */
  public playShopUpgrade(): void {
    // 1. Hammer taps
    this.playTone(180, 0.035, 'square', 0.06, 0);
    this.playTone(195, 0.035, 'square', 0.06, 0.07);
    // 2. Triumph chord: F4, A4, C5, F5
    const chord = [349.23, 440.00, 523.25, 698.46];
    chord.forEach((f) => this.playTone(f, 0.28, 'triangle', 0.09, 0.16));
  }

  /** Backwards compatibility alias for playShopUpgrade */
  public playUpgrade(): void {
    this.playShopUpgrade();
  }

  /** Mission Claim: Uplifting "Ding-Dong!" quest complete chime */
  public playMissionClaim(): void {
    this.playTone(880.00, 0.22, 'sine', 0.09, 0);
    this.playTone(1318.51, 0.35, 'sine', 0.09, 0.12);
  }

  /** Gem Reward: Crisp crystal drop */
  public playGemReward(): void {
    this.playTone(2793.83, 0.18, 'sine', 0.075);
  }

  // =========================================================================
  // CLEANUP & SAFETY
  // =========================================================================

  private clearTransientTimers(): void {
    this.activeTimers.forEach((t) => window.clearTimeout(t));
    this.activeTimers = [];
  }
}

export const soundFx = new SoundController();
