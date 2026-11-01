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

            // 動画視聴完了を検知してポイント付与
            const videos = document.querySelectorAll('.video-card iframe, .audio-card iframe');
            const watchedVideos = {};
            if (typeof Study !== 'undefined') {
                Study.watchedVideos().then(ids => ids.forEach(id => { watchedVideos[id] = true; })).catch(() => {});
            }

            videos.forEach((iframe, index) => {
                const videoId = `video_${index}`;

                // iframeの読み込み完了を監視
                iframe.addEventListener('load', () => {
                    // 動画が再生された後、一定時間経過したらポイント付与
                    setTimeout(() => {
                        if (!watchedVideos[videoId] && typeof pointsManager !== 'undefined') {
                            watchedVideos[videoId] = true;
                            if (typeof Study !== 'undefined') Study.markVideoWatched(videoId).catch(() => {});
                            pointsManager.onVideoWatch(videoId);
                        }
                    }, 30000); // 30秒視聴でポイント付与
                });
            });
        });
    
