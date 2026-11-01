/* ==============================================
   Service Worker - オフライン対応
============================================== */

const CACHE_NAME = 'viewing-list-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
    console.log('✅ Service Worker インストール中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 キャッシュを開きました');
                return cache.addAll(urlsToCache);
            })
    );
});

// アクティベーション時に古いキャッシュを削除
self.addEventListener('activate', event => {
    console.log('✅ Service Worker アクティベート中...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ 古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// フェッチ時にキャッシュから返す（オフライン対応）
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // キャッシュがあればそれを返す
                if (response) {
                    return response;
                }
                
                // なければネットワークからフェッチ
                return fetch(event.request).then(response => {
                    // レスポンスが有効かチェック
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // レスポンスをクローンしてキャッシュに保存
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // オフライン時のフォールバック
                console.log('📴 オフラインモード');
            })
    );
});

console.log('✅ Service Worker 読み込み完了');
