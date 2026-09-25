# 6. Performance

Almost all of the generator's time is spent in `countSolutions`, which runs
once for every cell it tries to remove (up to 81 times per puzzle).

As a baseline, the simple solver from [Removing clues](04-removing-clues.md)
took about **0.5 s per minimal puzzle** in Node.js. That is fine for one
puzzle, but noticeable in a browser and far too slow for the
generate-and-retry loops used in [difficulty grading](05-difficulty-grading.md).
These improvements are listed from most to least useful.

## 1. Most-constrained cell first

Instead of filling the first empty cell, fill the empty cell with the
**fewest candidates** (the "minimum remaining values" heuristic). A cell with
one candidate is forced, and a cell with zero candidates reveals a dead end
immediately, so the search tree shrinks dramatically.

```js
function pickCell(g) {
  let best = -1, bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    const count = countCandidates(g, i);
    if (count < bestCount) {
      best = i;
      bestCount = count;
      if (count <= 1) break;  // can't do better
    }
  }
  return best;
}
```

This one change often makes the solver 10–100× faster on hard puzzles.

## 2. Bitmasks for candidates

Keep a 9-bit mask of used digits for each row, column, and box (see
[Grid representation](02-grid-representation.md)). Finding a cell's
candidates becomes one OR and one NOT instead of a 27-cell scan, and counting
them is a bit count:

```js
const bitCount = m => {
  let c = 0;
  while (m) { m &= m - 1; c++; }
  return c;
};
```

## 3. Avoid allocation in hot loops

- Reuse one array and undo changes when backtracking, instead of copying the
  grid at each step.
- Use typed arrays (`Uint8Array(81)`, `Uint16Array(9)`) for the grid and
  masks.

## 4. Dancing Links (DLX)

Sudoku can be rewritten as an **exact cover** problem: choose 81 of the 729
"digit d in cell (r, c)" options so that every one of the 324 constraints is
met exactly once. The 324 constraints are: each cell filled once, and each
digit once per row, per column, and per box. Knuth's Algorithm X, implemented
with Dancing Links, solves exact cover problems very efficiently.

DLX is overkill for a casual 9×9 game, but worth it for larger grids (16×16,
25×25) or for generating very large numbers of puzzles.

## 5. Move work off the main thread

In the browser, a long generation freezes the page. Options:

- Run the generator in a **Web Worker** and post the result back.
- Generate the next puzzle in the background while the player is solving the
  current one.
- Ship a pre-generated pool of puzzles and generate new ones only to top it up.

## Measuring

Measure before optimizing. A simple benchmark:

```js
const t0 = performance.now();
for (let k = 0; k < 100; k++) generate(26);
console.log(`${((performance.now() - t0) / 100).toFixed(1)} ms per puzzle`);
```

Also time the solver on known hard puzzles, such as those in published
"hardest Sudoku" lists. Worst-case times matter more than averages for
avoiding visible freezes.

---
Previous: [Difficulty grading](05-difficulty-grading.md) ·
Next: [Solving techniques](07-solving-techniques.md)
