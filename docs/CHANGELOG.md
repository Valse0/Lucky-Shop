# Changelog

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
