// ログアウト：Neon のセッションを終了して、ログイン画面へ戻る
async function logout() {
    try {
        if (typeof Study !== 'undefined') await Study.logout();
    } catch (e) {
        console.warn('ログアウト処理でエラー:', e.message);
    }
    ['currentUser', 'isAdmin', 'userPoints'].forEach(function (k) { localStorage.removeItem(k); });
    window.location.href = 'login.html';
}

// このページを開いたら自動でログアウトする
logout();
