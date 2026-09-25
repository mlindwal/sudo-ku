# 7. Solving Techniques

This chapter explains every technique the game's **Hint** button uses, from
the simplest to the most advanced. Each one comes with a real example: a
board from a game, with the cells involved marked, and the exact explanation
the hint gives for it.

The first four groups (singles, intersections and subsets) are the
techniques that define the difficulty levels (see
[Difficulty grading](05-difficulty-grading.md)). The rest are only needed on
Expert, and the hints use them so that Expert moves can be explained too.

## Contents

1. [Candidates and how to read the examples](#candidates-and-how-to-read-the-examples)
2. [Singles](#singles): hidden single, naked single
3. [Intersections](#intersections): pointing pairs and triples, box/line reduction
4. [Subsets](#subsets): naked and hidden pairs and triples
5. [Fish](#fish): X-Wing, Swordfish, Jellyfish
6. [Single-digit chains](#single-digit-chains): Skyscraper, 2-String Kite, Turbot Fish
7. [Wings](#wings): XY-Wing, XYZ-Wing, W-Wing
8. [Uniqueness](#uniqueness): Unique Rectangle
9. [Chains](#chains): XY-Chain, "what if" chains
10. [How hints choose a technique](#how-hints-choose-a-technique)

## Candidates and how to read the examples

A **candidate** is a digit that could still go in an empty cell: it isn't
already in the cell's row, column or box. Every technique here works on
candidates. Most either **place** a digit (when only one candidate is left
somewhere) or **rule out** candidates, which sooner or later leaves a single.
Notes mode in the game is for tracking candidates by hand.

Hints work out candidates from the digits on the board, not from your notes,
so a mistaken note can't lead a hint astray.

In the examples:

- Rows are numbered 1–9 from the top and columns 1–9 from the left. Boxes
  are named by position: top-left, top-middle, …, center, …, bottom-right.
- Digits are the ones on the board at that moment; `.` is an empty cell.
- `@` marks the cell the hint fills in.
- `*` (or letters `A`, `B`, …) mark the cells the reasoning is about.
- `x` marks cells where a candidate is ruled out.
- Where it matters, the candidates of the marked cells are listed below the
  grid.

A hint's last step is always a single. Earlier steps are eliminations that
make that single possible, so most examples below end with "Now …".

## Singles

Singles are how every digit is eventually placed. Easy and Medium puzzles
need nothing else.

### Hidden single

**Look for:** a digit that has only one possible place left in a box, row or column.

**Why it works:** every box, row and column must contain each digit once. If all the other empty cells in the unit already see that digit (in their own row, column or box), the one cell left must hold it.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 1 . . | 6 8 7 | 2 9 4 |
   2 | 9 4 2 | 1 5 3 | 6 . 8 |
   3 | 7 6 8 | 9 4 2 | @ 3 5 |
     +-------+-------+-------+
   4 | . 7 . | 4 2 8 | 9 6 . |
   5 | . 1 4 | 3 . . | . 5 . |
   6 | 6 2 . | . . . | 8 4 . |
     +-------+-------+-------+
   7 | 4 . 7 | . . . | 5 . . |
   8 | 3 . . | . 9 . | 4 . 7 |
   9 | 2 9 1 | . . 4 | . 8 . |
     +-------+-------+-------+
```

`@` the cell the hint fills in

The hint says:

> In the top-right box, 1 can only go in one place: row 3, column 7. Every other empty cell there already has a 1 in its row or column.

Hidden singles in boxes are usually the easiest moves to spot, so hints
look for those first. The same idea works along a line:

**Example in a row.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . 3 9 | 6 5 . | . 8 7 |
   2 | . 1 6 | 7 . . | 3 9 5 |
   3 | . . 7 | . 3 . | . . 6 |
     +-------+-------+-------+
   4 | . . 4 | . 8 3 | 7 5 9 |
   5 | 7 . . | . 2 . | 6 3 . |
   6 | . 9 3 | . 6 7 | . . . |
     +-------+-------+-------+
   7 | . . . | . . 5 | . 7 3 |
   8 | 3 7 5 | 8 . 6 | 9 4 @ |
   9 | 9 . 1 | 3 7 . | 5 6 . |
     +-------+-------+-------+
```

`@` the cell the hint fills in

The hint says:

> In row 8, 2 can only go in one place: column 9. Every other empty cell there already has a 2 in its column or box.

### Naked single

**Look for:** a cell where eight of the nine digits already appear in its row, column or box.

**Why it works:** the cell must hold some digit, and only one is left.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . . . | 7 . . | . . . |
   2 | 7 . . | . . 8 | . . . |
   3 | 8 3 . | . 4 6 | @ . . |
     +-------+-------+-------+
   4 | 1 . . | 4 . 5 | . 6 8 |
   5 | . . . | . . 1 | 2 4 . |
   6 | . 4 . | . . . | 7 . . |
     +-------+-------+-------+
   7 | 4 . 1 | . 6 . | 5 3 . |
   8 | 9 . . | . . . | 1 . 4 |
   9 | . 7 . | . . 4 | . 2 . |
     +-------+-------+-------+
```

`@` the cell the hint fills in

The hint says:

> Row 3, column 7 can only be 9: 1, 2, 3, 4, 5, 6, 7 and 8 are already in its row, column or box.


## Intersections

These techniques use the overlap between a box and a row or column. They
don't place a digit themselves; they rule out candidates, which then leads to
a single. Hard puzzles need them.

### Pointing pair and pointing triple

**Look for:** a box where every possible place for a digit lies in the same row (or column).

**Why it works:** the box must hold the digit somewhere in that row, so the row's copy of the digit is inside the box. No other cell of the row, outside the box, can hold it.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | x . . | 4 . . | . . . |
   2 | 7 . . | . . . | . 1 4 |
   3 | 4 . . | . . 9 | . . 2 |
     +-------+-------+-------+
   4 | * 4 6 | 5 . 7 | 2 . . |
   5 | * 5 7 | . 6 8 | . . 9 |
   6 | 1 8 . | 3 . 4 | . . . |
     +-------+-------+-------+
   7 | x . 4 | . 8 2 | 5 6 . |
   8 | . . . | 6 . 3 | . . . |
   9 | 6 . . | . . 1 | . . . |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> 1. In the middle-left box, 3 can only go in column 1. So 3 can't go anywhere else in column 1.
>
> 2. Now row 7, column 1 can only be 9.

With three cells in a line it's called a pointing triple, and the reasoning
is the same:

**Example of a pointing triple.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 4 . . | . 9 8 | 2 1 7 |
   2 | 8 9 2 | . 4 . | 6 3 5 |
   3 | 7 1 . | . . 3 | 4 8 9 |
     +-------+-------+-------+
   4 | 5 * 8 | 3 . 9 | . . . |
   5 | 3 * 7 | . 5 4 | 9 . . |
   6 | 1 * 9 | . . 6 | . . . |
     +-------+-------+-------+
   7 | . 8 1 | . . . | . . 4 |
   8 | . x 4 | . . . | 8 . . |
   9 | 6 . . | 4 8 2 | . 9 . |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> In the middle-left box, 2 can only go in column 2. So 2 can't go anywhere else in column 2.

### Box/line reduction

**Look for:** a row (or column) where every possible place for a digit lies inside one box.

**Why it works:** the row must hold the digit, and it can only do so inside that box. So the box's copy of the digit is in that row, and no other cell of the box can hold it. This is the mirror image of a pointing pair.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . 9 . | 7 . . | . 6 8 |
   2 | 8 2 . | 6 . 5 | 4 . . |
   3 | . 6 7 | . . 8 | . . . |
     +-------+-------+-------+
   4 | 6 5 . | . . 7 | 8 . . |
   5 | 9 1 8 | 4 6 2 | 7 3 5 |
   6 | 3 7 . | 5 8 . | . . 6 |
     +-------+-------+-------+
   7 | * 4 9 | 8 7 6 | . 5 3 |
   8 | . 3 6 | 2 5 4 | 9 8 . |
   9 | * 8 x | . 1 . | 6 . . |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> 1. In column 1, 2 can only go in cells inside the bottom-left box. So 2 can't go anywhere else in the bottom-left box.
>
> 2. Now row 9, column 3 can only be 5.


## Subsets

### Naked pair and naked triple

**Look for:** two cells in a unit that can only hold the same two digits (or three cells whose candidates together are just three digits).

**Why it works:** those cells will use up those digits between them, even if you can't tell yet which goes where. So no other cell in the unit can hold them. In a triple, each cell needn't have all three candidates; it only matters that together they have three.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | x . 2 | 4 . 1 | 8 9 . |
   2 | 9 6 1 | 7 8 5 | 4 3 2 |
   3 | 4 . 8 | . 9 2 | . . . |
     +-------+-------+-------+
   4 | 6 . 4 | . . . | 7 2 . |
   5 | . . 7 | 2 4 . | . . . |
   6 | 2 . 3 | . . 7 | . 4 8 |
     +-------+-------+-------+
   7 | * 4 9 | 8 2 6 | . . 1 |
   8 | * 2 6 | 1 5 4 | . 8 . |
   9 | . . 5 | 9 7 3 | 2 6 4 |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `x` cells where a candidate is ruled out

Candidates of the marked cells:

- row 7, column 1: 3 or 7
- row 8, column 1: 3 or 7

The hint says:

> 1. In column 1, rows 7 and 8 can only hold 3 and 7, so those digits must go there. No other cell in column 1 can be 3 or 7.
>
> 2. Now row 1, column 1 can only be 5.

**Example of a naked triple.** Note that not every cell has all three digits.

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . . . | 2 1 . | 8 x * |
   2 | 3 5 . | 9 8 4 | . . . |
   3 | 8 1 2 | 7 6 . | * x * |
     +-------+-------+-------+
   4 | . . 8 | . 5 . | 3 9 7 |
   5 | . 3 . | . . 2 | . 5 . |
   6 | 5 . . | . 3 . | 4 . . |
     +-------+-------+-------+
   7 | 7 . 3 | . 2 8 | . . . |
   8 | . . 5 | 3 . . | 2 . 6 |
   9 | . . 1 | . 4 . | . . 3 |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `x` cells where a candidate is ruled out

Candidates of the marked cells:

- row 1, column 9: 4, 5 or 9
- row 3, column 7: 5 or 9
- row 3, column 9: 4, 5 or 9

The hint says:

> 1. In the top-right box, row 1, column 9; row 3, column 7; and row 3, column 9 can only hold 4, 5 and 9, so those digits must go there. No other cell in the top-right box can be 4, 5 or 9.
>
> 2. Now 4 can only go in one place in row 3: column 9.

### Hidden pair and hidden triple

**Look for:** two digits that, in some unit, can only go in the same two cells (or three digits confined to three cells).

**Why it works:** those two cells must hold those two digits, so they have no room for anything else: every other candidate in them can go. This is the mirror image of a naked pair: the digits are confined to the cells, rather than the cells to the digits.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 4 . . | . 9 . | 6 . . |
   2 | 6 . . | . . . | 4 . . |
   3 | . 9 8 | 4 7 6 | * 5 . |
     +-------+-------+-------+
   4 | . 6 . | . . 7 | . . 5 |
   5 | . . . | . . 1 | . 3 2 |
   6 | . . 3 | . . . | . 6 . |
     +-------+-------+-------+
   7 | . . 6 | . 8 9 | 1 . . |
   8 | . . . | 5 1 . | * @ 6 |
   9 | 9 . 1 | . . 4 | 5 . . |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `@` the cell the hint then fills in

Candidates of the marked cells:

- row 3, column 7: 2 or 3
- row 8, column 7: 2, 3, 7, 8 or 9

The hint says:

> 1. In column 7, 2 and 3 can only go in rows 3 and 8. So those cells can't hold any other digit.
>
> 2. Now 9 can only go in one place in the bottom-right box: row 8, column 8.

**Example of a hidden triple.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . . . | . 6 3 | . 7 2 |
   2 | . . . | 7 2 5 | . 8 4 |
   3 | 2 7 . | . 8 4 | 3 . . |
     +-------+-------+-------+
   4 | . 2 7 | . 9 8 | . . 5 |
   5 | . . . | . . . | . . 7 |
   6 | . 4 3 | 5 . . | 6 . . |
     +-------+-------+-------+
   7 | @ . . | 2 . 9 | . 4 1 |
   8 | * * * | . . . | . . . |
   9 | . . 2 | . 4 1 | 7 9 . |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `@` the cell the hint then fills in

Candidates of the marked cells:

- row 8, column 1: 1, 3, 4, 5, 6, 7, 8 or 9
- row 8, column 2: 1, 3, 5, 6, 8 or 9
- row 8, column 3: 1, 4, 5, 6, 8 or 9

The hint says:

> 1. In row 8, 1, 4 and 9 can only go in columns 1, 2 and 3. So those cells can't hold any other digit.
>
> 2. Now 7 can only go in one place in the bottom-left box: row 7, column 1.

## Fish

Fish look at one digit across several rows and columns at once. They're
named after sizes: two lines is an X-Wing, three a Swordfish, four a
Jellyfish.

### X-Wing

**Look for:** two rows where a digit can only go in the same two columns (or two columns where it can only go in the same two rows).

**Why it works:** the two rows need two copies of the digit, one each, and there are only two columns to put them in. Whichever way they go, both columns get their copy of the digit from those two rows. So nothing else in those two columns can hold it.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 2 7 1 | 5 . 6 | 8 . 4 |
   2 | 6 4 3 | . 8 . | 5 . . |
   3 | 8 5 9 | . . 4 | . . . |
     +-------+-------+-------+
   4 | 9 * 6 | 2 . * | . 4 5 |
   5 | 7 x . | . . 5 | . 2 1 |
   6 | . 2 5 | . . 3 | . 8 . |
     +-------+-------+-------+
   7 | . * 7 | 6 . * | . . 3 |
   8 | . 6 . | . . 9 | . . . |
   9 | 3 9 2 | 7 5 1 | 4 6 8 |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> 1. In rows 4 and 7, 8 can only go in columns 2 and 6. Those two rows need two 8s, and they have to be in columns 2 and 6. So 8 can't go anywhere else in columns 2 and 6.
>
> 2. Now row 5, column 2 can only be 3.


### Swordfish

**Look for:** three rows where a digit can only go in three columns between them (or the same with rows and columns swapped). Each row can have two or three of those places.

**Why it works:** the three rows need three copies of the digit, and they can only be in those three columns, one per column. So those columns are full for that digit.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 7 2 8 | * * . | 9 1 . |
   2 | . 3 1 | . . 9 | 2 7 4 |
   3 | . 4 9 | 2 7 1 | 3 . 8 |
     +-------+-------+-------+
   4 | . 8 5 | . . . | . . . |
   5 | 1 7 3 | . . 4 | . . . |
   6 | . 6 x | 5 . . | . . . |
     +-------+-------+-------+
   7 | . 5 . | 1 3 8 | . 4 9 |
   8 | 8 1 * | 9 * . | . 3 . |
   9 | 3 9 * | * * . | 1 8 2 |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> In rows 1, 8 and 9, 4 can only go in columns 3, 4 and 5. Those three rows need three 4s, and they have to be in columns 3, 4 and 5. So 4 can't go anywhere else in columns 3, 4 and 5.


### Jellyfish

**Look for:** four rows where a digit can only go in four columns between them, or the other way round.

**Why it works:** the same as a Swordfish, one size up. Jellyfish are rare.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . 8 . | . . . | 3 . 5 |
   2 | 6 . . | . . 1 | 7 4 8 |
   3 | . 4 . | . 5 . | 9 . 2 |
     +-------+-------+-------+
   4 | 5 * x | * 7 . | 2 . 4 |
   5 | . 2 6 | . 4 5 | 1 . . |
   6 | . * 4 | 2 * . | . . 3 |
     +-------+-------+-------+
   7 | 1 . 3 | . . . | 8 . . |
   8 | 4 . . | * * 7 | . 2 * |
   9 | 2 . . | * * . | 4 3 * |
     +-------+-------+-------+
```

`*` the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> In columns 2, 4, 5 and 9, 1 can only go in rows 4, 6, 8 and 9. Those four columns need four 1s, and they have to be in rows 4, 6, 8 and 9. So 1 can't go anywhere else in rows 4, 6, 8 and 9.


## Single-digit chains

These use **strong links**: a unit where a digit has exactly two possible
places, so one of the two must hold it. Two strong links joined by cells that
see each other create a chain.

### Skyscraper

**Look for:** two rows where a digit has exactly two places each, with one end of each in the same column (or the same with rows and columns swapped).

**Why it works:** the two ends in the shared column see each other, so at most one of them holds the digit. If one doesn't, its row's other end must. So at least one of the two far ends holds the digit, and any cell that sees both far ends can't.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . 5 1 | . . . | 2 7 . |
   2 | . 4 . | 2 . . | . . 3 |
   3 | 8 3 2 | 7 5 . | 6 9 . |
     +-------+-------+-------+
   4 | . 6 5 | . 9 2 | . . . |
   5 | A 1 8 | . 7 5 | B . 2 |
   6 | 2 x 4 | . 8 3 | . . . |
     +-------+-------+-------+
   7 | 4 8 . | 5 2 . | 1 3 6 |
   8 | 1 D 3 | 8 4 6 | C 2 5 |
   9 | 5 2 6 | . . . | 4 8 . |
     +-------+-------+-------+
```

`A`, `B`, … the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> 1. In row 5, 9 can only go in column 1 or column 7. In row 8, 9 can only go in column 7 or column 2. Row 5, column 7 and row 8, column 7 see each other, so they can't both be 9. That means row 5, column 1 or row 8, column 2 must be 9, so 9 can't go in row 6, column 2, which sees both.
>
> 2. Now 9 can only go in one place in the middle-left box: row 5, column 1.


### 2-String Kite

**Look for:** a row and a column where a digit has exactly two places each, with one end of each in the same box.

**Why it works:** the two ends in the box see each other, so at least one of the two far ends holds the digit, as in a Skyscraper. A cell that sees both far ends can't hold it.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . 2 . | 9 . . | 1 7 5 |
   2 | . 1 . | . . 2 | 8 . . |
   3 | . . . | 5 . 1 | . . 4 |
     +-------+-------+-------+
   4 | . . C | 8 . . | . . . |
   5 | . . 3 | 2 . . | 5 6 . |
   6 | B . 1 | . . . | 7 A 8 |
     +-------+-------+-------+
   7 | 9 5 D | 4 3 8 | . x . |
   8 | 1 . . | 7 2 5 | . 8 . |
   9 | . . 8 | 1 9 6 | . 5 . |
     +-------+-------+-------+
```

`A`, `B`, … the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> 1. In row 6, 2 can only go in column 8 or column 1. In column 3, 2 can only go in row 4 or row 7. Row 6, column 1 and row 4, column 3 see each other, so they can't both be 2. That means row 6, column 8 or row 7, column 3 must be 2, so 2 can't go in row 7, column 8, which sees both.
>
> 2. Now row 7, column 8 can only be 1.


### Turbot Fish

**Look for:** the same shape as a Skyscraper or Kite, but with a box as one of the strong links.

**Why it works:** the same reasoning: two strong links whose near ends see each other force the digit into one of the far ends.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 4 1 3 | . 8 . | 5 . 7 |
   2 | C 5 7 | 1 3 . | 4 . . |
   3 | 6 9 D | . . . | x 1 3 |
     +-------+-------+-------+
   4 | 7 4 9 | 3 6 5 | 1 8 2 |
   5 | 1 . . | . . . | . 3 5 |
   6 | 5 3 . | . 1 . | . 7 4 |
     +-------+-------+-------+
   7 | B 6 1 | 4 7 3 | A 5 . |
   8 | 3 . 4 | . . . | 7 . 1 |
   9 | . 7 5 | . . 1 | 3 4 6 |
     +-------+-------+-------+
```

`A`, `B`, … the cells the reasoning is about · `x` cells where a candidate is ruled out

The hint says:

> 1. In row 7, 2 can only go in column 7 or column 1. In the top-left box, 2 can only go in row 2, column 1 or row 3, column 3. Row 7, column 1 and row 2, column 1 see each other, so they can't both be 2. That means row 7, column 7 or row 3, column 3 must be 2, so 2 can't go in row 3, column 7, which sees both.
>
> 2. Now 2 can only go in one place in column 7: row 7.


## Wings

Wings are patterns of cells with only two or three candidates. A **pivot**
cell sees two **pincer** cells, and whatever the pivot is, one of the
pincers ends up holding the same digit.

### XY-Wing

**Look for:** a pivot with two candidates, say 1 or 3, that sees two pincers: one with 1 or 9, the other with 3 or 9.

**Why it works:** if the pivot is 1, the first pincer must be 9; if it's 3, the second pincer must be 9. Either way one pincer is 9, so any cell that sees both pincers can't be 9.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 4 9 . | 7 2 A | 5 6 8 |
   2 | 8 2 . | 6 . 5 | 4 . . |
   3 | 5 6 7 | B 4 8 | 3 . . |
     +-------+-------+-------+
   4 | 6 5 . | . . 7 | 8 . . |
   5 | 9 1 8 | 4 6 2 | 7 3 5 |
   6 | 3 7 . | 5 8 . | . . 6 |
     +-------+-------+-------+
   7 | . 4 9 | 8 7 6 | . 5 3 |
   8 | . 3 6 | 2 5 4 | 9 8 . |
   9 | . 8 5 | x 1 C | 6 . . |
     +-------+-------+-------+
```

`A`, `B`, … the cells the reasoning is about · `x` cells where a candidate is ruled out

Candidates of the marked cells:

- `A` row 1, column 6: 1 or 3
- `B` row 3, column 4: 1 or 9
- `C` row 9, column 6: 3 or 9

The hint says:

> 1. Row 1, column 6 can only be 1 or 3. If it's 1, row 3, column 4 must be 9; if it's 3, row 9, column 6 must be 9. Either way one of those two cells is 9, so 9 can't go in row 9, column 4, which sees both.
>
> 2. Now 9 can only go in one place in the bottom-middle box: row 9, column 6.


### XYZ-Wing

**Look for:** a pivot with three candidates that sees two pincers, each with two of those candidates, sharing one digit.

**Why it works:** like an XY-Wing, except the pivot could also hold the shared digit itself. So the digit is in the pivot or one of the pincers, and a cell must see all three to rule it out.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . 4 2 | 1 . 7 | 3 A B |
   2 | 7 3 @ | 9 . 2 | . x 4 |
   3 | 5 9 1 | 3 6 4 | 8 7 2 |
     +-------+-------+-------+
   4 | 4 6 7 | 5 1 8 | . . 3 |
   5 | 1 8 9 | 7 2 3 | 6 4 5 |
   6 | 2 5 3 | 6 4 9 | 7 8 1 |
     +-------+-------+-------+
   7 | . 1 4 | 2 7 . | . 3 . |
   8 | 3 2 . | 8 9 1 | 4 C 7 |
   9 | . 7 . | 4 3 . | . . . |
     +-------+-------+-------+
```

`A`, `B`, … the cells the reasoning is about · `x` cells where a candidate is ruled out · `@` the cell the hint then fills in

Candidates of the marked cells:

- `A` row 1, column 8: 5, 6 or 9
- `B` row 1, column 9: 6 or 9
- `C` row 8, column 8: 5 or 6

The hint says:

> 1. Row 1, column 8 can only be 5, 6 or 9. Row 1, column 9 can only be 6 or 9, and row 8, column 8 can only be 5 or 6. If row 1, column 8 is 9, row 1, column 9 is 6; if it's 5, row 8, column 8 is 6; otherwise it's 6 itself. So 6 can't go in row 2, column 8, which sees all three.
>
> 2. Now 6 can only go in one place in row 2: column 3.


### W-Wing

**Look for:** two cells that can only be the same two digits, but don't see each other, and a strong link on one of those digits that connects them.

**Why it works:** if the first cell were the linked digit, the near end of the strong link couldn't be, so the far end would be, and the second cell couldn't be that digit, so it would be the other one. So at least one of the two cells holds the other digit, and cells that see both can't.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . 7 . | 9 4 3 | 6 2 1 |
   2 | 3 2 4 | 6 8 1 | 5 7 9 |
   3 | 9 A . | 2 7 5 | 8 4 3 |
     +-------+-------+-------+
   4 | . 9 . | 7 2 8 | 3 1 4 |
   5 | D C 7 | 3 5 6 | 2 9 8 |
   6 | 2 8 3 | 4 1 9 | 7 5 6 |
     +-------+-------+-------+
   7 | 7 x 2 | 1 @ 4 | 9 8 5 |
   8 | B 5 . | 8 . 7 | 4 3 2 |
   9 | . . . | 5 . 2 | 1 6 7 |
     +-------+-------+-------+
```

`A`, `B`, … the cells the reasoning is about · `x` cells where a candidate is ruled out · `@` the cell the hint then fills in

Candidates of the marked cells:

- `A` row 3, column 2: 1 or 6
- `B` row 8, column 1: 1 or 6
- `C` row 5, column 2: 1 or 4
- `D` row 5, column 1: 1 or 4

The hint says:

> 1. Row 3, column 2 and row 8, column 1 can both only be 1 or 6. In row 5, 1 can only go in column 2 or column 1. If row 3, column 2 were 1, row 5, column 2 couldn't be, so row 5, column 1 would be 1 and row 8, column 1 would be 6. So one of the two is 6, and 6 can't go in row 7, column 2, which sees both.
>
> 2. Now 6 can only go in one place in row 7: column 5.


## Uniqueness

### Unique Rectangle

**Look for:** four empty cells forming a rectangle across exactly two boxes, where three can only be the same two digits and the fourth has those two plus others.

**Why it works:** if the fourth cell were one of the two digits as well, the four cells could swap the digits between them and the rest of the puzzle would still work: two solutions. A proper sudoku has exactly one solution, so the fourth cell can't be either digit. (This relies on the puzzle being proper, which every Sudo-ku puzzle is.)

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 5 . 2 | 4 . 1 | 8 9 . |
   2 | 9 6 1 | 7 8 5 | 4 3 2 |
   3 | 4 . 8 | . 9 2 | . . . |
     +-------+-------+-------+
   4 | 6 . 4 | . . 8 | 7 2 . |
   5 | A B 7 | 2 4 9 | . . . |
   6 | 2 . 3 | . . 7 | . 4 8 |
     +-------+-------+-------+
   7 | . 4 9 | 8 2 6 | . . 1 |
   8 | . 2 6 | 1 5 4 | . 8 . |
   9 | C D 5 | 9 7 3 | 2 6 4 |
     +-------+-------+-------+
```

`A`, `B`, … the cells the reasoning is about

Candidates of the marked cells:

- `A` row 5, column 1: 1 or 8
- `B` row 5, column 2: 1, 5 or 8
- `C` row 9, column 1: 1 or 8
- `D` row 9, column 2: 1 or 8

The hint says:

> 1. Row 5, column 1; row 9, column 1; and row 9, column 2 can only be 1 or 8. If row 5, column 2 were 1 or 8 too, these four cells could swap their 1s and 8s and the puzzle would have two solutions. A proper sudoku has only one, so row 5, column 2 can't be 1 or 8.
>
> 2. Now 8 can only go in one place in the middle-left box: row 5, column 1.


## Chains

### XY-Chain

**Look for:** a chain of cells that each have exactly two candidates, where each cell sees the next and shares a digit with it.

**Why it works:** assume the first cell isn't its chosen digit: then it's its other digit, which forces the next cell, and so on to the end of the chain. If the last cell is forced to the same digit the first cell started with, then one of the two ends holds that digit. Cells that see both ends can't. An XY-Wing is the shortest XY-Chain.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | 7 9 6 | 3 4 2 | 8 5 1 |
   2 | . . 8 | 7 9 5 | 6 2 3 |
   3 | B . C | 1 6 8 | 4 7 9 |
     +-------+-------+-------+
   4 | 5 2 9 | 6 7 3 | 1 4 8 |
   5 | 6 . . | 9 . 1 | . 3 2 |
   6 | A . x | 2 . 4 | . 9 6 |
     +-------+-------+-------+
   7 | . 6 . | 5 1 9 | 3 8 7 |
   8 | 8 7 3 | 4 2 6 | 9 1 5 |
   9 | 9 . D | 8 3 7 | 2 6 4 |
     +-------+-------+-------+
```

`A`, `B`, … the cells the reasoning is about · `x` cells where a candidate is ruled out

Candidates of the marked cells:

- `A` row 6, column 1: 1 or 3
- `B` row 3, column 1: 2 or 3
- `C` row 3, column 3: 2 or 5
- `D` row 9, column 3: 1 or 5

The hint says:

> 1. These cells each have only two candidates, and each sees the next: row 6, column 1; row 3, column 1; row 3, column 3; and row 9, column 3. If row 6, column 1 isn't 1, it's 3; then row 3, column 1 is 2, row 3, column 3 is 5 and row 9, column 3 is 1. So row 6, column 1 or row 9, column 3 is 1, and 1 can't go in row 6, column 3, which sees both.
>
> 2. Now 1 can only go in one place in column 3: row 9.


### "What if" chains

**Look for:** a cell with few candidates, where assuming one of them quickly leads to something impossible.

**Why it works:** if a digit really belonged there, following singles from it couldn't break any rule. When it leads to a cell with no digit left, or a unit with nowhere for a digit, the assumption was wrong, and that candidate can go. Hints only use these when no named technique works, and choose the shortest chain they can find. This is sometimes called Nishio or trial and error; unlike guessing, the chain proves the elimination.

**Example.**

```
       1 2 3   4 5 6   7 8 9
     +-------+-------+-------+
   1 | . 2 . | 9 . . | 1 7 5 |
   2 | . 1 . | . . 2 | 8 . . |
   3 | . . . | 5 . 1 | . * 4 |
     +-------+-------+-------+
   4 | . . . | 8 . . | . . * |
   5 | . . 3 | 2 . . | 5 6 . |
   6 | . . 1 | . . . | 7 . 8 |
     +-------+-------+-------+
   7 | 9 5 . | 4 3 8 | ? 1 . |
   8 | 1 . . | 7 2 5 | . 8 . |
   9 | . . 8 | 1 9 6 | . 5 . |
     +-------+-------+-------+
```

`?` the cell whose digit is assumed · `*` the cells the assumption forces

The hint says:

> 1. Suppose row 7, column 7 were 2. Then 2 would have to go in row 3, column 8, the only place left in the top-right box. Then 2 would have to go in row 4, column 9, the only place left in the middle-right box. But then column 3 would have nowhere left for 2. So row 7, column 7 can't be 2.
>
> 2. Now row 7, column 7 can only be 6.


## How hints choose a technique

For each hint, the game:

1. Points out a wrong digit on the board, if there is one, since reasoning
   from it would mislead you.
2. Looks for a single, trying hidden singles in boxes first.
3. If there's none, looks for an elimination in this order: intersections,
   subsets, X-Wing, single-digit chains, XY-Wing, Swordfish, XYZ-Wing,
   W-Wing, Unique Rectangle, XY-Chain, Jellyfish. It prefers one that leads
   straight to a single, and otherwise applies the simplest one and looks
   again.
4. Only if none of those work, tries "what if" chains, shortest first.
5. Shows only the steps the final single depends on, with each explanation
   standing on its own.

If a hint using only the named techniques needs three steps or fewer, it's
used even when a "what if" chain would be shorter.

The techniques that define each difficulty level are:

| Level | Techniques needed |
|---|---|
| Easy | Singles, with about 38 clues |
| Medium | Singles, with about 31 clues |
| Hard | Intersections or subsets |
| Expert | At least one technique beyond intersections and subsets |

Every example in this chapter is a real position from a generated game, and
every quoted explanation is exactly what the **Hint** button shows for it.

---
Previous: [Performance](06-performance.md) ·
Back to [index](README.md)
