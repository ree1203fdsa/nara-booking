const CACHE = 'nara-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/movies.html',
  '/flights.html',
  '/trains.html',
  '/buses.html',
  '/mybookings.html',
  '/confirm.html',
  '/admin.html',
  '/css/style.css',
  '/js/config.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Firebase API 요청은 캐시하지 않음
  if (e.request.url.includes('firebasedatabase.app')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
