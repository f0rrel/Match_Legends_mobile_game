// PENDING TASK TEST — ml-2 shuffle-in-place. Expected to FAIL until the task is done.
//
// Definition of done: MatchLogic.shuffleBoard(board, rng) returns a NEW board that
// is a rearrangement of the same tiles (same type counts, same cells), has no
// matches and has at least one legal move. It does not modify its input and is
// deterministic for a given rng. The game uses it instead of dealing a fresh board
// when no moves are left. (This test supplies its own rng; it does not need ml-1.)
const test = require('node:test');
const assert = require('node:assert/strict');
const { ML, stuckBoard, testRng, typeCounts } = require('../helpers/boards.js');

test('shuffleBoard is exported', () => {
  assert.equal(typeof ML.shuffleBoard, 'function');
});

test('a stuck board becomes playable with exactly the same tiles', () => {
  const board = stuckBoard();
  const before = { ...board };

  const shuffled = ML.shuffleBoard(board, testRng(5));

  assert.deepEqual(board, before, 'the input board must not change');
  assert.deepEqual(Object.keys(shuffled).sort(), Object.keys(board).sort());
  assert.deepEqual(typeCounts(shuffled), typeCounts(board));
  assert.equal(ML.findMatches(shuffled).size, 0);
  assert.ok(ML.hasPossibleMove(shuffled));
});

test('it is deterministic for a given rng and works for many seeds', () => {
  assert.deepEqual(ML.shuffleBoard(stuckBoard(), testRng(9)),
                   ML.shuffleBoard(stuckBoard(), testRng(9)));
  for (let seed = 1; seed <= 25; seed++) {
    const board = ML.createPlayableBoard(testRng(seed));
    const shuffled = ML.shuffleBoard(board, testRng(seed + 100));
    assert.deepEqual(typeCounts(shuffled), typeCounts(board), `seed ${seed}`);
    assert.equal(ML.findMatches(shuffled).size, 0, `seed ${seed}`);
    assert.ok(ML.hasPossibleMove(shuffled), `seed ${seed}`);
  }
});
