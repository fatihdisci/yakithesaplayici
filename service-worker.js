const cacheName = 'yol-v1';
const filesToCache = [
  '.',
  'index.html',
  'apple-touch-icon.png',
  'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('fetch', event => {
  // Navigation (HTML) veya manifest isteklerinde network-first
  if (event.request.mode === 'navigate' || event.request.url.endsWith('manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(cacheName).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  // Diğer kaynaklarda cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

