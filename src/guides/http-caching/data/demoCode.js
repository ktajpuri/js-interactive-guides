export const CACHE_CONTROL_CODE = `// Cache-Control directives — what each does:
//
// max-age=N            Fresh for N seconds (browser cache)
// s-maxage=N           Fresh for N seconds (shared/CDN cache only — overrides max-age there)
// public               OK to cache in shared caches (CDN, proxies)
// private              Browser cache only, not shared caches
// no-cache             MUST revalidate with origin before using (304 path)
// no-store             Never cache, anywhere
// must-revalidate      Once stale, MUST go to origin (no serving stale)
// immutable            Promise: content never changes. Browser never revalidates.
// stale-while-revalidate=N   Serve stale up to N seconds while fetching fresh in background
//
// Common patterns:
//   Static assets w/ hash:  Cache-Control: public, max-age=31536000, immutable
//   HTML:                   Cache-Control: no-cache    (always revalidate)
//   API responses:          Cache-Control: private, max-age=60, stale-while-revalidate=300
//   Sensitive data:         Cache-Control: no-store

// Send from your server (Node example):
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');`;

export const ETAG_CODE = `// ETag: a fingerprint of the resource (typically hash of body).
// Client sends If-None-Match on subsequent requests.
// Server returns 304 Not Modified (no body) if unchanged.

// Server (Node):
const etag = '"' + crypto.createHash('sha1').update(body).digest('hex') + '"';
res.setHeader('ETag', etag);

if (req.headers['if-none-match'] === etag) {
  res.status(304).end();
  return;
}
res.send(body);

// Client side — happens automatically. The browser:
//   1. First request: GET /file → 200, body, ETag: "abc"
//   2. Cache entry stored with ETag.
//   3. Next request (cache stale): GET /file, If-None-Match: "abc"
//      → 304 with empty body (~200 bytes) → use cached body.
//      → OR 200 with new body if changed.
//
// Bytes saved on a 304: full body − ~200 bytes of headers.
// For a 50KB asset, that's 99.6% bandwidth savings on unchanged content.`;

export const SWR_CODE = `// stale-while-revalidate: serve stale instantly, refresh in background.
// Cache-Control: max-age=60, stale-while-revalidate=300
//
// Timeline for a single cached resource:
//   t=0      First request → 200, store in cache. Fresh window starts.
//   t=30s    Request → served from cache (fresh). No network.
//   t=90s    Request → max-age expired, but within SWR window.
//            → Browser serves stale cached copy IMMEDIATELY (0ms).
//            → Browser kicks off a background fetch to revalidate.
//            → Cache updated with fresh response.
//   t=120s   Request → served from cache (now fresh again).
//   t=400s   Request → both max-age and SWR window expired.
//            → Browser blocks request to fetch fresh. (Like first request.)
//
// Best for content that is not time-critical and benefits from instant response:
// - User avatars
// - Product listings
// - News feeds
// - API responses where 5 minutes of staleness is acceptable`;

export const SW_STRATEGY_CODE = `// Service Worker cache strategies — the 5 canonical patterns.
// Pick based on freshness requirements and offline support.

// CACHE FIRST — use cache if available, fall back to network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  const cache = await caches.open('v1');
  cache.put(request, fresh.clone());
  return fresh;
}

// NETWORK FIRST — try network, fall back to cache (offline support)
async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open('v1');
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return caches.match(request);
  }
}

// STALE WHILE REVALIDATE — return cache, refresh in background
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(fresh => {
    caches.open('v1').then(cache => cache.put(request, fresh.clone()));
    return fresh;
  });
  return cached || fetchPromise;
}

// NETWORK ONLY — bypass cache entirely (e.g., POST, sensitive data)
async function networkOnly(request) {
  return fetch(request);
}

// CACHE ONLY — offline-first; assets pre-cached in install event
async function cacheOnly(request) {
  return caches.match(request);
}

// When to use:
//   Cache First:    versioned assets (CSS/JS with hash in filename)
//   Network First:  HTML / fresh data, with offline fallback
//   SWR:            non-critical APIs (avatars, listings)
//   Network Only:   POST, login, payment
//   Cache Only:     installed app shell, fully offline assets`;
