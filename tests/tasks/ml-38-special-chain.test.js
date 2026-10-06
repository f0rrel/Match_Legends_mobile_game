// PENDING TASK TEST — ml-38 chainSpecials. Expected to FAIL until done.
//
// Definition of done: a special inside the cleared set detonates too, all the way
// down the chain, and the caller's set is left alone.
const test = require('node:test');
const assert = require('node:assert');
const { ML, stuckBoard } = require('../helpers/boards.js');
const key = ML.hexKey;

test('a special caught in a blast goes off too', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+line';
  board[key(0, 2)] = 'gem+bomb';
  board[key(3, 0)] = 'gem';
  board[key(3, 1)] = 'gem';
  const start = new Set([key(0, 0), key(0, -1)]);
  const out = ML.chainSpecials(board, start, 'gem');
  assert.ok(out.has(key(0, 2)), 'the chained bomb went off');
  assert.ok(out.has(key(3, 0)), 'and the gems it clears came with it');
  assert.ok(out.has(key(3, 1)));
  assert.ok(out.has(key(0, -1)), 'the rest of the match is still there');
  assert.deepStrictEqual([...start].sort(), [key(0, 0), key(0, -1)].sort(), 'the input set is untouched');
});

test('a set with no special in it comes back as a copy', () => {
  const board = stuckBoard();
  const start = new Set([key(0, 0), key(1, 0)]);
  const out = ML.chainSpecials(board, start, null);
  assert.deepStrictEqual([...out].sort(), [...start].sort());
  assert.notStrictEqual(out, start);
});

test('the board is never changed by the chain', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+line';
  const before = { ...board };
  ML.chainSpecials(board, new Set([key(0, 0)]), 'gem');
  assert.deepStrictEqual(board, before);
});
