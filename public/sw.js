/*
 * Minimal service worker for Driveway Advocate.
 *
 * Goal: satisfy PWA installability (a fetch handler + manifest) and give a
 * graceful offline fallback for navigations — WITHOUT aggressively caching app
 * responses (which would serve stale builds after a deploy). Strategy is
 * network-first; we only fall back to a cached landing page when truly offline.
 */
const CACHE = "da-shell-v1";
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Network-first for page navigations; offline → cached landing page.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(OFFLINE_URL, copy));
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }
  // Everything else: straight to network (no stale caching).
});
