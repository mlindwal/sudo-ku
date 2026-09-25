# 1. Sudoku Fundamentals

## The rules

A standard Sudoku is a 9×9 grid divided into nine 3×3 boxes. The solver fills
every empty cell with a digit from 1 to 9 so that each digit appears exactly
once in:

- every **row**,
- every **column**, and
- every **box**.

Rows, columns, and boxes are all called **units**. Each unit has 9 cells, and
the grid has 27 units in total.

## Anatomy of the grid

```
   c0 c1 c2   c3 c4 c5   c6 c7 c8
r0 .  .  .  | .  .  .  | .  .  .
r1 .  box 0 | .  box 1 | .  box 2
r2 .  .  .  | .  .  .  | .  .  .
   ---------+----------+---------
r3 .  .  .  | .  .  .  | .  .  .
r4 .  box 3 | .  box 4 | .  box 5
r5 .  .  .  | .  .  .  | .  .  .
   ---------+----------+---------
r6 .  .  .  | .  .  .  | .  .  .
r7 .  box 6 | .  box 7 | .  box 8
r8 .  .  .  | .  .  .  | .  .  .
```

- A **band** is a horizontal strip of three boxes (rows 0–2, 3–5, or 6–8).
- A **stack** is a vertical strip of three boxes (columns 0–2, 3–5, or 6–8).
- The **peers** of a cell are the 20 other cells that share a row, column, or
  box with it. A cell cannot hold the same digit as any of its peers.

## What makes a puzzle "proper"

A puzzle is the grid with some cells already filled in. Those given digits are
the **clues** (also called givens). A well-formed puzzle has:

1. **Exactly one solution.** This is the most important requirement. A puzzle
   with several solutions forces the player to guess, and a puzzle with none
   is broken.
2. **Consistent clues.** No two clues break the rules.

Two other properties are common but optional:

- **Minimality:** removing any single clue would make the solution
  non-unique. Generators that remove clues until none can be removed produce
  minimal puzzles.
- **Symmetry:** the clue pattern looks the same after rotating the grid 180°.
  Published puzzles usually have this for looks; it doesn't affect solving.

## Useful facts

- There are 6,670,903,752,021,072,936,960 valid completed grids, or about
  5.47 billion once you treat symmetric variations as the same grid.
- A proper puzzle needs **at least 17 clues**. This was proven by exhaustive
  computer search (McGuire, Tugemann & Civario, 2012).
- The number of clues is only a rough guide to difficulty. Some 17-clue
  puzzles are easy and some 30-clue puzzles are very hard. See
  [Difficulty grading](05-difficulty-grading.md).

## What a generator must produce

A generator's output is a pair:

- `solution`: the completed, valid grid.
- `puzzle`: the same grid with some cells blanked out, where the only way to
  complete it is `solution`.

It is also useful to record difficulty and the clue count as metadata.

---
Next: [Grid representation](02-grid-representation.md)
