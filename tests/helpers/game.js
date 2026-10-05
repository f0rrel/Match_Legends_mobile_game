// Shared Playwright helpers: open the game, start a level, and swipe tiles.
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const GAME_URL = pathToFileURL(path.join(__dirname, '..', '..', 'www', 'index.html')).href;

// Open the game and collect console errors and uncaught page errors.
async function openGame(page) {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(GAME_URL);
  return errors;
}

async function startLevel(page, levelId = 1) {
  await page.click('#btn-goto-levels');
  await page.locator('#level-grid .level-card').nth(levelId - 1).click();
  await page.waitForFunction(() => {
    const s = window.__ML_TEST__.session();
    return s && s.elMap && document.querySelectorAll('#board .tile').length === 61;
  });
}

// A legal swap on the live board, found with the game's own logic.
async function findLegalSwap(page) {
  return page.evaluate(() => {
    const ML = window.MatchLogic;
    const board = { ...window.__ML_TEST__.session().board };
    for (const c of ML.HEX_CELLS) {
      for (const [dq, dr] of ML.HEX_DIRS) {
        const n = { q: c.q + dq, r: c.r + dr };
        if (!(ML.hexKey(n.q, n.r) in board)) continue;
        ML.swapHex(board, c, n);
        const matched = ML.findMatches(board).size > 0;
        ML.swapHex(board, c, n);
        if (matched) return { a: c, b: n };
      }
    }
    return null;
  });
}

async function tileCenter(page, { q, r }) {
  const box = await page.locator(`#board .tile[data-q="${q}"][data-r="${r}"]`).boundingBox();
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

module.exports = { GAME_URL, openGame, startLevel, findLegalSwap, swipe };
