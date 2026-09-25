/*
 * Sudoku engine: grid helpers, solver, generator, difficulty grader and hints.
 *
 * Grids are flat arrays of 81 numbers, row by row, with 0 for an empty cell.
 * See docs/ for the reasoning behind each part.
 *
 * Works as a plain browser script (exposes `window.Sudoku`) and as a
 * CommonJS module for the Node tests.
 */
(function (root) {
  'use strict';

  const ALL = 0x1ff; // bits 0..8 set: digits 1..9 all allowed

  // ---- Static geometry -----------------------------------------------------

  const ROW = [], COL = [], BOX = [];
  for (let i = 0; i < 81; i++) {
    ROW[i] = Math.floor(i / 9);
    COL[i] = i % 9;
    BOX[i] = Math.floor(ROW[i] / 3) * 3 + Math.floor(COL[i] / 3);
  }

  // 27 units: 9 rows, 9 columns, 9 boxes; each is a list of 9 cell indices.
  const UNITS = [];
  for (let k = 0; k < 9; k++) UNITS.push([...Array(9)].map((_, j) => k * 9 + j));
  for (let k = 0; k < 9; k++) UNITS.push([...Array(9)].map((_, j) => j * 9 + k));
  for (let k = 0; k < 9; k++) UNITS.push([...Array(81).keys()].filter(i => BOX[i] === k));

  // The 20 cells sharing a row, column or box with each cell.
  const PEERS = [...Array(81)].map((_, i) =>
    [...Array(81).keys()].filter(j =>
      j !== i && (ROW[j] === ROW[i] || COL[j] === COL[i] || BOX[j] === BOX[i])));

  // ---- Small helpers -------------------------------------------------------

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function popcount(m) {
    let c = 0;
    while (m) { m &= m - 1; c++; }
    return c;
  }

  const bitToDigit = bit => 31 - Math.clz32(bit) + 1;

  function parse(s) {
    if (s.length !== 81) throw new Error('A puzzle string must have 81 characters');
    return [...s].map(ch => (ch === '.' || ch === '0' ? 0 : Number(ch)));
  }

  const format = g => g.map(n => (n === 0 ? '.' : String(n))).join('');

  function canPlace(g, i, n) {
    for (const p of PEERS[i]) if (g[p] === n) return false;
    return true;
  }

  // ---- Backtracking solver -------------------------------------------------

  /*
   * Searches for solutions with bitmasks and the most-constrained-cell
   * heuristic. Stops once `limit` solutions are found.
   * Returns { count, solution } where `solution` is the first one found.
   * With `randomize`, digits are tried in random order (used to build grids).
   */
  function search(grid, limit, randomize) {
    const g = Array.from(grid);
    const rows = new Uint16Array(9), cols = new Uint16Array(9), boxes = new Uint16Array(9);

    for (let i = 0; i < 81; i++) {
      if (!g[i]) continue;
      const bit = 1 << (g[i] - 1);
      if ((rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & bit) return { count: 0, solution: null };
      rows[ROW[i]] |= bit; cols[COL[i]] |= bit; boxes[BOX[i]] |= bit;
    }

    let count = 0, solution = null;

    function step() {
      let best = -1, bestMask = 0, bestCount = 10;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const mask = ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & ALL;
        const c = popcount(mask);
        if (c === 0) return;               // dead end
        if (c < bestCount) {
          best = i; bestMask = mask; bestCount = c;
          if (c === 1) break;
        }
      }
      if (best === -1) {                   // no empty cells: solved
        count++;
        if (!solution) solution = g.slice();
        return;
      }

      const bits = [];
      for (let m = bestMask; m; m &= m - 1) bits.push(m & -m);
      if (randomize) shuffle(bits);

      const r = ROW[best], c = COL[best], b = BOX[best];
      for (const bit of bits) {
        g[best] = bitToDigit(bit);
        rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        step();
        rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
        g[best] = 0;
        if (count >= limit) return;
      }
    }

    step();
    return { count, solution };
  }

  const countSolutions = (grid, limit = 2) => search(grid, limit, false).count;
  const solve = grid => search(grid, 1, false).solution;
  const randomSolvedGrid = () => search(new Array(81).fill(0), 1, true).solution;

  // ---- Logical (human-style) steps -----------------------------------------
  //
  // Each find* function looks for one step of a human solving technique in a
  // grid `g` with candidate masks `cand`, and describes it without applying
  // it. The grader and the hints share them.

  const LEVEL = { SINGLES: 1, LOCKED: 2, SUBSETS: 3, ADVANCED: 4 };

  const bit = d => 1 << (d - 1);

  // Candidate masks for every empty cell, from the digits already placed.
  function candidatesFor(g) {
    const cand = new Uint16Array(81);
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      let used = 0;
      for (const p of PEERS[i]) if (g[p]) used |= bit(g[p]);
      cand[i] = ~used & ALL;
    }
    return cand;
  }

  /*
   * A placement: { type: 'single', technique, cell, digit, unit }.
   * Hidden singles in boxes come first, as people spot those most easily,
   * then hidden singles in rows and columns, then naked singles (unit null).
   */
  const SINGLE_UNIT_ORDER = [...Array(9).keys()].map(k => 18 + k).concat([...Array(18).keys()]);

  function findSingle(g, cand) {
    for (const u of SINGLE_UNIT_ORDER) {
      // Digits with exactly one spot in the unit: seen once but not twice.
      let once = 0, twice = 0;
      for (const i of UNITS[u]) { twice |= once & cand[i]; once |= cand[i]; }
      const lone = once & ~twice;
      if (!lone) continue;
      const d = bitToDigit(lone & -lone); // lowest digit first
      const spot = UNITS[u].find(i => cand[i] & bit(d));
      return { type: 'single', technique: 'Hidden single', cell: spot, digit: d, unit: u };
    }
    for (let i = 0; i < 81; i++) {
      if (!g[i] && popcount(cand[i]) === 1) {
        return { type: 'single', technique: 'Naked single', cell: i, digit: bitToDigit(cand[i]), unit: null };
      }
    }
    return null;
  }

  // Removes `mask` from each cell; returns the removals that changed something.
  function removalsFor(cand, cells, mask) {
    return cells.filter(i => cand[i] & mask).map(i => ({ cell: i, mask: cand[i] & mask }));
  }

  /*
   * Pointing pairs/triples (a digit's spots in a box all lie on one line) and
   * box/line reduction (a digit's spots in a line all lie in one box).
   * Returns { type: 'eliminate', technique, level, digits, pattern, unit,
   * target, removals } where `pattern` cells in `unit` justify removing the
   * digit from other cells in `target`.
   */
  function* eachLocked(g, cand) {
    for (let u = 0; u < 27; u++) {
      const unit = UNITS[u];
      for (let d = 1; d <= 9; d++) {
        const cells = unit.filter(i => cand[i] & bit(d));
        if (cells.length < 2) continue;
        const found = (technique, target) => {
          const removals = removalsFor(cand, UNITS[target].filter(i => !unit.includes(i)), bit(d));
          return removals.length ? {
            type: 'eliminate', technique, level: LEVEL.LOCKED, digits: [d],
            pattern: cells, unit: u, target, removals,
          } : null;
        };
        let step = null;
        if (u >= 18) {
          const name = cells.length === 2 ? 'Pointing pair' : 'Pointing triple';
          if (cells.every(i => ROW[i] === ROW[cells[0]])) step = found(name, ROW[cells[0]]);
          if (!step && cells.every(i => COL[i] === COL[cells[0]])) step = found(name, 9 + COL[cells[0]]);
        } else if (cells.every(i => BOX[i] === BOX[cells[0]])) {
          step = found('Box/line reduction', 18 + BOX[cells[0]]);
        }
        if (step) yield step;
      }
    }
  }

  // Naked and hidden pairs/triples; same shape as findLocked (target = unit).
  function* eachSubset(g, cand) {
    for (let u = 0; u < 27; u++) {
      const empty = UNITS[u].filter(i => !g[i]);
      for (const size of [2, 3]) {
        const suffix = size === 2 ? 'pair' : 'triple';
        for (const combo of combinations(empty, size)) {
          let union = 0;
          for (const i of combo) union |= cand[i];
          if (popcount(union) !== size) continue;
          const removals = removalsFor(cand, empty.filter(i => !combo.includes(i)), union);
          if (removals.length) {
            yield {
              type: 'eliminate', technique: `Naked ${suffix}`, level: LEVEL.SUBSETS,
              digits: maskDigits(union), pattern: combo, unit: u, target: u, removals,
            };
          }
        }
        const digits = [];
        for (let d = 1; d <= 9; d++) if (empty.some(i => cand[i] & bit(d))) digits.push(d);
        for (const combo of combinations(digits, size)) {
          const mask = combo.reduce((m, d) => m | bit(d), 0);
          const cells = empty.filter(i => cand[i] & mask);
          if (cells.length !== size) continue;
          const removals = cells.filter(i => cand[i] & ~mask).map(i => ({ cell: i, mask: cand[i] & ~mask }));
          if (removals.length) {
            yield {
              type: 'eliminate', technique: `Hidden ${suffix}`, level: LEVEL.SUBSETS,
              digits: combo, pattern: cells, unit: u, target: u, removals,
            };
          }
        }
      }
    }
  }

  const first = steps => { for (const step of steps) return step; return null; };
  const findLocked = (g, cand) => first(eachLocked(g, cand));
  const findSubset = (g, cand) => first(eachSubset(g, cand));

  const maskDigits = m => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => m & bit(d));

  function place(g, cand, i, d) {
    g[i] = d;
    cand[i] = 0;
    for (const p of PEERS[i]) cand[p] &= ~bit(d);
  }

  function applyRemovals(cand, removals) {
    for (const { cell, mask } of removals) cand[cell] &= ~mask;
  }

  /*
   * Solves using only human techniques, simplest first.
   * Returns { solved, hardest } where `hardest` is the highest LEVEL used.
   */
  function logicalSolve(grid) {
    const g = Array.from(grid);
    const cand = candidatesFor(g);
    let hardest = 0;
    for (;;) {
      if (g.every(v => v)) return { solved: true, hardest };
      const single = findSingle(g, cand);
      if (single) {
        place(g, cand, single.cell, single.digit);
        hardest = Math.max(hardest, LEVEL.SINGLES);
        continue;
      }
      const step = findLocked(g, cand) || findSubset(g, cand);
      if (!step) return { solved: false, hardest };
      applyRemovals(cand, step.removals);
      hardest = Math.max(hardest, step.level);
    }
  }

  function combinations(items, size, start = 0, prefix = [], out = []) {
    if (prefix.length === size) { out.push(prefix.slice()); return out; }
    for (let k = start; k < items.length; k++) {
      prefix.push(items[k]);
      combinations(items, size, k + 1, prefix, out);
      prefix.pop();
    }
    return out;
  }

  // ---- Advanced steps (hints only) ------------------------------------------
  //
  // Techniques beyond those that define the difficulty levels. Hints use them
  // so Expert puzzles can be explained too; the grader doesn't, so the levels
  // are unchanged. Each step carries its own wording (`text`), the cells to
  // highlight (`key`, `area`), and `relies`: the candidates whose absence the
  // reasoning depends on, as [{ cells, mask }].

  const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four'];
  const PEER_SETS = PEERS.map(p => new Set(p));
  const sees = (a, b) => PEER_SETS[a].has(b);
  const capital = t => t[0].toUpperCase() + t.slice(1);
  // "row 1, column 2 and row 3, column 4"; semicolons for longer lists.
  function cellList(cells) {
    const names = cells.map(cellName);
    if (names.length < 3) return list(names);
    return `${names.slice(0, -1).join('; ')}; and ${names[names.length - 1]}`;
  }
  const pairOf = m => maskDigits(m);

  // Other cells holding digit d that see every cell in `cells`.
  function seenByAll(cand, cells, d, exclude = []) {
    const skip = new Set([...cells, ...exclude]);
    return [...Array(81).keys()].filter(i =>
      !skip.has(i) && (cand[i] & bit(d)) && cells.every(c => sees(i, c)));
  }

  function step(technique, digits, key, removals, relies, text, area = []) {
    return {
      type: 'eliminate', technique, level: LEVEL.ADVANCED, digits, key, removals, relies, text,
      area: [...new Set([...area, ...removals.map(r => r.cell)])],
    };
  }

  // Lines where digit d has 2..max spots: [{ u, cells }].
  function linesFor(cand, d, byRow, max) {
    const out = [];
    for (let k = 0; k < 9; k++) {
      const u = byRow ? k : 9 + k;
      const cells = UNITS[u].filter(i => cand[i] & bit(d));
      if (cells.length >= 2 && cells.length <= max) out.push({ u, cells });
    }
    return out;
  }

  // X-Wing, Swordfish and Jellyfish.
  function* eachFish(g, cand, size) {
    const name = { 2: 'X-Wing', 3: 'Swordfish', 4: 'Jellyfish' }[size];
    for (let d = 1; d <= 9; d++) {
      for (const byRow of [true, false]) {
        for (const combo of combinations(linesFor(cand, d, byRow, size), size)) {
          const covers = [...new Set(combo.flatMap(l => l.cells.map(i => (byRow ? COL[i] : ROW[i]))))];
          if (covers.length !== size) continue;
          covers.sort((a, b) => a - b);
          const coverUnits = covers.map(k => (byRow ? 9 + k : k));
          const baseUnits = combo.map(l => l.u);
          const key = combo.flatMap(l => l.cells);
          const inBase = new Set(baseUnits.flatMap(u => UNITS[u]));
          const removals = removalsFor(cand, coverUnits.flatMap(u => UNITS[u]).filter(i => !inBase.has(i)), bit(d));
          if (!removals.length) continue;
          const base = `${byRow ? 'rows' : 'columns'} ${list(baseUnits.map(u => (u % 9) + 1))}`;
          const cover = `${byRow ? 'columns' : 'rows'} ${list(covers.map(k => k + 1))}`;
          const n = NUMBER_WORDS[size];
          yield step(name, [d], key, removals,
            baseUnits.map(u => ({ cells: UNITS[u].filter(i => !key.includes(i)), mask: bit(d) })),
            `In ${base}, ${d} can only go in ${cover}. Those ${n} ${byRow ? 'rows' : 'columns'} need ` +
            `${n} ${d}s, and they have to be in ${cover}. So ${d} can't go anywhere else in ${cover}.`,
            [...baseUnits, ...coverUnits].flatMap(u => UNITS[u]));
        }
      }
    }
  }

  // Skyscraper, 2-String Kite and Turbot Fish: two lines/boxes where a digit
  // has exactly two spots, joined by two spots that see each other.
  function* eachSingleDigitChain(g, cand) {
    for (let d = 1; d <= 9; d++) {
      const links = [];
      for (let u = 0; u < 27; u++) {
        const cells = UNITS[u].filter(i => cand[i] & bit(d));
        if (cells.length === 2) links.push({ u, cells });
      }
      for (let x = 0; x < links.length; x++) {
        for (let y = x + 1; y < links.length; y++) {
          const L1 = links[x], L2 = links[y];
          if (L1.cells.some(i => L2.cells.includes(i))) continue;
          for (const [a1, a2] of [L1.cells, [...L1.cells].reverse()]) {
            for (const [b1, b2] of [L2.cells, [...L2.cells].reverse()]) {
              if (!sees(a2, b1) || sees(a1, b2)) continue;
              const removals = removalsFor(cand, seenByAll(cand, [a1, b2], d, [a2, b1]), bit(d));
              if (!removals.length) continue;
              const kind = u => (u < 9 ? 'row' : u < 18 ? 'col' : 'box');
              const name = kind(L1.u) === kind(L2.u) && kind(L1.u) !== 'box' ? 'Skyscraper'
                : [kind(L1.u), kind(L2.u)].sort().join() === 'col,row' ? '2-String Kite' : 'Turbot Fish';
              yield step(name, [d], [a1, a2, b1, b2], removals,
                [L1, L2].map(L => ({ cells: UNITS[L.u].filter(i => !L.cells.includes(i)), mask: bit(d) })),
                `In ${unitName(L1.u)}, ${d} can only go in ${placeIn(L1.u, a1)} or ${placeIn(L1.u, a2)}. ` +
                `In ${unitName(L2.u)}, ${d} can only go in ${placeIn(L2.u, b1)} or ${placeIn(L2.u, b2)}. ` +
                `${capital(cellName(a2))} and ${cellName(b1)} see each other, so they can't both be ${d}. ` +
                `That means ${cellName(a1)} or ${cellName(b2)} must be ${d}, so ${d} can't go in ` +
                `${cellList(removals.map(r => r.cell))}, which ${removals.length > 1 ? 'see' : 'sees'} both.`,
                [...UNITS[L1.u], ...UNITS[L2.u]]);
            }
          }
        }
      }
    }
  }

  // Relies on each cell holding no candidates beyond the ones it has now.
  const onlyThese = (cand, cells) => cells.map(i => ({ cells: [i], mask: ALL & ~cand[i] }));

  function* eachXYWing(g, cand) {
    const bivalue = [...Array(81).keys()].filter(i => !g[i] && popcount(cand[i]) === 2);
    for (const p of bivalue) {
      const [a, b] = pairOf(cand[p]);
      const wings = bivalue.filter(i => sees(i, p) && cand[i] !== cand[p] && popcount(cand[i] & cand[p]) === 1);
      for (const x of wings) {
        if (!(cand[x] & bit(a))) continue;
        const c = pairOf(cand[x] & ~bit(a))[0];
        for (const y of wings) {
          if (y === x || cand[y] !== (bit(b) | bit(c))) continue;
          const removals = removalsFor(cand, seenByAll(cand, [x, y], c, [p]), bit(c));
          if (!removals.length) continue;
          yield step('XY-Wing', [c], [p, x, y], removals, onlyThese(cand, [p, x, y]),
            `${capital(cellName(p))} can only be ${a} or ${b}. If it's ${a}, ${cellName(x)} must be ${c}; ` +
            `if it's ${b}, ${cellName(y)} must be ${c}. Either way one of those two cells is ${c}, so ` +
            `${c} can't go in ${cellList(removals.map(r => r.cell))}, which ${removals.length > 1 ? 'see' : 'sees'} both.`);
        }
      }
    }
  }

  function* eachXYZWing(g, cand) {
    for (let p = 0; p < 81; p++) {
      if (g[p] || popcount(cand[p]) !== 3) continue;
      const wings = PEERS[p].filter(i => !g[i] && popcount(cand[i]) === 2 && (cand[i] & ~cand[p]) === 0);
      for (const x of wings) {
        for (const y of wings) {
          if (y <= x || cand[x] === cand[y]) continue;
          const c = pairOf(cand[x] & cand[y])[0];
          const removals = removalsFor(cand, seenByAll(cand, [p, x, y], c), bit(c));
          if (!removals.length) continue;
          const [a] = pairOf(cand[x] & ~bit(c)), [b] = pairOf(cand[y] & ~bit(c));
          yield step('XYZ-Wing', [c], [p, x, y], removals, onlyThese(cand, [p, x, y]),
            `${capital(cellName(p))} can only be ${list(pairOf(cand[p]), 'or')}. ` +
            `${capital(cellName(x))} can only be ${list(pairOf(cand[x]), 'or')}, ` +
            `and ${cellName(y)} can only be ${list(pairOf(cand[y]), 'or')}. ` +
            `If ${cellName(p)} is ${a}, ${cellName(x)} is ${c}; if it's ${b}, ${cellName(y)} is ${c}; ` +
            `otherwise it's ${c} itself. So ${c} can't go in ${cellList(removals.map(r => r.cell))}, ` +
            `which ${removals.length > 1 ? 'see' : 'sees'} all three.`);
        }
      }
    }
  }

  function* eachWWing(g, cand) {
    const bivalue = [...Array(81).keys()].filter(i => !g[i] && popcount(cand[i]) === 2);
    for (const A of bivalue) {
      for (const B of bivalue) {
        if (B <= A || cand[A] !== cand[B] || sees(A, B)) continue;
        for (const [a, b] of [pairOf(cand[A]), pairOf(cand[A]).reverse()]) {
          for (let u = 0; u < 27; u++) {
            const spots = UNITS[u].filter(i => cand[i] & bit(a));
            if (spots.length !== 2 || spots.includes(A) || spots.includes(B)) continue;
            for (const [s1, s2] of [spots, [...spots].reverse()]) {
              if (!sees(s1, A) || !sees(s2, B)) continue;
              const removals = removalsFor(cand, seenByAll(cand, [A, B], b), bit(b));
              if (!removals.length) continue;
              yield step('W-Wing', [b], [A, B, s1, s2], removals,
                [...onlyThese(cand, [A, B]), { cells: UNITS[u].filter(i => !spots.includes(i)), mask: bit(a) }],
                `${capital(cellName(A))} and ${cellName(B)} can both only be ${a} or ${b}. ` +
                `In ${unitName(u)}, ${a} can only go in ${placeIn(u, s1)} or ${placeIn(u, s2)}. ` +
                `If ${cellName(A)} were ${a}, ${cellName(s1)} couldn't be, so ${cellName(s2)} would be ${a} ` +
                `and ${cellName(B)} would be ${b}. So one of the two is ${b}, and ${b} can't go in ` +
                `${cellList(removals.map(r => r.cell))}, which ${removals.length > 1 ? 'see' : 'sees'} both.`,
                UNITS[u]);
            }
          }
        }
      }
    }
  }

  // Unique rectangle type 1: relies on the puzzle having one solution.
  function* eachUniqueRectangle(g, cand) {
    for (let r1 = 0; r1 < 9; r1++) for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 9; c1++) for (let c2 = c1 + 1; c2 < 9; c2++) {
        const corners = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
        if (corners.some(i => g[i]) || new Set(corners.map(i => BOX[i])).size !== 2) continue;
        for (const extra of corners) {
          const others = corners.filter(i => i !== extra);
          const pair = cand[others[0]];
          if (popcount(pair) !== 2 || others.some(i => cand[i] !== pair) || (cand[extra] & pair) !== pair) continue;
          if (cand[extra] === pair) continue;
          const [a, b] = pairOf(pair);
          yield step('Unique Rectangle', [a, b], corners, [{ cell: extra, mask: pair }], onlyThese(cand, others),
            `${capital(cellList(others))} can only be ${a} or ${b}. If ${cellName(extra)} were ${a} or ${b} ` +
            `too, these four cells could swap their ${a}s and ${b}s and the puzzle would have two solutions. ` +
            `A proper sudoku has only one, so ${cellName(extra)} can't be ${a} or ${b}.`);
        }
      }
    }
  }

  // XY-Chain: a chain of two-candidate cells, each seeing the next.
  // XY-Chains: chains of two-candidate cells, each seeing the next, shortest
  // first (up to maxLength cells, and at most `limit` chains).
  function* eachXYChain(g, cand, maxLength = 8, limit = 200) {
    const bivalue = [...Array(81).keys()].filter(i => !g[i] && popcount(cand[i]) === 2);
    const found = [];
    for (const start of bivalue) {
      for (const x of pairOf(cand[start])) {
        // `forced[k]` is the digit chain[k] must be if the start isn't x.
        const walk = (chain, forced) => {
          if (found.length >= limit) return;
          const last = chain[chain.length - 1];
          if (chain.length >= 3 && forced[forced.length - 1] === x) {
            const removals = removalsFor(cand, seenByAll(cand, [start, last], x, chain), bit(x));
            if (removals.length) found.push({ chain: chain.slice(), forced: forced.slice(), x, removals });
            return;
          }
          if (chain.length >= maxLength) return;
          const d = forced[forced.length - 1];
          for (const next of bivalue) {
            if (chain.includes(next) || !sees(last, next) || !(cand[next] & bit(d))) continue;
            chain.push(next); forced.push(pairOf(cand[next] & ~bit(d))[0]);
            walk(chain, forced);
            chain.pop(); forced.pop();
          }
        };
        walk([start], [pairOf(cand[start] & ~bit(x))[0]]);
      }
    }
    found.sort((a, b) => a.chain.length - b.chain.length);
    for (const { chain, forced, x, removals } of found) {
      const end = chain[chain.length - 1];
      const links = chain.slice(1).map((c, k) => `${cellName(c)} is ${forced[k + 1]}`);
      yield step('XY-Chain', [x], chain, removals, onlyThese(cand, chain),
        `These cells each have only two candidates, and each sees the next: ${cellList(chain)}. ` +
        `If ${cellName(chain[0])} isn't ${x}, it's ${forced[0]}; then ${list(links)}. ` +
        `So ${cellName(chain[0])} or ${cellName(end)} is ${x}, and ${x} can't go in ` +
        `${cellList(removals.map(r => r.cell))}, which ${removals.length > 1 ? 'see' : 'sees'} both.`);
    }
  }

  /*
   * "What if" chain: assumes a digit and follows singles until something
   * becomes impossible. Tries two-candidate cells first and keeps the
   * shortest chain. `start` (the candidates on the player's board) tells
   * whether the chain stands alone or needs the steps before it.
   */
  // Shortest chains first: those of up to 6 steps, then (only if there are
  // none) up to maxSteps.
  function* eachContradiction(g, cand, maxSteps = 12) {
    for (const limit of [6, maxSteps]) {
      const found = [];
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        for (const d of pairOf(cand[i])) {
          const result = propagate(g, cand, i, d, limit);
          if (result) found.push({ cell: i, digit: d, length: result.chain.length });
        }
      }
      found.sort((a, b) => a.length - b.length || popcount(cand[a.cell]) - popcount(cand[b.cell]));
      for (const { cell, digit } of found) yield contradictionStep(g, cand, cell, digit, maxSteps);
      if (found.length) return;
    }
  }

  /*
   * A "what if" chain found after earlier eliminations may need only some of
   * them. Drops each earlier step whose removals the contradiction doesn't
   * need, then explains the chain from the candidates that remain, relying on
   * exactly the removals of the steps it keeps.
   */
  function withMinimalPremises(g, start, eliminations, whatIf) {
    const kept = eliminations.slice();
    const stateWithout = skip => {
      const cand = Uint16Array.from(start);
      kept.forEach((e, k) => { if (k !== skip) applyRemovals(cand, e.removals); });
      return cand;
    };
    for (let k = kept.length - 1; k >= 0; k--) {
      if (propagate(g, stateWithout(k), whatIf.cell, whatIf.digit, 12)) kept.splice(k, 1);
    }
    const explained = contradictionStep(g, stateWithout(-1), whatIf.cell, whatIf.digit);
    return { ...explained, relies: kept.flatMap(e => e.removals.map(r => ({ cells: [r.cell], mask: r.mask }))) };
  }

  // Describes the assumption `cell = digit` failing, as it plays out from `cand`.
  function contradictionStep(g, cand, cell, d, maxSteps = 12) {
    const { chain, problem } = propagate(g, cand, cell, d, maxSteps);
    const text = [`Suppose ${cellName(cell)} were ${d}.`]
      .concat(chain.map(c => (c.unit === null
        ? `Then ${cellName(c.cell)} would have to be ${c.digit}, the only digit left there.`
        : `Then ${c.digit} would have to go in ${cellName(c.cell)}, the only place left in ${unitName(c.unit)}.`)))
      .concat(problem.unit === undefined
        ? `But then ${cellName(problem.cell)} would have no digit left.`
        : `But then ${unitName(problem.unit)} would have nowhere left for ${problem.digit}.`)
      .concat(`So ${cellName(cell)} can't be ${d}.`)
      .join(' ');
    const result = step('What-if chain', [d], [cell, ...chain.map(c => c.cell)], [{ cell, mask: bit(d) }],
      [], text, problem.unit === undefined ? [problem.cell] : UNITS[problem.unit]);
    return { ...result, chainLength: chain.length, cell, digit: d };
  }

  // Places d in cell i and follows singles; returns { chain, problem } on a
  // contradiction within maxSteps placements, or null.
  function propagate(g0, cand0, i, d, maxSteps) {
    const g = Array.from(g0), cand = Uint16Array.from(cand0);
    place(g, cand, i, d);
    const chain = [];
    for (;;) {
      for (let k = 0; k < 81; k++) if (!g[k] && !cand[k]) return { chain, problem: { cell: k } };
      for (let u = 0; u < 27; u++) {
        let covered = 0; // digits placed in the unit or still possible in it
        for (const k of UNITS[u]) covered |= g[k] ? bit(g[k]) : cand[k];
        if (covered !== ALL) return { chain, problem: { unit: u, digit: bitToDigit((ALL & ~covered) & -(ALL & ~covered)) } };
      }
      if (chain.length >= maxSteps) return null;
      const single = findSingle(g, cand);
      if (!single) return null;
      chain.push(single);
      place(g, cand, single.cell, single.digit);
    }
  }

  // Every elimination technique hints may use, simplest first.
  const HINT_TECHNIQUES = [
    eachLocked,
    eachSubset,
    (g, c) => eachFish(g, c, 2),
    eachSingleDigitChain,
    eachXYWing,
    (g, c) => eachFish(g, c, 3),
    eachXYZWing,
    eachWWing,
    eachUniqueRectangle,
    eachXYChain,
    (g, c) => eachFish(g, c, 4),
  ];

  /*
   * Picks the next elimination for a hint. Prefers, in order: a named
   * technique that leads straight to a placement; a short "what if" chain
   * that does; the simplest named technique; any "what if" chain.
   */
  function nextElimination(g, cand, whatIf = true, limit = 500) {
    const leadsToPlacement = step => {
      const next = Uint16Array.from(cand);
      applyRemovals(next, step.removals);
      return Boolean(findSingle(g, next));
    };
    let fallback = null, seen = 0;
    search: for (const technique of HINT_TECHNIQUES) {
      for (const step of technique(g, cand)) {
        fallback = fallback || step;
        if (leadsToPlacement(step)) return step;
        if (++seen >= limit) break search;
      }
    }
    if (!whatIf) return fallback;
    let firstWhatIf = null;
    for (const step of eachContradiction(g, cand)) {
      firstWhatIf = firstWhatIf || step;
      if (step.chainLength > 6) break;
      if (leadsToPlacement(step)) return step;
    }
    return fallback || firstWhatIf;
  }

  // ---- Hints -----------------------------------------------------------------

  // Adds wording, highlights and premises to a pointing/box-line/subset step.
  function withDetails(s) {
    if (s.text) return s;
    const others = UNITS[s.unit].filter(i => !s.pattern.includes(i));
    const mask = s.digits.reduce((m, d) => m | bit(d), 0);
    return {
      ...s,
      text: explainElimination(s),
      key: s.pattern,
      area: [...new Set([...UNITS[s.unit], ...UNITS[s.target]])],
      relies: s.technique.startsWith('Naked')
        ? [{ cells: s.pattern, mask: ALL & ~mask }] // limited to those digits
        : [{ cells: others, mask }],                 // the digits absent from the rest of the unit
    };
  }

  /*
   * Finds a next move for the board `values` (0 = empty). Returns one of:
   *   { type: 'wrong', cell, digit }         a placed digit is wrong
   *   { type: 'move', cell, digit, single, steps }
   *        `single` is the placement; `steps` are the eliminations it needs
   *   { type: 'reveal', cell, digit }        no technique here finds a move
   * or null when the board is full and correct.
   */
  function findHint(values, solution) {
    const wrong = values.findIndex((v, i) => v && v !== solution[i]);
    if (wrong >= 0) return { type: 'wrong', cell: wrong, digit: values[wrong] };
    if (values.every(v => v)) return null;

    // Named techniques read better than "what if" chains, so use them alone
    // when that gives a short hint; otherwise take the shorter explanation.
    const named = explainNextMove(values, false);
    if (named && named.steps.length <= 3) return named;
    const mixed = explainNextMove(values, true);
    const best = [named, mixed].filter(Boolean).sort((a, b) => a.steps.length - b.steps.length)[0];
    if (best) return best;

    // Beyond these techniques: reveal the most constrained empty cell.
    const start = candidatesFor(values);
    let cell = -1;
    for (let i = 0; i < 81; i++) {
      if (!values[i] && (cell < 0 || popcount(start[i]) < popcount(start[cell]))) cell = i;
    }
    return { type: 'reveal', cell, digit: solution[cell] };
  }

  /*
   * Eliminates until a placement appears, then keeps only the steps it
   * depends on. Returns { type: 'move', cell, digit, single, steps } or null
   * when stuck. `whatIf` allows "what if" chains.
   */
  function explainNextMove(values, whatIf) {
    const g = Array.from(values);
    const cand = candidatesFor(g);
    const start = Uint16Array.from(cand);
    const eliminations = [];
    for (;;) {
      const single = findSingle(g, cand);
      if (single) {
        return {
          type: 'move', cell: single.cell, digit: single.digit, single,
          steps: neededSteps(eliminations, single),
        };
      }
      let step = nextElimination(g, cand, whatIf);
      if (!step) return null;
      if (step.technique === 'What-if chain') step = withMinimalPremises(g, start, eliminations, step);
      applyRemovals(cand, step.removals);
      eliminations.push(withDetails(step));
    }
  }

  /*
   * Keeps only the eliminations the placement depends on. `needs` maps each
   * cell to the candidates whose removal a kept step (or the placement) relies
   * on; working backwards, a step is kept if it removed one of those, and then
   * adds what its own reasoning relies on.
   */
  function neededSteps(eliminations, single) {
    const needs = new Map();
    const need = (cells, mask) => { for (const i of cells) needs.set(i, (needs.get(i) || 0) | mask); };

    if (single.unit === null) need([single.cell], ALL & ~bit(single.digit)); // the other digits
    else need(UNITS[single.unit].filter(i => i !== single.cell), bit(single.digit)); // the digit elsewhere

    const kept = [];
    for (let k = eliminations.length - 1; k >= 0; k--) {
      const step = eliminations[k];
      if (!step.removals.some(r => (needs.get(r.cell) || 0) & r.mask)) continue;
      kept.unshift(step);
      for (const { cells, mask } of step.relies) need(cells, mask);
    }
    return kept;
  }

  // ---- Hint wording ----------------------------------------------------------

  const BOX_NAMES = ['top-left', 'top-middle', 'top-right', 'middle-left', 'center',
    'middle-right', 'bottom-left', 'bottom-middle', 'bottom-right'];

  const cellName = i => `row ${ROW[i] + 1}, column ${COL[i] + 1}`;

  function unitName(u) {
    if (u < 9) return `row ${u + 1}`;
    if (u < 18) return `column ${u - 8}`;
    return `the ${BOX_NAMES[u - 18]} box`;
  }

  function list(items, joiner = 'and') {
    const a = items.map(String);
    return a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} ${joiner} ${a[a.length - 1]}`;
  }

  // Names cells briefly when they share a unit, e.g. "columns 3 and 7".
  function cellsIn(u, cells) {
    if (u < 9) return `columns ${list(cells.map(i => COL[i] + 1))}`;
    if (u < 18) return `rows ${list(cells.map(i => ROW[i] + 1))}`;
    return cellList(cells);
  }

  function explainElimination(step) {
    const [d] = step.digits;
    const inUnit = unitName(step.unit), inTarget = unitName(step.target);
    switch (step.technique) {
      case 'Pointing pair':
      case 'Pointing triple':
        return `In ${inUnit}, ${d} can only go in ${inTarget}. So ${d} can't go anywhere else in ${inTarget}.`;
      case 'Box/line reduction':
        return `In ${inUnit}, ${d} can only go in cells inside ${inTarget}. So ${d} can't go anywhere else in ${inTarget}.`;
      case 'Naked pair':
      case 'Naked triple':
        return `In ${inUnit}, ${cellsIn(step.unit, step.pattern)} can only hold ${list(step.digits)}, ` +
          `so those digits must go there. No other cell in ${inUnit} can be ${list(step.digits, 'or')}.`;
      default: // hidden pair/triple
        return `In ${inUnit}, ${list(step.digits)} can only go in ${cellsIn(step.unit, step.pattern)}. ` +
          `So those cells can't hold any other digit.`;
    }
  }

  // Where a cell sits within a unit: "column 9" in a row, "row 5" in a column.
  const placeIn = (u, i) => (u < 9 ? `column ${COL[i] + 1}` : u < 18 ? `row ${ROW[i] + 1}` : cellName(i));

  // Where the other cells of a unit already see a digit.
  const seenFrom = u => (u < 9 ? 'column or box' : u < 18 ? 'row or box' : 'row or column');

  function explainSingle(single, values, afterSteps) {
    const { cell, digit: d, unit } = single;
    if (unit !== null) {
      return afterSteps
        ? `Now ${d} can only go in one place in ${unitName(unit)}: ${placeIn(unit, cell)}.`
        : `In ${unitName(unit)}, ${d} can only go in one place: ${placeIn(unit, cell)}. ` +
          `Every other empty cell there already has a ${d} in its ${seenFrom(unit)}.`;
    }
    if (afterSteps) return `Now ${cellName(cell)} can only be ${d}.`;
    const seen = new Set(PEERS[cell].map(p => values[p]).filter(Boolean));
    const others = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => n !== d && seen.has(n));
    return `${cellName(cell)[0].toUpperCase()}${cellName(cell).slice(1)} can only be ${d}: ` +
      `${list(others)} are already in its row, column or box.`;
  }

  /*
   * Turns a hint into { title, steps: [{ text, area, key }], cell, digit }.
   * `area` cells give context (the units involved), `key` cells are the ones
   * the reasoning is about. The last step places `digit` in `cell`.
   */
  function explainHint(hint, values) {
    if (hint.type === 'wrong') {
      return {
        title: 'Wrong digit', cell: hint.cell, digit: null,
        steps: [{
          text: `The ${hint.digit} in ${cellName(hint.cell)} is wrong. Erase it before looking for the next move.`,
          area: [], key: [hint.cell],
        }],
      };
    }
    if (hint.type === 'reveal') {
      return {
        title: 'A digit to get you going', cell: hint.cell, digit: hint.digit,
        steps: [{
          text: `The next move here needs a more advanced technique than hints can explain. ` +
            `To keep you going: ${cellName(hint.cell)} is ${hint.digit}.`,
          area: [], key: [hint.cell],
        }],
      };
    }
    const { single, steps } = hint;
    const explained = steps.map(({ text, area, key }) => ({ text, area, key }));
    explained.push({
      text: explainSingle(single, values, steps.length > 0),
      area: single.unit === null ? [] : UNITS[single.unit],
      key: [single.cell],
    });
    const techniques = [...new Set(steps.map(s => s.technique)), single.technique];
    return { title: list(techniques), cell: single.cell, digit: single.digit, steps: explained };
  }

  // ---- Generator -----------------------------------------------------------

  /*
   * Each difficulty sets how far to dig, which solving techniques the
   * puzzle may need (see docs/05-difficulty-grading.md), and how many
   * wrong digits the player may enter before losing.
   */
  const DIFFICULTIES = {
    easy:   { label: 'Easy',   maxMistakes: 5, targetClues: 38, accept: r => r.solved && r.hardest <= LEVEL.SINGLES },
    medium: { label: 'Medium', maxMistakes: 5, targetClues: 31, accept: r => r.solved && r.hardest <= LEVEL.SINGLES },
    hard:   { label: 'Hard',   maxMistakes: 3, targetClues: 0,  accept: r => r.solved && r.hardest >= LEVEL.LOCKED },
    expert: { label: 'Expert', maxMistakes: 3, targetClues: 0,  accept: r => !r.solved },
  };

  // Removes clues in random order, keeping the solution unique.
  function dig(solution, targetClues) {
    const puzzle = solution.slice();
    let clues = 81;
    for (const i of shuffle([...Array(81).keys()])) {
      if (clues <= targetClues) break;
      const saved = puzzle[i];
      puzzle[i] = 0;
      if (countSolutions(puzzle) === 1) clues--;
      else puzzle[i] = saved;
    }
    return puzzle;
  }

  /*
   * Returns { puzzle, solution, difficulty }. Retries until the puzzle's
   * grade matches; after `maxAttempts` it returns the last candidate.
   */
  function generate(difficulty = 'easy', maxAttempts = 300) {
    const spec = DIFFICULTIES[difficulty];
    if (!spec) throw new Error(`Unknown difficulty: ${difficulty}`);
    let puzzle, solution;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      solution = randomSolvedGrid();
      puzzle = dig(solution, spec.targetClues);
      if (spec.accept(logicalSolve(puzzle))) break;
    }
    return { puzzle, solution, difficulty };
  }

  const Sudoku = {
    ROW, COL, BOX, UNITS, PEERS, DIFFICULTIES, LEVEL,
    parse, format, canPlace, countSolutions, solve, randomSolvedGrid,
    logicalSolve, dig, generate, findHint, explainHint,
  };

  if (typeof module === 'object' && module.exports) module.exports = Sudoku;
  else root.Sudoku = Sudoku;
})(typeof self !== 'undefined' ? self : this);
