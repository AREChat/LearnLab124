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
			(window.__secAlert=window.__secAlert||function(m){var n=Date.now();if(n-(window.__secAlertAt||0)<1500)return;window.__secAlertAt=n;alert(m);})('⚠️ 開発者ツールの使用は禁止されています。');
			return false;
		}
	});

	// 右クリック無効化
	document.addEventListener('contextmenu', e => {
		e.preventDefault();
		(window.__secAlert=window.__secAlert||function(m){var n=Date.now();if(n-(window.__secAlertAt||0)<1500)return;window.__secAlertAt=n;alert(m);})('⚠️ 右クリックは無効化されています。');
		return false;
	});

	// コピー防止
	document.addEventListener('copy', e => {
		e.preventDefault();
		return false;
	});
})();

// ========================================
// メイン機能
// ========================================

// 管理者: ユーザー追加
let typingTimer;
function escHtml(v) {
	return String(v).replace(/[&<>"']/g, function (c) {
		return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
	});
}
let syncTimer = null;
function scheduleSync() {
	clearTimeout(syncTimer);
	syncTimer = setTimeout(function () {
		const user = localStorage.getItem('currentUser');
		if (user) syncChats(user);
	}, 800);
}

function adminAddUser() {
	const msg = document.getElementById('admin-user-msg');
	msg.textContent = 'ℹ️ ユーザーは各自が「新規登録」で作成します（管理画面からは追加できません）';
	setTimeout(()=>{msg.textContent='';},3000);
}

// 管理者: ユーザー削除
function adminDeleteUser() {
	const msg = document.getElementById('admin-user-msg');
	msg.textContent = 'ℹ️ ユーザーの削除は Neon のコンソールで行ってください';
	setTimeout(()=>{msg.textContent='';},3000);
}
// ユーザー情報・チャット履歴・メモは Neon のデータベースに保存（画面表示用に localStorage へキャッシュ）
// 管理者の発言は sender = ADMIN_SENDER で保存し、表示名は管理者の「表記名」(初期値: 主人公)を使う
const ADMIN_SENDER = '__admin__';
let adminLabel = '主人公';

async function loadAdminLabel() {
	try { adminLabel = await Study.adminName(); } catch (e) { /* 既定値のまま */ }
	const t = document.getElementById('typing-indicator');
	if (t) t.textContent = adminLabel + ' が入力中...';
	const inp = document.getElementById('admin-display-name');
	if (inp) inp.value = adminLabel;
}

async function saveAdminName() {
	const inp = document.getElementById('admin-display-name');
	const out = document.getElementById('admin-name-msg');
	try {
		adminLabel = await Study.setAdminName(inp.value);
		out.textContent = '✓ 表記名を変更しました';
		showAdminChat();
	} catch (err) {
		out.textContent = '変更に失敗しました: ' + Study.friendly(err);
	}
	setTimeout(() => { out.textContent = ''; }, 2500);
}

function togglePw(id, el) {
	const input = document.getElementById(id);
	if (input.type === "password") {
		input.type = "text"; el.textContent = "非表示";
	} else {
		input.type = "password"; el.textContent = "表示";
	}
}

function showTyping() {
	document.getElementById('typing-indicator').style.display = 'block';
}

function hideTyping() {
	document.getElementById('typing-indicator').style.display = 'none';
}

function showRegister() {
	document.getElementById('register-area').classList.remove('hidden');
	document.getElementById('login-area').classList.add('hidden');
}
function showLogin() {
	document.getElementById('register-area').classList.add('hidden');
	document.getElementById('login-area').classList.remove('hidden');
}

