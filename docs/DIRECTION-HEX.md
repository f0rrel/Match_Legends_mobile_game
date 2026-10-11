# Hex board direction

- Branch: `develop`
- Preservation tag: `hex/pre-square` → `989187528e3f31de7554b80b5d7c64dc57ac2eb5`
- Playable build: <https://f0rrel.github.io/Match_Legends_mobile_game/develop/>

Shared vision, audience, feel, modes, gaps and branch layout live in
[DIRECTION.md](DIRECTION.md). This file only covers what is specific to the hex
board. The hex direction is one of two active alternatives — see
[DIRECTION-SQUARE.md](DIRECTION-SQUARE.md) for the other.

## Never change (hex)

- The hex board.
- Core matching on the hex grid.

## Board and matching — implemented

- A "hex of hexes" with `HEX_RADIUS = 4`: 3R²+3R+1 = **61 cells**, axial
  coordinates `q, r` with `s = -q - r`. Cells are keyed `"q,r"`.
- Six neighbours per cell. Matches run along the **three** straight axes (q-lines,
  r-lines, s-lines), so a diagonal run counts.
- Geometry, matching, gravity, scoring and power targeting all live in
  `www/js/match-logic.js`; `www/index.html` only renders them.

## Specials — implemented

A special tile is stored as `monster + '+' + kind` (e.g. `sword+line`). The monster
half decides what it matches with; the kind half decides what it fires.

- `line` — clears the whole q-line through its cell (one of the three axes).
- `bomb` — a colour bomb: swapped with a tile, it clears every tile of that monster.
- A special caught in a blast fires too, chaining until nothing new turns up.
- Two specials swapped together combine: line + line clears the q-line of the first
  cell and the r-line of the second; bomb + bomb clears every tile of both monsters.
  These combinations are not named and have no callout of their own — named combos
  exist only in the Square direction.

## Look — implemented

- Tiles are cute monster faces drawn in code (`www/js/monster-tiles.js`, SVG, loaded
  after `match-logic.js`). Each type has its own silhouette AND colour, so tiles are
  distinguishable even without colour. There are no image assets; the artwork is
  generated at runtime.
- Special tiles never look like normal tiles: each wears a `data-special` mark and
  its own burst animation, and the monster stays visible underneath.
- Avatars are monster characters in a Hotel-Transylvania-like style: ridiculous and
  lovable (a fly, a blob, a tiny vampire…). Portraits are AI-generated in one fixed
  style; the owner picks from candidates.
- Effects are readable, not rushed: a normal 3-match takes about 0.4–0.6 s from pop
  to falling tiles. Bigger matches swell, then burst — up to about 1 s for 5+
  matches. Taps are never lost (queued during effects). Reduced motion and the
  effects toggle make everything short again.
- One short callout over the board says what the match did (`5-MATCH!`, `4-MATCH`,
  `COMBO x3!`, …).

## Powers — implemented

Six avatars, one signature power each, charged by matches: clear a hex line (two
different directions), reshape hexes and restore moves, clear every hex of one
monster, clear a hex cluster, or gain extra moves. The targeting helpers live in
`www/js/match-logic.js` (`lineTargets('q')`, `lineTargets('r')`, `areaTargets`,
`typeTargets`, `convertTiles`); granting extra moves is handled in `index.html`.
Firing a power gives a power flash, screen shake, sound and a toast — there is no
separate spotlight moment in this direction.

## Known gaps

Only the shared gaps listed in [DIRECTION.md](DIRECTION.md). No hex-specific gaps
are recorded.
