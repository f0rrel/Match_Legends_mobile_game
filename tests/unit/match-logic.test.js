// Unit tests for www/js/match-logic.js (existing behaviour).
const test = require('node:test');
const assert = require('node:assert/strict');
const { ML, stuckBoard, testRng, typeCounts } = require('../helpers/boards.js');

const key = ML.cellKey;
// A tile value that never occurs on a dealt board, so planted runs cannot grow.
const X = 'planted';

test('the board is an 8 x 9 square grid with 72 cells', () => {
  assert.equal(ML.COLS, 8);
  assert.equal(ML.ROWS, 9);
  assert.equal(ML.CELLS.length, 72);
  assert.equal(new Set(ML.CELLS.map(c => key(c.col, c.row))).size, 72);
  ML.CELLS.forEach(c => {
    assert.ok(c.col >= 0 && c.col < 8);
    assert.ok(c.row >= 0 && c.row < 9);
  });
});

test('every cell lies on exactly one row and one column line', () => {
  assert.equal(ML.ROW_LINES.length, 9);
  assert.equal(ML.COL_LINES.length, 8);
  ML.ROW_LINES.forEach(line => assert.equal(line.length, 8));
  ML.COL_LINES.forEach(line => assert.equal(line.length, 9));
  const seen = ML.ALL_LINES.flat().map(c => key(c.col, c.row));
  assert.equal(seen.length, 72 * 2);
  assert.equal(ML.ALL_LINES.length, 17);
});

test('adjacency covers exactly the four orthogonal neighbours', () => {
  const center = { col: 3, row: 3 };
  ML.CELL_DIRS.forEach(([dc, dr]) => assert.ok(ML.isCellAdjacent(center, { col: 3 + dc, row: 3 + dr })));
  assert.equal(ML.cellNeighbors(3, 3).length, 4);
  assert.ok(!ML.isCellAdjacent(center, { col: 5, row: 3 }));
  assert.ok(!ML.isCellAdjacent(center, { col: 4, row: 4 }));
  assert.ok(!ML.isCellAdjacent(center, center));
});

test('swapCells exchanges two cells in place', () => {
  const board = stuckBoard();
  const a = board[key(0, 0)], b = board[key(1, 0)];
  ML.swapCells(board, { col: 0, row: 0 }, { col: 1, row: 0 });
  assert.equal(board[key(0, 0)], b);
  assert.equal(board[key(1, 0)], a);
});

test('the stuck board has no matches and no legal move', () => {
  const board = stuckBoard();
  assert.equal(ML.findMatches(board).size, 0);
  assert.equal(ML.hasPossibleMove(board), false);
});

for (const length of [3, 4, 5]) {
  test(`a straight row run of ${length} is matched and its length recorded`, () => {
    const board = stuckBoard();
    const cells = [];
    for (let col = 0; col < length; col++) cells.push(key(col, 4));
    cells.forEach(k => { board[k] = X; });
    const matched = ML.findMatches(board);
    assert.deepEqual([...matched].sort(), cells.slice().sort());
    cells.forEach(k => assert.equal(matched.runLen[k], length));
  });
}

test('a straight column run is matched', () => {
  const board = stuckBoard();
  const cells = [key(2, 0), key(2, 1), key(2, 2)];
  cells.forEach(k => { board[k] = X; });
  const matched = ML.findMatches(board);
  assert.deepEqual([...matched].sort(), cells.slice().sort());
  assert.equal(matched.burstClass, 'normal');
});

test('an L shape (a row run and a column run sharing a tile) is one match', () => {
  const board = stuckBoard();
  // row 2, cols 2..4 and column 3, rows 0..2 share (3,2)
  const row = [key(2, 2), key(3, 2), key(4, 2)];
  const col = [key(3, 0), key(3, 1), key(3, 2)];
  [...row, ...col].forEach(k => { board[k] = X; });
  const matched = ML.findMatches(board);
  assert.equal(matched.size, 5, 'the shared tile is counted once');
  [...row, ...col].forEach(k => assert.ok(matched.has(k), k));
  assert.equal(ML.matchShape(matched), 'bomb');
});

test('two in a row is not a match', () => {
  const board = stuckBoard();
  board[key(0, 0)] = X;
  board[key(1, 0)] = X;
  assert.equal(ML.findMatches(board).size, 0);
});

