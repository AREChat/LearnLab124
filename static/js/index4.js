            function updateWeatherAndTrain() {
                // 気象庁の東京地方天気予報（JSON）
                fetch('https://www.jma.go.jp/bosai/forecast/data/overview_forecast/130000.json')
                    .then(r => r.json())
                    .then(data => {
                        document.getElementById('weather-result').textContent = data.text.split('\n')[0];
                    })
                    .catch(() => {
                        document.getElementById('weather-result').textContent = '取得できませんでした';
                    });
            }
            updateWeatherAndTrain();
            setInterval(updateWeatherAndTrain, 3600000); // 60分ごとに更新

            // ハンバーガーメニュー
            const hamburgerButton = document.getElementById('hamburger-menu-btn');
            const toc = document.getElementById('table-of-contents');
            if (hamburgerButton && toc) {
                hamburgerButton.addEventListener('click', () => {
                    toc.classList.toggle('open');
                });
                document.addEventListener('click', (e) => {
                    if (!toc.contains(e.target) && e.target !== hamburgerButton) {
                        toc.classList.remove('open');
                    }
                });
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
            
