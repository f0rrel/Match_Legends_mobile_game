/* =========================================================
   MATCH LEGENDS — PURE GAME LOGIC
   Hex grid, matching, gravity and power targeting. No DOM, no audio,
   no timers: everything here is a plain function of its arguments, so
   it runs both in the game (window.MatchLogic) and under Node's test
   runner (module.exports). No bundler; a classic script.

   Randomness: every function that needs it takes an optional `rng`
   (a function returning a float in [0, 1)), defaulting to Math.random.

   HEX GRID GEOMETRY
   Axial coordinates (q,r), pointy-top hexagons. Board is a
   "hex of hexes" of radius HEX_RADIUS. A hex has 3 straight-
   line axes (q constant, r constant, s=-q-r constant) instead
   of a square grid's 2 (rows/cols) — matches run along any of
   the 6 directions those 3 axes cover.
   Reference: redblobgames.com/grids/hexagons
========================================================= */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MatchLogic = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TYPES = ['sword', 'shield', 'urn', 'crown', 'flame', 'gem'];
  const HEX_RADIUS = 4; // hex-of-hexes board, 3R²+3R+1 = 61 cells
  const BASE_POINTS = 20;

  function hexKey(q,r){ return q+','+r; }
  function buildHexCells(R){
    const cells = [];
    for (let q=-R; q<=R; q++){
      const r1 = Math.max(-R, -q-R);
      const r2 = Math.min(R, -q+R);
      for (let r=r1; r<=r2; r++) cells.push({q,r});
    }
    return cells;
  }
  const HEX_CELLS = buildHexCells(HEX_RADIUS);

  // Per-q column extents, used for gravity (tiles fall toward larger r).
  const QCOLUMNS = [];
  const QCOLUMNS_BY_Q = {};
  for (let q=-HEX_RADIUS; q<=HEX_RADIUS; q++){
    const rMin = Math.max(-HEX_RADIUS, -q-HEX_RADIUS);
    const rMax = Math.min(HEX_RADIUS, -q+HEX_RADIUS);
    const entry = { q, rMin, rMax };
    QCOLUMNS.push(entry);
    QCOLUMNS_BY_Q[q] = entry;
  }

  // Group every cell into its 3 axis-lines once (board shape is static).
  const HEX_LINE_GROUPS = { q:[], r:[], s:[] };
  (function buildHexLines(){
    const byQ = {}, byR = {}, byS = {};
    HEX_CELLS.forEach(c=>{
      const s = -c.q-c.r;
      (byQ[c.q] = byQ[c.q]||[]).push(c);
      (byR[c.r] = byR[c.r]||[]).push(c);
      (byS[s] = byS[s]||[]).push(c);
    });
    Object.values(byQ).forEach(arr=>{ arr.sort((a,b)=>a.r-b.r); HEX_LINE_GROUPS.q.push(arr); });
    Object.values(byR).forEach(arr=>{ arr.sort((a,b)=>a.q-b.q); HEX_LINE_GROUPS.r.push(arr); });
    Object.values(byS).forEach(arr=>{ arr.sort((a,b)=>a.q-b.q); HEX_LINE_GROUPS.s.push(arr); });
  })();
  const HEX_ALL_LINES = [...HEX_LINE_GROUPS.q, ...HEX_LINE_GROUPS.r, ...HEX_LINE_GROUPS.s];

  const HEX_DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
  const HEX_CHECK_DIRS = [[1,0],[0,1],[1,-1]]; // covers every board edge exactly once
  function hexNeighbors(q,r){ return HEX_DIRS.map(([dq,dr])=>({q:q+dq,r:r+dr})); }
  function isHexAdjacent(a,b){ return HEX_DIRS.some(([dq,dr])=> a.q+dq===b.q && a.r+dr===b.r); }
  function swapHex(board,a,b){ const ka=hexKey(a.q,a.r), kb=hexKey(b.q,b.r); const t=board[ka]; board[ka]=board[kb]; board[kb]=t; }

  /* =========================================================
     BOARD LOGIC
  ========================================================= */
  function pick(list, rng){ return list[Math.floor(rng()*list.length)]; }
  function randType(rng = Math.random){ return pick(TYPES, rng); }
  function createBoard(rng = Math.random){
    const board = {};
    HEX_CELLS.forEach(c=> board[hexKey(c.q,c.r)] = randType(rng));
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
    HEX_ALL_LINES.forEach(line=>{
      let start = 0;
      for (let i=1;i<=line.length;i++){
        const startKey = hexKey(line[start].q, line[start].r);
        const curKey = i<line.length ? hexKey(line[i].q, line[i].r) : null;
        if (curKey && baseType(board[curKey])===baseType(board[startKey])) continue;
        const len = i-start;
        if (len>=3) for (let k=start;k<i;k++){
          const kk = hexKey(line[k].q, line[k].r);
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
    for (const c of HEX_CELLS){
      for (const [dq,dr] of HEX_CHECK_DIRS){
        const n = { q:c.q+dq, r:c.r+dr };
        if (!(hexKey(n.q,n.r) in board)) continue;
        swapHex(board, c, n);
        const m = findMatches(board);
        swapHex(board, c, n);
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
  // Returns collapse plan: for each q-column, list of {q, fromR(or null if new), toR, type}.
  // Gravity pulls toward larger r (down-screen); new tiles spawn at the column's rMin end.
  function computeCollapse(board, matchedSet, rng = Math.random){
    const plan = [];
    QCOLUMNS.forEach(({q, rMin, rMax})=>{
      const survivors = [];
      for (let r=rMin; r<=rMax; r++){
        const key = hexKey(q,r);
        if (!matchedSet.has(key)) survivors.push({ fromR:r, type:board[key] });
      }
      const total = rMax-rMin+1;
      const newCount = total - survivors.length;
      const newTiles = [];
      for (let i=0;i<newCount;i++) newTiles.push({ fromR:null, type:randType(rng) });
      const finalCol = newTiles.concat(survivors);
      for (let i=0;i<total;i++){
        const r = rMin+i;
        const item = finalCol[i];
        plan.push({ q, toR:r, fromR:item.fromR, type:item.type });
        board[hexKey(q,r)] = item.type;
      }
    });
    return plan;
  }

  /* =========================================================
     POWER TARGETING (which cells a power clears)
     The game applies the side effects (buffs, gems, moves, UI).
  ========================================================= */
  // clearRow: a full q-axis line. clearColumn: a full r-axis line.
  function lineTargets(axis, rng = Math.random){
    const line = pick(HEX_LINE_GROUPS[axis], rng);
    return new Set(line.map(c=> hexKey(c.q,c.r)));
  }
  // clearArea: a center hex + its 6 neighbors, then chain lightning: same-type
  // neighbors just outside the blast are zapped, twice over.
  function areaTargets(board, rng = Math.random){
    const matched = new Set();
    const center = pick(HEX_CELLS, rng);
    matched.add(hexKey(center.q,center.r));
    hexNeighbors(center.q,center.r).forEach(n=>{
      const nk = hexKey(n.q,n.r);
      if (nk in board) matched.add(nk);
    });
    for (let pass=0; pass<2; pass++){
      const additions = [];
      matched.forEach(key=>{
        const [q,r] = key.split(',').map(Number);
        const t = board[key];
        hexNeighbors(q,r).forEach(n=>{
          const nk = hexKey(n.q,n.r);
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
    TYPES, HEX_RADIUS, BASE_POINTS,
    hexKey, buildHexCells, HEX_CELLS, QCOLUMNS, QCOLUMNS_BY_Q,
    HEX_LINE_GROUPS, HEX_ALL_LINES, HEX_DIRS, HEX_CHECK_DIRS,
    hexNeighbors, isHexAdjacent, swapHex,
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
  // Returns { a:{q,r}, b:{q,r} } or null when the board has no legal move.
  // The board is left exactly as it was found (each trial swap is undone).
  function findHint(board){
    for (const c of HEX_CELLS){
      for (const [dq,dr] of HEX_CHECK_DIRS){
        const n = { q:c.q+dq, r:c.r+dr };
        if (!(hexKey(n.q,n.r) in board)) continue;
        swapHex(board, c, n);
        const makesMatch = findMatches(board).size > 0;
        swapHex(board, c, n); // undo the trial, board untouched
        if (makesMatch) return { a:{q:c.q, r:c.r}, b:{q:n.q, r:n.r} };
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
  // A special tile is stored as `monster + '+' + kind` ('sword+line'): the
  // monster half decides what it matches with, the kind half decides what it
  // does when it fires. Plain tiles carry only the monster, so encoding and
  // matching share one separator without ambiguity.
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

  return api;
});
