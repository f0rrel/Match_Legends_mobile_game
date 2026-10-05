// PENDING TASK TEST — ml-4 hint (logic). Expected to FAIL until the task is done.
//
// Definition of done: MatchLogic.findHint(board) returns { a: {q, r}, b: {q, r} },
// two adjacent cells whose swap creates a match, or null when no swap does. It does
// not modify the board.
const test = require('node:test');
const assert = require('node:assert/strict');
const { ML, stuckBoard, testRng } = require('../helpers/boards.js');

test('findHint is exported', () => {
  assert.equal(typeof ML.findHint, 'function');
});

function swapMatches(board, hint) {
  const copy = { ...board };
  ML.swapHex(copy, hint.a, hint.b);
  return ML.findMatches(copy).size > 0;
}

test('no hint on a board without legal moves', () => {
  assert.equal(ML.findHint(stuckBoard()), null);
});

test('the hint is an adjacent swap that makes a match, and the board is untouched', () => {
  const board = stuckBoard();
  // 'planted' never occurs on a dealt board, so only this near-match exists.
  board['0,-1'] = 'planted';
  board['0,0'] = 'planted';
  board['1,1'] = 'planted';
  const before = { ...board };

  const hint = ML.findHint(board);

  assert.ok(hint);
  assert.ok(ML.isHexAdjacent(hint.a, hint.b));
  assert.ok(swapMatches(board, hint));
  assert.deepEqual(board, before);
});

test('every dealt board has a valid hint', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const board = ML.createPlayableBoard(testRng(seed));
    const hint = ML.findHint(board);
    assert.ok(hint, `seed ${seed}`);
    assert.ok(ML.isHexAdjacent(hint.a, hint.b), `seed ${seed}`);
    assert.ok(swapMatches(board, hint), `seed ${seed}`);
  }
});
