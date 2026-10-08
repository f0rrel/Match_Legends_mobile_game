// ACCEPTANCE TEST — ml-54 a settled match of the trigger size turns the board one Hex side.
// REWRITTEN for ml-58/ml-59: the turn is ANTICLOCKWISE and the test threshold is a run of 4.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe } = require('../helpers/game.js');

const boardAngle = (page) => page.evaluate(() => {
  const t = getComputedStyle(document.getElementById('board')).transform;
  if (!t || t === 'none') return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;
  const p = m[1].split(',').map(Number);
  const deg = Math.round(Math.atan2(p[1], p[0]) * 180 / Math.PI);
  return ((deg % 360) + 360) % 360;
});

// A straight run of n monsters on the board's left edge column (q = -HEX_RADIUS,
// which always holds five cells). The run is already a match, so the next swipe
// settles a cascade that contains it.
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

async function restartLevel(page){
  await page.click('#btn-game-back');
  await page.locator('#level-grid .level-card').nth(0).click();
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && s.elMap && document.querySelectorAll('#board .tile').length === 61;
  });
}

test('a 4-match turns the board one side anticlockwise; a 3-match does not', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  expect(await boardAngle(page)).toBe(0);

  await playRun(page, 3);
  await page.waitForTimeout(1200);
  expect(await boardAngle(page)).toBe(0); // an ordinary match never turns it

  await playRun(page, 4);
  await expect.poll(() => boardAngle(page)).toBe(300);
  await page.waitForTimeout(1200);
  expect(await boardAngle(page)).toBe(300); // and it stays there
  expect(errors).toEqual([]);
});

test('a new level starts upright; reduced motion and effects off leave it alone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openGame(page);
  await startLevel(page, 1);

  await playRun(page, 4);
  await expect.poll(() => boardAngle(page)).toBe(300);

  await restartLevel(page);
  expect(await boardAngle(page)).toBe(0); // reset on level start/replay

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await playRun(page, 4);
  await page.waitForTimeout(1200);
  expect(await boardAngle(page)).toBe(0);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => window.setEffectsEnabled(false));
  await playRun(page, 4);
  await page.waitForTimeout(1200);
  expect(await boardAngle(page)).toBe(0);

  await page.evaluate(() => window.setEffectsEnabled(true));
  await playRun(page, 4);
  await expect.poll(() => boardAngle(page)).toBe(300);
});