test('hasPossibleMove finds a swap that completes a line', () => {
  const board = stuckBoard();
  board[key(3, 0)] = X;
  board[key(3, 1)] = X;
  board[key(3, 3)] = X; // swap (3,3) with (3,2) makes three down column 3
  assert.equal(ML.findMatches(board).size, 0);
  assert.equal(ML.hasPossibleMove(board), true);
});

test('findHint returns an adjacent swap that makes a match, or null', () => {
  assert.equal(ML.findHint(stuckBoard()), null);
  const board = stuckBoard();
  board[key(3, 0)] = X;
  board[key(3, 1)] = X;
  board[key(3, 3)] = X;
  const before = { ...board };
  const hint = ML.findHint(board);
  assert.ok(hint);
  assert.ok(ML.isCellAdjacent(hint.a, hint.b));
  const probe = { ...board };
  ML.swapCells(probe, hint.a, hint.b);
  assert.ok(ML.findMatches(probe).size > 0);
  assert.deepEqual(board, before);
});

test('shuffleBoard returns the same tiles in a match-free, playable arrangement', () => {
  const board = stuckBoard();
  const before = { ...board };
  const shuffled = ML.shuffleBoard(board, testRng(5));
  assert.deepEqual(board, before, 'the input board must not change');
  assert.deepEqual(typeCounts(shuffled), typeCounts(board));
  assert.equal(ML.findMatches(shuffled).size, 0);
  assert.ok(ML.hasPossibleMove(shuffled));
});

test('scoreMatch, matchBeat and starsForScore keep their rules', () => {
  assert.equal(ML.scoreMatch({ size: 3, maxRun: 3, combo: 1 }), 60);
  assert.equal(ML.scoreMatch({ size: 4, maxRun: 4, combo: 1 }), 120);
  assert.ok(ML.matchBeat(5).total <= 1000 && ML.matchBeat(3).total >= 400);
  assert.equal(ML.starsForScore(2700, 1800), 3);
  assert.equal(ML.starsForScore(1799, 1800), 0);
});

test('a dealt board has no matches and a legal move, and the rng is honoured', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const board = ML.createPlayableBoard(testRng(seed));
    assert.equal(Object.keys(board).length, 72);
    assert.equal(ML.findMatches(board).size, 0, `seed ${seed}`);
    assert.ok(ML.hasPossibleMove(board), `seed ${seed}`);
    Object.values(board).forEach(t => assert.ok(ML.TYPES.includes(t)));
  }
  assert.deepEqual(ML.createPlayableBoard(testRng(7)), ML.createPlayableBoard(testRng(7)));
});

test('gravity keeps survivors in order, drops them down, and fills from the top', () => {
  const board = stuckBoard();
  const column = ML.COLUMNS_BY_COL[0]; // col 0: rows 0..8
  const before = [];
  for (let row = column.rowMin; row <= column.rowMax; row++) before.push(board[key(0, row)]);
  const matched = new Set([key(0, 3), key(0, 4)]);
  const rng = testRng(3);

  const plan = ML.computeCollapse(board, matched, rng);

  assert.equal(plan.length, 72);
  const col = plan.filter(p => p.col === 0).sort((a, b) => a.toRow - b.toRow);
  assert.deepEqual(col.slice(0, 2).map(p => p.fromRow), [null, null]);
  const survivors = before.filter((_, i) => ![3, 4].includes(i)); // rows 3, 4 removed
  assert.deepEqual(col.slice(2).map(p => p.type), survivors);
  assert.deepEqual(col.slice(2).map(p => p.fromRow), [0, 1, 2, 5, 6, 7, 8]);
  col.forEach(p => assert.equal(board[key(0, p.toRow)], p.type));
  // Untouched columns are unchanged.
  plan.filter(p => p.col !== 0).forEach(p => assert.equal(p.fromRow, p.toRow));
});

test('line powers clear one whole row or column of the requested axis', () => {
  const rng = () => 0;
  const row = ML.lineTargets('row', rng);
  const col = ML.lineTargets('col', rng);
  assert.deepEqual([...row].sort(), ML.ROW_LINES[0].map(c => key(c.col, c.row)).sort());
  assert.deepEqual([...col].sort(), ML.COL_LINES[0].map(c => key(c.col, c.row)).sort());
  assert.equal(row.size, 8);
  assert.equal(col.size, 9);
});

