# study

GitHub Pages で公開する静的サイト。ユーザー管理・ポイント・チャット保存・天気/電車の自動取得は **Neon**（Postgres + Neon Auth + Data API + Functions）で動きます。サーバー（Flask 等）は不要です。

## 構成

| 場所 | 内容 |
|------|------|
| `*.html` | ページ（HTML のみ。CSS/JS は書かない） |
| `static/css`, `static/js` | ページごとの CSS / JS |
| `static/js/study-config.js` | Neon の接続先（Auth URL / Data API URL） |
| `static/js/neon-client.js` | `@neon/neon-js` のブラウザ用バンドル |
| `static/js/study-api.js` | `window.Study`（登録・ログイン・ポイント・チャット・メモ等） |
| `static/points.js` | ポイント処理（金額はサーバー側ルールで固定） |
| `static/data/glossary.json` | プログラミング用語辞典（1ファイルに統合） |
| `game/` | ゲーム（gameserver を統合） |
| `tools/` | `スケジュール.py` / `毎日の日誌.py`（名前・年月を変えて誰でも作成可） |
| `sql/schema.sql` | DB 定義（テーブル・RLS・関数） |
| `neon/functions/scraper/` | 天気・電車を取得して DB に保存する Neon Function |
| `sw.js` | Service Worker（同一オリジンの GET のみキャッシュ） |

## セットアップ

1. Neon プロジェクトを作成し、`sql/schema.sql` を実行
2. Neon Auth と Data API を有効化し、`static/js/study-config.js` の URL を設定
3. Neon Auth の **Trusted domains** に公開 URL（例 `https://<user>.github.io`）を追加
4. GitHub Pages を有効化（ルートを公開）
5. テーブルを追加・変更したら Data API のスキーマキャッシュを更新（Neon コンソールの Data API で設定を保存し直す。`NOTIFY pgrst, 'reload schema'` だけでは反映されないことがあります）

## ログイン

- ユーザー名 + パスワード（**8文字以上**）。内部では `u<sha256(小文字ユーザー名)の先頭40桁>@study.local` のメールとして Neon Auth に登録します。
- 管理者にするには SQL で: `update profiles set is_admin = true where username = '...';`

## ポイント

`point_rules` テーブルが唯一のルールです。クライアントは `apply_points(action, ref)` を呼ぶだけで、金額変更や直接更新はできません（RLS + GRANT）。1日1回の判定は日本時間の日付基準です。

## 天気・電車の自動取得

`neon/functions/scraper` が気象庁・ウェザーニュース・Yahoo!路線情報を取得し、`site_data` テーブル（`weather` / `train`）へ保存します。スケジュールは日本時間 0・6・12・18 時（UTC `0 3,9,15,21 * * *`）。画面（`weather.html` / `train.html`）はログイン後に `site_data` を読みます。

再ビルド・再デプロイ:

```bash
cd neon/functions/scraper
npm install && npm run build   # function.zip が生成される
# function.zip を Neon Function (slug: scraper, nodejs24) にデプロイ
```

## ローカル確認

```bash
python3 -m http.server 8000     # http://localhost:8000/ （Trusted domains に追加が必要）
```

## ツール（Python）

```bash
pip install openpyxl
python3 tools/スケジュール.py --help
python3 tools/毎日の日誌.py --help
```

引数なしで実行すると対話形式で名前・年月などを聞かれます。
