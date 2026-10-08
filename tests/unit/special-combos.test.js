// Unit tests for the three special + special combos (ml-45 / big specials).
const test = require('node:test');
const assert = require('node:assert/strict');
const { ML, stuckBoard } = require('../helpers/boards.js');

const key = ML.cellKey;

// A small board with a special on the two adjacent cells a and b. combine reads
// the board as it stands after the swap, exactly as the game calls it.
function boardWith(aTile, bTile, a = { col: 4, row: 4 }, b = { col: 4, row: 5 }) {
  const board = stuckBoard();
  board[key(a.col, a.row)] = aTile;
  board[key(b.col, b.row)] = bTile;
  return { board, a, b };
}

test('comboKind names the pair, in either order, and null for a plain tile', () => {
  assert.equal(ML.comboKind('sword+line-h', 'gem+line-v'), 'cross');
  assert.equal(ML.comboKind('gem+line-v', 'sword+line-h'), 'cross');
  assert.equal(ML.comboKind('sword+line-h', 'gem+bomb'), 'mega');
  assert.equal(ML.comboKind('gem+bomb', 'sword+line-h'), 'mega');
  assert.equal(ML.comboKind('sword+bomb', 'gem+bomb'), 'kaboom');
  assert.equal(ML.comboKind('sword+line-h', 'gem'), null);
  assert.equal(ML.comboKind('sword', 'gem'), null);
  assert.equal(ML.comboKind('sword+bomb', 'gem'), null);
});

test('line + line: the full row AND the full column of the swap cell', () => {
  const { board, a, b } = boardWith('sword+line-h', 'gem+line-v');
  const blast = ML.combineSwapBlast(board, a, b);
  assert.ok(blast, 'two lines are a legal combine');

  const row = ML.ROW_LINES[a.row].map(c => key(c.col, c.row));
  const col = ML.COL_LINES[a.col].map(c => key(c.col, c.row));
  row.forEach(k => assert.ok(blast.has(k), 'row cell ' + k));
  col.forEach(k => assert.ok(blast.has(k), 'column cell ' + k));
  assert.equal(blast.size, row.length + col.length - 1, 'the cross is exactly one row plus one column');
});

test('line + bomb: the 3 rows and 3 columns centred on the swap cell', () => {
  const { board, a, b } = boardWith('sword+line-h', 'gem+bomb');
  const blast = ML.combineSwapBlast(board, a, b);
  assert.ok(blast, 'a line and a bomb combine');

  const rows = [a.row - 1, a.row, a.row + 1];
  const cols = [a.col - 1, a.col, a.col + 1];
  rows.forEach(r => ML.ROW_LINES[r].forEach(c => assert.ok(blast.has(key(c.col, r)), 'row ' + r)));
  cols.forEach(c2 => ML.COL_LINES[c2].forEach(c => assert.ok(blast.has(key(c2, c.row)), 'column ' + c2)));

  const expected = new Set();
  rows.forEach(r => ML.ROW_LINES[r].forEach(c => expected.add(key(c.col, r))));
  cols.forEach(c2 => ML.COL_LINES[c2].forEach(c => expected.add(key(c2, c.row))));
  assert.equal(blast.size, expected.size, 'exactly the three rows and three columns');
  assert.equal(blast.size, 42);
});

test('bomb + bomb: the 5x5 area around the swap cell', () => {
  const { board, a, b } = boardWith('sword+bomb', 'gem+bomb');
  const blast = ML.combineSwapBlast(board, a, b);
  assert.ok(blast, 'two bombs combine');

  let expected = 0;
  for (let dc = -2; dc <= 2; dc++) {
    for (let dr = -2; dr <= 2; dr++) {
      const col = a.col + dc, row = a.row + dr;
      assert.ok(blast.has(key(col, row)), 'cell ' + col + ',' + row);
      expected++;
    }
  }
  assert.equal(blast.size, expected);
  assert.equal(blast.size, 25);
  assert.ok(!blast.has(key(a.col + 3, a.row)), 'nothing beyond the 5x5');
});

test('a non-combo pair is refused', () => {
  const { board, a, b } = boardWith('sword+line-h', 'gem');
  assert.equal(ML.combineSwapBlast(board, a, b), null);
});
