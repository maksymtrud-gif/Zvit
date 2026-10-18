// Офлайн-кеш. Після зміни файлів збільште номер версії.
const CACHE = 'zvit-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Спершу мережа (щоб оновлення доходили); якщо мережі немає або вона повільна (>4 с) — кеш
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const net = Promise.race([
    fetch(e.request),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
  ]);
  e.respondWith(
    net.then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
