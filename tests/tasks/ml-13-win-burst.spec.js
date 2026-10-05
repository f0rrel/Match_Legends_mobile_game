// PENDING TASK TEST — ml-13 win burst. Expected to FAIL until done.
//
// Definition of done: the win state of the results overlay runs a CSS burst of 400 ms or
// less, the loss state runs no burst at all, and with prefers-reduced-motion the win
// state has no burst.
const { test, expect } = require('@playwright/test');
const { openGame } = require('../helpers/game.js');

async function readState(page, state) {
  return page.evaluate((s) => {
    const el = document.createElement('div');
    el.className = 'results-screen ' + s;
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const r = { name: cs.animationName, duration: cs.animationDuration };
    el.remove();
    return r;
  }, state);
}

test('only the win screen bursts', async ({ page }) => {
  const errors = await openGame(page);

  const win = await readState(page, 'win');
  const lose = await readState(page, 'lose');

  expect(win.name).not.toBe('none');
  expect(parseFloat(win.duration)).toBeLessThanOrEqual(0.4);
  expect(lose.name).toBe('none');
  expect(errors).toEqual([]);
});

test('reduced motion: no burst', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGame(page);

  const win = await readState(page, 'win');
  expect(win.name).toBe('none');
});
