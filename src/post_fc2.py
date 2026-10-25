import json
d = json.load(open('data.json')); f = json.load(open('feasibility.json'))
# 鍾 9,0 note not supported by its source
it = d['candidates'][1]['themes'][9]['items'][0]; it.pop('note', None)
# feasibility for replaced 陳 10,1
for e in f['items']:
    if e['c']==0 and e['t']==10 and e['i']==1:
        e.update(title='成立交通統籌單位', amount=['no','未提及'], timeline=['no','未提及'], funding=['no','未提及'],
                 authority=['yes','縣府可自行成立統籌單位'], progress=['na','非現任，尚無執行權（不列入）'])
# drop 陳 2,4 (describes past lawyer work, not a pledge) and re-index feasibility
th = d['candidates'][0]['themes'][2]; removed = th['items'].pop(4)
f['items'] = [e for e in f['items'] if not (e['c']==0 and e['t']==2 and e['i']==4)]
for e in f['items']:
    if e['c']==0 and e['t']==2 and e['i']>4: e['i'] -= 1
json.dump(d, open('data.json','w'), ensure_ascii=False, indent=1); json.dump(f, open('feasibility.json','w'), ensure_ascii=False, indent=1)
open('changelog_factcheck.md','a').write(f"- 陳品安｜長輩安心生活｜移除「{removed['title']}」：原文為候選人過去律師經歷，並非政見\n- 鍾東錦｜長者福利｜移除註記「鍾稱財政許可才逐步擴及65歲」：引用來源未提及\n")
print('ok', removed['title'])
