# Square board direction

- Branch: `square-board`
- Preservation tag: `square/base` → `408465dea00c8b4900f09cc9643b3fbb6e73aa56`
- Playable build: <https://f0rrel.github.io/Match_Legends_mobile_game/square-board/>

Shared vision, audience, feel, modes, gaps and branch layout live in
[DIRECTION.md](DIRECTION.md). This file only covers what is specific to the square
board. The square direction is one of two active alternatives — see
[DIRECTION-HEX.md](DIRECTION-HEX.md) for the other.

## Never change (square)

- A square board (rows and columns) that fills a portrait phone screen.
- Core matching: 3 or more of the same tiles in a row or column.

## Board and matching — implemented

- An 8 × 9 grid = **72 cells**, keyed `"col,row"`. Gravity pulls tiles toward the
  larger row (down-screen); new tiles enter at the top of a column.
- Four orthogonal neighbours. Matches run along **two** axes only — rows and columns.
  There are no diagonals, unlike Hex.
- `www/js/match-logic.js` keeps the same pure-logic boundary as Hex; its header
  documents the square grid geometry.

## Specials and combinations — implemented

Tiles are stored as `monster + '+' + kind`, as in Hex, but the line kind is
directional:

- `line-h` — clears its whole row.
- `line-v` — clears its whole column.
- `bomb` — on its own it clears the 3 × 3 area around it; swapped with a plain tile
  it acts as a colour bomb and clears every tile of that monster.

Combining two specials is named, and each pair has its own blast
(`MatchLogic.comboKind`), centred on the first swapped cell:

- `cross` (line + line) — the full row **and** full column of that cell.
- `mega` (line + bomb) — the 3 rows and 3 columns centred on it.
- `kaboom` (bomb + bomb) — the 5 × 5 square around it.

The two swapped specials do not fire again; anything else the blast catches still
fires and chains.

## Look and juice — implemented

- Tiles are glossy jewels drawn in SVG (`www/js/jewel-tiles.js`): sword = red
  circle, shield = blue rounded square, urn = purple triangle, crown = yellow star,
  flame = orange diamond, gem = green hexagon. Each has its own silhouette, colour,
  darker outline and white gloss, so tiles read without colour. The monster
  characters live in the avatars and the power moments, not on the board.
- All the excitement goes into specials, combos and effects, not into the normal
  tiles.
- Special tiles never look like normal tiles: a row blaster wears bright white
  stripes along its row, a column blaster the same stripes stood up, and a bomb wears
  a slowly pulsing glowing ring with a spark on top. The jewel stays visible
  underneath.
- `www/js/juice.js` is a pure, DOM-free rule set behind the big-match feel (unit
  tested): cascade callouts escalate with the step (`Sweet!` → `Great!` →
  `Amazing!` → `MONSTROUS!`) and scale up with it, and each combo shouts its own
  line (`CROSS BLAST!`, `MEGA LINES!`, `KABOOM!`).
- Every match bursts particles in its colour (`burstParticles`), and a power gets its
  own moment: `powerMoment` dims the screen, shows the avatar and power name in a
  spotlight, shakes the board and throws the cleared tiles up and out — about 0.56 s
  with motion, 0.14 s without.
- Otherwise the timing rules match Hex: a normal 3-match takes about 0.4–0.6 s, up to
  about 1 s for 5+ matches, taps are queued during effects, and reduced motion plus
  the effects toggle shorten everything.

## Tests

Square-specific coverage: `tests/unit/match-logic.test.js`,
`tests/unit/special-combos.test.js`, `tests/unit/jewel-tiles.test.js`,
`tests/unit/juice.test.js`, `tests/smoke/game.spec.js`, `tests/smoke/fx.spec.js` and
`tests/smoke/specials.spec.js`.

## Known gaps

- The direction text describes a **"fever" win** — leftover moves turning into
  specials that go off one by one. It is not implemented in either branch.
- Otherwise only the shared gaps listed in [DIRECTION.md](DIRECTION.md).
