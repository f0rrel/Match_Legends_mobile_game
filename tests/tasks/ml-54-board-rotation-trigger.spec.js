// ACCEPTANCE TEST — ml-54 a settled match of the trigger size turns the board one Hex side.
// REWRITTEN for ml-58/ml-59: the turn is ANTICLOCKWISE and the test threshold is a run of 4.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe } = require('../helpers/game.js');

const boardAngle = (page) => page.evaluate(() => {
  const t = getComputedStyle(document.getElementById('board')).transform;
  if (!t || t === 'none') return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;
  const p = m[1].split(',').map(Number);
  const deg = Math.round(Math.atan2(p[1], p[0]) * 180 / Math.PI);
  return ((deg % 360) + 360) % 360;
});

// A straight run of n monsters on the board's left edge column (q = -HEX_RADIUS,
// which always holds five cells). The run is already a match, so the next swipe
// settles a cascade that contains it.
async function placeRun(page, n){
  await page.evaluate((count) => {
    const ML = window.MatchLogic;
    const board = { ...window.__ML_TEST__.session().board };
    ML.HEX_CELLS.filter(c => c.q === -ML.HEX_RADIUS).sort((a, b) => a.r - b.r).slice(0, count)
      .forEach(c => { board[ML.hexKey(c.q, c.r)] = ML.TYPES[0]; });
    window.__ML_TEST__.setBoard(board);
  }, n);
}

async function playRun(page, n){
  // A swipe only counts once the move is actually taken: waiting for !busy
  // alone returns straight away when the swipe landed while the tiles were
  // still repainting from setBoard, and the test would read the board before
  // any cascade -- let alone its turn -- had run. Three tries, then give up.
  const before = await page.evaluate(() => window.__ML_TEST__.session().movesLeft);
  const taken = () => page.evaluate((b) => window.__ML_TEST__.session().movesLeft < b, before);
  for (let attempt = 0; attempt < 3; attempt++){
    await placeRun(page, n);
    await swipe(page, { q: -3, r: 0 }, { q: -2, r: 0 });
    await page.waitForFunction((b) => {
      const s = window.__ML_TEST__.session();
      return !s.busy && s.movesLeft < b;
    }, before, { timeout: 20000 }).catch(() => {});
    if (await taken()) return;
  }
  throw new Error('the qualifying swipe never settled a cascade');
}

async function restartLevel(page){
  await page.click('#btn-game-back');
  await page.locator('#level-grid .level-card').nth(0).click();
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && s.elMap && document.querySelectorAll('#board .tile').length === 61;
  });
}

test('a 4-match turns the board one side anticlockwise; a 3-match does not', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  expect(await boardAngle(page)).toBe(0);

  await playRun(page, 3);
  await page.waitForTimeout(1200);
  // The 3-match never earns a turn. A cascade may CHAIN a 4+ run into it as the
  // tiles fall, and that earns one by the same rule as a player's own 4+ match,
  // so read what the cascade actually held before calling the board wrong.
  const runs = await page.evaluate(() => window.__ML_TEST__.lastBeats().map(b => b.run));
  const chained = runs.some(r => r >= 4);
  expect(await boardAngle(page)).toBe(chained ? 300 : 0);

  // The qualifying match turns it exactly one side on from where it now rests.
  const rested = await boardAngle(page);
  await playRun(page, 4);
  const turned = ((rested - 60) % 360 + 360) % 360;
  await expect.poll(() => boardAngle(page)).toBe(turned);
  await page.waitForTimeout(1200);
  expect(await boardAngle(page)).toBe(turned); // and it stays there
  expect(errors).toEqual([]);
});

test('a new level starts upright; reduced motion and effects off leave it alone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openGame(page);
  await startLevel(page, 1);

  await playRun(page, 4);
  await expect.poll(() => boardAngle(page)).toBe(300);

  await restartLevel(page);
  expect(await boardAngle(page)).toBe(0); // reset on level start/replay

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await playRun(page, 4);
  await page.waitForTimeout(1200);
  expect(await boardAngle(page)).toBe(0);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => window.setEffectsEnabled(false));
  await playRun(page, 4);
  await page.waitForTimeout(1200);
  expect(await boardAngle(page)).toBe(0);

  await page.evaluate(() => window.setEffectsEnabled(true));
  await playRun(page, 4);
  await expect.poll(() => boardAngle(page)).toBe(300);
});

// The sixth qualifying cascade closes the ring. The board rests upright again,
// but it must GET there by turning the last 60° anticlockwise onto a full turn
// (-360deg) -- a resting angle that only matches modulo 360 would crawl the
// other 300° round instead, which is exactly what the eye catches.
test('the sixth turn comes home anticlockwise, and the board still turns after it', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);
  // Put the board on the last side of the cycle: one turn away from upright.
  await page.evaluate(() => {
    window.__ML_TEST__.session().rotStep = 5;
    document.getElementById('board').dataset.rot = '5';
  });
  await expect.poll(() => boardAngle(page)).toBe(60);
  await page.waitForTimeout(1200);

  const moves = await page.evaluate(() => window.__ML_TEST__.session().movesLeft);
  await placeRun(page, 4);
  await swipe(page, { q: -3, r: 0 }, { q: -2, r: 0 });

  // Sample the turn itself: every reading must sit anticlockwise of the side
  // the turn started from, and the turn must actually be seen in progress.
  const seen = [];
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline){
    seen.push(await boardAngle(page));
    const state = await page.evaluate(() => ({
      busy: window.__ML_TEST__.session().busy,
      moves: window.__ML_TEST__.session().movesLeft,
      rot: document.getElementById('board').dataset.rot,
    }));
    const settled = !state.busy && state.moves < moves && state.rot === '0';
    if (seen.length > 2 && settled && seen[seen.length - 1] === 0) break;
    await page.waitForTimeout(60);
  }
  const travelled = seen.map(a => {
    let d = (((a - 60) % 360) + 360) % 360; // clockwise distance from the side it left
    return d > 180 ? d - 360 : d;           // signed the short way round
  });
  for (const d of travelled) expect(d).toBeLessThanOrEqual(0); // never clockwise
  expect(travelled.some(d => d < -5 && d > -60)).toBe(true);   // seen mid-turn

  expect(await boardAngle(page)).toBe(0); // upright, and it stays there
  await page.waitForTimeout(1200);
  expect(await boardAngle(page)).toBe(0);
  expect(await page.evaluate(() => window.__ML_TEST__.session().rotStep)).toBe(0);
  expect(await page.evaluate(() => document.getElementById('board').dataset.rot)).toBe('0');

  // The next qualifying cascade starts a fresh cycle from upright.
  await playRun(page, 4);
  await expect.poll(() => boardAngle(page), { timeout: 15000 }).toBe(300);
  expect(errors).toEqual([]);
});
