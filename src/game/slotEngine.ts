import {
  GRID_COLS,
  GRID_ROWS,
  PAYLINES,
  SYMBOL_LIST,
  SYMBOLS,
  SymbolId,
  getLevelUpReward,
  getXpRequiredForLevel,
} from './config';

export type RngFn = () => number;

export interface PaylineWin {
  paylineId: number;
  paylineName: string;
  symbolId: SymbolId;
  count: 3 | 4 | 5;
  multiplier: number;
  payout: number;
  color: string;
  positions: Array<[number, number]>;
}

export interface ScatterWin {
  symbolId: SymbolId;
  count: number;
  multiplier: number;
  payout: number;
  positions: Array<[number, number]>;
}

export interface SpinOutcome {
  grid: SymbolId[][];
  bet: number;
  paylineWins: PaylineWin[];
  scatterWin: ScatterWin | null;
  baseWin: number;
  shopBonusGold: number;
  totalWin: number;
  xpEarned: number;
  gemsFound: number;
  isBigWin: boolean;
  winningCellsKeySet: string[];
}

export interface SpinValidationResult {
  valid: boolean;
  reason?: 'SPIN_IN_PROGRESS' | 'INVALID_BET' | 'INSUFFICIENT_GOLD';
  message?: string;
}

export function defaultRng(): number {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  }
  return Math.random();
}

export function validateSpin(
  goldBalance: number,
  bet: number,
  isSpinning: boolean,
): SpinValidationResult {
  if (isSpinning) {
    return {
      valid: false,
      reason: 'SPIN_IN_PROGRESS',
      message: 'Reels are currently spinning.',
    };
  }
  if (!Number.isFinite(bet) || bet <= 0) {
    return {
      valid: false,
      reason: 'INVALID_BET',
      message: 'Please choose a valid bet amount.',
    };
  }
  if (!Number.isFinite(goldBalance) || goldBalance < bet) {
    return {
      valid: false,
      reason: 'INSUFFICIENT_GOLD',
      message: 'Not enough gold for this bet! Lower your bet or claim a bonus.',
    };
  }
  return { valid: true };
}

export function pickWeightedSymbol(rng: RngFn = defaultRng, royalMode = false): SymbolId {
  const pool = SYMBOL_LIST.filter((s) => (royalMode ? s.royalWeight > 0 : s.weight > 0));
  const totalWeight = pool.reduce(
    (sum, s) => sum + (royalMode ? s.royalWeight : s.weight),
    0,
  );
  let roll = rng() * totalWeight;
  for (const sym of pool) {
    const w = royalMode ? sym.royalWeight : sym.weight;
    if (roll < w) {
      return sym.id;
    }
    roll -= w;
  }
  return pool[0].id;
}

export function generateGrid(rng: RngFn = defaultRng, royalMode = false): SymbolId[][] {
  const grid: SymbolId[][] = [];
  for (let col = 0; col < GRID_COLS; col++) {
    const column: SymbolId[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      column.push(pickWeightedSymbol(rng, royalMode));
    }
    grid.push(column);
  }
  return grid;
}

