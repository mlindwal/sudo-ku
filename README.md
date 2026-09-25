# Sudo-ku

Sudoku in plain JavaScript and HTML. There are no dependencies and no build
step.

## Play

Open `index.html` in a browser. It works straight from the file system, or
from any static host such as GitHub Pages.

## Features

- **Four difficulty levels.** You choose one when the page opens and each
  time you press **New game**. Every puzzle is freshly generated and has
  exactly one solution. Each level is defined by the solving techniques it
  needs:
  - **Easy:** about 38 clues; naked and hidden singles are enough.
  - **Medium:** about 31 clues; singles are enough.
  - **Hard:** minimal puzzles that need pointing pairs, box/line reduction,
    or naked/hidden pairs and triples.
  - **Expert:** minimal puzzles that need techniques beyond those.
- **Clock** that counts the time spent on the game. It pauses when you press
  the pause button or `P`, or switch tabs, and it doesn't run while the
  difficulty picker is open. The board is hidden while paused. Your best time
  for each difficulty is saved and shown in the difficulty picker.
- **Mistake limit.** Each digit you enter is checked against the solution.
  A wrong digit turns red and counts as a mistake. Mistakes can't be undone.
  You lose when you reach the limit: 5 mistakes on Easy and Medium, 3 on Hard
  and Expert. You can then retry the same puzzle or start a new game. Notes
  never count as mistakes.
- **Sound effects** for correct and wrong digits, and a jingle when you win
  or lose. They're synthesized in the browser, so there are no audio files.
  The mute button (or `M`) silences them, and the setting is remembered.
- **Notes mode** toggle to switch between filling in digits and adding
  pencil marks.
- **Keyboard or on-screen number pad** input. The pad shows how many of each
  digit are left to place correctly.
- Undo, erase (a wrong digit's notes come back when you erase it), and
  highlighting of the selected cell's row, column and box,
  of matching digits, and of conflicting digits.
- **Your game is saved** in the browser (`localStorage`) as you play. If you
  reload, close the tab, or come back later, a **Welcome back** screen shows
  the difficulty, time and mistakes so far. Choose **Continue** to pick up
  where you left off, including notes, mistakes and the last 100 undo steps,
  or **New game** to start over. The clock doesn't count time spent away.
  The save is cleared when a game is won or lost.
- Light and dark themes that follow your system setting.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `1`–`9` | Fill in the selected cell (or add a note in notes mode) |
| `Shift` + `1`–`9` | Add or remove a note |
| Arrow keys | Move the selection |
| `Backspace`, `Delete`, `0` | Erase |
| `N` | Toggle notes mode |
| `P` | Pause or resume |
| `M` | Mute or unmute sounds |
| `Ctrl`/`Cmd` + `Z` | Undo |
| `Esc` | Deselect, or close the difficulty picker and return to the game |

## Project layout

| Path | Contents |
|---|---|
| `index.html` | Page markup |
| `css/style.css` | Styles, including the mobile layout and dark theme |
| `js/sudoku.js` | Engine: solver, generator and difficulty grader (no DOM code) |
| `js/sound.js` | Sound effects synthesized with the Web Audio API |
| `js/app.js` | Game UI: rendering, input, notes, undo, timer, pausing, mistakes, the difficulty picker and saving the game |
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
