# 3. Generating a Solved Grid

Every puzzle starts as a complete, valid grid. There are two practical ways to
make one: search for it with randomized backtracking, or transform a grid you
already have.

## Approach A: randomized backtracking

Backtracking fills cells one at a time and undoes choices that lead to a dead
end. Trying digits in a **random order** is what makes each grid different.

1. Find the first empty cell. If there is none, the grid is complete.
2. Shuffle the digits 1–9.
3. For each digit that can legally go in the cell, place it and recurse.
4. If the recursion succeeds, stop. If not, clear the cell and try the next
   digit.
5. If no digit works, return failure so the caller backtracks.

```js
const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function fill(g) {
  const i = g.indexOf(0);
  if (i === -1) return true;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (canPlace(g, i, n)) {       // see Grid representation
      g[i] = n;
      if (fill(g)) return true;
      g[i] = 0;
    }
  }
  return false;
}

const solution = new Array(81).fill(0);
fill(solution);
```

Starting from an empty board, this almost never backtracks much, because the
board has so many valid completions. It typically finishes in well under a
millisecond.

The shuffle is the Fisher–Yates algorithm. Avoid `array.sort(() =>
Math.random() - 0.5)`, which gives a biased order.

### Optional speed-up: seed the diagonal boxes

Boxes 0, 4, and 8 share no rows or columns, so each can be filled with a
shuffled 1–9 independently. Filling those three first leaves the backtracker
less work. It is rarely needed for 9×9, but helps for larger grids.

## Approach B: transform an existing grid

Some changes to a valid grid always produce another valid grid:

| Transformation | Number of variations |
|---|---|
| Relabel the digits (e.g. swap every 3 with every 7) | 9! = 362,880 |
| Swap rows within a band | 3! per band |
| Swap whole bands | 3! |
| Swap columns within a stack | 3! per stack |
| Swap whole stacks | 3! |
| Transpose (reflect across the main diagonal) | 2 |

Applying random transformations to one seed grid gives billions of
different-looking grids with no search at all. The same transformations can
be applied to a finished **puzzle**: the result is still proper and just as
difficult, because solving it takes the same logical steps.

```js
function relabel(g) {
  const map = [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])];
  return g.map(n => map[n]);  // 0 stays 0
}

function transpose(g) {
  return g.map((_, i) => g[(i % 9) * 9 + Math.floor(i / 9)]);
}
```

**Limitation:** all grids made this way are equivalent to the seed grid, so
they cover only a tiny part of the roughly 5.47 billion essentially different
grids. Players are unlikely to notice, but a generator that relies only on
this has less real variety.

## Which to use

Use **backtracking** as the main method, since it can produce any valid grid.
Use **transformations** when you need many puzzles quickly: generate a pool
of good puzzles offline, then transform them at runtime to make them look
new.

---
Previous: [Grid representation](02-grid-representation.md) ·
Next: [Removing clues](04-removing-clues.md)
