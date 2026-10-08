// Shared Playwright helpers: open the game, start a level, and swipe tiles.
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const GAME_URL = pathToFileURL(path.join(__dirname, '..', '..', 'www', 'index.html')).href;

// Open the game and collect console errors and uncaught page errors.
async function openGame(page, query = '') {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(GAME_URL + query);
  return errors;
}

// The level being played, as plain data (for comparing before/after).
async function levelState(page) {
  return page.evaluate(() => {
    const s = window.__ML_TEST__.session();
    return { level: s.level.id, board: { ...s.board }, score: s.score, movesLeft: s.movesLeft };
  });
}

// Play one legal move and wait until the cascade has settled.
async function playOneMove(page) {
  const before = await page.evaluate(() => window.__ML_TEST__.session().movesLeft);
  const move = await findLegalSwap(page);
  await swipe(page, move.a, move.b);
  await page.waitForFunction(m => {
    const s = window.__ML_TEST__.session();
    return s.movesLeft === m && !s.busy;
  }, before - 1);
}

async function startLevel(page, levelId = 1) {
  await page.click('#btn-goto-levels');
  await page.locator('#level-grid .level-card').nth(levelId - 1).click();
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && s.elMap && document.querySelectorAll('#board .tile').length === 72;
  });
}

// A legal swap on the live board, found with the game's own logic.
async function findLegalSwap(page) {
  return page.evaluate(() => {
    const ML = window.MatchLogic;
    const board = { ...window.__ML_TEST__.session().board };
    for (const c of ML.CELLS) {
      for (const [dc, dr] of ML.CELL_CHECK_DIRS) {
        const n = { col: c.col + dc, row: c.row + dr };
        if (!(ML.cellKey(n.col, n.row) in board)) continue;
        ML.swapCells(board, c, n);
        const matched = ML.findMatches(board).size > 0;
        ML.swapCells(board, c, n);
        if (matched) return { a: c, b: n };
      }
    }
    return null;
  });
}

async function tileCenter(page, { col, row }) {
  const box = await page.locator(`#board .tile[data-col="${col}"][data-row="${row}"]`).boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// Swipe from tile a toward its neighbour b, as a player would.
async function swipe(page, a, b) {
  const from = await tileCenter(page, a);
  const to = await tileCenter(page, b);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 5 });
  await page.mouse.up();
}

module.exports = { GAME_URL, openGame, startLevel, findLegalSwap, swipe, levelState, playOneMove };
