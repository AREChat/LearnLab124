/* ==============================================
   見るものリスト - スマホ対応版 JavaScript
   LocalStorage管理 + Excelエクスポート機能
============================================== */

// ==================== 初期化 ====================
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

let viewingList = [];
let historyLog = [];
let nextId = 1;

function initApp() {
    console.log('📱 見るものリストアプリ起動中...');
    
    try {
        // LocalStorageからデータ読み込み
        loadFromLocalStorage();
        
        // 今日のデータを表示
        displayTodayItems();
        
        // リスト表示
        displayEntries();
        updateStats();
        renderHistory();

        // リスナー登録
        setupEventListeners();
        
        // 初回アクセス時のウェルカムガイド
        if (!localStorage.getItem('hasVisited')) {
            showWelcome();
            localStorage.setItem('hasVisited', 'true');
        }
        
        console.log('✅ アプリが正常に起動しました');
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        showNotification('アプリの起動に問題が発生しました', 'error');
    }
}

// ==================== LocalStorage管理 ====================
function loadFromLocalStorage() {
    try {
        const savedList = localStorage.getItem('viewingList');
        const savedHistory = localStorage.getItem('historyLog');
        const savedNextId = localStorage.getItem('nextId');
        
        if (savedList) {
            viewingList = JSON.parse(savedList);
            console.log(`📂 ${viewingList.length}件のデータを読み込みました`);
        }
        
        if (savedHistory) {
            historyLog = JSON.parse(savedHistory);
        }
        
        if (savedNextId) {
            nextId = parseInt(savedNextId);
        }
    } catch (error) {
        console.error('❌ データ読み込みエラー:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('viewingList', JSON.stringify(viewingList));
        localStorage.setItem('historyLog', JSON.stringify(historyLog));
        localStorage.setItem('nextId', nextId.toString());
        console.log('💾 データを保存しました');
    } catch (error) {
        console.error('❌ データ保存エラー:', error);
        showNotification('データの保存に失敗しました', 'error');
    }
}

// ==================== イベントリスナー ====================
function setupEventListeners() {
    // フォーム送信（HTMLのonsubmitがあるため冗長だがフォールバックで登録）
    const entryForm = document.getElementById('entryForm');
    if (entryForm && !entryForm.dataset.bound) {
        entryForm.addEventListener('submit', handleSubmit);
        entryForm.dataset.bound = 'true';
    }
}

// ==================== モーダル管理 ====================
function openAddModal() {
    // HTMLではモーダルを使っていないため不要
}

function closeAllModals() {
    // HTMLではモーダルを使っていないため不要
}

function showWelcomeMessage() {
    // 不要になったため削除
}

// ==================== データ追加 ====================
function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: nextId++,
        date: document.getElementById('date').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        category: document.getElementById('category').value,
        plannedContent: document.getElementById('plannedContent').value,
        actualContent: document.getElementById('actualContent').value,
        impression: document.getElementById('impression').value,
        contentMemo: document.getElementById('contentMemo').value,
        questions: document.getElementById('questions').value,
        understanding: document.getElementById('understanding').value,
        achievement: document.getElementById('achievement').value,
        createdAt: new Date().toISOString()
    };
    
    // 完了日時を記録
    if (formData.achievement === '完了') {
        formData.completedAt = new Date().toISOString();
    }
    
    viewingList.push(formData);
    saveToLocalStorage();
    addHistory(`新規追加: ${formData.plannedContent}`);
    
    // リスト表示を更新
    displayEntries();
    updateStats();
    
    // フォームクリア
    document.getElementById('entryForm').reset();
    
    // 今日の日付をセット
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    showNotification(`✅ リストに追加しました！`, 'success');
    
    // 完了の場合はおめでとうポップアップ
    if (formData.achievement === '完了') {
        setTimeout(() => {
            document.getElementById('congratsText').textContent = `「${formData.plannedContent}」を達成しました！`;
            document.getElementById('congratsPopup').classList.remove('hidden');
        }, 500);
    }
}

