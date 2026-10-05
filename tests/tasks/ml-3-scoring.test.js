// PENDING TASK TEST — ml-3 scoring-rules. Expected to FAIL until the task is done.
//
// Definition of done: MatchLogic.scoreMatch({ size, maxRun, combo, buffMult })
// returns the points for one cascade step, using the game's existing rules:
//   base   = size * BASE_POINTS * combo * sizeBonus,
//            sizeBonus = 2 for a run of 5+, 1.5 for a run of 4, otherwise 1
//   points = round(base), then, if buffMult is given, round(points * buffMult)
// and the game's resolveCascade uses it instead of computing the score inline.
const test = require('node:test');
const assert = require('node:assert/strict');
const { ML } = require('../helpers/boards.js');

test('scoreMatch is exported', () => {
  assert.equal(typeof ML.scoreMatch, 'function');
});

const cases = [
  // [size, maxRun, combo, buffMult, expected]
  [3, 3, 1, undefined, 60],
  [4, 4, 1, undefined, 120],
  [5, 5, 1, undefined, 200],
  [6, 6, 1, undefined, 240],
  [6, 3, 1, undefined, 120],   // two separate runs of 3
  [3, 3, 2, undefined, 120],   // combo x2
  [4, 4, 3, undefined, 360],
  [3, 3, 1, 1.5, 90],          // score buff
  [3, 4, 3, 1.5, 405],
  [3, 3, 1, 1.33, 80],         // 79.8 rounds to 80
  [5, 5, 2, 2, 800],
];

for (const [size, maxRun, combo, buffMult, expected] of cases) {
  test(`size ${size}, run ${maxRun}, combo ${combo}, buff ${buffMult ?? 'none'} -> ${expected}`, () => {
    const args = { size, maxRun, combo };
    if (buffMult !== undefined) args.buffMult = buffMult;
    assert.equal(ML.scoreMatch(args), expected);
  });
}
