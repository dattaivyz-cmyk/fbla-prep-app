// Service worker for the MRHS FBLA prep app.
//
// Deliberately conservative. It caches only the app shell - the HTML, JS and
// CSS Vite builds - so the app opens instantly and still opens with no signal.
// It never caches Supabase or /api responses, because a student's answers,
// their progress and the questions themselves must always come from the
// network. A cached question bank would show stale questions after a reload
// and a cached progress response would show a student the wrong mastery.
//
// Bump CACHE_VERSION on every deploy that changes the build, or returning
// phones keep serving the old shell.

const CACHE_VERSION = 'fbla-shell-v1';

self.addEventListener('install', (event) => {
  // Take over as soon as the new worker is ready rather than waiting for
  // every tab to close, which on a phone can be never.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Anything that is not this origin is left alone: Supabase, the API routes,
  // fonts from a CDN. Those go straight to the network, every time.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: try the network first so a deploy is picked up immediately,
  // fall back to the cached shell when the phone is offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((c) => c.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Build assets are content-hashed by Vite, so a cache hit is always the
  // right file. Serve from cache, fill the cache on a miss.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
        }
        return response;
      });
    })
  );
});
