// PENDING TASK TEST — ml-36 plantSpecial. Expected to FAIL until done.
//
// Definition of done: the cell keeps its monster and gains the kind, and nothing
// is planted on an empty cell or for an unknown kind.
const test = require('node:test');
const assert = require('node:assert');
const { ML, stuckBoard } = require('../helpers/boards.js');
const key = ML.hexKey;

test('the planted tile keeps its monster and gains the kind', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'gem';
  assert.strictEqual(ML.plantSpecial(board, key(0, 0), 'line'), 'gem+line');
  assert.strictEqual(board[key(0, 0)], 'gem+line');
  assert.strictEqual(ML.plantSpecial(board, key(0, 0), 'bomb'), 'gem+bomb');
});

test('an unknown kind or an empty cell plants nothing', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'gem';
  assert.strictEqual(ML.plantSpecial(board, key(0, 0), 'nope'), null);
  assert.strictEqual(board[key(0, 0)], 'gem');
  assert.strictEqual(ML.plantSpecial(board, key(9, 9), 'line'), null);
});
