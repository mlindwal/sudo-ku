/*
 * Sound effects, synthesized with the Web Audio API (no audio files).
 *
 * Exposes `window.SudokuSound` with play(name), isMuted() and setMuted().
 * The mute setting is remembered between visits.
 */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'sudo-ku.muted';

  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* default: sound on */ }

  // Browsers only allow audio after a user gesture, so the context is created
  // on the first sound, which is always triggered by a click or key press.
  function audio() {
    if (!ctx) {
      const AudioContext = root.AudioContext || root.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.3;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // One note with a short attack and exponential fade-out.
  function tone(freq, start, duration, { type = 'sine', volume = 0.6, glideTo } = {}) {
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  // Note frequencies in Hz.
  const B3 = 246.94, C4 = 261.63, E4 = 329.63, G4 = 392.0;
  const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;

  const SOUNDS = {
    // A bright upward blip.
    correct() {
      tone(E5, 0, 0.12, { glideTo: G5 });
      tone(C6, 0.05, 0.14, { volume: 0.25 });
    },
    // A low, buzzy downward thud.
    wrong() {
      tone(200, 0, 0.25, { type: 'square', volume: 0.18, glideTo: 110 });
      tone(140, 0, 0.25, { type: 'sine', volume: 0.5, glideTo: 90 });
    },
    // A rising major arpeggio ending on a held chord.
    win() {
      [C5, E5, G5].forEach((f, k) => tone(f, k * 0.11, 0.2, { type: 'triangle' }));
      [C5, E5, G5, C6].forEach(f => tone(f, 0.33, 0.9, { type: 'triangle', volume: 0.3 }));
    },
    // A slow falling phrase that sinks below where it started.
    lose() {
      [G4, E4, C4].forEach((f, k) => tone(f, k * 0.22, 0.3, { type: 'triangle' }));
      tone(B3, 0.66, 0.9, { type: 'triangle', glideTo: B3 * 0.94 });
    },
  };

  const SudokuSound = {
    // Plays a sound by name. Returns true if it played.
    play(name) {
      if (muted || !SOUNDS[name] || !audio()) return false;
      SOUNDS[name]();
      return true;
    },
    isMuted: () => muted,
    setMuted(value) {
      muted = Boolean(value);
      try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0'); } catch { /* not remembered */ }
    },
  };

  root.SudokuSound = SudokuSound;
})(typeof self !== 'undefined' ? self : this);
