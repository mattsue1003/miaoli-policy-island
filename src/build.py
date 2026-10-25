import json, sys
src = sys.argv[1]
d = json.load(open(src))
CATS = ['交通','產業經濟','農業','長照與醫療','教育與托育','青年與就業','觀光文化','環境與能源','財政','治安與公共安全','社福','地方建設','施政成果']
for c in d['candidates']:
    for t in c['themes']:
        if t['category'] not in CATS: CATS.append(t['category'])
used = [k for k in CATS if any(t['category']==k for c in d['candidates'] for t in c['themes'])]
import os
SP='/private/tmp/claude-501/-Users-matt-Claude---/13d2d7a1-379a-4d10-974a-fe0b1891991f/scratchpad/'
if os.path.exists('feasibility.json') or os.path.exists(SP+'feasibility.json'):
    f=json.load(open('feasibility.json' if os.path.exists('feasibility.json') else SP+'feasibility.json'))
    for e in f['items']:
        it=d['candidates'][e['c']]['themes'][e['t']]['items'][e['i']]
        it['chk']={k:e[k] for k in ['amount','timeline','funding','authority','progress'] if k in e}
if os.path.exists('issues_deep.json') or os.path.exists(SP+'issues_deep.json'):
    d['deep']=json.load(open('issues_deep.json' if os.path.exists('issues_deep.json') else SP+'issues_deep.json'))
if os.path.exists('issue_scores.json'): d['scores']=json.load(open('issue_scores.json'))
d.setdefault('footnote', '本頁非任何候選人或政黨官方網站。政見整理自公開報導與競選發言，截至 2026-10-24；以候選人正式選舉公報為準。')
html = open('template.html').read().replace('/*DATA*/null', json.dumps(d, ensure_ascii=False)).replace('/*CATS*/[]', json.dumps(used, ensure_ascii=False))
open('index.html','w').write(html)
print('ok', [len(c['themes']) for c in d['candidates']], used)
