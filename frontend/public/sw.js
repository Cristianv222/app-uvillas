// Service worker de Uvillas: permite instalar la web como app y abrirla sin conexión.
// El análisis de fotos (/api/) siempre va a la red: el modelo corre en el servidor.
const CACHE = 'uvillas-v3';
const SHELL = ['/', '/laboratorio', '/documentacion', '/requisitos', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  // Páginas: primero la red (para ver la última versión); si no hay conexión, la copia guardada.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); return res; })
        .catch(() => caches.match(event.request).then(r => r || caches.match('/laboratorio'))),
    );
    return;
  }

  // Archivos estáticos con hash: primero la copia guardada.
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); }
      return res;
    })),
  );
});
