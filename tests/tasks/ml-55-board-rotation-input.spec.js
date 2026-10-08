// ACCEPTANCE TEST — ml-55 the board still reads and takes input once it has turned.
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

async function placeHugeLine(page){
  await page.evaluate(() => {
    const ML = window.MatchLogic;
    const board = { ...window.__ML_TEST__.session().board };
    const type = ML.TYPES[0];
    ML.HEX_CELLS.filter(c => c.q === -ML.HEX_RADIUS)
      .forEach(c => { board[ML.hexKey(c.q, c.r)] = type; });
    window.__ML_TEST__.setBoard(board);
  });
}

async function playHugeMatch(page){
  await placeHugeLine(page);
  await swipe(page, { q: -3, r: 0 }, { q: -2, r: 0 });
  await page.waitForFunction(() => !window.__ML_TEST__.session().busy, null, { timeout: 8000 });
}

test('a turned board keeps taking input, and turns on with the next huge match', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  await playHugeMatch(page);
  await expect.poll(() => boardAngle(page)).toBe(60);

  await playHugeMatch(page);
  await expect.poll(() => boardAngle(page)).toBe(120);

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
