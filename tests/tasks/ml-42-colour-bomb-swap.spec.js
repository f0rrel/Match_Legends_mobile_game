// PENDING TASK TEST — ml-42 the colour bomb's swap. Expected to FAIL until done.
//
// Definition of done: swapping a colour bomb with a plain tile is a legal move and
// clears every tile of that plain tile's monster.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe } = require('../helpers/game.js');
const { ML, stuckBoard } = require('../helpers/boards.js');

const k = ML.hexKey;

test('swapping a colour bomb clears every tile of the monster it is swapped with', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const board = stuckBoard();
  board[k(0, 0)] = 'sword+bomb';
  board[k(1, 0)] = 'gem';
  await page.evaluate(b => window.__ML_TEST__.setBoard(b), board);

  // After the swap the bomb sits at (1,0) and the gem at (0,0).
  const gems = Object.keys(board)
    .filter(key => ML.baseType(board[key]) === 'gem')
    .map(key => (key === '1,0' ? '0,0' : key));
  expect(gems.length).toBeGreaterThan(3);

  await page.evaluate(() => {
    window.__popped = [];
    new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type !== 'attributes' || !m.target.classList) continue;
        if (!m.target.classList.contains('matchPop')) continue;
        window.__popped.push(m.target.dataset.q + ',' + m.target.dataset.r);
      }
    }).observe(document.querySelector('#board'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  });

  await swipe(page, { q: 0, r: 0 }, { q: 1, r: 0 });
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && !s.busy && s.movesLeft === 19;
  });

  const popped = await page.evaluate(() => [...new Set(window.__popped)]);
  gems.forEach(key => expect(popped).toContain(key));
  expect(popped).toContain('1,0'); // the bomb itself goes with it
  expect(errors).toEqual([]);
});
