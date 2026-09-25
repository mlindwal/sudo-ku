# Sudo-ku

Sudoku in plain JavaScript and HTML. There are no dependencies and no build
step.

## Play

Open `index.html` in a browser. It works straight from the file system, or
from any static host such as GitHub Pages.

### Install as an app and play offline

When served over `https://` (for example from GitHub Pages), Sudo-ku is a
progressive web app. It can be installed like an app and works without an
internet connection once it has loaded once.

- **Chrome, Edge and Samsung Internet** (Android and desktop): press
  **Install app** below the number pad to open the browser's install prompt.
- **Safari on iPhone and iPad:** Safari doesn't let pages show an install
  prompt, so **Install app** shows how to do it: tap **Share**, then **Add to
  Home Screen**.
- **Safari on Mac:** **Install app** shows how to use **File → Add to Dock**.

The button is hidden once the game is installed, and in browsers that can't
install web apps, such as Firefox on desktop.

On iPhone and iPad, the Home Screen app keeps its own storage, separate from
Safari. A game saved in Safari won't appear in the installed app, and the
reverse.

Offline support doesn't work when `index.html` is opened directly from the
file system, because browsers only run service workers over `http(s)`.

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
- **Hints.** Press **Hint** (or `H`) for the next logical move, explained in
  plain words, with the cells it involves highlighted. **Fill in** places the
  digit. Hints start from the digits on the board (not your notes) and use
  the simplest technique that works:
  - singles, pointing pairs, box/line reduction, and naked and hidden pairs
    and triples (the techniques that define Easy to Hard);
  - for Expert: X-Wing, Swordfish and Jellyfish, Skyscraper, 2-String Kite,
    Turbot Fish, XY-Wing, XYZ-Wing, W-Wing, Unique Rectangle and XY-Chain;
  - as a last resort, a "what if" chain: *suppose this cell were 7; then …
    and column 6 would have nowhere left for a 3, so it can't be 7.*

  A hint explains every step the move depends on, and only those. Long hints
  show their first steps and conclusion, with the rest behind **Show more
  steps**. A wrong digit on the board is pointed out first. Games solved with
  hints don't count toward best times.
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
- **Light and dark themes.** By default the theme follows your system
  setting. The theme button in the header (or `T`) cycles between
  **Auto** 🌓 (follow the system), **Light** ☀️ and **Dark** 🌙. Your choice
  is remembered and applied before the page is drawn, so it never flashes
  the wrong colors.
- A **Source code** button under the number pad opens this repository in a
  new tab.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `1`–`9` | Fill in the selected cell (or add a note in notes mode) |
| `Shift` + `1`–`9` | Add or remove a note |
| Arrow keys | Move the selection |
| `Backspace`, `Delete`, `0` | Erase |
| `N` | Toggle notes mode |
| `H` | Show or hide a hint |
| `P` | Pause or resume |
| `M` | Mute or unmute sounds |
| `T` | Switch theme: Auto → Light → Dark |
| `Ctrl`/`Cmd` + `Z` | Undo |
| `Esc` | Close a hint, deselect, or close the difficulty picker and return to the game |

## Project layout

| Path | Contents |
|---|---|
| `index.html` | Page markup |
| `css/style.css` | Styles, including the mobile layout and dark theme |
| `img/` | Favicon and logo (`favicon.svg`), plus PNG app icons rendered from it |
| `js/sudoku.js` | Engine: solver, generator, difficulty grader and hints (no DOM code) |
| `js/sound.js` | Sound effects synthesized with the Web Audio API |
| `js/pwa.js` | Registers the service worker and runs the **Install app** button |
| `js/app.js` | Game UI: rendering, input, notes, undo, hints, timer, pausing, mistakes, the difficulty picker, saving the game and the theme switch |
| `manifest.webmanifest` | Web app manifest: name, icons and colors for installing |
| `sw.js` | Service worker that caches the game for offline play |
| `scripts/render-icons.js` | Renders the PNG icons from `img/favicon.svg` (needs Playwright) |
| `tests/` | Engine unit tests |
| `docs/` | Knowledge base: how the generator works, and every solving technique the hints use |

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

## Updating the offline version

While online, the service worker always loads the game from the server
(checking with it for changes), so players get a new version as soon as it's
published. The cached copy is used only when there's no connection or the
server doesn't answer within 4 seconds. If you add, remove or rename a file the game needs, add it to
`FILES` in `sw.js` and increase `CACHE_VERSION`.
