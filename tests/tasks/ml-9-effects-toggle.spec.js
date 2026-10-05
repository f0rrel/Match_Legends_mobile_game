// PENDING TASK TEST — ml-9 effects toggle. Expected to FAIL until done.
//
// Definition of done: the game exposes window.effectsEnabled() (true by default) and
// window.setEffectsEnabled(on), which stores the value the same way the sound setting is
// stored so it survives a reload, and shows a visible 'Effects' toggle beside the sound
// toggle that flips it.
const { test, expect } = require('@playwright/test');
const { openGame } = require('../helpers/game.js');

test('the effects switch exists and is on by default', async ({ page }) => {
  const errors = await openGame(page);

  expect(await page.evaluate(() => typeof window.effectsEnabled)).toBe('function');
  expect(await page.evaluate(() => window.effectsEnabled())).toBe(true);
  expect(errors).toEqual([]);
});

test('turning effects off survives closing and reopening the game', async ({ page }) => {
  await openGame(page);

  await page.evaluate(() => window.setEffectsEnabled(false));
  await page.reload();
  expect(await page.evaluate(() => window.effectsEnabled())).toBe(false);

  await page.evaluate(() => window.setEffectsEnabled(true));
  await page.reload();
  expect(await page.evaluate(() => window.effectsEnabled())).toBe(true);
});

test('there is a toggle beside the sound toggle that flips the setting', async ({ page }) => {
  await openGame(page);

  const toggle = page.getByRole('button', { name: /effect/i });
  await expect(toggle).toBeVisible();

  await toggle.click();
  expect(await page.evaluate(() => window.effectsEnabled())).toBe(false);

  await page.reload();
  expect(await page.evaluate(() => window.effectsEnabled())).toBe(false);
});
