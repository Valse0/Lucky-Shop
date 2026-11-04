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

  it('evaluates a 5-of-a-kind Lucky Red 7 center payline accurately across 9 paylines with shop bonus', () => {
    const grid: SymbolId[][] = [
      ['cherry', 'seven', 'bell'],
      ['grapes', 'seven', 'watermelon'],
      ['clover', 'seven', 'diamond'],
      ['bell', 'seven', 'cherry'],
      ['watermelon', 'seven', 'grapes'],
    ];

    // Total line multiplier = 60. Formula: Math.round((bet * multiplier) / 9) => Math.round((100 * 60) / 9) = Math.round(666.67) = 667
    const result = evaluateGridOutcome(grid, 100, 10, false);
    const centerWin = result.paylineWins.find((w) => w.paylineId === 1);
    expect(centerWin).toBeDefined();
    expect(centerWin?.symbolId).toBe('seven');
    expect(centerWin?.count).toBe(5);
    expect(centerWin?.payout).toBe(667);
    expect(result.shopBonusGold).toBe(67); // +10% of 667 = 66.7 => 67
    expect(result.totalWin).toBe(734);
    expect(result.isBigWin).toBe(true);
  });

  it('correctly aggregates multi-line wins using Math.round((bet * totalWinningMultiplier) / 9)', () => {
    // 3 cherries on line 2 (top: cherry, cherry, cherry -> 0.6x)
    // 3 cherries on line 3 (bottom: cherry, cherry, cherry -> 0.6x)
    const grid: SymbolId[][] = [
      ['cherry', 'bell', 'cherry'],
      ['cherry', 'bell', 'cherry'],
      ['cherry', 'clover', 'cherry'],
      ['seven', 'bell', 'seven'],
      ['diamond', 'crown', 'diamond'],
    ];

    const result = evaluateGridOutcome(grid, 90, 0, false);
    // Total multiplier = 0.6 + 0.6 = 1.2
    // Expected totalLinePayout = Math.round((90 * 1.2) / 9) = 12
    expect(result.paylineWins.length).toBe(2);
    expect(result.baseWin).toBe(12);
  });

  it('treats Royal Crown as Wild only in Royal Mode', () => {
    const grid: SymbolId[][] = [
      ['cherry', 'cherry', 'bell'],
      ['cherry', 'crown', 'watermelon'],
      ['clover', 'cherry', 'diamond'],
      ['bell', 'bell', 'cherry'],
      ['watermelon', 'grapes', 'grapes'],
    ];

    // In normal mode: center line has cherry, crown, cherry => not 3 match
    const normalResult = evaluateGridOutcome(grid, 90, 0, false);
    const normalCenterWin = normalResult.paylineWins.find((w) => w.paylineId === 1);
    expect(normalCenterWin).toBeUndefined();

    // In royal mode: center line has cherry, crown(wild), cherry => 3 cherries win!
    const royalResult = evaluateGridOutcome(grid, 90, 0, true);
    const royalCenterWin = royalResult.paylineWins.find((w) => w.paylineId === 1);
    expect(royalCenterWin).toBeDefined();
    expect(royalCenterWin?.symbolId).toBe('cherry');
    expect(royalCenterWin?.count).toBe(3);
  });

  it('evaluates Treasure Chest scatters on total bet and stacks with diamond bonus', () => {
    const grid: SymbolId[][] = [
      ['chest', 'cherry', 'bell'],
      ['grapes', 'diamond', 'clover'],
      ['diamond', 'chest', 'crown'],
      ['bell', 'grapes', 'diamond'],
      ['watermelon', 'clover', 'chest'],
    ];

    const result = evaluateGridOutcome(grid, 100, 0, false);
    expect(result.scatterWin).not.toBeNull();
    expect(result.scatterWin?.count).toBe(3);
    expect(result.scatterWin?.payout).toBe(200); // 100 * 2x
    // 3 chests award 2 gems + 3 diamonds award (3-1) = 2 gems => total 4 gems!
    expect(result.gemsFound).toBe(4);
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
