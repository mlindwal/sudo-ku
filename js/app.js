/*
 * Sudoku game UI: board rendering, input (keyboard, mouse, touch),
 * notes mode, undo, timer and difficulty selection.
 */
(function () {
  'use strict';

  const { PEERS, ROW, COL, DIFFICULTIES } = Sudoku;

  const $ = id => document.getElementById(id);
  const boardEl = $('board');
  const padEl = $('pad');
  const timerEl = $('timer');
  const difficultyEl = $('difficulty');
  const overlayEl = $('overlay');

  const state = {
    difficulty: 'easy',
    puzzle: [],        // clues, 0 for empty
    solution: [],
    values: [],        // current digits, including clues
    notes: [],         // 9-bit mask of pencil marks per cell
    selected: -1,
    notesMode: false,
    history: [],
    elapsed: 0,        // ms accumulated before `startedAt`
    startedAt: null,   // timestamp while the clock runs, else null
    paused: false,
    solved: false,
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

  // ---- Clock ---------------------------------------------------------------

  const elapsed = () => state.elapsed + (state.startedAt ? Date.now() - state.startedAt : 0);

  function startClock() {
    if (!state.startedAt) state.startedAt = Date.now();
  }

  function stopClock() {
    state.elapsed = elapsed();
    state.startedAt = null;
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
      counts[v]++;

      el.classList.toggle('given', state.puzzle[i] !== 0);
      el.classList.toggle('selected', i === sel);
      el.classList.toggle('peer', peers.has(i));
      el.classList.toggle('same', v !== 0 && v === selValue && i !== sel);
      el.classList.toggle('conflict', v !== 0 && PEERS[i].some(p => state.values[p] === v));

      value.textContent = v || '';
      for (let d = 1; d <= 9; d++) {
        const on = !v && (state.notes[i] & (1 << (d - 1)));
        notes[d - 1].textContent = on ? d : '';
        notes[d - 1].classList.toggle('match', Boolean(on) && d === selValue);
      }
      el.setAttribute('aria-label',
        `Row ${ROW[i] + 1}, column ${COL[i] + 1}, ${v ? v : 'empty'}${state.puzzle[i] ? ' (given)' : ''}`);
    }

    padButtons.forEach((button, k) => {
      const left = 9 - counts[k + 1];
      button.querySelector('.left').textContent = left > 0 ? left : '';
      button.disabled = left <= 0;
    });

    $('undo').disabled = state.history.length === 0 || state.solved;
    $('notes').setAttribute('aria-pressed', String(state.notesMode));
    $('notes-state').textContent = state.notesMode ? 'On' : 'Off';
    $('pause').textContent = state.paused ? '▶' : '❚❚';
    $('pause').setAttribute('aria-label', state.paused ? 'Resume' : 'Pause');
    $('pause').disabled = state.solved;
    boardEl.classList.toggle('paused', state.paused);
    renderClock();
  }

  function showOverlay(title, text, buttonLabel, onClick) {
    $('overlay-title').textContent = title;
    $('overlay-text').textContent = text;
    const button = $('overlay-button');
    button.textContent = buttonLabel;
    button.onclick = onClick;
    overlayEl.hidden = false;
  }

  const hideOverlay = () => { overlayEl.hidden = true; };

  // ---- Game actions --------------------------------------------------------

  const canEdit = () => !state.solved && !state.paused && state.selected >= 0;

  function snapshot() {
    state.history.push({
      values: state.values.slice(),
      notes: state.notes.slice(),
      selected: state.selected,
    });
  }

  function select(i) {
    if (state.paused || state.solved) return;
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
      } else {
        state.values[i] = d;
        state.notes[i] = 0;
        for (const p of PEERS[i]) state.notes[p] &= ~bit;
      }
      checkSolved();
    }
    render();
  }

  function erase() {
    if (!canEdit()) return;
    const i = state.selected;
    if (state.puzzle[i] || (!state.values[i] && !state.notes[i])) return;
    snapshot();
    state.values[i] = 0;
    state.notes[i] = 0;
    render();
  }

  function undo() {
    if (state.solved || state.paused || !state.history.length) return;
    const prev = state.history.pop();
    state.values = prev.values;
    state.notes = prev.notes;
    state.selected = prev.selected;
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

  function checkSolved() {
    if (!state.values.every((v, i) => v === state.solution[i])) return;
    stopClock();
    state.solved = true;
    state.selected = -1;

    const time = elapsed();
    const best = loadBest(state.difficulty);
    const isRecord = !best || time < best;
    if (isRecord) saveBest(state.difficulty, time);

    const label = DIFFICULTIES[state.difficulty].label;
    const detail = isRecord
      ? `${label} in ${formatTime(time)}: a new best time!`
      : `${label} in ${formatTime(time)}. Best: ${formatTime(best)}.`;
    showOverlay('Solved!', detail, 'Play again', () => newGame(state.difficulty));
  }

  function setPaused(paused) {
    if (state.solved || paused === state.paused) return;
    state.paused = paused;
    if (paused) {
      stopClock();
      showOverlay('Paused', `Time: ${formatTime(elapsed())}`, 'Resume', () => setPaused(false));
    } else {
      hideOverlay();
      startClock();
    }
    render();
  }

  const inProgress = () => !state.solved && state.history.length > 0;

  function newGame(difficulty) {
    const game = Sudoku.generate(difficulty);
    Object.assign(state, {
      difficulty,
      puzzle: game.puzzle,
      solution: game.solution,
      values: game.puzzle.slice(),
      notes: new Array(81).fill(0),
      selected: -1,
      history: [],
      elapsed: 0,
      startedAt: null,
      paused: false,
      solved: false,
    });
    difficultyEl.value = difficulty;
    $('difficulty-label').textContent = DIFFICULTIES[difficulty].label;
    hideOverlay();
    startClock();
    render();
  }

  function requestNewGame(difficulty) {
    if (inProgress() && !confirm('Start a new game? Your current progress will be lost.')) {
      difficultyEl.value = state.difficulty;
      return;
    }
    newGame(difficulty);
  }

  // ---- Event wiring --------------------------------------------------------

  $('new-game').addEventListener('click', () => requestNewGame(difficultyEl.value));
  difficultyEl.addEventListener('change', () => requestNewGame(difficultyEl.value));
  $('undo').addEventListener('click', undo);
  $('erase').addEventListener('click', erase);
  $('notes').addEventListener('click', toggleNotesMode);
  $('pause').addEventListener('click', () => setPaused(!state.paused));

  document.addEventListener('keydown', e => {
    if (e.target instanceof HTMLSelectElement) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (e.ctrlKey || e.metaKey) return;

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
    if (moves[e.key]) {
      e.preventDefault();
      move(...moves[e.key]);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      erase();
    } else if (e.key === 'n' || e.key === 'N') {
      toggleNotesMode();
    } else if (e.key === 'Escape') {
      select(-1);
    }
  });

  // Pause automatically when the tab is hidden so the clock stays fair.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
  });

  newGame(difficultyEl.value);
})();