// ==================== リスト表示 ====================
function displayEntries() {
    const listContainer = document.getElementById('entriesList');
    
    if (viewingList.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>まだリストがありません。<br>「📝 入力」タブから追加してください！</p>
            </div>
        `;
        return;
    }
    
    // 新しい順にソート
    const sortedList = [...viewingList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    listContainer.innerHTML = sortedList.map(item => `
        <article class="entry-card ${item.achievement === '完了' ? 'completed' : item.achievement === '未完了' ? 'incomplete' : ''}">
            <div class="entry-header">
                <div>
                    <div class="entry-title">${item.plannedContent}</div>
                    <div class="entry-details">
                        <span class="entry-detail-label">📅</span> ${item.date}
                    </div>
                </div>
                <div class="entry-badge ${item.achievement === '完了' ? 'badge-completed' : item.achievement === '未完了' ? 'badge-incomplete' : 'badge-inprogress'}">
                    ${item.achievement === '完了' ? '✅ 完了' : item.achievement === '未完了' ? '📋 未完了' : '⏳ 途中'}
                </div>
            </div>
            <div class="entry-details">
                <p><span class="entry-detail-label">分類:</span> ${item.category}</p>
                <p><span class="entry-detail-label">時間:</span> ${item.startTime}${item.endTime ? '～' + item.endTime : ''}</p>
                ${item.actualContent ? `<p><span class="entry-detail-label">実際:</span> ${item.actualContent}</p>` : ''}
                ${item.impression ? `<p><span class="entry-detail-label">感想:</span> ${item.impression}</p>` : ''}
            </div>
            <div class="entry-actions">
                ${item.achievement !== '完了' ? `<button class="btn btn-small btn-success" onclick="markComplete(${item.id})">完了にする</button>` : ''}
                <button class="btn btn-small btn-danger" onclick="deleteEntry(${item.id})">削除</button>
            </div>
        </article>
    `).join('');
}

function filterEntries() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    
    const filtered = viewingList.filter(item => {
        const matchesSearch = item.plannedContent.toLowerCase().includes(searchTerm) || 
                             item.actualContent.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || item.category === category;
        return matchesSearch && matchesCategory;
    });
    
    const listContainer = document.getElementById('entriesList');
    if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">検索結果がありません</div>';
        return;
    }
    
    listContainer.innerHTML = filtered.map(item => `
        <article class="entry-card ${item.achievement === '完了' ? 'completed' : item.achievement === '未完了' ? 'incomplete' : ''}">
            <div class="entry-header">
                <div>
                    <div class="entry-title">${item.plannedContent}</div>
                    <div class="entry-details">
                        <span class="entry-detail-label">📅</span> ${item.date}
                    </div>
                </div>
                <div class="entry-badge ${item.achievement === '完了' ? 'badge-completed' : item.achievement === '未完了' ? 'badge-incomplete' : 'badge-inprogress'}">
                    ${item.achievement === '完了' ? '✅ 完了' : item.achievement === '未完了' ? '📋 未完了' : '⏳ 途中'}
                </div>
            </div>
            <div class="entry-details">
                <p><span class="entry-detail-label">分類:</span> ${item.category}</p>
                <p><span class="entry-detail-label">時間:</span> ${item.startTime}${item.endTime ? '～' + item.endTime : ''}</p>
                ${item.actualContent ? `<p><span class="entry-detail-label">実際:</span> ${item.actualContent}</p>` : ''}
                ${item.impression ? `<p><span class="entry-detail-label">感想:</span> ${item.impression}</p>` : ''}
            </div>
            <div class="entry-actions">
                ${item.achievement !== '完了' ? `<button class="btn btn-small btn-success" onclick="markComplete(${item.id})">完了にする</button>` : ''}
                <button class="btn btn-small btn-danger" onclick="deleteEntry(${item.id})">削除</button>
            </div>
        </article>
    `).join('');
}

// ==================== 統計更新 ====================
function updateStats() {
    const total = viewingList.length;
    const completed = viewingList.filter(item => item.achievement === '完了').length;
    const incomplete = viewingList.filter(item => item.achievement === '未完了').length;
    const inProgress = viewingList.filter(item => item.achievement === '途中').length;
    
    // 統計カードを更新
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].innerHTML = `<div class="stat-icon">📊</div><div class="stat-label">合計</div><div class="stat-value">${total}</div>`;
        statCards[1].innerHTML = `<div class="stat-icon">✅</div><div class="stat-label">完了</div><div class="stat-value">${completed}</div>`;
        statCards[2].innerHTML = `<div class="stat-icon">⏳</div><div class="stat-label">途中</div><div class="stat-value">${inProgress}</div>`;
        statCards[3].innerHTML = `<div class="stat-icon">📋</div><div class="stat-label">未完了</div><div class="stat-value">${incomplete}</div>`;
    }
    
    // データ件数を更新
    const dataCountElem = document.getElementById('dataCount');
    if (dataCountElem) {
        dataCountElem.textContent = total;
    }
    
    // 今日のアイテムを更新
    displayTodayItems();
}

// ==================== アイテム操作 ====================
function markComplete(id) {
    const item = viewingList.find(i => i.id === id);
    if (!item) return;
    
    item.achievement = '完了';
    item.completedAt = new Date().toISOString();
    
    saveToLocalStorage();
    addHistory(`完了: ${item.plannedContent}`);
    displayEntries();
    updateStats();
    
    document.getElementById('congratsText').textContent = `「${item.plannedContent}」を達成しました！`;
    document.getElementById('congratsPopup').classList.remove('hidden');
}

function deleteEntry(id) {
    if (!confirm('削除してもよろしいですか？')) {
        return;
    }
    
    const item = viewingList.find(i => i.id === id);
    viewingList = viewingList.filter(i => i.id !== id);
    saveToLocalStorage();
    if (item) addHistory(`削除: ${item.plannedContent}`);
    displayEntries();
    updateStats();
    
    showNotification('削除しました', 'info');
}

function deleteItem(id) {
    deleteEntry(id);
}

function completeItem(id) {
    markComplete(id);
}

function editItem(id) {
    // モーダルを使っていないため不要
}

function confirmClearData() {
    if (!confirm('⚠️ すべてのデータを削除してもよろしいですか？')) {
        return;
    }
    
    if (!confirm('本当に削除しますか？')) {
        return;
    }
    
    viewingList = [];
    historyLog = [];
    nextId = 1;
    
    saveToLocalStorage();
    displayEntries();
    updateStats();
    
    showNotification('すべてのデータを削除しました', 'info');
}

// ==================== 履歴管理 ====================
function addHistory(action) {
    const entry = {
        timestamp: new Date().toISOString(),
        action: action
    };
    
    historyLog.unshift(entry);
    
    if (historyLog.length > 100) {
        historyLog = historyLog.slice(0, 100);
    }
    
    saveToLocalStorage();
    renderHistory();
}

function renderHistory() {
    const historyContainer = document.getElementById('historyList');
    if (!historyContainer) return;
    
    if (historyLog.length === 0) {
        historyContainer.innerHTML = '<div class="history-item"><p>まだ履歴がありません</p></div>';
        return;
    }
    
    const recentHistory = historyLog.slice(0, 10);
    
    historyContainer.innerHTML = recentHistory.map(entry => {
        const date = new Date(entry.timestamp);
        return `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-action">${entry.action}</div>
                    <div class="history-datetime">${date.toLocaleString('ja-JP')}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== Excel エクスポート ====================
function exportToExcel() {
    if (viewingList.length === 0) {
        showNotification('❌ エクスポートするデータがありません', 'error');
        return;
    }
    
    if (!confirm(`📊 現在のデータ（${viewingList.length}件）をExcelファイルにエクスポートしますか？`)) {
        return;
    }
    
    try {
        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
        const filename = `見るものリスト_${dateStr}_${timeStr}.csv`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        addHistory(`Excelエクスポート: ${filename}`);
        showNotification(`✅ ${filename} をダウンロードしました`, 'success');
        
    } catch (error) {
        console.error('❌ エクスポートエラー:', error);
        showNotification('エクスポートに失敗しました', 'error');
    }
}

function generateCSV() {
    const headers = [
        'ID', '日付', '予定内容', '実際の内容', '分類', 
        '開始時間', '終了時間', '感想', '内容メモ', '質問事項',
        '理解度', '達成度', '作成日時'
    ];
    
    const rows = viewingList.map(item => [
        item.id,
        item.date,
        `"${item.plannedContent}"`,
        `"${item.actualContent}"`,
        item.category,
        item.startTime,
        item.endTime || '',
        `"${item.impression || ''}"`,
        `"${item.contentMemo || ''}"`,
        `"${item.questions || ''}"`,
        item.understanding || '',
        item.achievement,
        new Date(item.createdAt).toLocaleString('ja-JP')
    ]);
    
    const bom = '\uFEFF';
    const csv = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    return bom + csv;
}

// ==================== UI制御関数 ====================
function switchTab(tabName, btn) {
    // すべてのタブを非表示
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // すべてのボタンを非active
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 選択したタブを表示
    const tabId = tabName + '-tab';
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // 対応するボタンをactiveに
    if (btn) {
        btn.classList.add('active');
    }
}

function resetForm() {
    document.getElementById('entryForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

function reloadData() {
    loadFromLocalStorage();
    displayEntries();
    updateStats();
    showNotification('✅ データを更新しました', 'success');
}

function clearAllData() {
    confirmClearData();
}

function toggleFurigana(btn) {
    const enabled = btn.textContent.includes('ON') ? false : true;
    btn.textContent = enabled ? 'ふりがな: OFF' : 'ふりがな: ON';
    
    if (enabled) {
        document.body.classList.add('furigana-enabled');
    } else {
        document.body.classList.remove('furigana-enabled');
    }
    
    localStorage.setItem('furiganaEnabled', enabled);
}

function showWelcome() {
    document.getElementById('welcomeGuide').classList.remove('hidden');
}

function closeWelcome() {
    document.getElementById('welcomeGuide').classList.add('hidden');
}

function nextScene(sceneNum) {
    document.querySelectorAll('.story-scene').forEach(scene => {
        scene.classList.add('hidden');
    });
    const scene = document.getElementById('scene' + sceneNum);
    if (scene) {
        scene.classList.remove('hidden');
    }
}

function showTodayPopup() {
    document.getElementById('todayPopup').classList.remove('hidden');
    displayTodayItems();
}

function closeTodayPopup() {
    document.getElementById('todayPopup').classList.add('hidden');
}

function displayTodayItems() {
    const today = new Date().toISOString().split('T')[0];
    const todayItems = viewingList.filter(item => item.date === today && item.achievement !== '完了');
    
    const todayList = document.getElementById('todayList');
    if (!todayList) return;
    
    if (todayItems.length === 0) {
        todayList.innerHTML = `
            <div class="no-today-items">
                <div class="no-today-items-icon">🎉</div>
                <p>今日の予定はすべて完了しました！</p>
                <p>お疲れ様でした！</p>
            </div>
        `;
        return;
    }
    
    todayList.innerHTML = todayItems.map(item => `
        <div class="today-item">
            <div class="today-item-header">${item.plannedContent}</div>
            <div class="today-item-detail">時間: ${item.startTime}${item.endTime ? '～' + item.endTime : ''}</div>
            <div class="today-item-detail">分類: ${item.category}</div>
        </div>
    `).join('');
}

function closeCongratsPopup() {
    document.getElementById('congratsPopup').classList.add('hidden');
}

function showExportPopup() {
    document.getElementById('exportPopup').classList.remove('hidden');
}

function closeExportPopup() {
    document.getElementById('exportPopup').classList.add('hidden');
}

function confirmExport() {
    closeExportPopup();
    exportToExcel();
}

function closeInstallBanner() {
    document.getElementById('installBanner').classList.remove('show');
}

// ==================== 通知表示 ====================
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// ==================== サービスワーカー登録（PWA化） ====================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('✅ Service Worker登録成功', reg))
        .catch(err => console.log('❌ Service Worker登録失敗', err));
}

console.log('✅ app.js 読み込み完了');
