# Changelog

## [0.4.0] - 2026-11-04
### Added
- **Monte Carlo Economy Simulation (`src/game/__tests__/simulation.test.ts`)**: 100,000 spin simulation test validating Normal Mode balanced RTP (~39.8%, 26.8% hit frequency) and Royal Mode rewarding upside (~56.5% RTP, 45.2% hit frequency with Crown Wilds active).
- **Player Save Safe Backup (`src/game/storage.ts`)**: Raw serialized backup snapshot (`lucky_shop_save_backup_v1`) preserved before any migration, plus non-destructive fallback preventing progress wipe on future or malformed schema reads.

### Fixed
- **Payline Stake Allocation (`src/game/slotEngine.ts`)**: Implemented aggregate multiplier summing and integer-safe total BET allocation across 9 paylines (`Math.round((bet * totalMultiplier) / 9)`), eliminating multiplier inflation and preserving deterministic integer arithmetic.
- **Independent Chest Scatter & Diamond Stacking (`src/game/slotEngine.ts`)**: Chest scatter pays total BET multiplier independently of paylines, and simultaneously awards bonus Gems alongside 3+ Diamond bonuses on the same spin.
- **Daily Bonus Idempotency (`src/App.tsx`)**: Replaced loose state check with synchronous and atomic guard preventing rapid double-claims.
- **Spin-Lock on Reset Progress (`src/App.tsx`, `src/components/GameModals.tsx`)**: Disabled Reset Progress action and button UI whenever a spin is actively resolving.
- **Mission Alignment (`src/game/missions.ts`)**: Updated "Happy Customers" wording to "Score 3 winning spins (any payline or bonus win)" to match the `winningSpins` metric accurately.
- **Royal Slots Unlocked Presentation (`src/App.tsx`)**: Replaced locked padlock artwork with clean parchment panel and golden badge indicator once Player Level 5 Royal Slots is unlocked.
- **Comprehensive Paytable Explanations (`src/components/GameModals.tsx`)**: Documented Royal Crown Wild rule, Chest Scatter mechanics, and Diamond-to-Gem conversion.

## [0.3.1] - 2026-11-04
### Fixed
- **Published Site Stale Asset Cache Invalidation (`src/game/assets.ts`, `src/assets/game/**`)**: Migrated all 49 runtime game images out of unhashed `public/assets/*.png` paths (which collided with `/assets/*` immutable CDN/browser caching on published deployments) into high-DPI lossless-alpha `.webp` modules imported through Vite (`src/game/assets.ts`). Production builds now emit content-hashed filenames (`dist/assets/<name>-v3-<hash>.webp`) and reduce asset bundle size from ~29 MB to ~4.5 MB, guaranteeing that published deployments immediately load the repaired slot cabinet dividers, striped awning, single-bar level badge, crisp buttons, and updated symbols without stale browser/CDN cache hits.

## [0.3.0] - 2026-11-04
### Fixed
- **Slot Cabinet Vertical Dividers & Inner Walls (`public/assets/panels/slot-machine-outer-frame.png`)**: Eliminated all 12 inpainting notches/scars along the 4 vertical reel dividers and inner left/right golden walls, smoothed the 5 cream reel wells, and restored the bottom-right golden scroll corner.
- **Shop Roof Striped Awning (`public/assets/ui/shop-roof-awning.png`)**: Repaired the 4 transparent stripe holes where the cream stripes had `alpha = 0`, reconstructed the sloped 3D red-and-cream striped roof canopy (`2048x318`), and trimmed duplicate string lights.
- **Level Shield XP Groove (`public/assets/panels/level-badge.png`)**: Removed the baked yellow progress bar fill inside the carved dark-wood groove so only a single dynamic XP progress bar renders, and raised the `XP / Max` readout cleanly above the bottom rim.
- **Top Bar Buttons & Bet/Win Wells (`top-plus-button.png`, `settings-button.png`, `win-panel.png`)**: Replaced low-resolution cut-off button crops (`66x88`, `83x100`) and the bottom-right notched `win-panel.png` (`249x94`) with crisp high-DPI anti-aliased RGBA PNGs (`256x256` and `520x196`).

### Changed
- **Reference-Matched Slot Symbols (`seven`, `cherry`, `bell`, `grapes`, `crown` + de-haloed `clover`, `watermelon`, `diamond`)**: Upgraded the 3D gold-beveled crimson `7`, upright twin cherries, upright golden bell, royal purple grapes, and ruby-set golden crown (`512x512` RGBA, ~86% fill, zero white matte halo).
- **Top-to-Bottom Fast Sequential Reel Spin (`src/slot/slotMotion.ts`, `src/slot/slotMotion.css`, `src/components/SlotMachine.tsx`)**: Reversed reel motion from upward to rapid **top-to-bottom** scrolling (`-travel -> 0px`) driven by `requestAnimationFrame` with pre-decoded symbol images, synchronous pre-paint layout offsets, snappy sequential left-to-right stopping (`baseDurationMs: 760`, `stopGapMs: 175`), downward mechanical settle bounce, persistent `SPIN` button label, and subtle warm settle highlights.

## [0.2.0] - 2026-11-04
### Changed
- Retrieved and audited both original GitHub asset archives (`assets/LuckyShop-AssetPack-v1.zip` and `assets/slot_assets_clean.zip`) that had been omitted during initial >10 MB repository import.
- Replaced temporary vector placeholders with the verified high-resolution RGBA PNG assets from both archives:
  - **Symbols & Effects (`LuckyShop-AssetPack-v1.zip`)**: 512x512 RGBA slot symbols (`cherry`, `bell`, `seven`, `grapes`, `diamond`, `crown`, `chest`, `clover`, `watermelon` + Level 5 unlocked `wild`, `crystal-orb`, `dragon-egg`, `jackpot`), `reel-stop-sparkle.png`, `win-glow.png`, and `main-town.png` background.
  - **UI Panels, Frame & Mascot (`slot_assets_clean.zip`)**: `slot-machine-outer-frame.png` (mapped to exact 5-reel window coordinates), `shop-roof-awning.png`, `lucky-shop-cat-mascot.png`, `lucky-shop-title.png`, `level-badge.png`, `daily-bonus.png`, `spin-button.png`, `bet-minus-button.png`, `bet-plus-button.png`, `win-panel.png`, `shop-upgrade-card.png`, `lock-level-card.png`, `bottom-nav-bar.png`, and resource bar icons/buttons.
- Updated `public/assets/assets-manifest.json` with exact dimensions and source archive attribution.

## [0.1.0] - 2026-11-04
### Added
- Bootstrapped Vite + React 19 + TypeScript + Tailwind CSS v4 web application configured for AI Studio (`0.0.0.0:3000`).
- Integrated `src/slot/slotMotion.ts` and `src/slot/slotMotion.css` sequential 5-reel animation helper, 5x3 RNG outcome engine, Vitest unit tests, and versioned `localStorage` persistence.
