        // セキュリティ対策
        (function() {
            'use strict';
            
            document.addEventListener('keydown', e => {
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
                    (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
                    (e.ctrlKey && e.key.toLowerCase() === 'u') ||
                    (e.metaKey && e.key.toLowerCase() === 'u')) {
                    e.preventDefault();
                    alert('⚠️ 開発者ツールの使用は禁止されています。');
                    return false;
                }
            });

            document.addEventListener('contextmenu', e => {
                e.preventDefault();
                alert('⚠️ 右クリックは無効化されています。');
                return false;
            });

            document.addEventListener('copy', e => {
                e.preventDefault();
                return false;
            });
        })();

        // ハンバーガーメニュー制御
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

        // Service Worker登録
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker: Registered'))
                .catch(err => console.error('Service Worker: Registration Failed', err));
        }

        // eラーニングアクセスでポイント付与
        if (typeof pointsManager !== 'undefined') {
            // 1日1回のみポイント付与
            const today = new Date().toDateString();
            const lastAccess = localStorage.getItem('learningLastAccess');
            
            if (lastAccess !== today) {
                pointsManager.onLearningAccess();
                localStorage.setItem('learningLastAccess', today);
            }
        }

        // ポイントモーダル表示
        function showPointsModal() {
            const modal = document.createElement('div');
            modal.className = 'points-modal active';
            modal.innerHTML = `
                <div class="points-modal-content">
                    <h2>💰 ポイントシステム</h2>
                    <div class="points-info-item">
                        <strong>現在の残高:</strong><br>
                        <span class="points-display" style="font-size: 2em;">${pointsManager.getPoints().toLocaleString()}円</span>
                    </div>
                    <div class="points-info-item">
                        <h3 style="color: #ff4444;">💸 ポイントが減る行動</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li class="points-loss">• クイズ回答: -100円</li>
                            <li class="points-loss">• チャット送信: -100円</li>
                            <li class="points-loss">• 用語検索: -50円</li>
                        </ul>
                    </div>
                    <div class="points-info-item">
                        <h3 style="color: #00ff88;">💰 ポイントが増える行動</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li class="points-gain">• eラーニング参加: +2000円</li>
                            <li class="points-gain">• アンケート回答: +1000円</li>
                            <li class="points-gain">• 物語閲覧: +1000円</li>
                            <li class="points-gain">• 動画視聴完了: +1000円</li>
                            <li class="points-gain">• 天気確認: +500円</li>
                            <li class="points-gain">• 電車情報確認: +500円</li>
                            <li class="points-gain">• マニュアル閲覧: +300円</li>
                        </ul>
                    </div>
                    <button class="points-modal-close" onclick="this.parentElement.parentElement.remove()">閉じる</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            // モーダル外クリックで閉じる
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    