test('the area power clears a cell and its neighbours, then chains to same-type tiles', () => {
  const board = stuckBoard();
  const centerIndex = ML.CELLS.findIndex(c => c.col === 0 && c.row === 0);
  const rng = () => (centerIndex + 0.5) / ML.CELLS.length;

  const area = ML.areaTargets(board, rng);

  assert.ok(area.has(key(0, 0)));
  ML.cellNeighbors(0, 0).forEach(n => {
    if (n.col >= 0 && n.col < ML.COLS && n.row >= 0 && n.row < ML.ROWS) assert.ok(area.has(key(n.col, n.row)));
  });
  [...area].forEach(k => {
    const [col, row] = k.split(',').map(Number);
    if (Math.abs(col - 0) + Math.abs(row - 0) <= 1) return;
    const touches = ML.cellNeighbors(col, row).some(n => area.has(key(n.col, n.row)) && board[key(n.col, n.row)] === board[k]);
    assert.ok(touches, k);
  });
});

test('the type power clears every tile of the most common type', () => {
  const board = stuckBoard();
  ['0,0', '1,0', '2,0', '3,0'].forEach(k => { board[k] = 'gem'; });
  const counts = typeCounts(board);
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

  const cleared = ML.typeTargets(board);

  assert.equal(cleared.size, counts[best]);
  [...cleared].forEach(k => assert.equal(board[k], best));
});

test('the convert power repaints tiles until a match appears', () => {
  const board = stuckBoard();
  const matched = ML.convertTiles(board, testRng(11));
  assert.ok(matched.size >= 3);
  assert.deepEqual([...matched].sort(), [...ML.findMatches(board)].sort());
});

/* ---- specials ---- */

test('a tile is its monster plus the kind it carries', () => {
  assert.equal(ML.makeSpecial('sword', 'line-h'), 'sword+line-h');
  assert.equal(ML.baseType('sword+line-h'), 'sword');
  assert.equal(ML.baseType('gem'), 'gem');
  assert.equal(ML.specialOf('sword+bomb'), 'bomb');
  assert.equal(ML.specialOf('gem'), null);
});

test('a special matches with the plain tiles of its monster', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword';
  board[key(1, 0)] = 'sword+line-h';
  board[key(2, 0)] = 'sword';
  const matched = ML.findMatches(board);
  [key(0, 0), key(1, 0), key(2, 0)].forEach(k => assert.ok(matched.has(k), k));
  assert.equal(matched.size, 3);
});

test('matchShape names the special a match leaves', () => {
  const shapeOf = (cells) => {
    const board = stuckBoard();
    cells.forEach(([col, row]) => { board[key(col, row)] = 'shield'; });
    return ML.matchShape(ML.findMatches(board));
  };
  assert.equal(shapeOf([[0, 4], [1, 4], [2, 4]]), null);
  assert.equal(shapeOf([[0, 4], [1, 4], [2, 4], [3, 4]]), 'line-h');
  assert.equal(shapeOf([[2, 0], [2, 1], [2, 2], [2, 3]]), 'line-v');
  assert.equal(shapeOf([[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]]), 'bomb');
  // L shape: row 2 cols 2..4 plus column 3 rows 0..2
  assert.equal(shapeOf([[2, 2], [3, 2], [4, 2], [3, 0], [3, 1]]), 'bomb');
});

test('specialAnchor lands on the played cell, else the middle of the longest run', () => {
  const board = stuckBoard();
  const RUN = [[0, 3], [1, 3], [2, 3], [3, 3]];
  RUN.forEach(([col, row]) => { board[key(col, row)] = 'shield'; });
  const matched = ML.findMatches(board);
  assert.deepEqual(ML.specialAnchor(board, matched, { col: 1, row: 3 }, { col: 1, row: 4 }), { col: 1, row: 3 });
  assert.deepEqual(ML.specialAnchor(board, matched, { col: 1, row: 4 }, { col: 1, row: 3 }), { col: 1, row: 3 });
  const middle = ML.specialAnchor(board, matched, { col: 5, row: 5 }, { col: 6, row: 6 });
  assert.ok(matched.has(key(middle.col, middle.row)));
});