export function evaluateGridOutcome(
  grid: SymbolId[][],
  bet: number,
  shopWinBonusPct = 0,
  royalMode = false,
): SpinOutcome {
  if (grid.length !== GRID_COLS || grid.some((col) => col.length !== GRID_ROWS)) {
    throw new Error(`Expected ${GRID_COLS}x${GRID_ROWS} slot grid.`);
  }
  if (bet <= 0 || !Number.isFinite(bet)) {
    throw new Error('Bet must be a positive number.');
  }

  const paylineWins: PaylineWin[] = [];
  const winningCells = new Set<string>();

  for (const line of PAYLINES) {
    const lineSymbols = line.rows.map((r, c) => grid[c][r]);

    const isWildSym = (s: SymbolId) =>
      Boolean(SYMBOLS[s].isWild) || (royalMode && s === 'crown');

    let anchorSymbol: SymbolId = lineSymbols[0];
    if (isWildSym(anchorSymbol)) {
      const firstRegular = lineSymbols.find((s) => !isWildSym(s) && !SYMBOLS[s].isScatter);
      if (firstRegular) {
        anchorSymbol = firstRegular;
      }
    }

    if (SYMBOLS[anchorSymbol].isScatter) {
      continue;
    }

    let matchCount = 0;
    for (let col = 0; col < GRID_COLS; col++) {
      const sym = lineSymbols[col];
      if (sym === anchorSymbol || isWildSym(sym)) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const countKey = Math.min(5, matchCount) as 3 | 4 | 5;
      const multiplier = SYMBOLS[anchorSymbol].payouts[countKey];
      const positions: Array<[number, number]> = [];
      for (let col = 0; col < countKey; col++) {
        const row = line.rows[col];
        positions.push([col, row]);
        winningCells.add(`${col}-${row}`);
      }

      paylineWins.push({
        paylineId: line.id,
        paylineName: line.name,
        symbolId: anchorSymbol,
        count: countKey,
        multiplier,
        payout: 0, // Assigned proportionally after aggregate calculation
        color: line.color,
        positions,
      });
    }
  }

  // Aggregate line payouts integer-safely across all 9 paylines:
  // Math.round((bet * totalWinningMultiplier) / 9)
  const totalLineMultiplier = paylineWins.reduce((sum, w) => sum + w.multiplier, 0);
  const totalLinePayout =
    paylineWins.length > 0 ? Math.round((bet * totalLineMultiplier) / 9) : 0;

  // Distribute line payouts proportionally for display/feedback
  if (totalLinePayout > 0 && totalLineMultiplier > 0) {
    let allocated = 0;
    paylineWins.forEach((pw, idx) => {
      if (idx === paylineWins.length - 1) {
        pw.payout = Math.max(0, totalLinePayout - allocated);
      } else {
        const share = Math.round((totalLinePayout * pw.multiplier) / totalLineMultiplier);
        pw.payout = share;
        allocated += share;
      }
    });
  }

  const chestPositions: Array<[number, number]> = [];
  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      if (grid[col][row] === 'chest') {
        chestPositions.push([col, row]);
      }
    }
  }

  let scatterWin: ScatterWin | null = null;
  if (chestPositions.length >= 3) {
    const countKey = Math.min(5, chestPositions.length) as 3 | 4 | 5;
    const multiplier = SYMBOLS.chest.payouts[countKey];
    // Scatter is evaluated across total bet independently of line allocations
    const payout = Math.round(bet * multiplier);
    chestPositions.forEach(([c, r]) => winningCells.add(`${c}-${r}`));
    scatterWin = {
      symbolId: 'chest',
      count: chestPositions.length,
      multiplier,
      payout,
      positions: chestPositions,
    };
  }

  const baseWin = totalLinePayout + (scatterWin ? scatterWin.payout : 0);

  const shopBonusGold =
    baseWin > 0 && shopWinBonusPct > 0 ? Math.round((baseWin * shopWinBonusPct) / 100) : 0;

  const totalWin = baseWin + shopBonusGold;

  const baseXp = Math.max(12, Math.round(bet * 0.2));
  const winXp = totalWin > 0 ? Math.min(80, Math.round((totalWin / bet) * 8)) : 0;
  const xpEarned = baseXp + winXp;

  let diamondCount = 0;
  for (let c = 0; c < GRID_COLS; c++) {
    for (let r = 0; r < GRID_ROWS; r++) {
      if (grid[c][r] === 'diamond') diamondCount++;
    }
  }
  const gemsFound = (scatterWin ? 2 : 0) + (diamondCount >= 3 ? diamondCount - 1 : 0);

  return {
    grid,
    bet,
    paylineWins,
    scatterWin,
    baseWin,
    shopBonusGold,
    totalWin,
    xpEarned,
    gemsFound,
    isBigWin: totalWin >= bet * 4,
    winningCellsKeySet: Array.from(winningCells),
  };
}

export function createSpinOutcome(params: {
  bet: number;
  shopWinBonusPct: number;
  royalMode?: boolean;
  rng?: RngFn;
}): SpinOutcome {
  const { bet, shopWinBonusPct, royalMode = false, rng = defaultRng } = params;
  const grid = generateGrid(rng, royalMode);
  return evaluateGridOutcome(grid, bet, shopWinBonusPct, royalMode);
}

export interface LevelProgressUpdate {
  level: number;
  xp: number;
  leveledUpCount: number;
  rewardGold: number;
  rewardGems: number;
}

export function applyXpGain(
  currentLevel: number,
  currentXp: number,
  xpDelta: number,
): LevelProgressUpdate {
  let level = Math.max(1, currentLevel);
  let xp = Math.max(0, currentXp) + Math.max(0, xpDelta);
  let leveledUpCount = 0;
  let rewardGold = 0;
  let rewardGems = 0;

  while (xp >= getXpRequiredForLevel(level)) {
    xp -= getXpRequiredForLevel(level);
    level += 1;
    leveledUpCount += 1;
    const reward = getLevelUpReward(level);
    rewardGold += reward.gold;
    rewardGems += reward.gems;
  }

  return { level, xp, leveledUpCount, rewardGold, rewardGems };
}
