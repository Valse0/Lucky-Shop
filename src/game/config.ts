export const GRID_COLS = 5;
export const GRID_ROWS = 3;

export type SymbolId =
  | 'cherry'
  | 'watermelon'
  | 'grapes'
  | 'clover'
  | 'bell'
  | 'chest'
  | 'crown'
  | 'diamond'
  | 'seven'
  | 'crystal_orb'
  | 'dragon_egg'
  | 'jackpot'
  | 'wild';

export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  assetPath: string;
  /** Standard selection weight (0 if locked behind Level 5 Royal Slots). */
  weight: number;
  /** Selection weight when Level 5+ Royal Slots are active. */
  royalWeight: number;
  /** Multipliers applied to total Bet for 3, 4, or 5 matching symbols on a payline. */
  payouts: {
    3: number;
    4: number;
    5: number;
  };
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isScatter?: boolean;
  isWild?: boolean;
  royalOnly?: boolean;
}

export const SYMBOLS: Record<SymbolId, SymbolDefinition> = {
  cherry: {
    id: 'cherry',
    name: 'Ruby Cherries',
    assetPath: '/assets/symbols/cherry.png',
    weight: 20,
    royalWeight: 14,
    payouts: { 3: 0.6, 4: 1.5, 5: 4 },
    tier: 'common',
  },
  watermelon: {
    id: 'watermelon',
    name: 'Sweet Melon',
    assetPath: '/assets/symbols/watermelon.png',
    weight: 18,
    royalWeight: 13,
    payouts: { 3: 0.8, 4: 2, 5: 5 },
    tier: 'common',
  },
  grapes: {
    id: 'grapes',
    name: 'Royal Grapes',
    assetPath: '/assets/symbols/grapes.png',
    weight: 17,
    royalWeight: 13,
    payouts: { 3: 1, 4: 2.5, 5: 6 },
    tier: 'common',
  },
  clover: {
    id: 'clover',
    name: 'Lucky Clover',
    assetPath: '/assets/symbols/clover.png',
    weight: 14,
    royalWeight: 11,
    payouts: { 3: 1.4, 4: 3.5, 5: 9 },
    tier: 'uncommon',
  },
  bell: {
    id: 'bell',
    name: 'Golden Bell',
    assetPath: '/assets/symbols/bell.png',
    weight: 12,
    royalWeight: 10,
    payouts: { 3: 1.8, 4: 4.5, 5: 12 },
    tier: 'uncommon',
  },
  chest: {
    id: 'chest',
    name: 'Treasure Chest',
    assetPath: '/assets/symbols/chest.png',
    weight: 8,
    royalWeight: 8,
    payouts: { 3: 2, 4: 6, 5: 18 },
    tier: 'rare',
    isScatter: true,
  },
  crown: {
    id: 'crown',
    name: 'Royal Crown',
    assetPath: '/assets/symbols/crown.png',
    weight: 6,
    royalWeight: 7,
    payouts: { 3: 3, 4: 8, 5: 24 },
    tier: 'epic',
  },
  diamond: {
    id: 'diamond',
    name: 'Sky Diamond',
    assetPath: '/assets/symbols/diamond.png',
    weight: 4,
    royalWeight: 6,
    payouts: { 3: 4.5, 4: 12, 5: 35 },
    tier: 'epic',
  },
  seven: {
    id: 'seven',
    name: 'Lucky Red 7',
    assetPath: '/assets/symbols/seven.png',
    weight: 3,
    royalWeight: 5,
    payouts: { 3: 7, 4: 20, 5: 60 },
    tier: 'legendary',
  },
  crystal_orb: {
    id: 'crystal_orb',
    name: 'Mystic Orb',
    assetPath: '/assets/symbols/crystal-orb.png',
    weight: 0,
    royalWeight: 5,
    payouts: { 3: 5, 4: 14, 5: 40 },
    tier: 'epic',
    royalOnly: true,
  },
  dragon_egg: {
    id: 'dragon_egg',
    name: 'Dragon Egg',
    assetPath: '/assets/symbols/dragon-egg.png',
    weight: 0,
    royalWeight: 4,
    payouts: { 3: 6, 4: 18, 5: 50 },
    tier: 'legendary',
    royalOnly: true,
  },
  jackpot: {
    id: 'jackpot',
    name: 'Sunburst Jackpot',
    assetPath: '/assets/symbols/jackpot.png',
    weight: 0,
    royalWeight: 2,
    payouts: { 3: 10, 4: 30, 5: 90 },
    tier: 'legendary',
    royalOnly: true,
  },
  wild: {
    id: 'wild',
    name: 'Rainbow Wild',
    assetPath: '/assets/symbols/wild.png',
    weight: 0,
    royalWeight: 4,
    payouts: { 3: 8, 4: 25, 5: 75 },
    tier: 'legendary',
    isWild: true,
    royalOnly: true,
  },
};

export const SYMBOL_LIST: SymbolDefinition[] = Object.values(SYMBOLS);

/**
 * Initial 5x3 symbol grid matching the exact 15 symbols in Referans UI.PNG
 * (column-major: grid[col][row]).
 */
