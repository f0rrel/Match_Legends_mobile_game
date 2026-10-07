// PENDING TASK TEST — ml-39 a special tile on the board. Expected to FAIL until done.
//
// Definition of done: a board value like 'gem+bomb' is drawn as the gem monster
// and marked with the kind it carries, and window.__ML_TEST__.setBoard() can put
// such a board in play.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');
const { ML, stuckBoard } = require('../helpers/boards.js');

const k = ML.hexKey;

test('a special tile shows its monster and marks its kind', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const board = stuckBoard();
  board[k(0, 0)] = 'gem+bomb';
  board[k(1, 0)] = 'sword+line';
  await page.evaluate(b => window.__ML_TEST__.setBoard(b), board);

  const bomb = page.locator('#board .tile[data-q="0"][data-r="0"]');
  await expect(bomb).toHaveAttribute('data-type', 'gem');
  await expect(bomb).toHaveAttribute('data-special', 'bomb');
  await expect(bomb.locator('svg path')).toHaveCount(5); // the gem sprite's paths

  const line = page.locator('#board .tile[data-q="1"][data-r="0"]');
  await expect(line).toHaveAttribute('data-type', 'sword');
  await expect(line).toHaveAttribute('data-special', 'line');
  await expect(line.locator('svg path')).toHaveCount(4); // the sword imp's paths

  // plain tiles carry no special at all
  await expect(page.locator('#board .tile[data-special]')).toHaveCount(2);
  expect(errors).toEqual([]);
});
