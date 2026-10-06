// PENDING TASK TEST — ml-40 planting the special. Expected to FAIL until done.
//
// Definition of done: a 4-in-a-row left by the player's swap leaves a line blaster
// of that monster exactly on the cell they played into.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe } = require('../helpers/game.js');
const { ML, stuckBoard } = require('../helpers/boards.js');

const k = ML.hexKey;

test('a 4-in-a-row leaves a line blaster where the player played', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  // The stuck pattern already has a shield at (1,0) and a sword at (0,0);
  // laying shields at (0,-2), (0,-1) and (0,1) makes the swap of (0,0) with
  // (1,0) bring the fourth shield into that row.
  const board = stuckBoard();
  [[0, -2], [0, -1], [0, 1]].forEach(([q, r]) => { board[k(q, r)] = 'shield'; });
  await page.evaluate(b => window.__ML_TEST__.setBoard(b), board);

  await swipe(page, { q: 0, r: 0 }, { q: 1, r: 0 });
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && !s.busy && s.movesLeft === 19;
  });

  const planted = await page.evaluate(() => window.__ML_TEST__.session().board['0,0']);
  expect(planted).toBe('shield+line');
  const tile = page.locator('#board .tile[data-q="0"][data-r="0"]');
  await expect(tile).toHaveAttribute('data-type', 'shield');
  await expect(tile).toHaveAttribute('data-special', 'line');
  expect(errors).toEqual([]);
});
