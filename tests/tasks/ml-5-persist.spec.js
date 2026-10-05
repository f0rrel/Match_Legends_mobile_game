// PENDING TASK TEST — ml-5 persist-progress. Expected to FAIL until the task is done.
//
// Definition of done: when window.storage is not available (a normal browser or the
// installed app), Storage falls back to localStorage, so progress -- here, the chosen
// legend -- survives a reload.
const { test, expect } = require('@playwright/test');
const { openGame } = require('../helpers/game.js');

test('the chosen legend survives a reload', async ({ page }) => {
  const errors = await openGame(page);
  await expect(page.locator('#home-avatar-name')).toHaveText('Marcus the Gladiator');

  await page.click('#home-avatar-strip');
  await page.locator('.avatar-card', { hasText: 'Astrid Frostbane' }).click();
  await expect(page.locator('#home-avatar-name')).toHaveText('Astrid Frostbane');

  await page.reload();

  await expect(page.locator('#home-avatar-name')).toHaveText('Astrid Frostbane');
  expect(errors).toEqual([]);
});
