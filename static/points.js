/**
 * ポイント管理（ローカル版）
 * ログイン・アカウントは不要です。ブラウザの localStorage だけで完結します
 * （アカウント機能・ログインが必要なのは別サイトの ARE チャットアプリのみ）。
 * 金額や「1日1回」などの制限は、このファイル内の RULES で管理します。
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
        // delta: 1回あたりの増減。limit: 'none'=制限なし（毎回）/ 'daily'=1日1回(JST) / 'once'=refごとに生涯1回
        this.RULES = {
            quiz_answer: { delta: -100, limit: 'none' },
            chat_send: { delta: -100, limit: 'none' },
            term_search: { delta: -50, limit: 'none' },
            elearning_visit: { delta: 2000, limit: 'daily' },
            survey_answer: { delta: 1000, limit: 'once' },
            story_read: { delta: 1000, limit: 'once' },
            video_watch: { delta: 1000, limit: 'once' },
            daily_login: { delta: 500, limit: 'daily' },
            weather_check: { delta: 500, limit: 'daily' },
            train_check: { delta: 500, limit: 'daily' },
            manual_view: { delta: 300, limit: 'daily' },
            story_link_click: { delta: 200, limit: 'once' }
        };
        this.updateDisplay();
    }

    getPoints() {
        let v = NaN;
        try { v = parseInt(localStorage.getItem('userPoints'), 10); } catch (_e) { /* 保存が使えない環境でも落とさない */ }
        return Number.isFinite(v) ? v : this.INITIAL_POINTS;
    }

    setPoints(v) {
        try { localStorage.setItem('userPoints', String(v)); } catch (_e) { /* 保存が使えない環境でも落とさない */ }
    }

    /** 日本時間(JST)の「今日」の日付文字列(YYYY-MM-DD)。日の区切りはJST 0時 */
    _todayJst() {
        try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date()); }
        catch (_e) { return new Date().toISOString().slice(0, 10); }
    }

    _doneDaily(action) {
        try { return localStorage.getItem('pt_daily_' + action) === this._todayJst(); } catch (_e) { return false; }
    }
    _markDaily(action) {
        try { localStorage.setItem('pt_daily_' + action, this._todayJst()); } catch (_e) { /* ignore */ }
    }

    _onceKey(action, ref) { return 'pt_once_' + action + '|' + (ref === undefined || ref === null ? '' : String(ref)); }
    _doneOnce(action, ref) {
        try { return localStorage.getItem(this._onceKey(action, ref)) === '1'; } catch (_e) { return false; }
    }
    _markOnce(action, ref) {
        try { localStorage.setItem(this._onceKey(action, ref), '1'); } catch (_e) { /* ignore */ }
    }

    _pushHistory(entry) {
        let list = [];
        try { list = JSON.parse(localStorage.getItem('pointHistory') || '[]'); } catch (_e) { list = []; }
        if (!Array.isArray(list)) list = [];
        list.push(entry);
        if (list.length > 100) list = list.slice(list.length - 100);
        try { localStorage.setItem('pointHistory', JSON.stringify(list)); } catch (_e) { /* ignore */ }
    }

    /**
     * ポイントを行動に応じて増減させる。ログイン・通信は不要。
     * 「1日1回」「生涯1回」の制限を超えている場合は何もせず null を返す。
     */
    act(action, ref) {
        const rule = this.RULES[action];
        if (!rule) return null;
        if (rule.limit === 'daily') {
            if (this._doneDaily(action)) return null;
        } else if (rule.limit === 'once') {
            if (this._doneOnce(action, ref)) return null;
        }
        const before = this.getPoints();
        const after = before + rule.delta;
        this.setPoints(after);
        if (rule.limit === 'daily') this._markDaily(action);
        else if (rule.limit === 'once') this._markOnce(action, ref);
        const reason = this.LABELS[action] || action;
        this._pushHistory({ timestamp: Date.now(), amount: rule.delta, reason, balanceAfter: after });
        this.updateDisplay();
        this.showPointsNotification(rule.delta, reason, after);
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

    getHistory(limit = 100) {
        let list = [];
        try { list = JSON.parse(localStorage.getItem('pointHistory') || '[]'); } catch (_e) { list = []; }
        if (!Array.isArray(list)) list = [];
        return list.slice(-limit).reverse();
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

    checkTimeBonus() { return 1.0; } // 倍率は使いません（RULESで固定）
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
