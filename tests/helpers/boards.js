// Shared helpers for the logic tests: hand-built boards and a deterministic rng.
const ML = require('../../www/js/match-logic.js');

// (col + 2*row) mod 6 over the six tile types: no matches and no legal move anywhere.
function stuckBoard() {
  const board = {};
  ML.CELLS.forEach(c => {
    board[ML.cellKey(c.col, c.row)] = ML.TYPES[(((c.col + 2 * c.row) % 6) + 6) % 6];
  });
  return board;
}

// A tiny deterministic generator (an LCG), independent of any game code.
function testRng(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function typeCounts(board) {
  const counts = {};
  Object.values(board).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  return counts;
}

module.exports = { ML, stuckBoard, testRng, typeCounts };