test('plantSpecial keeps the monster and gains the kind', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'gem';
  assert.equal(ML.plantSpecial(board, key(0, 0), 'line-h'), 'gem+line-h');
  assert.equal(board[key(0, 0)], 'gem+line-h');
  assert.equal(ML.plantSpecial(board, key(0, 0), 'bomb'), 'gem+bomb');
  assert.equal(ML.plantSpecial(board, key(0, 0), 'nope'), null);
  assert.equal(ML.plantSpecial(board, key(9, 9), 'line-v'), null);
});

test('a line blaster clears its whole row or column depending on direction', () => {
  const board = stuckBoard();
  board[key(2, 3)] = 'sword+line-h';
  const row = ML.lineBlast(board, key(2, 3));
  assert.equal(row.size, 8);
  [...row].forEach(k => assert.equal(k.split(',')[1], '3'));

  board[key(2, 3)] = 'sword+line-v';
  const col = ML.lineBlast(board, key(2, 3));
  assert.equal(col.size, 9);
  [...col].forEach(k => assert.equal(k.split(',')[0], '2'));
});

test('a bomb clears the 3x3 area around it, clipped at the edge', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'gem+bomb';
  const corner = ML.specialTargets(board, key(0, 0));
  assert.deepEqual([...corner].sort(), [key(0, 0), key(0, 1), key(1, 0), key(1, 1)].sort());

  const board2 = stuckBoard();
  board2[key(3, 4)] = 'gem+bomb';
  const center = ML.bombBlast(board2, key(3, 4));
  assert.equal(center.size, 9);
  assert.ok(center.has(key(2, 3)) && center.has(key(4, 5)));
});

test('a colour bomb swapped with a normal tile clears every tile of that monster', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+bomb';
  board[key(1, 0)] = 'gem';
  board[key(5, 5)] = 'gem';
  const blast = ML.bombSwapBlast(board, { col: 0, row: 0 }, { col: 1, row: 0 });
  assert.ok(blast);
  assert.ok(blast.has(key(1, 0)) && blast.has(key(5, 5)), 'every gem goes');
  assert.ok(blast.has(key(0, 0)), 'the bomb cell itself goes too');
  [...blast].forEach(k => assert.ok(k === key(0, 0) || ML.baseType(board[k]) === 'gem'));
});

test('a special caught in a blast goes off too, all the way down the chain', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+line-h';   // clears row 0
  board[key(3, 0)] = 'gem+line-v';     // sits in row 0, so it is caught; fires column 3
  board[key(3, 5)] = 'urn+bomb';       // sits in column 3, caught; fires its 3x3
  const out = ML.chainSpecials(board, new Set([key(0, 0)]), null);
  assert.ok(out.has(key(3, 0)), 'the chained line blaster went off');
  assert.ok(out.has(key(3, 5)), 'the chained bomb went off');
  assert.ok(out.has(key(2, 4)) && out.has(key(4, 6)), 'the bomb 3x3 came with it');
});

test('two line blasters swapped together clear both of their lines', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+line-h';
  board[key(1, 0)] = 'gem+line-v';
  const blast = ML.combineSwapBlast(board, { col: 0, row: 0 }, { col: 1, row: 0 });
  assert.ok(blast, 'swapping two line blasters is a legal combine');
  [...ML.ROW_LINES[0]].forEach(c => assert.ok(blast.has(key(c.col, c.row))));
  [...ML.COL_LINES[1]].forEach(c => assert.ok(blast.has(key(c.col, c.row))));
});

test('a colour bomb in a combine takes every tile of both monsters', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+bomb';
  board[key(1, 0)] = 'gem+line-h';
  const blast = ML.combineSwapBlast(board, { col: 0, row: 0 }, { col: 1, row: 0 });
  const ofType = t => Object.keys(board).filter(k => ML.baseType(board[k]) === t);
  ofType('sword').forEach(k => assert.ok(blast.has(k)));
  ofType('gem').forEach(k => assert.ok(blast.has(k)));
});

test('a special swapped with a plain tile is not a combine', () => {
  const board = stuckBoard();
  board[key(0, 0)] = 'sword+line-h';
  assert.equal(ML.combineSwapBlast(board, { col: 0, row: 0 }, { col: 1, row: 0 }), null);
});
