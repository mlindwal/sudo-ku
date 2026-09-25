# Glossary

**Backtracking**: A search that makes a choice, continues, and undoes the
choice if it leads to a dead end.

**Band**: Three boxes side by side horizontally (rows 0–2, 3–5, or 6–8).

**Box**: One of the nine 3×3 sub-grids. Also called a block or region.

**Candidate**: A digit that could still legally go in an empty cell.

**Clue / given**: A digit filled in at the start of the puzzle.

**Digging**: Removing clues from a solved grid to create a puzzle.

**DLX (Dancing Links)**: Knuth's efficient implementation of Algorithm X for
exact cover problems. See [Performance](06-performance.md).

**Exact cover**: A problem where you choose options so that every constraint
is met exactly once. Sudoku can be written as one.

**Fisher–Yates shuffle**: An algorithm that puts an array in a uniformly
random order.

**MRV (minimum remaining values)**: The heuristic of filling the cell with the
fewest candidates first.

**Minimal puzzle**: A puzzle where removing any single clue would allow more
than one solution.

**Peer**: Any of the 20 cells that share a row, column, or box with a given
cell.

**Proper puzzle**: A puzzle with exactly one solution.

**Stack**: Three boxes stacked vertically (columns 0–2, 3–5, or 6–8).

**Technique**: A logical rule people use to place digits or remove
candidates, such as a hidden single or X-Wing. See
[Difficulty grading](05-difficulty-grading.md).

**Unit**: Any row, column, or box: a group of 9 cells that must contain
1–9 exactly once. There are 27 units.
