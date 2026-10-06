// PENDING TASK TEST — ml-26 cascade beat. Expected to FAIL until done.
//
// Definition of done: the cascade takes the beat it plays from the game logic's match
// beat table instead of hard-coded waits. After a move the game reports the beat used
// for each clearing step, and every one of them is exactly MatchLogic.matchBeat(run).
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

test('the cascade plays the beat from the logic table', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  await playOneMove(page);

  const beats = await page.evaluate(() =>
    window.__ML_TEST__ && typeof window.__ML_TEST__.lastBeats === 'function'
      ? window.__ML_TEST__.lastBeats() : null);
  expect(Array.isArray(beats)).toBe(true);
  expect(beats.length).toBeGreaterThan(0);

  for (const b of beats) {
    const expected = await page.evaluate(r => window.MatchLogic.matchBeat(r), b.run);
    expect(b.run).toBeGreaterThanOrEqual(3);
    expect(b.swell).toBe(expected.swell);
    expect(b.pop).toBe(expected.pop);
    expect(b.fall).toBe(expected.fall);
    expect(b.total).toBe(expected.total);
    if (b.run === 3) {
      expect(b.total).toBeGreaterThanOrEqual(400);
      expect(b.total).toBeLessThanOrEqual(600);
    }
    expect(b.total).toBeLessThanOrEqual(1000);
  }
  expect(errors).toEqual([]);
});
