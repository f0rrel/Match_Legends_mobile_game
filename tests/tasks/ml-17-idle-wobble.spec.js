// PENDING TASK TEST — ml-17 idle wobble. Expected to FAIL until done.
//
// Definition of done: tiles wobble gently while idle, the wobble stops for a player who
// asked for reduced motion or turned effects off, and input is never blocked by it.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

const tileAnim = (page) => page.evaluate(() => {
  const cs = getComputedStyle(document.querySelector('#board .tile'));
  return { name: cs.animationName, duration: cs.animationDuration };
});

test('idle tiles wobble gently', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const anim = await tileAnim(page);
  expect(anim.name).not.toBe('none');
  expect(parseFloat(anim.duration)).toBeLessThanOrEqual(4);
  expect(errors).toEqual([]);
});

test('the wobble never blocks a move', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);

  const before = Number(await page.locator('#solo-moves').textContent());
  await playOneMove(page);
  await expect(page.locator('#solo-moves')).toHaveText(String(before - 1));
});

test('no wobble when the player asked for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGame(page);
  await startLevel(page, 1);

  expect((await tileAnim(page)).name).toBe('none');
});

test('no wobble when effects are switched off', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);

  await page.evaluate(() => window.setEffectsEnabled(false));
  expect((await tileAnim(page)).name).toBe('none');
});
