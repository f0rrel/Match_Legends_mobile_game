// PENDING TASK TEST — ml-4 hint (button). Expected to FAIL until the task is done.
//
// Definition of done: during a level, a button with id "hint-btn" is visible. Clicking
// it gives exactly two tiles the CSS class "hint": two adjacent tiles whose swap
// makes a match. It does not use up a move.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');

test('the hint button highlights one legal swap', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  const movesBefore = await page.locator('#solo-moves').textContent();

  await expect(page.locator('#hint-btn')).toBeVisible();
  await page.click('#hint-btn');

  const hinted = page.locator('#board .tile.hint');
  await expect(hinted).toHaveCount(2);
  const cells = await hinted.evaluateAll(els => els.map(e => ({ q: +e.dataset.q, r: +e.dataset.r })));
  const legal = await page.evaluate(([a, b]) => {
    const ML = window.MatchLogic;
    const board = { ...window.__ML_TEST__.session().board };
    if (!ML.isHexAdjacent(a, b)) return false;
    ML.swapHex(board, a, b);
    return ML.findMatches(board).size > 0;
  }, cells);
  expect(legal).toBe(true);
  await expect(page.locator('#solo-moves')).toHaveText(movesBefore);
  expect(errors).toEqual([]);
});
