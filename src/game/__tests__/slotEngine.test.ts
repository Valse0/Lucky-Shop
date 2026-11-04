import { describe, expect, it } from 'vitest';
import { SymbolId } from '../config';
import {
  applyXpGain,
  createSpinOutcome,
  evaluateGridOutcome,
  validateSpin,
} from '../slotEngine';
import { buildTopToBottomReelStrip } from '../../slot/slotMotion';

describe('Lucky Shop 5x3 Slot Engine', () => {
  it('blocks spins when already spinning or when balance is below bet', () => {
    expect(validateSpin(500, 100, true).valid).toBe(false);
    expect(validateSpin(50, 100, false)).toMatchObject({
      valid: false,
      reason: 'INSUFFICIENT_GOLD',
    });
    expect(validateSpin(100, 100, false).valid).toBe(true);
  });

  it('always creates a 5-column by 3-row outcome grid', () => {
    const outcome = createSpinOutcome({
      bet: 100,
      shopWinBonusPct: 5,
      rng: () => 0.42,
    });
    expect(outcome.grid).toHaveLength(5);
    outcome.grid.forEach((col) => expect(col).toHaveLength(3));
  });

  it('evaluates a 5-of-a-kind Lucky Red 7 center payline accurately with shop bonus', () => {
    const grid: SymbolId[][] = [
      ['cherry', 'seven', 'bell'],
      ['grapes', 'seven', 'watermelon'],
      ['clover', 'seven', 'diamond'],
      ['bell', 'seven', 'cherry'],
      ['watermelon', 'seven', 'grapes'],
    ];

    const result = evaluateGridOutcome(grid, 100, 10, false);
    const centerWin = result.paylineWins.find((w) => w.paylineId === 1);
    expect(centerWin).toBeDefined();
    expect(centerWin?.symbolId).toBe('seven');
    expect(centerWin?.count).toBe(5);
    expect(centerWin?.payout).toBe(6000); // 100 * 60x
    expect(result.shopBonusGold).toBe(600); // +10%
    expect(result.totalWin).toBe(6600);
    expect(result.isBigWin).toBe(true);
  });

  it('evaluates Treasure Chest scatters anywhere on the 5x3 reels', () => {
    const grid: SymbolId[][] = [
      ['chest', 'cherry', 'bell'],
      ['grapes', 'watermelon', 'clover'],
      ['diamond', 'chest', 'crown'],
      ['bell', 'grapes', 'cherry'],
      ['watermelon', 'clover', 'chest'],
    ];

    const result = evaluateGridOutcome(grid, 100, 0, false);
    expect(result.scatterWin).not.toBeNull();
    expect(result.scatterWin?.count).toBe(3);
    expect(result.scatterWin?.payout).toBe(200);
  });

  it('advances player levels and awards milestone gold and gems cleanly', () => {
    const progress = applyXpGain(3, 380, 50); // Level 3 needs 400 XP
    expect(progress.level).toBe(4);
    expect(progress.xp).toBe(30);
    expect(progress.leveledUpCount).toBe(1);
    expect(progress.rewardGold).toBeGreaterThan(0);
  });

  it('places target outcome at top [0..2] and previous idle symbols at bottom [S..S+2] for top-to-bottom spins', () => {
    const startCol: SymbolId[] = ['cherry', 'crown', 'diamond'];
    const filler: SymbolId[] = ['bell', 'clover', 'grapes', 'watermelon'];
    const targetCol: SymbolId[] = ['seven', 'seven', 'seven'];
    const strip = buildTopToBottomReelStrip(startCol, filler, targetCol);
    const stepCount = 3 + filler.length; // 7 steps
    expect(strip.slice(0, 3)).toEqual(targetCol);
    expect(strip.slice(stepCount, stepCount + 3)).toEqual(startCol);
  });
});
