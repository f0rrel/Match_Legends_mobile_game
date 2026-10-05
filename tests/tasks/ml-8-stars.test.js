// PENDING TASK TEST — ml-8 star-rating (logic). Expected to FAIL until the task is done.
//
// Definition of done: MatchLogic.starsForScore(score, target) rates a solo level:
// 0 below the target, 1 at or above it, 2 at or above 1.25 x target, 3 at or above
// 1.5 x target.
const test = require('node:test');
const assert = require('node:assert/strict');
const { ML } = require('../helpers/boards.js');

test('starsForScore is exported', () => {
  assert.equal(typeof ML.starsForScore, 'function');
});

for (const [score, target, stars] of [
  [0, 1800, 0], [1799, 1800, 0], [1800, 1800, 1], [2249, 1800, 1], [2250, 1800, 2],
  [2699, 1800, 2], [2700, 1800, 3], [9000, 1800, 3], [6200, 6200, 1], [9300, 6200, 3],
]) {
  test(`${score} / ${target} -> ${stars} star(s)`, () => {
    assert.equal(ML.starsForScore(score, target), stars);
  });
}
