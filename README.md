# Sudo-ku

Sudoku in plain JavaScript and HTML. There are no dependencies and no build
step.

## Play

Open `index.html` in a browser. It works straight from the file system, or
from any static host such as GitHub Pages.

## Features

- **Four difficulty levels.** Every puzzle is freshly generated and has
  exactly one solution. Each level is defined by the solving techniques it
  needs:
  - **Easy:** about 38 clues; naked and hidden singles are enough.
  - **Medium:** about 31 clues; singles are enough.
  - **Hard:** minimal puzzles that need pointing pairs, box/line reduction,
    or naked/hidden pairs and triples.
  - **Expert:** minimal puzzles that need techniques beyond those.
- **Clock** that counts the time spent on the game. It pauses when you press
  pause or switch tabs, and remembers your best time for each difficulty.
- **Notes mode** toggle to switch between filling in digits and adding
  pencil marks.
- **Keyboard or on-screen number pad** input. The pad shows how many of each
  digit are left.
- Undo, erase, and highlighting of the selected cell's row, column and box,
  of matching digits, and of conflicting digits.
- Light and dark themes that follow your system setting.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `1`–`9` | Fill in the selected cell (or add a note in notes mode) |
| `Shift` + `1`–`9` | Add or remove a note |
| Arrow keys | Move the selection |
| `Backspace`, `Delete`, `0` | Erase |
| `N` | Toggle notes mode |
| `Ctrl`/`Cmd` + `Z` | Undo |
| `Esc` | Deselect |

## Project layout

| Path | Contents |
|---|---|
| `index.html` | Page markup |
| `css/style.css` | Styles, including the mobile layout and dark theme |
| `js/sudoku.js` | Engine: solver, generator and difficulty grader (no DOM code) |
| `js/app.js` | Game UI: rendering, input, notes, undo and timer |
| `tests/` | Engine unit tests |
| `docs/` | Knowledge base explaining how the generator works |

## Tests

The tests need Node.js 18 or newer:

```sh
npm test
```

## How it works

The [docs](docs/README.md) explain the approach step by step. In short, the
engine:

1. builds a random solved grid with a backtracking solver
   ([docs](docs/03-generating-a-solved-grid.md));
2. removes clues in random order, keeping each removal only if the puzzle
   still has exactly one solution ([docs](docs/04-removing-clues.md));
3. grades the result with a human-style solver and retries until it matches
   the chosen difficulty ([docs](docs/05-difficulty-grading.md)).

The solver uses bitmasks and fills the most-constrained cell first
([docs](docs/06-performance.md)), so a puzzle generates in well under 50 ms.
