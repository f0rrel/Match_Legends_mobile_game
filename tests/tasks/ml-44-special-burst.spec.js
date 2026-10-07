// PENDING TASK TEST — ml-44 the special burst. Expected to FAIL until done.
//
// Definition of done: each kind of special plays its own, distinct burst, shorter
// than the 1 s cap, and reduced motion still gets nothing long.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');
const { ML, stuckBoard } = require('../helpers/boards.js');

const k = ML.hexKey;
const KINDS = ['line', 'bomb'];

async function burstOf(page, kind) {
  return page.locator(`#board .tile[data-special="${kind}"]`).first().evaluate(el => {
    el.classList.add('matchPop');
    const s = getComputedStyle(el);
    const out = { name: s.animationName, dur: s.animationDuration };
    el.classList.remove('matchPop');
    return out;
  });
}

const ms = dur => parseFloat(dur) * (dur.includes('ms') ? 1 : 1000);

test('each special bursts its own way, inside the beat', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const board = stuckBoard();
  board[k(0, 0)] = 'sword+line';
  board[k(1, 0)] = 'gem+bomb';
  await page.evaluate(b => window.__ML_TEST__.setBoard(b), board);

  const bursts = [];
  for (const kind of KINDS) bursts.push(await burstOf(page, kind));

  bursts.forEach(b => {
    expect(b.name).not.toBe('none');
    expect(ms(b.dur)).toBeLessThanOrEqual(1000);
  });
  expect(new Set(bursts.map(b => b.name)).size).toBe(2);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const calm = await burstOf(page, 'bomb');
  expect(ms(calm.dur)).toBeLessThan(50);
  expect(errors).toEqual([]);
});
