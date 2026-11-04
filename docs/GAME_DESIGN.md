# Lucky Shop — Game Design Document

## High concept
A portrait casual slot-and-shop progression game set in a cheerful fantasy town. The slot machine provides short, repeatable risk/reward sessions; rebuilding and upgrading the shop provides long-term progression.

## Core pillars
1. Readable, satisfying slot interaction.
2. Charming fantasy-shop identity.
3. Clear rewards and progression.
4. One-thumb portrait usability.
5. Consistent high-quality art.

## Screen structure
Top resource bar (gold, gems, plus actions, settings); level and daily bonus cards; shop mascot/sign; 5×3 reels; bet and spin controls; shop upgrade and locked expansion cards; bottom tabs for Missions, Rewards, Leaderboard.

## Core loop
Choose bet → pay bet → spin → reveal five reels in sequence → evaluate paylines/combinations → award winnings → earn progression → upgrade shop → repeat.

## Non-goals for the first playable build
- No mandatory backend.
- No real-money gambling or cash-out.
- No fabricated online leaderboard.
- No unnecessary account/login system.
- No invented mechanics that conflict with existing project behavior.

## Slot rules
- Exactly five reels and three visible rows.
- Outcome is computed before animation.
- Animation is presentation only.
- Five reel strips stop left to right.
- Displayed final symbols must exactly equal the computed outcome.
- Paytable is centralized and unit-testable.
- Bet and balance are validated before starting.

## Progression
Shop upgrades consume in-game gold and improve a configurable progression value. Level and XP thresholds are centralized. Locked content clearly explains its unlock requirement. Daily bonus is local/demo unless a trusted backend is added.

## UX
Large central Spin button, clear bet controls, readable balance/win display, responsive portrait layout, visible disabled/loading states, reduced-motion support.
