/**
 * HymnNaija — service worker.
 * Strategy:
 *  - App shell (HTML/CSS/JS/icons/manifest): precached on install, served
 *    cache-first so the app opens instantly and works with no connection.
 *  - Hymn data (/data/*.json): stale-while-revalidate — answer instantly
 *    from cache, then refresh the cache in the background when online, so
 *    newly added/edited hymn collections show up on the next visit.
 *  - Page navigations: network-first with a cache fallback, and a final
 *    fallback to offline.html if nothing is cached yet for that page.
 *
 * Bump CACHE_VERSION whenever any precached file changes so old caches are
 * cleaned up and clients pick up the new files.
 */

const CACHE_VERSION = "v2";
const SHELL_CACHE = "hymnnaija-shell-" + CACHE_VERSION;
const DATA_CACHE = "hymnnaija-data-" + CACHE_VERSION;

const SHELL_URLS = [
  "./",
  "about.html",
  "browse.html",
  "denomination.html",
  "favorites.html",
  "index.html",
  "offline.html",
  "privacy.html",
  "reader.html",
  "search.html",
  "settings.html",
  "terms.html",
  "manifest.json",
  "favicon.ico",
  "css/styles.css",
  "js/app.bundle.js",
  "assets/icons/icon-72.png",
  "assets/icons/icon-96.png",
  "assets/icons/icon-128.png",
  "assets/icons/icon-144.png",
  "assets/icons/icon-152.png",
  "assets/icons/icon-167.png",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-384.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png",
];

const DATA_URLS = [
  "data/denominations.json",
  "data/cac_en.json",
  "data/cac_yo.json",
  "data/methodist_en.json",
  "data/rccg_en.json",
  "data/rccg_yo.json",
  "data/ccc_en.json",
  "data/ccc_yo.json",
  "data/catholic_en.json",
  "data/anglican_en.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.addAll(SHELL_URLS);
      const dataCache = await caches.open(DATA_CACHE);
      await dataCache.addAll(DATA_URLS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== DATA_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isDataRequest(url) {
  return url.pathname.indexOf("/data/") !== -1 && url.pathname.endsWith(".json");
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match("offline.html");
    return offline || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin requests pass through untouched

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isDataRequest(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
