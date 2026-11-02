/**
 * ポイント管理（Neon版）
 * 増減の金額と回数制限はサーバー側（point_rules / apply_points）で決まります。
 * ここでは「どの行動をしたか」を伝えて、結果を画面に表示するだけです。
 */
class PointsManager {
    constructor() {
        this.INITIAL_POINTS = 20000;
        this.LABELS = {
            quiz_answer: 'クイズ回答', chat_send: 'チャット送信', term_search: '用語検索',
            elearning_visit: 'eラーニング参加', survey_answer: 'アンケート回答', story_read: '物語閲覧',
            video_watch: '動画視聴', weather_check: '天気確認', train_check: '電車確認',
            manual_view: 'マニュアル閲覧', daily_login: 'デイリーログイン', story_link_click: '物語リンク'
        };
        this.updateDisplay();
    }

    getPoints() {
        const v = parseInt(localStorage.getItem('userPoints'), 10);
        return Number.isFinite(v) ? v : this.INITIAL_POINTS;
    }

    /** サーバーに行動を伝える。付与済み・未ログインのときは何もしない */
    async act(action, ref) {
        if (!window.Study || !Study.profile && !(await Study.restore().catch(() => null))) return null;
        const before = this.getPoints();
        let after;
        try { after = await Study.applyPoints(action, ref); } catch (e) { return null; }
        if (after === null || after === undefined) return null;
        this.updateDisplay();
        this.showPointsNotification(after - before, this.LABELS[action] || '', after);
        return after;
    }

    onQuizComplete() { return this.act('quiz_answer'); }
    onChatSend() { return this.act('chat_send'); }
    onChatMessage() { return this.act('chat_send'); }
    onTermSearch() { return this.act('term_search'); }
    onLearningAccess() { return this.act('elearning_visit'); }
    onSurveyComplete() { return this.act('survey_answer', 'survey'); }
    onStoryRead(id) { return this.act('story_read', id || 'story'); }
    onVideoWatch(id) { return this.act('video_watch', id); }
    onWeatherCheck() { return this.act('weather_check'); }
    onTrainCheck() { return this.act('train_check'); }
    onManualAccess() { return this.act('manual_view'); }
    onStoryLinkClick(url) { return this.act('story_link_click', url); }
    checkDailyBonus() { return this.act('daily_login'); }

    async getHistory(limit = 100) {
        try { return await Study.pointHistory(limit); } catch (e) { return []; }
    }

    updateDisplay() {
        const points = this.getPoints();
        document.querySelectorAll('.points-display').forEach((element) => {
            element.textContent = `${points.toLocaleString()}円`;
            element.style.color = points < 5000 ? '#ff4444' : points < 10000 ? '#ffaa00' : '#00ff88';
        });
    }

    showPointsNotification(amount, reason, newPoints) {
        // 既存の通知があれば削除
        const existing = document.querySelector('.points-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'points-notification';
        
        const sign = amount > 0 ? '+' : '';
        const color = amount > 0 ? '#00ff88' : '#ff4444';
        const emoji = amount > 0 ? '💰' : '💸';
        
        notification.innerHTML = `
            <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 10px; 
                        border: 2px solid ${color}; box-shadow: 0 0 20px ${color};">
                <div style="font-size: 2em;">${emoji}</div>
                <div style="color: ${color}; font-size: 1.5em; font-weight: bold; margin: 10px 0;">
                    ${sign}${amount.toLocaleString()}円
                </div>
                <div style="color: #fff; margin: 5px 0;">${reason}</div>
                <div style="color: #00e0ff; font-size: 1.2em; margin-top: 10px;">
                    残高: ${newPoints.toLocaleString()}円
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            animation: pointsNotificationAnim 2s ease-in-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }

    // ポイント警告

    getPointsRank() {
        const points = this.getPoints();
        if (points >= 50000) return { rank: 'プラチナ', color: '#e5e4e2', bonus: 1.5 };
        if (points >= 30000) return { rank: 'ゴールド', color: '#ffd700', bonus: 1.3 };
        if (points >= 15000) return { rank: 'シルバー', color: '#c0c0c0', bonus: 1.1 };
        if (points >= 5000) return { rank: 'ブロンズ', color: '#cd7f32', bonus: 1.0 };
        return { rank: 'ビギナー', color: '#888888', bonus: 1.0 };
    }

    checkTimeBonus() { return 1.0; } // 倍率はサーバー側の固定ルールのため使いません
}

const pointsManager = new PointsManager();
window.pointsManager = pointsManager;

window.addEventListener('load', () => { pointsManager.checkDailyBonus(); });

// アニメーション用CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pointsNotificationAnim {
        0% { opacity: 0; transform: translate(-50%, -60%) scale(0.8); }
        10% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -40%) scale(0.9); }
    }
    
    .rank-badge {
        display: inline-block;
        padding: 5px 12px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9em;
        margin-left: 10px;
        box-shadow: 0 0 10px currentColor;
    }
`;
document.head.appendChild(style);
