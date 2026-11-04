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
  /** Final positive offset from the top of the strip, in px. */
  finalOffsetPx: number;
}

export interface SlotMotionOptions {
  /** Base time for the first reel. Default: 1750ms. */
  baseDurationMs?: number;
  /** Additional stop delay per reel. Default: 260ms. */
  stopGapMs?: number;
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
  baseDurationMs: 1750,
  stopGapMs: 260,
  easing: "cubic-bezier(0.12, 0.72, 0.18, 1)",
} as const;

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new SlotSpinCancelledError());
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new SlotSpinCancelledError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Animates five reel tracks. All tracks start together and stop sequentially.
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
    easing = DEFAULTS.easing,
    onReelStop,
    onComplete,
    signal,
  } = options;

  if (reels.some((reel) =>
    !Number.isFinite(reel.travelDistancePx) ||
    !Number.isFinite(reel.finalOffsetPx) ||
    reel.travelDistancePx < 0 ||
    reel.finalOffsetPx < 0
  )) {
    throw new Error("Reel travel and final offsets must be finite non-negative numbers.");
  }

  if (signal?.aborted) throw new SlotSpinCancelledError();

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const animations: Animation[] = [];

  try {
    // Create all animations immediately so all five reels begin together.
    const tasks = reels.map(async (reel, index) => {
      const duration = reducedMotion
        ? Math.max(350, Math.round(baseDurationMs * 0.45))
        : baseDurationMs + index * stopGapMs;

      const travel = reducedMotion
        ? Math.min(reel.travelDistancePx, Math.max(reel.finalOffsetPx, 1) * 2)
        : reel.travelDistancePx;

      const animation = reel.track.animate(
        [
          { transform: "translate3d(0, 0, 0)", offset: 0 },
          { transform: `translate3d(0, ${-travel * 0.72}px, 0)`, offset: 0.72 },
          { transform: `translate3d(0, ${-travel}px, 0)`, offset: 1 },
        ],
        {
          duration,
          easing,
          fill: "forwards",
        },
      );

      animations[index] = animation;

      const abortPromise = signal
        ? new Promise<never>((_, reject) => {
            if (signal.aborted) reject(new SlotSpinCancelledError());
            else signal.addEventListener(
              "abort",
              () => reject(new SlotSpinCancelledError()),
              { once: true },
            );
          })
        : new Promise<never>(() => { /* never settles without an AbortSignal */ });

      await Promise.race([animation.finished, abortPromise]);

      // Commit the exact final position before removing the Web Animation.
      reel.track.style.transform = `translate3d(0, ${-reel.finalOffsetPx}px, 0)`;
      animation.cancel();

      onReelStop?.(index);
    });

    await Promise.all(tasks);
    onComplete?.();
  } catch (error) {
    animations.forEach((animation) => animation?.cancel());
    if (error instanceof SlotSpinCancelledError) throw error;
    if (signal?.aborted) throw new SlotSpinCancelledError();
    throw error;
  }
}
