import React from 'react';
import { X, Volume2, VolumeX, RotateCcw, Sparkles, Check } from 'lucide-react';
import {
  GEM_EXCHANGE_PACKS,
  PAYLINES,
  SHOP_TIERS,
  SYMBOL_LIST,
  UNLOCK_ROYAL_SLOTS_LEVEL,
} from '../game/config';
import { MISSIONS, PlayerStats, getMissionMetricValue } from '../game/missions';
import { SpinHistoryEntry } from '../game/storage';

export type ActiveModalType =
  | null
  | 'shop'
  | 'daily'
  | 'treasury'
  | 'missions'
  | 'rewards'
  | 'leaderboard'
  | 'settings';

interface GameModalsProps {
  activeModal: ActiveModalType;
  onClose: () => void;
  gold: number;
  gems: number;
  level: number;
  shopLevel: number;
  dailyBonusReady: boolean;
  dailyCountdownText: string;
  claimedMissionIds: string[];
  stats: PlayerStats;
  recentSpins: SpinHistoryEntry[];
  soundEnabled: boolean;
  reducedMotionOverride: boolean;
  confirmReset: boolean;
  setConfirmReset: (v: boolean) => void;
  onUpgradeShop: () => void;
  onClaimDailyBonus: () => void;
  onExchangeGems: (gemsCost: number, goldGranted: number) => void;
  onClaimMission: (missionId: string) => void;
  onToggleSound: () => void;
  onToggleReducedMotion: () => void;
  onResetSave: () => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  activeModal,
  onClose,
  gold,
  gems,
  level,
  shopLevel,
  dailyBonusReady,
  dailyCountdownText,
  claimedMissionIds,
  stats,
  recentSpins,
  soundEnabled,
  reducedMotionOverride,
  confirmReset,
  setConfirmReset,
  onUpgradeShop,
  onClaimDailyBonus,
  onExchangeGems,
  onClaimMission,
  onToggleSound,
  onToggleReducedMotion,
  onResetSave,
}) => {
  if (!activeModal) return null;

  const currentShop = SHOP_TIERS[Math.min(shopLevel - 1, SHOP_TIERS.length - 1)];
  const nextShop = SHOP_TIERS[shopLevel] ?? null;

  const titles: Record<Exclude<ActiveModalType, null>, string> = {
    shop: 'Shop Upgrade',
    daily: 'Daily Bonus',
    treasury: 'Merchant Gem Exchange',
    missions: 'Missions',
    rewards: 'Rewards & Paytable',
    leaderboard: 'Leaderboard (Offline Records)',
    settings: 'Settings',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titles[activeModal]}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="ls-wood-panel relative flex max-h-[86dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl text-[#fff8eb]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amber-300/25 bg-[#3d1c0a]/85 px-5 py-3.5">
          <h2 className="font-display text-lg font-bold tracking-wide text-amber-200 ls-label-outline">
            {titles[activeModal]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/40 bg-[#5b290e] text-amber-100 transition-transform active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {activeModal === 'shop' && (
            <>
              <div className="ls-parchment-card flex items-center gap-3.5 rounded-2xl p-4 text-[#422006]">
                <img
                  src="/assets/icons/shop-upgrade-icon.png"
                  alt="Lucky Shop Building"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 shrink-0 object-contain drop-shadow"
                />
                <div>
                  <div className="text-xs font-bold text-[#7c3f12]">
                    Current Shop · Lv. {currentShop.level}
                  </div>
                  <div className="font-display text-lg font-bold">{currentShop.name}</div>
                  <p className="mt-0.5 text-xs text-[#5c2d0c]">{currentShop.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-[#6b340e]">
                    <span>Win Bonus: +{currentShop.winBonusPct}%</span>
                    <span aria-hidden="true">·</span>
                    <span>Daily Gift: {currentShop.dailyBonusGold.toLocaleString()} Gold</span>
                  </div>
                </div>
              </div>

              {nextShop ? (
                <div className="rounded-2xl border border-amber-300/35 bg-[#381908]/85 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-200/90">
                      Next Tier · Lv. {nextShop.level}
                    </span>
                    <span className="font-num text-sm font-bold text-amber-300">
                      {nextShop.upgradeCostGold.toLocaleString()} Gold
                    </span>
                  </div>
                  <div className="font-display mt-1 text-base font-bold text-white">
                    {nextShop.name}
                  </div>
                  <p className="mt-1 text-xs text-amber-100/85">{nextShop.description}</p>
                  <div className="mt-2 text-xs text-emerald-300">
                    Boosts slot payouts to +{nextShop.winBonusPct}% and Daily Gift to{' '}
                    {nextShop.dailyBonusGold.toLocaleString()} Gold · {nextShop.dailyBonusGems} Gems
                  </div>

                  <button
                    type="button"
                    disabled={gold < nextShop.upgradeCostGold}
                    onClick={onUpgradeShop}
                    className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-lime-300 bg-gradient-to-b from-emerald-400 to-green-700 px-4 py-2.5 font-display text-base font-bold text-white shadow-md transition-transform active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <img
                      src="/assets/icons/green-arrow-up.png"
                      alt=""
                      className="h-5 w-5 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="whitespace-nowrap">
                      Upgrade to Lv. {nextShop.level} ({nextShop.upgradeCostGold.toLocaleString()} Gold)
                    </span>
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-300/40 bg-[#381908]/85 p-4 text-center text-sm text-amber-200">
                  Your shop has reached the maximum Grand Royal Exchange tier!
                </div>
              )}
            </>
          )}

          {activeModal === 'daily' && (
            <div className="ls-parchment-card flex flex-col items-center rounded-2xl p-5 text-center text-[#422006]">
              <img
                src="/assets/panels/daily-bonus.png"
                alt="Daily Bonus Chest"
                className="h-28 w-28 object-contain drop-shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="font-display mt-2 text-xl font-bold">
                Shopkeeper&apos;s Daily Gift
              </div>
              <p className="mt-1 text-xs text-[#6b340e]">
                Scaled by {currentShop.name} (Lv. {currentShop.level}) · Local device clock
              </p>
              <div className="font-num mt-3 flex items-center gap-2 text-base font-bold text-[#7c2d12]">
                <img src="/assets/icons/coin-icon.png" alt="" className="h-5 w-5" />
                <span>+{currentShop.dailyBonusGold.toLocaleString()}</span>
                <span aria-hidden="true">·</span>
                <img src="/assets/icons/gem-icon.png" alt="" className="h-5 w-5" />
                <span>+{currentShop.dailyBonusGems}</span>
              </div>

              <button
                type="button"
                disabled={!dailyBonusReady}
                onClick={onClaimDailyBonus}
                className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-amber-200 bg-gradient-to-b from-amber-400 to-amber-600 px-4 py-2 font-display text-base font-bold text-[#3b1505] shadow-md transition-transform active:scale-98 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {dailyBonusReady ? 'Claim Daily Bonus' : `Next Gift in ${dailyCountdownText}`}
              </button>
            </div>
          )}

          {activeModal === 'treasury' && (
            <div className="space-y-3">
              <p className="text-xs text-amber-100/85">
                Trade earned fantasy Gems for Gold coin pouches. In-game progression currency only.
              </p>
              {GEM_EXCHANGE_PACKS.map((pack) => {
                const canAfford = gems >= pack.gemsCost;
                return (
                  <div
                    key={pack.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-[#3a1908]/85 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src="/assets/icons/coin-icon.png"
                        alt=""
                        className="h-9 w-9 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-display text-base font-bold text-amber-100">
                          {pack.name}
                        </div>
                        <div className="font-num text-xs text-amber-300">
                          +{pack.goldGranted.toLocaleString()} Gold
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onExchangeGems(pack.gemsCost, pack.goldGranted)}
                      className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-fuchsia-300/60 bg-gradient-to-b from-purple-500 to-purple-800 px-3.5 py-2 font-num text-xs font-bold text-white shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <img
                        src="/assets/icons/gem-icon.png"
                        alt=""
                        className="h-4 w-4 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="whitespace-nowrap">{pack.gemsCost}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeModal === 'missions' && (
            <div className="space-y-3">
              {MISSIONS.map((m) => {
                const progress = getMissionMetricValue(m.metric, stats, level);
                const claimed = claimedMissionIds.includes(m.id);
                const completed = progress >= m.target;
                const pct = Math.min(100, Math.round((progress / m.target) * 100));

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-amber-300/30 bg-[#3a1908]/85 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-display text-base font-bold text-amber-100">
                          {m.title}
                        </div>
                        <p className="text-xs text-amber-100/80">{m.description}</p>
                      </div>
                      <span className="font-num shrink-0 text-xs font-semibold text-amber-300">
                        {Math.min(progress, m.target)} / {m.target}
                      </span>
                    </div>

                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#210d04]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-lime-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-num text-xs text-amber-200/90">
                        +{m.rewardGold.toLocaleString()} Gold · +{m.rewardGems} Gems
                      </span>

                      {claimed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                          <Check className="h-4 w-4" /> Claimed
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!completed}
                          onClick={() => onClaimMission(m.id)}
                          className="min-h-[40px] rounded-xl border border-lime-300/70 bg-gradient-to-b from-emerald-400 to-green-700 px-3.5 py-1.5 font-display text-xs font-bold text-white shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Claim Reward
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeModal === 'rewards' && (
            <div className="space-y-4">
              <div className="ls-parchment-card rounded-2xl p-3.5 text-[#422006]">
                <div className="flex items-center gap-2 font-display text-sm font-bold">
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  <span>
                    Level {UNLOCK_ROYAL_SLOTS_LEVEL} Unlock · Special Royal Symbols
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5c2d0c]">
                  {level >= UNLOCK_ROYAL_SLOTS_LEVEL
                    ? 'Unlocked! Rainbow Wild, Sunburst Jackpot, Dragon Egg, and Mystic Orb symbols can now join your reels.'
                    : `Reach Level ${UNLOCK_ROYAL_SLOTS_LEVEL} (currently Level ${level}) to unlock Rainbow Wild, Sunburst Jackpot, Dragon Egg, and Mystic Orb symbols!`}
                </p>
              </div>

              <div>
                <h3 className="font-display mb-2 text-sm font-bold text-amber-200">
                  Symbol Paytable (Multipliers of Bet)
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {[...SYMBOL_LIST].reverse().map((sym) => (
                    <div
                      key={sym.id}
                      className="flex items-center justify-between rounded-xl border border-amber-300/25 bg-[#381808]/85 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={sym.assetPath}
                          alt={sym.name}
                          className="h-10 w-10 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="text-sm font-semibold text-amber-50">
                            {sym.name}
                            {sym.royalOnly ? ' (Lv.5+)' : ''}
                          </div>
                          <div className="text-[11px] text-amber-200/75">
                            {sym.isScatter
                              ? 'Scatter · Pays anywhere on grid'
                              : sym.isWild
                                ? 'Wild · Substitutes on any payline'
                                : `${PAYLINES.length} left-to-right paylines`}
                          </div>
                        </div>
                      </div>
                      <div className="font-num text-right text-xs text-amber-300">
                        <div>3× · {sym.payouts[3]}x</div>
                        <div>4× · {sym.payouts[4]}x</div>
                        <div className="font-bold text-amber-200">5× · {sym.payouts[5]}x</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeModal === 'leaderboard' && (
            <div className="space-y-4">
              <div className="ls-parchment-card rounded-2xl p-3.5 text-xs text-[#422006]">
                <strong className="font-display text-sm">Local / Offline Record Book</strong>
                <p className="mt-0.5 text-[#5c2d0c]">
                  Lucky Shop runs locally offline without a remote leaderboard server. Your personal records on this device are tracked below.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-amber-300/30 bg-[#381808]/85 p-3">
                  <div className="text-xs text-amber-200/80">Biggest Single Win</div>
                  <div className="font-num mt-1 text-lg font-bold text-amber-300">
                    {stats.biggestSingleWin.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-300/30 bg-[#381808]/85 p-3">
                  <div className="text-xs text-amber-200/80">Total Gold Won</div>
                  <div className="font-num mt-1 text-lg font-bold text-emerald-300">
                    {stats.totalGoldWon.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-300/30 bg-[#381808]/85 p-3">
                  <div className="text-xs text-amber-200/80">Total Spins</div>
                  <div className="font-num mt-1 text-lg font-bold text-white">
                    {stats.totalSpins.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-300/30 bg-[#381808]/85 p-3">
                  <div className="text-xs text-amber-200/80">Winning Spins</div>
                  <div className="font-num mt-1 text-lg font-bold text-amber-200">
                    {stats.winningSpins.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display mb-2 text-sm font-bold text-amber-200">
                  Recent Spins
                </h3>
                {recentSpins.length === 0 ? (
                  <div className="rounded-xl border border-amber-300/20 bg-[#381808]/60 p-4 text-center text-xs text-amber-100/75">
                    No spins recorded yet. Press SPIN to play!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {recentSpins.slice(0, 8).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-xl border border-amber-300/20 bg-[#381808]/80 px-3 py-2 text-xs"
                      >
                        <span className="text-amber-100/85">
                          Bet <strong className="font-num">{entry.bet}</strong>
                          {entry.isBigWin ? ' · Big Win!' : ''}
                        </span>
                        <span
                          className={`font-num font-bold ${
                            entry.totalWin > 0 ? 'text-emerald-300' : 'text-amber-200/60'
                          }`}
                        >
                          {entry.totalWin > 0
                            ? `+${entry.totalWin.toLocaleString()} Gold`
                            : '0 Gold'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeModal === 'settings' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={onToggleSound}
                className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-amber-300/30 bg-[#381808]/85 px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-amber-300" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-amber-200/60" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">Sound Effects</div>
                    <div className="text-xs text-amber-200/75">
                      Reel stop chimes and celebration melodies
                    </div>
                  </div>
                </div>
                <span className="font-num text-xs font-bold text-amber-300">
                  {soundEnabled ? 'On' : 'Muted'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleReducedMotion}
                className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-amber-300/30 bg-[#381808]/85 px-4 py-3 text-left"
              >
                <div>
                  <div className="text-sm font-semibold text-white">Reduced Reel Motion</div>
                  <div className="text-xs text-amber-200/75">
                    Shorter spin travel while preserving sequential stops
                  </div>
                </div>
                <span className="font-num text-xs font-bold text-amber-300">
                  {reducedMotionOverride ? 'Enabled' : 'Standard'}
                </span>
              </button>

              <div className="rounded-2xl border border-rose-400/35 bg-[#381808]/85 p-4">
                <div className="text-sm font-semibold text-rose-200">Reset Local Save</div>
                <p className="mt-0.5 text-xs text-amber-100/75">
                  Restores starting Gold (2,850), Gems (45), Level 3, and Shop Lv. 2.
                </p>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-300/50 bg-rose-900/70 px-4 py-2 text-xs font-bold text-rose-100 active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset Progress
                  </button>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onResetSave}
                      className="min-h-[44px] rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white active:scale-95"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="min-h-[44px] rounded-xl border border-amber-300/40 px-4 py-2 text-xs font-semibold text-amber-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
