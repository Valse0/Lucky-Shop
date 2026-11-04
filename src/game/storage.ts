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
    soundVolume: number;
    musicEnabled: boolean;
    musicVolume: number;
    reducedMotionOverride: boolean;
  };
}

const BACKUP_KEY = 'lucky_shop_save_backup_v1';

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
      soundVolume: 0.85,
      musicEnabled: true,
      musicVolume: 0.65,
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

    // Keep an untouched raw backup before processing
    try {
      if (!window.localStorage.getItem(BACKUP_KEY)) {
        window.localStorage.setItem(BACKUP_KEY, raw);
      }
    } catch {
      // ignore backup quota issues
    }

    const parsed = JSON.parse(raw) as Partial<GameSaveData>;
    if (!parsed || typeof parsed !== 'object') {
      return createInitialSaveData(now);
    }

    // If future unknown schema, do not overwrite; return fallback
    if (typeof parsed.schemaVersion === 'number' && parsed.schemaVersion > SAVE_SCHEMA_VERSION) {
      return createInitialSaveData(now);
    }

    const base = createInitialSaveData(now);
    const validBet =
      typeof parsed.bet === 'number' && [25, 50, 100, 200, 500, 1000].includes(parsed.bet)
        ? parsed.bet
        : base.bet;

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
      bet: validBet,
      royalModeEnabled: typeof parsed.royalModeEnabled === 'boolean' ? parsed.royalModeEnabled : base.royalModeEnabled,
      lastGrid:
        Array.isArray(parsed.lastGrid) &&
        parsed.lastGrid.length === 5 &&
        parsed.lastGrid.every((c) => Array.isArray(c) && c.length === 3)
          ? parsed.lastGrid
          : base.lastGrid,
      stats: {
        totalSpins: typeof parsed.stats?.totalSpins === 'number' && parsed.stats.totalSpins >= 0 ? Math.floor(parsed.stats.totalSpins) : base.stats.totalSpins,
        winningSpins: typeof parsed.stats?.winningSpins === 'number' && parsed.stats.winningSpins >= 0 ? Math.floor(parsed.stats.winningSpins) : base.stats.winningSpins,
        shopUpgrades: typeof parsed.stats?.shopUpgrades === 'number' && parsed.stats.shopUpgrades >= 0 ? Math.floor(parsed.stats.shopUpgrades) : base.stats.shopUpgrades,
        bigWins: typeof parsed.stats?.bigWins === 'number' && parsed.stats.bigWins >= 0 ? Math.floor(parsed.stats.bigWins) : base.stats.bigWins,
        biggestSingleWin: typeof parsed.stats?.biggestSingleWin === 'number' && parsed.stats.biggestSingleWin >= 0 ? Math.floor(parsed.stats.biggestSingleWin) : base.stats.biggestSingleWin,
        totalGoldWon: typeof parsed.stats?.totalGoldWon === 'number' && parsed.stats.totalGoldWon >= 0 ? Math.floor(parsed.stats.totalGoldWon) : base.stats.totalGoldWon,
      },
      settings: {
        soundEnabled:
          typeof parsed.settings?.soundEnabled === 'boolean'
            ? parsed.settings.soundEnabled
            : base.settings.soundEnabled,
        soundVolume:
          typeof parsed.settings?.soundVolume === 'number' &&
          parsed.settings.soundVolume >= 0 &&
          parsed.settings.soundVolume <= 1
            ? parsed.settings.soundVolume
            : 0.85,
        musicEnabled:
          typeof parsed.settings?.musicEnabled === 'boolean'
            ? parsed.settings.musicEnabled
            : true,
        musicVolume:
          typeof parsed.settings?.musicVolume === 'number' &&
          parsed.settings.musicVolume >= 0 &&
          parsed.settings.musicVolume <= 1
            ? parsed.settings.musicVolume
            : 0.65,
        reducedMotionOverride:
          typeof parsed.settings?.reducedMotionOverride === 'boolean'
            ? parsed.settings.reducedMotionOverride
            : base.settings.reducedMotionOverride,
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
    const raw = JSON.stringify(data);
    window.localStorage.setItem(STORAGE_KEY, raw);
    // Periodically update the backup on valid save writes
    window.localStorage.setItem(BACKUP_KEY, raw);
  } catch {
    // Ignore storage quota errors so gameplay never locks up
  }
}

export function resetGameSave(now = Date.now()): GameSaveData {
  const fresh = createInitialSaveData(now);
  saveGameData(fresh);
  return fresh;
}
