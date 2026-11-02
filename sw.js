// Service Worker（オフライン対応）
// GitHub Pages のプロジェクトサイト（https://ユーザー名.github.io/リポジトリ名/）でも動くよう、
// すべて相対パスで書いています。
const CACHE_NAME = 'study-cache-v6';
const PRECACHE = [
  './',
  'home.html', 'index.html', 'index3.html', 'index4.html', 'index5.html',
  'logout.html', 'loading.html', 'thanks.html',
  'static/css/home.css', 'static/css/glossary.css', 'static/style2.css', 'static/responsive-header.css',
  'static/js/glossary.js', 'static/js/home.js', 'static/js/study-api.js', 'static/js/study-config.js',
  'static/security.js', 'static/points.js', 'static/points-header.js',
  'static/QA.json', 'static/data/glossary.json',
  'hate/base.html',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // 1つ見つからなくても、全体のインストールは失敗させない
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // GET かつ同じサイト内のファイルだけを扱う。
  // Neon（認証・DB）への通信や POST、動画/音声の Range リクエストは触らない。
  if (req.method !== 'GET' || url.origin !== self.location.origin || req.headers.has('range')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});
