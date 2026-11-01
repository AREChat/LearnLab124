# study

GitHub Pages で公開する静的サイト。ユーザー管理・ポイント・チャット保存・天気/電車の自動取得は **Neon**（Postgres + Neon Auth + Data API + Functions）で動きます。サーバー（Flask 等）は不要です。DB・自動取得の設定は Neon 側に適用済みです。

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
| `game/` | ゲーム |
| `tools/` | `スケジュール.py` / `毎日の日誌.py`（名前・年月を変えて誰でも作成可） |
| `sw.js` | Service Worker（同一オリジンの GET のみキャッシュ） |

## 公開

GitHub Pages を有効化（ルートを公開）。Neon Auth の **Trusted domains** に公開 URL（例 `https://<user>.github.io`）が登録されている必要があります。

## ログイン

- ユーザー名 + パスワード（**8文字以上**）。内部では `u<sha256(小文字ユーザー名)の先頭40桁>@study.local` のメールとして Neon Auth に登録します。
- **管理者は1人だけ**（ユーザー名「ともひこ」）。DB の制約で2人目はなれません。管理者はクライアントから変更できません。
- 管理者の表記名は初期値「ともひこ」。管理画面の「表記名を変更」で本人だけが変更できます（チャットの発言者名に反映）。

## ポイント（初期 20,000）

| 行動 | 増減 | 制限 |
|------|------|------|
| クイズ回答 / チャット送信 | −100 | なし |
| 用語検索 | −50 | なし |
| eラーニング | +2,000 | 1日1回 |
| アンケート回答 / 物語閲覧 / 動画視聴 | +1,000 | それぞれ1回限り |
| デイリーログイン / 天気確認 / 電車確認 | +500 | 1日1回 |
| マニュアル閲覧 | +300 | 1日1回 |
| 物語リンククリック | +200 | リンクごと1回 |

金額と制限はサーバー側で固定です。クライアントからの直接更新はできません（1日の区切りは日本時間）。

## 天気・電車の自動取得

Neon Function が気象庁・ウェザーニュース・Yahoo!路線情報を日本時間 0・6・12・18 時に取得して DB に保存し、`weather.html` / `train.html` はログイン後にそれを読みます。

## ローカル確認

```bash
python3 -m http.server 8000     # http://localhost:8000/
```

## ツール（Python）

```bash
pip install openpyxl
python3 tools/スケジュール.py --help
python3 tools/毎日の日誌.py --help
```
