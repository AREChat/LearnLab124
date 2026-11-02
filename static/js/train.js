const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
        const UPDATE_INTERVAL_MS = 60 * 1000;
        let countdownSeconds = UPDATE_INTERVAL_MS / 1000;

        const resultContainer = document.getElementById('result-container');
        const lastUpdatedElem = document.getElementById('last-updated');
        const countdownElem = document.getElementById('countdown');
        
        async function fetchAndUpdate() {
            try {
                const row = await Study.siteData('train');
                const response = { ok: true, status: 200, json: async () => row.payload };

                if (!response.ok) {
                    if (response.status === 404) {
                        resultContainer.innerHTML = `<div class="message-box error"><p><strong>データファイルが見つかりません。</strong></p><p>現在、運行情報データを準備中です。しばらくしてからページを再読み込みしてください。</p><p><small>(GitHub Actionsの初回実行には数分かかることがあります)</small></p></div>`;
                        lastUpdatedElem.textContent = 'データ生成待ち';
                    } else {
                        throw new Error(`サーバーエラーが発生しました (HTTP ${response.status})`);
                    }
                    return; 
                }
                
                // ★★★ 修正点 ★★★
                // JSONデータをオブジェクトとして読み込み、中のキーにアクセスする
                const data = await response.json();
                
                if (data.lastUpdated) {
                    lastUpdatedElem.textContent = `データ生成時刻: ${new Date(data.lastUpdated).toLocaleString('ja-JP')}`;
                }

                resultContainer.innerHTML = '';
                
                const lines = data.lines || []; // `data.lines` を見るように修正

                if (lines.length > 0) {
                    const troubledLines = lines.filter(item => item.status !== '平常運転' && !item.status.includes('ほぼ平常'));

                    if (troubledLines.length > 0) {
                        troubledLines.forEach(item => {
                            const infoDiv = document.createElement('div');
                            infoDiv.className = 'train-info';
                            
                            infoDiv.innerHTML = `
                                <div class="line-name">${esc(item.name || '情報なし')}</div>
                                <div class="status">状況: ${esc(item.status || '情報なし')}</div>
                                <button class="toggle-details-btn">詳細表示</button>
                                <div class="details" style="display: none;">${esc(item.detail || '情報なし')}</div>
                            `;

                            resultContainer.appendChild(infoDiv);
                        });
                    } else {
                        resultContainer.innerHTML = `
                            <div class="message-box success">
                                <p><strong>すべて正常運転です</strong></p>
                            </div>
                        `;
                    }
                } else {
                    resultContainer.innerHTML = `<div class="message-box"><p>路線の情報が見つかりませんでした。</p></div>`;
                }

            } catch (error) {
                if (/ログインが必要/.test(error.message || '')) {
                    // ログイン画面をなくしたため、ログインなしでは読めない（取得のしくみを作り直し中）
                    resultContainer.innerHTML = `<div class="message-box"><p><strong>電車情報は、いま準備中です。</strong></p><p>しばらくしてからもう一度ひらいてください。</p></div>`;
                    lastUpdatedElem.textContent = '準備中';
                } else {
                    resultContainer.innerHTML = `<div class="message-box error"><p><strong>情報の取得に失敗しました。</strong></p><p>ネットワーク接続を確認するか、しばらくしてから再試行してください。</p><p><small>エラー: ${esc(error.message)}</small></p></div>`;
                }
            } finally {
                countdownSeconds = UPDATE_INTERVAL_MS / 1000;
            }
        }

        function updateTimer() {
            countdownElem.textContent = `次の表示更新まで ${countdownSeconds} 秒`;
            countdownSeconds--;
        }

        resultContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('toggle-details-btn')) {
                const btn = event.target;
                const detailsDiv = btn.nextElementSibling;

                if (detailsDiv && detailsDiv.classList.contains('details')) {
                    const isHidden = detailsDiv.style.display === 'none';
                    detailsDiv.style.display = isHidden ? 'block' : 'none';
                    btn.textContent = isHidden ? '詳細を隠す' : '詳細表示';
                }
            }
        });

        fetchAndUpdate(); 
        setInterval(fetchAndUpdate, UPDATE_INTERVAL_MS);
        
        updateTimer();
        setInterval(updateTimer, 1000);

// LocalStorageの古いデータをクリーンアップ(6時間以上経過したデータを削除)
		function cleanupOldTrainData() {
			try {
				const DATA_RETENTION_HOURS = 6;
				const lastCheck = localStorage.getItem('lastTrainCheck');
				
				if (lastCheck) {
					const checkDate = new Date(lastCheck);
					const now = new Date();
					const hoursDiff = (now - checkDate) / (1000 * 60 * 60);
					
					if (hoursDiff > DATA_RETENTION_HOURS) {
						localStorage.removeItem('lastTrainCheck');
						console.log(`古い電車データを削除しました (${hoursDiff.toFixed(1)}時間経過)`);
					}
				}
			} catch (error) {
				console.error('データクリーンアップエラー:', error);
			}
		}
		
		// ページ読み込み時にクリーンアップ実行
		cleanupOldTrainData();
		
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

			// 電車情報確認ポイント付与（1日1回）
			if (typeof pointsManager !== 'undefined') {
				const today = new Date().toDateString();
				const lastTrainCheck = localStorage.getItem('lastTrainCheck');
				
				if (lastTrainCheck !== today) {
					setTimeout(() => {
						pointsManager.onTrainCheck();
						localStorage.setItem('lastTrainCheck', today);
					}, 5000); // 5秒間ページに滞在でポイント付与
				}
			}
		});
