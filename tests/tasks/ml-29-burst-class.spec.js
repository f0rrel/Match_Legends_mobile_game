// PENDING TASK TEST — ml-29 burst class in the game. Expected to FAIL until done.
//
// Definition of done: every tile a real move clears carries the burst class of its
// match (data-burst) while it pops.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

test('cleared tiles carry the burst class of their match', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  await page.evaluate(() => {
    window.__bursts = [];
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('matchPop')) {
          window.__bursts.push(m.target.dataset.burst || '');
        }
      }
    }).observe(document.querySelector('#board'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  });

  await playOneMove(page);

  const bursts = await page.evaluate(() => window.__bursts);
  expect(bursts.length).toBeGreaterThan(0);
  expect(bursts.every((b) => ['normal', 'big', 'huge'].includes(b))).toBe(true);
  expect(bursts).toContain('normal');
  expect(errors).toEqual([]);
});
