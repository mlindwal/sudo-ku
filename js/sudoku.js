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

  const LEVEL = { SINGLES: 1, LOCKED: 2, SUBSETS: 3 };

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
  function findSingle(g, cand) {
    for (const u of [...Array(9).keys()].map(k => 18 + k).concat([...Array(18).keys()])) {
      for (let d = 1; d <= 9; d++) {
        let spot = -1, n = 0;
        for (const i of UNITS[u]) if (cand[i] & bit(d)) { spot = i; n++; }
        if (n === 1) return { type: 'single', technique: 'Hidden single', cell: spot, digit: d, unit: u };
      }
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
  function findLocked(g, cand) {
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
        if (step) return step;
      }
    }
    return null;
  }

  // Naked and hidden pairs/triples; same shape as findLocked (target = unit).
  function findSubset(g, cand) {
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
            return {
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
            return {
              type: 'eliminate', technique: `Hidden ${suffix}`, level: LEVEL.SUBSETS,
              digits: combo, pattern: cells, unit: u, target: u, removals,
            };
          }
        }
      }
    }
    return null;
  }

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

  // ---- Hints -----------------------------------------------------------------

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
      const step = findLocked(g, cand) || findSubset(g, cand);
      if (!step) break;
      applyRemovals(cand, step.removals);
      eliminations.push(step);
    }

    // Beyond these techniques: reveal the most constrained empty cell.
    let best = -1;
    for (let i = 0; i < 81; i++) {
      if (!g[i] && (best < 0 || popcount(start[i]) < popcount(start[best]))) best = i;
    }
    return { type: 'reveal', cell: best, digit: solution[best] };
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
      const digitsMask = step.digits.reduce((m, d) => m | bit(d), 0);
      const others = UNITS[step.unit].filter(i => !step.pattern.includes(i));
      if (step.technique.startsWith('Naked')) need(step.pattern, ALL & ~digitsMask); // limited to those digits
      else need(others, digitsMask); // the digits absent from the rest of the unit
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
    return list(cells.map(cellName));
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
    const explained = steps.map(step => ({
      text: explainElimination(step),
      area: [...new Set([...UNITS[step.unit], ...UNITS[step.target]])],
      key: step.pattern,
    }));
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
