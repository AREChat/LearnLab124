        // パーティクル生成
        function createParticles() {
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.width = Math.random() * 10 + 5 + 'px';
                particle.style.height = particle.style.width;
                particle.style.animationDelay = Math.random() * 10 + 's';
                particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
                document.body.appendChild(particle);
            }
        }
        createParticles();

        // 主催者版の状態
        let maxNumber = 75;
        let drawnNumbers = [];
        let availableNumbers = Array.from({length: 75}, (_, i) => i + 1);

        // 参加者版の状態
        let maxNumberPlayer = 75;
        let playerCard = [];
        let markedCells = new Set();
        let isReplaying = false; // 読み上げ中フラグ

        // 音声再生（bingo-soundsフォルダ → Web Speech API）
        function playSound(number) {
            const audio = new Audio(`bingo-sounds/${number}.mp3`);
            
            audio.play().catch(err => {
                console.log(`bingo-sounds/${number}.mp3 が見つかりません。Web Speech APIで読み上げます。`);
                // ローカルファイル失敗時はWeb Speech APIで読み上げ
                speakNumber(number);
            });
        }

        // Web Speech APIで数字を読み上げ
        function speakNumber(number) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(number.toString());
                utterance.lang = 'ja-JP';
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                
                speechSynthesis.speak(utterance);
            } else {
                console.log('音声合成APIが利用できません');
            }
        }

        // 最大番号更新（主催者版）
        function updateMaxNumber() {
            const input = document.getElementById('maxNumber');
            let value = parseInt(input.value);
            if (!Number.isFinite(value)) value = 75;   // 空っぽ・数字でないときは、はじめの 75 にもどす
            
            if (value < 10) value = 10;
            if (value > 100) value = 100;
            
            input.value = value;
            maxNumber = value;
            
            // 表示を更新
            document.getElementById('maxCount').textContent = maxNumber;
            const maxNumberInfo = document.getElementById('maxNumberInfo');   // 画面にこの表示が無くても、あとの「ゲームをリセット」まで必ず進める
            if (maxNumberInfo) maxNumberInfo.textContent = maxNumber;
            
            // ゲームをリセット
            drawnNumbers = [];
            availableNumbers = Array.from({length: maxNumber}, (_, i) => i + 1);
            document.getElementById('currentNumber').textContent = '-';
            updateHistory();
        }

        // ページ読み込み時に初期表示
        window.addEventListener('DOMContentLoaded', function() {
            updateHistory();
        });

        // 最大番号更新（参加者版）
        function updateMaxNumberPlayer() {
            const input = document.getElementById('maxNumberPlayer');
            let value = parseInt(input.value);
            if (!Number.isFinite(value)) value = 75;   // 空っぽ・数字でないときは、はじめの 75 にもどす
            
            if (value < 25) value = 25;   // カードは25マス（真ん中だけ FREE）。数字が25個より少ないと、マスが足りなくなる
            if (value > 100) value = 100;
            
            input.value = value;
            maxNumberPlayer = value;
            
            // 新しいカードを生成
            generateNewCard();
        }

        // モード切り替え
        function switchMode(mode) {
            const hostMode = document.getElementById('hostMode');
            const playerMode = document.getElementById('playerMode');
            const hostBtn = document.querySelector('.mode-btn.host');
            const playerBtn = document.querySelector('.mode-btn.player');

            if (mode === 'host') {
                hostMode.style.display = 'block';
                playerMode.style.display = 'none';
                hostBtn.classList.add('active');
                playerBtn.classList.remove('active');
            } else {
                hostMode.style.display = 'none';
                playerMode.style.display = 'block';
                hostBtn.classList.remove('active');
                playerBtn.classList.add('active');
                if (playerCard.length === 0) {
                    generateNewCard();
                }
            }
        }

        // 主催者版：番号を引く
        function drawNumber() {
            if (availableNumbers.length === 0) {
                alert('全ての番号が出ました!');
                return;
            }

            const drawBtn = document.getElementById('drawBtn');
            drawBtn.disabled = true;

            // ランダムに番号を選ぶ
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const number = availableNumbers[randomIndex];
            
            // 配列から削除
            availableNumbers.splice(randomIndex, 1);
            drawnNumbers.push(number);

            // アニメーション効果
            const display = document.getElementById('currentNumber');
            let count = 0;
            const interval = setInterval(() => {
                display.textContent = Math.floor(Math.random() * maxNumber) + 1;
                count++;
                if (count > 20) {
                    clearInterval(interval);
                    display.textContent = number;
                    
                    // 音声を再生
                    playSound(number);
                    
                    // 履歴を更新
                    updateHistory();
                    
                    drawBtn.disabled = false;
                }
            }, 50);
        }

        function updateHistory() {
            const drawnGrid = document.getElementById('drawnNumbersGrid');
            const remainingGrid = document.getElementById('remainingNumbers');
            const countSpan = document.getElementById('drawnCount');
            const replayBtn = document.getElementById('replayBtn');
            
            countSpan.textContent = drawnNumbers.length;
            
            // 読み上げボタンの有効/無効を切り替え
            if (drawnNumbers.length > 0) {
                replayBtn.disabled = false;
            } else {
                replayBtn.disabled = true;
            }
            
            // 出た番号を表示（新しい順）
            drawnGrid.innerHTML = '';
            drawnNumbers.slice().reverse().forEach(num => {
                const div = document.createElement('div');
                div.className = 'number-item drawn';
                div.textContent = num;
                drawnGrid.appendChild(div);
            });
            
            // 残りの番号を表示（昇順）
            remainingGrid.innerHTML = '';
            availableNumbers.slice().sort((a, b) => a - b).forEach(num => {
                const div = document.createElement('div');
                div.className = 'number-item remaining';
                div.textContent = num;
                remainingGrid.appendChild(div);
            });
        }

        // 出た数字を順番に読み上げ
        async function replayDrawnNumbers() {
            if (isReplaying || drawnNumbers.length === 0) return;
            
            isReplaying = true;
            const replayBtn = document.getElementById('replayBtn');
            const drawBtn = document.getElementById('drawBtn');
            const display = document.getElementById('currentNumber');
            
            // ボタンを無効化
            replayBtn.disabled = true;
            drawBtn.disabled = true;
            replayBtn.textContent = '🔊 読み上げ中...';
            
            // 出た順番に読み上げ
            for (let i = 0; i < drawnNumbers.length; i++) {
                const number = drawnNumbers[i];
                
                // 番号を表示
                display.textContent = number;
                display.style.color = '#f5576c';
                
                // 音声再生
                await playAndWait(number);
                
                // 次の番号まで少し待機
                if (i < drawnNumbers.length - 1) {
                    await sleep(800);
                }
            }
            
            // 元に戻す
            await sleep(1000);
            display.textContent = drawnNumbers[drawnNumbers.length - 1] || '-';
            display.style.color = '#667eea';
            
            // ボタンを有効化
            replayBtn.disabled = false;
            drawBtn.disabled = false;
            replayBtn.textContent = '🔊 出た数字読み上げ';
            isReplaying = false;
        }

        // 音声再生を待機
        function playAndWait(number) {
            return new Promise((resolve) => {
                const audio = new Audio(`bingo-sounds/${number}.mp3`);
                
                let resolved = false;
                
                audio.addEventListener('ended', () => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                });
                
                audio.addEventListener('error', () => {
                    if (!resolved) {
                        console.log(`bingo-sounds/${number}.mp3 が見つかりません。Web Speech APIで読み上げます。`);
                        resolved = true;
                        speakNumberAndWait(number).then(resolve);
                    }
                });
                
                audio.play().catch(() => {
                    if (!resolved) {
                        resolved = true;
                        speakNumberAndWait(number).then(resolve);
                    }
                });
            });
        }

        // Web Speech APIで読み上げ(待機版)
        function speakNumberAndWait(number) {
            return new Promise((resolve) => {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(number.toString());
                    utterance.lang = 'ja-JP';
                    utterance.rate = 0.9;
                    utterance.pitch = 1.0;
                    utterance.volume = 1.0;
                    
                    utterance.onend = () => {
                        setTimeout(resolve, 300);
                    };
                    
                    utterance.onerror = () => {
                        setTimeout(resolve, 500);
                    };
                    
                    speechSynthesis.speak(utterance);
                } else {
                    setTimeout(resolve, 500);
                }
            });
        }

        // スリープ関数
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // ゲームリセット
        function resetGame() {
            if (confirm('ゲームをリセットしますか?')) {
                drawnNumbers = [];
                availableNumbers = Array.from({length: maxNumber}, (_, i) => i + 1);
                document.getElementById('currentNumber').textContent = '-';
                updateHistory();
            }
        }

        // 参加者版：ビンゴカード生成
        function generateNewCard() {
            playerCard = [];
            markedCells.clear();
            
            // 1-maxNumberPlayerからランダムに25個選ぶ（中央はFREE）
            const numbers = Array.from({length: maxNumberPlayer}, (_, i) => i + 1);
            for (let i = numbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }
            
            playerCard = numbers.slice(0, 25);
            playerCard[12] = 'FREE'; // 中央をFREEに
            markedCells.add(12); // FREEは最初からマーク済み
            
            renderCard();
        }

        // カード描画
        function renderCard() {
            const cardDiv = document.getElementById('bingoCard');
            cardDiv.innerHTML = '';
            
            playerCard.forEach((num, index) => {
                const cell = document.createElement('div');
                cell.className = 'bingo-cell';
                if (num === 'FREE') {
                    cell.classList.add('free');
                }
                if (markedCells.has(index)) {
                    cell.classList.add('marked');
                }
                cell.textContent = num;
                cell.onclick = () => toggleMark(index);
                cardDiv.appendChild(cell);
            });
        }

        // セルのマーク切り替え
        function toggleMark(index) {
            if (playerCard[index] === 'FREE') return;
            
            if (markedCells.has(index)) {
                markedCells.delete(index);
            } else {
                markedCells.add(index);
            }
            renderCard();
        }

        // 参加者版：番号を引く
        function drawNumberPlayer() {
            const number = Math.floor(Math.random() * maxNumberPlayer) + 1;
            const display = document.getElementById('currentNumberPlayer');
            
            // アニメーション効果
            let count = 0;
            const interval = setInterval(() => {
                display.textContent = Math.floor(Math.random() * maxNumberPlayer) + 1;
                count++;
                if (count > 20) {
                    clearInterval(interval);
                    display.textContent = number;
                    
                    // 音声を再生
                    playSound(number);
                    
                    // カードに該当する番号があれば強調
                    highlightNumber(number);
                }
            }, 50);
        }

        // 該当番号を一時的に強調
        function highlightNumber(number) {
            const index = playerCard.indexOf(number);
            if (index !== -1 && !markedCells.has(index)) {
                const cells = document.querySelectorAll('.bingo-cell');
                cells[index].style.animation = 'pulse 1s ease 3';
                setTimeout(() => {
                    cells[index].style.animation = '';
                }, 3000);
            }
        }
    
