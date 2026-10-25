/* ---------- text signs (canvas textures; they glow softly at night) ---------- */
const signMats = [], signDraws = [];
const SIGN_FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
function textSign(parent, text, x, y, z, w, h, o={}){
  const H = 96, W = Math.max(96, Math.round(H*w/h)), c = document.createElement('canvas'); c.width = W; c.height = H;
  const draw = () => { const x2 = c.getContext('2d'); x2.clearRect(0,0,W,H);
    x2.fillStyle = o.bg ?? '#2f6b4f'; const rr = H*.22; x2.beginPath(); x2.roundRect ? x2.roundRect(0,0,W,H,rr) : x2.rect(0,0,W,H); x2.fill();
    if(o.border !== false){ x2.strokeStyle = o.border ?? 'rgba(255,255,255,.85)'; x2.lineWidth = H*.06; x2.beginPath(); x2.roundRect ? x2.roundRect(H*.07,H*.07,W-H*.14,H-H*.14,rr*.7) : x2.rect(H*.07,H*.07,W-H*.14,H-H*.14); x2.stroke(); }
    let fs = H*.56; x2.font = `700 ${fs}px ${SIGN_FONT}`; const mw = x2.measureText(text).width; if(mw > W*.84){ fs *= W*.84/mw; x2.font = `700 ${fs}px ${SIGN_FONT}`; }
    x2.fillStyle = o.fg ?? '#ffffff'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(text, W/2, H/2 + fs*.05);
    tex.needsUpdate = true; };
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({map:tex, emissive:0xffffff, emissiveMap:tex, emissiveIntensity:0, roughness:.6, transparent:true});
  draw(); signDraws.push(draw); signMats.push(m);
  const pl = new THREE.Mesh(geo(`pl${w},${h}`, () => new THREE.PlaneGeometry(w,h)), m); pl.position.set(x,y,z); pl.rotation.y = o.rot ?? 0; pl.userData.keep = true;
  if(o.back){ const b = pl.clone(); b.rotation.y += Math.PI; b.position.x -= Math.sin(o.rot ?? 0)*.012; b.position.z -= Math.cos(o.rot ?? 0)*.012; parent.add(b); }
  parent.add(pl); return pl;
}
document.fonts?.ready?.then(() => signDraws.forEach(d => d()));
/* sign on the front face of a box building at (bx,bz) with depth d, facing rotY */
function frontSign(g, text, bx, bz, d, y, w, rot=0, o={}){ const k = d/2 + .014; return textSign(g, text, bx + Math.sin(rot)*k, y, bz + Math.cos(rot)*k, w, o.h ?? w*.26, Object.assign({rot}, o)); }
/* signboard on a short post pair */
function postSign(g, text, x, z, rot=0, o={}){ const w = o.w ?? .62, h = o.h ?? .17, y = o.y ?? .42, s = new THREE.Group(); s.position.set(x,0,z); s.rotation.y = rot;
  for(const k of [-1,1]) s.add(mesh(cyl(.016,.016,y+h/2,6), o.post ?? 0x8a5a3a, k*(w/2-.04),(y+h/2)/2,0));
  s.add(mesh(rbox(w+.04,h+.04,.035,.015), o.frame ?? 0x8a5a3a, 0,y,0));
  textSign(s, text, 0, y, .02, w, h, Object.assign({back:true}, o)); g.add(s); return s; }

