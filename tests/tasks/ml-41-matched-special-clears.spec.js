// PENDING TASK TEST — ml-41 detonating a matched special. Expected to FAIL until done.
//
// Definition of done: a line blaster that is matched clears its whole line.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe } = require('../helpers/game.js');
const { ML, stuckBoard } = require('../helpers/boards.js');

const k = ML.hexKey;

test('a matched line blaster clears its whole line', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  // A line blaster at (0,0) with a sword on either side of it once the sword at
  // (1,-1) is swiped into (0,-1).
  const board = stuckBoard();
  board[k(0, 0)] = 'sword+line';
  board[k(0, 1)] = 'sword';
  board[k(1, -1)] = 'sword';
  await page.evaluate(b => window.__ML_TEST__.setBoard(b), board);

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

  await swipe(page, { q: 0, r: -1 }, { q: 1, r: -1 });
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && !s.busy && s.movesLeft === 19;
  });

  const popped = await page.evaluate(() => [...new Set(window.__popped)]);
  for (let r = -4; r <= 4; r++) expect(popped).toContain('0,' + r);
  expect(errors).toEqual([]);
});
