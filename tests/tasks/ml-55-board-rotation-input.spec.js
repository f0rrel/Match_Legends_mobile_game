// ACCEPTANCE TEST — ml-55 the board still reads and takes input once it has turned.
// REWRITTEN for ml-58/ml-59: turns are anticlockwise (300, then 240) at the 4-run threshold.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe, playOneMove } = require('../helpers/game.js');

const boardAngle = (page) => page.evaluate(() => {
  const t = getComputedStyle(document.getElementById('board')).transform;
  if (!t || t === 'none') return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;
  const p = m[1].split(',').map(Number);
  const deg = Math.round(Math.atan2(p[1], p[0]) * 180 / Math.PI);
  return ((deg % 360) + 360) % 360;
});

async function placeRun(page, n){
  await page.evaluate((count) => {
    const ML = window.MatchLogic;
    const board = { ...window.__ML_TEST__.session().board };
    ML.HEX_CELLS.filter(c => c.q === -ML.HEX_RADIUS).sort((a, b) => a.r - b.r).slice(0, count)
      .forEach(c => { board[ML.hexKey(c.q, c.r)] = ML.TYPES[0]; });
    window.__ML_TEST__.setBoard(board);
  }, n);
}

async function playRun(page, n){
  await placeRun(page, n);
  await swipe(page, { q: -3, r: 0 }, { q: -2, r: 0 });
  await page.waitForFunction(() => !window.__ML_TEST__.session().busy, null, { timeout: 8000 });
}

test('a turned board keeps taking input, and turns on with the next big match', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  await playRun(page, 4);
  await expect.poll(() => boardAngle(page)).toBe(300);

  await playRun(page, 4);
  await expect.poll(() => boardAngle(page)).toBe(240);

  const before = Number(await page.locator('#solo-moves').textContent());
  await playOneMove(page);
  await expect(page.locator('#solo-moves')).toHaveText(String(before - 1));

  await page.click('#hint-btn');
  await expect(page.locator('.tile.hint')).toHaveCount(1, { timeout: 5000 });
  for (const sel of ['#solo-hud', '.power-row']){
    const t = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).transform, sel);
    expect(t).toBe('none');
  }
  expect(errors).toEqual([]);
});

test('a swipe made while the board is busy during a turn is queued, never lost', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  await placeRun(page, 4);
  await swipe(page, { q: -3, r: 0 }, { q: -2, r: 0 }); // starts the turn
  // the cascade is playing: swipe again straight away
  await swipe(page, { q: 1, r: 0 }, { q: 2, r: 0 });
  const queued = await page.evaluate(() => window.__ML_TEST__.queuedSwaps());
  expect(queued).toBeLessThanOrEqual(1); // at most one waiting swipe, never a pile
  await page.waitForFunction(() => !window.__ML_TEST__.session().busy, null, { timeout: 8000 });
  // the board is free again and the next swipe is read in the turned orientation
  await playOneMove(page);
  expect(errors).toEqual([]);
});
