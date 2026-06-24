const CACHE_NAME = "rythu-sethu-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png"
];

// Install: pre-cache critical shell assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate: clean old caches and take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Fetch: Network-first for API, Stale-while-revalidate for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests (POST, PUT, DELETE)
  if (request.method !== "GET") return;

  // Skip chrome-extension, ws://, and other non-http requests
  if (!request.url.startsWith("http")) return;

  const url = new URL(request.url);

  // --- Strategy 1: Network-only for API calls ---
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: "You are offline. Please check your internet connection." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // --- Strategy 2: Skip external requests (Google Fonts, Google Translate, CDNs) ---
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request).catch(() => {
        // External resource unavailable offline — return empty response to avoid crash
        return new Response("", { status: 200, headers: { "Content-Type": "text/plain" } });
      })
    );
    return;
  }

  // --- Strategy 3: Stale-while-revalidate for app shell & assets ---
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Cache successful same-origin responses dynamically
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network completely unavailable — return nothing (cachedResponse is used if available)
          return undefined;
        });

      // Return cached version immediately, update cache in background
      return cachedResponse || fetchPromise;
    }).then((response) => {
      // Final fallback: if both cache and network fail, serve the cached index.html
      // This is critical for SPA navigation — any route like /farmer, /marketplace etc.
      // needs to resolve to index.html so React Router can handle it client-side.
      if (!response || response.status === 404) {
        return caches.match("/index.html");
      }
      return response;
    })
  );
});