export const INITIAL_DISPLAY_GRID: SymbolId[][] = [
  ['cherry', 'crown', 'diamond'],
  ['bell', 'chest', 'seven'],
  ['seven', 'clover', 'bell'],
  ['grapes', 'watermelon', 'grapes'],
  ['diamond', 'cherry', 'crown'],
];

export interface PaylineDefinition {
  id: number;
  name: string;
  rows: [number, number, number, number, number];
  color: string;
}

export const PAYLINES: PaylineDefinition[] = [
  { id: 1, name: 'Center Line', rows: [1, 1, 1, 1, 1], color: '#FACC15' },
  { id: 2, name: 'Top Shelf', rows: [0, 0, 0, 0, 0], color: '#38BDF8' },
  { id: 3, name: 'Bottom Counter', rows: [2, 2, 2, 2, 2], color: '#4ADE80' },
  { id: 4, name: 'Royal V', rows: [0, 1, 2, 1, 0], color: '#F472B6' },
  { id: 5, name: 'Golden Arch', rows: [2, 1, 0, 1, 2], color: '#C084FC' },
  { id: 6, name: 'Upper Canopy', rows: [0, 0, 1, 0, 0], color: '#FB923C' },
  { id: 7, name: 'Lower Step', rows: [2, 2, 1, 2, 2], color: '#2DD4BF' },
  { id: 8, name: 'Rising Ribbon', rows: [1, 0, 0, 0, 1], color: '#F87171' },
  { id: 9, name: 'Dipping Ribbon', rows: [1, 2, 2, 2, 1], color: '#A3E635' },
];

export const BET_STEPS = [25, 50, 100, 200, 500, 1000] as const;
export const DEFAULT_BET = 100;

export const UNLOCK_ROYAL_SLOTS_LEVEL = 5;

export interface ShopUpgradeTier {
  level: number;
  name: string;
  description: string;
  upgradeCostGold: number;
  winBonusPct: number;
  dailyBonusGold: number;
  dailyBonusGems: number;
}

export const SHOP_TIERS: ShopUpgradeTier[] = [
  {
    level: 1,
    name: 'Timber Market Stall',
    description: 'A humble wooden booth on Cobblestone Lane.',
    upgradeCostGold: 0,
    winBonusPct: 0,
    dailyBonusGold: 450,
    dailyBonusGems: 3,
  },
  {
    level: 2,
    name: 'Striped Awning Shop',
    description: 'Fresh red-and-cream canvas awning draws curious townsfolk.',
    upgradeCostGold: 600,
    winBonusPct: 5,
    dailyBonusGold: 650,
    dailyBonusGems: 5,
  },
  {
    level: 3,
    name: 'Warm Lantern Emporium',
    description: 'Wrought-iron lanterns keep the reels glowing past dusk.',
    upgradeCostGold: 1200,
    winBonusPct: 12,
    dailyBonusGold: 950,
    dailyBonusGems: 8,
  },
  {
    level: 4,
    name: 'Gilded Velvet Parlor',
    description: 'Polished oak trim and royal purple velvet display cushions.',
    upgradeCostGold: 2400,
    winBonusPct: 20,
    dailyBonusGold: 1400,
    dailyBonusGems: 12,
  },
  {
    level: 5,
    name: 'Clockwork Treasure Bazaar',
    description: 'Precision brass gears and shimmering crystal showcases.',
    upgradeCostGold: 4500,
    winBonusPct: 30,
    dailyBonusGold: 2000,
    dailyBonusGems: 16,
  },
  {
    level: 6,
    name: 'Crown Jewel Pavilion',
    description: 'The premier destination of the entire castle square.',
    upgradeCostGold: 8000,
    winBonusPct: 42,
    dailyBonusGold: 2800,
    dailyBonusGems: 22,
  },
  {
    level: 7,
    name: 'Grand Royal Exchange',
    description: 'Legendary fantasy boutique famed across the kingdom.',
    upgradeCostGold: 14000,
    winBonusPct: 55,
    dailyBonusGold: 4000,
    dailyBonusGems: 30,
  },
];

export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 200;
  if (level === 2) return 300;
  if (level === 3) return 400;
  return 400 + (level - 3) * 200;
}

export function getLevelUpReward(newLevel: number): { gold: number; gems: number } {
  return {
    gold: newLevel * 250,
    gems: 5 + Math.floor(newLevel * 2),
  };
}

export const DAILY_BONUS_COOLDOWN_MS = 12 * 60 * 60 * 1000;

export const GEM_EXCHANGE_PACKS = [
  { id: 'pouch', name: 'Merchant Coin Pouch', gemsCost: 10, goldGranted: 600 },
  { id: 'satchel', name: 'Guild Gold Satchel', gemsCost: 25, goldGranted: 1750 },
  { id: 'coffer', name: 'Royal Vault Coffer', gemsCost: 50, goldGranted: 4000 },
] as const;

export const INITIAL_PLAYER_ECONOMY = {
  gold: 2850,
  gems: 45,
  level: 3,
  xp: 120,
  shopLevel: 2,
} as const;
