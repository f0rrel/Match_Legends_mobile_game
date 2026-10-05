// Unit tests for www/js/match-logic.js (existing behaviour).
const test = require('node:test');
const assert = require('node:assert/strict');
const { ML, stuckBoard, testRng, typeCounts } = require('../helpers/boards.js');

const key = ML.hexKey;
// A tile value that never occurs on a dealt board, so planted runs cannot grow.
const X = 'planted';

test('the board is a radius-4 hex of hexes with 61 cells', () => {
  assert.equal(ML.HEX_CELLS.length, 61);
  assert.equal(new Set(ML.HEX_CELLS.map(c => key(c.q, c.r))).size, 61);
  ML.HEX_CELLS.forEach(c => assert.ok(Math.max(Math.abs(c.q), Math.abs(c.r), Math.abs(-c.q - c.r)) <= 4));
});

test('every cell lies on exactly one line of each of the three axes', () => {
  for (const axis of ['q', 'r', 's']) {
    const lines = ML.HEX_LINE_GROUPS[axis];
    assert.equal(lines.length, 9);
    const seen = lines.flat().map(c => key(c.q, c.r));
    assert.equal(seen.length, 61);
    assert.equal(new Set(seen).size, 61);
  }
  assert.equal(ML.HEX_ALL_LINES.length, 27);
});

test('adjacency covers exactly the six neighbours', () => {
  const center = { q: 0, r: 0 };
  ML.HEX_DIRS.forEach(([dq, dr]) => assert.ok(ML.isHexAdjacent(center, { q: dq, r: dr })));
  assert.equal(ML.hexNeighbors(0, 0).length, 6);
  assert.ok(!ML.isHexAdjacent(center, { q: 2, r: 0 }));
  assert.ok(!ML.isHexAdjacent(center, { q: 1, r: 1 }));
  assert.ok(!ML.isHexAdjacent(center, center));
});

test('swapHex exchanges two cells in place', () => {
  const board = stuckBoard();
  const a = board[key(0, 0)], b = board[key(1, 0)];
  ML.swapHex(board, { q: 0, r: 0 }, { q: 1, r: 0 });
  assert.equal(board[key(0, 0)], b);
  assert.equal(board[key(1, 0)], a);
});

test('the stuck board has no matches and no legal move', () => {
  const board = stuckBoard();
  assert.equal(ML.findMatches(board).size, 0);
  assert.equal(ML.hasPossibleMove(board), false);
});

for (const length of [3, 4, 5]) {
  test(`a straight run of ${length} is matched and its length recorded`, () => {
    const board = stuckBoard();
    const cells = [];
    for (let r = -2; r < -2 + length; r++) cells.push(key(0, r)); // along a q line
    cells.forEach(k => { board[k] = X; });
    const matched = ML.findMatches(board);
    assert.deepEqual([...matched].sort(), cells.slice().sort());
    cells.forEach(k => assert.equal(matched.runLen[k], length));
  });
}

test('runs are found on all three axes and crossing runs are merged', () => {
  const board = stuckBoard();
  const qLine = [key(0, -1), key(0, 0), key(0, 1)];
  const rLine = [key(-1, 0), key(0, 0), key(1, 0)];
  const sLine = [key(2, -3), key(3, -4), key(1, -2)];
  [...qLine, ...rLine, ...sLine].forEach(k => { board[k] = X; });
  const matched = ML.findMatches(board);
  [...qLine, ...rLine, ...sLine].forEach(k => assert.ok(matched.has(k), k));
  assert.equal(matched.size, 8); // (0,0) is shared
});

test('two in a row is not a match', () => {
  const board = stuckBoard();
  board[key(0, 0)] = X;
  board[key(0, 1)] = X;
  assert.equal(ML.findMatches(board).size, 0);
});

test('hasPossibleMove finds a swap that completes a line', () => {
  const board = stuckBoard();
  board[key(0, -1)] = X;
  board[key(0, 0)] = X;
  board[key(1, 1)] = X; // swapping (1,1) with (0,1) makes three on the q=0 line
  assert.equal(ML.findMatches(board).size, 0);
  assert.equal(ML.hasPossibleMove(board), true);
});

test('a dealt board has no matches and a legal move, and the rng is honoured', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const board = ML.createPlayableBoard(testRng(seed));
    assert.equal(Object.keys(board).length, 61);
    assert.equal(ML.findMatches(board).size, 0, `seed ${seed}`);
    assert.ok(ML.hasPossibleMove(board), `seed ${seed}`);
    Object.values(board).forEach(t => assert.ok(ML.TYPES.includes(t)));
  }
  assert.deepEqual(ML.createPlayableBoard(testRng(7)), ML.createPlayableBoard(testRng(7)));
});

test('collapse keeps survivors in order, drops them down, and fills from the top', () => {
  const board = stuckBoard();
  const column = ML.QCOLUMNS_BY_Q[0]; // q = 0: r from -4 to 4
  const before = [];
  for (let r = column.rMin; r <= column.rMax; r++) before.push(board[key(0, r)]);
  const matched = new Set([key(0, 0), key(0, 1)]);
  const rng = testRng(3);

  const plan = ML.computeCollapse(board, matched, rng);

  assert.equal(plan.length, 61);
  const col = plan.filter(p => p.q === 0).sort((a, b) => a.toR - b.toR);
  assert.deepEqual(col.slice(0, 2).map(p => p.fromR), [null, null]);
  const survivors = before.filter((_, i) => ![4, 5].includes(i)); // r = 0, 1 removed
  assert.deepEqual(col.slice(2).map(p => p.type), survivors);
  assert.deepEqual(col.slice(2).map(p => p.fromR), [-4, -3, -2, -1, 2, 3, 4]);
  col.forEach(p => assert.equal(board[key(0, p.toR)], p.type));
  // Untouched columns are unchanged.
  plan.filter(p => p.q !== 0).forEach(p => assert.equal(p.fromR, p.toR));
});

test('line powers clear one whole line of the requested axis', () => {
  const rng = () => 0;
  const q = ML.lineTargets('q', rng);
  const r = ML.lineTargets('r', rng);
  assert.deepEqual([...q].sort(), ML.HEX_LINE_GROUPS.q[0].map(c => key(c.q, c.r)).sort());
  assert.deepEqual([...r].sort(), ML.HEX_LINE_GROUPS.r[0].map(c => key(c.q, c.r)).sort());
});

test('the area power clears a hex and its neighbours, then chains to same-type tiles', () => {
  const board = stuckBoard();
  const centerIndex = ML.HEX_CELLS.findIndex(c => c.q === 0 && c.r === 0);
  const rng = () => (centerIndex + 0.5) / ML.HEX_CELLS.length;

  const area = ML.areaTargets(board, rng);

  assert.ok(area.has(key(0, 0)));
  ML.hexNeighbors(0, 0).forEach(n => assert.ok(area.has(key(n.q, n.r))));
  // Every extra cell touches a cleared cell of its own type.
  [...area].forEach(k => {
    const [q, r] = k.split(',').map(Number);
    if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= 1) return;
    const touches = ML.hexNeighbors(q, r).some(n => area.has(key(n.q, n.r)) && board[key(n.q, n.r)] === board[k]);
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
