import {
  DEFAULT_BET,
  INITIAL_DISPLAY_GRID,
  INITIAL_PLAYER_ECONOMY,
  SymbolId,
} from './config';
import { PlayerStats } from './missions';

export const SAVE_SCHEMA_VERSION = 1;
const STORAGE_KEY = 'lucky_shop_save_v1';

export interface SpinHistoryEntry {
  id: string;
  timestamp: number;
  bet: number;
  totalWin: number;
  topSymbol: SymbolId | null;
  isBigWin: boolean;
}

export interface GameSaveData {
  schemaVersion: number;
  gold: number;
  gems: number;
  level: number;
  xp: number;
  shopLevel: number;
  bet: number;
  royalModeEnabled: boolean;
  lastGrid: SymbolId[][];
  lastWin: number;
  /** Timestamp (ms) when next Daily Bonus becomes claimable. */
  nextDailyBonusAt: number;
  claimedMissionIds: string[];
  stats: PlayerStats;
  recentSpins: SpinHistoryEntry[];
  settings: {
    soundEnabled: boolean;
    reducedMotionOverride: boolean;
  };
}

export function createInitialSaveData(now = Date.now()): GameSaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gold: INITIAL_PLAYER_ECONOMY.gold,
    gems: INITIAL_PLAYER_ECONOMY.gems,
    level: INITIAL_PLAYER_ECONOMY.level,
    xp: INITIAL_PLAYER_ECONOMY.xp,
    shopLevel: INITIAL_PLAYER_ECONOMY.shopLevel,
    bet: DEFAULT_BET,
    royalModeEnabled: false,
    lastGrid: INITIAL_DISPLAY_GRID.map((col) => [...col]),
    lastWin: 0,
    // Ready to claim immediately or shows realistic countdown once claimed
    nextDailyBonusAt: now,
    claimedMissionIds: [],
    stats: {
      totalSpins: 0,
      winningSpins: 0,
      shopUpgrades: 0,
      bigWins: 0,
      biggestSingleWin: 0,
      totalGoldWon: 0,
    },
    recentSpins: [],
    settings: {
      soundEnabled: true,
      reducedMotionOverride: false,
    },
  };
}

export function loadGameSave(now = Date.now()): GameSaveData {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createInitialSaveData(now);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSaveData(now);

    const parsed = JSON.parse(raw) as Partial<GameSaveData>;
    if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION) {
      // Safe fallback without silently corrupting if future schema differs
      return createInitialSaveData(now);
    }

    const base = createInitialSaveData(now);
    return {
      ...base,
      ...parsed,
      gold: typeof parsed.gold === 'number' && parsed.gold >= 0 ? Math.floor(parsed.gold) : base.gold,
      gems: typeof parsed.gems === 'number' && parsed.gems >= 0 ? Math.floor(parsed.gems) : base.gems,
      level: typeof parsed.level === 'number' && parsed.level >= 1 ? Math.floor(parsed.level) : base.level,
      xp: typeof parsed.xp === 'number' && parsed.xp >= 0 ? Math.floor(parsed.xp) : base.xp,
      shopLevel:
        typeof parsed.shopLevel === 'number' && parsed.shopLevel >= 1
          ? Math.floor(parsed.shopLevel)
          : base.shopLevel,
      lastGrid:
        Array.isArray(parsed.lastGrid) &&
        parsed.lastGrid.length === 5 &&
        parsed.lastGrid.every((c) => Array.isArray(c) && c.length === 3)
          ? parsed.lastGrid
          : base.lastGrid,
      stats: {
        ...base.stats,
        ...(parsed.stats ?? {}),
      },
      settings: {
        ...base.settings,
        ...(parsed.settings ?? {}),
      },
      claimedMissionIds: Array.isArray(parsed.claimedMissionIds) ? parsed.claimedMissionIds : [],
      recentSpins: Array.isArray(parsed.recentSpins) ? parsed.recentSpins.slice(0, 15) : [],
    };
  } catch {
    return createInitialSaveData(now);
  }
}

export function saveGameData(data: GameSaveData): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors so gameplay never locks up
  }
}

export function resetGameSave(now = Date.now()): GameSaveData {
  const fresh = createInitialSaveData(now);
  saveGameData(fresh);
  return fresh;
}
