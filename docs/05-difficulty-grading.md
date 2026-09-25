# 5. Difficulty Grading

Players choose a difficulty, so the generator needs a way to measure how hard
a puzzle is. There are two common methods.

## Method 1: clue count (simple, unreliable)

Use the target clue count as a stand-in for difficulty:

| Level | Clues |
|---|---|
| Easy | 36–40 |
| Medium | 30–35 |
| Hard | 25–29 |
| Expert | 22–24 |

This is easy to build, but the number of clues says little about how the
puzzle feels to solve. It is fine for a first version and should be replaced.

## Method 2: technique-based grading (recommended)

People solve Sudoku by applying **logical techniques**, never by trial and
error. A puzzle is as hard as the hardest technique it requires. To grade a
puzzle:

1. Write a "human-style" solver that tracks the candidates of every cell and
   applies techniques from simplest to hardest.
2. Each step, apply the simplest technique that makes progress, then start
   again from the simplest technique.
3. Record the hardest technique used.
4. If the solver gets stuck before the grid is complete, the puzzle needs
   guessing (or a technique the solver doesn't know). Reject it, or grade it
   as the highest level.

### Techniques, easiest first

| Technique | Idea | Typical level |
|---|---|---|
| **Naked single** | A cell has only one candidate left. | Easy |
| **Hidden single** | A digit fits in only one cell of a unit. | Easy |
| **Pointing pair/triple** | In a box, a digit's candidates all lie in one row or column, so remove it from the rest of that line. | Medium |
| **Box/line reduction** | In a row or column, a digit's candidates all lie in one box, so remove it from the rest of that box. | Medium |
| **Naked pair/triple** | Two cells in a unit share the same two candidates, so remove those digits from the rest of the unit. | Medium |
| **Hidden pair/triple** | Two digits fit in only the same two cells of a unit, so remove all other candidates from those cells. | Hard |
| **X-Wing** | A digit fits in only two cells in each of two rows, and those cells line up in two columns, so remove it from the rest of those columns. | Hard |
| **Swordfish, XY-Wing, Chains…** | Larger patterns of the same kind of reasoning. | Expert |

### Scoring

The hardest technique alone is usually enough to choose a level. For a finer
score, add up a weight for every step, for example:

```
naked single = 1, hidden single = 2, pointing = 5, naked pair = 8,
hidden pair = 12, X-Wing = 20 ...
```

This separates two "medium" puzzles where one needs a single pair and the
other needs many.

## Generating to a target difficulty

The generator cannot aim straight at a difficulty. Generate, grade, and retry:

```js
function generateWithDifficulty(level) {
  for (;;) {
    const { puzzle, solution } = generate(targetCluesFor(level));
    if (grade(puzzle) === level) return { puzzle, solution };
  }
}
```

Easy puzzles appear quickly, but hard ones can take many attempts. Ways to
keep this fast:

- Grade while digging: stop removing clues as soon as the puzzle reaches the
  target level.
- Keep a pool of pre-generated puzzles per level, filled in the background or
  built offline.
- Transform stored puzzles (see
  [Generating a solved grid](03-generating-a-solved-grid.md)); this keeps
  their difficulty unchanged.

## Useful by-products

The human-style solver is also what powers hints in the game. It can say
"this cell must be 7 because it's the only place for 7 in this box" instead of
just revealing the answer.

The game does exactly this: each technique in `js/sudoku.js` finds and
describes one step without applying it, so the grader applies the steps and
`findHint` explains them. When a placement depends on eliminations, the hint
keeps only the ones it needs, working backwards from the placement to the
candidates each step relies on.

Hints also know techniques beyond the ones that define the levels (fish,
wings, single-digit chains, unique rectangles, XY-chains, and "what if"
chains that follow singles to a contradiction). The grader doesn't use them,
so adding techniques to hints never changes how puzzles are graded. Every
step records the candidates its reasoning relies on, which lets the tests
check that each hint's steps justify its move on their own.

---
Previous: [Removing clues](04-removing-clues.md) ·
Next: [Performance](06-performance.md)
