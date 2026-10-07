// PENDING TASK TEST — ml-44 the special burst. Expected to FAIL until done.
//
// Definition of done: each kind of special plays its own, distinct burst, shorter
// than the 1 s cap, and reduced motion still gets nothing long.
//
// Both specials here wear the SAME monster (a sword imp), so the only thing that
// can make their bursts differ is the special kind itself -- not the per-monster
// pop. On today's code both tiles fall through to the sword's popChomp, so the two
// names are identical and this test fails; it only passes once ml-44 gives the line
// blaster and the colour bomb their own animations.
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

test('each special kind bursts its own way, inside the beat', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  // Same monster on both tiles: the special kind is the only variable left.
  const board = stuckBoard();
  board[k(0, 0)] = 'sword+line';
  board[k(1, 0)] = 'sword+bomb';
  await page.evaluate(b => window.__ML_TEST__.setBoard(b), board);

  const bursts = [];
  for (const kind of KINDS) bursts.push(await burstOf(page, kind));

  bursts.forEach(b => {
    expect(b.name).not.toBe('none');
    expect(ms(b.dur)).toBeGreaterThan(0);
    expect(ms(b.dur)).toBeLessThanOrEqual(1000);
  });
  // The special kind, not the monster, decides the burst: two different kinds of
  // the same monster must play two different animations.
  expect(bursts[0].name).not.toBe(bursts[1].name);
  expect(new Set(bursts.map(b => b.name)).size).toBe(2);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const calm = await burstOf(page, 'bomb');
  expect(ms(calm.dur)).toBeLessThan(50);
  expect(errors).toEqual([]);
});
