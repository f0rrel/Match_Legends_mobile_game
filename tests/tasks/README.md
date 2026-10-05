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

The tasks are independent: none needs another's code. When a task is done, its test
moves from here to `tests/unit/` or `tests/smoke/` (a human decision), so that it
becomes part of `npm test`.
