// PENDING TASK TEST — ml-45 the combine on the board. Expected to FAIL until done.
//
// Definition of done: swapping two line blasters together is a legal move even
// with no match, it clears the first blaster's q-line and the second one's r-line,
// and it still costs exactly one move.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, swipe } = require('../helpers/game.js');
const { ML, stuckBoard } = require('../helpers/boards.js');

const k = ML.hexKey;

// The keys of the axis line (q, r or s) that runs through the cell (q, r).
const lineKeys = (axis, q, r) =>
  ML.HEX_LINE_GROUPS[axis]
    .find(line => line.some(c => c.q === q && c.r === r))
    .map(c => k(c.q, c.r));

test('two line blasters swapped together clear both axes, for one move', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  const board = stuckBoard();
  board[k(0, 0)] = 'sword+line';
  board[k(1, 0)] = 'gem+line';
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

  await swipe(page, { q: 0, r: 0 }, { q: 1, r: 0 });
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && !s.busy && s.movesLeft === 19;
  });

  const popped = await page.evaluate(() => [...new Set(window.__popped)]);
  for (const key of lineKeys('q', 0, 0)) expect(popped).toContain(key);
  for (const key of lineKeys('r', 0, 0)) expect(popped).toContain(key);
  expect(errors).toEqual([]);
});
