// ACCEPTANCE TEST — ml-32: a remembered swipe that no longer matches is dropped
// quietly. Expected to FAIL until done: it is played, so it wiggles.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe } = require('../helpers/game.js');

const queued = (page) => page.evaluate(() =>
  window.__ML_TEST__ && typeof window.__ML_TEST__.queuedSwaps === 'function'
    ? window.__ML_TEST__.queuedSwaps() : -1);

const HEX_SWIPE_DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

async function swipeToward(page, a, dir) {
  const idx = HEX_SWIPE_DIRS.findIndex(([q, r]) => q === dir[0] && r === dir[1]);
  const rad = idx * Math.PI / 3;
  await page.evaluate(({ a, dx, dy }) => {
    const el = document.querySelector('#board .tile[data-q="' + a.q + '"][data-r="' + a.r + '"]');
    const ev = (x, y) => ({ bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true });
    el.dispatchEvent(new PointerEvent('pointerdown', ev(0, 0)));
    document.getElementById('board').dispatchEvent(new PointerEvent('pointerup', ev(dx, dy)));
  }, { a, dx: Math.cos(rad) * 60, dy: Math.sin(rad) * 60 });
}

// An adjacent pair that cannot match, found on the untouched board.
async function findUselessSwap(page) {
  return page.evaluate(() => {
    const ML = window.MatchLogic;
    const board = { ...window.__ML_TEST__.session().board };
    for (const c of ML.HEX_CELLS) {
      for (const [dq, dr] of ML.HEX_DIRS) {
        const n = { q: c.q + dq, r: c.r + dr };
        if (!(ML.hexKey(n.q, n.r) in board)) continue;
        ML.swapHex(board, c, n);
        const matched = ML.findMatches(board).size > 0;
        ML.swapHex(board, c, n);
        if (!matched) return { a: { q: c.q, r: c.r }, b: n };
      }
    }
    return null;
  });
}

test('a remembered swipe that no longer matches is dropped quietly', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  // While a swipe is waiting, a game that is busy with an empty queue is a game
  // animating it -- exactly the wiggle a dropped swipe must not play.
  await page.evaluate(() => {
    window.__watch = { armed: false, strike: 0, longest: 0 };
    setInterval(() => {
      const s = window.__ML_TEST__.session();
      if (!s) return;
      if (window.__ML_TEST__.queuedSwaps() > 0) { window.__watch.armed = true; return; }
      if (!window.__watch.armed) return;
      if (s.busy) {
        window.__watch.strike += 1;
        window.__watch.longest = Math.max(window.__watch.longest, window.__watch.strike);
      } else window.__watch.strike = 0;
    }, 5);
  });

  const moves = await page.evaluate(() => window.__ML_TEST__.session().movesLeft);
  const bad = await findUselessSwap(page);
  expect(bad).not.toBeNull();

  // a refused swipe: busy for a moment, board untouched
  await swipe(page, bad.a, bad.b);
  await page.waitForFunction(() => window.__ML_TEST__.session().busy);

  // the same swipe again, while busy: remembered, and still unable to match
  await swipeToward(page, bad.a, [bad.b.q - bad.a.q, bad.b.r - bad.a.r]);
  expect(await queued(page)).toBe(1);

  // once the board is free the swipe is dropped: the queue empties and the game
  // never goes busy again
  await page.waitForFunction(() =>
    !window.__ML_TEST__.session().busy && window.__ML_TEST__.queuedSwaps() === 0, null, { timeout: 10000 });
  await page.waitForTimeout(600);

  expect(await page.evaluate(() => window.__ML_TEST__.session().movesLeft)).toBe(moves);
  expect(await page.evaluate(() => window.__ML_TEST__.session().score)).toBe(0);
  expect(await page.evaluate(() => window.__watch.longest)).toBeLessThan(10);
  expect(errors).toEqual([]);
});
