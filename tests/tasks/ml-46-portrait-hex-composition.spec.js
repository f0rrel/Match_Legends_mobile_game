// PENDING TASK TEST — ml-46 full-width portrait hex composition. Expected to FAIL until done.
//
// Definition of done: on a portrait phone the existing 61-cell hex board runs
// essentially the full width of the screen (~4px breathing room), sits lower than
// today with the spare room split above and below it, the top HUD above it and
// nothing but the existing power/hint bar under it. On a short screen where the
// width will not fit under the HUD, the board fills the whole free height instead.
// The hexagon never loses its shape (no stretched cells), no new UI appears beside
// it, and the board still plays exactly as before.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

const PORTRAITS = [
  { width: 360, height: 600 },
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];
// The two screen sizes with room to spare: here the board must reach the sides
// and the composition must be balanced (lower than before, not pinned to the top).
const ROOMY = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];

// The hexagon's own box on screen: the union of every tile's box, measured from
// what the player actually sees rather than from a container element.
async function hexBox(page) {
  return page.evaluate(() => {
    const boxes = [...document.querySelectorAll('#board .tile')].map(el => el.getBoundingClientRect());
    if (!boxes.length) return null;
    return {
      count: boxes.length,
      left: Math.min(...boxes.map(b => b.left)),
      right: Math.max(...boxes.map(b => b.right)),
      top: Math.min(...boxes.map(b => b.top)),
      bottom: Math.max(...boxes.map(b => b.bottom)),
    };
  });
}

// Where the board sits between the HUD above it and the bottom bar under it.
async function composition(page) {
  const box = await hexBox(page);
  const hud = await page.locator('#solo-hud').boundingBox();
  const bar = await page.locator('.power-row').boundingBox();
  return {
    box,
    width: box.right - box.left,
    height: box.bottom - box.top,
    above: box.top - (hud.y + hud.height),
    below: bar.y - box.bottom,
  };
}

for (const { width, height } of PORTRAITS) {
  test(`the hex board fills the phone at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = await openGame(page);
    await startLevel(page, 1);
    const c = await composition(page);

    expect(c.box.count).toBe(61);
    // inside the screen, never over the HUD above or the bar below
    expect(c.box.left).toBeGreaterThanOrEqual(-1);
    expect(c.box.right).toBeLessThanOrEqual(width + 1);
    expect(c.above).toBeGreaterThanOrEqual(-1);
    expect(c.below).toBeGreaterThanOrEqual(-1);

    // Either it spans essentially the whole width, or — on a short screen — it
    // fills the whole free height between the HUD and the bottom bar.
    const spansWidth = c.width >= width * 0.92;
    const fillsHeight = c.above <= 30 && c.below <= 30;
    expect(spansWidth || fillsHeight).toBe(true);
    expect(errors).toEqual([]);
  });
}

for (const { width, height } of ROOMY) {
  test(`the hex board reaches both sides at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openGame(page);
    await startLevel(page, 1);
    const c = await composition(page);

    expect(c.width).toBeGreaterThanOrEqual(width * 0.92);
    // ~4px breathing room at the edges, no side gutters or columns
    expect(c.box.left).toBeLessThanOrEqual(8);
    expect(width - c.box.right).toBeLessThanOrEqual(8);
    // sits lower than today: there is real room above it, not pinned to the top
    expect(c.above).toBeGreaterThan(30);
    // balanced: the spare room above and below is roughly even
    expect(Math.abs(c.above - c.below)).toBeLessThan(90);
  });
}

test('the hexagon keeps its true shape, no cell is stretched', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page);
  await startLevel(page, 1);
  // stop the idle wobble so the measured boxes are the tiles themselves
  await page.evaluate(() => window.setEffectsEnabled(false));
  await page.waitForTimeout(80);

  const c = await composition(page);
  // 61-cell hexagon: 14 units tall for every 9*sqrt(3) units wide
  expect(c.height / c.width).toBeCloseTo(14 / (9 * Math.sqrt(3)), 1);

  const boxes = await page.evaluate(() => [...document.querySelectorAll('#board .tile')]
    .slice(0, 8).map(el => { const b = el.getBoundingClientRect(); return [b.width, b.height]; }));
  const [w, h] = boxes[0];
  expect(w / h).toBeCloseTo(Math.sqrt(3) / 2, 1); // a tile is sqrt(3)/2 as wide as tall
  for (const [bw, bh] of boxes) {
    expect(bw).toBeCloseTo(w, 0);
    expect(bh).toBeCloseTo(h, 0);
  }
});

test('the board still plays: 61 tiles, a move still lands', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await openGame(page);
  await startLevel(page, 1);

  await expect(page.locator('#board .tile')).toHaveCount(61);
  const before = Number(await page.locator('#solo-moves').textContent());
  await playOneMove(page);
  await expect(page.locator('#solo-moves')).toHaveText(String(before - 1));
  await expect(page.locator('#board .tile')).toHaveCount(61);
  expect(errors).toEqual([]);
});

test('a desktop viewport keeps the game column and the board intact', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors = await openGame(page);
  await startLevel(page, 1);

  const app = await page.locator('#app').boundingBox();
  expect(app.width).toBeLessThanOrEqual(481);
  const c = await composition(page);
  expect(c.box.count).toBe(61);
  // the board stays inside the centred game column
  expect(c.box.left).toBeGreaterThanOrEqual(app.x - 1);
  expect(c.box.right).toBeLessThanOrEqual(app.x + app.width + 1);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(1281);
  // and a move still works
  const before = Number(await page.locator('#solo-moves').textContent());
  await playOneMove(page);
  await expect(page.locator('#solo-moves')).toHaveText(String(before - 1));
  expect(errors).toEqual([]);
});
