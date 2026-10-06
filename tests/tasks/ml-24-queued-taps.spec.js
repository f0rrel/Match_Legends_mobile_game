// PENDING TASK TEST — ml-24 queued taps. Expected to FAIL until done.
//
// Definition of done: a swipe made while the board is busy is queued, not thrown away.
// The game reports how many swipes are waiting, the queue empties once the cascade has
// settled, and the game is still playable afterwards.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, findLegalSwap, swipe, playOneMove } = require('../helpers/game.js');

const pending = (page) => page.evaluate(() =>
  window.__ML_TEST__ && typeof window.__ML_TEST__.pendingMoves === 'function'
    ? window.__ML_TEST__.pendingMoves() : -1);

const settled = (page) => page.waitForFunction(() => {
  const s = window.__ML_TEST__.session();
  return s && !s.busy && window.__ML_TEST__.pendingMoves() === 0;
});

test('a swipe during effects is queued, then played', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const first = await findLegalSwap(page);
  await swipe(page, first.a, first.b);
  await page.waitForFunction(() => window.__ML_TEST__.session().busy);

  const second = await findLegalSwap(page);
  await swipe(page, second.a, second.b);
  expect(await pending(page)).toBe(1);

  await settled(page);
  expect(await pending(page)).toBe(0);

  await playOneMove(page); // the game is not stuck afterwards
  expect(errors).toEqual([]);
});

test('two swipes during one cascade are both kept', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);

  const first = await findLegalSwap(page);
  await swipe(page, first.a, first.b);
  await page.waitForFunction(() => window.__ML_TEST__.session().busy);

  const second = await findLegalSwap(page);
  await swipe(page, second.a, second.b);
  const third = await findLegalSwap(page);
  await swipe(page, third.a, third.b);

  expect(await pending(page)).toBe(2);
  await settled(page);
  expect(await pending(page)).toBe(0);
});
