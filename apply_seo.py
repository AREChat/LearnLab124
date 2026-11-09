# study124 の全HTMLに title/description/OGP/canonical/構造化データ/紹介ページへのリンクを入れる。
# 使い方: python3 apply_seo.py <study124のフォルダ>   （何度実行しても二重にはなりません）
import os,re,json,urllib.parse
import sys
R=sys.argv[1] if len(sys.argv)>1 else '.'; os.chdir(R)
BASE='https://arechat.github.io/LearnLab124/'
M={ # file:(title,desc,noindex)
'index.html':('study124｜登録なしで遊べる無料ブラウザアプリ・プログラミング学習','登録なしで使える無料のブラウザアプリ。プログラミング用語の検索やクイズで学べて、暇つぶしにもなります。はじめての方は紹介ページからどうぞ。',0),
'home.html':('プログラミング用語集｜無料で調べられる用語辞典 - study124','プログラミングの言葉を無料で検索できる用語集。ブラウザだけで使えて、初心者の調べものや復習に役立ちます。',0),
'Bingo.html':('ビンゴゲーム（主催者用）｜無料・登録なしでみんなで遊ぶ - study124','ブラウザで遊べる無料のビンゴ。主催者がボタンを押して番号を出すだけ。集まりの暇つぶしやレクリエーションに。',0),
'クイズ.html':('4択クイズ｜無料で遊べる暇つぶしクイズ - study124','登録なしで遊べる無料の4択クイズ。数分でさくっと挑戦できて、頭の体操や暇つぶしにぴったりです。',0),
'link.html':('全リンク集｜study124のページ一覧','study124にあるページをまとめた一覧です。学習ツール、クイズ、チャット、ゲームへのリンクから選べます。',0),
'pythonexam.html':('Python試験の情報まとめ｜初心者向け - study124','Pythonの資格試験について、初心者向けにまとめた情報ページです。勉強の進め方の参考にどうぞ。',0),
'index5.html':('使い方マニュアル｜プログラミング用語集 - study124','プログラミング用語集の使い方を、初めての方向けにやさしく説明したマニュアルです。',0),
'hate.html':('苦手克服ページ｜プログラミング学習 - study124','プログラミングで苦手なところを、ひとつずつ見直せる無料の学習ページです。',0),
'loading.html':('読み込み中 - study124','ページを読み込んでいます。',1),
'hate/base.html':('プログラミング言語用語集（くわしい版）｜無料 - study124','プログラミング言語の用語をくわしく調べられる無料の用語集。初心者の復習や調べものに。',0),
'アンケート.html':('アンケート｜ご意見・ご感想をお聞かせください - study124','study124をよりよくするためのアンケートです。数分で答えられます。個人情報は書かないでください。',0),
'other.html':('その他のメニュー｜study124','study124のそのほかのページへのメニューです。',0),
'TMlearning.html':('eラーニング講座｜無料で学べる - study124','ブラウザだけで学べる無料のeラーニング講座。自分のペースで、少しずつ進められます。',0),
'train.html':('関東の電車運行情報｜study124','関東の電車の運行情報を確認できるページです。お出かけ前のチェックに。',0),
'list_mobile/index.html':('見るものリスト（スマホ用） - study124','見たいものをメモしておけるスマホ向けのリストです。',1),
'story.html':('物語を読む｜無料で読めるお話 - study124','ブラウザで読める無料の物語。すきま時間の暇つぶしにどうぞ。',0),
'are.html':('ARE チャットとゲーム1〜6｜無料・登録なしで遊べる - study124','友達と話せるチャット「ARE」と、謎解き・パズル・物語を楽しめるゲーム1〜6への入口。広告なし・無料で、ブラウザですぐ遊べます。',0),
'index2.html':('プログラミングクイズ｜無料で挑戦できる - study124','プログラミングの力試しができる無料クイズ。初心者から、暇つぶしにも。登録なしで挑戦できます。',0),
'感想.html':('Python試験 受験レポート｜体験談 - study124','Python資格試験を受けた人の体験談です。勉強の参考にどうぞ。',0),
'weather.html':('東京の天気予報｜study124','東京都の天気予報を確認できるページです。',0),
'thanks.html':('送信完了 - study124','送信が完了しました。ありがとうございました。',1),
'minigames.html':('ミニゲーム集 - LearnLab124','神経衰弱・数あて・タイピング・反応テスト・計算・じゃんけんの無料ミニゲーム集。ログイン不要',0),
'index4.html':('便利リンク集｜study124','よく使うサイトへのリンクをまとめたページです。',0),
'about.html':('はじめての方へ｜登録なしで遊べる無料ブラウザアプリ - study124','登録なしですぐ遊べる無料のブラウザアプリ。友達と雑談できるチャット、謎解き・パズル・物語のゲーム1〜6。広告なし・料金なし、1回数分でOK。',0),
}
def url(f): return BASE+urllib.parse.quote(f)
def esc(s): return s.replace('&','&amp;').replace('"','&quot;')
LD_SITE={"@context":"https://schema.org","@type":"WebSite","name":"study124","url":BASE,"inLanguage":"ja"}
LD_APP={"@context":"https://schema.org","@type":"WebApplication","name":"study124","url":BASE+"about.html","applicationCategory":"GameApplication","operatingSystem":"Any (Web browser)","browserRequirements":"Requires JavaScript","inLanguage":"ja","isAccessibleForFree":True,"offers":{"@type":"Offer","price":"0","priceCurrency":"JPY"}}
for f,(t,d,ni) in M.items():
    if not os.path.exists(f): continue
    s=open(f,encoding='utf-8').read()
    if 'property="og:title"' in s: continue  # 二重に入れない
    pre='../'*f.count('/')
    # lang
    if not re.search(r'<html[^>]*lang=',s): s=re.sub(r'<html',r'<html lang="ja"',s,1)
    blk=['<meta name="description" content="%s">'%esc(d)]
    if not re.search(r'name=["\']viewport',s): blk.insert(0,'<meta name="viewport" content="width=device-width, initial-scale=1.0">')
    if ni: blk.append('<meta name="robots" content="noindex,follow">')
    else:
        blk.append('<link rel="canonical" href="%s">'%url(f if f!='index.html' else ''))
    blk+=['<meta property="og:type" content="website">','<meta property="og:site_name" content="study124">','<meta property="og:locale" content="ja_JP">',
      '<meta property="og:title" content="%s">'%esc(t),'<meta property="og:description" content="%s">'%esc(d),'<meta property="og:url" content="%s">'%url(f if f!='index.html' else ''),
      '<meta name="twitter:card" content="summary">','<meta name="twitter:title" content="%s">'%esc(t),'<meta name="twitter:description" content="%s">'%esc(d)]
    if f in('index.html','about.html'):
        for ld in(LD_SITE,LD_APP): blk.append('<script type="application/ld+json">%s</script>'%json.dumps(ld,ensure_ascii=False))
    s=re.sub(r'<title>.*?</title>\s*','',s,1,flags=re.S)
    # remove old description/ogp
    s=re.sub(r'\s*<meta name="description"[^>]*>','',s)
    ins='    <title>%s</title>\n    '%t+'\n    '.join(blk)+'\n'
    if re.search(r'<meta charset[^>]*>',s,re.I): s=re.sub(r'(<meta charset[^>]*>)',lambda m:m.group(1)+'\n'+ins.rstrip('\n'),s,1,flags=re.I)
    else: s=re.sub(r'(<head[^>]*>)',lambda m:m.group(1)+'\n    <meta charset="UTF-8">\n'+ins,s,1)
    # about link
    if f!='about.html':
        link='about.html'; href=pre+link
        if '<nav class="responsive-nav">' in s and 'about.html' not in s:
            s=s.replace('<nav class="responsive-nav">','<nav class="responsive-nav">\n        <a href="%s">はじめての方へ</a>'%href,1)
        if 'about.html' not in s:
            foot='\n<p style="text-align:center;font-size:.85em;margin:1.5em 0 1em;position:relative;z-index:5"><a href="%s" style="color:#00e0ff">はじめての方へ（紹介ページ）</a></p>\n'%href
            s=s.replace('</body>',foot+'</body>',1) if '</body>' in s else s+foot
    open(f,'w',encoding='utf-8').write(s)
# index.html にも紹介ページへのリンク
f='index.html';s=open(f,encoding='utf-8').read()
if 'href="about.html"' not in s:
    s=s.replace('    <script src="static/js/index.js"></script>','    <p style="text-align:center;font-size:.85em;margin:1em;position:relative;z-index:5"><a href="about.html" style="color:#00e0ff">はじめての方へ（紹介ページ）</a></p>\n    <script src="static/js/index.js"></script>',1)
    open(f,'w',encoding='utf-8').write(s)
print('ok')
