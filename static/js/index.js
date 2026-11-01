        // F12キー、開発者ツール、右クリック無効化
        document.addEventListener('keydown', e => {
            // F12キー無効化
            if (e.key === 'F12' || 
                // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (開発者ツール)
                (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
                // Cmd+Option+I, Cmd+Option+J, Cmd+Option+C (Mac)
                (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
                // Ctrl+U (ソース表示)
                (e.ctrlKey && e.key.toLowerCase() === 'u') ||
                // Cmd+U (Mac)
                (e.metaKey && e.key.toLowerCase() === 'u')) {
                e.preventDefault();
                alert('⚠️ 開発者ツールの使用は禁止されています。利用規約違反です。');
                return false;
            }
        });

        // 右クリック無効化
        document.addEventListener('contextmenu', e => {
            e.preventDefault();
            alert('⚠️ 右クリックは無効化されています。');
            return false;
        });

        // コピー防止
        document.addEventListener('copy', e => {
            e.preventDefault();
            alert('⚠️ コンテンツのコピーは禁止されています。');
            return false;
        });

        // 利用規約チェック
        if (!localStorage.getItem('agreed')) {
            document.getElementById('terms').style.display = 'block';
            document.getElementById('splash').style.display = 'none';
        } else {
            window.location.href = 'login.html';
        }

        // 同意するボタン
        document.getElementById('agree').onclick = function() {
            localStorage.setItem('agreed', 'true');
            localStorage.removeItem('disagreeCount'); // カウンターリセット
            window.location.href = 'login.html';
        };

        // 同意しないボタン（5回で強制終了）
        document.getElementById('disagree').onclick = function() {
            let disagreeCount = parseInt(localStorage.getItem('disagreeCount') || '0');
            disagreeCount++;
            localStorage.setItem('disagreeCount', disagreeCount);
            
            const remaining = 5 - disagreeCount;
            const counterDiv = document.getElementById('disagree-counter');
            
            if (disagreeCount >= 5) {
                // 5回目：管理者通知＆強制終了
                alert('🚨 管理者へ通報されました 🚨\n\nあなたのアクセスは記録され、管理者に送信されました。\nこのサイトへのアクセスは永久に禁止されます。');
                localStorage.setItem('banned', 'true');
                // 強制的にページを閉じる試み（ブラウザによっては動作しない場合がある）
                window.location.href = 'about:blank';
                window.close();
                // 閉じられない場合は空白ページにリダイレクト
                document.body.innerHTML = '<div style="text-align:center; padding:50px; font-size:24px; color:#ff0000;"><h1>🚫 アクセス禁止 🚫</h1><p>利用規約に同意しなかったため、このサイトへのアクセスは禁止されました。</p><p>管理者に通報済みです。</p></div>';
            } else {
                // 1〜4回目：警告表示
                counterDiv.style.display = 'block';
                counterDiv.innerHTML = `⚠️ 警告: 残り ${remaining} 回で管理者に通報されます！`;
                document.getElementById('message').style.display = 'block';
                
                if (disagreeCount >= 3) {
                    alert(`🚨 最終警告 🚨\n\nあと ${remaining} 回「同意しない」を押すと、管理者に通報されアクセスが永久に禁止されます。\n\n今すぐ「同意する」を押してください。`);
                }
            }
        };

        // アクセス禁止チェック
        if (localStorage.getItem('banned') === 'true') {
            document.body.innerHTML = '<div style="text-align:center; padding:50px; font-size:24px; color:#ff0000;"><h1>🚫 アクセス禁止 🚫</h1><p>あなたのアクセスは禁止されています。</p><p>管理者に連絡してください。</p></div>';
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
    
