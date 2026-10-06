// ACCEPTANCE TEST — ml-31: the remembered swipe is played once the board is free.
// Expected to FAIL until done: the remembered swipe is never played.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, findLegalSwap, swipe } = require('../helpers/game.js');

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

// An adjacent pair whose swap makes no match at all: the game animates a
// swap-and-back, spends no move and leaves the board exactly as it was -- which
// gives a busy board to swipe onto without changing anything underneath it.
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

test('the remembered swipe is played once the board is free, then cleared', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  const moves = await page.evaluate(() => window.__ML_TEST__.session().movesLeft);

  const refused = await findUselessSwap(page);
  expect(refused).not.toBeNull();
  await swipe(page, refused.a, refused.b);
  await page.waitForFunction(() => window.__ML_TEST__.session().busy);

  // a legal swipe made while the board is busy: kept, not played yet
  const good = await findLegalSwap(page);
  await swipeToward(page, good.a, [good.b.q - good.a.q, good.b.r - good.a.r]);
  expect(await queued(page)).toBe(1);

  // board free again: the remembered swipe has been played like a fresh one --
  // it spent its move and scored -- and the queue is empty
  await page.waitForFunction(m => {
    const s = window.__ML_TEST__.session();
    return !s.busy && window.__ML_TEST__.queuedSwaps() === 0 && s.movesLeft === m - 1;
  }, moves, { timeout: 20000 });

  expect(await page.evaluate(() => window.__ML_TEST__.session().score)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
