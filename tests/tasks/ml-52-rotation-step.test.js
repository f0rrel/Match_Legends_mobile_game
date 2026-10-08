// ACCEPTANCE TEST — ml-52 the board's orientation step, and how a swipe is read in it.
const { test } = require('node:test');
const assert = require('node:assert');
const ML = require('../../www/js/match-logic.js');

test('a rotation step advances clockwise and wraps through all six sides', () => {
  assert.strictEqual(ML.ROTATION_STEPS, 6);
  const seen = [];
  let step = 0;
  for (let i = 0; i < 7; i++){ seen.push(step); step = ML.advanceRotationStep(step); }
  assert.deepStrictEqual(seen, [0, 1, 2, 3, 4, 5, 0]);
  assert.strictEqual(ML.advanceRotationStep(0), 1);
  assert.strictEqual(ML.advanceRotationStep(5), 0);
  let s = 0;
  for (let i = 0; i < 60; i++){ s = ML.advanceRotationStep(s); assert.ok(s >= 0 && s < 6); }
});

test('a swipe is read in the orientation the board is shown in', () => {
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 0), [1, 0]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0), [1, 0]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 1), [1, -1]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 5), [0, 1]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 6), [1, 0]);
});
