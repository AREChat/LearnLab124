// ログイン・新規登録（Neon Auth）。パスワードはこのブラウザに保存しません。
function togglePw(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}
function setMsg(text) { document.getElementById('message').textContent = text || ''; }
function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    setMsg('');
}
function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    setMsg('');
}
async function register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!username || !password) { setMsg('ユーザ名とパスワードは必須です'); return; }
    try {
        setMsg('登録中...');
        await Study.register(username, password);
        window.location.href = 'loading.html';
    } catch (e) {
        setMsg(Study.friendly(e));
    }
}
async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) { setMsg('ユーザ名とパスワードを入力してください'); return; }
    try {
        setMsg('ログイン中...');
        await Study.login(username, password);
        window.location.href = 'loading.html';
    } catch (e) {
        setMsg(Study.friendly(e));
    }
}
window.addEventListener('load', async function () {
    try {
        const prof = await Study.restore();
        if (prof) window.location.href = 'loading.html';
    } catch (e) { /* 未ログイン */ }
});
