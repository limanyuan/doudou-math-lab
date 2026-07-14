const CACHE = 'doudou-math-v6-20260715';
const CORE = ['./','index.html','css/style.css','css/visual-explanations.css','js/curriculum.js','js/explanations.js','js/storage.js','js/srs.js','js/analytics.js','js/stickers.js','js/app.js','data/summer-bank.json','manifest.webmanifest','icons/app-icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => { if (response.ok && new URL(event.request.url).origin === location.origin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone())); return response; }).catch(() => caches.match('index.html'))));
});
