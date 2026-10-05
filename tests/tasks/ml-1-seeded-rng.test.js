// PENDING TASK TEST — ml-1 seeded-rng. Expected to FAIL until the task is done.
//
// Definition of done: MatchLogic.createRng(seed) returns a deterministic random
// function (floats in [0, 1)) that the board functions accept as their rng, so a
// board can be reproduced from a seed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { ML } = require('../helpers/boards.js');

test('createRng is exported', () => {
  assert.equal(typeof ML.createRng, 'function');
});

test('the same seed gives the same sequence, in [0, 1)', () => {
  const a = ML.createRng(42), b = ML.createRng(42);
  for (let i = 0; i < 1000; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1, `value ${x} out of range`);
  }
});

test('different seeds give different sequences', () => {
  const a = ML.createRng(1), b = ML.createRng(2);
  const same = Array.from({ length: 20 }, () => a() === b()).filter(Boolean).length;
  assert.ok(same < 20);
});

test('a seeded board is reproducible, match-free and playable', () => {
  const one = ML.createPlayableBoard(ML.createRng(7));
  const two = ML.createPlayableBoard(ML.createRng(7));
  const other = ML.createPlayableBoard(ML.createRng(8));
  assert.deepEqual(one, two);
  assert.notDeepEqual(one, other);
  assert.equal(ML.findMatches(one).size, 0);
  assert.ok(ML.hasPossibleMove(one));
});

test('the values are spread over the whole range', () => {
  const rng = ML.createRng(123);
  const buckets = new Array(10).fill(0);
  for (let i = 0; i < 10000; i++) buckets[Math.floor(rng() * 10)]++;
  buckets.forEach(n => assert.ok(n > 800 && n < 1200, `bucket count ${n}`));
});
