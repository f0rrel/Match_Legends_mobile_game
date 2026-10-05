# Pending task acceptance tests

**Every test in this directory is EXPECTED TO FAIL** until its task is done. Each one is
the human-written definition of done for one planned task, written before the work
starts. `npm test` does **not** run them; `npm run test:tasks` does.

| File(s) | Task |
| --- | --- |
| `ml-1-seeded-rng.test.js` | ml-1: `MatchLogic.createRng(seed)` |
| `ml-2-shuffle.test.js` | ml-2: `MatchLogic.shuffleBoard(board, rng)` |
| `ml-3-scoring.test.js` | ml-3: `MatchLogic.scoreMatch({...})` |
| `ml-4-hint.test.js`, `ml-4-hint.spec.js` | ml-4: `MatchLogic.findHint(board)` and the 💡 button |
| `ml-5-persist.spec.js` | ml-5: progress persists in `localStorage` |
| `ml-6-resume-level.spec.js` | ml-6: an unfinished level survives closing and reopening the game |
| `ml-7-debug-panel.spec.js` | ml-7: a debug panel with `?debug=1` (seed, stuck board, saved progress, any level) |
| `ml-8-stars.test.js`, `ml-8-stars.spec.js` | ml-8: a 0-3 star rating on the results screen |

Status (2026-10-05): ml-1 to ml-5 are done and integrated, so their tests now pass;
moving them into `tests/unit/` and `tests/smoke/` is a human decision. ml-6 to ml-8 are
pending.

The tasks are independent: none needs another's code. When a task is done, its test
moves from here to `tests/unit/` or `tests/smoke/` (a human decision), so that it
becomes part of `npm test`.
