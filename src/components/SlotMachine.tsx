import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  GRID_COLS,
  GRID_ROWS,
  SYMBOLS,
  SymbolId,
} from '../game/config';
import { SpinOutcome, pickWeightedSymbol } from '../game/slotEngine';
import { SlotSpinCancelledError, animateSlotReels } from '../slot/slotMotion';

export interface ActiveSpinRequest {
  spinId: number;
  outcome: SpinOutcome;
  royalMode: boolean;
}

interface SlotMachineProps {
  idleGrid: SymbolId[][];
  activeSpin: ActiveSpinRequest | null;
  winningCells: Set<string>;
  reducedMotionOverride: boolean;
  onReelStop?: (reelIndex: number) => void;
  onSpinAnimationDone: (outcome: SpinOutcome) => void;
  onSpinCancelled: () => void;
}

/**
 * Exact measured horizontal positions (%) of the 5 cream reel windows
 * inside `/assets/panels/slot-machine-outer-frame.png` (1514 x 1285).
 */
const REEL_WINDOWS = [
  { left: '8.20%', width: '14.35%' },
  { left: '25.18%', width: '14.46%' },
  { left: '42.20%', width: '14.48%' },
  { left: '59.18%', width: '14.42%' },
  { left: '76.10%', width: '14.46%' },
] as const;