async function registerUser() {
	const u = document.getElementById('reg-username').value.trim();
	const p = document.getElementById('reg-password').value;
	const msg = document.getElementById('reg-msg');
	msg.style.color = '';
	if (!u || !p) { msg.textContent = '⚠️ ユーザ名とパスワードを入力してください'; return; }
	const bad = Study.validateUsername(u);
	if (bad) { msg.textContent = '⚠️ ' + bad; return; }
	if (u.toLowerCase() === 'admin' || u.toLowerCase() === 'administrator') {
		msg.textContent = '⚠️ このユーザ名は使用できません（管理者専用）';
		return;
	}
	if (p.length < Study.MIN_PASSWORD) { msg.textContent = '⚠️ パスワードは' + Study.MIN_PASSWORD + '文字以上にしてください'; return; }
	msg.textContent = '登録しています…';
	try {
		const profile = await Study.register(u, p);
		msg.textContent = '✓ 登録完了！';
		msg.style.color = '#00ff00';
		enterApp(profile);
	} catch (err) {
		msg.textContent = '⚠️ ' + Study.friendly(err);
	}
}

async function loginUser() {
	const u = document.getElementById('login-username').value.trim();
	const p = document.getElementById('login-password').value;
	const msg = document.getElementById('login-msg');
	if (!u || !p) { msg.textContent = 'ユーザ名とパスワードを入力してください'; return; }
	msg.textContent = 'ログインしています…';
	try {
		const profile = await Study.login(u, p);
		msg.textContent = '';
		enterApp(profile);
	} catch (err) {
		msg.textContent = Study.friendly(err);
	}
}

// ログイン後の画面切り替え（管理者は管理画面、それ以外はチャット）
function enterApp(profile) {
	if (profile.is_admin) { showAdmin(); } else { showChat(profile.username); }
}

async function showChat(username) {
	loadAdminLabel().then(() => loadChat(true));
	localStorage.setItem('currentUser', username);
	document.getElementById('login-area').classList.add('hidden');
	document.getElementById('register-area').classList.add('hidden');
	document.getElementById('chat-area').classList.remove('hidden');
	loadChat();
	loadUserMemo();
	try {
		const messages = await Study.loadChats();
		let localChats = JSON.parse(localStorage.getItem('chats')||'{}');
		localChats[username] = messages;
		localStorage.setItem('chats', JSON.stringify(localChats));
		loadChat(true);
	} catch (err) {
		console.warn('チャットの読み込みに失敗しました:', err.message);
	}
}
// 利用者メモ保存・読込
async function saveUserMemo() {
	const memo = document.getElementById('user-memo').value;
	const out = document.getElementById('memo-msg');
	try {
		await Study.saveMemo(memo);
		out.textContent = '保存しました';
	} catch (err) {
		out.textContent = '保存に失敗しました: ' + Study.friendly(err);
	}
	setTimeout(()=>{out.textContent='';},1800);
}
async function loadUserMemo() {
	try {
		document.getElementById('user-memo').value = await Study.loadMemo();
	} catch (err) {
		console.warn('メモの読み込みに失敗しました:', err.message);
	}
}

async function showAdmin() {
	await loadAdminLabel();
	document.getElementById('login-area').classList.add('hidden');
	document.getElementById('register-area').classList.add('hidden');
	document.getElementById('admin-area').classList.remove('hidden');
	await loadAdminUserList();
}

async function logout() {
	try { await Study.logout(); } catch (e) { console.warn(e.message); }
	document.getElementById('chat-area').classList.add('hidden');
	document.getElementById('admin-area').classList.add('hidden');
	showLogin();
}

async function resetChat() {
	if (!confirm('会話履歴をリセットしますか？')) return;
	const user = localStorage.getItem('currentUser');
	try { await Study.resetChats(); } catch (err) { alert('リセットに失敗しました: ' + Study.friendly(err)); return; }
	let chats = JSON.parse(localStorage.getItem('chats')||'{}');
	delete chats[user];
	localStorage.setItem('chats', JSON.stringify(chats));
	loadChat(true);
}

