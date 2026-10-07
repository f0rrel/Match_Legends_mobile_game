// PENDING TASK TEST — ml-45 combining two specials. Expected to FAIL until done.
//
// Definition of done: swapping two specials together is a legal move with a bigger
// effect -- two line blasters clear both axes, and a colour bomb in the pair takes
// every tile of both monsters. A special swapped with a plain tile is not a combine.
const test = require('node:test');
const assert = require('node:assert');
const { ML, stuckBoard } = require('../helpers/boards.js');

const k = ML.hexKey;
const lineThrough = (axis, q, r) =>
  ML.HEX_LINE_GROUPS[axis].find(line => line.some(c => c.q === q && c.r === r));

test('two line blasters swapped together clear both axes', () => {
  const board = stuckBoard();
  const a = { q: 0, r: 0 }, b = { q: 1, r: 0 };
  board[k(a.q, a.r)] = 'sword+line';
  board[k(b.q, b.r)] = 'gem+line';

  const blast = ML.combineSwapBlast(board, a, b);
  assert.ok(blast, 'swapping two line blasters is a legal combine');

  for (const c of lineThrough('q', 0, 0)) {
    assert.ok(blast.has(k(c.q, c.r)), `q-line cell ${c.q},${c.r} is cleared`);
  }
  for (const c of lineThrough('r', 1, 0)) {
    assert.ok(blast.has(k(c.q, c.r)), `r-line cell ${c.q},${c.r} is cleared`);
  }
});

test('a colour bomb in the pair takes both monsters', () => {
  const board = stuckBoard();
  const a = { q: 0, r: 0 }, b = { q: 1, r: 0 };
  board[k(a.q, a.r)] = 'sword+bomb';
  board[k(b.q, b.r)] = 'gem+line';

  const blast = ML.combineSwapBlast(board, a, b);
  assert.ok(blast, 'the pair is a legal combine');
  const ofType = t => Object.keys(board).filter(key => ML.baseType(board[key]) === t);
  for (const key of ofType('sword')) assert.ok(blast.has(key), 'every sword tile goes');
  for (const key of ofType('gem')) assert.ok(blast.has(key), 'every gem tile goes');
});

test('a special swapped with a plain tile is not a combine', () => {
  const board = stuckBoard();
  board[k(0, 0)] = 'sword+line';
  assert.strictEqual(ML.combineSwapBlast(board, { q: 0, r: 0 }, { q: 1, r: 0 }), null);
});
