const CACHE_NAME = "rythu-sethu-v5";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png"
];

// Install: pre-cache critical shell assets and skip waiting
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate: purge old caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy dispatch
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
        return new Response("", { status: 200, headers: { "Content-Type": "text/plain" } });
      })
    );
    return;
  }

  // --- Strategy 3: Network-First for HTML navigations (ensures Vercel updates load immediately) ---
  const isNavigate = request.mode === "navigate" || (request.headers.get("accept") && request.headers.get("accept").includes("text/html"));
  if (isNavigate) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(request).then((cached) => cached || caches.match("/index.html"));
        })
    );
    return;
  }

  // --- Strategy 4: Stale-while-revalidate for static assets ---
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => undefined);

      return cachedResponse || fetchPromise;
    }).then((response) => {
      if (!response || response.status === 404) {
        return caches.match("/index.html");
      }
      return response;
    })
  );
});
