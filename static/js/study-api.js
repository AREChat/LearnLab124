/**
 * study-api.js : Neon (Auth + Data API) との通信をまとめた薄いラッパー
 * 依存: static/neon-client.js, static/study-config.js
 *
 * 認証はメール+パスワードですが、アプリ上は従来どおり「ユーザ名+パスワード」で使えるよう、
 * ユーザ名から決まる内部用メールアドレス(実在しない)を作っています。
 */
(function () {
  const cfg = window.STUDY_CONFIG;
  const client = window.NeonJS.createClient({
    auth: { url: cfg.authUrl },
    dataApi: { url: cfg.dataApiUrl },
  });

  let anonClient = null;
  function getAnonClient() {
    if (!anonClient) {
      anonClient = window.NeonJS.createClient({
        auth: { url: cfg.authUrl, allowAnonymous: true },
        dataApi: { url: cfg.dataApiUrl },
      });
    }
    return anonClient;
  }

  const USERNAME_RE = /^[a-zA-Z0-9_぀-ゟ゠-ヿ一-鿿]{3,20}$/;
  const MIN_PASSWORD = 8;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function usernameToEmail(username) {
    const bytes = new TextEncoder().encode(username.trim().toLowerCase());
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `u${hex.slice(0, 40)}@study.local`;
  }

  // 発行直後のJWTで最初の1回だけ認証が通らないことがあるため、1回だけ再試行する
  async function call(fn) {
    let res = await fn();
    if (res && res.error && /not authenticated|JWT/i.test(res.error.message || '')) {
      await sleep(500);
      res = await fn();
    }
    return res;
  }

  function fail(error) {
    const msg = (error && (error.message || error.error_description)) || '不明なエラー';
    const e = new Error(msg);
    e.code = error && (error.code || error.status);
    throw e;
  }

  function friendly(err) {
    const m = err.message || '';
    if (/profiles_username_key|duplicate key/i.test(m)) return 'このユーザ名は既に登録されています';
    if (/INVALID_EMAIL_OR_PASSWORD|Invalid email or password/i.test(m)) return 'ユーザ名またはパスワードが違います';
    if (/USER_ALREADY_EXISTS|already exists/i.test(m)) return 'このユーザ名は既に登録されています';
    if (/PASSWORD_TOO_SHORT|too short/i.test(m)) return `パスワードは${MIN_PASSWORD}文字以上で入力してください`;
    if (/insufficient points/i.test(m)) return 'ポイントが足りません';
    if (/Failed to fetch|NetworkError/i.test(m)) return '通信エラーです。ネットワークを確認してください';
    return m;
  }

  const Study = {
    client,
    USERNAME_RE,
    MIN_PASSWORD,
    friendly,
    profile: null,

    validateUsername(u) {
      return USERNAME_RE.test(u) ? null : 'ユーザ名は3〜20文字の英数字、ひらがな、カタカナ、漢字、_のみ使用できます';
    },

    async _afterAuth(username) {
      const { data, error } = await call(() => client.rpc('ensure_profile', { p_username: username }));
      if (error) fail(error);
      this.profile = data;
      this._cacheProfile(data);
      return data;
    },

    _cacheProfile(p) {
      // UI用のキャッシュ（権限の判定には使わない。本当の権限はDB側で判定される）
      try {
        localStorage.setItem('currentUser', p.username);
        localStorage.setItem('isAdmin', p.is_admin ? 'true' : 'false');
        localStorage.setItem('userPoints', String(p.points));
      } catch (e) { /* ignore */ }
    },

    async register(username, password) {
      username = username.trim();
      const bad = this.validateUsername(username);
      if (bad) throw new Error(bad);
      if (password.length < MIN_PASSWORD) throw new Error(`パスワードは${MIN_PASSWORD}文字以上で入力してください`);
      const email = await usernameToEmail(username);
      const { error } = await client.auth.signUp.email({ email, password, name: username });
      if (error) fail(error);
      return this._afterAuth(username);
    },

    async login(username, password) {
      username = username.trim();
      const email = await usernameToEmail(username);
      const { error } = await client.auth.signIn.email({ email, password });
      if (error) fail(error);
      // 既存プロフィールがあればそれを使う。無ければ作る
      const prof = await this.fetchProfile();
      if (prof) { this.profile = prof; this._cacheProfile(prof); return prof; }
      return this._afterAuth(username);
    },

    async logout() {
      try { await client.auth.signOut(); } catch (e) { /* ignore */ }
      this.profile = null;
      ['currentUser', 'isAdmin', 'userPoints', 'chats', 'userMemos', 'autoLogin', 'savedUsername', 'savedPassword']
        .forEach((k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
    },

    async getSession() {
      const res = await client.auth.getSession();
      return (res && res.data && res.data.session) || null;
    },

    /** 自分のユーザーID（管理者は他人の行も SELECT できるため、必ず自分の id で絞る） */
    async _uid() {
      const session = await this.getSession();
      const id = session && (session.userId || (session.user && session.user.id));
      if (!id) throw new Error('ログインが必要です');
      return id;
    },

    async fetchProfile() {
      const uid = await this._uid();
      const { data, error } = await call(() => client.from('profiles').select('*').eq('id', uid).limit(1));
      if (error) fail(error);
      return data && data[0] ? data[0] : null;
    },

    /** ログイン状態を確認し、プロフィールを返す（未ログインなら null） */
    async restore() {
      const session = await this.getSession();
      if (!session) return null;
      const prof = await this.fetchProfile();
      if (prof) { this.profile = prof; this._cacheProfile(prof); }
      return prof;
    },

    /** Neon Function が定期取得したデータ(天気・電車)を読む。key: 'weather' | 'train' */
    async siteData(key) {
      // ログインしていなくても読める（天気・電車だけ。DB側の anonymous 用の読み取りルールで key を制限ずみ）。
      // 匿名トークンはメモリにだけ置き、保存しない。ログイン中ならふだんの client を使う。
      const session = await this.getSession();
      const c = session ? client : getAnonClient();
      const { data, error } = await call(() => c.from('site_data').select('payload,updated_at').eq('key', key).limit(1));
      if (error) fail(error);
      if (!data || !data[0]) throw new Error('データを準備中です。しばらくしてから再読み込みしてください');
      return data[0];
    },

    // ---- ポイント ----
    /** 戻り値: 新しい残高 / すでに付与済みなら null */
    async applyPoints(action, ref) {
      const args = { p_action: action };
      if (ref !== undefined && ref !== null) args.p_ref = String(ref);
      const { data, error } = await call(() => client.rpc('apply_points', args));
      if (error) fail(error);
      if (data !== null && data !== undefined) {
        try { localStorage.setItem('userPoints', String(data)); } catch (e) { /* ignore */ }
        if (this.profile) this.profile.points = data;
      }
      return data;
    },

    async pointHistory(limit = 100) {
      const { data, error } = await call(() =>
        client.from('point_history').select('action,ref,delta,balance_after,created_at')
          .order('id', { ascending: false }).limit(limit));
      if (error) fail(error);
      return data || [];
    },

    async pointRules() {
      const { data, error } = await call(() => client.from('point_rules').select('*'));
      if (error) fail(error);
      return data || [];
    },

    // ---- チャット ----
    _msgId(m) {
      if (m.id) return String(m.id);
      let h = 0;
      const t = String(m.text || '');
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
      return `${m.from}|${m.time}|${h}`;
    },

    async loadChats() {
      const uid = await this._uid();
      const { data, error } = await call(() =>
        client.from('chat_messages').select('msg_id,sender,body,is_read,created_at').eq('user_id', uid).order('id', { ascending: true }).limit(1000));
      if (error) fail(error);
      return (data || []).map((r) => ({
        id: r.msg_id, from: r.sender, text: r.body, read: r.is_read,
        time: new Date(r.created_at).toLocaleString(),
      }));
    },

    /** 画面側の会話配列をDBへ反映（追加・既読更新。削除はresetChatsで行う） */
    async syncChats(messages) {
      const rows = (messages || []).slice(-500).map((m) => ({
        msg_id: this._msgId(m), sender: String(m.from), body: String(m.text).slice(0, 10000), is_read: !!m.read,
      }));
      if (!rows.length) return;
      const { error } = await call(() => client.from('chat_messages').upsert(rows, { onConflict: 'user_id,msg_id' }));
      if (error) fail(error);
    },

    async resetChats() {
      const { error } = await call(() => client.from('chat_messages').delete().not('id', 'is', null));
      if (error) fail(error);
    },

    // ---- メモ ----
    async loadMemo() {
      const uid = await this._uid();
      const { data, error } = await call(() => client.from('memos').select('body').eq('user_id', uid).eq('target', '').limit(1));
      if (error) fail(error);
      return data && data[0] ? data[0].body : '';
    },
    async saveMemo(body) {
      const { error } = await call(() =>
        client.from('memos').upsert({ target: '', body, updated_at: new Date().toISOString() }, { onConflict: 'user_id,target' }));
      if (error) fail(error);
    },

    // ---- 視聴済み動画 / リンククリック ----
    async markVideoWatched(videoId) {
      const { error } = await call(() =>
        client.from('watched_videos').upsert({ video_id: videoId }, { onConflict: 'user_id,video_id', ignoreDuplicates: true }));
      if (error) fail(error);
    },
    async watchedVideos() {
      const { data, error } = await call(() => client.from('watched_videos').select('video_id'));
      if (error) fail(error);
      return (data || []).map((r) => r.video_id);
    },
    async incrementLinkClick(url) {
      const { data } = await call(() => client.from('link_clicks').select('count').eq('url', url).limit(1));
      const next = (data && data[0] ? data[0].count : 0) + 1;
      const { error } = await call(() =>
        client.from('link_clicks').upsert({ url, count: next }, { onConflict: 'user_id,url' }));
      if (error) fail(error);
      return next;
    },

    /** 管理者の表記名（初期値「主人公」。管理者本人だけが変更できる） */
    async adminName() {
      const { data, error } = await call(() => client.rpc('admin_display_name'));
      if (error || !data) return '主人公';
      return data;
    },
    async setAdminName(name) {
      const n = String(name || '').trim();
      if (!n || n.length > 40) throw new Error('表記名は1〜40文字で入力してください');
      const uid = await this._uid();
      const { error } = await call(() => client.from('profiles').update({ display_name: n }).eq('id', uid));
      if (error) fail(error);
      return n;
    },

    /** リンクのクリック数 { キー: 回数 } */
    async linkClicks() {
      const { data, error } = await call(() => client.from('link_clicks').select('url,count'));
      if (error) fail(error);
      const o = {}; (data || []).forEach((r) => { o[r.url] = r.count; });
      return o;
    },
    async clearLinkClicks() {
      const { error } = await call(() => client.from('link_clicks').delete().neq('url', ''));
      if (error) fail(error);
    },

    // ---- 管理者（DBのis_adminがtrueのユーザーだけ動く。RLSで保護） ----
    async adminListUsers() {
      const { data, error } = await call(() => client.from('profiles').select('id,username').order('username'));
      if (error) fail(error);
      return data || [];
    },
    async adminLoadChats(userId) {
      const { data, error } = await call(() =>
        client.from('chat_messages').select('sender,body,created_at').eq('user_id', userId).order('id').limit(1000));
      if (error) fail(error);
      return data || [];
    },
    async adminLoadMemo(userId) {
      const { data, error } = await call(() => client.from('memos').select('body').eq('user_id', userId).eq('target', '').limit(1));
      if (error) fail(error);
      return data && data[0] ? data[0].body : '';
    },
    async adminSendMessage(userId, sender, text) {
      const msg_id = `admin|${Date.now()}`;
      const { error } = await call(() =>
        client.from('chat_messages').insert({ user_id: userId, msg_id, sender, body: text, is_read: true }));
      if (error) fail(error);
    },
  };

  window.Study = Study;
})();
