// PENDING TASK TEST — ml-35 specialAnchor. Expected to FAIL until done.
//
// Definition of done: the special lands where the player played when that cell is
// part of the match, and in the middle of the longest run otherwise.
const test = require('node:test');
const assert = require('node:assert');
const { ML, stuckBoard } = require('../helpers/boards.js');
const key = ML.hexKey;

function boardWith(cells) {
  const board = stuckBoard();
  cells.forEach(([q, r]) => { board[key(q, r)] = 'shield'; });
  return board;
}

const RUN = [[0, -2], [0, -1], [0, 0], [0, 1]];

test('the special lands where the player played', () => {
  const board = boardWith(RUN);
  const matched = ML.findMatches(board);
  const played = { q: 0, r: -1 };
  const other = { q: 1, r: -1 };
  assert.deepStrictEqual(ML.specialAnchor(board, matched, played, other), { q: 0, r: -1 });
  assert.deepStrictEqual(ML.specialAnchor(board, matched, other, played), { q: 0, r: -1 });
});

test('with no played cell in the match the middle of the longest run wins', () => {
  const board = boardWith(RUN);
  const matched = ML.findMatches(board);
  const anchor = ML.specialAnchor(board, matched, { q: -1, r: 0 }, { q: 1, r: -1 });
  assert.strictEqual(anchor.q, 0);
  assert.strictEqual(anchor.r, -1);
});

test('the anchor is always a cell of the match', () => {
  const board = boardWith(RUN);
  const matched = ML.findMatches(board);
  const anchor = ML.specialAnchor(board, matched, { q: -3, r: 1 }, { q: 3, r: -2 });
  assert.ok(matched.has(ML.hexKey(anchor.q, anchor.r)));
});
