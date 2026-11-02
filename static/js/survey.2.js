var submitted=false;
        
        // アンケート送信時のポイント付与
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.querySelector('.survey-form-container');
            if (form && typeof pointsManager !== 'undefined') {
                form.addEventListener('submit', () => {
                    pointsManager.onSurveyComplete();
                });
            }
        });
