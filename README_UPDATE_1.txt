study124 UPDATE No.1 (2026-11-03)  ※GitHubには上げていません（書き込み権限が無いため）。
基準: GitHub AREChat/study124 main 97b943e （Driveに更新zipは無かったので、そのまま基準）
削除するファイル: なし

この zip の中身（そのまま study124 のルートに重ねる）
 about.html / static/css/about.css / static/js/about.js … はじめての方へ（紹介ページ。リンクのコピーボタン付き）
 sitemap.xml / robots.txt … 検索用
 sw.js … キャッシュ名 v7→v8、about.html を先読みに追加
 apply_seo.py … 既存の全HTMLに title / description / OGP / canonical / 構造化データ / 紹介ページへのリンクを入れる道具
   （全ページを入れると大きすぎてDriveの転送で壊れるため、道具で入れる形にしました。何度実行しても二重になりません）

反映のしかた
 1) study124 の最新を用意して、zip を重ねて展開
 2) study124 のフォルダで  python3 apply_seo.py .  を1回実行
 3) GitHubに書き込める状態になってから push
確認ずみ: 新しい clone で上の手順を行うと、作業した結果と全ファイル同じになりました。Playwright で全ページ エラー0・リンク切れ0・F12/右クリック防止あり。
