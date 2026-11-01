"""スケジュール.py / 毎日の日誌.py で共通して使う入力処理（名前・年・月の指定など）"""
import argparse
import calendar
import datetime
import re
import sys

JAPANESE_DAYS = ["月", "火", "水", "木", "金", "土", "日"]


def month_dates(year, month):
    """指定月の日付(datetime.date)を1日から末日まで返す"""
    last = calendar.monthrange(year, month)[1]
    return [datetime.date(year, month, d) for d in range(1, last + 1)]


def safe_filename(text):
    """ファイル名に使えない文字を取り除く"""
    return re.sub(r'[\\/:*?"<>|\r\n\t]', "", text).strip()


def _ask(prompt, default, cast=str):
    while True:
        raw = input(f"{prompt} [{default}]: ").strip()
        if raw == "":
            return default
        try:
            return cast(raw)
        except ValueError:
            print("  入力が正しくありません。もう一度入力してください。")


def get_settings(description, default_rows=None, rows_label="行数"):
    """コマンドライン引数または対話入力から設定を集める。

    例:  python スケジュール.py --name 山田 --year 2026 --month 4
         引数なしで実行すると、名前・年・月を質問されます（Enterで初期値）。
    """
    today = datetime.date.today()
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--name", "-n", default=None, help="名前（ファイル名・シートのタイトルに入ります。省略可）")
    p.add_argument("--year", "-y", type=int, default=None, help="作成する年（初期値: 今年）")
    p.add_argument("--month", "-m", type=int, default=None, help="作成する月 1〜12（初期値: 今月）")
    if default_rows is not None:
        p.add_argument("--rows", "-r", type=int, default=None, help=f"{rows_label}（初期値: {default_rows}）")
    p.add_argument("--out", "-o", default=None, help="出力ファイル名（省略すると自動で付きます）")
    p.add_argument("--no-prompt", action="store_true", help="質問せず、指定のない項目は初期値を使う")
    a = p.parse_args()

    interactive = (not a.no_prompt) and sys.stdin.isatty() and len(sys.argv) == 1
    if interactive:
        print("=== 作成の設定（Enterだけで [ ] 内の初期値になります） ===")
        a.name = _ask("名前（空でもOK）", "") or None
        a.year = _ask("年", today.year, int)
        a.month = _ask("月", today.month, int)
        if default_rows is not None:
            a.rows = _ask(rows_label, default_rows, int)

    year = a.year if a.year is not None else today.year
    month = a.month if a.month is not None else today.month
    if not (1 <= month <= 12):
        p.error("月は 1〜12 で指定してください")
    if not (1900 <= year <= 2200):
        p.error("年は 1900〜2200 で指定してください")
    rows = None
    if default_rows is not None:
        rows = a.rows if a.rows is not None else default_rows
        if not (1 <= rows <= 500):
            p.error(f"{rows_label}は 1〜500 で指定してください")
    name = (a.name or "").strip()
    return {"year": year, "month": month, "name": name, "rows": rows, "out": a.out}
