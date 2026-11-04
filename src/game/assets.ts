/**
 * Centralized Vite-bundled game asset registry.
 *
 * Importing every asset through static ES module imports ensures Vite emits
 * content-hashed filenames (`dist/assets/<name>-<hash>.webp`) during production
 * builds. This prevents Cloud CDN, reverse proxies, and mobile/desktop browsers
 * from serving stale unhashed `/assets/...` files after publishing updates.
 */

// Backgrounds
import mainTownBg from '../assets/game/backgrounds/main-town-v3.webp';

// Effects
import reelStopSparkleFx from '../assets/game/effects/reel-stop-sparkle-v3.webp';
import winGlowFx from '../assets/game/effects/win-glow-v3.webp';

// Icons
import coinIcon from '../assets/game/icons/coin-icon-v3.webp';
import gemIcon from '../assets/game/icons/gem-icon-v3.webp';
import greenArrowUpIcon from '../assets/game/icons/green-arrow-up-v3.webp';
import leaderboardIcon from '../assets/game/icons/leaderboard-icon-v3.webp';
import padlockIcon from '../assets/game/icons/padlock-icon-v3.webp';
import shopUpgradeIcon from '../assets/game/icons/shop-upgrade-icon-v3.webp';
import starIcon from '../assets/game/icons/star-icon-v3.webp';
import trophyIcon from '../assets/game/icons/trophy-icon-v3.webp';

// Panels & Slot Cabinet
import betPanel from '../assets/game/panels/bet-panel-v3.webp';
import dailyBonusPanel from '../assets/game/panels/daily-bonus-v3.webp';
import levelBadgePanel from '../assets/game/panels/level-badge-v3.webp';
import lockLevelCardPanel from '../assets/game/panels/lock-level-card-v3.webp';
import parchmentPanel from '../assets/game/panels/parchment-panel-v3.webp';
import reelBackgroundPanel from '../assets/game/panels/reel-background-v3.webp';
import shopUpgradeCardPanel from '../assets/game/panels/shop-upgrade-card-v3.webp';
import slotMachineOuterFramePanel from '../assets/game/panels/slot-machine-outer-frame-v3.webp';
import winPanel from '../assets/game/panels/win-panel-v3.webp';

// UI Controls, Signboard, Mascot & Awning
import betMinusButtonUi from '../assets/game/ui/bet-minus-button-v3.webp';
import betPlusButtonUi from '../assets/game/ui/bet-plus-button-v3.webp';
import bottomNavBarUi from '../assets/game/ui/bottom-nav-bar-v3.webp';
import coinBarUi from '../assets/game/ui/coin-bar-v3.webp';
import gemBarUi from '../assets/game/ui/gem-bar-v3.webp';
import luckyShopCatMascotUi from '../assets/game/ui/lucky-shop-cat-mascot-v3.webp';
import luckyShopTitleUi from '../assets/game/ui/lucky-shop-title-v3.webp';
import redNotificationBadgeUi from '../assets/game/ui/red-notification-badge-v3.webp';
import settingsButtonUi from '../assets/game/ui/settings-button-v3.webp';
import shopRoofAwningUi from '../assets/game/ui/shop-roof-awning-v3.webp';
import spinButtonUi from '../assets/game/ui/spin-button-v3.webp';
import topPlusButtonUi from '../assets/game/ui/top-plus-button-v3.webp';

// Slot Symbols
import bellSymbol from '../assets/game/symbols/bell-v3.webp';
import cherrySymbol from '../assets/game/symbols/cherry-v3.webp';
import chestSymbol from '../assets/game/symbols/chest-v3.webp';
import cloverSymbol from '../assets/game/symbols/clover-v3.webp';
import crownSymbol from '../assets/game/symbols/crown-v3.webp';
import crystalOrbSymbol from '../assets/game/symbols/crystal-orb-v3.webp';
import diamondSymbol from '../assets/game/symbols/diamond-v3.webp';
import dragonEggSymbol from '../assets/game/symbols/dragon-egg-v3.webp';
import grapesSymbol from '../assets/game/symbols/grapes-v3.webp';
import jackpotSymbol from '../assets/game/symbols/jackpot-v3.webp';
import sevenSymbol from '../assets/game/symbols/seven-v3.webp';
import watermelonSymbol from '../assets/game/symbols/watermelon-v3.webp';
import wildSymbol from '../assets/game/symbols/wild-v3.webp';

export const GAME_ASSETS = {
  backgrounds: {
    mainTown: mainTownBg,
  },
  effects: {
    reelStopSparkle: reelStopSparkleFx,
    winGlow: winGlowFx,
  },
  icons: {
    coin: coinIcon,
    gem: gemIcon,
    greenArrowUp: greenArrowUpIcon,
    leaderboard: leaderboardIcon,
    padlock: padlockIcon,
    shopUpgrade: shopUpgradeIcon,
    star: starIcon,
    trophy: trophyIcon,
  },
  panels: {
    bet: betPanel,
    dailyBonus: dailyBonusPanel,
    levelBadge: levelBadgePanel,
    lockLevelCard: lockLevelCardPanel,
    parchment: parchmentPanel,
    reelBackground: reelBackgroundPanel,
    shopUpgradeCard: shopUpgradeCardPanel,
    slotMachineOuterFrame: slotMachineOuterFramePanel,
    win: winPanel,
  },
  ui: {
    betMinusButton: betMinusButtonUi,
    betPlusButton: betPlusButtonUi,
    bottomNavBar: bottomNavBarUi,
    coinBar: coinBarUi,
    gemBar: gemBarUi,
    luckyShopCatMascot: luckyShopCatMascotUi,
    luckyShopTitle: luckyShopTitleUi,
    redNotificationBadge: redNotificationBadgeUi,
    settingsButton: settingsButtonUi,
    shopRoofAwning: shopRoofAwningUi,
    spinButton: spinButtonUi,
    topPlusButton: topPlusButtonUi,
  },
  symbols: {
    bell: bellSymbol,
    cherry: cherrySymbol,
    chest: chestSymbol,
    clover: cloverSymbol,
    crown: crownSymbol,
    crystalOrb: crystalOrbSymbol,
    diamond: diamondSymbol,
    dragonEgg: dragonEggSymbol,
    grapes: grapesSymbol,
    jackpot: jackpotSymbol,
    seven: sevenSymbol,
    watermelon: watermelonSymbol,
    wild: wildSymbol,
  },
} as const;