function exportChat(format) {
	const user = localStorage.getItem('currentUser');
	let chats = JSON.parse(localStorage.getItem('chats')||'{}');
	const messages = chats[user] || [];
	if (messages.length === 0) {
		alert('会話履歴がありません');
		return;
	}
	let content = '';
	if (format === 'txt') {
		content = messages.map(m => `${m.time} ${m.from}: ${m.text}`).join('\n');
	} else if (format === 'csv') {
		content = '\ufeff時間,送信者,メッセージ\n' + messages.map(m => `"${m.time}","${m.from}","${m.text.replace(/"/g, '""')}"`).join('\n');
	}
	const blob = new Blob([content], { type: format === 'txt' ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `chat_history_${user}.${format}`;
	a.click();
	URL.revokeObjectURL(url);
}

function sendMessage() {
	const msg = document.getElementById('chat-input').value.trim();
	if (!msg) return;
	
	// チャット送信時にポイントを消費
	if (typeof pointsManager !== 'undefined') {
		pointsManager.onChatSend();
	}
	
	const user = localStorage.getItem('currentUser');
	let chats = JSON.parse(localStorage.getItem('chats')||'{}');
	if (!chats[user]) chats[user] = [];
	const id = generateId();
	chats[user].push({ id: id, from: user, text: msg, time: new Date().toLocaleString(), read: false });
	localStorage.setItem('chats', JSON.stringify(chats));
	document.getElementById('chat-input').value = '';
	document.getElementById('chat-input').style.height = 'auto'; // リセット
	document.getElementById('answer-options').innerHTML = '';
	loadChat();
	syncChats(user); // サーバー同期
	autoReply(msg);
}

function sendSuggestion(msg) {
	document.getElementById('chat-input').value = msg;
	sendMessage();
}

function handleKeyDown(event) {
	if (event.key === 'Enter' && !event.shiftKey) {
		event.preventDefault();
		sendMessage();
	}
}

function autoResize(textarea) {
	textarea.style.height = 'auto';
	textarea.style.height = textarea.scrollHeight + 'px';
}

function loadChat(skipSync) {
	const user = localStorage.getItem('currentUser');
	let chats = JSON.parse(localStorage.getItem('chats')||'{}');
	let html = '';
	(chats[user]||[]).forEach(m => {
		const displayName = m.from === ADMIN_SENDER ? adminLabel : m.from;
		if (!m.read) m.read = true;   // 画面に表示した時点で既読にする
		html += `<div class="msg ${m.from===user?'user':'admin'}"><b>${escHtml(displayName)}:</b> ${escHtml(m.text)} <span class="msg-time">${escHtml(m.time)}</span>${m.read ? ' <span class="msg-read">既読</span>' : ''}</div>`;
	});
	localStorage.setItem('chats', JSON.stringify(chats));
	document.getElementById('chat-box').innerHTML = html;
	document.getElementById('chat-box').scrollTop = 9999;
	if (!skipSync && user && (chats[user]||[]).length) scheduleSync();
}

function updateSuggestions() {
	const userInput = document.getElementById('chat-input').value.trim().toLowerCase();
	const inappropriateKeywords = ["馬鹿", "バカ", "アホ", "死ね", "殺す", "クソ", "くたばれ", "使えない", "役立たず", "最低", "ゴミ", "糞", "畜生", "テメエ", "お前", "ファック", "shit", "fuck", "damn", "bitch", "asshole", "bastard", "crap", "dumb", "idiot", "stupid"];
	fetch('static/QA.json')
		.then(res => res.json())
		.then(data => {
			let candidates = [];
			if (!userInput) {
				// 予測候補: ランダムで3-5件
				const filtered = data.filter(item => !item.keywords.some(k => inappropriateKeywords.some(ik => k.toLowerCase().includes(ik.toLowerCase()))));
				const shuffled = filtered.sort(() => 0.5 - Math.random());
				candidates = shuffled.slice(0, Math.floor(Math.random() * 3) + 3); // 3-5件
			} else {
				// 入力候補: 入力に近い言葉、最低5件、最大5件
				candidates = data.filter(item => {
					const hasInappropriate = item.keywords.some(k => inappropriateKeywords.some(ik => k.toLowerCase().includes(ik.toLowerCase())));
					if (hasInappropriate) return false;
					// 部分一致: キーワードにuserInputを含む、またはuserInputにキーワードを含む
					return item.keywords.some(k => k.toLowerCase().includes(userInput) || userInput.includes(k.toLowerCase()));
				});
				// 重複避け
				const seen = new Set();
				candidates = candidates.filter(item => {
					const keyword = item.keywords[0];
					if (seen.has(keyword)) return false;
					seen.add(keyword);
					return true;
				});
				// 最低5件: 足りない場合、ランダム補充
				if (candidates.length < 5) {
					const remaining = data.filter(item => {
						const keyword = item.keywords[0];
						const hasInappropriate = item.keywords.some(k => inappropriateKeywords.some(ik => k.toLowerCase().includes(ik.toLowerCase())));
						return !hasInappropriate && !seen.has(keyword);
					});
					const shuffled = remaining.sort(() => 0.5 - Math.random());
					const additional = shuffled.slice(0, 5 - candidates.length);
					candidates.push(...additional);
				}
				// 最大5件
				candidates = candidates.slice(0, 5);
			}
			const suggestions = candidates.map(item => item.keywords[0]);
			document.getElementById('suggestions').innerHTML = suggestions.map(s => `<button onclick="sendSuggestion('${s}')" style="background:#00f2fe; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">${s}</button>`).join('');
		})
		.catch(err => console.error('QA.json load error:', err));
}

let adminUsers = [];
async function loadAdminUserList() {
	const select = document.getElementById('admin-user-list');
	const ul = document.getElementById('admin-user-list-view');
	try {
		adminUsers = await Study.adminListUsers();
	} catch (err) {
		ul.textContent = '読み込みに失敗しました: ' + Study.friendly(err);
		return;
	}
	select.innerHTML = '';
	ul.innerHTML = '';
	adminUsers.forEach(u => {
		const opt = document.createElement('option');
		opt.value = u.id; opt.textContent = u.username;
		select.appendChild(opt);
		const li = document.createElement('li');
		li.textContent = u.username;
		ul.appendChild(li);
	});
	await showAdminChat();
	await showAdminMemo();
}
// 管理者が選択ユーザーのメモを表示
async function showAdminMemo() {
	const id = document.getElementById('admin-user-list').value;
	const box = document.getElementById('admin-user-memo');
	if (!id) { box.textContent = ''; return; }
	try { box.textContent = await Study.adminLoadMemo(id); } catch (err) { box.textContent = '読み込みに失敗しました'; }
}

async function showAdminChat() {
	const id = document.getElementById('admin-user-list').value;
	const box = document.getElementById('admin-chat-box');
	if (!id) { box.innerHTML = ''; return; }
	let rows = [];
	try { rows = await Study.adminLoadChats(id); } catch (err) { box.textContent = '読み込みに失敗しました'; return; }
	box.innerHTML = rows.map(m => {
		const isAdmin = m.sender === ADMIN_SENDER;
		return `<div class="msg ${isAdmin?'admin':'user'}"><b>${escHtml(isAdmin ? adminLabel : m.sender)}:</b> ${escHtml(m.body)} <span class="msg-time">${escHtml(new Date(m.created_at).toLocaleString())}</span></div>`;
	}).join('');
	box.scrollTop = 9999;
}

async function sendAdminMessage() {
	const id = document.getElementById('admin-user-list').value;
	const input = document.getElementById('admin-chat-input');
	const msg = input.value.trim();
	if (!id || !msg) return;
	try {
		await Study.adminSendMessage(id, ADMIN_SENDER, msg);
	} catch (err) { alert('送信に失敗しました: ' + Study.friendly(err)); return; }
	input.value = '';
	showAdminChat();
}

// 初期表示
function generateId() {
	return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

window.onload = async function() {
	showLogin();
	// Neon のログイン状態が残っていれば、そのまま復帰
	try {
		const profile = await Study.restore();
		if (profile) enterApp(profile);
	} catch (err) {
		console.warn('ログイン状態の確認に失敗しました:', err.message);
	}
};

function autoReply(userMsg) {
	const user = localStorage.getItem('currentUser');
	// Gemini の中継サーバーURLが設定されている場合だけ呼ぶ（GitHub Pages では未設定 → QA.json で応答）
	const geminiUrl = (window.STUDY_CONFIG && window.STUDY_CONFIG.geminiUrl) || '';
	if (!geminiUrl) { fallbackToQA(userMsg, user); return; }
	fetch(geminiUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ prompt: userMsg })
	})
	.then(res => res.json())
	.then(data => {
		if (data.answer) {
			let chats = JSON.parse(localStorage.getItem('chats')||'{}');
			if (!chats[user]) chats[user] = [];
			chats[user].push({ from: ADMIN_SENDER, text: data.answer, time: new Date().toLocaleString(), read: true });
			localStorage.setItem('chats', JSON.stringify(chats));
			loadChat();
		} else {
			// Grokが使えない場合、QA.jsonで対応
			fallbackToQA(userMsg, user);
		}
	})
	.catch(err => {
		console.error('Grok API error:', err);
		// Grokが使えない場合、QA.jsonで対応
		fallbackToQA(userMsg, user);
	});
}

