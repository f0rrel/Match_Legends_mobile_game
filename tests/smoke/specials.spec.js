// Smoke tests for the big-special look and the power moment.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');

// A match-free board (the (col + 2*row) pattern) with three specials on it.
async function boardWithSpecials(page) {
  await page.evaluate(() => {
    const ML = window.MatchLogic;
    const board = {};
    for (let r = 0; r < ML.ROWS; r++) {
      for (let c = 0; c < ML.COLS; c++) {
        board[ML.cellKey(c, r)] = ML.TYPES[(((c + 2 * r) % 6) + 6) % 6];
      }
    }
    board[ML.cellKey(0, 0)] = 'sword+line-h';
    board[ML.cellKey(1, 0)] = 'urn+line-v';
    board[ML.cellKey(2, 0)] = 'gem+bomb';
    window.__ML_TEST__.setBoard(board);
  });
}

test('line and bomb specials each show a mark, and the marks look different', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  await boardWithSpecials(page);

  await expect(page.locator('#board .tile[data-special="line-h"] > .special-mark')).toHaveCount(1);
  await expect(page.locator('#board .tile[data-special="line-v"] > .special-mark')).toHaveCount(1);
  await expect(page.locator('#board .tile[data-special="bomb"] > .special-mark')).toHaveCount(1);

  const styles = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { radius: cs.borderRadius, bg: cs.backgroundImage, shadow: cs.boxShadow, anim: cs.animationName };
    };
    return {
      lineH: read('#board .tile[data-special="line-h"] > .special-mark'),
      lineV: read('#board .tile[data-special="line-v"] > .special-mark'),
      bomb: read('#board .tile[data-special="bomb"] > .special-mark'),
    };
  });

  expect(styles.bomb.anim).not.toBe(styles.lineH.anim);
  expect(styles.bomb.radius).not.toBe(styles.lineH.radius);
  expect(styles.bomb.bg).not.toBe(styles.lineH.bg);
  expect(styles.lineH.bg).not.toBe(styles.lineV.bg); // horizontal vs vertical stripes
  expect(errors).toEqual([]);
});

test('the power moment overlay appears while the power fires, then is removed', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  await page.evaluate(() => {
    window.__overlaySeen = 0;
    new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.classList && (n.classList.contains('power-spotlight') || n.classList.contains('power-banner'))) {
            window.__overlaySeen++;
          }
        }
      }
    }).observe(document.body, { childList: true });
    // Make the power ready without playing out a whole charge.
    window.__ML_TEST__.session().charge = 999;
  });

  await page.click('#power-btn');

  await expect.poll(() => page.evaluate(() => window.__overlaySeen), { timeout: 2000 }).toBeGreaterThan(0);
  await expect(page.locator('.power-spotlight')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.power-banner')).toHaveCount(0, { timeout: 5000 });
  expect(errors).toEqual([]);
});
