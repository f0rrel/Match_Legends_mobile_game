// PENDING TASK TEST — ml-18 monster pops. Expected to FAIL until done.
//
// Definition of done: a cleared tile pops the way its own monster does - six different
// pops, each 400 ms or less - a tile with no type still pops, and a real move pops tiles
// that still carry their monster type.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

const TYPES = ['sword', 'shield', 'urn', 'crown', 'flame', 'gem'];

function popAnim(page, type) {
  return page.evaluate((t) => {
    const el = document.createElement('div');
    el.className = 'tile matchPop';
    if (t) el.dataset.type = t;
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const r = { name: cs.animationName, duration: cs.animationDuration };
    el.remove();
    return r;
  }, type);
}

test('each monster pops in its own way', async ({ page }) => {
  const errors = await openGame(page);

  const anims = [];
  for (const type of TYPES) anims.push(await popAnim(page, type));

  expect(anims.every((a) => a.name !== 'none')).toBe(true);
  expect(new Set(anims.map((a) => a.name)).size).toBe(6);
  for (const a of anims) expect(parseFloat(a.duration)).toBeLessThanOrEqual(0.4);
  expect(errors).toEqual([]);
});

test('a tile with no type still pops', async ({ page }) => {
  await openGame(page);

  const fallback = await popAnim(page, null);
  expect(fallback.name).not.toBe('none');
  expect(parseFloat(fallback.duration)).toBeLessThanOrEqual(0.4);
});

test('tiles cleared by a real move carry their monster type into the pop', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);

  await page.evaluate(() => {
    window.__popped = [];
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('matchPop')) {
          window.__popped.push(m.target.dataset.type || '');
        }
      }
    }).observe(document.querySelector('#board'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  });

  await playOneMove(page);

  const popped = await page.evaluate(() => window.__popped);
  expect(popped.length).toBeGreaterThan(0);
  expect(popped.some((t) => t && t !== '')).toBe(true);
});
