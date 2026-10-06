const CACHE_NAME = "temple-app-shell-v8";

// Local / LAN dev servers reuse the same /_next/static URLs while their
// contents change, so a cache-first worker there serves stale CSS and JS
// indefinitely. On those hosts the worker clears its caches and removes
// itself instead of caching anything.
const IS_DEV_HOST = /^(localhost|127\.|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(self.location.hostname);
const OFFLINE_URL = "/offline.html";

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
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
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

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(
          () =>
            caches.match(request).then((cached) => cached) ||
            caches.match(OFFLINE_URL)
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
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
