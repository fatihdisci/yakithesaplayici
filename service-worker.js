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

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
