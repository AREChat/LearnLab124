        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('search-input');
            const clearSearchBtn = document.getElementById('clear-search');
            const clearHistoryBtn = document.getElementById('clear-history');
            const categoryFilter = document.getElementById('category-filter');
            const linkGrid = document.getElementById('link-grid');
            const frequentGrid = document.getElementById('frequent-grid');
            const cards = Array.from(linkGrid.querySelectorAll('.card'));

            // クリックカウントを保存・読み込み
            function getClickCounts() {
                const counts = localStorage.getItem('linkClickCounts');
                return counts ? JSON.parse(counts) : {};
            }

            function saveClickCounts(counts) {
                localStorage.setItem('linkClickCounts', JSON.stringify(counts));
            }

            // クリック数は Neon に保存（画面表示用にローカルへキャッシュ）
            function recordClick(label) {
                const counts = getClickCounts();
                counts[label] = (counts[label] || 0) + 1;
                saveClickCounts(counts);
                if (typeof Study !== 'undefined') Study.incrementLinkClick(label).catch(function () {});
                updateFrequentSites();
            }

            // カードクリックイベント
            cards.forEach(card => {
                const link = card.querySelector('a');
                link.addEventListener('click', function() {
                    recordClick(this.querySelector('.label').textContent);
                });
            });

            // よく見るサイトを表示
            function updateFrequentSites() {
                const counts = getClickCounts();
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                frequentGrid.innerHTML = '';

                sorted.forEach(([label, count]) => {
                    const originalCard = cards.find(card => card.querySelector('.label').textContent === label);
                    if (originalCard) {
                        const clone = originalCard.cloneNode(true);
                        const link = clone.querySelector('a');
                        link.target = '_blank'; // 新しいタブで開く
                        link.addEventListener('click', function() {
                            recordClick(label);
                        });
                        frequentGrid.appendChild(clone);
                    }
                });

                if (sorted.length === 0) {
                    frequentGrid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;width:100%;">まだクリック履歴がありません</p>';
                }
            }

            // フィルタリング関数
            function filterCards() {
                const searchTerm = searchInput.value.toLowerCase();
                const selectedCategory = categoryFilter.value;

                cards.forEach(card => {
                    const label = card.querySelector('.label').textContent.toLowerCase();
                    const category = card.dataset.category;
                    const matchesSearch = label.includes(searchTerm);
                    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

                    if (matchesSearch && matchesCategory) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }

            // 検索クリア関数
            function clearSearch() {
                searchInput.value = '';
                filterCards();
                searchInput.focus();
            }

            // 履歴削除関数
            function clearHistory() {
                if (confirm('よく見るサイトの履歴を削除しますか？')) {
                    localStorage.removeItem('linkClickCounts');
                    if (typeof Study !== 'undefined') Study.clearLinkClicks().catch(function () {});
                    updateFrequentSites();
                }
            }

            // Neon に保存されたクリック数を反映
            if (typeof Study !== 'undefined') {
                Study.linkClicks().then(function (c) { saveClickCounts(c); updateFrequentSites(); }).catch(function () {});
            }

            // イベントリスナー
            searchInput.addEventListener('input', filterCards);
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    // Enterキーで検索確定（フォーカスを外す）
                    searchInput.blur();
                } else if (e.key === 'Escape') {
                    // Escキーでクリア
                    clearSearch();
                }
            });
            clearSearchBtn.addEventListener('click', clearSearch);
            clearHistoryBtn.addEventListener('click', clearHistory);
            categoryFilter.addEventListener('change', filterCards);

            // 初期化
            updateFrequentSites();
        });

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
        });
    
