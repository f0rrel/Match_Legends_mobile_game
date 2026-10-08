// Smoke tests for the match juice: particles burst and clean up, the callout
// escalates per cascade step, and reduced motion removes the particles.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

// Count every particle ever added, even if it is already removed again.
async function watchParticles(page) {
  return page.evaluate(() => {
    window.__particlesAdded = 0;
    new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.classList && n.classList.contains('particle')) window.__particlesAdded++;
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
    return window.__particlesAdded;
  });
}

test('a match bursts particles and they are cleaned up afterwards', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  await watchParticles(page);

  await playOneMove(page);

  expect(await page.evaluate(() => window.__particlesAdded)).toBeGreaterThan(0);
  await expect(page.locator('.particle')).toHaveCount(0, { timeout: 3000 });
  expect(errors).toEqual([]);
});

test('reduced motion: a match bursts no particles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGame(page);
  await startLevel(page, 1);
  await watchParticles(page);

  await playOneMove(page);

  expect(await page.evaluate(() => window.__particlesAdded)).toBe(0);
});

test('the callout word depends on the cascade step', async ({ page }) => {
  await openGame(page);
  const words = await page.evaluate(() =>
    [1, 2, 3, 4, 5, 8].map((s) => window.__ML_TEST__.calloutForStep(s)));
  expect(words).toEqual([null, 'Sweet!', 'Great!', 'Amazing!', 'MONSTROUS!', 'MONSTROUS!']);
});

test('a move shows one callout over the board, then it goes away', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  await page.evaluate(() => {
    window.__callouts = [];
    new MutationObserver(() => {
      document.querySelectorAll('.match-callout').forEach((el) => {
        const text = el.textContent.trim();
        if (text) window.__callouts.push(text);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });

  await playOneMove(page);
  const texts = await page.evaluate(() => window.__callouts);
  expect(texts.length).toBeGreaterThan(0);
  expect(texts.some((t) => /MATCH|Sweet|Great|Amazing|MONSTROUS/i.test(t))).toBe(true);
  await expect(page.locator('.match-callout')).toHaveCount(0, { timeout: 2000 });
  expect(errors).toEqual([]);
});
