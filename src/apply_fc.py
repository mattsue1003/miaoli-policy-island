# merge fact-check results into data.json / issues_deep.json and write a change log
import json, re, os, sys
SP = './factcheck/'
d = json.load(open('data.json')); q = json.load(open('issues_deep.json'))
log = []; quotes = d.get('quotes', {})
for fn in ['fc_chen.json', 'fc_chung.json']:
    if not os.path.exists(SP+fn): continue
    f = json.load(open(SP+fn))
    for e in f['items']:
        c = d['candidates'][e['c']]; th = c['themes'][e['t']]; it = th['items'][e['i']]
        changed = []
        for k in ['title','desc','date','basis','source']:
            if e.get(k) and e[k] != it.get(k): changed.append((k, it.get(k), e[k])); it[k] = e[k]
        if e.get('quote'): it['quote'] = e['quote']; quotes.setdefault(it['source'], e['quote'])
        if e.get('status') == 'unsupported': it['note'] = (it.get('note','') + '；' if it.get('note') else '') + '原出處未直接提及此項，' + (e.get('why') or '')
        if changed: log.append(f"- {c['name']}｜{th['name']}｜" + '；'.join(f"{k}：{o} → {n}" for k,o,n in changed) + (f"（{e['why']}）" if e.get('why') else ''))
        elif e.get('status') == 'unsupported': log.append(f"- {c['name']}｜{th['name']}｜{it['title']}：原出處未提及（{e.get('why','')}）")
    for tf in f.get('themeFixes', []):
        th = d['candidates'][0 if fn=='fc_chen.json' else 1]['themes'][tf['t']]
        log.append(f"- 主題名稱 {th['name']} → {tf['name']}（{tf.get('why','')}）"); th['name'] = tf['name']
if os.path.exists(SP+'fc_misc.json'):
    m = json.load(open(SP+'fc_misc.json'))
    for b in m.get('bio', []):
        bio = d['candidates'][b['c']]['bio']; fld = b['field']
        mm = re.match(r'experience\[(\d+)\]', fld)
        if mm: bio['experience'][int(mm.group(1))] = b['new']
        elif fld == 'slogans': d['candidates'][b['c']]['slogans'] = b['new'] if isinstance(b['new'], list) else d['candidates'][b['c']]['slogans']
        else: bio[fld] = b['new']
        log.append(f"- 簡歷 {d['candidates'][b['c']]['name']}｜{fld}：{b['old']} → {b['new']}（{b.get('why','')}）")
    for s in m.get('issuesSummary', []):
        d['issues'][s['k']]['summary'] = s['new']; log.append(f"- 爭點摘要 {d['issues'][s['k']]['issue']}：已修正（{s.get('why','')}）")
    for e in m.get('deep', []):
        iss = next((x for x in q['issues'] if x['issue'] == e['issue'] or e['issue'] in x['issue'] or x['issue'] in e['issue']), None)
        if not iss: log.append(f"- ⚠ 找不到爭點 {e['issue']}"); continue
        obj = iss; parts = re.findall(r'[^.\[\]]+|\[\d+\]', e['path'])
        try:
            for p in parts[:-1]: obj = obj[int(p[1:-1])] if p.startswith('[') else obj[p]
            last = parts[-1]
            if last.startswith('['): obj[int(last[1:-1])] = e['new']
            else: obj[last] = e['new']
            log.append(f"- 爭點 {iss['issue']}｜{e['path']}：{e['old']} → {e['new']}（{e.get('why','')}）")
        except Exception as ex: log.append(f"- ⚠ 無法套用 {e['issue']} {e['path']}：{ex}")
    for u, qt in (m.get('quotes') or {}).items():
        if qt: quotes[u] = qt
d['quotes'] = quotes
json.dump(d, open('data.json','w'), ensure_ascii=False, indent=1)
json.dump(q, open('issues_deep.json','w'), ensure_ascii=False, indent=1)
open('changelog_factcheck.md','w').write('# 事實查核修正紀錄（2026-10-26）\n\n' + '\n'.join(log) + '\n')
print(len(log), 'changes;', len(quotes), 'quoted urls')
