/*
 * Sudoku game UI: board rendering, input (keyboard, mouse, touch),
 * notes mode, undo, timer, pausing, mistakes, sound, difficulty selection,
 * saving the game in progress, and the light/dark theme switch.
 */
(function () {
  'use strict';

  const { PEERS, ROW, COL, DIFFICULTIES } = Sudoku;
  const Sound = SudokuSound;

  const $ = id => document.getElementById(id);
  const boardEl = $('board');
  const padEl = $('pad');
  const timerEl = $('timer');
  const overlayEl = $('overlay');
  const overlayButtonsEl = $('overlay-buttons');

  const state = {
    hasGame: false,    // false until the first difficulty is chosen
    difficulty: 'easy',
    puzzle: new Array(81).fill(0), // clues, 0 for empty
    solution: [],
    values: new Array(81).fill(0), // current digits, including clues
    notes: new Array(81).fill(0),  // 9-bit mask of pencil marks per cell
    selected: -1,
    notesMode: false,
    history: [],
    elapsed: 0,        // ms accumulated before `startedAt`
    startedAt: null,   // timestamp while the clock runs, else null
    paused: false,
    choosing: false,   // the difficulty picker is open
    mistakes: 0,       // wrong digits entered; never undone
    over: false,       // the game has ended, won or lost
  };

  // ---- Storage (best times) -----------------------------------------------

  function loadBest(difficulty) {
    try { return Number(localStorage.getItem(`sudo-ku.best.${difficulty}`)) || null; }
    catch { return null; }
  }

  function saveBest(difficulty, ms) {
    try { localStorage.setItem(`sudo-ku.best.${difficulty}`, String(ms)); }
    catch { /* storage unavailable: best times just aren't kept */ }
  }

  // ---- Storage (game in progress) -----------------------------------------

  const SAVE_KEY = 'sudo-ku.game';
  const SAVE_VERSION = 1;
  const MAX_SAVED_HISTORY = 100; // undo steps kept across reloads

  // Stores the game in progress, or removes it once the game has ended.
  function saveGame() {
    if (!state.hasGame) return;
    try {
      if (state.over) {
        localStorage.removeItem(SAVE_KEY);
        return;
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: SAVE_VERSION,
        difficulty: state.difficulty,
        puzzle: state.puzzle,
        solution: state.solution,
        values: state.values,
        notes: state.notes,
        mistakes: state.mistakes,
        notesMode: state.notesMode,
        elapsed: elapsed(),
        history: state.history.slice(-MAX_SAVED_HISTORY),
      }));
    } catch { /* storage full or unavailable: the game just isn't saved */ }
  }

  const isGrid = (a, max) =>
    Array.isArray(a) && a.length === 81 && a.every(n => Number.isInteger(n) && n >= 0 && n <= max);

  // Returns the saved game if there is a valid one, else null.
  function loadGame() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); }
    catch { return null; }
    if (!saved || saved.version !== SAVE_VERSION) return null;

    const spec = DIFFICULTIES[saved.difficulty];
    const { puzzle, solution, values, notes, mistakes, elapsed: time } = saved;
    const valid = spec &&
      isGrid(puzzle, 9) && isGrid(solution, 9) && isGrid(values, 9) && isGrid(notes, 0x1ff) &&
      !solution.includes(0) &&
      puzzle.every((v, i) => !v || (v === solution[i] && values[i] === v)) &&
      Number.isInteger(mistakes) && mistakes >= 0 && mistakes < spec.maxMistakes &&
      Number.isFinite(time) && time >= 0;
    if (!valid) return null;

    const history = (Array.isArray(saved.history) ? saved.history : []).filter(h =>
      h && isGrid(h.values, 9) && isGrid(h.notes, 0x1ff) && Number.isInteger(h.selected));
    return { ...saved, history, notesMode: saved.notesMode === true };
  }

  // Restores a saved game, paused, and asks whether to continue it.
  function restoreGame(saved) {
    Object.assign(state, {
      hasGame: true,
      difficulty: saved.difficulty,
      puzzle: saved.puzzle,
      solution: saved.solution,
      values: saved.values,
      notes: saved.notes,
      selected: -1,
      notesMode: saved.notesMode,
      history: saved.history,
      elapsed: saved.elapsed,
      startedAt: null,
      paused: true,
      choosing: false,
      mistakes: saved.mistakes,
      over: false,
    });
    const { label, maxMistakes } = DIFFICULTIES[saved.difficulty];
    showOverlay('Welcome back',
      `${label} · ${formatTime(saved.elapsed)} · Mistakes ${saved.mistakes}/${maxMistakes}`, [
        { label: 'Continue', className: 'primary', onClick: () => setPaused(false) },
        { label: 'New game', onClick: openChooser },
      ]);
    render();
  }

  // ---- Theme ---------------------------------------------------------------

  // 'auto' follows the system setting; the CSS reads data-theme on <html>.
  const THEME_KEY = 'sudo-ku.theme';
  const THEMES = {
    auto:  { icon: '🌓', label: 'follows system', next: 'light' },
    light: { icon: '☀️', label: 'light', next: 'dark' },
    dark:  { icon: '🌙', label: 'dark', next: 'auto' },
  };

  const currentTheme = () => document.documentElement.dataset.theme || 'auto';

  function setTheme(theme) {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    try {
      if (theme === 'auto') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, theme);
    } catch { /* not remembered */ }
    renderTheme();
  }

  function renderTheme() {
    const { icon, label, next } = THEMES[currentTheme()];
    const button = $('theme');
    button.textContent = icon;
    button.setAttribute('aria-label', `Theme: ${label}. Switch to ${THEMES[next].label}.`);
    button.title = `Theme: ${label}`;
  }

  const cycleTheme = () => setTheme(THEMES[currentTheme()].next);

  // ---- Clock ---------------------------------------------------------------

  const elapsed = () => state.elapsed + (state.startedAt ? Date.now() - state.startedAt : 0);

  // The clock runs only while a game is actually being played.
  function syncClock() {
    const running = state.hasGame && !state.paused && !state.choosing && !state.over;
    if (running && !state.startedAt) {
      state.startedAt = Date.now();
    } else if (!running && state.startedAt) {
      state.elapsed = elapsed();
      state.startedAt = null;
    }
  }

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }

  function renderClock() {
    timerEl.textContent = formatTime(elapsed());
  }

  setInterval(renderClock, 250);

  // ---- Board construction --------------------------------------------------

  const cells = [];
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('role', 'gridcell');
    if (COL[i] === 2 || COL[i] === 5) cell.classList.add('col-end');
    if (ROW[i] === 2 || ROW[i] === 5) cell.classList.add('row-end');

    const value = document.createElement('span');
    const notes = document.createElement('div');
    notes.className = 'notes';
    for (let d = 1; d <= 9; d++) notes.appendChild(document.createElement('span'));
    cell.append(value, notes);

    cell.addEventListener('click', () => select(i));
    cell.addEventListener('animationend', () => cell.classList.remove('shake'));
    boardEl.appendChild(cell);
    cells.push({ el: cell, value, notes: [...notes.children] });
  }

  const padButtons = [];
  for (let d = 1; d <= 9; d++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `${d}<span class="left"></span>`;
    button.addEventListener('click', () => enter(d, false));
    padEl.appendChild(button);
    padButtons.push(button);
  }

  // ---- Rendering -----------------------------------------------------------

  function render() {
    const sel = state.selected;
    const selValue = sel >= 0 ? state.values[sel] : 0;
    const peers = new Set(sel >= 0 ? PEERS[sel] : []);
    const counts = new Array(10).fill(0);

    for (let i = 0; i < 81; i++) {
      const v = state.values[i];
      const { el, value, notes } = cells[i];
      const wrong = v !== 0 && v !== state.solution[i];
      if (v && !wrong) counts[v]++;

      el.classList.toggle('given', state.puzzle[i] !== 0);
      el.classList.toggle('selected', i === sel);
      el.classList.toggle('peer', peers.has(i));
      el.classList.toggle('same', v !== 0 && v === selValue && i !== sel);
      el.classList.toggle('conflict', v !== 0 && PEERS[i].some(p => state.values[p] === v));
      el.classList.toggle('wrong', wrong);

      value.textContent = v || '';
      for (let d = 1; d <= 9; d++) {
        const on = !v && (state.notes[i] & (1 << (d - 1)));
        notes[d - 1].textContent = on ? d : '';
        notes[d - 1].classList.toggle('match', Boolean(on) && d === selValue);
      }
      el.setAttribute('aria-label',
        `Row ${ROW[i] + 1}, column ${COL[i] + 1}, ${v ? v : 'empty'}${state.puzzle[i] ? ' (given)' : ''}${wrong ? ' (wrong)' : ''}`);
    }

    const playing = state.hasGame && !state.over && !state.choosing;
    const editable = playing && !state.paused;
    padButtons.forEach((button, k) => {
      const left = 9 - counts[k + 1];
      button.querySelector('.left').textContent = state.hasGame && left > 0 ? left : '';
      button.disabled = !editable || left <= 0;
    });

    $('undo').disabled = !editable || state.history.length === 0;
    $('erase').disabled = !editable;
    $('notes').setAttribute('aria-pressed', String(state.notesMode));
    $('notes-state').textContent = state.notesMode ? 'On' : 'Off';
    $('pause').textContent = state.paused ? '▶' : '❚❚';
    $('pause').setAttribute('aria-label', state.paused ? 'Resume' : 'Pause');
    $('pause').disabled = !playing;
    $('difficulty-label').textContent = state.hasGame ? DIFFICULTIES[state.difficulty].label : '';
    const max = maxMistakes();
    $('mistakes').hidden = !state.hasGame;
    $('mistakes-count').textContent = `${state.mistakes}/${max}`;
    $('mistakes').classList.toggle('last-chance', state.hasGame && state.mistakes === max - 1);
    $('mistakes').setAttribute('aria-label', `Mistakes: ${state.mistakes} of ${max}`);
    const muted = Sound.isMuted();
    $('mute').textContent = muted ? '🔇' : '🔊';
    $('mute').setAttribute('aria-pressed', String(muted));
    $('mute').setAttribute('aria-label', muted ? 'Unmute sounds' : 'Mute sounds');
    boardEl.classList.toggle('paused', state.paused || state.choosing);
    renderClock();
    saveGame();
  }

  /*
   * Shows the overlay over the board. Each button is
   * { label, onClick, className?, html? }.
   */
  function showOverlay(title, text, buttons, layout = '') {
    $('overlay-title').textContent = title;
    $('overlay-text').textContent = text;
    overlayButtonsEl.className = `overlay-buttons ${layout}`.trim();
    overlayButtonsEl.replaceChildren(...buttons.map(({ label, html, onClick, className }) => {
      const button = document.createElement('button');
      button.type = 'button';
      if (html) button.innerHTML = html;
      else button.textContent = label;
      if (className) button.className = className;
      button.addEventListener('click', onClick);
      return button;
    }));
    overlayEl.hidden = false;
  }

  const hideOverlay = () => { overlayEl.hidden = true; };

  function showPausedOverlay() {
    showOverlay('Paused', `Time: ${formatTime(elapsed())}`,
      [{ label: 'Resume', className: 'primary', onClick: () => setPaused(false) }]);
  }

  // ---- Difficulty picker ---------------------------------------------------

  function openChooser() {
    if (state.choosing) return;
    state.choosing = true;
    syncClock();

    const canReturn = state.hasGame && !state.over;
    const buttons = Object.entries(DIFFICULTIES).map(([key, { label }]) => {
      const best = loadBest(key);
      return {
        className: 'level',
        html: best ? `${label}<small>Best ${formatTime(best)}</small>` : label,
        onClick: () => newGame(key),
      };
    });
    if (canReturn) {
      buttons.push({ label: 'Back to game', className: 'cancel', onClick: closeChooser });
    }

    showOverlay(
      state.hasGame ? 'New game' : 'Welcome to Sudo-ku',
      canReturn ? 'Choose a difficulty. Your current game will be lost.' : 'Choose a difficulty to start.',
      buttons, 'levels');

    // Focus the last-played level for keyboard users; skip on touch screens,
    // where the focus ring would look like a selection.
    if (matchMedia('(hover: hover)').matches) {
      overlayButtonsEl.children[Object.keys(DIFFICULTIES).indexOf(state.difficulty)].focus();
    }
    render();
  }

  // Returns to the game in progress without starting a new one.
  function closeChooser() {
    if (!state.choosing || !state.hasGame || state.over) return;
    state.choosing = false;
    if (state.paused) showPausedOverlay();
    else hideOverlay();
    syncClock();
    render();
  }

  // ---- Game actions --------------------------------------------------------

  const canEdit = () =>
    state.hasGame && !state.over && !state.paused && !state.choosing && state.selected >= 0;

  function snapshot() {
    state.history.push({
      values: state.values.slice(),
      notes: state.notes.slice(),
      selected: state.selected,
    });
  }

  function select(i) {
    if (!state.hasGame || state.paused || state.choosing || state.over) return;
    state.selected = i;
    render();
  }

  // Fills in a digit, or toggles a note when notes mode is on (or asNote).
  function enter(d, asNote) {
    if (!canEdit()) return;
    const i = state.selected;
    if (state.puzzle[i]) return;
    const bit = 1 << (d - 1);

    if (asNote || state.notesMode) {
      if (state.values[i]) return;
      snapshot();
      state.notes[i] ^= bit;
    } else {
      snapshot();
      if (state.values[i] === d) {
        state.values[i] = 0;
      } else if (d === state.solution[i]) {
        state.values[i] = d;
        state.notes[i] = 0;
        for (const p of PEERS[i]) state.notes[p] &= ~bit;
        if (!checkSolved()) Sound.play('correct');
      } else {
        // Keep the cell's notes so erasing the wrong digit brings them back.
        state.values[i] = d;
        state.mistakes++;
        if (!checkLost()) Sound.play('wrong');
        render();
        shake(i);
        return;
      }
    }
    render();
  }

  // Briefly shakes a cell to signal a wrong digit.
  function shake(i) {
    const el = cells[i].el;
    el.classList.remove('shake');
    void el.offsetWidth; // restart the animation if it is already running
    el.classList.add('shake');
  }

  function erase() {
    if (!canEdit()) return;
    const i = state.selected;
    if (state.puzzle[i] || (!state.values[i] && !state.notes[i])) return;
    snapshot();
    // Erasing a digit reveals any notes kept under it; erasing again clears them.
    if (state.values[i]) state.values[i] = 0;
    else state.notes[i] = 0;
    render();
  }

  function undo() {
    if (!state.hasGame || state.over || state.paused || state.choosing || !state.history.length) return;
    const prev = state.history.pop();
    state.values = prev.values;
    state.notes = prev.notes;
    state.selected = prev.selected;
    render();
  }

  function toggleMute() {
    Sound.setMuted(!Sound.isMuted());
    render();
  }

  function toggleNotesMode() {
    state.notesMode = !state.notesMode;
    render();
  }

  function move(dRow, dCol) {
    if (state.selected < 0) return select(40);
    const r = (ROW[state.selected] + dRow + 9) % 9;
    const c = (COL[state.selected] + dCol + 9) % 9;
    select(r * 9 + c);
  }

  const maxMistakes = () => DIFFICULTIES[state.difficulty].maxMistakes;

  // Ends the game as won when every cell is correct. Returns whether it did.
  function checkSolved() {
    if (!state.values.every((v, i) => v === state.solution[i])) return false;
    state.over = true;
    state.selected = -1;
    syncClock();

    const time = elapsed();
    const best = loadBest(state.difficulty);
    const isRecord = !best || time < best;
    if (isRecord) saveBest(state.difficulty, time);

    const label = DIFFICULTIES[state.difficulty].label;
    const detail = isRecord
      ? `${label} in ${formatTime(time)}: a new best time!`
      : `${label} in ${formatTime(time)}. Best: ${formatTime(best)}.`;
    showOverlay('Solved!', detail, [
      { label: `Play ${label} again`, className: 'primary', onClick: () => newGame(state.difficulty) },
      { label: 'Change difficulty', onClick: openChooser },
    ]);
    Sound.play('win');
    return true;
  }

  // Ends the game as lost when the mistake limit is reached. Returns whether it did.
  function checkLost() {
    const max = maxMistakes();
    if (state.mistakes < max) return false;
    state.over = true;
    state.selected = -1;
    syncClock();

    const label = DIFFICULTIES[state.difficulty].label;
    showOverlay('Game over', `You made ${max} mistakes on ${label}.`, [
      { label: 'Retry this puzzle', className: 'primary', onClick: restartPuzzle },
      { label: 'New game', onClick: openChooser },
    ]);
    Sound.play('lose');
    return true;
  }

  function setPaused(paused) {
    if (!state.hasGame || state.over || state.choosing || paused === state.paused) return;
    state.paused = paused;
    syncClock();
    if (paused) showPausedOverlay();
    else hideOverlay();
    render();
  }

  function newGame(difficulty) {
    const game = Sudoku.generate(difficulty);
    startGame(difficulty, game.puzzle, game.solution);
  }

  // Plays the current puzzle again from the start.
  function restartPuzzle() {
    startGame(state.difficulty, state.puzzle, state.solution);
  }

  function startGame(difficulty, puzzle, solution) {
    Object.assign(state, {
      hasGame: true,
      difficulty,
      puzzle,
      solution,
      values: puzzle.slice(),
      notes: new Array(81).fill(0),
      selected: -1,
      history: [],
      elapsed: 0,
      startedAt: null,
      paused: false,
      choosing: false,
      mistakes: 0,
      over: false,
    });
    hideOverlay();
    syncClock();
    render();
  }

  // ---- Event wiring --------------------------------------------------------

  $('new-game').addEventListener('click', openChooser);
  $('undo').addEventListener('click', undo);
  $('erase').addEventListener('click', erase);
  $('notes').addEventListener('click', toggleNotesMode);
  $('pause').addEventListener('click', () => setPaused(!state.paused));
  $('mute').addEventListener('click', toggleMute);
  $('theme').addEventListener('click', cycleTheme);

  document.addEventListener('keydown', e => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 't') {
      cycleTheme();
      return;
    }
    if (e.key === 'Escape') {
      if (state.choosing) closeChooser();
      else select(-1);
      return;
    }
    // Leave keys alone while the picker is open, so Tab/Enter work on its buttons.
    if (state.choosing) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey && !/^(Digit|Numpad)/.test(e.code)) return;

    // e.code keeps Shift+1 as a digit (e.key would be "!").
    const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code) || /^([0-9])$/.exec(e.key);
    if (m) {
      e.preventDefault();
      const d = Number(m[1]);
      if (d === 0) erase();
      else enter(d, e.shiftKey || e.altKey);
      return;
    }

    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const key = e.key.toLowerCase();
    if (moves[e.key]) {
      e.preventDefault();
      move(...moves[e.key]);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      erase();
    } else if (key === 'n') {
      toggleNotesMode();
    } else if (key === 'p') {
      setPaused(!state.paused);
    } else if (key === 'm') {
      toggleMute();
    }
  });

  // Pause automatically when the tab is hidden so the clock stays fair.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      setPaused(true);
      saveGame();
    }
  });

  // Keep the saved time current while playing, and save on the way out.
  setInterval(() => { if (state.startedAt) saveGame(); }, 5000);
  addEventListener('pagehide', saveGame);

  renderTheme();

  const saved = loadGame();
  if (saved) {
    restoreGame(saved);
  } else {
    render();
    openChooser();
  }
})();
