// ACCEPTANCE TEST — ml-51 the board spins once after a huge match.
// A move whose cascade contains a 5+ (huge) match turns the whole visible
// board 360° once, after the cascade has fully settled. Input still works
// afterwards and nothing else on the screen moves.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe, playOneMove } = require('../helpers/game.js');

const boardTransform = (page) =>
  page.evaluate(() => getComputedStyle(document.getElementById('board')).transform);

// Put a ready-made 5-in-a-line on the board, using the existing test hook.
// q = -HEX_RADIUS is always a line of five cells, so setting all five to one
// monster guarantees the next resolved move contains a huge match.
async function placeHugeLine(page) {
  return page.evaluate(() => {
    const ML = window.MatchLogic;
    const s = window.__ML_TEST__.session();
    const board = { ...s.board };
    const line = ML.HEX_CELLS
      .filter(c => c.q === -ML.HEX_RADIUS)
      .sort((a, b) => a.r - b.r)
      .map(c => ML.hexKey(c.q, c.r));
    line.forEach(k => { board[k] = ML.TYPES[0]; });
    window.__ML_TEST__.setBoard(board);
    return line.length;
  });
}

// Any adjacent pair that is on the board. The huge line is already sitting
// there, so whichever pair is swiped resolves into a cascade that contains it.
async function firstAdjacentPair(page) {
  return page.evaluate(() => {
    const ML = window.MatchLogic;
    const board = window.__ML_TEST__.session().board;
    for (const c of ML.HEX_CELLS) {
      for (const [dq, dr] of ML.HEX_DIRS) {
        const n = { q: c.q + dq, r: c.r + dr };
        if (ML.hexKey(n.q, n.r) in board) return { a: c, b: n };
      }
    }
    return null;
  });
}

async function playHugeMatch(page) {
  await placeHugeLine(page);
  const pair = await firstAdjacentPair(page);
  await swipe(page, pair.a, pair.b);
}

test('the board spins once after a huge match, and only then', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  expect(await boardTransform(page)).toBe('none');

  // An ordinary match on the same board never spins.
  await playOneMove(page);
  await expect(page.locator('#board.board-spin')).toHaveCount(0);

  // A move whose cascade contains a 5+ match does.
  await playHugeMatch(page);

  // The spin class goes on, then comes off again by itself.
  await expect(page.locator('#board.board-spin')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#board.board-spin')).toHaveCount(0, { timeout: 5000 });
  expect(await boardTransform(page)).toBe('none');
  expect(errors).toEqual([]);
});

test('the rest of the screen and the tile grid stay put, and input still works', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);

  const read = () => page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map(Math.round);
    };
    const tilePositions = [...document.querySelectorAll('#board .tile')]
      .map(t => {
        const r = t.getBoundingClientRect();
        return `${t.dataset.q},${t.dataset.r}:${Math.round(r.x)},${Math.round(r.y)}`;
      })
      .sort();
    return { hud: box('#solo-hud'), powerRow: box('.power-row'), tilePositions };
  });

  const before = await read();
  await playHugeMatch(page);
  await expect(page.locator('#board.board-spin')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#board.board-spin')).toHaveCount(0, { timeout: 5000 });

  const after = await read();
  expect(after.hud).toEqual(before.hud);
  expect(after.powerRow).toEqual(before.powerRow);
  // The monsters refill as the match clears, but every cell keeps its place.
  expect(after.tilePositions).toEqual(before.tilePositions);

  // Input still lands after the spin: the hint button replies.
  await page.click('#hint-btn');
  await expect(page.locator('.tile.hint')).toHaveCount(1, { timeout: 5000 });
});

test('no spin when effects are off or reduced motion is on, and a spin when they are back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGame(page);
  await startLevel(page, 1);

  // reduced motion: the huge match resolves but the board never spins.
  await playHugeMatch(page);
  await page.waitForFunction(() => !window.__ML_TEST__.session().busy);
  await page.waitForTimeout(700);
  await expect(page.locator('#board.board-spin')).toHaveCount(0);

  // effects off: still no spin.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => window.setEffectsEnabled(false));
  await playHugeMatch(page);
  await page.waitForFunction(() => !window.__ML_TEST__.session().busy);
  await page.waitForTimeout(700);
  await expect(page.locator('#board.board-spin')).toHaveCount(0);

  // effects back on: the next huge match does spin.
  await page.evaluate(() => window.setEffectsEnabled(true));
  await playHugeMatch(page);
  await expect(page.locator('#board.board-spin')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#board.board-spin')).toHaveCount(0, { timeout: 5000 });
});
