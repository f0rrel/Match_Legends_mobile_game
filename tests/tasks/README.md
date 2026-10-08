# Task acceptance tests

Each file here is the human-written definition of done for one `ml-*` task, written
before the work started. Files are named `ml-<id>-<slug>.test.js` (pure logic, run
with `node:test`) or `ml-<id>-<slug>.spec.js` (browser behaviour, run with
Playwright). A few tasks have both.

```bash
npm test           # does NOT run this directory
npm run test:tasks # runs it: 90 node tests + 50 Playwright tests
```

**Status (2026-10-08): all tests in this directory pass** — 90 node tests and 50
Playwright tests, 0 failures. The tasks they cover are implemented, so these no
longer read as pending work. They are kept here rather than in `tests/unit/` and
`tests/smoke/` so that `npm test` stays a fast gate; moving one into `npm test` is a
human decision.

Coverage in brief:

- `ml-1` … `ml-8` — seeded RNG, shuffle, scoring, hint, persistence, resume, debug
  panel, star rating.
- `ml-9` … `ml-29` — effects toggle, clear pop, win burst, tile colours, wobble,
  monster artwork, match beat, callouts, cascade timing, burst classes.
- `ml-30` … `ml-45` — queued swipes, special encoding, matching, planting, blasts,
  chains, special look and burst, and combining two specials.
