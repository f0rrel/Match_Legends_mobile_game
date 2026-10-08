/* =========================================================
   MATCH LEGENDS — PURE GAME LOGIC
   Square grid, matching, gravity and power targeting. No DOM, no audio,
   no timers: everything here is a plain function of its arguments, so
   it runs both in the game (window.MatchLogic) and under Node's test
   runner (module.exports). No bundler; a classic script.

   Randomness: every function that needs it takes an optional `rng`
   (a function returning a float in [0, 1)), defaulting to Math.random.

   SQUARE GRID GEOMETRY
   Cells are keyed by (col, row): col runs 0..COLS-1 left to right,
   row runs 0..ROWS-1 top to bottom. Gravity pulls tiles toward larger
   row (down-screen) and new tiles fall in from the top. A neighbour is
   one step up, down, left or right; a match is 3+ of the same monster
   in a straight row or column, and an L/T (a row run crossing a column
   run) counts as one match.
======================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MatchLogic = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TYPES = ['sword', 'shield', 'urn', 'crown', 'flame', 'gem'];
  const COLS = 8;
  const ROWS = 9; // 8 x 9 = 72 cells, a portrait-phone board
  const BASE_POINTS = 20;

  function cellKey(col,row){ return col+','+row; }
  function buildCells(){
    const cells = [];
    for (let row=0; row<ROWS; row++)
      for (let col=0; col<COLS; col++) cells.push({ col, row });
    return cells;
  }
  const CELLS = buildCells();

  // Per-column extents, used for gravity (tiles fall toward larger row).
  const COLUMNS = [];
  const COLUMNS_BY_COL = {};
  for (let col=0; col<COLS; col++){
    const entry = { col, rowMin:0, rowMax:ROWS-1 };
    COLUMNS.push(entry);
    COLUMNS_BY_COL[col] = entry;
  }

  // Every cell grouped into the two straight-line axes once (board shape is static).
  const ROW_LINES = [];
  for (let row=0; row<ROWS; row++){
    const line = [];
    for (let col=0; col<COLS; col++) line.push({ col, row });
    ROW_LINES.push(line);
  }
  const COL_LINES = [];
  for (let col=0; col<COLS; col++){
    const line = [];
    for (let row=0; row<ROWS; row++) line.push({ col, row });
    COL_LINES.push(line);
  }
  const ALL_LINES = [...ROW_LINES, ...COL_LINES];

  // Orthogonal neighbours only: up, down, left, right.
  const CELL_DIRS = [[0,-1],[0,1],[-1,0],[1,0]];
  const CELL_CHECK_DIRS = [[1,0],[0,1]]; // covers every board edge exactly once
  function cellNeighbors(col,row){ return CELL_DIRS.map(([dc,dr])=>({ col:col+dc, row:row+dr })); }
  function isCellAdjacent(a,b){ return CELL_DIRS.some(([dc,dr])=> a.col+dc===b.col && a.row+dr===b.row); }
  function swapCells(board,a,b){ const ka=cellKey(a.col,a.row), kb=cellKey(b.col,b.row); const t=board[ka]; board[ka]=board[kb]; board[kb]=t; }

  // Internal: a board key ('col,row') as a cell, or null when it cannot be placed.
  function parseCellKey(key){
    if (typeof key !== 'string') return null;
    const parts = key.split(',');
    if (parts.length !== 2) return null;
    if (!/^[+-]?\d+$/.test(parts[0]) || !/^[+-]?\d+$/.test(parts[1])) return null;
    return { col:+parts[0], row:+parts[1] };
  }
  const inBounds = (col,row)=> col>=0 && col<COLS && row>=0 && row<ROWS;

  /* =========================================================
     BOARD LOGIC
  ========================================================= */
  function pick(list, rng){ return list[Math.floor(rng()*list.length)]; }
  function randType(rng = Math.random){ return pick(TYPES, rng); }
  function createBoard(rng = Math.random){
    const board = {};
    CELLS.forEach(c=> board[cellKey(c.col,c.row)] = randType(rng));
    // Random fill can seed matches; repair by re-rolling only the offending cells until clean.
    let matched = findMatches(board);
    let guard = 0;
    while (matched.size > 0 && guard < 200){
      matched.forEach(key=> board[key] = randType(rng));
      matched = findMatches(board);
      guard++;
    }
    return board;
  }
  function findMatches(board){
    const matched = new Set();
    const runLen = {}; // cell key -> longest straight run (3,4,5+) it belongs to, for scoring bonuses
    ALL_LINES.forEach(line=>{
      let start = 0;
      for (let i=1;i<=line.length;i++){
        const startKey = cellKey(line[start].col, line[start].row);
        const curKey = i<line.length ? cellKey(line[i].col, line[i].row) : null;
        if (curKey && baseType(board[curKey])===baseType(board[startKey])) continue;
        const len = i-start;
        if (len>=3) for (let k=start;k<i;k++){
          const kk = cellKey(line[k].col, line[k].row);
          matched.add(kk); runLen[kk]=Math.max(runLen[kk]||0,len);
        }
        start = i;
      }
    });
    matched.runLen = runLen;
    // How big this match may burst, read from the longest straight run it
    // contains: a plain 3-run bursts normal, a 4-run bursts big, a 5+ run huge.
    // Only cells that are really on the board count — an empty board has no
    // run to report and falls back to normal.
    let maxRun = 0;
    for (const key in runLen) if (board && key in board && runLen[key] > maxRun) maxRun = runLen[key];
    matched.burstClass = maxRun >= 5 ? 'huge' : (maxRun >= 4 ? 'big' : 'normal');
    return matched;
  }
  function hasPossibleMove(board){
    for (const c of CELLS){
      for (const [dc,dr] of CELL_CHECK_DIRS){
        const n = { col:c.col+dc, row:c.row+dr };
        if (!(cellKey(n.col,n.row) in board)) continue;
        swapCells(board, c, n);
        const m = findMatches(board);
        swapCells(board, c, n);
        if (m.size>0) return true;
      }
    }
    return false;
  }
  // createBoard() alone can deal a board with zero legal swaps; guarantee one exists.
  function createPlayableBoard(rng = Math.random){
    let board, guard = 0;
    do { board = createBoard(rng); guard++; } while (!hasPossibleMove(board) && guard < 30);
    return board;
  }
  // Returns collapse plan: for each column, list of {col, fromRow(or null if new), toRow, type}.
  // Gravity pulls toward larger row (down-screen); new tiles spawn at the column's row 0 end.
  function computeCollapse(board, matchedSet, rng = Math.random){
    const plan = [];
    COLUMNS.forEach(({col, rowMin, rowMax})=>{
      const survivors = [];
      for (let row=rowMin; row<=rowMax; row++){
        const key = cellKey(col,row);
        if (!matchedSet.has(key)) survivors.push({ fromRow:row, type:board[key] });
      }
      const total = rowMax-rowMin+1;
      const newCount = total - survivors.length;
      const newTiles = [];
      for (let i=0;i<newCount;i++) newTiles.push({ fromRow:null, type:randType(rng) });
      const finalCol = newTiles.concat(survivors);
      for (let i=0;i<total;i++){
        const row = rowMin+i;
        const item = finalCol[i];
        plan.push({ col, toRow:row, fromRow:item.fromRow, type:item.type });
        board[cellKey(col,row)] = item.type;
      }
    });
    return plan;
  }

  /* =========================================================
     POWER TARGETING (which cells a power clears)
     The game applies the side effects (buffs, gems, moves, UI).
  ========================================================= */
  // lineTargets: one full row ('row') or one full column ('col'), chosen at random.
  function lineTargets(axis, rng = Math.random){
    const lines = axis === 'col' ? COL_LINES : ROW_LINES;
    const line = pick(lines, rng);
    return new Set(line.map(c=> cellKey(c.col,c.row)));
  }
  // clearArea: a center cell + its 4 neighbours, then chain lightning: same-type
  // neighbours just outside the blast are zapped, twice over.
  function areaTargets(board, rng = Math.random){
    const matched = new Set();
    const center = pick(CELLS, rng);
    matched.add(cellKey(center.col,center.row));
    cellNeighbors(center.col,center.row).forEach(n=>{
      const nk = cellKey(n.col,n.row);
      if (nk in board) matched.add(nk);
    });
    for (let pass=0; pass<2; pass++){
      const additions = [];
      matched.forEach(key=>{
        const [col,row] = key.split(',').map(Number);
        const t = board[key];
        cellNeighbors(col,row).forEach(n=>{
          const nk = cellKey(n.col,n.row);
          if ((nk in board) && !matched.has(nk) && board[nk]===t) additions.push(nk);
        });
      });
      additions.forEach(k=> matched.add(k));
    }
    return matched;
  }
  // clearType: every cell of the most common type.
  function typeTargets(board){
    const counts = {};
    Object.values(board).forEach(t=> counts[t]=(counts[t]||0)+1);
    const best = Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
    return new Set(Object.keys(board).filter(key=> board[key]===best));
  }
  // convertTiles: repaint 4 random cells into one random type until that
  // yields a match (up to 5 tries). Mutates board; returns the matches.
  function convertTiles(board, rng = Math.random){
    const t = randType(rng);
    const allKeys = Object.keys(board);
    let matchedTry = new Set(), attempts = 0;
    do {
      let placed = 0, tries=0;
      while (placed < 4 && tries < 60){
        tries++;
        const key = pick(allKeys, rng);
        if (board[key] !== t){ board[key] = t; placed++; }
      }
      matchedTry = findMatches(board);
      attempts++;
    } while (matchedTry.size === 0 && attempts < 5);
    return matchedTry;
  }

  const api = {
    TYPES, COLS, ROWS, BASE_POINTS,
    cellKey, buildCells, CELLS, COLUMNS, COLUMNS_BY_COL,
    ROW_LINES, COL_LINES, ALL_LINES, CELL_DIRS, CELL_CHECK_DIRS,
    cellNeighbors, isCellAdjacent, swapCells,
    randType, createBoard, findMatches, hasPossibleMove, createPlayableBoard, computeCollapse,
    lineTargets, areaTargets, typeTargets, convertTiles,
  };

  // Each task adds its functions and exports (api.name = fn) inside its own
  // section only, so independent tasks do not edit the same lines.
  /* === TASK SECTION ml-1 seeded-rng (add task code and api.* exports here) === */
  // Seeded generator (mulberry32): the same seed always yields the same stream,
  // so a board dealt with it (createBoard/createPlayableBoard/rng-aware powers)
  // can be reproduced exactly. Values are floats in [0, 1).
  function createRng(seed = 1){
    let state = seed >>> 0;
    return function rng(){
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  api.createRng = createRng;
  /* === END TASK SECTION ml-1 === */

  /* === TASK SECTION ml-2 shuffle-in-place (add task code and api.* exports here) === */
  // Running dry should not throw the player's tiles away: redeal the very same
  // tiles instead. Each round permutes them at random, then trades offending
  // tiles for quieter ones until nothing matches; we stop at the first
  // arrangement that is match-free and still has a legal move.
  // Returns a NEW board (the input is never touched); deterministic in rng.
  function shuffleBoard(board, rng = Math.random){
    const keys = Object.keys(board);
    const tiles = Object.values(board);
    const trial = {};
    const deal = arr=> keys.forEach((key,i)=>{ trial[key] = arr[i]; });
    const randIndex = max=> Math.min(max, Math.floor(rng()*(max+1)));
    const dealRandom = ()=>{
      const arr = tiles.slice();
      for (let i=arr.length-1; i>0; i--){
        const j = randIndex(i);
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      deal(arr);
    };
    // Leftover matches dominate the score; a dead board is the next worst thing.
    const flaw = ()=>{
      const matched = findMatches(trial).size;
      if (matched > 0) return matched*2;
      return hasPossibleMove(trial) ? 0 : 1;
    };
    let best = null, bestFlaw = Infinity;
    const remember = ()=>{
      const value = flaw();
      if (value < bestFlaw){ bestFlaw = value; best = keys.map(key=> trial[key]); }
    };
    for (let round=0; round<40 && bestFlaw>0; round++){
      dealRandom();
      remember();
      // Hill-climb out of the matches this deal produced: swap an offending
      // tile with a random one, keeping the trade only if it quiets the board.
      let matched = [...findMatches(trial)];
      for (let step=0; step<250 && matched.length>0; step++){
        const from = matched[randIndex(matched.length-1)];
        const to = keys[randIndex(keys.length-1)];
        if (to === from) continue;
        const undo = tradeTiles(trial, from, to);
        const after = [...findMatches(trial)];
        if (after.length > matched.length) undo();
        else matched = after;
      }
      if (matched.length === 0) remember();
    }
    // No clean deal turned up: only reachable for tile sets that cannot be laid
    // out match-free at all (e.g. almost one single type), so keep the best we saw.
    deal(best);
    return { ...trial };
  }
  function tradeTiles(board, ka, kb){
    const a = board[ka], b = board[kb];
    board[ka] = b; board[kb] = a;
    return ()=>{ board[ka] = a; board[kb] = b; };
  }
  api.shuffleBoard = shuffleBoard;
  /* === END TASK SECTION ml-2 === */

  /* === TASK SECTION ml-3 scoring-rules (add task code and api.* exports here) === */
  function scoreMatch({ size, maxRun, combo, buffMult }) {
    const run = typeof maxRun === 'number' && maxRun > 0 ? maxRun : 3;
    const sizeBonus = run >= 5 ? 2 : (run >= 4 ? 1.5 : 1);
    const base = size * BASE_POINTS * combo * sizeBonus;
    let gained = Math.round(base);
    if (buffMult !== undefined && buffMult !== null) {
      gained = Math.round(gained * buffMult);
    }
    return gained;
  }
  api.scoreMatch = scoreMatch;
  /* === END TASK SECTION ml-3 === */

  /* === TASK SECTION ml-4 hint (add task code and api.* exports here) === */
  // A swap worth suggesting: two adjacent cells whose exchange makes a match.
  // Returns { a:{col,row}, b:{col,row} } or null when the board has no legal move.
  // The board is left exactly as it was found (each trial swap is undone).
  function findHint(board){
    for (const c of CELLS){
      for (const [dc,dr] of CELL_CHECK_DIRS){
        const n = { col:c.col+dc, row:c.row+dr };
        if (!(cellKey(n.col,n.row) in board)) continue;
        swapCells(board, c, n);
        const makesMatch = findMatches(board).size > 0;
        swapCells(board, c, n); // undo the trial, board untouched
        if (makesMatch) return { a:{col:c.col, row:c.row}, b:{col:n.col, row:n.row} };
      }
    }
    return null;
  }
  api.findHint = findHint;
  /* === END TASK SECTION ml-4 === */

  /* === TASK SECTION ml-8 star-rating (add task code and api.* exports here) === */
  // How a finished run is rated against the target it was aiming at: 1 star for
  // hitting it, 2 for beating it by a quarter, 3 for beating it by half. Missing
  // the target (or a run with no target at all) earns none.
  // The multipliers are exact in binary, so no rounding creeps into a boundary.
  function starsForScore(score, target){
    if (!(target > 0)) return 0;
    if (score >= target * 1.5) return 3;
    if (score >= target * 1.25) return 2;
    if (score >= target) return 1;
    return 0;
  }
  api.starsForScore = starsForScore;
  /* === END TASK SECTION ml-8 === */

  /* === TASK SECTION ml-22 match-beat-table (add task code and api.* exports here) === */
  // How long a clearing match swells, pops and falls, in milliseconds, keyed by
  // match size (the longest run it contains). A plain 3-match just pops and falls
  // inside the 0.4-0.6 s the direction asks for; runs of 4 and 5+ earn a short
  // swell before the burst, topping out under the ~1 s cap for a big moment.
  // Sizes beyond 5 share the biggest beat, and anything below 3 (or not a number
  // at all) falls back to the 3-match beat instead of throwing.
  const MATCH_BEATS = Object.freeze({
    3: Object.freeze({ swell: 0,   pop: 220, fall: 200 }),
    4: Object.freeze({ swell: 140, pop: 300, fall: 220 }),
    5: Object.freeze({ swell: 180, pop: 380, fall: 240 }),
  });
  function matchBeat(maxRun){
    const run = typeof maxRun === 'number' && isFinite(maxRun) && maxRun >= 4 ? Math.floor(maxRun) : 3;
    const key = run >= 5 ? 5 : run;
    const beat = MATCH_BEATS[key];
    // Fresh copy every call: a caller mutating the result never touches the table.
    return { swell: beat.swell, pop: beat.pop, fall: beat.fall, total: beat.swell + beat.pop + beat.fall };
  }
  api.MATCH_BEATS = MATCH_BEATS;
  api.matchBeat = matchBeat;
  /* === END TASK SECTION ml-22 === */

  /* === TASK SECTION ml-33 special-tiles (add task code and api.* exports here) === */
  // A special tile is stored as `monster + '+' + kind` ('sword+line-h'): the
  // monster half decides what it matches with, the kind half decides what it
  // does when it fires. A line blaster carries its direction in the kind
  // ('line-h' clears a row, 'line-v' a column); a bomb is just 'bomb'. Plain
  // tiles carry only the monster, so encoding and matching share one separator
  // without ambiguity.
  function makeSpecial(type, kind){ return type + '+' + kind; }
  function baseType(tile){
    const i = typeof tile === 'string' ? tile.indexOf('+') : -1;
    return i === -1 ? tile : tile.slice(0, i);
  }
  function specialOf(tile){
    if (typeof tile !== 'string') return null;
    const i = tile.indexOf('+');
    return i === -1 ? null : tile.slice(i + 1);
  }
  api.makeSpecial = makeSpecial;
  api.baseType = baseType;
  api.specialOf = specialOf;
  /* === END TASK SECTION ml-33 === */

  /* === TASK SECTION ml-34 match-shape (add task code and api.* exports here) === */
  // Which special a match leaves behind, read from the matched set alone. A
  // cell's (col,row) says everything needed: group matched cells into the two
  // straight-line axes and walk each group in order, so the longest unbroken
  // run of matched cells along a row or column needs no board. A run of 5 or
  // more leaves a bomb, a run of exactly 4 leaves a line blaster (horizontal or
  // vertical, from the axis the run lies on), and a plain 3-match leaves
  // nothing. An L or T -- a row run and a column run of 3+ sharing a tile --
  // counts as one match and leaves a bomb too.
  function matchShapeCells(matched){
    const cells = [];
    if (!matched || typeof matched[Symbol.iterator] !== 'function') return cells;
    for (const key of matched){
      const cell = parseCellKey(key);
      if (cell) cells.push(cell);
    }
    return cells;
  }
  // Every maximal run of consecutive matched cells along one axis. Cells of a
  // line are grouped by their fixed coordinate and sorted by the stepping one;
  // a gap in the stepping coordinate breaks the run.
  function axisSegments(cells, fixedKey, stepKey){
    const groups = new Map();
    for (const c of cells){
      const id = c[fixedKey];
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(c);
    }
    const segments = [];
    for (const line of groups.values()){
      line.sort((a,b)=> a[stepKey]-b[stepKey]);
      let run = [line[0]];
      for (let i=1;i<line.length;i++){
        if (line[i][stepKey] === line[i-1][stepKey] + 1) run.push(line[i]);
        else { segments.push(run); run = [line[i]]; }
      }
      segments.push(run);
    }
    return segments;
  }
  function matchShape(matched){
    const cells = matchShapeCells(matched);
    if (cells.length === 0) return null; // empty or unusable match leaves nothing
    const rowSegs = axisSegments(cells, 'row', 'col');
    const colSegs = axisSegments(cells, 'col', 'row');
    let maxRun = 0, rowFour = false, colFour = false;
    const longRows = new Set(), longCols = new Set();
    for (const seg of rowSegs){
      if (seg.length > maxRun) maxRun = seg.length;
      if (seg.length === 4) rowFour = true;
      if (seg.length >= 3) seg.forEach(c=> longRows.add(cellKey(c.col,c.row)));
    }
    for (const seg of colSegs){
      if (seg.length > maxRun) maxRun = seg.length;
      if (seg.length === 4) colFour = true;
      if (seg.length >= 3) seg.forEach(c=> longCols.add(cellKey(c.col,c.row)));
    }
    // L/T: a row run and a column run of 3+ sharing a tile.
    let isLT = false;
    for (const k of longRows){ if (longCols.has(k)){ isLT = true; break; } }
    if (maxRun >= 5 || isLT) return 'bomb';
    if (maxRun === 4) return rowFour ? 'line-h' : 'line-v';
    return null;
  }
  api.matchShape = matchShape;
  /* === END TASK SECTION ml-34 === */

  /* === TASK SECTION ml-35 special-anchor (add task code and api.* exports here) === */
  function cellKeyCell(c){ return cellKey(c.col, c.row); }

  function specialAnchor(board, matched, a, b){
    // Check if played cells are in the match
    const aKey = a && Number.isInteger(a.col) ? cellKey(a.col, a.row) : null;
    const bKey = b && Number.isInteger(b.col) ? cellKey(b.col, b.row) : null;
    if (matched && matched.has && aKey && matched.has(aKey)) return { col: a.col, row: a.row };
    if (matched && matched.has && bKey && matched.has(bKey)) return { col: b.col, row: b.row };

    // Find all cells in the matched set with their coordinates and types
    const cells = [];
    if (matched && typeof matched[Symbol.iterator] === 'function'){
      for (const key of matched){
        const cell = parseCellKey(key);
        if (!cell) continue;
        if (!(key in board)) continue; // ensure it's a real board cell
        cells.push({ col: cell.col, row: cell.row, key, type: baseType(board[key]) });
      }
    }
    if (cells.length === 0) {
      const first = matched && typeof matched[Symbol.iterator] === 'function' ? [...matched][0] : null;
      const cell = parseCellKey(first);
      if (cell) return cell;
      return { col: a.col, row: a.row };
    }

    // Find all straight runs (contiguous along an axis, same monster type)
    const runs = [];
    const axes = [
      { fixed: 'row', step: 'col' },
      { fixed: 'col', step: 'row' },
    ];
    for (const axis of axes){
      const lines = new Map();
      for (const c of cells){
        const id = c[axis.fixed];
        if (!lines.has(id)) lines.set(id, []);
        lines.get(id).push(c);
      }
      for (const line of lines.values()){
        line.sort((x,y) => {
          const sx = x[axis.step], sy = y[axis.step];
          if (sx !== sy) return sx - sy;
          return x.key.localeCompare(y.key);
        });
        let i = 0;
        while (i < line.length){
          let j = i;
          while (j + 1 < line.length){
            const cur = line[j];
            const next = line[j+1];
            const sameType = cur.type === next.type;
            const contiguous = next[axis.step] === cur[axis.step] + 1;
            if (sameType && contiguous) j++;
            else break;
          }
          const runCells = line.slice(i, j+1);
          if (runCells.length >= 1) runs.push(runCells);
          i = j + 1;
        }
      }
    }

    if (runs.length === 0){
      const best = cells.slice().sort((x,y) => x.key.localeCompare(y.key))[0];
      return { col: best.col, row: best.row };
    }

    // Find longest run; tie-breaker: the one containing the smallest key
    let bestRun = runs[0];
    for (let k = 1; k < runs.length; k++){
      const run = runs[k];
      if (run.length > bestRun.length){ bestRun = run; continue; }
      if (run.length === bestRun.length){
        const minBest = bestRun.reduce((m, c) => c.key < m ? c.key : m, bestRun[0].key);
        const minRun = run.reduce((m, c) => c.key < m ? c.key : m, run[0].key);
        if (minRun < minBest) bestRun = run;
      }
    }

    // Return middle cell at index Math.floor((n-1)/2)
    const n = bestRun.length;
    const idx = Math.floor((n - 1) / 2);
    const mid = bestRun[idx];
    return { col: mid.col, row: mid.row };
  }
  api.specialAnchor = specialAnchor;
  /* === END TASK SECTION ml-35 === */

  /* === TASK SECTION ml-36 plant-special (add task code and api.* exports here) === */
  // Turn the tile on `key` into a special: its monster stays exactly as it is
  // (re-planting over an old special only swaps the kind), and the kind is
  // appended with the same '+' separator the rest of the game uses.
  // Nothing is planted on an empty cell or for a kind we cannot fire — the
  // board is left untouched and null comes back so callers can reject it.
  const PLANT_KINDS = ['line-h', 'line-v', 'bomb'];
  function plantSpecial(board, key, kind){
    if (!board || typeof key !== 'string' || PLANT_KINDS.indexOf(kind) === -1) return null;
    if (!(key in board)) return null;
    const tile = board[key];
    if (typeof tile !== 'string' || tile.length === 0) return null;
    const monster = baseType(tile);
    if (!monster) return null;
    const planted = makeSpecial(monster, kind);
    board[key] = planted;
    return planted;
  }
  api.plantSpecial = plantSpecial;
  /* === END TASK SECTION ml-36 === */

  /* === TASK SECTION ml-37 special-blasts (add task code and api.* exports here) === */
  // What a special clears when it fires. Every function here is read-only:
  // the board is only ever looked at, never written to.

  // Every board cell on the same row (constant row) as `key`, the cell itself
  // included. A key outside the board has no row and clears nothing.
  function rowBlast(board, key){
    const blast = new Set();
    const cell = parseCellKey(key);
    if (!cell) return blast;
    for (let col=0; col<COLS; col++){
      const k = cellKey(col, cell.row);
      if (!board || k in board) blast.add(k);
    }
    return blast;
  }

  // The column counterpart of rowBlast: every cell on the same column.
  function colBlast(board, key){
    const blast = new Set();
    const cell = parseCellKey(key);
    if (!cell) return blast;
    for (let row=0; row<ROWS; row++){
      const k = cellKey(cell.col, row);
      if (!board || k in board) blast.add(k);
    }
    return blast;
  }

  // A line blaster clears its whole row ('line-h') or column ('line-v'); the
  // direction is read from the tile on the key. A plain tile clears nothing.
  function lineBlast(board, key){
    const blast = new Set();
    if (!board || typeof key !== 'string' || !(key in board)) return blast;
    const kind = specialOf(board[key]);
    if (kind === 'line-h') return rowBlast(board, key);
    if (kind === 'line-v') return colBlast(board, key);
    return blast;
  }

  // Every cell whose tile is that monster, specials included: 'gem+line-h' is
  // still a gem as far as a colour bomb is concerned.
  function cellsOfType(board, type){
    const found = new Set();
    if (!board || typeof type !== 'string' || type.length === 0) return found;
    for (const k in board) if (baseType(board[k]) === type) found.add(k);
    return found;
  }

  // The 3x3 area around a bomb, the bomb itself included, clipped to the board.
  function bombBlast(board, key){
    const blast = new Set();
    const cell = parseCellKey(key);
    if (!cell) return blast;
    for (let dc=-1; dc<=1; dc++){
      for (let dr=-1; dr<=1; dr++){
        const col = cell.col+dc, row = cell.row+dr;
        if (!inBounds(col,row)) continue;
        const k = cellKey(col,row);
        if (!board || k in board) blast.add(k);
      }
    }
    return blast;
  }

  // The cells the special sitting at `key` clears when it goes off: a line
  // blaster takes its whole row or column, a bomb takes the 3x3 around it, and
  // a plain tile clears nothing on its own.
  function specialTargets(board, key, swapType){
    if (!board || typeof key !== 'string' || !(key in board)) return new Set();
    const kind = specialOf(board[key]);
    if (kind === 'line-h') return rowBlast(board, key);
    if (kind === 'line-v') return colBlast(board, key);
    if (kind === 'bomb') return bombBlast(board, key);
    return new Set();
  }

  api.rowBlast = rowBlast;
  api.colBlast = colBlast;
  api.lineBlast = lineBlast;
  api.bombBlast = bombBlast;
  api.cellsOfType = cellsOfType;
  api.specialTargets = specialTargets;
  /* === END TASK SECTION ml-37 === */

  /* === TASK SECTION ml-38 special-chain (add task code and api.* exports here) === */
  // Every cell a set of blasts ends up clearing: any special caught by the set
  // fires too, and whatever its blast catches may hold another special, and so
  // on until nothing new turns up. The input Set and the board are both left
  // exactly as they were — the caller owns them, we only read.
  // Specials fire in sorted-key order so the chain (and therefore the result)
  // never depends on Set iteration order, and each one fires exactly once even
  // if several blasts cover it.
  function chainSpecials(board, targets, swapType, alreadyFired){
    const result = (targets && typeof targets[Symbol.iterator] === 'function')
      ? new Set(targets)
      : new Set();
    const fired = new Set(alreadyFired && typeof alreadyFired[Symbol.iterator] === 'function' ? alreadyFired : []);
    for (;;){
      // Anything new still sitting in the result that can actually fire.
      const pending = [];
      for (const key of result){
        if (fired.has(key)) continue;
        if (!board || typeof key !== 'string' || !(key in board) || specialOf(board[key]) === null){
          fired.add(key); // not a special (or not a cell): it will never fire
          continue;
        }
        pending.push(key);
      }
      if (pending.length === 0) break;
      pending.sort();
      for (const key of pending){
        fired.add(key);
        for (const k of specialTargets(board, key, swapType)) result.add(k);
      }
    }
    return result;
  }
  api.chainSpecials = chainSpecials;
  /* === END TASK SECTION ml-38 === */

  /* === TASK SECTION ml-42 colour-bomb-swap (add task code and api.* exports here) === */
  // What a swap with a colour bomb on one side clears. The board is read AFTER
  // the two tiles traded places, so the bomb is wherever it now sits and its
  // partner is the tile on the other swapped cell. A bomb swapped with a plain
  // tile clears every tile of the partner's monster, chained through so a
  // special caught by it fires too — one bomb may hand its colour to the next.
  // No colour bomb on either side means nothing: null comes back and the swap
  // stays a plain swap that must make a match to be legal. Cells missing from
  // the board are not a swap that ever happened, so they are refused the same
  // way instead of clearing half a blast.
  function bombSwapBlast(board, a, b){
    if (!board || !a || !b) return null;
    const ka = cellKey(a.col, a.row), kb = cellKey(b.col, b.row);
    if (!(ka in board) || !(kb in board)) return null;
    const atA = board[ka], atB = board[kb];
    const bombA = specialOf(atA) === 'bomb';
    const bombB = specialOf(atB) === 'bomb';
    if (!bombA && !bombB) return null;
    const blast = new Set();
    // The bombs that were swapped are cleared, but they have already paid for
    // themselves as colour bombs -- they must not fire again as 3x3 blasts.
    const alreadyFired = new Set();
    if (bombA){ // the bomb sits at a, swapped with whatever now stands at b
      blast.add(ka);
      alreadyFired.add(ka);
      cellsOfType(board, baseType(atB)).forEach(key => blast.add(key));
    }
    if (bombB){ // the bomb sits at b, swapped with whatever now stands at a
      blast.add(kb);
      alreadyFired.add(kb);
      cellsOfType(board, baseType(atA)).forEach(key => blast.add(key));
    }
    const swapType = bombA ? baseType(atB) : baseType(atA);
    return chainSpecials(board, blast, swapType, alreadyFired);
  }
  api.bombSwapBlast = bombSwapBlast;
  /* === END TASK SECTION ml-42 === */

  /* === TASK SECTION ml-45 combine-swap (add task code and api.* exports here) === */
  // Swapping two specials together is a legal move with a bigger effect than a
  // single special, and it does not need to make a match. The board is read as
  // it stands AFTER the two tiles traded places, exactly like bombSwapBlast, and
  // is never written to. A pair only combines when BOTH cells hold a special
  // kind; a special swapped with a plain tile is not a combine (null) and stays
  // a plain swap that must match to be legal.

  // The full row plus the full column through a cell (a cross).
  function crossBlast(board, key){
    const blast = new Set();
    rowBlast(board, key).forEach(k => blast.add(k));
    colBlast(board, key).forEach(k => blast.add(k));
    return blast;
  }

  // Full rows and full columns through every row/column within `radius` of the
  // cell: radius 1 is the three rows and three columns centred on it (a band).
  function bandBlast(board, key, radius){
    const blast = new Set();
    const cell = parseCellKey(key);
    if (!cell) return blast;
    for (let d = -radius; d <= radius; d++){
      const row = cell.row + d, col = cell.col + d;
      if (row >= 0 && row < ROWS) rowBlast(board, cellKey(cell.col, row)).forEach(k => blast.add(k));
      if (col >= 0 && col < COLS) colBlast(board, cellKey(col, cell.row)).forEach(k => blast.add(k));
    }
    return blast;
  }

  // Every cell inside a square of `radius` around the cell (radius 2 is 5x5),
  // clipped to the board.
  function areaBlast(board, key, radius){
    const blast = new Set();
    const cell = parseCellKey(key);
    if (!cell) return blast;
    for (let dc = -radius; dc <= radius; dc++){
      for (let dr = -radius; dr <= radius; dr++){
        const col = cell.col + dc, row = cell.row + dr;
        if (!inBounds(col, row)) continue;
        const k = cellKey(col, row);
        if (!board || k in board) blast.add(k);
      }
    }
    return blast;
  }

  // Which combine a pair of specials makes, read from the two tiles alone:
  // 'cross' (line + line), 'mega' (line + bomb) or 'kaboom' (bomb + bomb), or
  // null when either tile is plain (so it is not a combine at all). Both orders
  // of the pair give the same answer.
  function comboKind(tileA, tileB){
    const kindA = specialOf(tileA), kindB = specialOf(tileB);
    if (kindA === null || kindB === null) return null;
    const lineA = kindA.indexOf('line') === 0, lineB = kindB.indexOf('line') === 0;
    const bombA = kindA === 'bomb', bombB = kindB === 'bomb';
    if (lineA && lineB) return 'cross';
    if ((lineA && bombB) || (bombA && lineB)) return 'mega';
    if (bombA && bombB) return 'kaboom';
    return null; // only reachable for kinds added later, and then it is not a combo
  }

  // What swapping two specials together clears, centred on the first swapped
  // cell `a` (the cell the swipe came from):
  //   line + line -> the full row AND full column of a (cross);
  //   line + bomb -> the 3 rows and 3 columns centred on a;
  //   bomb + bomb -> the 5x5 square around a.
  // The two swapped specials have already paid for themselves, so they are not
  // fired again by the chain; anything else the blast catches still fires.
  function combineSwapBlast(board, a, b){
    if (!board || !a || !b) return null;
    const ka = cellKey(a.col, a.row), kb = cellKey(b.col, b.row);
    if (!(ka in board) || !(kb in board)) return null;
    const kind = comboKind(board[ka], board[kb]);
    if (!kind) return null;
    let blast;
    if (kind === 'cross') blast = crossBlast(board, ka);
    else if (kind === 'mega') blast = bandBlast(board, ka, 1);
    else blast = areaBlast(board, ka, 2);
    return chainSpecials(board, blast, undefined, new Set([ka, kb]));
  }
  api.crossBlast = crossBlast;
  api.bandBlast = bandBlast;
  api.areaBlast = areaBlast;
  api.comboKind = comboKind;
  api.combineSwapBlast = combineSwapBlast;
  /* === END TASK SECTION ml-45 === */

  return api;
});
