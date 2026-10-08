// ACCEPTANCE TEST — ml-53 the board's rotor turns it one Hex side anticlockwise and holds.
// REWRITTEN for ml-58: the turn is anticlockwise (0 -> -60 -> -120 ...) and takes about a second.
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

// The angle as CSS is carrying it: negative on the anticlockwise way round, so
// a mid-turn reading can tell 60° of anticlockwise travel from 300° the other
// way -- both end on the same normalised angle.
const boardAngleSigned = (page) => page.evaluate(() => {
  const t = getComputedStyle(document.getElementById('board')).transform;
  if (!t || t === 'none') return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;
  const p = m[1].split(',').map(Number);
  return Math.atan2(p[1], p[0]) * 180 / Math.PI;
});

test('the board turns one Hex side anticlockwise and stays there', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  expect(await boardAngle(page)).toBe(0);

  await page.evaluate(() => { document.getElementById('board').dataset.rot = '1'; });
  await expect.poll(() => boardAngle(page)).toBe(300); // 0 minus 60
  await page.waitForTimeout(1300);
  expect(await boardAngle(page)).toBe(300); // it never swings back
  await page.evaluate(() => { document.getElementById('board').dataset.rot = '2'; });
  await expect.poll(() => boardAngle(page)).toBe(240);
  expect(errors).toEqual([]);
});

test('the turn takes about a second, so the eye catches it', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);
  const seconds = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.getElementById('board')).transitionDuration));
  expect(seconds).toBeGreaterThanOrEqual(0.8);
  expect(seconds).toBeLessThanOrEqual(1.6);

  await page.evaluate(() => { document.getElementById('board').dataset.rot = '1'; });
  await page.waitForTimeout(250);
  const mid = await boardAngleSigned(page);
  expect(mid).toBeLessThan(-1); // already moving, and anticlockwise (negative)
  expect(mid).toBeGreaterThan(-60); // still on its way: a visible turn, not a snap
});

test('the tiles turn with the board as one object', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  const read = () => page.evaluate(() => {
    const b = document.getElementById('board').getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const out = {};
    for (const t of document.querySelectorAll('#board .tile')){
      const r = t.getBoundingClientRect();
      const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
      out[t.dataset.key] = { d: Math.hypot(dx, dy), a: Math.atan2(dy, dx) * 180 / Math.PI };
    }
    return out;
  });
  const before = await read();
  await page.evaluate(() => { document.getElementById('board').dataset.rot = '1'; });
  await expect.poll(() => boardAngle(page)).toBe(300);
  await page.waitForTimeout(300);
  const after = await read();
  let checked = 0;
  for (const key of Object.keys(before)){
    if (before[key].d < 20) continue; // the middle tile sits right on the board centre
    checked++;
    expect(Math.abs(after[key].d - before[key].d)).toBeLessThanOrEqual(3); // same place on the board
    const moved = ((after[key].a - before[key].a) % 360 + 360) % 360;
    expect(Math.round(moved)).toBeGreaterThanOrEqual(294); // 300 = 60 anticlockwise
    expect(Math.round(moved)).toBeLessThanOrEqual(306);
  }
  expect(checked).toBeGreaterThan(40);
  expect(errors).toEqual([]);
});

test('only the board turns; the HUD, story and power row stay upright', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);
  await page.evaluate(() => { document.getElementById('board').dataset.rot = '1'; });
  await expect.poll(() => boardAngle(page)).toBe(300);
  for (const sel of ['#solo-hud', '.power-row', '#story-banner', '.topbar']){
    const t = await page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? getComputedStyle(el).transform : 'none';
    }, sel);
    expect(t).toBe('none');
  }
});
