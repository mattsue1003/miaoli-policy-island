# merge social_final.json (new / enrich / to_archive) into data.json + feasibility.json
import json, sys
SP='/private/tmp/claude-501/-Users-matt-Claude---/13d2d7a1-379a-4d10-974a-fe0b1891991f/scratchpad/social/social_final.json'
d=json.load(open('data.json')); f=json.load(open('feasibility.json')); arch=json.load(open('records_archive.json'))
S=json.load(open(sys.argv[1] if len(sys.argv)>1 else SP))
SCENE_DEFAULT='_default'; log=[]
def topic_add(tp, ident):
    if isinstance(tp,str): name, area = tp, None
    else: name, area = tp.get('new') or tp.get('new_topic'), tp.get('area')
    for a in d['topics']:
        for r in a['rows']:
            if r['topic']==name: (r['chen'] if ident[0]=='0' else r['chung']).append(ident); return
    if area is None: area='其他'
    ar=next((a for a in d['topics'] if a['area']==area),None)
    if not ar: ar={'area':area,'rows':[]}; d['topics'].append(ar)
    row={'topic':name,'chen':[],'chung':[]}; (row['chen'] if ident[0]=='0' else row['chung']).append(ident); ar['rows'].append(row)
def add(it):
    ci=int(it['c']); c=d['candidates'][ci]; th=it['theme']
    if isinstance(th,dict):
        nt=th.get('new') or th.get('new_theme'); nm=nt['name']
        ti=next((k for k,t in enumerate(c['themes']) if t['name']==nm),None)
        if ti is None: c['themes'].append({'name':nm,'category':nt.get('category','其他'),'scene':SCENE_DEFAULT,'items':[]}); ti=len(c['themes'])-1
    else: ti=int(th)
    items=c['themes'][ti]['items']
    new={k:it[k] for k in ['title','desc','basis','source','date'] if k in it}
    if it.get('quote'): new['quote']=it['quote']
    note=' '.join(x for x in [it.get('note'), it.get('source_note')] if x)
    if note: new['note']=note
    items.append(new); ii=len(items)-1; ident=f'{ci}.{ti}.{ii}'
    topic_add(it['topic'], ident)
    ch=it['chk']; f['items'].append({'c':ci,'t':ti,'i':ii,'title':it['title'],**{k:ch[k] for k in ['amount','timeline','funding','authority']},'progress':['na','不列入比較']})
    log.append(f"- 新增 {c['name']}｜{c['themes'][ti]['name']}｜{it['title']}（{it.get('date','')}，{it['source']}）")
# archive first (indices shift) — do archives by title to be safe
for a in S.get('to_archive',[]):
    c=d['candidates'][int(a['c'])]
    for t in c['themes']:
        for k,it in enumerate(t['items']):
            if it['title']==a['title']:
                arch.setdefault('moved',[]).append({'theme':t['name'],'item':it,'why':a.get('why'),'source':a.get('source')}); t['items'].pop(k)
                ti=c['themes'].index(t); f['items']=[e for e in f['items'] if not (e['c']==int(a['c']) and e['t']==ti and e['i']==k)]
                for e in f['items']:
                    if e['c']==int(a['c']) and e['t']==ti and e['i']>k: e['i']-=1
                ident=f"{a['c']}.{ti}.{k}"
                for ar in d['topics']:
                    for r in ar['rows']:
                        for key in ['chen','chung']:
                            r[key]=[ (x if not (x.startswith(f"{a['c']}.{ti}.") and int(x.split('.')[2])>k) else f"{a['c']}.{ti}.{int(x.split('.')[2])-1}") for x in r[key] if x!=ident]
                log.append(f"- 移出政見 {c['name']}｜{it['title']}：{a.get('why','')}"); break
for it in S.get('new',[]): add(it)
for e in S.get('enrich',[]):
    it=d['candidates'][int(e['c'])]['themes'][int(e['t'])]['items'][int(e['i'])]
    if it['title']!=e['title']: log.append(f"- ⚠ enrich 不符 {e['title']} vs {it['title']}"); continue
    it['desc']=it['desc'].rstrip('。')+'；'+e['add'].rstrip('。')+'。'
    if e.get('source') and e.get('quote'): it['note']=(it.get('note','')+'；' if it.get('note') else '')+'補充自社群貼文：'+e['source']
    log.append(f"- 補充 {d['candidates'][int(e['c'])]['name']}｜{e['title']}：{e['add']}")
# drop empty themes
for c in d['candidates']: c['themes']=[t for t in c['themes'] if t['items']]
json.dump(d,open('data.json','w'),ensure_ascii=False,indent=1); json.dump(f,open('feasibility.json','w'),ensure_ascii=False,indent=1); json.dump(arch,open('records_archive.json','w'),ensure_ascii=False,indent=1)
open('changelog_social.md','w').write('# 社群來源補漏紀錄（2026-10-26）\n\n'+'\n'.join(log)+'\n')
print(len(log),'changes;',[ (c['name'],len(c['themes']),sum(len(t['items']) for t in c['themes'])) for c in d['candidates']])
