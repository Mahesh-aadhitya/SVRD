const CACHE_NAME = "temple-app-shell-v11";

// Local / LAN dev servers reuse the same /_next/static URLs while their
// contents change, so a cache-first worker there serves stale CSS and JS
// indefinitely. On those hosts the worker clears its caches and removes
// itself instead of caching anything.
const IS_DEV_HOST = /^(localhost|127\.|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(self.location.hostname);
const OFFLINE_URL = "/offline.html";

// Sign-in callbacks, API routes and per-user pages carry one-time codes,
// redirects and cookies, so the worker never touches them.
const NETWORK_ONLY = /^\/((en|kn)\/)?(api|auth|login|account|admin)(\/|$)/;

const APP_SHELL = [
  "/",
  OFFLINE_URL,
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/images/emblem-chakra.png",
  "/images/emblem-full.png",
];

self.addEventListener("install", (event) => {
  if (IS_DEV_HOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  // Each file is cached on its own and failures are ignored: one missing
  // file must never stop this worker installing, or phones would stay on
  // an older, broken worker.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  if (IS_DEV_HOST) {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ type: "window" }))
        .then((clients) => clients.forEach((client) => client.navigate(client.url)))
    );
    return;
  }
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function cacheCopy(request, response) {
  const copy = response.clone();
  caches
    .open(CACHE_NAME)
    .then((cache) => cache.put(request, copy))
    .catch(() => {});
}

// Network-first for navigations (so content stays fresh), falling back to
// cache and then the offline page when there is no connection at all.
// Cache-first only for assets whose URL changes when their content does
// (Next's hashed build files) and for images/fonts; everything else goes
// to the network so a new deploy is never hidden behind an old copy.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (IS_DEV_HOST || request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NETWORK_ONLY.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only plain 200 pages are cached — never redirects or errors.
          if (response.status === 200 && response.type === "basic" && !response.redirected) {
            cacheCopy(request, response);
          }
          return response;
        })
        // respondWith must never resolve to undefined (Safari shows
        // "Returned response is null"), so fall back to the cached page,
        // then the offline page, then a plain network error.
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
            .then((fallback) => fallback || Response.error())
        )
    );
    return;
  }

  const immutable =
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|svg|jpg|jpeg|webp|woff2?)$/.test(url.pathname);
  if (immutable) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.status === 200) cacheCopy(request, response);
            return response;
          })
      )
    );
  }
});
