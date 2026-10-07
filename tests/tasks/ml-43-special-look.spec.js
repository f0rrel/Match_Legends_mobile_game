// PENDING TASK TEST — ml-43 the special look. Expected to FAIL until done.
//
// Definition of done: each kind of special carries its own visible mark, the two
// read differently from one another, and the monster is still drawn underneath.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');
const { ML, stuckBoard } = require('../helpers/boards.js');

const k = ML.hexKey;
const KINDS = ['line', 'bomb'];

test('the two specials are marked and easy to tell apart', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const board = stuckBoard();
  board[k(0, 0)] = 'sword+line';
  board[k(1, 0)] = 'gem+bomb';
  await page.evaluate(b => window.__ML_TEST__.setBoard(b), board);

  for (const kind of KINDS) {
    const mark = page.locator(`#board .tile[data-special="${kind}"] .special-mark`);
    await expect(mark).toHaveCount(1);
    const box = await mark.boundingBox();
    expect(box.width).toBeGreaterThan(4);
    expect(box.height).toBeGreaterThan(4);
  }

  const look = kind => page.locator(`#board .tile[data-special="${kind}"] .special-mark`).evaluate(el => {
    const s = getComputedStyle(el);
    return [s.backgroundImage, s.borderTopColor, s.boxShadow, s.transform].join('|');
  });
  const looks = await Promise.all(KINDS.map(look));
  expect(new Set(looks).size).toBe(2);

  // the monster is still there and still its own monster
  const bomb = page.locator('#board .tile[data-special="bomb"]');
  await expect(bomb).toHaveAttribute('data-type', 'gem');
  await expect(bomb.locator('svg path')).toHaveCount(5);
  expect(errors).toEqual([]);
});
