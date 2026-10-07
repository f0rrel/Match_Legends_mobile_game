// PENDING TASK TEST — ml-27 bigger bursts. Expected to FAIL until done.
//
// Definition of done: a big (4) and a huge (5+) match swell for a split second and then
// burst away with their own, longer pop - never longer than about 1 s.
const { test, expect } = require('@playwright/test');
const { openGame } = require('../helpers/game.js');

function anim(page, burst, type){
  return page.evaluate(([b, t]) => {
    const el = document.createElement('div');
    el.className = 'tile matchPop';
    if (t) el.dataset.type = t;
    if (b) el.dataset.burst = b;
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const r = { name: cs.animationName, duration: parseFloat(cs.animationDuration) * 1000 };
    el.remove();
    return r;
  }, [burst, type]);
}

test('a big and a huge match get their own, longer pop', async ({ page }) => {
  const errors = await openGame(page);
  const beats = await page.evaluate(() => ({
    three: window.MatchLogic.matchBeat(3),
    four: window.MatchLogic.matchBeat(4),
    five: window.MatchLogic.matchBeat(5),
  }));

  for (const type of ['sword', 'shield', 'urn', 'crown', 'flame', 'gem']) {
    const normal = await anim(page, 'normal', type);
    const big = await anim(page, 'big', type);
    const huge = await anim(page, 'huge', type);

    expect(normal.name).not.toBe('none');
    expect(big.name).not.toBe('none');
    expect(huge.name).not.toBe('none');
    expect(new Set([normal.name, big.name, huge.name]).size).toBe(3);

    expect(big.duration).toBeGreaterThan(normal.duration);
    expect(huge.duration).toBeGreaterThanOrEqual(big.duration);
    expect(big.duration).toBeGreaterThanOrEqual(beats.four.swell + beats.four.pop - 40);
    expect(huge.duration).toBeGreaterThanOrEqual(beats.five.swell + beats.five.pop - 40);
    expect(huge.duration).toBeLessThanOrEqual(1000);
  }
  expect(errors).toEqual([]);
});

test('a tile with no type or burst class still bursts the ordinary way', async ({ page }) => {
  await openGame(page);
  const fallback = await anim(page, null, null);
  expect(fallback.name).not.toBe('none');
});
