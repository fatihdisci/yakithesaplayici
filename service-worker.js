// Basit fakat güvenli PWA SW
const CACHE = 'yol-v2'; // sürüm artır
const PRECACHE = [
  './',
  'index.html',
  'apple-touch-icon.png',
  'manifest.json'
];

// Install: dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: eski cache’leri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch stratejisi:
// - Navigasyon ve manifest: network-first (çevrimdışıysa cache)
// - Diğer tüm istekler: cache-first, yoksa network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const isNavigate = request.mode === 'navigate';
  const isManifest = request.url.endsWith('manifest.json');

  if (isNavigate || isManifest) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
