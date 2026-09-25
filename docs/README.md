# Sudoku Generator Knowledge Base

These notes cover how to design a Sudoku puzzle generator before any game code
is written. Read them in order: each page builds on the one before it.

| # | Page | What it covers |
|---|------|----------------|
| 1 | [Sudoku fundamentals](01-sudoku-fundamentals.md) | Rules, terminology, and what makes a puzzle "proper" |
| 2 | [Grid representation](02-grid-representation.md) | Data structures, indexing, and constraint checks |
| 3 | [Generating a solved grid](03-generating-a-solved-grid.md) | Randomized backtracking and grid transformations |
| 4 | [Removing clues](04-removing-clues.md) | Digging holes while keeping the solution unique |
| 5 | [Difficulty grading](05-difficulty-grading.md) | Measuring and targeting how hard a puzzle is |
| 6 | [Performance](06-performance.md) | Making the solver and generator fast |
| 7 | [Solving techniques](07-solving-techniques.md) | Every technique the hints use, with real examples |
| – | [Glossary](glossary.md) | Definitions of the terms used across these docs |

## The generator in one paragraph

First, build a complete valid 9×9 grid by backtracking with the digits tried in
random order. Then blank out cells one at a time, in random order. After each
removal, run a solver that counts solutions and stops at two. If the puzzle
still has exactly one solution, leave the cell blank; otherwise put the digit
back. Stop when the target number of clues is reached, then grade the result
and keep it only if its difficulty matches what was asked for.

## Conventions

- Code examples use JavaScript, because the game is planned as a web page.
- A grid is a flat array of 81 numbers, where `0` means an empty cell (see
  [Grid representation](02-grid-representation.md)).
- Rows, columns, and boxes are numbered from 0.

## Contributing

Add a new page as `NN-short-title.md`, link it from the table above, and add
any new terms to the [glossary](glossary.md).
