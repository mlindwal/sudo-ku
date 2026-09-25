/*
 * Sudoku engine: grid helpers, solver, generator and difficulty grader.
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

  // ---- Logical (human-style) solver for grading ----------------------------

  const LEVEL = { SINGLES: 1, LOCKED: 2, SUBSETS: 3 };

  /*
   * Solves using only human techniques, simplest first.
   * Returns { solved, hardest } where `hardest` is the highest LEVEL used.
   */
  function logicalSolve(grid) {
    const g = Array.from(grid);
    const cand = new Uint16Array(81);
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      let used = 0;
      for (const p of PEERS[i]) if (g[p]) used |= 1 << (g[p] - 1);
      cand[i] = ~used & ALL;
    }

    function place(i, d) {
      g[i] = d;
      cand[i] = 0;
      for (const p of PEERS[i]) cand[p] &= ~(1 << (d - 1));
    }

    function eliminate(cells, mask) {
      let changed = false;
      for (const i of cells) {
        if (cand[i] & mask) { cand[i] &= ~mask; changed = true; }
      }
      return changed;
    }

    function singles() {
      for (let i = 0; i < 81; i++) {
        if (!g[i] && popcount(cand[i]) === 1) { place(i, bitToDigit(cand[i])); return true; }
      }
      for (const unit of UNITS) {
        for (let d = 1; d <= 9; d++) {
          const bit = 1 << (d - 1);
          let spot = -1, n = 0;
          for (const i of unit) if (cand[i] & bit) { spot = i; n++; }
          if (n === 1) { place(spot, d); return true; }
        }
      }
      return false;
    }

    // Pointing pairs/triples and box/line reduction.
    function locked() {
      for (let u = 0; u < 27; u++) {
        const unit = UNITS[u];
        for (let d = 1; d <= 9; d++) {
          const bit = 1 << (d - 1);
          const cells = unit.filter(i => cand[i] & bit);
          if (cells.length < 2) continue;
          if (u >= 18) {            // box: all in one row or column?
            if (cells.every(i => ROW[i] === ROW[cells[0]])) {
              const others = UNITS[ROW[cells[0]]].filter(i => BOX[i] !== u - 18);
              if (eliminate(others, bit)) return true;
            }
            if (cells.every(i => COL[i] === COL[cells[0]])) {
              const others = UNITS[9 + COL[cells[0]]].filter(i => BOX[i] !== u - 18);
              if (eliminate(others, bit)) return true;
            }
          } else if (cells.every(i => BOX[i] === BOX[cells[0]])) {  // line: all in one box?
            const others = UNITS[18 + BOX[cells[0]]].filter(i => !unit.includes(i));
            if (eliminate(others, bit)) return true;
          }
        }
      }
      return false;
    }

    // Naked and hidden pairs/triples.
    function subsets() {
      for (const unit of UNITS) {
        const empty = unit.filter(i => !g[i]);
        for (const size of [2, 3]) {
          for (const combo of combinations(empty, size)) {
            let union = 0;
            for (const i of combo) union |= cand[i];
            if (popcount(union) === size) {
              const others = empty.filter(i => !combo.includes(i));
              if (eliminate(others, union)) return true;
            }
          }
          const digits = [];
          for (let d = 1; d <= 9; d++) if (empty.some(i => cand[i] & (1 << (d - 1)))) digits.push(d);
          for (const combo of combinations(digits, size)) {
            const mask = combo.reduce((m, d) => m | (1 << (d - 1)), 0);
            const cells = empty.filter(i => cand[i] & mask);
            if (cells.length === size) {
              let changed = false;
              for (const i of cells) {
                if (cand[i] & ~mask) { cand[i] &= mask; changed = true; }
              }
              if (changed) return true;
            }
          }
        }
      }
      return false;
    }

    let hardest = 0;
    for (;;) {
      if (g.every(v => v)) return { solved: true, hardest };
      if (singles()) { hardest = Math.max(hardest, LEVEL.SINGLES); continue; }
      if (locked()) { hardest = Math.max(hardest, LEVEL.LOCKED); continue; }
      if (subsets()) { hardest = Math.max(hardest, LEVEL.SUBSETS); continue; }
      return { solved: false, hardest };
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

  // ---- Generator -----------------------------------------------------------

  /*
   * Each difficulty sets how far to dig and which solving techniques the
   * puzzle may need (see docs/05-difficulty-grading.md).
   */
  const DIFFICULTIES = {
    easy:   { label: 'Easy',   targetClues: 38, accept: r => r.solved && r.hardest <= LEVEL.SINGLES },
    medium: { label: 'Medium', targetClues: 31, accept: r => r.solved && r.hardest <= LEVEL.SINGLES },
    hard:   { label: 'Hard',   targetClues: 0,  accept: r => r.solved && r.hardest >= LEVEL.LOCKED },
    expert: { label: 'Expert', targetClues: 0,  accept: r => !r.solved },
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
    logicalSolve, dig, generate,
  };

  if (typeof module === 'object' && module.exports) module.exports = Sudoku;
  else root.Sudoku = Sudoku;
})(typeof self !== 'undefined' ? self : this);
