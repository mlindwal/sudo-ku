# 2. Grid Representation

## Flat array of 81 cells

The simplest representation is a one-dimensional array of 81 numbers, filled
row by row. `0` marks an empty cell.

```js
const grid = new Array(81).fill(0);
```

A flat array is easy to copy (`grid.slice()`), easy to serialize, and lets one
loop visit every cell.

## Index arithmetic

For a cell index `i` from 0 to 80:

```js
const row = Math.floor(i / 9);
const col = i % 9;
const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
const index = row * 9 + col;             // back from (row, col) to i
```

The top-left cell of the box containing `(row, col)` is:

```js
const boxRow = row - (row % 3);
const boxCol = col - (col % 3);
```

## Checking a placement

A digit `n` can go in cell `i` if no peer already holds it:

```js
function canPlace(g, i, n) {
  const r = Math.floor(i / 9), c = i % 9;
  const br = r - (r % 3), bc = c - (c % 3);
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === n) return false;                                   // row
    if (g[k * 9 + c] === n) return false;                                   // column
    if (g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === n) return false; // box
  }
  return true;
}
```

Call this only on empty cells: if `g[i]` already holds `n`, the row check finds
it and returns `false`.

## Precomputed peers

The generator checks placements millions of times, so it helps to precompute
each cell's 20 peers once:

```js
const PEERS = Array.from({ length: 81 }, (_, i) => {
  const r = Math.floor(i / 9), c = i % 9;
  const br = r - (r % 3), bc = c - (c % 3);
  const set = new Set();
  for (let k = 0; k < 9; k++) {
    set.add(r * 9 + k);
    set.add(k * 9 + c);
    set.add((br + Math.floor(k / 3)) * 9 + bc + (k % 3));
  }
  set.delete(i);
  return [...set];
});
```

## Bitmask candidates

For speed, track which digits each row, column, and box already uses as a
9-bit number. Bit `n - 1` is set when digit `n` is present.

```js
const rows = new Array(9).fill(0);
const cols = new Array(9).fill(0);
const boxes = new Array(9).fill(0);

// The digits still allowed in cell (r, c):
const used = rows[r] | cols[c] | boxes[b];
const candidates = ~used & 0x1ff;
```

Placing digit `n` sets bit `1 << (n - 1)` in all three masks; clearing it
unsets that bit. See [Performance](06-performance.md) for how this speeds up
the solver.

## Text format for storage and tests

For fixtures, saved games, and sharing, use an 81-character string read row
by row, with `.` or `0` for empty cells:

```
53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79
```

```js
const parse = s => [...s].map(ch => (ch === '.' ? 0 : Number(ch)));
const format = g => g.map(n => (n === 0 ? '.' : n)).join('');
```

This format is widely used by Sudoku tools, so puzzle collections can be
imported for testing.

---
Previous: [Sudoku fundamentals](01-sudoku-fundamentals.md) ·
Next: [Generating a solved grid](03-generating-a-solved-grid.md)
