// ACCEPTANCE TEST — ml-56 every Hex side rests, and the screen does not jump.
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

const layout = (page) => page.evaluate(() => {
  const b = document.getElementById('board').getBoundingClientRect();
  const h = document.querySelector('#solo-hud').getBoundingClientRect();
  const p = document.querySelector('.power-row').getBoundingClientRect();
  const r = (x) => Math.round(x);
  return { cx: r(b.left + b.width / 2), cy: r(b.top + b.height / 2),
           hud: [r(h.left), r(h.top), r(h.width), r(h.height)],
           power: [r(p.left), r(p.top), r(p.width), r(p.height)] };
});

test('each orientation step turns the board one more Hex side, clockwise, and it stays', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  for (const step of [0, 1, 2, 3, 4, 5]){
    await page.evaluate((s) => { document.getElementById('board').dataset.rot = String(s); }, step);
    await expect.poll(() => boardAngle(page)).toBe(step * 60);
    await page.waitForTimeout(700);
    expect(await boardAngle(page)).toBe(step * 60); // never swings back
  }
  expect(errors).toEqual([]);
});

test('the turn is anchored to the board centre: the HUD and power row do not move', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);
  const before = await layout(page);
  await page.evaluate(() => { document.getElementById('board').dataset.rot = '3'; });
  await expect.poll(() => boardAngle(page)).toBe(180);
  await page.waitForTimeout(700);
  const after = await layout(page);
  expect(Math.abs(after.cx - before.cx)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.cy - before.cy)).toBeLessThanOrEqual(1);
  expect(after.hud).toEqual(before.hud);
  expect(after.power).toEqual(before.power);
});
