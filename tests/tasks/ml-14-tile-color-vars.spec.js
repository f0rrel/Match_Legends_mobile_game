// PENDING TASK TEST — ml-14 tile colours in CSS variables. Expected to FAIL until done.
//
// Definition of done: --tile-1 … --tile-6 are defined in one place on :root, all six are
// different, the tile rules paint from them, and each colour is brighter than the old
// hard-coded one while still clearly distinct.
const { test, expect } = require('@playwright/test');
const { openGame } = require('../helpers/game.js');

// The colours the tiles used before this task (old hard-coded values), per type.
const OLD = ['#3b6fb5', '#b5543b', '#3bb56f', '#b5a13b', '#8a3bb5', '#3bb5b5'];

function luminance(rgb) {
  const m = String(rgb).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  const [r, g, b] = m.slice(1, 4).map(Number).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

async function rendered(page, css) {
  return page.evaluate((value) => {
    const el = document.createElement('div');
    el.style.color = value;
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).color;
    el.remove();
    return rgb;
  }, css);
}

test('the six tile colours live in one set of variables, all different', async ({ page }) => {
  await openGame(page);

  const vars = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return [1, 2, 3, 4, 5, 6].map((n) => cs.getPropertyValue('--tile-' + n).trim());
  });

  expect(vars.every((v) => v.length > 0)).toBe(true);
  expect(new Set(vars).size).toBe(6);
});

test('each tile colour is brighter than before but still distinct', async ({ page }) => {
  await openGame(page);

  const vars = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return [1, 2, 3, 4, 5, 6].map((n) => cs.getPropertyValue('--tile-' + n).trim());
  });

  const renderedColors = [];
  for (let i = 0; i < 6; i++) {
    const now = await rendered(page, vars[i]);
    const was = await rendered(page, OLD[i]);
    renderedColors.push(now);
    expect(luminance(now)).toBeGreaterThan(luminance(was));
  }

  expect(new Set(renderedColors).size).toBe(6);
});
