/*
 * Progressive web app support: registers the offline service worker and
 * shows an "Install app" button.
 *
 * Chrome, Edge and Samsung Internet (Android and desktop) let the page open
 * their install prompt. Safari on iPhone, iPad and Mac doesn't, so there the
 * button shows how to add the game from the Share menu instead.
 */
(function () {
  'use strict';

  // Service workers need http(s); opening index.html as a file skips this.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
    });
  }

  const button = document.getElementById('install');
  const dialog = document.getElementById('install-dialog');
  const steps = document.getElementById('install-steps');

  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, but Macs have no touch screen.
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isMacSafari = !isIOS && /Macintosh/.test(ua) && /Version\/[\d.]+.*Safari/.test(ua);
  const isAndroid = /Android/.test(ua);

  const isInstalled = () =>
    matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  const SHARE_ICON = `<svg class="step-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2"/></svg>`;
  const ADD_ICON = `<svg class="step-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>`;

  const INSTRUCTIONS = {
    ios: [
      `Tap the <b>Share</b> button ${SHARE_ICON} in the browser toolbar (at the bottom on iPhone, at the top on iPad).`,
      `Scroll down and tap <b>Add to Home Screen</b> ${ADD_ICON}.`,
      'Tap <b>Add</b>. Sudo-ku appears on your Home Screen and works offline.',
    ],
    mac: [
      `In the menu bar, choose <b>File</b> → <b>Add to Dock</b>, or click the <b>Share</b> button ${SHARE_ICON} and choose <b>Add to Dock</b>.`,
      'Click <b>Add</b>. Sudo-ku opens from the Dock like any other app and works offline.',
    ],
    other: [
      'Open your browser’s menu (⋮).',
      'Choose <b>Install app</b> or <b>Add to Home screen</b>.',
    ],
  };

  let deferredPrompt = null;

  function update() {
    button.hidden = isInstalled() || !(deferredPrompt || isIOS || isMacSafari || isAndroid);
  }

  // Chromium-based browsers: keep their install prompt for the button.
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    update();
  });

  addEventListener('appinstalled', () => {
    deferredPrompt = null;
    button.hidden = true;
    if (dialog.open) dialog.close();
  });

  button.addEventListener('click', async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null; // each prompt can only be shown once
      prompt.prompt();
      await prompt.userChoice;
      update();
      return;
    }
    const platform = isIOS ? 'ios' : isMacSafari ? 'mac' : 'other';
    steps.innerHTML = INSTRUCTIONS[platform].map(step => `<li>${step}</li>`).join('');
    dialog.showModal();
  });

  // Clicking the backdrop closes the dialog.
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  update();
})();
