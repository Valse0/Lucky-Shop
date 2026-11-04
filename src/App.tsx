import React, { useEffect, useMemo, useState } from 'react';
import {
  BET_STEPS,
  DAILY_BONUS_COOLDOWN_MS,
  SHOP_TIERS,
  SYMBOLS,
  SYMBOL_LIST,
  UNLOCK_ROYAL_SLOTS_LEVEL,
  getXpRequiredForLevel,
} from './game/config';
import { MISSIONS, getMissionMetricValue } from './game/missions';
import {
  SpinOutcome,
  applyXpGain,
  createSpinOutcome,
  validateSpin,
} from './game/slotEngine';
import { soundFx } from './game/sound';
import {
  GameSaveData,
  loadGameSave,
  resetGameSave,
  saveGameData,
} from './game/storage';
import { ActiveSpinRequest, SlotMachine } from './components/SlotMachine';
import { ActiveModalType, GameModals } from './components/GameModals';

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Ready!';
  const totalSec = Math.ceil(msRemaining / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

export function App() {
  const [save, setSave] = useState<GameSaveData>(() => loadGameSave());
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeSpin, setActiveSpin] = useState<ActiveSpinRequest | null>(null);
  const [lastOutcome, setLastOutcome] = useState<SpinOutcome | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [spinCounter, setSpinCounter] = useState(0);

  useEffect(() => {
    saveGameData(save);
    soundFx.setEnabled(save.settings.soundEnabled);
  }, [save]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!feedbackBanner) return;
    const timer = window.setTimeout(() => setFeedbackBanner(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedbackBanner]);

  const currentShop = SHOP_TIERS[Math.min(save.shopLevel - 1, SHOP_TIERS.length - 1)];
  const xpRequired = getXpRequiredForLevel(save.level);
  const xpPct = Math.min(100, Math.max(8, Math.round((save.xp / xpRequired) * 100)));

  const dailyRemainingMs = Math.max(0, save.nextDailyBonusAt - nowMs);
  const dailyBonusReady = dailyRemainingMs === 0;
  const dailyCountdownText = formatCountdown(dailyRemainingMs);

  const claimableMissionsCount = useMemo(() => {
    return MISSIONS.filter((m) => {
      if (save.claimedMissionIds.includes(m.id)) return false;
      return getMissionMetricValue(m.metric, save.stats, save.level) >= m.target;
    }).length;
  }, [save.claimedMissionIds, save.stats, save.level]);

  const winningCellsSet = useMemo(() => {
    if (!lastOutcome || isSpinning) return new Set<string>();
    return new Set(lastOutcome.winningCellsKeySet);
  }, [lastOutcome, isSpinning]);

  const betIndex = BET_STEPS.indexOf(save.bet as (typeof BET_STEPS)[number]);
  const safeBetIndex = betIndex >= 0 ? betIndex : 2;

  const handleAdjustBet = (delta: -1 | 1) => {
    if (isSpinning) return;
    const nextIdx = Math.max(0, Math.min(BET_STEPS.length - 1, safeBetIndex + delta));
    const nextBet = BET_STEPS[nextIdx];
    if (nextBet !== save.bet) {
      soundFx.playClick();
      setSave((prev) => ({ ...prev, bet: nextBet }));
    }
  };

  const handleSpin = () => {
    const check = validateSpin(save.gold, save.bet, isSpinning);
    if (!check.valid) {
      setFeedbackBanner(check.message ?? 'Cannot spin right now.');
      return;
    }

    const royalActive = save.level >= UNLOCK_ROYAL_SLOTS_LEVEL && save.royalModeEnabled;

    const outcome = createSpinOutcome({
      bet: save.bet,
      shopWinBonusPct: currentShop.winBonusPct,
      royalMode: royalActive,
    });

    const nextSpinId = spinCounter + 1;
    setSpinCounter(nextSpinId);
    setIsSpinning(true);
    setFeedbackBanner(null);
    setSave((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold - prev.bet),
      lastWin: 0,
    }));

    soundFx.playSpinStart();
    setActiveSpin({
      spinId: nextSpinId,
      outcome,
      royalMode: royalActive,
    });
  };

  const handleSpinAnimationDone = (outcome: SpinOutcome) => {
    setActiveSpin(null);
    setIsSpinning(false);
    setLastOutcome(outcome);

    if (outcome.totalWin > 0) {
      soundFx.playWin(outcome.isBigWin);
    }

    setSave((prev) => {
      const xpUpdate = applyXpGain(prev.level, prev.xp, outcome.xpEarned);
      const nextGold = Math.max(0, prev.gold + outcome.totalWin + xpUpdate.rewardGold);
      const nextGems = Math.max(0, prev.gems + outcome.gemsFound + xpUpdate.rewardGems);

      const topSymbol =
        outcome.paylineWins[0]?.symbolId ?? outcome.scatterWin?.symbolId ?? null;

      const historyItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        bet: outcome.bet,
        totalWin: outcome.totalWin,
        topSymbol,
        isBigWin: outcome.isBigWin,
      };

      if (xpUpdate.leveledUpCount > 0) {
        setFeedbackBanner(
          `Level Up! Reached Level ${xpUpdate.level} (+${xpUpdate.rewardGold} Gold, +${xpUpdate.rewardGems} Gems)`,
        );
      } else if (outcome.isBigWin) {
        setFeedbackBanner(`Big Win! +${outcome.totalWin.toLocaleString()} Gold!`);
      } else if (outcome.gemsFound > 0) {
        setFeedbackBanner(`+${outcome.gemsFound} Bonus Gems Found!`);
      }

      return {
        ...prev,
        gold: nextGold,
        gems: nextGems,
        level: xpUpdate.level,
        xp: xpUpdate.xp,
        royalModeEnabled:
          xpUpdate.level >= UNLOCK_ROYAL_SLOTS_LEVEL && prev.level < UNLOCK_ROYAL_SLOTS_LEVEL
            ? true
            : prev.royalModeEnabled,
        lastGrid: outcome.grid.map((c) => [...c]),
        lastWin: outcome.totalWin,
        stats: {
          totalSpins: prev.stats.totalSpins + 1,
          winningSpins: prev.stats.winningSpins + (outcome.totalWin > 0 ? 1 : 0),
          shopUpgrades: prev.stats.shopUpgrades,
          bigWins: prev.stats.bigWins + (outcome.isBigWin ? 1 : 0),
          biggestSingleWin: Math.max(prev.stats.biggestSingleWin, outcome.totalWin),
          totalGoldWon: prev.stats.totalGoldWon + outcome.totalWin,
        },
        recentSpins: [historyItem, ...prev.recentSpins].slice(0, 15),
      };
    });
  };

  const handleSpinCancelled = () => {
    setActiveSpin(null);
    setIsSpinning(false);
    setSave((prev) => ({
      ...prev,
      gold: prev.gold + prev.bet,
    }));
  };

  const handleUpgradeShop = () => {
    const nextShop = SHOP_TIERS[save.shopLevel];
    if (!nextShop || save.gold < nextShop.upgradeCostGold) return;
    soundFx.playUpgrade();
    setSave((prev) => {
      const target = SHOP_TIERS[prev.shopLevel];
      if (!target || prev.gold < target.upgradeCostGold) return prev;
      const xpUpdate = applyXpGain(prev.level, prev.xp, 85);
      return {
        ...prev,
        gold: prev.gold - target.upgradeCostGold + xpUpdate.rewardGold,
        gems: prev.gems + xpUpdate.rewardGems,
        level: xpUpdate.level,
        xp: xpUpdate.xp,
        shopLevel: prev.shopLevel + 1,
        stats: {
          ...prev.stats,
          shopUpgrades: prev.stats.shopUpgrades + 1,
        },
      };
    });
    setFeedbackBanner(`Shop upgraded to Lv. ${save.shopLevel + 1}!`);
  };

  const handleClaimDailyBonus = () => {
    if (!dailyBonusReady) return;
    soundFx.playUpgrade();
    const now = Date.now();
    setNowMs(now);
    setSave((prev) => ({
      ...prev,
      gold: prev.gold + currentShop.dailyBonusGold,
      gems: prev.gems + currentShop.dailyBonusGems,
      nextDailyBonusAt: now + DAILY_BONUS_COOLDOWN_MS,
    }));
    setFeedbackBanner(
      `Daily Bonus: +${currentShop.dailyBonusGold.toLocaleString()} Gold & +${currentShop.dailyBonusGems} Gems!`,
    );
  };

  const handleExchangeGems = (gemsCost: number, goldGranted: number) => {
    if (save.gems < gemsCost) return;
    soundFx.playUpgrade();
    setSave((prev) => {
      if (prev.gems < gemsCost) return prev;
      return {
        ...prev,
        gems: prev.gems - gemsCost,
        gold: prev.gold + goldGranted,
      };
    });
    setFeedbackBanner(`+${goldGranted.toLocaleString()} Gold added!`);
  };

  const handleClaimMission = (missionId: string) => {
    const mission = MISSIONS.find((m) => m.id === missionId);
    if (!mission || save.claimedMissionIds.includes(missionId)) return;
    const progress = getMissionMetricValue(mission.metric, save.stats, save.level);
    if (progress < mission.target) return;

    soundFx.playUpgrade();
    setSave((prev) => {
      if (prev.claimedMissionIds.includes(missionId)) return prev;
      const xpUpdate = applyXpGain(prev.level, prev.xp, mission.rewardXp);
      return {
        ...prev,
        gold: prev.gold + mission.rewardGold + xpUpdate.rewardGold,
        gems: prev.gems + mission.rewardGems + xpUpdate.rewardGems,
        level: xpUpdate.level,
        xp: xpUpdate.xp,
        claimedMissionIds: [...prev.claimedMissionIds, missionId],
      };
    });
    setFeedbackBanner(`Mission Claimed: +${mission.rewardGold.toLocaleString()} Gold!`);
  };

  const openModal = (modal: ActiveModalType) => {
    soundFx.playClick();
    setConfirmReset(false);
    setActiveModal(modal);
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#1a0e29] select-none">
      {/* Ambient Full-Screen Town Backdrop Blur for Wide Viewports */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <img
          src="/assets/backgrounds/main-town.png"
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full scale-105 object-cover object-center opacity-40 blur-md"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#170b26]/55 via-[#1c0f2e]/45 to-[#12071d]/80" />
      </div>

      {/* Responsive Container: Desktop Companion Panels + 9:16 Portrait Lucky Shop Stage */}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1380px] items-center justify-center gap-7 px-0 py-0 sm:px-4 sm:py-2 lg:px-8">
        {/* Desktop Left Companion Panel */}
        <aside className="hidden w-[290px] shrink-0 flex-col gap-4 xl:flex">
          <div className="ls-wood-panel rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <img
                src="/assets/icons/shop-upgrade-icon.png"
                alt=""
                referrerPolicy="no-referrer"
                className="h-14 w-14 shrink-0 object-contain drop-shadow"
              />
              <div>
                <div className="text-xs font-semibold text-amber-200/85">
                  Storefront · Lv. {currentShop.level}
                </div>
                <h2 className="font-display text-lg font-bold text-white ls-label-outline">
                  {currentShop.name}
                </h2>
              </div>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-amber-100/85">
              {currentShop.description}
            </p>
            <div className="mt-3.5 border-t border-amber-300/20 pt-3 text-xs text-amber-200">
              <div className="flex items-center justify-between">
                <span>Win Payout Bonus</span>
                <span className="font-num font-bold text-emerald-300">
                  +{currentShop.winBonusPct}%
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span>Daily Gift Chest</span>
                <span className="font-num font-bold text-amber-300">
                  {currentShop.dailyBonusGold.toLocaleString()} Gold
                </span>
              </div>
            </div>
          </div>

          <div className="ls-wood-panel rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-amber-100 ls-label-outline">
                Shop Missions
              </h3>
              <button
                type="button"
                onClick={() => openModal('missions')}
                className="text-xs font-semibold text-amber-300 underline-offset-2 hover:underline"
              >
                Open All
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {MISSIONS.slice(0, 3).map((m) => {
                const val = getMissionMetricValue(m.metric, save.stats, save.level);
                const done = save.claimedMissionIds.includes(m.id);
                const pct = Math.min(100, Math.round((val / m.target) * 100));
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-amber-300/20 bg-[#3a1908]/75 p-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-50">{m.title}</span>
                      <span className="font-num text-amber-300">
                        {done ? 'Done' : `${Math.min(val, m.target)}/${m.target}`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* AUTHENTIC 9:16 PORTRAIT LUCKY SHOP SCREEN */}
        <main className="relative flex min-h-[100dvh] w-full max-w-[440px] flex-col justify-between overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.85)] sm:min-h-0 sm:aspect-[9/16] sm:h-[min(96dvh,850px)] sm:w-auto sm:max-w-none sm:rounded-[30px] sm:border-2 sm:border-amber-300/50">
          {/* Portrait Fantasy Town Background from LuckyShop-AssetPack-v1.zip */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <img
              src="/assets/backgrounds/main-town.png"
              alt="Lucky Shop Fantasy Town"
              referrerPolicy="no-referrer"
              draggable={false}
              className="h-full w-full object-cover object-top"
            />
          </div>

          {/* 1. TOP RESOURCE BAR: Gold Pill + Gem Pill + Settings Gear */}
          <header className="relative z-30 flex items-center justify-between px-3 pt-2.5">
            {/* Gold Bar */}
            <div className="relative flex h-9 items-center">
              <div
                className="relative flex h-8 min-w-[136px] items-center justify-center rounded-full px-8 shadow-md"
                style={{
                  backgroundImage: 'url(/assets/ui/coin-bar.png)',
                  backgroundSize: '100% 100%',
                }}
              >
                <span className="font-num text-[17px] leading-none font-bold tracking-tight text-white ls-purple-outline">
                  {save.gold.toLocaleString()}
                </span>
              </div>
              <img
                src="/assets/icons/coin-icon.png"
                alt="Gold"
                referrerPolicy="no-referrer"
                draggable={false}
                className="pointer-events-none absolute -left-1 h-10 w-10 object-contain drop-shadow"
              />
              <button
                type="button"
                onClick={() => openModal('treasury')}
                aria-label="Exchange Gems for Gold"
                className="absolute -right-1.5 flex h-11 w-11 items-center justify-center transition-transform active:scale-92"
              >
                <img
                  src="/assets/ui/top-plus-button.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="h-9 w-9 object-contain drop-shadow"
                />
              </button>
            </div>

            {/* Gem Bar */}
            <div className="relative flex h-9 items-center">
              <div
                className="relative flex h-8 min-w-[108px] items-center justify-center rounded-full px-7 shadow-md"
                style={{
                  backgroundImage: 'url(/assets/ui/gem-bar.png)',
                  backgroundSize: '100% 100%',
                }}
              >
                <span className="font-num text-[17px] leading-none font-bold tracking-tight text-white ls-purple-outline">
                  {save.gems.toLocaleString()}
                </span>
              </div>
              <img
                src="/assets/icons/gem-icon.png"
                alt="Gems"
                referrerPolicy="no-referrer"
                draggable={false}
                className="pointer-events-none absolute -left-1.5 h-9 w-9 object-contain drop-shadow"
              />
              <button
                type="button"
                onClick={() => openModal('daily')}
                aria-label="Daily Bonus and Gems"
                className="absolute -right-1.5 flex h-11 w-11 items-center justify-center transition-transform active:scale-92"
              >
                <img
                  src="/assets/ui/top-plus-button.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="h-9 w-9 object-contain drop-shadow"
                />
              </button>
            </div>

            {/* Settings Gear Button */}
            <button
              type="button"
              onClick={() => openModal('settings')}
              aria-label="Settings"
              className="flex h-11 w-11 items-center justify-center transition-transform active:scale-92"
            >
              <img
                src="/assets/ui/settings-button.png"
                alt=""
                referrerPolicy="no-referrer"
                draggable={false}
                className="h-10 w-10 object-contain drop-shadow"
              />
            </button>
          </header>

          {/* Transient Status / Win Toast */}
          {feedbackBanner && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute top-[50px] left-1/2 z-40 max-w-[54%] -translate-x-1/2 rounded-full border border-amber-300/90 bg-[#351252]/95 px-2.5 py-0.5 text-center text-[10.5px] leading-tight font-bold text-amber-200 shadow-lg"
            >
              {feedbackBanner}
            </div>
          )}

          {/* 2. INTEGRATED HERO + MASCOT + SIGN + 5x3 SLOT CABINET + BET/SPIN/WIN */}
          <div className="relative z-20 flex flex-1 flex-col justify-center px-1.5">
            {/* Upper Floating Row: Level Shield (Left) | Cat Mascot | Daily Bonus (Right) */}
            <div className="relative z-30 -mb-[21%] flex items-start justify-between px-1.5">
              {/* Left: Wooden Shield Level Badge */}
              <button
                type="button"
                onClick={() => openModal('rewards')}
                className="relative aspect-[904/1119] w-[22.5%] shrink-0 transition-transform active:scale-95"
              >
                <img
                  src="/assets/panels/level-badge.png"
                  alt="Player Level"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="h-full w-full object-contain drop-shadow-md"
                />
                <span className="font-display absolute top-[14%] inset-x-0 text-center text-[12px] leading-none font-bold text-[#ffefc2] ls-label-outline">
                  Level
                </span>
                <span className="font-num absolute top-[28%] inset-x-0 text-center text-[22px] leading-none font-bold text-white ls-label-outline">
                  {save.level}
                </span>
                {/* Dynamic XP Bar overlaid cleanly over the shield's carved bar slot */}
                <div className="absolute top-[58.2%] left-[15.5%] h-[8.5%] w-[69%] overflow-hidden rounded-full bg-[#361605]">
                  <div
                    className="h-full rounded-full bg-gradient-to-b from-[#fef08a] via-[#facc15] to-[#d97706]"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <span className="font-num absolute bottom-[16%] inset-x-0 text-center text-[10px] leading-none font-bold text-white ls-label-outline">
                  {save.xp} / {xpRequired}
                </span>
              </button>

              {/* Center: Ginger Cat Mascot + Lucky Shop Royal Signboard */}
              <div className="relative flex w-[54%] flex-col items-center pt-0.5">
                {/* Cat Mascot peeking behind & above the Lucky Shop sign */}
                <img
                  src="/assets/ui/lucky-shop-cat-mascot.png"
                  alt="Lucky Shop Cat Mascot"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="pointer-events-none relative z-10 w-[68%] object-contain drop-shadow-[0_6px_10px_rgba(20,6,32,0.55)]"
                />

                {/* Royal Purple & Gold Signboard Plate overlapping lower cat paws */}
                <div className="relative z-20 -mt-[42%] aspect-[2042/1008] w-[116%]">
                  <img
                    src="/assets/ui/lucky-shop-title.png"
                    alt=""
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="pointer-events-none h-full w-full object-contain drop-shadow-[0_6px_12px_rgba(22,6,34,0.7)]"
                  />
                  <h1 className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-[8%] leading-none">
                    <span className="ls-brand-word text-[36px] sm:text-[39px] font-bold tracking-tight">
                      Lucky
                    </span>
                    <span className="ls-brand-word -mt-2 text-[31px] sm:text-[34px] font-bold tracking-tight">
                      Shop
                    </span>
                  </h1>
                </div>
              </div>

              {/* Right: Parchment Daily Bonus Card */}
              <button
                type="button"
                onClick={() => openModal('daily')}
                className="relative mt-2 aspect-[935/1039] w-[23%] shrink-0 transition-transform active:scale-95"
              >
                <img
                  src="/assets/panels/daily-bonus.png"
                  alt="Daily Bonus"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="h-full w-full object-contain drop-shadow-md"
                />
                {dailyBonusReady && (
                  <span className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center">
                    <img
                      src="/assets/ui/red-notification-badge.png"
                      alt=""
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                    <span className="font-num relative text-[11px] font-extrabold text-white">
                      !
                    </span>
                  </span>
                )}
                <span className="absolute top-[15%] inset-x-1 text-center text-[10px] leading-tight font-extrabold text-[#47210b]">
                  Daily Bonus
                </span>
                <span
                  className={`font-num absolute bottom-[14%] inset-x-1 text-center text-[11px] leading-none font-extrabold ${
                    dailyBonusReady ? 'text-emerald-800' : 'text-[#3c1a08]'
                  }`}
                >
                  {dailyCountdownText}
                </span>
              </button>
            </div>

            {/* 5x3 Slot Machine Cabinet + Sequential Reels */}
            <div className="relative z-10">
              <SlotMachine
                idleGrid={save.lastGrid}
                activeSpin={activeSpin}
                winningCells={winningCellsSet}
                reducedMotionOverride={save.settings.reducedMotionOverride}
                onReelStop={(reelIdx) => soundFx.playReelStop(reelIdx)}
                onSpinAnimationDone={handleSpinAnimationDone}
                onSpinCancelled={handleSpinCancelled}
              />
            </div>

            {/* Wooden Control Skirt: Bet (- 100 +) | SPIN | Win (0) */}
            <div className="relative z-30 mx-[3.5%] -mt-[4.5%] grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 rounded-b-2xl border-x-[3px] border-b-[3px] border-[#c47a2c] bg-gradient-to-b from-[#7b3e1b] via-[#5e2c11] to-[#461e0a] px-2 py-2 shadow-[0_10px_20px_rgba(12,4,20,0.7)]">
              {/* Left: Bet Panel + High-Res Minus/Plus Buttons */}
              <div
                className="relative flex h-[50px] items-center justify-between rounded-xl px-1"
                style={{
                  backgroundImage: 'url(/assets/panels/win-panel.png)',
                  backgroundSize: '100% 100%',
                }}
              >
                <button
                  type="button"
                  disabled={isSpinning || safeBetIndex <= 0}
                  onClick={() => handleAdjustBet(-1)}
                  aria-label="Decrease Bet"
                  className="-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center transition-transform active:scale-90 disabled:opacity-45"
                >
                  <img
                    src="/assets/ui/bet-minus-button.png"
                    alt=""
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="h-8 w-8 object-contain drop-shadow"
                  />
                </button>

                <div className="flex flex-col items-center justify-center leading-none">
                  <span className="text-[11px] font-bold text-[#ffe8b3] ls-label-outline">
                    Bet
                  </span>
                  <span className="font-num mt-0.5 text-[16px] font-bold text-white ls-label-outline">
                    {save.bet}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSpinning || safeBetIndex >= BET_STEPS.length - 1}
                  onClick={() => handleAdjustBet(1)}
                  aria-label="Increase Bet"
                  className="-mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center transition-transform active:scale-90 disabled:opacity-45"
                >
                  <img
                    src="/assets/ui/bet-plus-button.png"
                    alt=""
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="h-8 w-8 object-contain drop-shadow"
                  />
                </button>
              </div>

              {/* Center: Giant Beveled Purple & Gold SPIN Button */}
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpin}
                className="relative -my-5 flex aspect-[1923/1024] w-[138px] sm:w-[148px] items-center justify-center transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-80"
              >
                <img
                  src="/assets/ui/spin-button.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain drop-shadow-[0_6px_12px_rgba(14,4,26,0.75)]"
                />
                <span className="ls-spin-word relative z-10 text-[29px] sm:text-[31px] font-bold tracking-wider">
                  {isSpinning ? '...' : 'SPIN'}
                </span>
              </button>

              {/* Right: Win Panel */}
              <div
                className="relative flex h-[50px] flex-col items-center justify-center rounded-xl px-2 leading-none"
                style={{
                  backgroundImage: 'url(/assets/panels/win-panel.png)',
                  backgroundSize: '100% 100%',
                }}
              >
                <span className="text-[11px] font-bold text-[#ffe8b3] ls-label-outline">
                  Win
                </span>
                <span
                  className={`font-num mt-0.5 text-[17px] font-bold ls-label-outline ${
                    save.lastWin > 0 ? 'text-emerald-300' : 'text-white'
                  }`}
                >
                  {save.lastWin.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 3. SHOP UPGRADE CARD & REACH LEVEL 5 UNLOCK CARD */}
          <section className="relative z-30 grid grid-cols-2 items-center gap-2 px-3 pb-1">
            {/* Left: Authentic Shop Upgrade Wooden Card */}
            <button
              type="button"
              onClick={() => openModal('shop')}
              className="relative aspect-[2167/759] w-full transition-transform active:scale-97"
            >
              <img
                src="/assets/panels/shop-upgrade-card.png"
                alt="Shop Upgrade"
                referrerPolicy="no-referrer"
                draggable={false}
                className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(12,4,18,0.65)]"
              />
              <div className="pointer-events-none absolute inset-y-0 left-[32%] right-[21%] flex flex-col items-center justify-center leading-[1.08]">
                <span className="font-display text-[12px] sm:text-[13px] font-bold text-white ls-label-outline">
                  Shop
                </span>
                <span className="font-display text-[12px] sm:text-[13px] font-bold text-white ls-label-outline">
                  Upgrade
                </span>
                <span className="font-num mt-0.5 text-[12px] sm:text-[13px] font-bold text-[#ffe599] ls-label-outline">
                  Lv. {save.shopLevel}
                </span>
              </div>
            </button>

            {/* Right: Authentic Parchment Unlock Card */}
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                if (save.level < UNLOCK_ROYAL_SLOTS_LEVEL) {
                  openModal('rewards');
                } else {
                  soundFx.playClick();
                  setSave((prev) => ({
                    ...prev,
                    royalModeEnabled: !prev.royalModeEnabled,
                  }));
                }
              }}
              className="relative aspect-[2116/921] w-full transition-transform active:scale-97"
            >
              <img
                src="/assets/panels/lock-level-card.png"
                alt="Slot Unlock Status"
                referrerPolicy="no-referrer"
                draggable={false}
                className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(12,4,18,0.65)]"
              />
              <div className="pointer-events-none absolute inset-y-0 left-[30%] right-[7%] flex flex-col items-center justify-center text-center leading-tight">
                {save.level < UNLOCK_ROYAL_SLOTS_LEVEL ? (
                  <span className="text-[10.5px] sm:text-[11.5px] font-extrabold text-[#47210b]">
                    Reach Level {UNLOCK_ROYAL_SLOTS_LEVEL} to unlock new slots!
                  </span>
                ) : (
                  <>
                    <span className="font-display text-[12px] font-bold text-[#3f1907]">
                      Royal Slots
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-800">
                      {save.royalModeEnabled ? 'Active · Tap to Toggle' : 'Unlocked · Tap On'}
                    </span>
                  </>
                )}
              </div>
            </button>
          </section>

          {/* 4. BOTTOM NAVIGATION BAR: Missions | Rewards | Leaderboard */}
          <nav
            aria-label="Bottom Navigation"
            className="relative z-30 aspect-[5165/744] w-full shrink-0"
          >
            <img
              src="/assets/ui/bottom-nav-bar.png"
              alt=""
              referrerPolicy="no-referrer"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-fill drop-shadow-[0_-4px_12px_rgba(14,5,26,0.65)]"
            />
            <div className="relative z-10 grid h-full w-full grid-cols-3">
              <button
                type="button"
                onClick={() => openModal('missions')}
                className="relative flex flex-col items-center justify-end pb-[7%] transition-opacity active:opacity-80"
              >
                {claimableMissionsCount > 0 && (
                  <span className="font-num pointer-events-none absolute top-[10%] right-[24%] rounded-full bg-rose-600 px-1.5 text-[10px] font-extrabold text-white shadow">
                    {claimableMissionsCount}
                  </span>
                )}
                <span className="font-display whitespace-nowrap text-[12px] sm:text-[13px] font-bold text-white ls-purple-outline">
                  Missions
                </span>
              </button>

              <button
                type="button"
                onClick={() => openModal('rewards')}
                className="flex flex-col items-center justify-end pb-[7%] transition-opacity active:opacity-80"
              >
                <span className="font-display whitespace-nowrap text-[12px] sm:text-[13px] font-bold text-white ls-purple-outline">
                  Rewards
                </span>
              </button>

              <button
                type="button"
                onClick={() => openModal('leaderboard')}
                className="flex flex-col items-center justify-end pb-[7%] transition-opacity active:opacity-80"
              >
                <span className="font-display whitespace-nowrap text-[12px] sm:text-[13px] font-bold text-white ls-purple-outline">
                  Leaderboard
                </span>
              </button>
            </div>
          </nav>
        </main>

        {/* Desktop Right Companion Panel */}
        <aside className="hidden w-[290px] shrink-0 flex-col gap-4 xl:flex">
          <div className="ls-wood-panel rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-amber-100 ls-label-outline">
                Top Symbols
              </h3>
              <button
                type="button"
                onClick={() => openModal('rewards')}
                className="text-xs font-semibold text-amber-300 underline-offset-2 hover:underline"
              >
                Full Paytable
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {SYMBOL_LIST.filter((s) => !s.royalOnly)
                .reverse()
                .slice(0, 5)
                .map((sym) => (
                  <div
                    key={sym.id}
                    className="flex items-center justify-between rounded-xl border border-amber-300/20 bg-[#3a1908]/75 px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={sym.assetPath}
                        alt={sym.name}
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 object-contain"
                      />
                      <span className="text-xs font-semibold text-amber-50">
                        {sym.name}
                      </span>
                    </div>
                    <span className="font-num text-xs font-bold text-amber-300">
                      5× · {sym.payouts[5]}x
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="ls-wood-panel rounded-3xl p-5">
            <h3 className="font-display text-base font-bold text-amber-100 ls-label-outline">
              Recent Spin Log
            </h3>
            {save.recentSpins.length === 0 ? (
              <p className="mt-2 text-xs text-amber-100/75">
                Press SPIN to begin recording outcomes here.
              </p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {save.recentSpins.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-amber-300/15 bg-[#3a1908]/75 px-3 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {item.topSymbol ? (
                        <img
                          src={SYMBOLS[item.topSymbol]?.assetPath ?? SYMBOLS.cherry.assetPath}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <span className="inline-block h-5 w-5 text-center text-amber-200/50">
                          –
                        </span>
                      )}
                      <span className="text-amber-100/85">
                        Bet <strong className="font-num">{item.bet}</strong>
                      </span>
                    </div>
                    <span
                      className={`font-num font-bold ${
                        item.totalWin > 0 ? 'text-emerald-300' : 'text-amber-200/55'
                      }`}
                    >
                      {item.totalWin > 0 ? `+${item.totalWin.toLocaleString()}` : '0'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <GameModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        gold={save.gold}
        gems={save.gems}
        level={save.level}
        shopLevel={save.shopLevel}
        dailyBonusReady={dailyBonusReady}
        dailyCountdownText={dailyCountdownText}
        claimedMissionIds={save.claimedMissionIds}
        stats={save.stats}
        recentSpins={save.recentSpins}
        soundEnabled={save.settings.soundEnabled}
        reducedMotionOverride={save.settings.reducedMotionOverride}
        confirmReset={confirmReset}
        setConfirmReset={setConfirmReset}
        onUpgradeShop={handleUpgradeShop}
        onClaimDailyBonus={handleClaimDailyBonus}
        onExchangeGems={handleExchangeGems}
        onClaimMission={handleClaimMission}
        onToggleSound={() =>
          setSave((prev) => ({
            ...prev,
            settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
          }))
        }
        onToggleReducedMotion={() =>
          setSave((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              reducedMotionOverride: !prev.settings.reducedMotionOverride,
            },
          }))
        }
        onResetSave={() => {
          const fresh = resetGameSave();
          setSave(fresh);
          setLastOutcome(null);
          setConfirmReset(false);
          setActiveModal(null);
          setFeedbackBanner('Progress reset to initial Lucky Shop state.');
        }}
      />
    </div>
  );
}

export default App;
