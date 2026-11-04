import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GAME_ASSETS } from '../game/assets';
import {
  GRID_COLS,
  GRID_ROWS,
  SYMBOLS,
  SymbolId,
} from '../game/config';
import { SpinOutcome, pickWeightedSymbol } from '../game/slotEngine';
import {
  SlotSpinCancelledError,
  animateSlotReels,
  buildTopToBottomReelStrip,
} from '../slot/slotMotion';

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
  { left: '8.25%', width: '14.25%' },
  { left: '25.25%', width: '14.32%' },
  { left: '42.26%', width: '14.36%' },
  { left: '59.24%', width: '14.30%' },
  { left: '76.16%', width: '14.34%' },
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
  const pendingStartOffsetsRef = useRef<number[] | null>(null);
  const [cellHeight, setCellHeight] = useState<number>(72);
  const [stoppedReelsFlash, setStoppedReelsFlash] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  const [reelStrips, setReelStrips] = useState<SymbolId[][]>(() =>
    idleGrid.map((col) => [...col]),
  );

  // Sync idle 3-row strips whenever activeSpin finishes or idleGrid updates
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

  // Synchronously commit pre-spin negative translateY offset before browser paint so zero 1-frame flash occurs
  useLayoutEffect(() => {
    if (!pendingStartOffsetsRef.current) return;
    const startSteps = pendingStartOffsetsRef.current;
    const measuredH =
      (viewportRefs.current[0]?.clientHeight ?? cellHeight * GRID_ROWS) / GRID_ROWS;
    trackRefs.current.forEach((track, idx) => {
      if (track) {
        track.style.transform = `translate3d(0, ${-startSteps[idx] * measuredH}px, 0)`;
      }
    });
    pendingStartOffsetsRef.current = null;
  }, [reelStrips, cellHeight]);

  // Preload and decode all symbol artwork once on mount so fast reel spins never flash blank cells
  useEffect(() => {
    Object.values(SYMBOLS).forEach((sym) => {
      const img = new Image();
      img.decoding = 'sync';
      img.src = sym.assetPath;
      img.decode?.().catch(() => {
        /* ignore decode errors in non-visual test runners */
      });
    });
  }, []);

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

    const liveViewportHeight = viewportRefs.current[0]?.clientHeight ?? 0;
    const syncedCellHeight =
      liveViewportHeight > 30 ? liveViewportHeight / GRID_ROWS : cellHeight;
    if (Math.abs(syncedCellHeight - cellHeight) > 0.05) {
      setCellHeight(syncedCellHeight);
    }

    const spinStepCounts = Array.from({ length: GRID_COLS }, (_, colIdx) =>
      prefersReduced ? 5 : 14 + colIdx * 4,
    );

    const nextStrips: SymbolId[][] = Array.from({ length: GRID_COLS }, (_, colIdx) => {
      const startVisible = idleGrid[colIdx] ?? ['cherry', 'bell', 'seven'];
      const fillerLength = spinStepCounts[colIdx] - GRID_ROWS;
      const filler = Array.from({ length: Math.max(0, fillerLength) }, () =>
        pickWeightedSymbol(Math.random, activeSpin.royalMode),
      );
      const targetOutcomeCol = activeSpin.outcome.grid[colIdx];
      return buildTopToBottomReelStrip(startVisible, filler, targetOutcomeCol);
    });

    setStoppedReelsFlash([false, false, false, false, false]);
    pendingStartOffsetsRef.current = spinStepCounts;
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
        (viewportRefs.current[0]?.clientHeight ?? syncedCellHeight * GRID_ROWS) / GRID_ROWS;

      try {
        await animateSlotReels(
          Array.from({ length: GRID_COLS }, (_, idx) => {
            const travelPx = spinStepCounts[idx] * measuredHeight;
            return {
              track: tracks[idx] as HTMLElement,
              travelDistancePx: travelPx,
              finalOffsetPx: 0,
              direction: 'down',
            };
          }),
          {
            baseDurationMs: prefersReduced ? 360 : 760,
            stopGapMs: prefersReduced ? 75 : 175,
            startStaggerMs: prefersReduced ? 0 : 25,
            signal: controller.signal,
            onReelStop: (reelIdx) => {
              onReelStop?.(reelIdx);
              if (!prefersReduced) {
                setStoppedReelsFlash((prev) => {
                  const copy = [...prev];
                  copy[reelIdx] = true;
                  return copy;
                });
                const t = window.setTimeout(() => {
                  setStoppedReelsFlash((prev) => {
                    const copy = [...prev];
                    copy[reelIdx] = false;
                    return copy;
                  });
                }, 180);
                timers.push(t);
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

  return (
    <div className="relative w-full aspect-[1514/1285] select-none">
      {/* Layer 0: Solid Mahogany Cabinet Backing - Prevents town street background from showing through frame notches/scrolls */}
      <div className="pointer-events-none absolute inset-x-[4.6%] top-[14%] bottom-0 rounded-b-2xl bg-gradient-to-b from-[#5c270d] via-[#481d09] to-[#361305]" />

      {/* Layer 1: Repaired Wooden & Gold Slot Cabinet with Clean Vertical Dividers & Side Lanterns */}
      <img
        src={GAME_ASSETS.panels.slotMachineOuterFrame}
        alt="Lucky Shop Slot Machine"
        referrerPolicy="no-referrer"
        draggable={false}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain drop-shadow-[0_14px_24px_rgba(12,4,22,0.75)]"
      />

      {/* Layer 2: Repaired Sloped Red & Cream Striped Shop Awning Roof sitting right above the bulb strip */}
      <img
        src={GAME_ASSETS.ui.shopRoofAwning}
        alt=""
        referrerPolicy="no-referrer"
        draggable={false}
        className="pointer-events-none absolute top-[14.2%] left-[0.8%] z-20 w-[98.4%] object-contain drop-shadow-[0_5px_9px_rgba(24,6,4,0.5)]"
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
                top: '39.2%',
                height: '50.1%',
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
                            src={GAME_ASSETS.effects.winGlow}
                            alt=""
                            referrerPolicy="no-referrer"
                            draggable={false}
                            className="pointer-events-none absolute inset-[-18%] h-[136%] w-[136%] max-w-none object-contain opacity-95"
                          />
                        )}
                        <img
                          src={def.assetPath}
                          alt={def.name}
                          decoding="sync"
                          loading="eager"
                          referrerPolicy="no-referrer"
                          draggable={false}
                          className={`relative z-10 h-[88%] w-[88%] select-none object-contain drop-shadow-[0_3px_4px_rgba(48,22,6,0.34)] ${
                            isWinner ? 'ls-symbol-win' : ''
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Subtle Warm Light Flash on Reel Settle (zero box border artifact) */}
                {stoppedReelsFlash[colIdx] && (
                  <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-b from-amber-200/25 via-transparent to-amber-200/25" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
