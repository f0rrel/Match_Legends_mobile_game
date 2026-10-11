# Match Legends

Match Legends is a mobile-style match-3 puzzle and battle game built with plain
HTML, CSS and JavaScript, packaged for Android with Capacitor.

## Play

Three playable web builds — open and play, no install needed:

| Version | Play |
| --- | --- |
| **Main** — release | <https://f0rrel.github.io/Match_Legends_mobile_game/> |
| **Hex** — develop | <https://f0rrel.github.io/Match_Legends_mobile_game/develop/> |
| **Square** — develop | <https://f0rrel.github.io/Match_Legends_mobile_game/square-board/> |

## Current direction

`main` is the primary/release version.

`develop` (Hex) and `square-board` (Square) are two active development versions of
the same game, kept on separate branches while the final board direction is
evaluated.

- [docs/DIRECTION.md](docs/DIRECTION.md) — shared direction and branch layout
- [docs/DIRECTION-HEX.md](docs/DIRECTION-HEX.md) — the hex board version
- [docs/DIRECTION-SQUARE.md](docs/DIRECTION-SQUARE.md) — the square board version

## What is in the game

- Match-3 gameplay over six tile types: swap to match three or more, gravity
  collapses the board and refills it.
- Special tiles from longer matches, and blasts that chain through other specials.
  The development versions also let you combine two specials swapped together.
- Powers: six avatars, each with its own signature power, charged by matching tiles.
- Levels and progression: story levels with a score target and a move limit, star
  ratings, and a 60-second Battle Arena against an AI.
- Avatars are monster characters, and each tile type has its own shape as well as
  its own colour.
- Visual feedback throughout: pop and burst animations, callouts, screen shake,
  plus synthesized sound effects and ambient music.

## Development

The game source is primarily under `www/` — `index.html` plus `www/js/`. It is
plain HTML/CSS/JavaScript with no build step.

Requires Node.js 22 (`.nvmrc`).

```bash
npm install
npx playwright install chromium   # once per machine
npm test                          # unit tests + headless smoke test
npm run test:tasks                # the ml-* acceptance tests (see tests/tasks/)
```

Android packaging uses Capacitor — see [docs/ANDROID.md](docs/ANDROID.md).

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | primary/release version |
| `develop` | Hex development version |
| `square-board` | Square development version |
| `gh-pages` | published web builds |

## Future

- Progress persistence backed by a service such as Firebase, instead of storage
  that lives only on the device.
- More content and continued gameplay iteration.

## Master System

Match Legends is developed using the Master System AI work/orchestration system,
which covers planning, execution and verification of the work done in this
repository. It is a real project, not a demo: Master System drives its task
history here, and the acceptance tests under `tests/tasks/` are written as part of
that workflow. See [tests/tasks/README.md](tests/tasks/README.md) and
[CHANGELOG.md](CHANGELOG.md).
