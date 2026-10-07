// PENDING TASK TEST — ml-22 the match beat table. Expected to FAIL until done.
//
// Definition of done: MatchLogic.matchBeat(maxRun) returns the beat a clearing match
// plays, in milliseconds: { swell, pop, fall, total }. A 3-match pops and falls in
// 400-600 ms, a 4-match and a 5+-match get a bigger moment but never more than 1000 ms,
// and anything smaller than three falls back to the 3-match beat instead of throwing.
const test = require('node:test');
const assert = require('node:assert');
const { ML } = require('../helpers/boards.js');

test('matchBeat is a function', () => {
  assert.strictEqual(typeof ML.matchBeat, 'function');
});

test('a 3-match pops and falls in 0.4-0.6 s', () => {
  const beat = ML.matchBeat(3);
  assert.ok(beat.pop > 0 && beat.fall > 0);
  assert.strictEqual(beat.swell, 0);
  assert.ok(beat.total >= 400 && beat.total <= 600, `3-match beat was ${beat.total} ms`);
});

test('bigger matches get a longer moment, up to about 1 s', () => {
  const three = ML.matchBeat(3), four = ML.matchBeat(4), five = ML.matchBeat(5);
  assert.ok(four.total > three.total, 'a 4-match gets a bigger moment');
  assert.ok(five.total >= four.total, 'a 5-match is at least as big as a 4-match');
  assert.ok(four.total <= 1000 && five.total <= 1000, 'never longer than about 1 s');
  assert.ok(four.swell > 0 && five.swell > 0, 'a big match swells first');
});

test('a run shorter than three falls back to the 3-match beat', () => {
  const three = ML.matchBeat(3);
  assert.deepStrictEqual(ML.matchBeat(2), three);
  assert.deepStrictEqual(ML.matchBeat(), three);
});

test('five and beyond share the biggest beat', () => {
  assert.deepStrictEqual(ML.matchBeat(9), ML.matchBeat(5));
});

test('total is the sum of its parts', () => {
  [3, 4, 5, 7].forEach(run => {
    const b = ML.matchBeat(run);
    assert.strictEqual(b.total, b.swell + b.pop + b.fall);
  });
});

test('the table cannot be changed through a beat', () => {
  const beat = ML.matchBeat(4);
  beat.pop = 1;
  assert.notStrictEqual(ML.matchBeat(4).pop, 1);
});
