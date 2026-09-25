const test = require('node:test');
const assert = require('node:assert/strict');
const Sudoku = require('../js/sudoku.js');

// A well-known puzzle with a unique solution.
const PUZZLE = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

function isValidSolution(g) {
  return g.length === 81 && Sudoku.UNITS.every(unit =>
    unit.map(i => g[i]).sort().join('') === '123456789');
}

test('parse and format round-trip', () => {
  assert.equal(Sudoku.format(Sudoku.parse(PUZZLE)), PUZZLE);
  assert.throws(() => Sudoku.parse('123'));
});

test('geometry: every cell has 20 peers and there are 27 units', () => {
  assert.equal(Sudoku.UNITS.length, 27);
  assert.ok(Sudoku.PEERS.every(p => p.length === 20));
});

test('solve finds the known solution', () => {
  assert.equal(Sudoku.format(Sudoku.solve(Sudoku.parse(PUZZLE))), SOLUTION);
});

test('countSolutions detects unique, multiple and impossible puzzles', () => {
  assert.equal(Sudoku.countSolutions(Sudoku.parse(PUZZLE)), 1);
  assert.equal(Sudoku.countSolutions(new Array(81).fill(0)), 2);
  const broken = Sudoku.parse(PUZZLE);
  broken[2] = 5; // duplicate 5 in row 0
  assert.equal(Sudoku.countSolutions(broken), 0);
});

test('countSolutions does not modify its input', () => {
  const g = Sudoku.parse(PUZZLE);
  Sudoku.countSolutions(g);
  assert.equal(Sudoku.format(g), PUZZLE);
});

test('randomSolvedGrid returns valid, varied grids', () => {
  const a = Sudoku.randomSolvedGrid();
  const b = Sudoku.randomSolvedGrid();
  assert.ok(isValidSolution(a));
  assert.ok(isValidSolution(b));
  assert.notDeepEqual(a, b);
});

test('logicalSolve solves an easy puzzle with singles', () => {
  const result = Sudoku.logicalSolve(Sudoku.parse(PUZZLE));
  assert.deepEqual(result, { solved: true, hardest: Sudoku.LEVEL.SINGLES });
});

for (const difficulty of Object.keys(Sudoku.DIFFICULTIES)) {
  test(`generate(${difficulty}) makes proper puzzles of that difficulty`, () => {
    for (let k = 0; k < 5; k++) {
      const { puzzle, solution } = Sudoku.generate(difficulty);
      assert.ok(isValidSolution(solution));
      assert.ok(puzzle.every((v, i) => v === 0 || v === solution[i]), 'clues match the solution');
      assert.equal(Sudoku.countSolutions(puzzle), 1, 'solution is unique');
      assert.ok(Sudoku.DIFFICULTIES[difficulty].accept(Sudoku.logicalSolve(puzzle)));
    }
  });
}

test('generate rejects unknown difficulties', () => {
  assert.throws(() => Sudoku.generate('impossible'));
});

test('mistake limits: 5 for easy and medium, 3 for hard and expert', () => {
  const limits = Object.fromEntries(
    Object.entries(Sudoku.DIFFICULTIES).map(([key, spec]) => [key, spec.maxMistakes]));
  assert.deepEqual(limits, { easy: 5, medium: 5, hard: 3, expert: 3 });
});

// ---- Hints ------------------------------------------------------------------

const bit = d => 1 << (d - 1);

function candidates(values) {
  return values.map((v, i) => {
    if (v) return 0;
    let used = 0;
    for (const p of Sudoku.PEERS[i]) if (values[p]) used |= bit(values[p]);
    return ~used & 0x1ff;
  });
}

