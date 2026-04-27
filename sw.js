// ============================================================
// MIDGARD — sw.js (Service Worker para PWA)
// ============================================================
const CACHE = 'midgard-v1';
const FILES = [
  '/',
  '/index.html',
  '/login.html',
  '/style.css',
  '/login.css',
  '/script.js',
  '/login.js',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// Instala e faz cache dos arquivos principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Tenta rede primeiro, cai no cache se offline
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
