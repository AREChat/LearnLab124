// ========================================
// セキュリティ対策スクリプト
// 全HTMLファイルで読み込んで使用
// ========================================
(function() {
    'use strict';
    const siteRoot = document.currentScript ? new URL('../', document.currentScript.src) : new URL('./', location.href);
    
    // F12キー、開発者ツール、ソース表示無効化
    document.addEventListener('keydown', function(e) {
        // F12キー
        if (e.key === 'F12' || e.key === 'F7' ||
            // Ctrl+Shift+S (名前をつけて保存の別の形)
            ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') ||
            // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (開発者ツール)
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
            // Cmd+Option+I, Cmd+Option+J, Cmd+Option+C (Mac)
            (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
            // Ctrl+U, Cmd+U (ソース表示)
            (e.ctrlKey && e.key.toLowerCase() === 'u') ||
            (e.metaKey && e.key.toLowerCase() === 'u') ||
            // Ctrl+S, Cmd+S (ページ保存)
            ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's')) {
            e.preventDefault();
            (window.__secAlert=window.__secAlert||function(m){var n=Date.now();if(n-(window.__secAlertAt||0)<1500)return;window.__secAlertAt=n;alert(m);})('⚠️ 開発者ツールの使用は禁止されています。利用規約違反です。');
            return false;
        }
    });

    // ファイルのドロップ（ページが別のファイルに切りかわるのを防ぐ）
    ['dragover', 'drop'].forEach(function(t) {
        window.addEventListener(t, function(e) {
            var dt = e.dataTransfer;
            if (dt && dt.types && Array.prototype.indexOf.call(dt.types, 'Files') >= 0) {
                e.preventDefault();
                try { dt.dropEffect = 'none'; } catch (_e) {}
            }
        }, true);
    });

    // 右クリック無効化
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        (window.__secAlert=window.__secAlert||function(m){var n=Date.now();if(n-(window.__secAlertAt||0)<1500)return;window.__secAlertAt=n;alert(m);})('⚠️ 右クリックは無効化されています。');
        return false;
    });

    // コピー・切り取り防止
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener('cut', function(e) {
        e.preventDefault();
        return false;
    });

    // 画像・動画のドラッグ保存を止める
    document.addEventListener('dragstart', function(e) {
        const t = e.target;
        if (t && (t.tagName === 'IMG' || t.tagName === 'VIDEO' || t.tagName === 'CANVAS')) e.preventDefault();
    }, true);

    // 選択防止（オプション：必要に応じてコメント解除）
    /*
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    */

    // デバッグ検出（開発者ツールが開かれているかチェック）
    const detectDevTools = function() {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            alert('⚠️ 開発者ツールの使用を検出しました。利用規約違反です。');
            // 必要に応じて、ページをリロードまたは別ページへリダイレクト
            // window.location.href = 'about:blank';
        }
    };

    // 定期的に開発者ツールの使用をチェック
    setInterval(detectDevTools, 1000);

    console.log('%c⛔ 警告', 'color: red; font-size: 50px; font-weight: bold;');
    console.log('%c開発者ツールの使用は禁止されています。', 'color: red; font-size: 20px;');
    console.log('%cこのサイトのソースコードの閲覧・改変・複製は利用規約違反です。', 'color: red; font-size: 16px;');
    console.log('%c違反者は法的措置の対象となります。', 'color: red; font-size: 16px;');

    // 利用規約の同意ゲートは廃止しました（最初の画面は home.html に統一）。

})();
