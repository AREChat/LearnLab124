/* LearnLab124：はじめてそのページを開いたときに、かんたんな案内ポップアップを1回だけ出す
   ・「わかった」を押すと、そのページでは二度と出ません。「案内を今後ぜんぶ出さない」でオフにもできます。
   ・もう一度見たいとき：アドレスのうしろに ?tips=1 をつける。出さないとき：?tips=0
   ・保存はこの端末のブラウザだけ（localStorage）。使えない環境でも、エラーを出さずに何もしません。 */
(function(){
  "use strict";
  var TIPS = {
    "home": ["📚 プログラミング用語集", ["上の検索ボックスに言葉を入れると、意味や説明が出ます。","画面上のメニューから、クイズ・マニュアル・ゲームなど、ほかのページへ行けます。","わからないときは「マニュアル」を見てください。"]],
    "index2": ["🧠 プログラミングクイズ", ["問題を読んで、答えを選んで進みます。","まちがえても大丈夫。何度でも挑戦できます。","わからない言葉は「プログラミング用語集」で調べられます。"]],
    "クイズ": ["🎯 4択クイズ", ["4つの選択肢から正しいものを選びます。全部で40問です。","「AREクイズ」「物語クイズ」など、種類を選べます。","「次へ」で進みます。やめたいときは「リタイア」を押します。"]],
    "Bingo": ["🎉 ビンゴゲーム", ["主催者版：「回す」で番号が出ます。「最大番号」で数の範囲を変えられます。","参加者版：自分のカードの番号をクリックすると、マークできます。","「リセット」「新しいカード」で、最初からやり直せます。"]],
    "minigames": ["🎮 ミニゲーム集", ["遊びたいゲームを選ぶと始まります。ログインは要りません。","すきま時間に、数分で遊べます。","ポイントがたまるゲームもあります。"]],
    "TMlearning": ["🎓 eラーニング講座", ["上から順に読み進めると、プログラミングの基本が学べます。","わからない言葉は「プログラミング用語集」で調べられます。","公開は2026年12月31日までです。"]],
    "hate": ["🎯 苦手克服ページ", ["Python・SQL・Webなど、苦手なところを見直すための資料が並んでいます。","気になる項目のリンクをタップして、読み進めてください。"]],
    "story": ["📖 物語（小説リンク集）", ["作品のタイトルと説明が並んでいます。","読みたい作品のリンクをタップすると、物語のページが開きます。"]],
    "index4": ["🔗 便利リンク集", ["よく使うサイトへのリンクがまとまっています。","タップすると、そのサイトが開きます。"]],
    "link": ["📑 全リンク集", ["LearnLab124にあるページが、すべて並んでいます。","行きたいページの名前をタップしてください。"]],
    "other": ["🔗 その他のメニュー", ["そのほかのページへの入り口です。","行きたいページの名前をタップしてください。"]],
    "index5": ["📖 使い方マニュアル", ["プログラミング用語集の使い方を、順番に説明しています。","はじめての方は、上から読んでみてください。"]],
    "train": ["🚃 関東の電車運行情報", ["関東の電車の運行状況が表示されます。","最新にしたいときは、ページを開き直してください。"]],
    "weather": ["🌤️ 東京の天気予報", ["東京都の天気予報が表示されます。","最新にしたいときは、ページを開き直してください。"]],
    "pythonexam": ["📝 Python試験の情報", ["Python資格試験について、初心者向けにまとめています。","上から順に読み進めてください。"]],
    "感想": ["✍️ 受験レポート", ["Python資格試験を受けた人の体験談です。","勉強の参考にしてください。"]],
    "アンケート": ["📊 アンケート", ["LearnLab124をよくするための、数分で終わるアンケートです。","答えて「送信」を押すと完了です。"]],
    "about": ["👋 はじめての方へ", ["登録なしで、すぐに使えます。","気になるページから、気軽に開いてみてください。"]],
    "are": ["💬 AREチャットとゲーム", ["友達と話せるチャット「ARE」と、ゲームの紹介ページです。","「チャットを開く」「ゲームを遊ぶ」のボタンから始められます。"]]
  };
  var name = "";
  try{ name = decodeURIComponent(location.pathname.split("/").pop() || "").replace(/\.html?$/i, ""); }catch(e){ return; }
  var tip = TIPS[name]; if(!tip) return;
  var q = location.search, force = /[?&]tips=1\b/.test(q);
  if(/[?&]tips=0\b/.test(q)) return;
  var SEEN = "ll_tips_seen", OFF = "ll_tips_off", seen = {}, off = false;
  try{ seen = JSON.parse(localStorage.getItem(SEEN) || "{}") || {}; off = localStorage.getItem(OFF) === "1"; }catch(e){ seen = {}; }
  if(!force && (off || seen[name])) return;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  var m = null;
  function close(){
    if(!m) return;
    try{ if(!force){ seen[name] = Date.now(); localStorage.setItem(SEEN, JSON.stringify(seen)); } }catch(e){}
    if(m.parentNode) m.parentNode.removeChild(m); m = null;
  }
  function show(){
    if(m) return;
    var css = document.createElement("style");
    css.textContent = "#llTips{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,'Hiragino Sans','Noto Sans JP',sans-serif}" +
      "#llTips .c{background:#fff;color:#1c2540;border-radius:16px;max-width:430px;width:100%;padding:18px 18px 12px;box-shadow:0 12px 40px #0006;max-height:88vh;overflow:auto}" +
      "#llTips h3{margin:0 0 2px;font-size:1.15rem}#llTips .s{font-size:.78rem;opacity:.65;margin:0 0 6px}#llTips ul{margin:8px 0 14px;padding-left:1.2em;line-height:1.7;font-size:.95rem}" +
      "#llTips .ok{width:100%;min-height:48px;font-size:1rem;border:0;border-radius:12px;background:#3b5bdb;color:#fff;font-weight:700;cursor:pointer}#llTips .off{display:block;margin:8px auto 0;background:none;border:0;color:inherit;opacity:.6;text-decoration:underline;font-size:.78rem;cursor:pointer;padding:6px}";
    document.head.appendChild(css);
    m = document.createElement("div"); m.id = "llTips"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    m.innerHTML = '<div class="c"><h3>' + esc(tip[0]) + '</h3><p class="s">はじめて開いたときの案内です</p><ul>' + tip[1].map(function(l){ return "<li>" + esc(l) + "</li>"; }).join("") + '</ul><button type="button" class="ok">わかった！</button><button type="button" class="off">案内を今後ぜんぶ出さない</button></div>';
    document.body.appendChild(m);
    m.querySelector(".ok").addEventListener("click", close);
    m.querySelector(".off").addEventListener("click", function(){ try{ localStorage.setItem(OFF, "1"); }catch(e){} close(); });
    m.addEventListener("keydown", function(e){ if(e.key === "Escape") close(); });
    try{ m.querySelector(".ok").focus(); }catch(e){}
  }
  function start(){ setTimeout(show, 900); }
  if(document.readyState === "complete") start(); else window.addEventListener("load", start);
})();
