# study

GitHub Pages で公開する静的サイト。**ログイン・ユーザー登録はありません**（ログインが必要なのは別サイトの ARE チャットアプリのみ）。ポイントは端末のブラウザ内（localStorage）だけで管理し、天気/電車の自動取得だけ **Neon**（Postgres + Data API + Functions、匿名読み取り）を使います。サーバー（Flask 等）は不要です。

## 構成

| 場所 | 内容 |
|------|------|
| `*.html` | ページ（HTML のみ。CSS/JS は書かない） |
| `static/css`, `static/js` | ページごとの CSS / JS |
| `static/js/study-config.js` | Neon の接続先（Data API URL） |
| `static/js/neon-client.js` | `@neon/neon-js` のブラウザ用バンドル |
| `static/js/study-api.js` | `window.Study.siteData()`（天気・電車データの匿名読み取りのみ） |
| `static/points.js` | ポイント処理（ログイン不要、localStorageのみで完結。金額・制限は`points.js`内のRULESで固定） |
| `static/data/glossary.json` | プログラミング用語辞典（1ファイルに統合） |
| `tools/` | `スケジュール.py` / `毎日の日誌.py`（名前・年月を変えて誰でも作成可） |
| `sw.js` | Service Worker（同一オリジンの GET のみキャッシュ） |

## 公開

GitHub Pages を有効化（ルートを公開）。

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

金額と制限は `static/points.js` 内の `RULES` で固定です（1日の区切りは日本時間）。ログイン不要、通信もしません。ブラウザのデータを消すとリセットされます。

## 天気・電車の自動取得

Neon Function が気象庁・ウェザーニュース・Yahoo!路線情報を日本時間 0・6・12・18 時に取得して DB に保存し、`weather.html` / `train.html` はログイン不要・匿名のまま読みます。

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
