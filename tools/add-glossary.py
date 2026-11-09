#!/usr/bin/env python3
"""用語集の追加ツール。使い方: python3 tools/add-glossary.py <言語id> <バッチファイル>
バッチファイルは1行1語（カテゴリ ｜ 用語 ｜ 説明 ｜ コード例[省略可]）。区切りは全角ではなく半角の「 || 」。
すでにある用語（同じ言語・同じ用語名）は とばす。言語ごとの件数も更新する。"""
import json,sys,io
lang,batch=sys.argv[1],sys.argv[2]
P='static/data/glossary.json'
g=json.load(open(P,encoding='utf-8'))
L=next(l for l in g['languages'] if l['id']==lang)
files=L.get('files')
if files:
    fp=files[0]; d=json.load(open(fp,encoding='utf-8')); ents=d['entries']
else:
    fp=None; ents=[e for e in g['entries'] if e['lang']==lang]
have={e['term'].strip().lower() for e in ents}
mx=max([int(e['id'].split('-')[-1]) for e in ents] or [0])
new=[];dup=0
for ln in io.open(batch,encoding='utf-8'):
    ln=ln.rstrip('\n')
    if not ln.strip() or ln.startswith('#'): continue
    p=[x.strip() for x in ln.split(' || ')]
    if len(p)<3: print('BAD',ln[:60]); continue
    cat,term,summ=p[:3]; code=p[3].replace('\\n','\n') if len(p)>3 else ''
    if term.lower() in have: dup+=1; continue
    have.add(term.lower()); mx+=1
    new.append({'lang':lang,'category':cat,'term':term,'summary':summ,'examples':([{'code':code,'note':''}] if code else []),'pages':[],'id':f'{lang}-{mx:04d}'})
if fp:
    d['entries']=ents+new; json.dump(d,open(fp,'w',encoding='utf-8'),ensure_ascii=False,indent=None,separators=(',',':'))
    total=len(d['entries'])
else:
    g['entries']+=new; total=len([e for e in g['entries'] if e['lang']==lang])
L['count']=total
json.dump(g,open(P,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(lang,'追加',len(new),'重複スキップ',dup,'合計',total)
