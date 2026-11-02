if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }

        // ハンバーガーメニュー機能
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

            // マニュアル閲覧ポイント付与（1日1回）
            if (typeof pointsManager !== 'undefined') {
                const today = new Date().toDateString();
                const lastManualAccess = localStorage.getItem('lastManualAccess');
                
                if (lastManualAccess !== today) {
                    setTimeout(() => {
                        pointsManager.onManualAccess();
                        localStorage.setItem('lastManualAccess', today);
                    }, 10000); // 10秒間閲覧でポイント付与
                }
            }
        });