const SIGNS = {
  babycard: g => { frontSign(g, '公共托育', .65, -.45, .5, .38, .5, -.4, {bg:'#ff8fb1'}); textSign(g, '栗寶卡', -.55+Math.sin(.35)*.04, .45, -.55+Math.cos(.35)*.04, .4, .11, {rot:.35, bg:'#c9771f', border:false}); },
  maternity: g => { frontSign(g, '好孕診所', -.25, -.45, .6, .52, .6, 0, {bg:'#ff6b8a'}); postSign(g, '好孕專車 ♥', 1.05, .3, -.4, {bg:'#ff8fb1', w:.55}); },
  elderdental: g => { frontSign(g, '牙醫診所', -.35, -.45, .55, .47, .55, 0, {bg:'#3d7fd0'}); textSign(g, '敬老卡', -1.0+Math.sin(.8)*.02, .5, .3+Math.cos(.8)*.02, .3, .1, {rot:.8, bg:'#e39a1f', border:false}); },
  rail: g => { textSign(g, '苗栗車站', 0, .62, .205, .34, .09, {bg:'#7a4a2a'}); },
  shuttle: g => { postSign(g, '幸福巴士站', 1.18, .55, -.6, {bg:'#2e9e5b', w:.55}); postSign(g, '通學步道', -1.05, -.6, .4, {bg:'#f2a03d', w:.48}); },
  sciencepark: g => { textSign(g, '大矽谷園區', -.35, .82, -.35+.33, .72, .15, {bg:'#2b3550'}); textSign(g, '往竹科 →', .82, .6, -.534, .38, .1, {bg:'#2e9e5b', border:false}); postSign(g, '露營區', .9, .95, -.3, {bg:'#c56a2a', w:.4}); },
  startup: g => { textSign(g, '青創基地', -.35, .58, -.4+.216, .38, .09, {bg:'#2e9e5b'}); },
  schools: g => { frontSign(g, '苗栗國小', -.5, -.45, .45, .34, .48, 0, {bg:'#d9534f'}); textSign(g, '聯合大學', .55, .64, -.35+.31, .5, .11, {bg:'#3d5aa6'}); },
  forest: g => { postSign(g, '森林療癒步道', -1.05, .5, .5, {bg:'#3f7a4a', w:.62}); postSign(g, '苗東裂谷', 1.1, .6, -.7, {bg:'#8a6a4a', w:.45}); },
  futurefund: g => { postSign(g, '苗栗未來基金', -.55, .3, .3, {bg:'#c9a10f', fg:'#3a2a00', w:.6}); postSign(g, '兒少專戶', .95, .55, -.6, {bg:'#ff8fb1', w:.45}); },
  urbanrural: g => { postSign(g, '排水工程', 1.1, .6, -.6, {bg:'#3d7fd0', w:.45}); textSign(g, '城鄉均衡', 0, .2, -.1+.17, .3, .08, {bg:'#5b6170', border:false}); },
  foodsafety: g => { frontSign(g, '食安檢驗所', .6, .45, .42, .38, .5, -.5, {bg:'#2e9e5b'}); postSign(g, '中彰投苗 食安聯防', -.8, -1.0, .2, {bg:'#d9534f', w:.75}); },
  parkexpand: g => { textSign(g, '後龍科學園區', -.45, .72, -.4+.31, .74, .14, {bg:'#2b3550'}); frontSign(g, '育成中心', .2, -.6, .4, .78, .4, 0, {bg:'#2bb3a8', h:.1}); textSign(g, '零售市場', -.6, .62, .55+.16, .4, .09, {bg:'#e39a1f', rot:.3}); },
  greenwater: g => { postSign(g, '天花湖水庫', -.6, .35, .2, {bg:'#3d7fd0', w:.55}); postSign(g, '氫能示範園區', .95, .85, -.5, {bg:'#2e9e5b', w:.6}); postSign(g, '泰安地熱', -1.05, .9, .6, {bg:'#c56a2a', w:.42}); },
  expressway: g => { postSign(g, '台61', -.3, -1.15, 0, {bg:'#2e8b57', w:.3, h:.2, y:.7}); postSign(g, '歸鄉之路', -1.1, .45, .5, {bg:'#e39a1f', w:.45}); },
  coldchain: g => { textSign(g, '冷鏈物流中心', -.35, .7, -.45+.32, .76, .14, {bg:'#3d7fd0'}); postSign(g, '苑裡', .9, .9, -.5, {bg:'#2e9e5b', w:.3}); },
  hospital: g => { textSign(g, '竹南分院', -.35, .88, -.4+.31, .62, .14, {bg:'#2bb3a8'}); frontSign(g, '媽祖醫院', .7, -.45, .4, .32, .4, 0, {bg:'#c0392b', h:.09}); postSign(g, '長照養生村', 0, 1.05, 0, {bg:'#7ab55c', w:.55}); },
  ethnic: g => { textSign(g, '客家交流中心', -.35, .3, -.35-.3+.17, .56, .1, {bg:'#2f4f8f'}); postSign(g, '司馬限部落', .75, .55, -.3, {bg:'#c0392b', w:.55}); postSign(g, '新住民服務中心', -1.0, .5, .5, {bg:'#e39a1f', w:.66}); },
  sciencehigh: g => { frontSign(g, '科學實驗高中', -.4, -.35, .5, .42, .62, 0, {bg:'#d9534f', h:.11}); postSign(g, '縣立圖書館', .65, .02, 0, {bg:'#3d5aa6', w:.55}); },
  mountainsea: g => { postSign(g, '龍騰斷橋', -.95, 1.0, .5, {bg:'#a0522d', w:.45}); postSign(g, '通霄沙雕節', .4, -.85, -.2, {bg:'#e39a1f', w:.55}); postSign(g, '鐵道自行車', -.3, -.75, .2, {bg:'#2e9e5b', w:.52}); },
  debt: g => { textSign(g, '招商中心', .65, 1.32, -.4+.23, .5, .12, {bg:'#2b3550'}); postSign(g, '減債 21 億', -.4, .1, 0, {bg:'#2e9e5b', w:.5}); },
  eldertaxi: g => { textSign(g, '農會', -.3, .5, -.25+.236, .2, .09, {bg:'#2e9e5b', border:false}); postSign(g, '關懷據點', .85, -.15, -.4, {bg:'#ff8fb1', w:.45}); },
  lunch: g => { frontSign(g, '免費營養午餐', -.35, -.6, .4, .38, .66, 0, {bg:'#d9534f', h:.12}); },
  youbike: g => { frontSign(g, 'YouBike', .15, -.72, .16, .4, .18, 0, {bg:'#f08c00', h:.08, border:false}); textSign(g, '苗栗幣', .75+Math.sin(-.5)*.04, .6, .2+Math.cos(-.5)*.04, .26, .08, {rot:-.5, bg:'#1d6fd0', border:false}); postSign(g, '2027 台灣燈會', -.45, .8, 0, {bg:'#c0392b', w:.62}); },
};
const SPECIAL_SIGN = {
  '大湖草莓': [[-.6,.5,.3,'大湖草莓'],[.95,-.7,-.4,'草莓溫室']], '後龍西瓜': [[.95,-.8,-.5,'後龍西瓜'],[.95,-.5,-.6,'西瓜直售']],
  '三義木雕': [[-.85,.6,.5,'三義木雕'],null], '竹南蛇窯': [[-.95,.6,.5,'竹南蛇窯'],[.75,.65,-.5,'陶藝教室']],
  '南庄桂花': [[-.85,.6,.5,'桂花釀'],null], '客家擂茶': [[-.85,-.65,.4,'客家擂茶'],null],
  '東方美人茶': [[1.1,0,-1.2,'東方美人茶'],[1.05,-.55,-.8,'東方美人茶']], '油桐花': [[1.0,-.15,-.8,'油桐花步道'],[-.95,.6,.5,'五月雪']],
  '通霄精鹽': [[-.85,.55,.5,'通霄精鹽'],null], '卓蘭葡萄': [[-.95,.9,.5,'卓蘭葡萄'],[.9,.6,-.5,'葡萄汁']],
  '苑裡藺草': [[1.05,.15,-.9,'苑裡藺草'],[.85,-.6,-.5,'藺草編織']], '公館紅棗': [[-1.1,.15,.6,'公館紅棗'],[-.85,.6,.5,'福菜・紅棗']],
};
const SPECIAL_EXTRA = {
  '三義木雕': [null, g => textSign(g, '木雕街', -.3, .78, .75+.075, .62, .07, {bg:'#7a4a2a', border:false})],
  '南庄桂花': [null, g => { for(const x of [-.35,.35]) g.add(mesh(cyl(.02,.02,.95,6), PAL.wood, x,.47,.42)); g.add(mesh(rbox(.8,.16,.04,.02), 0x7a4a2a, 0,.95,.42)); textSign(g, '桂花巷', 0, .95, .445, .7, .12, {bg:'#c0392b'}); }],
  '客家擂茶': [null, g => frontSign(g, '擂茶', -.3, -.55, .4, .36, .3, 0, {bg:'#2f4f8f', h:.09})],
  '通霄精鹽': [null, g => textSign(g, '通霄精鹽', -.35, .62, -.4+.27, .56, .13, {bg:'#3d7fd0'})],
  '大湖草莓': [g => textSign(g, '草莓果醬', .85+Math.sin(-.5)*.0, .5, .55, .34, .08, {rot:-.5, bg:'#c8203a', border:false}), null],
};

