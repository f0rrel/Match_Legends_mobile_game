// PENDING TASK TEST — ml-34 matchShape. Expected to FAIL until done.
//
// Definition of done: matchShape(matched) names the special a match leaves:
// 'bomb' for a run of 5+, 'line' for a run of exactly 4, null for a plain 3-match.
const test = require('node:test');
const assert = require('node:assert');
const { ML, stuckBoard } = require('../helpers/boards.js');
const key = ML.hexKey;

function shapeOf(cells) {
  const board = stuckBoard();
  cells.forEach(([q, r]) => { board[key(q, r)] = 'shield'; });
  return ML.matchShape(ML.findMatches(board));
}

test('a plain 3-match leaves no special', () => {
  assert.strictEqual(shapeOf([[0, -1], [0, 0], [0, 1]]), null);
});

test('a 4-in-a-row leaves a line blaster', () => {
  assert.strictEqual(shapeOf([[0, -2], [0, -1], [0, 0], [0, 1]]), 'line');
});

test('a 5-in-a-row leaves a colour bomb', () => {
  assert.strictEqual(shapeOf([[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]]), 'bomb');
});

test('a 7-in-a-row is still a colour bomb', () => {
  const cells = [];
  for (let r = -4; r <= 2; r++) cells.push([0, r]);
  assert.strictEqual(shapeOf(cells), 'bomb');
});
