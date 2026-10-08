// PENDING TASK TEST — ml-50 the board spins once after a huge match. Expected to FAIL until done.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');

const boardTransform = (page) => page.evaluate(() => getComputedStyle(document.getElementById('board')).transform);

// Push a 5-in-a-line onto the board and let the game settle it into a huge match.
async function playHugeMatch(page) {
  return page.evaluate(() => {
    const ML = window.MatchLogic;
    const session = window.__ML_TEST__.session();
    const board = { ...session.board };
    const keys = Object.keys(board);
    const type = ML.baseType(board[keys[0]]);
    // five cells in a straight run, all the same monster
    const line = window.__ML_TEST__.line(5);
    line.forEach((k) => { board[k] = type; });
    window.__ML_TEST__.setBoard(board);
    return { line, type };
  });
}

test('a huge match spins the board and leaves it exactly where it started', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  expect(await boardTransform(page)).toBe('none');

  await playHugeMatch(page);
  await page.evaluate(() => window.__ML_TEST__.resolve());

  // the spin must actually happen: the class goes on, then comes off
  await expect(page.locator('#board.board-spin')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#board.board-spin')).toHaveCount(0, { timeout: 5000 });
  expect(await boardTransform(page)).toBe('none');
  expect(errors).toEqual([]);
});

test('an ordinary match and a 4-match never spin the board', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);
  await page.evaluate(() => window.__ML_TEST__.resolve());
  await page.evaluate(() => window.__ML_TEST__.resolve());
  await expect(page.locator('#board.board-spin')).toHaveCount(0);
});

test('the rest of the screen stays put and swiping still works after the spin', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);
  const before = await page.evaluate(() => {
    const box = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); };
    const tiles = [...document.querySelectorAll('#board .tile')].map((t) => { const r = t.getBoundingClientRect(); return [t.dataset.type, Math.round(r.x), Math.round(r.y)].join(':'); });
    return { hud: box('#hud, .hud'), powers: box('#powers, .powers'), tiles };
  });

  await playHugeMatch(page);
  await page.evaluate(() => window.__ML_TEST__.resolve());
  await expect(page.locator('#board.board-spin')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#board.board-spin')).toHaveCount(0, { timeout: 5000 });

  const after = await page.evaluate(() => {
    const box = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); };
    const tiles = [...document.querySelectorAll('#board .tile')].map((t) => { const r = t.getBoundingClientRect(); return [t.dataset.type, Math.round(r.x), Math.round(r.y)].join(':'); });
    return { hud: box('#hud, .hud'), powers: box('#powers, .powers'), tiles };
  });

  expect(after.hud).toEqual(before.hud);
  expect(after.powers).toEqual(before.powers);
  expect(after.tiles).toEqual(before.tiles);

  // input still lands after the spin: the hint button replies and a swipe is taken
  await page.click('#hint, .hint');
  await expect(page.locator('.hint-mark, .tile.hint')).toHaveCount(1, { timeout: 5000 });
});
