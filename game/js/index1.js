        // DOM読み込み後に BGM を再生
        document.addEventListener('DOMContentLoaded', () => {
            playBgm('DQB2序曲');

            // 戦闘シーン疑似体験ボタンは index2.html に遷移（必要なら変更してください）
            const startButton = document.getElementById('start-button');
            if (startButton) {
                startButton.addEventListener('click', () => {
                    window.location.href = 'index2.html';
                });
            }

            // クレジット（既存の index3.html へ遷移）
            const manageSavesButton = document.getElementById('manage-saves-button');
            if (manageSavesButton) {
                manageSavesButton.addEventListener('click', () => {
                    window.location.href = 'index3.html';
                });
            }

            // ポケモン疑似体験ボタンの遷移設定
            const pokeButton = document.getElementById('poke-button');
            if (pokeButton) {
                pokeButton.addEventListener('click', () => {
                    window.location.href = 'poke.html';
                });
            }
        });

        // BGM再生関数（bgm フォルダ内の mp3 を想定）
        function playBgm(mapName) {
            const bgmAudio = document.getElementById('bgm');
            if (!bgmAudio) return;
            const bgmSrc = `bgm/${mapName}.mp3`;
            bgmAudio.src = bgmSrc;
            // 保存された音量があれば使用、なければ 0.3
            const stored = localStorage.getItem('bgmVolume');
            bgmAudio.volume = stored !== null ? parseFloat(stored) : 0.3;
            bgmAudio.play().catch(e => console.error('BGM play failed:', e));
        }
    
