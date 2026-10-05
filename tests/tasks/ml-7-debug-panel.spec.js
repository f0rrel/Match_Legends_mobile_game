// PENDING TASK TEST — ml-7 debug-panel. Expected to FAIL until the task is done.
//
// Definition of done: opening the game with ?debug=1 shows a fixed panel with id
// "debug-panel" on every screen (without ?debug=1 it does not exist). It offers:
//   - #debug-seed: the seed of the current level (every solo level is dealt from a
//     seed with MatchLogic.createRng, so its board is reproducible);
//     #debug-seed-input + #debug-seed-apply: restart the current level (level 1 if
//     none) dealt from that seed;
//   - #debug-force-stuck: replace the board with one that has no legal move, so the
//     game's normal "no moves left" reshuffle runs;
//   - #debug-progress: the saved progress (JSON), kept up to date;
//     #debug-clear-progress: delete the saved progress and reset to a new player;
//   - #debug-level (a <select> with levels 1-6) + #debug-go-level: start that level,
//     even a locked one, without unlocking it.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');

const DEBUG = '?debug=1';

function boardFromSeed(page) {
  return page.evaluate(() => {
    const s = window.__ML_TEST__.session();
    const expected = window.MatchLogic.createPlayableBoard(window.MatchLogic.createRng(s.seed));
    return { seed: s.seed, same: JSON.stringify(expected) === JSON.stringify(s.board) };
  });
}

test('without ?debug=1 there is no debug panel', async ({ page }) => {
  await openGame(page);
  await expect(page.locator('#debug-panel')).toHaveCount(0);
});

test('the panel shows the seed, and the board is reproducible from it', async ({ page }) => {
  const errors = await openGame(page, DEBUG);
  await expect(page.locator('#debug-panel')).toBeVisible();
  await startLevel(page, 1);

  const { seed, same } = await boardFromSeed(page);

  expect(typeof seed).toBe('number');
  expect(same).toBe(true);
  await expect(page.locator('#debug-seed')).toHaveText(String(seed));
  expect(errors).toEqual([]);
});

test('setting a seed restarts the level dealt from that seed', async ({ page }) => {
  await openGame(page, DEBUG);
  await startLevel(page, 1);

  await page.fill('#debug-seed-input', '12345');
  await page.click('#debug-seed-apply');
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s.seed === 12345 && s.elMap && document.querySelectorAll('#board .tile').length === 61;
  });

  expect((await boardFromSeed(page)).same).toBe(true);
  await expect(page.locator('#debug-seed')).toHaveText('12345');
  await expect(page.locator('#solo-moves')).toHaveText(
    String(await page.evaluate(() => window.__ML_TEST__.session().level.moves)));
});

test('forcing a stuck board runs the reshuffle', async ({ page }) => {
  await openGame(page, DEBUG);
  await startLevel(page, 1);

  await page.click('#debug-force-stuck');

  await expect(page.locator('#toast')).toContainText('reshuffled');
  const board = await page.evaluate(() => {
    const ML = window.MatchLogic, b = window.__ML_TEST__.session().board;
    return { cells: Object.keys(b).length, matches: ML.findMatches(b).size,
             playable: ML.hasPossibleMove({ ...b }) };
  });
  expect(board).toEqual({ cells: 61, matches: 0, playable: true });
});

test('saved progress can be viewed and cleared', async ({ page }) => {
  await openGame(page, DEBUG);
  await page.click('#home-avatar-strip');
  await page.locator('.avatar-card', { hasText: 'Astrid Frostbane' }).click();
  await expect(page.locator('#debug-progress')).toContainText('viking');

  await page.click('#debug-clear-progress');
  await page.goto(page.url());

  await expect(page.locator('#home-avatar-name')).toHaveText('Marcus the Gladiator');
  expect(await page.evaluate(() => localStorage.getItem('ml_progress'))).toBeNull();
});

test('any level can be started, even a locked one, without unlocking it', async ({ page }) => {
  await openGame(page, DEBUG);

  await page.selectOption('#debug-level', '5');
  await page.click('#debug-go-level');

  await expect(page.locator('#screen-game')).toHaveClass(/active/);
  await expect(page.locator('#game-title')).toContainText('Chapter 5');
  const state = await page.evaluate(() => ({
    level: window.__ML_TEST__.session().level.id,
    unlocked: window.__ML_TEST__.appState().maxLevelUnlocked,
  }));
  expect(state).toEqual({ level: 5, unlocked: 1 });
});
