// Smoke test (existing behaviour): the game loads cleanly, a level starts,
// and one scripted move is played.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, findLegalSwap, swipe } = require('../helpers/game.js');

test('the game loads, a level starts and one move is played, with no errors', async ({ page }) => {
  const errors = await openGame(page);
  await expect(page.locator('#screen-home')).toHaveClass(/active/);

  await startLevel(page, 1);
  await expect(page.locator('#screen-game')).toHaveClass(/active/);
  await expect(page.locator('#board .tile')).toHaveCount(72);

  const movesBefore = Number(await page.locator('#solo-moves').textContent());
  const move = await findLegalSwap(page);
  expect(move).not.toBeNull();
  await swipe(page, move.a, move.b);

  await expect(page.locator('#solo-moves')).toHaveText(String(movesBefore - 1), { timeout: 10_000 });
  expect(errors).toEqual([]);
});
