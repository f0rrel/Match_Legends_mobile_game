// ACCEPTANCE TEST — ml-54 a settled 5+ huge match turns the board one Hex side clockwise.
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

async function restartLevel(page){
  await page.click('#btn-game-back');
  await page.locator('#level-grid .level-card').nth(0).click();
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && s.elMap && document.querySelectorAll('#board .tile').length === 61;
  });
}

test('a huge match turns the board one side clockwise, and it stays', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  expect(await boardAngle(page)).toBe(0);

  await playOneMove(page);
  expect(await boardAngle(page)).toBe(0);

  await playHugeMatch(page);
  await expect.poll(() => boardAngle(page)).toBe(60);
  await page.waitForTimeout(800);
  expect(await boardAngle(page)).toBe(60);
  expect(errors).toEqual([]);
});

test('a new level resets it; reduced motion and effects off leave it alone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openGame(page);
  await startLevel(page, 1);

  await playHugeMatch(page);
  await expect.poll(() => boardAngle(page)).toBe(60);

  await restartLevel(page);
  expect(await boardAngle(page)).toBe(0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await playHugeMatch(page);
  await page.waitForTimeout(800);
  expect(await boardAngle(page)).toBe(0);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => window.setEffectsEnabled(false));
  await playHugeMatch(page);
  await page.waitForTimeout(800);
  expect(await boardAngle(page)).toBe(0);

  await page.evaluate(() => window.setEffectsEnabled(true));
  await playHugeMatch(page);
  await expect.poll(() => boardAngle(page)).toBe(60);
});
