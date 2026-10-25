# manual decisions after fact-check: replace unsupported 陳 10,1; drop 陳 2,4 (not a pledge); drop unsupported note on 鍾 9,0
import json
SP = './factcheck/'
fc = json.load(open(SP+'fc_chen.json'))
for e in fc['items']:
    if e['t'] == 10 and e['i'] == 1:
        e.update(status='fixed', title='成立交通統籌單位', desc='主張縣府成立專業統籌單位，整合幸福巴士、幸福小黃、既有公車與鐵路，納入跨鄉鎮與跨縣市需求。',
                 date='2026-09-11', basis='受訪/造勢發言', source='https://newtalk.tw/news/view/2026-09-11/1059005',
                 quote='縣府應成立專業統籌單位，整合幸福巴士、幸福小黃、既有公車與鐵路', why='原「鐵路分歧帶動均衡」查無出處，改列同系列專訪中有出處的主張')
json.dump(fc, open(SP+'fc_chen.json','w'), ensure_ascii=False, indent=1)
