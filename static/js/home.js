// ========================================
        // セキュリティ対策: F12無効化・右クリック無効化
        // ========================================
        (function() {
            'use strict';
            
            // F12キー、開発者ツール、ソース表示無効化
            document.addEventListener('keydown', e => {
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
                    (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
                    (e.ctrlKey && e.key.toLowerCase() === 'u') ||
                    (e.metaKey && e.key.toLowerCase() === 'u')) {
                    e.preventDefault();
                    alert('⚠️ 開発者ツールの使用は禁止されています。利用規約違反です。');
                    return false;
                }
            });

            // 右クリック無効化
            document.addEventListener('contextmenu', e => {
                e.preventDefault();
                alert('⚠️ 右クリックは無効化されています。');
                return false;
            });

            // コピー・切り取り・貼り付け防止
            document.addEventListener('copy', e => {
                e.preventDefault();
                return false;
            });
            document.addEventListener('cut', e => {
                e.preventDefault();
                return false;
            });
        })();

        // Service Worker登録
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker: Registered'))
                .catch(err => console.error('Service Worker: Registration Failed', err));
        }

        // 用語検索時にポイント減算
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                if (searchInput.value.length > 2 && typeof pointsManager !== 'undefined') {
                    // 検索が行われたらポイント減算（重複防止のため一定時間制限）
                    if (!searchInput.dataset.lastSearch || Date.now() - searchInput.dataset.lastSearch > 5000) {
                        pointsManager.onTermSearch();
                        searchInput.dataset.lastSearch = Date.now();
                    }
                }
            });
        }

        // メイン機能
        document.addEventListener('DOMContentLoaded', () => {
            const hamburgerButton = document.getElementById('hamburger-menu-btn');
            const toc = document.getElementById('table-of-contents');

            if (hamburgerButton && toc) {
                hamburgerButton.addEventListener('click', e => {
                    e.stopPropagation();
                    toc.classList.toggle('open');
                });
                document.body.addEventListener('click', e => {
                    if (toc.classList.contains('open') && !toc.contains(e.target) && e.target !== hamburgerButton) {
                        toc.classList.remove('open');
                    }
                });
            }
        });
