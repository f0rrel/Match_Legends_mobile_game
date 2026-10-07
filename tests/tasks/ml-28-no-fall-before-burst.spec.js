// PENDING TASK TEST — ml-28 fall waits for the burst. Expected to FAIL until done.
//
// Definition of done: no tile falls before its match has burst. The cascade reports,
// for each clearing step, when the burst started, when it ended and when the tiles
// started to fall - and the fall never starts before the burst has ended.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

test('every step falls only after its burst has ended', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  await playOneMove(page);

  const steps = await page.evaluate(() =>
    window.__ML_TEST__ && typeof window.__ML_TEST__.lastCascade === 'function'
      ? window.__ML_TEST__.lastCascade() : null);
  expect(Array.isArray(steps)).toBe(true);
  expect(steps.length).toBeGreaterThan(0);

  for (const s of steps) {
    expect(s.popStartedAt).toBeGreaterThan(0);
    expect(s.popEndedAt).toBeGreaterThanOrEqual(s.popStartedAt);
    expect(s.fallStartedAt).toBeGreaterThanOrEqual(s.popEndedAt - 1);
    expect(s.fallEndedAt).toBeGreaterThanOrEqual(s.fallStartedAt);
  }
  expect(errors).toEqual([]);
});

test('the burst really takes the beat before the fall starts', async ({ page }) => {
  await openGame(page);
  await startLevel(page, 1);
  await playOneMove(page);

  const steps = await page.evaluate(() => window.__ML_TEST__.lastCascade());
  const beats = await page.evaluate(() => window.__ML_TEST__.lastBeats());
  expect(steps.length).toBe(beats.length);
  for (let i = 0; i < steps.length; i++) {
    const burst = steps[i].popEndedAt - steps[i].popStartedAt;
    expect(burst).toBeGreaterThanOrEqual(beats[i].pop - 40);
  }
});
