// PWA Service Worker — network-first HTML + SWR for JS/CSS
// v5 — sürüm artırıldı
const CACHE = 'yol-v5';

// Önbelleğe alınacak minimum dosyalar (isteğe bağlı)
const PRECACHE = [
  './',
  'index.html',
  'manifest.json',
  'apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Yardımcılar
const isHTML = (req) =>
  req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html');

const isSameOrigin = (url) => {
  try { return new URL(url).origin === self.location.origin; }
  catch { return false; }
};

const isAsset = (url) => /\.(?:js|css|json|map)$/i.test(url);

// Fetch stratejileri:
// 1) HTML: network-first (offline’da cache’e düş)
// 2) Aynı origin JS/CSS/JSON: stale-while-revalidate
// 3) Diğerleri: cache-first, yoksa network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Sadece GET isteklerini ele al
  if (request.method !== 'GET') return;

  // HTML -> NETWORK FIRST
  if (isHTML(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // Aynı origin assetler -> STALE-WHILE-REVALIDATE
  if (isSameOrigin(url) && isAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached || Promise.reject('offline'));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Diğer her şey -> CACHE FIRST, yoksa network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      // Aynı origin GET sonuçlarını sessizce önbelleğe al
      if (isSameOrigin(url) && res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    }).catch(() => cached))
  );
});
