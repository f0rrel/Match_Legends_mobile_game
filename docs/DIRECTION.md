# Match Legends — Project Direction

Match Legends is a bright, cute and competitive match-3 for phones. Quick games
(≤3 min) that make you want "just one more", plus powers you unlock solo and then
show off against friends.

**Audience:** mainly women 20–55, casual phone players. Short sessions, portrait
mode, played with one thumb. English first; text kept ready for translation.

**Feel (every change is judged against this):** bright · flashy · juicy · cute ·
competitive. Every action gets visible, satisfying feedback. Big moments (specials,
powers, wins) must feel big: you should see and hear them. Never overdo the colors:
readability comes first.

## Two board directions — not decided yet

The project is currently experimenting with two board versions. **Both are preserved
as active alternatives, and the final board direction has not been decided.** Neither
version replaces the other and neither is a "v2".

| | Hex | Square |
| --- | --- | --- |
| Branch | `develop` | `square-board` |
| Board | hex-of-hexes, `HEX_RADIUS = 4`, 61 cells | 8 × 9 grid, 72 cells |
| Direction document | [DIRECTION-HEX.md](DIRECTION-HEX.md) | [DIRECTION-SQUARE.md](DIRECTION-SQUARE.md) |
| Preservation tag | `hex/pre-square` → `989187528e3f31de7554b80b5d7c64dc57ac2eb5` | `square/base` → `408465dea00c8b4900f09cc9643b3fbb6e73aa56` |

The other branches: `main` is the release line (tags `v0.1`, `v0.2`, `v0.3`, all
Hex) and `gh-pages` holds the published builds.

### Playable builds (GitHub Pages)

- Hex, `develop` build: <https://f0rrel.github.io/Match_Legends_mobile_game/develop/>
- Hex, release build (`main`, v0.3): <https://f0rrel.github.io/Match_Legends_mobile_game/>
- Square: <https://f0rrel.github.io/Match_Legends_mobile_game/square-board/>

## Shared by both directions

Implemented identically in both branches:

- Plain HTML/CSS/JS with no build step: `www/index.html` (UI, rendering, audio) plus
  a pure logic module `www/js/match-logic.js` that runs in the browser and under
  `node:test`.
- Six tile types — sword, shield, urn, crown, flame, gem. Match 3 or more in a line,
  gravity collapses and refills, seeded RNG (`createRng`) so a board is reproducible.
- Specials from longer matches, specials chained when a blast catches one, and two
  specials swapped together combining.
- Hint button, taps queued while effects play, effects toggle, sound toggle.
  Sound effects and background music are synthesized in Web Audio (`Sound`, `Music`
  — an ambient pad loop); there are no audio files.
- Debug panel behind `?debug=1`: seed, stuck board, saved progress, any level.
- 0–3 star rating, gems, progress persisted (native storage first, `localStorage`
  second — it survives a reload).
- Solo campaign: 6 story levels with a score target and a move limit. Battle Arena:
  a 60-second race against an AI.
- Six avatars, each with one signature power; an `Unlock … (Test Mode)` button stands
  in for real payments.
- Android/Capacitor packaging, `npm test` (unit + Playwright smoke) and
  `npm run test:tasks`.

Board geometry, tile artwork, special kinds and their blast shapes, and the big
effect moments differ — those are documented per direction.

## Shared, intended but not yet implemented

Written in the direction documents and absent from both branches today:

- Real recorded sound files (`www/assets/audio/`) and music loops, plus separate
  sound and music toggles. Today every effect and the ambient music are generated in
  code, and one toggle covers both.
- Endless seeded levels with rotating goals (collect X, clear blockers), easier
  "breather" levels, and levels grouped into worlds (one world = one hotel floor).
  Today it is 6 fixed levels with a score target.
- Versus AI as a turn-based duel over 5 rounds with Easy / Normal / Hard (today: a
  60-second race).
- Versus friends, played asynchronously.
- Progression that spends coins and stars to unlock avatars and powers (today gems
  only accumulate), plus daily rewards and streaks.
- Real payments instead of the Test Mode unlock.

## Never change (both directions)

- Games last ≤3 minutes.
- Free to play, no real money.
- Powers differ in kind, not in strength — no pay-to-win.
- Portrait phone screen, played with one thumb.

Board rules are per direction: see [DIRECTION-HEX.md](DIRECTION-HEX.md) and
[DIRECTION-SQUARE.md](DIRECTION-SQUARE.md).

## Testing

A group of friends plays the preview link and gives feedback outside the game.
