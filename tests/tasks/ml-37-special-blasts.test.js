// PENDING TASK TEST — ml-37 lineBlast / cellsOfType / specialTargets. Expected to FAIL until done.
//
// Definition of done: a line blaster clears its whole q-line, a colour bomb clears
// every tile of one monster, and one call returns what a special clears.
const test = require('node:test');
const assert = require('node:assert');
const { ML, stuckBoard } = require('../helpers/boards.js');
const key = ML.hexKey;

test('a line blaster clears its whole q-line', () => {
  const board = stuckBoard();
  const blast = ML.lineBlast(board, key(0, -1));
  const line = ML.HEX_LINE_GROUPS.q.find(l => l[0].q === 0).map(c => key(c.q, c.r));
  assert.deepStrictEqual([...blast].sort(), line.slice().sort());
  assert.ok(blast.has(key(0, -1)));
  [...blast].forEach(k => assert.strictEqual(k.split(',')[0], '0'));
});

test('a line blaster near the edge clears the shorter line', () => {
  const board = stuckBoard();
  const blast = ML.lineBlast(board, key(4, 0));
  const line = ML.HEX_LINE_GROUPS.q.find(l => l[0].q === 4).map(c => key(c.q, c.r));
  assert.deepStrictEqual([...blast].sort(), line.slice().sort());
  assert.ok(blast.size < 9);
});

test('a colour bomb clears every tile of one monster', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'gem';
  board[key(0, 1)] = 'gem+line';
  const blast = ML.cellsOfType(board, 'gem');
  assert.ok(blast.has(key(0, 0)));
  assert.ok(blast.has(key(0, 1)), 'a special of that monster is cleared too');
  [...blast].forEach(k => assert.strictEqual(ML.baseType(board[k]), 'gem'));
  const expected = Object.keys(board).filter(k => ML.baseType(board[k]) === 'gem');
  assert.strictEqual(blast.size, expected.length);
  assert.ok(!blast.has(key(1, 0)));
});

test('a line blaster clears its line through specialTargets', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+line';
  const blast = ML.specialTargets(board, key(0, 0));
  assert.ok(blast.has(key(0, -4)) && blast.has(key(0, 4)));
  assert.ok(!blast.has(key(1, 0)));
});

test('a colour bomb clears the monster it was swapped with', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+bomb';
  board[key(1, 0)] = 'gem';
  const blast = ML.specialTargets(board, key(0, 0), 'gem');
  assert.ok(blast.has(key(1, 0)));
  assert.ok(!blast.has(key(0, 0)), 'the sword bomb itself is not a gem');
  [...blast].forEach(k => assert.strictEqual(ML.baseType(board[k]), 'gem'));
});

test('a colour bomb with no swap partner clears its own monster', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'gem+bomb';
  const blast = ML.specialTargets(board, key(0, 0));
  assert.ok(blast.has(key(0, 0)));
  [...blast].forEach(k => assert.strictEqual(ML.baseType(board[k]), 'gem'));
});

test('a plain tile clears nothing on its own', () => {
  const board = stuckBoard();
  assert.strictEqual(ML.specialTargets(board, key(0, 0)).size, 0);
});
