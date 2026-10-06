// PENDING TASK TEST — ml-16 monster faces on the board. Expected to FAIL until done.
//
// Definition of done: every tile draws its monster with the SVG artwork from
// www/js/monster-tiles.js, the emoji are gone, and each tile shows its own type's shape.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');

test('every tile on the board wears a monster face', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  expect(await page.locator('#board .tile').count()).toBe(61);
  expect(await page.locator('#board .tile svg').count()).toBe(61);

  const leftovers = await page.evaluate(() =>
    [...document.querySelectorAll('#board .tile')].map((t) => t.textContent.trim()).filter(Boolean));
  expect(leftovers).toEqual([]);
  expect(errors).toEqual([]);
});

test('each monster draws its own shape', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);

  const { drawn, wanted } = await page.evaluate(() => {
    const firstPath = (markup) => {
      const m = /<path[^>]*\sd="([^"]*)"/.exec(String(markup));
      return m ? m[1].replace(/\s+/g, ' ').trim() : null;
    };
    const w = {};
    window.MatchLogic.TYPES.forEach((type) => { w[type] = firstPath(window.MonsterTiles.monsterTileSVG(type)); });
    const d = {};
    document.querySelectorAll('#board .tile').forEach((tile) => {
      const svg = tile.querySelector('svg');
      d[tile.dataset.type] = svg ? firstPath(svg.outerHTML) : null;
    });
    return { drawn: d, wanted: w };
  });

  const types = Object.keys(drawn);
  expect(types.length).toBeGreaterThan(0);
  for (const type of types) {
    expect(wanted[type], type + ' should have artwork').toBeTruthy();
    expect(drawn[type], type + ' should draw a silhouette on the board').toBeTruthy();
    expect(drawn[type]).toBe(wanted[type]);
  }
});
