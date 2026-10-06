// PENDING TASK TEST — ml-10 tile clear pop. Expected to FAIL until done.
//
// Definition of done: a cleared tile carries the 'matchPop' class with a pop of 400 ms or
// less, the class is removed when the pop ends, and the next move is accepted immediately.
// With prefers-reduced-motion no pop class is added and the game still plays.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

async function watchFor(page, cls) {
  await page.evaluate((c) => {
    window.__seen = 0;
    const board = document.querySelector('#board') || document.body;
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.target.classList && m.target.classList.contains(c)) window.__seen++;
        if (m.type === 'childList') {
          for (const n of m.addedNodes) if (n.classList && n.classList.contains(c)) window.__seen++;
        }
      }
    }).observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }, cls);
  return () => page.evaluate(() => window.__seen);
}

test('matched tiles pop, and the class does not stick', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const seen = await watchFor(page, 'matchPop');
  const before = Number(await page.locator('#solo-moves').textContent());
  await playOneMove(page);

  expect(await seen()).toBeGreaterThan(0);
  await expect(page.locator('#solo-moves')).toHaveText(String(before - 1));

  await page.waitForTimeout(600);
  expect(await page.locator('#board .tile.matchPop').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('the pop lasts 400 ms or less', async ({ page }) => {
  await openGame(page);

  const anim = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'tile matchPop';
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const r = { name: cs.animationName, duration: cs.animationDuration };
    el.remove();
    return r;
  });

  expect(anim.name).not.toBe('none');
  expect(parseFloat(anim.duration)).toBeLessThanOrEqual(0.4);
});

test('reduced motion: no pop, but the move still plays', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGame(page);
  await startLevel(page, 1);

  const seen = await watchFor(page, 'matchPop');
  const before = Number(await page.locator('#solo-moves').textContent());
  await playOneMove(page);

  expect(await seen()).toBe(0);
  await expect(page.locator('#solo-moves')).toHaveText(String(before - 1));
});
