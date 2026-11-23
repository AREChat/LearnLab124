/**
 * study-api.js : Neon (Data API) との通信をまとめた薄いラッパー
 * 依存: static/js/neon-client.js, static/js/study-config.js
 *
 * このサイトにログイン・アカウント機能はありません（ログインが必要なのは別サイトの
 * ARE チャットアプリのみです）。ここでは、天気・電車情報など「匿名で読める公開データ」
 * だけを Neon から取得します。
 */
(function () {
  const cfg = window.STUDY_CONFIG;

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

  function fail(error) {
    const msg = (error && (error.message || error.error_description)) || '不明なエラー';
    throw new Error(msg);
  }

  const Study = {
    /** Neon Function が定期取得したデータ(天気・電車)を読む。key: 'weather' | 'train'。ログイン不要 */
    async siteData(key) {
      const c = getAnonClient();
      const { data, error } = await c.from('site_data').select('payload,updated_at').eq('key', key).limit(1);
      if (error) fail(error);
      if (!data || !data[0]) throw new Error('データを準備中です。しばらくしてから再読み込みしてください');
      return data[0];
    },
  };

  window.Study = Study;
})();
