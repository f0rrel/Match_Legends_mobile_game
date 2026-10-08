// ACCEPTANCE TEST — ml-53 the board's rotor turns it one Hex side and holds.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');

const boardAngle = (page) => page.evaluate(() => {
  const t = getComputedStyle(document.getElementById('board')).transform;
  if (!t || t === 'none') return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;
  const p = m[1].split(',').map(Number);
  const deg = Math.round(Math.atan2(p[1], p[0]) * 180 / Math.PI);
  return ((deg % 360) + 360) % 360;
});

test('the board turns one Hex side and stays there', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  expect(await boardAngle(page)).toBe(0);

  await page.evaluate(() => { document.getElementById('board').dataset.rot = '1'; });
  await expect.poll(() => boardAngle(page)).toBe(60);
  await page.waitForTimeout(800);
  expect(await boardAngle(page)).toBe(60); // it never swings back
  expect(errors).toEqual([]);
});

test('only the board turns; the HUD, story and power row stay upright', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);
  await page.evaluate(() => { document.getElementById('board').dataset.rot = '1'; });
  await expect.poll(() => boardAngle(page)).toBe(60);
  for (const sel of ['#solo-hud', '.power-row', '#story-banner', '.topbar']){
    const t = await page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? getComputedStyle(el).transform : 'none';
    }, sel);
    expect(t).toBe('none');
  }
});
