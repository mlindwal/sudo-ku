/*
 * Service worker: makes the game work offline.
 *
 * All game files are cached on install. Requests are answered from the
 * cache straight away, and the cache is refreshed from the network in the
 * background, so an update shows up on the next visit after it's published.
 *
 * Bump CACHE_VERSION when adding, removing or renaming files in FILES.
 */
const CACHE_VERSION = 1;
const CACHE = `sudo-ku-v${CACHE_VERSION}`;

const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/sudoku.js',
  'js/sound.js',
  'js/app.js',
  'js/pwa.js',
  'img/favicon.svg',
  'img/favicon-32.png',
  'img/apple-touch-icon.png',
  'img/icon-192.png',
  'img/icon-512.png',
  'img/icon-maskable-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()));
});

// Remove caches from older versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('sudo-ku-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Page loads (e.g. "./?source=pwa") are all served by the cached index.html.
    const key = request.mode === 'navigate' ? 'index.html' : request;
    const cached = await cache.match(key, { ignoreSearch: true });

    const refresh = fetch(request)
      .then(response => {
        if (response.ok) cache.put(key, response.clone());
        return response;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(refresh);
      return cached;
    }
    return (await refresh) || Response.error();
  })());
});
