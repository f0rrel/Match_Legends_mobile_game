// ACCEPTANCE TEST — ml-30: a swipe made while the board is busy is remembered.
// Expected to FAIL until done: nothing reports a waiting swipe yet.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, findLegalSwap, swipe } = require('../helpers/game.js');

// How many swipes the game is holding on to (-1 when it cannot say).
const queued = (page) => page.evaluate(() =>
  window.__ML_TEST__ && typeof window.__ML_TEST__.queuedSwaps === 'function'
    ? window.__ML_TEST__.queuedSwaps() : -1);

// The six swipe directions the game reads a drag as, in the game's own order.
const HEX_SWIPE_DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

// Swipe the tile at a toward the neighbouring cell dir away, as one whole
// finger movement: a pointerdown on the tile and a pointerup past it, fired in
// one go so a swipe aimed at a busy board still lands while the board is busy.
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

test('a swipe made while the board is busy is remembered, not played', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const move = await findLegalSwap(page);
  const dir = [move.b.q - move.a.q, move.b.r - move.a.r];
  await swipe(page, move.a, move.b);
  await page.waitForFunction(() => window.__ML_TEST__.session().busy);
  const held = await page.evaluate(() => window.__ML_TEST__.session().movesLeft);

  // made while the cascade is running: it is held, nothing else happens
  await swipeToward(page, move.a, dir);
  expect(await queued(page)).toBe(1);
  expect(await page.evaluate(() => window.__ML_TEST__.session().busy)).toBe(true);
  expect(await page.evaluate(() => window.__ML_TEST__.session().movesLeft)).toBe(held);

  // a second one replaces the first: only the most recent swipe is kept
  await swipeToward(page, move.a, dir);
  expect(await queued(page)).toBe(1);
  expect(errors).toEqual([]);
});