export const SlotMachine: React.FC<SlotMachineProps> = ({
  idleGrid,
  activeSpin,
  winningCells,
  reducedMotionOverride,
  onReelStop,
  onSpinAnimationDone,
  onSpinCancelled,
}) => {
  const viewportRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trackRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [cellHeight, setCellHeight] = useState<number>(72);
  const [settlingReels, setSettlingReels] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [sparklingReels, setSparklingReels] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  const [reelStrips, setReelStrips] = useState<SymbolId[][]>(() =>
    idleGrid.map((col) => [...col]),
  );

  useLayoutEffect(() => {
    if (!activeSpin) {
      setReelStrips(idleGrid.map((col) => [...col]));
      trackRefs.current.forEach((track) => {
        if (track) {
          track.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    }
  }, [idleGrid, activeSpin]);

  useEffect(() => {
    const firstViewport = viewportRefs.current[0];
    if (!firstViewport) return;

    const measure = () => {
      const h = firstViewport.clientHeight;
      if (h > 30) {
        setCellHeight(h / GRID_ROWS);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(firstViewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeSpin) return;

    const prefersReduced =
      reducedMotionOverride ||
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

    const spinStepCounts = Array.from({ length: GRID_COLS }, (_, colIdx) =>
      prefersReduced ? 6 : 16 + colIdx * 4,
    );

    const nextStrips: SymbolId[][] = Array.from({ length: GRID_COLS }, (_, colIdx) => {
      const startVisible = idleGrid[colIdx] ?? ['cherry', 'bell', 'seven'];
      const fillerLength = spinStepCounts[colIdx] - GRID_ROWS;
      const filler = Array.from({ length: Math.max(0, fillerLength) }, () =>
        pickWeightedSymbol(Math.random, activeSpin.royalMode),
      );
      const targetOutcomeCol = activeSpin.outcome.grid[colIdx];
      return [...startVisible, ...filler, ...targetOutcomeCol];
    });

    setSettlingReels([false, false, false, false, false]);
    setSparklingReels([false, false, false, false, false]);
    setReelStrips(nextStrips);

    const controller = new AbortController();
    const timers: number[] = [];

    const rafId = window.requestAnimationFrame(async () => {
      const tracks = trackRefs.current;
      if (tracks.some((t) => !t)) {
        onSpinAnimationDone(activeSpin.outcome);
        return;
      }

      const measuredHeight =
        (viewportRefs.current[0]?.clientHeight ?? cellHeight * GRID_ROWS) / GRID_ROWS;

      tracks.forEach((track) => {
        if (track) track.style.transform = 'translate3d(0, 0, 0)';
      });

      try {
        await animateSlotReels(
          Array.from({ length: GRID_COLS }, (_, idx) => {
            const offsetPx = spinStepCounts[idx] * measuredHeight;
            return {
              track: tracks[idx] as HTMLElement,
              travelDistancePx: offsetPx,
              finalOffsetPx: offsetPx,
            };
          }),
          {
            baseDurationMs: prefersReduced ? 450 : 1720,
            stopGapMs: prefersReduced ? 95 : 250,
            signal: controller.signal,
            onReelStop: (reelIdx) => {
              onReelStop?.(reelIdx);
              if (!prefersReduced) {
                setSettlingReels((prev) => {
                  const copy = [...prev];
                  copy[reelIdx] = true;
                  return copy;
                });
                setSparklingReels((prev) => {
                  const copy = [...prev];
                  copy[reelIdx] = true;
                  return copy;
                });
                const t1 = window.setTimeout(() => {
                  setSettlingReels((prev) => {
                    const copy = [...prev];
                    copy[reelIdx] = false;
                    return copy;
                  });
                }, 170);
                const t2 = window.setTimeout(() => {
                  setSparklingReels((prev) => {
                    const copy = [...prev];
                    copy[reelIdx] = false;
                    return copy;
                  });
                }, 340);
                timers.push(t1, t2);
              }
            },
          },
        );

        if (!controller.signal.aborted) {
          onSpinAnimationDone(activeSpin.outcome);
        }
      } catch (err) {
        if (err instanceof SlotSpinCancelledError) {
          onSpinCancelled();
          return;
        }
        onSpinAnimationDone(activeSpin.outcome);
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      controller.abort();
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSpin?.spinId]);

  const reelViewportHeight = cellHeight * GRID_ROWS;

  return (
    <div className="relative w-full aspect-[1514/1285] select-none">
      {/* Layer 1: Original Cleaned Wooden & Gold Slot Cabinet with 5 Cream Reel Windows & Side Lanterns */}
      <img
        src="/assets/panels/slot-machine-outer-frame.png"
        alt="Lucky Shop Slot Machine"
        referrerPolicy="no-referrer"
        draggable={false}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain drop-shadow-[0_14px_24px_rgba(12,4,22,0.75)]"
      />

      {/* Layer 2: Red & Cream Striped Shop Awning Roof sitting right above the cabinet bulb strip */}
      <img
        src="/assets/ui/shop-roof-awning.png"
        alt=""
        referrerPolicy="no-referrer"
        draggable={false}
        className="pointer-events-none absolute top-[21.5%] left-[0.8%] z-20 w-[98.4%] object-contain drop-shadow-[0_6px_10px_rgba(24,6,4,0.55)]"
      />

      {/* Layer 3: 5 Independent Clipped Reel Strips aligned directly onto the 5 cream windows */}
      <div
        className="absolute inset-0 z-20"
        style={{ '--slot-symbol-height': `${cellHeight}px` } as React.CSSProperties}
      >
        {REEL_WINDOWS.map((winRect, colIdx) => {
          const strip = reelStrips[colIdx] ?? idleGrid[colIdx];
          return (
            <div
              key={colIdx}
              style={{
                position: 'absolute',
                top: '36.6%',
                height: '52.8%',
                left: winRect.left,
                width: winRect.width,
              }}
            >
              <div
                ref={(el) => {
                  viewportRefs.current[colIdx] = el;
                }}
                className="slot-reel-viewport h-full w-full"
              >
                <div
                  className={
                    settlingReels[colIdx] ? 'slot-reel-track is-settling' : 'slot-reel-track'
                  }
                  style={{ height: `${reelViewportHeight}px` }}
                >
                  <div
                    ref={(el) => {
                      trackRefs.current[colIdx] = el;
                    }}
                    className="slot-reel-track"
                  >
                    {strip.map((symId, cellIdx) => {
                      const def = SYMBOLS[symId] ?? SYMBOLS.cherry;
                      const isIdleCell = !activeSpin && cellIdx < GRID_ROWS;
                      const isWinner = isIdleCell && winningCells.has(`${colIdx}-${cellIdx}`);
                      return (
                        <div
                          key={`${colIdx}-${cellIdx}-${symId}`}
                          className="slot-reel-symbol relative"
                        >
                          {isWinner && (
                            <img
                              src="/assets/effects/win-glow.png"
                              alt=""
                              referrerPolicy="no-referrer"
                              draggable={false}
                              className="pointer-events-none absolute inset-[-18%] h-[136%] w-[136%] max-w-none object-contain opacity-95"
                            />
                          )}
                          <img
                            src={def.assetPath}
                            alt={def.name}
                            referrerPolicy="no-referrer"
                            draggable={false}
                            className={`relative z-10 h-[90%] w-[90%] select-none object-contain drop-shadow-[0_3px_4px_rgba(48,22,6,0.38)] ${
                              isWinner ? 'ls-symbol-win' : ''
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sequential Reel Stop Sparkle Burst */}
                {sparklingReels[colIdx] && (
                  <img
                    src="/assets/effects/reel-stop-sparkle.png"
                    alt=""
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="ls-reel-sparkle pointer-events-none absolute top-1/2 left-1/2 z-30 h-20 w-20 -translate-x-1/2 -translate-y-1/2 object-contain"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
