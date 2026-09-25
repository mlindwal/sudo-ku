# 4. Removing Clues

Once there is a solved grid, the generator removes digits ("digs holes") until
it reaches a target clue count. The one rule it must keep is that the puzzle
still has **exactly one solution**.

## Counting solutions

The uniqueness check is a backtracking solver that counts solutions instead
of stopping at the first one. It never needs the exact count, only whether it
is 0, 1, or more than 1, so it stops as soon as it finds a second solution:

```js
function countSolutions(g, limit = 2) {
  const i = g.indexOf(0);
  if (i === -1) return 1;
  let count = 0;
  for (let n = 1; n <= 9 && count < limit; n++) {
    if (canPlace(g, i, n)) {
      g[i] = n;
      count += countSolutions(g, limit - count);
      g[i] = 0;
    }
  }
  return count;
}
```

The function changes `g` while it searches, but every placement is undone,
so the grid is unchanged when the function returns.

## The digging loop

```js
function generate(targetClues = 30) {
  const solution = new Array(81).fill(0);
  fill(solution);                              // see Generating a solved grid
  const puzzle = solution.slice();
  let clues = 81;

  for (const i of shuffle([...Array(81).keys()])) {
    if (clues <= targetClues) break;
    const saved = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle) === 1) clues--;
    else puzzle[i] = saved;                    // made it ambiguous, so restore
  }
  return { puzzle, solution, clues };
}
```

Each cell is tried once, in random order. A removal is kept only if the
solution is still unique.

## Why the loop may stop above the target

After one pass, every remaining clue is one whose removal would make the
solution non-unique: the puzzle is **minimal**. A single random pass usually
stops at about **22–26 clues**. Asking for fewer clues than that does not make
the generator try harder; it just returns the minimal puzzle it found.

To reach lower clue counts:

- Generate many puzzles and keep those with the fewest clues.
- Retry with a different removal order.
- Don't aim for 17–19 clues at runtime: those puzzles are very rare, and
  collections of them are found by large offline searches.

## Symmetric removal

For the classic look of published puzzles, remove cells in pairs that mirror
each other under a 180° rotation: cell `i` and cell `80 - i`.

```js
for (const i of shuffle([...Array(41).keys()])) {   // 0..40; cell 40 is the centre
  const j = 80 - i;
  const a = puzzle[i], b = puzzle[j];
  puzzle[i] = 0;
  puzzle[j] = 0;
  if (countSolutions(puzzle) !== 1) {
    puzzle[i] = a;
    puzzle[j] = b;
  }
}
```

Removing two cells at a time is more likely to break uniqueness, so symmetric
puzzles usually end up with a few more clues.

## Pitfalls

- **Checking against the known solution is not enough.** Seeing that the
  solver finds `solution` again says nothing about whether a second solution
  exists. Always count up to 2.
- **Don't let the checker modify the puzzle.** Pass a copy if the solver
  doesn't restore cells as it backtracks.
- **Removal order matters.** Removing cells in index order instead of random
  order produces puzzles with clues clustered at the bottom of the grid.

---
Previous: [Generating a solved grid](03-generating-a-solved-grid.md) ·
Next: [Difficulty grading](05-difficulty-grading.md)
