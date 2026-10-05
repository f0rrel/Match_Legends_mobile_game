// PENDING TASK TEST — ml-6 resume-level. Expected to FAIL until the task is done.
//
// Definition of done: an unfinished solo level survives closing and reopening the
// game. After every move the game saves the level being played (level, board,
// score, moves left) through Storage (key 'ml_session'). On startup, if one is
// saved, the home screen shows a button with id "btn-continue" whose text names
// the level; clicking it restores exactly that level, board, score and moves.
// When a level ends (win or loss) the saved level is cleared.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, levelState, playOneMove } = require('../helpers/game.js');

async function reopen(context, page) {
  await page.close();                    // close the game...
  const again = await context.newPage(); // ...and open it again (same device storage)
  const errors = await openGame(again);
  return { again, errors };
}

test('an unfinished level is restored after closing and reopening', async ({ page, context }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  await playOneMove(page);
  const saved = await levelState(page);

  const { again, errors: errorsAgain } = await reopen(context, page);

  const resume = again.locator('#btn-continue');
  await expect(resume).toBeVisible();
  await expect(resume).toContainText('1');
  await resume.click();
  await again.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && s.elMap && document.querySelectorAll('#board .tile').length === 61;
  });
  expect(await levelState(again)).toEqual(saved);
  await expect(again.locator('#solo-moves')).toHaveText(String(saved.movesLeft));
  expect(errors).toEqual([]);
  expect(errorsAgain).toEqual([]);
});

test('a finished level is not offered again', async ({ page, context }) => {
  await openGame(page);
  await startLevel(page, 1);
  await page.evaluate(() => { window.__ML_TEST__.session().movesLeft = 1; });
  await playOneMove(page); // the last move: the level ends (out of moves)
  await expect(page.locator('#screen-results')).toHaveClass(/active/);

  const { again } = await reopen(context, page);

  await expect(again.locator('#btn-continue')).toBeHidden();
});

test('a fresh game offers nothing to continue', async ({ page }) => {
  await openGame(page);
  await expect(page.locator('#btn-continue')).toBeHidden();
});
