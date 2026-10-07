// PENDING TASK TEST — ml-33 special tile encoding. Expected to FAIL until done.
//
// Definition of done: a special tile is stored as its monster plus the kind it
// carries ('sword+line'), and matching looks at the monster only, so a special
// still matches with the plain tiles of its own monster.
const test = require('node:test');
const assert = require('node:assert');
const { ML, stuckBoard } = require('../helpers/boards.js');
const key = ML.hexKey;

test('a tile is its monster plus the kind it carries', () => {
  assert.strictEqual(ML.makeSpecial('sword', 'line'), 'sword+line');
  assert.strictEqual(ML.baseType('sword+line'), 'sword');
  assert.strictEqual(ML.baseType('gem'), 'gem');
  assert.strictEqual(ML.specialOf('sword+line'), 'line');
  assert.strictEqual(ML.specialOf('gem'), null);
});

test('a special matches with the plain tiles of its monster', () => {
  const board = stuckBoard();
  board[key(0, -1)] = 'sword';
  board[key(0, 0)] = 'sword+line';
  board[key(0, 1)] = 'sword';
  const matched = ML.findMatches(board);
  [key(0, -1), key(0, 0), key(0, 1)].forEach(k => assert.ok(matched.has(k), k));
  assert.strictEqual(matched.size, 3);
});

test('a special of one monster does not match another monster', () => {
  const board = stuckBoard();
  board[key(0, -1)] = 'sword';
  board[key(0, 0)] = 'shield+line';
  board[key(0, 1)] = 'sword';
  assert.strictEqual(ML.findMatches(board).size, 0);
});