/* ---------- paths that tie the hexagons together ---------- */
const AXN = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
function stoneRing(grp, r=1.45){
  const obs = grp.userData.obs || [], n = Math.round(r*Math.PI*2/.27);
  for(let i=0;i<n;i++){ const a = i/n*Math.PI*2, x = Math.cos(a)*r, z = Math.sin(a)*r;
    if(obs.some(([x0,x1,z0,z1]) => x > x0-.08 && x < x1+.08 && z > z0-.08 && z < z1+.08)) continue;
    const s = mesh(cyl(.085,.095,.03,9), i%3 ? 0xe9e1d2 : 0xd8cfbf, x,.016,z); s.rotation.y = a; s.scale.z = .8; grp.add(s); }
}
function footBridge(g, ax, ay, az, bx, by, bz){
  const dx = bx-ax, dz = bz-az, L = Math.hypot(dx,dz), dy = by-ay, yaw = -Math.atan2(dz,dx), br = new THREE.Group();
  br.position.set((ax+bx)/2, (ay+by)/2, (az+bz)/2); br.rotation.y = yaw; g.add(br);
  if(Math.abs(dy) < .16){ const pitch = Math.atan2(dy, L), len = Math.hypot(L, dy);
    const deck = new THREE.Group(); deck.rotation.z = pitch; br.add(deck);
    deck.add(mesh(rbox(len, .05, .4, .02), 0xc98a5a, 0,.02,0)); for(let i=0;i<5;i++) deck.add(mesh(rbox(.025,.052,.4,.008), 0x9a6a45, -len/2+.1+i*(len-.2)/4,.024,0));
    for(const s of [-1,1]){ deck.add(mesh(rbox(len, .025, .025, .01), 0xf28b7d, 0,.17,s*.19)); for(const k of [-1,0,1]) deck.add(mesh(cyl(.012,.012,.15,5), 0xffffff, k*len*.42,.1,s*.19)); } }
  else { const n = Math.max(3, Math.round(Math.abs(dy)/.09)); for(let i=0;i<n;i++){ const k = (i+.5)/n; br.add(mesh(rbox(L/n+.02, .07, .42, .02), 0xd8cfbf, -L/2+k*L, -dy/2 + dy*k - .02, 0)); }
    for(const s of [-1,1]){ const rl = mesh(rbox(Math.hypot(L,dy), .025, .025, .01), 0xf28b7d, 0,.16,s*.2); rl.rotation.z = Math.atan2(dy, L); br.add(rl); } }
}
function linkHexes(g, net){ // net: [{q,r,x,z,y,grp}]
  const idx = new Map(net.map((c,i) => [c.q+','+c.r, i])), adj = net.map(() => []);
  net.forEach((c,i) => AXN.forEach(([dq,dr]) => { const j = idx.get((c.q+dq)+','+(c.r+dr)); if(j != null){ adj[i].push(j);
    if(j > i){ const o = net[j], ux = (o.x-c.x), uz = (o.z-c.z), l = Math.hypot(ux,uz), mx = (c.x+o.x)/2, mz = (c.z+o.z)/2, e = .5/l;
      footBridge(g, mx-ux*e, c.y, mz-uz*e, mx+ux*e, o.y, mz+uz*e); } } }));
  return adj;
}
function travelerPath(net, adj, r, steps){
  let cur = Math.floor(r()*net.length), prev = -1; const seq = [cur];
  for(let k=0;k<steps;k++){ const opts = adj[cur].filter(j => j !== prev); const nx = (opts.length ? pick(opts, r) : prev); prev = cur; cur = nx; seq.push(cur); }
  const loop = [...seq, ...seq.slice(1,-1).reverse()], pts = [], RR = 1.45, AP = HEX*Math.sqrt(3)/2;
  for(let i=0;i<loop.length;i++){ const c = net[loop[i]], p = net[loop[(i-1+loop.length)%loop.length]], n = net[loop[(i+1)%loop.length]];
    const ain = Math.atan2(p.z-c.z, p.x-c.x), aout = Math.atan2(n.z-c.z, n.x-c.x);
    pts.push([c.x+Math.cos(ain)*AP, (c.y+p.y)/2, c.z+Math.sin(ain)*AP]);
    let d = aout - ain; while(d <= -Math.PI) d += Math.PI*2; while(d > Math.PI) d -= Math.PI*2; if(Math.abs(d) < .01) d = Math.PI*2*(r() < .5 ? 1 : -1);
    const st = Math.max(2, Math.ceil(Math.abs(d)/.3)); for(let k=0;k<=st;k++){ const a = ain + d*k/st; pts.push([c.x+Math.cos(a)*RR, c.y, c.z+Math.sin(a)*RR]); } }
  pts.push(pts[0]); return polyPath(pts);
}
