import { describe, it, expect } from 'vitest';
import { soundFx } from '../sound';
import { createInitialSaveData, loadGameSave } from '../storage';

describe('Lucky Shop Sound System & Audio Settings', () => {
  it('initializes audio controls safely in test environment without throwing', () => {
    expect(soundFx.isSoundOn()).toBe(true);
    expect(soundFx.isMusicOn()).toBe(true);

    soundFx.setSoundEnabled(false);
    expect(soundFx.isSoundOn()).toBe(false);

    soundFx.setSoundEnabled(true);
    expect(soundFx.isSoundOn()).toBe(true);

    soundFx.setMusicEnabled(false);
    expect(soundFx.isMusicOn()).toBe(false);

    soundFx.setMusicEnabled(true);
    expect(soundFx.isMusicOn()).toBe(true);

    soundFx.setSoundVolume(0.5);
    soundFx.setMusicVolume(0.3);
  });

  it('triggers all slot machine and special reward sound methods gracefully', () => {
    // UI Click & Lever Spin Start
    expect(() => soundFx.playClick()).not.toThrow();
    expect(() => soundFx.playSpinStart()).not.toThrow();

    // Reel Stops (0..3 anticipation, 4 final latch)
    for (let r = 0; r < 4; r++) {
      expect(() => soundFx.playReelStop(r, false)).not.toThrow();
    }
    expect(() => soundFx.playReelStop(4, true)).not.toThrow();

    // Win Tiers
    expect(() => soundFx.playNoWin()).not.toThrow();
    expect(() => soundFx.playWin({ totalWin: 50, bet: 100 })).not.toThrow(); // Small win (<2x)
    expect(() => soundFx.playWin({ totalWin: 300, bet: 100 })).not.toThrow(); // Medium win (3x)
    expect(() => soundFx.playWin({ totalWin: 800, bet: 100, isBigWin: true })).not.toThrow(); // Big win (8x)
    expect(() => soundFx.playWin({ totalWin: 2500, bet: 100 })).not.toThrow(); // Jackpot (25x)
    expect(() => soundFx.playWin(true)).not.toThrow(); // Backwards compatibility boolean

    // Special Reward Sounds
    expect(() => soundFx.playTreasureChest()).not.toThrow();
    expect(() => soundFx.playDiamondBonus()).not.toThrow();
    expect(() => soundFx.playRoyalModeToggle(true)).not.toThrow();
    expect(() => soundFx.playRoyalModeToggle(false)).not.toThrow();
    expect(() => soundFx.playLevelUp()).not.toThrow();
    expect(() => soundFx.playDailyBonus()).not.toThrow();
    expect(() => soundFx.playShopUpgrade()).not.toThrow();
    expect(() => soundFx.playMissionClaim()).not.toThrow();
    expect(() => soundFx.playGemReward()).not.toThrow();
  });

  it('persists and validates audio settings schema in GameSaveData', () => {
    const initial = createInitialSaveData();
    expect(initial.settings.soundEnabled).toBe(true);
    expect(initial.settings.soundVolume).toBe(0.85);
    expect(initial.settings.musicEnabled).toBe(true);
    expect(initial.settings.musicVolume).toBe(0.65);

    // Test fallback parsing in loadGameSave
    const loaded = loadGameSave();
    expect(typeof loaded.settings.soundEnabled).toBe('boolean');
    expect(typeof loaded.settings.soundVolume).toBe('number');
    expect(typeof loaded.settings.musicEnabled).toBe('boolean');
    expect(typeof loaded.settings.musicVolume).toBe('number');
  });
});
