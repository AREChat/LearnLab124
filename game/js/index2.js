        // 保存・ロードボタンのイベント
        document.addEventListener('DOMContentLoaded', () => {
            const saveButton = document.getElementById('save-button');
            const loadButton = document.getElementById('load-button');

            if (saveButton) {
                saveButton.addEventListener('click', () => {
                    if (window.game) {
                        window.game.saveGameState();
                    }
                });
            }

            if (loadButton) {
                loadButton.addEventListener('click', () => {
                    if (window.game) {
                        window.game.loadGameState();
                    }
                });
            }
        });
    