function fallbackToQA(userMsg, user) {
	fetch('static/QA.json')
		.then(res => res.json())
		.then(data => {
			let found = false;
			for (let item of data) {
				if (item.keywords.some(k => userMsg.toLowerCase() === k.toLowerCase())) {
					found = true;
					// 複数答えがある場合、選択ボタンを表示
					if (item.answers && item.answers.length > 1) {
						document.getElementById('answer-options').innerHTML = item.answers.map(a => `<button onclick="selectAnswer('${a.replace(/'/g, "\\'")}')" style="background:#00f2fe; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin:2px;">${a}</button>`).join('');
					} else {
						// 1つだけの場合、直接追加
						let chats = JSON.parse(localStorage.getItem('chats')||'{}');
						if (!chats[user]) chats[user] = [];
						chats[user].push({ from: ADMIN_SENDER, text: item.answers ? item.answers[0] : item.answer, time: new Date().toLocaleString(), read: true });
						localStorage.setItem('chats', JSON.stringify(chats));
						loadChat();
					}
					break;
				}
			}
			if (!found) {
				// QAにもマッチしなければ、デフォルトメッセージ
				let chats = JSON.parse(localStorage.getItem('chats')||'{}');
				if (!chats[user]) chats[user] = [];
				chats[user].push({ from: ADMIN_SENDER, text: 'すいません、よくわかりません', time: new Date().toLocaleString(), read: true });
				localStorage.setItem('chats', JSON.stringify(chats));
				loadChat();
			}
		})
		.catch(err => console.error('QA.json load error:', err));
}

function selectAnswer(answer) {
	const user = localStorage.getItem('currentUser');
	let chats = JSON.parse(localStorage.getItem('chats')||'{}');
	if (!chats[user]) chats[user] = [];
	chats[user].push({ from: ADMIN_SENDER, text: answer, time: new Date().toLocaleString(), read: true });
	localStorage.setItem('chats', JSON.stringify(chats));
	document.getElementById('answer-options').innerHTML = '';
	loadChat();
}

async function syncChats(user) {
	let chats = JSON.parse(localStorage.getItem('chats')||'{}');
	try {
		await Study.syncChats(chats[user] || []);
	} catch (err) {
		console.warn('チャットの保存に失敗しました:', err.message);
	}
}

// Service Worker登録
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
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
});
