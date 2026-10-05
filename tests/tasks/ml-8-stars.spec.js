// PENDING TASK TEST — ml-8 star-rating (results screen). Expected to FAIL until done.
//
// Definition of done: the results screen shows an element with id "res-stars" whose
// data-stars attribute is MatchLogic.starsForScore(score, target) and whose text is
// that many filled stars followed by empty ones, three in total (for example "★★☆").
// After a loss it shows 0 stars ("☆☆☆").
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');

async function endLevelWith(page, factor, movesLeft) {
  await page.evaluate(([f, m]) => {
    const s = window.__ML_TEST__.session();
    s.score = Math.ceil(s.level.target * f);
    s.movesLeft = m;
    window.checkSoloEnd();
  }, [factor, movesLeft]);
  await expect(page.locator('#screen-results')).toHaveClass(/active/);
}

test('a win scoring 1.3 x the target shows two stars', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  await endLevelWith(page, 1.3, 5);

  await expect(page.locator('#res-stars')).toHaveAttribute('data-stars', '2');
  await expect(page.locator('#res-stars')).toHaveText('★★☆');
  expect(errors).toEqual([]);
});

test('a loss shows no stars', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);

  await endLevelWith(page, 0.5, 0);

  await expect(page.locator('#res-stars')).toHaveAttribute('data-stars', '0');
  await expect(page.locator('#res-stars')).toHaveText('☆☆☆');
});
