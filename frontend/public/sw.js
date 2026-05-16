const STATIC_CACHE = 'onyx-static-v2';
const MEDIA_CACHE = 'onyx-media-v2';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.ico', '/favicon.png', '/assets/logo.png', '/assets/fondo.jpg'];

function streamCacheKey(url) {
  return url.origin + url.pathname;
}

function isStream(url) {
  return url.pathname.startsWith('/api/stream/');
}

function isCover(url) {
  return url.pathname.startsWith('/api/cover/');
}

function isApi(url) {
  return url.pathname.startsWith('/api/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== MEDIA_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (isCover(url)) {
    event.respondWith(cacheFirstMedia(event.request, streamCacheKey(url)));
    return;
  }

  if (isStream(url)) {
    event.respondWith(streamHandler(event.request, streamCacheKey(url)));
    return;
  }

  if (isApi(url)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

async function cacheFirstMedia(request, key) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(key);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(key, response.clone());
  }
  return response;
}

async function streamHandler(request, key) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(key);

  if (cached) {
    const range = request.headers.get('Range');
    if (!range) return cached;
    return sliceCachedResponse(cached, range);
  }

  const response = await fetch(request);
  if (response.ok && response.status === 200) {
    await cache.put(key, response.clone());
  }
  return response;
}

async function sliceCachedResponse(response, rangeHeader) {
  const blob = await response.blob();
  const size = blob.size;
  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!m) return new Response(blob, { status: 200, headers: response.headers });

  const start = m[1] ? parseInt(m[1], 10) : 0;
  const end = m[2] ? parseInt(m[2], 10) : size - 1;
  const slice = blob.slice(start, Math.min(end + 1, size));

  return new Response(slice, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${start + slice.size - 1}/${size}`,
      'Content-Length': String(slice.size),
    },
  });
}
