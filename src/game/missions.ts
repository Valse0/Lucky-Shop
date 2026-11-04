export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardGold: number;
  rewardGems: number;
  rewardXp: number;
  metric: 'totalSpins' | 'winningSpins' | 'shopUpgrades' | 'bigWins' | 'playerLevel';
}

export const MISSIONS: MissionDefinition[] = [
  {
    id: 'spin-5',
    title: 'Morning Rush',
    description: 'Spin the Lucky Shop reels 5 times.',
    target: 5,
    rewardGold: 500,
    rewardGems: 5,
    rewardXp: 60,
    metric: 'totalSpins',
  },
  {
    id: 'win-3',
    title: 'Happy Customers',
    description: 'Land 3 winning combinations on any payline.',
    target: 3,
    rewardGold: 750,
    rewardGems: 8,
    rewardXp: 90,
    metric: 'winningSpins',
  },
  {
    id: 'upgrade-shop-1',
    title: 'Fresh Paint & Lanterns',
    description: 'Upgrade your Shop at least 1 time.',
    target: 1,
    rewardGold: 1000,
    rewardGems: 10,
    rewardXp: 120,
    metric: 'shopUpgrades',
  },
  {
    id: 'big-win-1',
    title: 'Jackpot Window Display',
    description: 'Score a Big Win (4x your bet or higher).',
    target: 1,
    rewardGold: 1500,
    rewardGems: 15,
    rewardXp: 160,
    metric: 'bigWins',
  },
  {
    id: 'reach-lv-5',
    title: 'Master Shopkeeper',
    description: 'Reach Player Level 5 to unlock Royal Workshop Reels.',
    target: 5,
    rewardGold: 2500,
    rewardGems: 25,
    rewardXp: 250,
    metric: 'playerLevel',
  },
  {
    id: 'spin-25',
    title: 'Festival Crowd',
    description: 'Complete 25 total spins in your shop.',
    target: 25,
    rewardGold: 2200,
    rewardGems: 20,
    rewardXp: 220,
    metric: 'totalSpins',
  },
];

export interface PlayerStats {
  totalSpins: number;
  winningSpins: number;
  shopUpgrades: number;
  bigWins: number;
  biggestSingleWin: number;
  totalGoldWon: number;
}

export function getMissionMetricValue(
  metric: MissionDefinition['metric'],
  stats: PlayerStats,
  playerLevel: number,
): number {
  if (metric === 'playerLevel') return playerLevel;
  return stats[metric];
}
