// フォーム初期化
        document.addEventListener('DOMContentLoaded', function() {
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('date');
            if (dateInput) {
                dateInput.value = today;
            }
        });
