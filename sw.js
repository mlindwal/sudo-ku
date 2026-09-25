/*
 * Service worker: makes the game work offline.
 *
 * All game files are cached on install. While online, every request goes to
 * the network first and is revalidated with the server (cache: 'no-cache'),
 * and is served with "Cache-Control: no-cache" (see withNoCache), so the
 * page, styles and scripts always come from the same deployment. The
 * cached copies are used only when the network fails or is too slow.
 *
 * (Serving from the cache first and refreshing in the background mixed files
 * from different deployments, e.g. new HTML with old CSS, after an update.)
 *
 * Bump CACHE_VERSION when adding, removing or renaming files in FILES.
 */
const CACHE_VERSION = 2;
const CACHE = `sudo-ku-v${CACHE_VERSION}`;
const NETWORK_TIMEOUT_MS = 4000;

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
  event.respondWith(networkFirst(request));
});

/*
 * The server lets browsers reuse files for a while (GitHub Pages sends
 * max-age=600). Chrome's in-memory cache honours that for files the service
 * worker returns, skipping the worker on the next load, so an old stylesheet
 * could be reused with a new page. "no-cache" makes every load come back here.
 */
function withNoCache(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-cache');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  // Page loads (e.g. "./?source=pwa") are all stored as index.html.
  const key = request.mode === 'navigate' ? 'index.html' : request;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    // A new Request is needed: navigation requests can't take other options.
    const response = await fetch(request.url, {
      cache: 'no-cache',
      credentials: 'same-origin',
      signal: controller.signal,
    });
    if (!response.ok) return response;
    const fresh = withNoCache(response);
    await cache.put(key, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(key, { ignoreSearch: true });
    return cached || Response.error();
  } finally {
    clearTimeout(timer);
  }
}
