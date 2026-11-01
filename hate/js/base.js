    window.onload = async function() {
        // --- 要素の取得 ---
        const elements = { container: document.getElementById('container'), searchInput: document.getElementById('searchInput'), categorySelect: document.getElementById('categorySelect'), searchSuggestions: document.getElementById('searchSuggestions'), favoritesContainer: document.getElementById('favorites-container'), popularContainer: document.getElementById('popular-container'), progressBar: document.getElementById('progress-bar'), progressText: document.getElementById('progress-text'), pointsDisplay: document.getElementById('points-display'), themeSelect: document.getElementById('theme-select'), toast: document.getElementById('toast'), randomTermModal: document.getElementById('random-term-modal'), randomTermContent: document.getElementById('random-term-content'), addTermForm: document.getElementById('add-term-form'), customTermsList: document.getElementById('custom-terms-list') };
        let termsData = {};
        let currentSort = 'default';

        // --- データ読み込み ---
        try {
            // 用語データは static/data/glossary.json に1本化（言語ごとに振り分けて、この画面の形式に変換）
            const res = await fetch('../static/data/glossary.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const glossary = await res.json();
            const toTerm = (e) => ({
                '用語名': e.term,
                '意味': e.summary,
                'サンプルコード': (e.examples || []).map(x => (x.note ? '# ' + x.note + '\n' : '') + x.code).filter(Boolean).join('\n\n')
            });
            const pick = (lang) => glossary.entries.filter(e => e.lang === lang).map(toTerm);
            termsData = { python: pick('python'), sql: pick('sql'), web: pick('html'), vba: pick('vba'), other: pick('other') };
        } catch (error) { console.error('JSONの読み込みに失敗しました:', error); elements.container.innerHTML = `<p style="text-align: center; color: red;">用語データの読み込みに失敗しました。</p>`; }

        // --- 共通ヘルパー ---
        const getFromStorage = (key, def) => JSON.parse(localStorage.getItem(key)) || def;
        const saveToStorage = (key, val) => localStorage.setItem(key, JSON.stringify(val));
        const showToast = (message) => { elements.toast.textContent = message; elements.toast.classList.add('show'); setTimeout(() => elements.toast.classList.remove('show'), 3000); };

        // --- データ管理 ---
        const getCombinedTerms = () => { let combined = {}; const customTerms = getFromStorage('customTerms', []); for (const key in termsData) { combined[key] = [...termsData[key]]; } if (!combined.custom) combined.custom = []; combined.custom.push(...customTerms); return combined; };
        const getAllTermsAsFlatArray = (includeCustom = true) => { const source = includeCustom ? getCombinedTerms() : termsData; let flatArray = []; Object.values(source).forEach(data => { if(Array.isArray(data)) flatArray.push(...data); else if(typeof data === 'object' && data !== null) { Object.values(data).forEach(arr => Array.isArray(arr) && flatArray.push(...arr)); } }); return flatArray; };

        // --- テーマ管理 ---
        const applyTheme = (theme) => { document.body.dataset.theme = theme; saveToStorage('theme', theme); elements.themeSelect.value = theme; };
        applyTheme(getFromStorage('theme', 'light'));

        // --- ポイント管理 ---
        let points = getFromStorage('points', 0);
        const updatePointsDisplay = () => elements.pointsDisplay.textContent = `${points}円`;
        const addPoints = (amount) => { points += amount; saveToStorage('points', points); updatePointsDisplay(); };
        updatePointsDisplay();
        
        // --- 状態管理 (進捗、注意、お気に入り) ---
        let readTerms = new Set(getFromStorage('readTerms', []));
        let attentionTerms = new Set(getFromStorage('attentionTerms', []));
        
        // --- UI生成 ---
        const createTermCard = (term) => {
            const card = document.createElement('div');
            card.className = 'term-card';
            card.dataset.termName = term.用語名;
            if (readTerms.has(term.用語名)) card.classList.add('is-read');

            card.innerHTML = `
                <div class="term-header">
                    <h3 class="term-name">
                        ${term.用語名}
                        <span class="status-icon">${readTerms.has(term.用語名) ? '✅' : ''}</span>
                    </h3>
                    <div class="term-controls">
                         <button class="control-icon-button attention-button ${attentionTerms.has(term.用語名) ? 'is-attention' : ''}" data-term-name="${term.用語名}" title="注意マーク">⚠️</button>
                         <button class="control-icon-button favorite-button ${getFromStorage('favorites', []).includes(term.用語名) ? 'favorited' : ''}" data-term-name="${term.用語名}" title="お気に入り">&#9733;</button>
                    </div>
                </div>
                <p class="term-meaning">${term.意味}</p>
                ${term.サンプルコード ? `<pre><code>${term.サンプルコード.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>` : ''}
            `;
            return card;
        };
        
        // --- 表示ロジック ---
        const updateProgressBar = () => { const totalCount = getAllTermsAsFlatArray().length; if (totalCount === 0) return; const readCount = readTerms.size; const percentage = Math.round((readCount / totalCount) * 100); elements.progressBar.value = percentage; elements.progressText.textContent = `${percentage}% (${readCount}/${totalCount})`; };
        const displayTerms = (termList) => { elements.container.innerHTML = ''; if (currentSort === 'az') termList.sort((a, b) => a.用語名.localeCompare(b.用語名, 'ja')); if (currentSort === 'za') termList.sort((a, b) => b.用語名.localeCompare(a.用語名, 'ja')); if (termList.length === 0) { elements.container.innerHTML = '<p>対象の用語はありません。</p>'; return; } termList.forEach(term => elements.container.appendChild(createTermCard(term))); };
        const displayByCategory = () => { const keyword = elements.searchInput.value.trim(); if (keyword) { handleSearch(); return; } const selected = elements.categorySelect.value; let termsToDisplay = []; let headerText = ''; const allTerms = getAllTermsAsFlatArray(); if (selected === 'all') { termsToDisplay = allTerms; headerText = '全ての用語'; } else if (selected === 'favorites') { const favorites = getFromStorage('favorites', []); termsToDisplay = allTerms.filter(t => favorites.includes(t.用語名)); headerText = 'お気に入りのみ'; } else { termsToDisplay = getCombinedTerms()[selected] || []; headerText = selected.charAt(0).toUpperCase() + selected.slice(1); } elements.container.innerHTML = `<h2>${headerText}</h2>`; displayTerms(termsToDisplay); };
        const displayPopularSearches = () => { elements.popularContainer.innerHTML = ''; const counts = getFromStorage('searchCounts', {}); const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10); if(sorted.length > 0) { sorted.forEach(([keyword]) => { const item = document.createElement('div'); item.className = 'popular-item'; item.textContent = keyword; item.onclick = () => { elements.searchInput.value = keyword; handleSearch(); }; elements.popularContainer.appendChild(item); }); } };

        const handleSearch = () => {
            const keyword = elements.searchInput.value.trim();
            if (!keyword) { displayByCategory(); return; }
            addPoints(10);
            
            let history = getFromStorage('searchHistory', []).filter(item => item !== keyword); history.unshift(keyword); if (history.length > 20) history.pop(); saveToStorage('searchHistory', history);
            const counts = getFromStorage('searchCounts', {}); counts[keyword] = (counts[keyword] || 0) + 1; saveToStorage('searchCounts', counts);
            updateSearchSuggestions(); displayPopularSearches();

            const lowerCaseKeyword = keyword.toLowerCase();
            const selected = elements.categorySelect.value;
            let sourceTerms = [];
            const allTerms = getAllTermsAsFlatArray();

            if (selected === 'all') sourceTerms = allTerms;
            else if (selected === 'favorites') { const favorites = getFromStorage('favorites', []); sourceTerms = allTerms.filter(t => favorites.includes(t.用語名)); }
            else { sourceTerms = getCombinedTerms()[selected] || []; }
            
            const filtered = sourceTerms.filter(t => t.用語名.toLowerCase().includes(lowerCaseKeyword) || t.意味.toLowerCase().includes(lowerCaseKeyword));
            elements.container.innerHTML = `<h2>「${elements.searchInput.value}」の検索結果 (${filtered.length}件)</h2>`;
            displayTerms(filtered);
        };
        
        // --- カスタム用語管理 ---
        const displayCustomTerms = () => { elements.customTermsList.innerHTML = ''; getFromStorage('customTerms', []).forEach(term => { const div = document.createElement('div'); div.innerHTML = `${term.用語名} <button data-term-name="${term.用語名}" class="delete-custom-term secondary-button" style="padding: 2px 8px; font-size: 0.8em;">削除</button>`; elements.customTermsList.appendChild(div); }); };
        
        // --- イベントリスナー設定 ---
        const clearSearchHistory = () => { if (confirm('検索履歴と「よく検索される用語」を削除しますか？')) { localStorage.removeItem('searchHistory'); localStorage.removeItem('searchCounts'); updateSearchSuggestions(); displayPopularSearches(); showToast('検索履歴を削除しました。円はそのままです。'); } };
        const updateSearchSuggestions = () => { elements.searchSuggestions.innerHTML = ''; getFromStorage('searchHistory', []).forEach(keyword => { const option = document.createElement('option'); option.value = keyword; elements.searchSuggestions.appendChild(option); }); };

        elements.themeSelect.onchange = (e) => applyTheme(e.target.value);
        elements.categorySelect.onchange = displayByCategory;
        elements.searchInput.onkeydown = (e) => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') { elements.searchInput.value = ''; displayByCategory(); } };
        document.getElementById('searchButton').onclick = handleSearch;
        document.getElementById('clear-history-button').onclick = clearSearchHistory;
        document.querySelector('.modal .close-button').onclick = () => elements.randomTermModal.style.display = 'none';
        document.getElementById('sort-az').onclick = () => { currentSort = 'az'; displayByCategory(); };
        document.getElementById('sort-za').onclick = () => { currentSort = 'za'; displayByCategory(); };
        
        document.getElementById('random-term-button').onclick = () => { const allTerms = getAllTermsAsFlatArray(); if (allTerms.length === 0) return; const randomTerm = allTerms[Math.floor(Math.random() * allTerms.length)]; elements.randomTermContent.innerHTML = ''; elements.randomTermContent.appendChild(createTermCard(randomTerm)); elements.randomTermModal.style.display = 'flex'; };
        document.getElementById('export-favorites-button').onclick = () => { const favorites = getFromStorage('favorites', []); if (favorites.length === 0) { showToast('お気に入りがありません'); return; } const text = favorites.join('\n'); const blob = new Blob([text], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'favorites.txt'; a.click(); URL.revokeObjectURL(url); showToast('エクスポートしました'); };
        document.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); elements.searchInput.focus(); } });
        
        document.body.addEventListener('click', (e) => {
            const favoriteButton = e.target.closest('.favorite-button');
            const attentionButton = e.target.closest('.attention-button');
            const termCard = e.target.closest('.term-card');
            const deleteButton = e.target.closest('.delete-custom-term');

            if (favoriteButton) {
                const termName = favoriteButton.dataset.termName;
                let favorites = getFromStorage('favorites', []);
                if (favorites.includes(termName)) { favorites = favorites.filter(f => f !== termName); showToast('お気に入りから削除'); }
                else { favorites.push(termName); showToast('お気に入りに追加'); }
                saveToStorage('favorites', favorites);
                favoriteButton.classList.toggle('favorited');
                if (elements.categorySelect.value === 'favorites') displayByCategory();
                return;
            }

            if (attentionButton) {
                const termName = attentionButton.dataset.termName;
                if (attentionTerms.has(termName)) { attentionTerms.delete(termName); showToast('注意マークを解除'); }
                else { attentionTerms.add(termName); showToast('注意マークを設定'); }
                saveToStorage('attentionTerms', [...attentionTerms]);
                attentionButton.classList.toggle('is-attention');
                return;
            }
            
            if (deleteButton) {
                const termName = deleteButton.dataset.termName;
                let customTerms = getFromStorage('customTerms', []).filter(t => t.用語名 !== termName);
                saveToStorage('customTerms', customTerms);
                showToast('カスタム用語を削除');
                displayCustomTerms(); displayByCategory();
                return;
            }

            if (termCard) {
                const termName = termCard.dataset.termName;
                if (!readTerms.has(termName)) {
                    readTerms.add(termName);
                    saveToStorage('readTerms', [...readTerms]);
                    termCard.classList.add('is-read');
                    const icon = termCard.querySelector('.status-icon');
                    if (icon) icon.textContent = '✅';
                    updateProgressBar();
                }
            }
        });
        
        elements.addTermForm.onsubmit = (e) => { e.preventDefault(); const newTerm = { 用語名: document.getElementById('term-name-input').value, 意味: document.getElementById('term-meaning-input').value, サンプルコード: document.getElementById('term-code-input').value, }; const customTerms = getFromStorage('customTerms', []); if (customTerms.some(t => t.用語名 === newTerm.用語名)) { alert('同じ名前の用語が既に存在します。'); return; } customTerms.push(newTerm); saveToStorage('customTerms', customTerms); elements.addTermForm.reset(); showToast('新しい用語を追加'); displayCustomTerms(); displayByCategory(); updateProgressBar(); };

        // --- 初期表示 ---
        displayByCategory(); displayPopularSearches(); updateProgressBar(); updateSearchSuggestions(); displayCustomTerms();
    };

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
