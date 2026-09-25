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

**Fish**: A pattern for one digit across several rows and columns: X-Wing
(two), Swordfish (three) or Jellyfish (four). See [Solving
techniques](07-solving-techniques.md#fish).

**Fisher–Yates shuffle**: An algorithm that puts an array in a uniformly
random order.

**Minimal puzzle**: A puzzle where removing any single clue would allow more
than one solution.

**MRV (minimum remaining values)**: The heuristic of filling the cell with the
fewest candidates first.

**Peer**: Any of the 20 cells that share a row, column, or box with a given
cell.

**Pivot and pincers**: In a wing, the pivot is a cell that sees both pincers;
whatever the pivot holds, one pincer ends up with the same digit. See
[Wings](07-solving-techniques.md#wings).

**Proper puzzle**: A puzzle with exactly one solution.

**Stack**: Three boxes stacked vertically (columns 0–2, 3–5, or 6–8).

**Strong link**: Two cells that are the only places for a digit in some row,
column or box, so one of them must hold it.

**Subset**: A naked or hidden pair or triple: cells and digits confined to
each other within a unit.

**Technique**: A logical rule people use to place digits or remove
candidates, such as a hidden single or X-Wing. See
[Solving techniques](07-solving-techniques.md).

**Unique rectangle**: Four cells in two rows, two columns and two boxes that
could swap two digits if nothing prevented it; ruled out because a proper
puzzle has one solution.

**Unit**: Any row, column, or box: a group of 9 cells that must contain
1–9 exactly once. There are 27 units.

**What-if chain**: Assuming a digit and following singles until something is
impossible, which proves the digit can't go there.

**XY-Chain**: A chain of two-candidate cells, each seeing the next, that
forces a digit into one of its two ends.
