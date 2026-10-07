// PENDING TASK TEST — ml-29 burst class. Expected to FAIL until done.
//
// Definition of done: findMatches() reports how big the match is on the set it
// returns: 'normal' for a 3-run, 'big' for a 4-run, 'huge' for a 5-run or longer.
const test = require('node:test');
const assert = require('node:assert');
const { ML, stuckBoard } = require('../helpers/boards.js');

// The stuck pattern (helpers/boards.js) has no matches at all; overwrite one straight
// run of `len` cells with a single type and keep the first board where that run really
// is the longest one on the board.
function boardWithRun(len){
  for (const line of ML.HEX_ALL_LINES){
    for (let i = 0; i + len <= line.length; i++){
      const board = stuckBoard();
      line.slice(i, i + len).forEach(c => { board[ML.hexKey(c.q, c.r)] = ML.TYPES[0]; });
      const matched = ML.findMatches(board);
      const runs = Object.values(matched.runLen || {});
      if (runs.length && Math.max(...runs) === len) return board;
    }
  }
  throw new Error('could not build a board with a run of ' + len);
}

test('a 3-run is a normal match', () => {
  assert.strictEqual(ML.findMatches(boardWithRun(3)).burstClass, 'normal');
});

test('a 4-run is a big match', () => {
  assert.strictEqual(ML.findMatches(boardWithRun(4)).burstClass, 'big');
});

test('a 5-run is a huge match', () => {
  assert.strictEqual(ML.findMatches(boardWithRun(5)).burstClass, 'huge');
});

test('a 7-run is still a huge match', () => {
  assert.strictEqual(ML.findMatches(boardWithRun(7)).burstClass, 'huge');
});

test('an empty board has no burst class to report', () => {
  assert.strictEqual(ML.findMatches({}).burstClass, 'normal');
});