// Replays a hint's own steps from the player's board: each step's premises
// (the candidates it relies on being absent) must hold given only the steps
// before it, no step may rule out the true digit, and together they must lead
// to the move.
function checkHintStandsAlone(values, solution, hint) {
  const cand = candidates(values);
  for (const step of hint.steps) {
    for (const { cells, mask } of step.relies) {
      assert.ok(cells.every(i => (cand[i] & mask) === 0), `${step.technique}: premises hold`);
    }
    for (const { cell, mask } of step.removals) {
      assert.equal(mask & bit(solution[cell]), 0, `${step.technique}: never rules out the true digit`);
      cand[cell] &= ~mask;
    }
    assert.ok(step.text.length > 20, 'every step is explained');
  }
  const { single } = hint;
  if (single.unit === null) {
    assert.equal(cand[single.cell], bit(single.digit), 'naked single follows from the steps');
  } else {
    const spots = Sudoku.UNITS[single.unit].filter(i => cand[i] & bit(single.digit));
    assert.deepEqual(spots, [single.cell], 'hidden single follows from the steps');
  }
}

test('following hints solves puzzles of every level correctly', () => {
  for (const difficulty of Object.keys(Sudoku.DIFFICULTIES)) {
    for (let k = 0; k < 6; k++) {
      const { puzzle, solution } = Sudoku.generate(difficulty);
      const values = puzzle.slice();
      for (let guard = 0; guard < 81; guard++) {
        const hint = Sudoku.findHint(values, solution);
        if (!hint) break;
        assert.notEqual(hint.type, 'wrong');
        assert.equal(values[hint.cell], 0, 'hint targets an empty cell');
        assert.equal(hint.digit, solution[hint.cell], 'hint digit is correct');
        if (hint.type === 'move') checkHintStandsAlone(values, solution, hint);
        const text = Sudoku.explainHint(hint, values);
        assert.ok(text.steps.length > 0 && text.steps.every(s => s.text.length > 20));
        values[hint.cell] = hint.digit;
      }
      assert.deepEqual(values, solution);
    }
  }
});

test('hints point out a wrong digit first', () => {
  const puzzle = Sudoku.parse(PUZZLE), solution = Sudoku.parse(SOLUTION);
  const values = puzzle.slice();
  values[2] = 1; // row 1, column 3 should be 4
  const hint = Sudoku.findHint(values, solution);
  assert.deepEqual(hint, { type: 'wrong', cell: 2, digit: 1 });
  assert.match(Sudoku.explainHint(hint, values).steps[0].text, /The 1 in row 1, column 3 is wrong/);
});

test('hint explanations name units and cells in plain words', () => {
  const values = Sudoku.parse(PUZZLE), solution = Sudoku.parse(SOLUTION);
  const hint = Sudoku.findHint(values, solution);
  const text = Sudoku.explainHint(hint, values);
  assert.equal(text.title, 'Hidden single');
  assert.match(text.steps[0].text, /^In the (top|middle|bottom|center)[-a-z]* box, \d can only go in one place: row \d, column \d\./);
  assert.equal(Sudoku.findHint(solution, solution), null, 'no hint for a solved board');
});

test('hints explain Expert moves with advanced techniques instead of revealing digits', () => {
  // A board a player reached on Expert, where the basic techniques are stuck.
  const values = Sudoku.parse('431.9.562682...79.975.2..847.6.3.8...19.7.4..3485...27.971...45..3.......64..2...');
  const solution = Sudoku.solve(values);
  assert.equal(Sudoku.logicalSolve(values).solved, false, 'basic techniques are stuck here');
  const hint = Sudoku.findHint(values, solution);
  assert.equal(hint.type, 'move');
  assert.ok(hint.steps.length >= 1);
  checkHintStandsAlone(values, solution, hint);

  let reveals = 0;
  for (let k = 0; k < 4; k++) {
    const game = Sudoku.generate('expert');
    const board = game.puzzle.slice();
    for (let guard = 0; guard < 81; guard++) {
      const h = Sudoku.findHint(board, game.solution);
      if (!h) break;
      if (h.type === 'reveal') reveals++;
      if (h.type === 'move') checkHintStandsAlone(board, game.solution, h);
      board[h.cell] = h.digit;
    }
  }
  assert.ok(reveals <= 1, `at most one digit revealed without explanation (got ${reveals})`);
});
