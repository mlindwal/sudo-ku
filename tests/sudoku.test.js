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
