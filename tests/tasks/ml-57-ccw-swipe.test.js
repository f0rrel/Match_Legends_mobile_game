// ACCEPTANCE TEST — ml-57 a swipe is read through the anticlockwise turn of the board.
const { test } = require('node:test');
const assert = require('node:assert');
const ML = require('../../www/js/match-logic.js');

test('every orientation step maps a right swipe to a different Hex direction', () => {
  const seen = [];
  for (let step = 0; step < 6; step++){
    const dir = ML.swipeDirForStep(10, 0, step);
    assert.ok(ML.HEX_SWIPE_DIRS.some(d => d[0] === dir[0] && d[1] === dir[1]), 'a real Hex direction');
    seen.push(dir.join(','));
  }
  assert.strictEqual(new Set(seen).size, 6); // six turns, six different answers
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 1), [0, 1]);
  assert.deepStrictEqual(ML.swipeDirForStep(10, 0, 3), [-1, 0]);
});

test('the turn is one uniform rotation for every screen direction and step', () => {
  for (let step = 0; step < 6; step++){
    for (let i = 0; i < 6; i++){
      const a = i * Math.PI / 3;
      const dir = ML.swipeDirForStep(Math.cos(a), Math.sin(a), step);
      assert.deepStrictEqual(dir, ML.HEX_SWIPE_DIRS[(i + step) % 6]);
    }
  }
});
