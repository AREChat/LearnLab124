// 「このページのリンクをコピー」ボタン（安全な範囲：現在のページのURLだけをコピーします）
(function () {
    var btn = document.getElementById('copyLinkBtn');
    var msg = document.getElementById('copyMsg');
    if (!btn) return;
    function say(t) { if (msg) { msg.textContent = t; setTimeout(function () { msg.textContent = ''; }, 2500); } }
    function fallback(text) {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta); ta.select();
        var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove(); return ok;
    }
    btn.addEventListener('click', function () {
        var u = location.href.split('#')[0];
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(u).then(function () { say('コピーしました'); }, function () { say(fallback(u) ? 'コピーしました' : 'コピーできませんでした'); });
        } else { say(fallback(u) ? 'コピーしました' : 'コピーできませんでした'); }
    });
})();
