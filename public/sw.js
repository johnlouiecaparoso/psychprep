const APP_SHELL_CACHE = "psychboard-app-shell-v4";
const PAGE_CACHE = "psychboard-pages-v4";
const DATA_CACHE = "psychboard-data-v4";
const OFFLINE_URL = "/offline";
const LAST_PAGE_FALLBACK_KEY = "/__offline-last-page__";
const STATIC_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest";
}

function isRouteDataRequest(url) {
  return url.searchParams.has("_rsc") || url.pathname.startsWith("/_next/");
}

async function rememberLastPage(request, response) {
  if (!response || response.status !== 200) {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.pathname === OFFLINE_URL) {
    return;
  }

  const cache = await caches.open(PAGE_CACHE);
  await cache.put(LAST_PAGE_FALLBACK_KEY, response.clone());
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, PAGE_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(event.request, responseClone));
          void rememberLastPage(event.request, response.clone());
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          const lastKnownPage = await caches.match(LAST_PAGE_FALLBACK_KEY);

          if (requestUrl.pathname === "/") {
            return lastKnownPage || cachedPage || caches.match(OFFLINE_URL);
          }

          return cachedPage || lastKnownPage || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (isStaticAsset(requestUrl)) {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
    );
    return;
  }

  if (isRouteDataRequest(requestUrl)) {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        } catch {
          return cachedResponse || caches.match(OFFLINE_URL);
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      } catch {
        return cachedResponse || caches.match(OFFLINE_URL);
      }
    })
  );
});
