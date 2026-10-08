// ACCEPTANCE TEST — ml-52 the board's orientation step, and how a swipe is read in it.
// REWRITTEN for ml-57: the board turns ANTICLOCKWISE, so step 1 is one Hex side
// counterclockwise and a swipe is read through that turn.
const { test } = require('node:test');
const assert = require('node:assert');
const ML = require('../../www/js/match-logic.js');

test('a rotation step advances one Hex side and wraps through all six', () => {
  assert.strictEqual(ML.ROTATION_STEPS, 6);
  const seen = [];
  let step = 0;
  for (let i = 0; i < 7; i++){ seen.push(step); step = ML.advanceRotationStep(step); }
  assert.deepStrictEqual(seen, [0, 1, 2, 3, 4, 5, 0]);
  assert.strictEqual(ML.advanceRotationStep(5), 0);
  let s = 0;
  for (let i = 0; i < 60; i++){ s = ML.advanceRotationStep(s); assert.ok(s >= 0 && s < 6); }
});

test('a swipe is read in the orientation the board is shown in, anticlockwise', () => {
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 0), [1, 0]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0), [1, 0]);
  // one side anticlockwise: a screen swipe right is the board's down-right cell
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 1), [0, 1]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 2), [-1, 1]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 5), [1, -1]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 6), [1, 0]); // wraps back to upright
});
