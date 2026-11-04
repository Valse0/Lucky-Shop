/**
 * Lucky Shop — sequential 5-reel motion helper.
 *
 * Framework-agnostic browser TypeScript. Each `track` should be the moving
 * inner strip for one reel. The caller owns the symbol DOM and computes the
 * final outcome before calling this helper.
 *
 * IMPORTANT:
 * - `travelDistancePx` is the total distance travelled during the spin.
 * - `finalOffsetPx` is the exact final translateY offset after the animation.
 * - The strip must contain enough repeated symbols for the full travel distance.
 * - The track's final contents/offset must reveal the precomputed 3-symbol result.
 * - This module does not generate outcomes, pay winnings, or mutate game balance.
 */

export interface ReelMotionTarget {
  track: HTMLElement;
  /** Total downward-strip travel, in px; use a positive number. */
  travelDistancePx: number;
  /** Final positive offset from the top of the strip, in px (0 when target outcome sits at top of strip). */
  finalOffsetPx: number;
  /** Direction of symbol motion inside the reel window. Default: 'down' (top-to-bottom). */
  direction?: "down" | "up";
}

export interface SlotMotionOptions {
  /** Base time for the first reel. Default: 940ms. */
  baseDurationMs?: number;
  /** Additional stop delay per reel. Default: 195ms. */
  stopGapMs?: number;
  /** Optional stagger before each reel starts moving (ms). Default: 35ms. */
  startStaggerMs?: number;
  /** CSS easing. */
  easing?: string;
  /** Called after each reel has settled, from left to right. */
  onReelStop?: (reelIndex: number) => void;
  /** Called when all reels have settled. */
  onComplete?: () => void;
  /** Optional cancellation signal. */
  signal?: AbortSignal;
}

export class SlotSpinCancelledError extends Error {
  constructor() {
    super("Slot spin animation was cancelled.");
    this.name = "SlotSpinCancelledError";
  }
}

const DEFAULTS = {
  baseDurationMs: 760,
  stopGapMs: 175,
  startStaggerMs: 25,
} as const;

/**
 * Pure strip builder for top-to-bottom sequential reel spins.
 * Places `targetOutcomeCol` at indices [0..2] (y = 0px) and `startVisibleCol`
 * at the bottom of the strip (y = -stepCount * cellHeight), so animating
 * translateY from `-stepCount * cellHeight` -> `0px` scrolls symbols rapidly
 * from TOP to BOTTOM with zero visual jump at start or stop.
 */
export function buildTopToBottomReelStrip<T>(
  startVisibleCol: readonly T[],
  fillerSymbols: readonly T[],
  targetOutcomeCol: readonly T[],
): T[] {
  return [...targetOutcomeCol, ...fillerSymbols, ...startVisibleCol];
}

function computeReelOffsetY(
  progress: number,
  startY: number,
  endY: number,
  overshootPx: number,
): number {
  if (progress <= 0) return startY;
  if (progress >= 1) return endY;

  if (overshootPx === 0) {
    const eased = 1 - Math.pow(1 - progress, 2.25);
    return startY + (endY - startY) * eased;
  }

  const settleStart = 0.9;
  if (progress <= settleStart) {
    const u = progress / settleStart;
    const eased = 1 - Math.pow(1 - u, 2.25);
    const targetWithOvershoot = endY + overshootPx;
    return startY + (targetWithOvershoot - startY) * eased;
  }

  const v = (progress - settleStart) / (1 - settleStart);
  const smoothStep = v * v * (3 - 2 * v);
  return endY + overshootPx * (1 - smoothStep);
}

/**
 * Animates five reel tracks. Reels cascade rapidly from TOP to BOTTOM
 * and lock sequentially from left (Reel 0) to right (Reel 4).
 * Reduced-motion preference shortens the movement while preserving stop order.
 */
export async function animateSlotReels(
  reels: ReelMotionTarget[],
  options: SlotMotionOptions = {},
): Promise<void> {
  if (reels.length !== 5) {
    throw new Error(`Lucky Shop requires exactly 5 reels; received ${reels.length}.`);
  }

  const {
    baseDurationMs = DEFAULTS.baseDurationMs,
    stopGapMs = DEFAULTS.stopGapMs,
    startStaggerMs = DEFAULTS.startStaggerMs,
    onReelStop,
    onComplete,
    signal,
  } = options;

  if (
    reels.some(
      (reel) =>
        !Number.isFinite(reel.travelDistancePx) ||
        !Number.isFinite(reel.finalOffsetPx) ||
        reel.travelDistancePx < 0 ||
        reel.finalOffsetPx < 0,
    )
  ) {
    throw new Error("Reel travel and final offsets must be finite non-negative numbers.");
  }

  if (signal?.aborted) throw new SlotSpinCancelledError();

  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const states = reels.map((reel, index) => {
    const duration = reducedMotion
      ? Math.max(300, Math.round(baseDurationMs * 0.45) + index * 65)
      : baseDurationMs + index * stopGapMs;
    const delay = reducedMotion ? 0 : index * startStaggerMs;
    const dir = reel.direction ?? "down";
    const endY = -reel.finalOffsetPx;
    const startY = dir === "down" ? endY - reel.travelDistancePx : 0;
    const overshootPx = reducedMotion ? 0 : dir === "down" ? 5 : -4;

    reel.track.style.transform = `translate3d(0, ${startY}px, 0)`;

    return {
      reel,
      index,
      duration,
      delay,
      startY,
      endY,
      overshootPx,
      stopped: false,
    };
  });

  await new Promise<void>((resolve, reject) => {
    let rafId = 0;
    const originTime = performance.now();

    const onAbort = () => {
      window.cancelAnimationFrame(rafId);
      reject(new SlotSpinCancelledError());
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    const tick = (now: number) => {
      if (signal?.aborted) {
        onAbort();
        return;
      }

      const elapsed = now - originTime;
      let allStopped = true;

      for (let i = 0; i < states.length; i += 1) {
        const st = states[i];
        if (st.stopped) continue;

        if (elapsed < st.delay) {
          allStopped = false;
          continue;
        }

        const localElapsed = elapsed - st.delay;
        const progress = Math.min(1, localElapsed / st.duration);
        const y = computeReelOffsetY(
          progress,
          st.startY,
          st.endY,
          st.overshootPx,
        );
        st.reel.track.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;

        if (progress >= 1) {
          st.reel.track.style.transform = `translate3d(0, ${st.endY}px, 0)`;
          st.stopped = true;
          onReelStop?.(st.index);
        } else {
          allStopped = false;
        }
      }

      if (allStopped) {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
        resolve();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
  });

  onComplete?.();
}
