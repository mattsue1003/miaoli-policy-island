/* ---------- little props used by the specialties ---------- */
const glassMat = new THREE.MeshStandardMaterial({color:0xe6f6ff, transparent:true, opacity:.45, roughness:.1});
function jar(g, x, y, z, fill, lid=0xd9363e, s=1){
  const j = new THREE.Group(); j.position.set(x,y,z); j.scale.setScalar(s);
  j.add(mesh(cyl(.055,.055,.12,14), fill, 0,.06,0)); j.add(mesh(cyl(.062,.062,.13,14), glassMat, 0,.065,0));
  j.add(mesh(cyl(.066,.066,.03,14), lid, 0,.14,0)); j.add(mesh(rbox(.07,.04,.005,.003), 0xfffaf0, 0,.07,.064));
  g.add(j); return j;
}
function table(g, x, z, w=.6, d=.36, col=PAL.wood, rot=0){
  const t = new THREE.Group(); t.position.set(x,0,z); t.rotation.y = rot; t.add(mesh(rbox(w,.04,d,.02), col, 0,.3,0));
  for(const sx of [-1,1]) for(const sz of [-1,1]) t.add(mesh(cyl(.015,.015,.3,6), col, sx*(w/2-.05),.15,sz*(d/2-.05))); g.add(t); return t;
}
function basket(g, x, y, z, fill, s=1){ const b = new THREE.Group(); b.position.set(x,y,z); b.scale.setScalar(s);
  b.add(mesh(cyl(.1,.08,.08,14), 0xc98a5a, 0,.04,0)); b.add(mesh(torus(.07,.008,Math.PI), 0xa8714a, 0,.08,0));
  const r = rng(Math.round(x*99+z*7)+3); for(let i=0;i<7;i++) b.add(mesh(sph(.03,8,6), fill, (r()-.5)*.12,.09,(r()-.5)*.12)); g.add(b); return b; }
function berry(g, x, y, z, s=1){ const b = mesh(cone(.05*s,.1*s,10), 0xff4d61, x,y,z); b.rotation.x = Math.PI; g.add(b);
  g.add(mesh(cyl(.045*s,.03*s,.02*s,8), 0x4fb35a, x,y+.055*s,z)); for(let i=0;i<4;i++) g.add(mesh(sph(.007*s,4,3), 0xfff1a8, x+Math.cos(i*1.6)*.03*s, y-.01*s+(i%2)*.02*s, z+Math.sin(i*1.6)*.03*s)); }
function melon(g, x, y, z, s=1){ const w = mesh(sph(.2*s,18,14), 0x3f9a4a, x,y,z); w.scale.set(1.15,.88,1); g.add(w);
  for(let k=0;k<4;k++){ const st = mesh(torus(.2*s,.012*s,Math.PI), 0x24602e, x,y,z); st.rotation.y = k*Math.PI/4; st.scale.set(1.15,.88,1); g.add(st); } }
function melonHalf(g, x, z, s=1){ const h = new THREE.Group(); h.position.set(x,0,z); h.scale.setScalar(s);
  h.add(mesh(halfSph(.2,.5), 0x3f9a4a, 0,0,0));  const fl = mesh(cyl(.185,.185,.012,22), 0xff5a6a, 0,.005,0); h.add(fl); h.rotation.x = Math.PI;
  const holder = new THREE.Group(); holder.position.set(x,.2*s,z); holder.add(h); h.position.set(0,0,0);
  for(let i=0;i<9;i++){ const a = i*2.4, rr = .05+(i%3)*.04; holder.add(mesh(sph(.012,5,4), 0x222222, Math.cos(a)*rr*s,.012*s,Math.sin(a)*rr*s)); }
  g.add(holder); }
function wedge(g, x, y, z, rot=0){ const w = new THREE.Group(); w.position.set(x,y,z); w.rotation.y = rot;
  const red = mesh(prism(.16,.13,.05), 0xff5a6a, 0,.02,0); w.add(red); w.add(mesh(rbox(.17,.025,.055,.01), 0x3f9a4a, 0,.01,0)); w.add(mesh(rbox(.17,.012,.056,.005), 0xf3ffe0, 0,.028,0));
  w.add(mesh(sph(.008,4,3), 0x222222, -.03,.07,.026)); w.add(mesh(sph(.008,4,3), 0x222222, .03,.07,.026)); g.add(w); }
function petals(g, n, area=1.4, top=1.6){
  const holder = new THREE.Group(); holder.userData.dyn = true; g.add(holder); const r = rng(n*7+Math.round(area*10)); const ps = [];
  for(let i=0;i<n;i++){ const m = mesh(geo('petal', () => new THREE.CircleGeometry(.035, 5)), mat(0xfffbf2,{side:THREE.DoubleSide}), 0,0,0); m.castShadow = false; holder.add(m);
    ps.push([ (r()-.5)*area*2, (r()-.5)*area*2, r(), .2+r()*.3, r()*6 ]); }
  tickers.push((dt,t) => ps.forEach(([x,z,ph,sp,sw], i) => { const k = (t*sp*.25 + ph) % 1, m = holder.children[i];
    m.position.set(x + Math.sin(t*1.5+sw)*.15, top*(1-k), z + Math.cos(t*1.2+sw)*.1); m.rotation.set(t*2+sw, t*1.3, 0); }));
}
function lanternString(g, x0, x1, z, y, n, col=0xe23b3b){
  for(const x of [x0,x1]) g.add(mesh(cyl(.015,.015,y+.05,6), PAL.wood, x,(y+.05)/2,z));
  for(let i=0;i<n;i++){ const k = (i+.5)/n, x = x0+(x1-x0)*k, yy = y - Math.sin(k*Math.PI)*.12;
    const l = mesh(sph(.06,12,10), lampMat, x,yy-.06,z); l.scale.y = 1.15; g.add(l); g.add(mesh(cyl(.035,.035,.02,10), 0xd9363e, x,yy-.0,z)); g.add(mesh(sph(.062,12,10), mat(col,{transparent:true, opacity:.55}), x,yy-.06,z)); }
}
function wheelSpin(g, x, y, z, item){ const w = new THREE.Group(); w.position.set(x,y,z); w.userData.dyn = true; item(w); g.add(w); tickers.push(dt => w.rotation.y += dt*5); return w; }
function pestle(g, x, y, z){ const p = new THREE.Group(); p.position.set(x,y,z); p.userData.dyn = true; const st = mesh(cyl(.022,.028,.5,8), 0xc4936a, .06,.22,0); st.rotation.z = .35; p.add(st); g.add(p);
  tickers.push((dt,t) => p.rotation.y = t*2.4); }
function leafhopper(g, x, y, z){ const h = new THREE.Group(); h.position.set(x,y,z); h.userData.dyn = true;
  const b = mesh(sph(.025,8,6), 0x7ee05a, 0,0,0); b.scale.set(.7,.6,1.4); h.add(b); h.add(mesh(sph(.008,4,3), 0x222222, -.012,.01,.03)); h.add(mesh(sph(.008,4,3), 0x222222, .012,.01,.03)); g.add(h);
  const ph = x*7+z*3; tickers.push((dt,t) => { const k = (t*.8 + ph) % 2; h.position.y = y + (k < .3 ? Math.sin(k/.3*Math.PI)*.12 : 0); }); }
function teapot(g, x, y, z, col=0x8a5a3a){ const tp = new THREE.Group(); tp.position.set(x,y,z);
  const b = mesh(sph(.09,14,10), col, 0,.07,0); b.scale.y = .8; tp.add(b); tp.add(mesh(cyl(.03,.04,.03,10), col, 0,.14,0)); tp.add(mesh(sph(.02,8,6), col, 0,.16,0));
  const sp = mesh(cyl(.012,.02,.1,8), col, .1,.09,0); sp.rotation.z = -.8; tp.add(sp); tp.add(mesh(torus(.04,.01,Math.PI*1.2), col, -.09,.08,0)); g.add(tp); }
function cup(g, x, y, z, col=0xffffff){ g.add(mesh(cyl(.03,.024,.04,10), col, x,y+.02,z)); g.add(mesh(cyl(.026,.026,.005,10), 0xc9a34a, x,y+.038,z)); }
function owl(g, x, z, s=1, col=0xb98257){ const o = new THREE.Group(); o.position.set(x,0,z); o.scale.setScalar(s);
  const b = mesh(sph(.2,14,12), col, 0,.24,0); b.scale.set(1,1.2,.9); o.add(b); o.add(mesh(sph(.16,14,12), col, 0,.5,0));
  for(const k of [-1,1]){ const e = mesh(cyl(.055,.055,.02,12), 0xe8c79a, k*.065,.52,.14); e.rotation.x = Math.PI/2; o.add(e);
    o.add(mesh(sph(.025,8,6), 0x3a2a20, k*.065,.52,.155)); const ear = mesh(cone(.04,.09,6), col, k*.1,.66,0); ear.rotation.z = -k*.4; o.add(ear); }
  const bk = mesh(cone(.025,.05,6), 0xd9a87a, 0,.46,.16); bk.rotation.x = Math.PI/2+.3; o.add(bk); g.add(o); return o; }
function dog(g, x, z, rot=0, col=0x2b2b2b){ const d = new THREE.Group(); d.position.set(x,0,z); d.rotation.y = rot; d.userData.dyn = true;
  const b = mesh(capsule(.08,.16), col, 0,.16,0); b.rotation.x = Math.PI/2; d.add(b); d.add(mesh(sph(.09,12,10), col, 0,.26,.15)); d.add(mesh(sph(.05,10,8), col === 0x2b2b2b ? 0x3b3b3b : 0xf3d3a3, 0,.24,.22));
  d.add(mesh(sph(.015,6,4), 0x111111, 0,.25,.27)); for(const k of [-1,1]){ const e = mesh(cone(.035,.07,6), col, k*.05,.35,.14); e.rotation.z = -k*.2; d.add(e); d.add(mesh(sph(.012,6,4), 0xffffff, k*.035,.28,.22));
    for(const zz of [-.08,.08]) d.add(mesh(cyl(.025,.025,.1,8), col, k*.05,.05,zz)); }
  const tail = new THREE.Group(); tail.position.set(0,.2,-.13); const tm = mesh(capsule(.018,.08), col, 0,.05,0); tail.add(tm); d.add(tail);
  tickers.push((dt,t) => { tail.rotation.z = Math.sin(t*12)*.6; tail.rotation.x = -.6; }); g.add(d); return d; }
function chicken(g, x, z, rot=0){ const c = new THREE.Group(); c.position.set(x,0,z); c.rotation.y = rot; c.userData.dyn = true;
  const b = mesh(sph(.08,12,10), 0xffffff, 0,.1,0); b.scale.set(.9,.9,1.1); c.add(b); const h = new THREE.Group(); h.position.set(0,.17,.06);
  h.add(mesh(sph(.045,10,8), 0xffffff, 0,0,0)); const bk = mesh(cone(.015,.035,6), 0xffa630, 0,-.005,.05); bk.rotation.x = Math.PI/2; h.add(bk);
  h.add(mesh(sph(.02,6,4), 0xe23b3b, 0,.045,0)); h.add(mesh(sph(.008,4,3), 0x111111, .025,.01,.03)); h.add(mesh(sph(.008,4,3), 0x111111, -.025,.01,.03)); c.add(h);
  for(const k of [-1,1]) c.add(mesh(cyl(.008,.008,.06,4), 0xffa630, k*.03,.03,0));
  const ph = x*5+z; tickers.push((dt,t) => { h.rotation.x = Math.max(0, Math.sin(t*3+ph))**6 * .9; }); g.add(c); }
function shrine(g, x, z, rot=0){ const s = new THREE.Group(); s.position.set(x,0,z); s.rotation.y = rot;
  s.add(mesh(rbox(.5,.08,.4,.02), 0xbfb8aa, 0,.04,0)); s.add(mesh(rbox(.36,.3,.28,.03), 0xd9363e, 0,.23,-.02));
  const rf = mesh(prism(.42,.16,.48), 0xf2a03d, 0,.38,-.02); rf.rotation.y = Math.PI/2; s.add(rf); for(const k of [-1,1]){ const rd = mesh(capsule(.018,.05), PAL.gold, k*.25,.5,-.02); rd.rotation.z = k*.9; s.add(rd); }
  s.add(mesh(rbox(.16,.18,.02,.02), 0x5a2a1a, 0,.2,.125)); s.add(mesh(cyl(.05,.06,.07,10), 0xc9a34a, 0,.12,.17));
  g.add(s); smoke(g, x + Math.sin(rot)*.17, .22, z + Math.cos(rot)*.17, .35, .5); return s; }
function scooter(g, x, z, rot=0, col=0x8fc7ff){ const s = new THREE.Group(); s.position.set(x,0,z); s.rotation.y = rot;
  for(const zz of [-.13,.13]){ const w = mesh(torus(.05,.02), 0x333333, 0,.06,zz); w.rotation.y = Math.PI/2; s.add(w); }
  s.add(mesh(rbox(.12,.08,.3,.03), col, 0,.12,0)); s.add(mesh(rbox(.11,.05,.13,.02), 0x333333, 0,.19,-.05)); s.add(mesh(rbox(.06,.2,.04,.02), col, 0,.2,.13)); s.add(mesh(rbox(.18,.02,.02,.01), 0x333333, 0,.31,.13));
  g.add(s); }
function mailbox(g, x, z){ for(const [dx,c] of [[-.08,0x2e9e5b],[.08,0xe23b3b]]){ g.add(mesh(rbox(.14,.24,.12,.04), c, x+dx,.28,z)); const t = mesh(cyl(.07,.07,.12,14), c, x+dx,.4,z); t.rotation.x = Math.PI/2; g.add(t);
  g.add(mesh(cyl(.03,.03,.16,8), 0x5b6170, x+dx,.08,z)); g.add(mesh(rbox(.06,.012,.01,.004), 0x222222, x+dx,.33,z+.06)); } }
function laundry(g, x, z, rot=0){ const l = new THREE.Group(); l.position.set(x,0,z); l.rotation.y = rot; for(const k of [-.45,.45]) l.add(mesh(cyl(.012,.012,.6,6), 0xdddddd, k,.3,0));
  const ln = mesh(cyl(.004,.004,.9,4), 0xdddddd, 0,.58,0); ln.rotation.z = Math.PI/2; l.add(ln);
  [[-.3,0xff9aa2,'t'],[-.1,0x8fc7ff,'p'],[.12,0xffd36e,'t'],[.32,0xffffff,'s']].forEach(([px,c,k]) => { if(k==='p'){ l.add(mesh(rbox(.06,.16,.01,.01), c, px-.035,.48,0)); l.add(mesh(rbox(.06,.16,.01,.01), c, px+.035,.48,0)); }
    else l.add(mesh(rbox(k==='s'?.1:.16,k==='s'?.1:.16,.01,.02), c, px,.49,0)); }); g.add(l); }
const LIFE = [ (g,r) => shrine(g, .3, .2, r()*6), (g,r) => { dog(g, .2, .3, r()*6, pick([0x2b2b2b,0xd9a35a], r)); scooter(g, -.4, -.3, r()*6, pick([0x8fc7ff,0xff9aa2,0xffffff], r)); },
  (g,r) => { for(let i=0;i<3;i++) chicken(g, -.2+i*.22, .3+(i%2)*.15, r()*6); }, (g,r) => mailbox(g, .3, .1), (g,r) => laundry(g, .1, .2, r()*3) ];

/* ---------- Miaoli specialties: same twelve on both islands, each drawn two ways (v = island) ---------- */
const SPECIAL = [
  ['大湖草莓', (g,r,v) => {
    if(v === 0){ for(let i=0;i<3;i++){ const z = -.75+i*.42; g.add(mesh(rbox(1.25,.12,.24,.06), 0xc0855a, -.2,.06,z));
        for(let j=0;j<5;j++){ const x = -.7+j*.25; for(const dx of [-.04,.05]){ const lf = mesh(sph(.06,10,8), 0x4fb35a, x+dx,.14,z-.02); lf.scale.y = .55; g.add(lf); }
          berry(g, x+.05, .16, z+.08, .85); if(j%2) g.add(mesh(sph(.025,8,6), 0xffffff, x-.05,.19,z)); } }
      const st = table(g, .85, .55, .5, .3, 0xd8a06a, -.5); for(let i=0;i<3;i++) jar(st, -.15+i*.15, .32, 0, 0xc8203a);
      const big = mesh(cone(.16,.28,16), 0xff4d61, .95,.62,.05); big.rotation.x = Math.PI; g.add(big); g.add(mesh(cyl(.15,.09,.05,10), 0x4fb35a, .95,.77,.05)); g.add(mesh(cyl(.02,.02,.5,6), PAL.wood, .95,.25,.05));
      const pk = person(g, .3, .95, {role:'farmer', mood:'laugh', rot:Math.PI}); basket(g, .45, 0, .85, 0xff4d61, 1.1); }
    else { for(let i=0;i<4;i++){ const a = mesh(torus(.5,.02,Math.PI), glassMat, -.3,0,-.75+i*.38); a.scale.set(1.4,1,1); g.add(a); }
      g.add(mesh(rbox(1.3,.02,1.2,.01), mat(0xeaf8ff,{transparent:true,opacity:.3}), -.3,.52,-.18));
      for(let i=0;i<3;i++) for(let j=0;j<5;j++) berry(g, -.85+j*.27, .1, -.6+i*.4, .9);
      const ms = new THREE.Group(); ms.position.set(.85,0,.2); const bd = mesh(cone(.24,.42,18), 0xff4d61, 0,.38,0); bd.rotation.x = Math.PI; ms.add(bd);
      ms.add(mesh(cyl(.22,.14,.06,10), 0x4fb35a, 0,.6,0)); face(ms, .42, 'laugh', 0x6a2a2a); for(let i=0;i<8;i++){ const a = i*.9; ms.add(mesh(sph(.012,4,3), 0xfff1a8, Math.cos(a)*.14,.3+(i%3)*.06,Math.sin(a)*.14+.03)); } g.add(ms);
      const tb = table(g, .2, .75, .55, .32); tb.add(mesh(cyl(.13,.13,.12,18), 0xfff5ec, -.1,.38,0)); for(let i=0;i<5;i++) berry(tb, -.1+Math.cos(i*1.25)*.08, .47, Math.sin(i*1.25)*.08, .6);
      jar(tb, .15, .32, -.05, 0xc8203a, 0xffffff); jar(tb, .15, .32, .08, 0xc8203a, 0xd9363e, .8);
      person(g, -.4, .8, {mood:'happy', rot:Math.PI*.8}); } }],
  ['後龍西瓜', (g,r,v) => {
    for(let i=0;i<10;i++){ const lf = mesh(sph(.08,10,8), 0x4fb35a, -1.0+r()*1.6, .04, -.9+r()*1.2); lf.scale.y = .35; g.add(lf); }
    if(v === 0){ [[-.6,-.5],[0,-.65],[.5,-.35],[-.3,.05],[.25,.15]].forEach(([x,z]) => melon(g, x, .16, z)); melonHalf(g, .7, .55, 1);
      for(let i=0;i<8;i++) put(g, mesh(capsule(.015,.3), 0x3f9a4a, -.9+i*.25,.02,.4+((i%2)-.5)*.2)).rotation.z = Math.PI/2;
      person(g, -.3, .65, {role:'farmer', mood:'grin', rot:.4}); }
    else { const tr = new THREE.Group(); tr.position.set(-.3,0,-.25); tr.rotation.y = .5;
      tr.add(mesh(rbox(.45,.26,.36,.05), 0x5b8def, 0,.22,.35)); tr.add(mesh(rbox(.4,.12,.25,.03), winMat, 0,.3,.45)); tr.add(mesh(rbox(.5,.18,.75,.03), 0x5b8def, 0,.16,-.25));
      for(const sx of [-.2,.2]) for(const sz of [.35,-.45]){ const w = mesh(cyl(.08,.08,.06,14), 0x333333, sx,.08,sz); w.rotation.z = Math.PI/2; tr.add(w); }
      for(let i=0;i<4;i++) melon(tr, -.11+(i%2)*.22, .38, -.42+Math.floor(i/2)*.3, .65); melon(tr, 0, .52, -.27, .6); g.add(tr);
      const tb = table(g, .55, .6, .6, .32); for(let i=0;i<4;i++) wedge(tb, -.2+i*.13, .32, 0, (i%2)*.3);
      person(g, .2, .95, {role:'student', mood:'laugh', rot:Math.PI}); person(g, .85, .95, {role:'student', mood:'happy', rot:Math.PI}); } }],
  ['三義木雕', (g,r,v) => { const w = 0xb98257;
    if(v === 0){ const b = new THREE.Group(); b.position.set(-.25,0,-.15);
      const bd = mesh(sph(.32,16,12), w, 0,.42,0); bd.scale.set(.9,1.1,.8); b.add(bd); b.add(mesh(sph(.24,16,12), w, 0,.88,.02));
      for(const s of [-1,1]){ b.add(mesh(sph(.08,10,8), w, s*.17,1.07,0)); b.add(mesh(sph(.028,8,6), 0x3a2a20, s*.08,.92,.21)); b.add(mesh(sph(.08,10,8), w, s*.24,.5,.18)); }
      b.add(mesh(sph(.075,10,8), 0xd9a87a, 0,.84,.22)); b.add(mesh(sph(.025,6,4), 0x3a2a20, 0,.86,.29)); const sm = mesh(torus(.035,.009,Math.PI), 0x3a2a20, 0,.8,.27); sm.rotation.z = Math.PI; b.add(sm);
      b.add(mesh(cyl(.4,.44,.1,16), 0x8a5a3a, 0,.05,0)); g.add(b);
      for(let i=0;i<4;i++){ const lg = mesh(cyl(.09,.09,.6,12), 0xc4936a, .85,.09+(i>1?.16:0), -.45+(i%2)*.19+(i>1?.09:0)); lg.rotation.x = Math.PI/2; g.add(lg); g.add(mesh(cyl(.07,.07,.005,12), 0xe8c79a, .85,.09+(i>1?.16:0), -.15+(i%2)*.19+(i>1?.09:0)).rotateX(Math.PI/2)); }
      for(let i=0;i<14;i++) g.add(mesh(rbox(.04,.008,.02,.003), 0xe8c79a, .2+r()*.6, .005, .3+r()*.4));
      person(g, .45, .5, {mood:'smile', rot:-.8, hat:'cap', capCol:0x8a5a3a}); }
    else { const sh = new THREE.Group(); sh.position.set(-.2,0,-.4); sh.add(mesh(rbox(1.0,.06,.5,.02), 0x8a5a3a, 0,.7,0));
      for(const x of [-.45,.45]) sh.add(mesh(rbox(.06,.7,.06,.02), 0x8a5a3a, x,.35,-.2));  for(const x of [-.45,.45]) sh.add(mesh(rbox(.06,.7,.06,.02), 0x8a5a3a, x,.35,.2));
      sh.add(mesh(rbox(.9,.04,.3,.01), 0xc4936a, 0,.3,-.05)); owl(sh, -.25, -.05, .45); owl(sh, .25, -.05, .4, 0xd2a273);
      const fish = mesh(sph(.12,12,10), 0xc4936a, 0,.42,-.05); fish.scale.set(1.6,.7,.5); sh.add(fish); g.add(sh);
      owl(g, .8, .35, 1.0); const gate = new THREE.Group(); gate.position.set(-.3,0,.75); for(const x of [-.45,.45]) gate.add(mesh(rbox(.08,.75,.08,.02), 0x8a5a3a, x,.37,0));
      gate.add(mesh(rbox(1.1,.12,.1,.03), 0xb98257, 0,.78,0)); gate.add(mesh(rbox(.7,.06,.02,.01), 0xfff5e4, 0,.78,.06)); g.add(gate);
      person(g, -.3, .35, {mood:'o', camera:true, rot:Math.PI*.85}); } }],
  ['竹南蛇窯', (g,r,v) => {
    if(v === 0){ const k = new THREE.Group(); k.position.set(-.25,0,-.25); k.rotation.y = .4;
      for(let i=0;i<6;i++){ const s = mesh(torus(.3,.12,Math.PI), PAL.brick, 0,.02,-.75+i*.3); s.rotation.y = Math.PI/2; k.add(s); }
      k.add(mesh(rbox(.16,.7,.16,.03), PAL.brick, 0,.35,1.0)); g.add(k); smoke(g, -.25+Math.sin(.4)*1.0, .8, -.25+Math.cos(.4)*1.0, .8, .7);
      for(const [x,z,c] of [[.75,.5,0x9a6b4a],[.95,.25,0xc98a5a],[.6,.8,0x7a5a4a],[.95,.65,0x5a7a8a]]){ g.add(mesh(sph(.13,14,10), c, x,.13,z)); g.add(mesh(cyl(.06,.08,.08,12), c, x,.28,z)); }
      person(g, .3, .7, {mood:'smile', rot:.6, hat:'towel'}); }
    else { const tb = table(g, -.3, .2, .5, .5, 0x8a5a3a); wheelSpin(tb, 0, .32, 0, w => { w.add(mesh(cyl(.16,.16,.03,20), 0x9aa0aa, 0,0,0)); w.add(mesh(cyl(.07,.1,.14,14), 0xc98a5a, 0,.09,0)); w.add(mesh(cyl(.05,.07,.03,14), 0xb07a52, 0,.17,0)); });
      person(g, -.3, .65, {mood:'happy', rot:Math.PI, bun:true});
      const rk = new THREE.Group(); rk.position.set(.6,0,-.35); for(let i=0;i<3;i++){ rk.add(mesh(rbox(.6,.03,.25,.01), PAL.wood, 0,.15+i*.22,0));
        for(let j=0;j<3;j++) rk.add(mesh(cyl(.07,.04,.06,12), [0xe8dccb,0x8fb3c9,0xc98a5a][(i+j)%3], -.18+j*.18,.2+i*.22,0)); }
      for(const x of [-.3,.3]) rk.add(mesh(rbox(.03,.7,.25,.01), PAL.wood, x,.35,0)); g.add(rk);
      const dome = mesh(halfSph(.35,.5), PAL.brick, -.6,0,-.5); g.add(dome); g.add(mesh(rbox(.14,.14,.05,.02), 0x3b2a20, -.6,.08,-.17)); smoke(g, -.6, .35, -.5, .6, .5); } }],
  ['南庄桂花', (g,r,v) => {
    const osm = (x,z,s) => { const t = puffTree(g, x, z, s, 0x3f8f55); dotted(t, 22, 0xffb547, .03, Math.round(x*100+z*7)+9); };
    if(v === 0){ osm(-.6,-.3,1); osm(.4,-.5,.9); osm(0,.55,1.05);
      const tb = table(g, .75, .45, .5, .3); for(let i=0;i<3;i++) jar(tb, -.15+i*.15, .32, 0, 0xf2a93b, 0xffffff); g.add(mesh(rbox(.3,.12,.2,.03), 0xfff3d6, -.75,.06,.65));
      person(g, .5, .9, {mood:'smile', eth:'hakka', rot:Math.PI}); }
    else { house(g, -.65, -.1, {wall:0xe9dccb, roof:0x6b6f78, rot:Math.PI/2, s:.9}); house(g, .65, -.1, {wall:0xf3e6d4, roof:0x6b6f78, rot:-Math.PI/2, s:.9});
      g.add(mesh(rbox(.6,.012,1.8,.02), 0xd8cfc0, 0,.008,0)); for(let i=0;i<6;i++) g.add(mesh(rbox(.56,.004,.02,.002), 0xc0b6a6, 0,.016,-.8+i*.32));
      lanternString(g, -.35, .35, -.6, .8, 4); lanternString(g, -.35, .35, .4, .8, 4); osm(0,.95,.7);
      person(g, 0, 0, {mood:'laugh', walk:a => [Math.sin(a)*.12, Math.sin(a*.5)*.7], speed:.4}); } }],
  ['客家擂茶', (g,r,v) => {
    const set = (tb) => { tb.add(mesh(cyl(.2,.12,.16,18), 0xd88a5a, 0,.4,0)); tb.add(mesh(cyl(.18,.18,.01,18), 0x9cc96a, 0,.475,0)); pestle(tb, 0, .45, 0);
      for(const [x,z] of [[-.22,.12],[.22,.12],[-.22,-.12],[.22,-.12]]) tb.add(mesh(cyl(.045,.035,.05,12), 0xffffff, x,.345,z)); };
    if(v === 0){ const tb = table(g, 0, 0, .8, .5); set(tb); person(g, -.6, .2, {rot:1.2, eth:'hakka', mood:'laugh'}); person(g, .6, .2, {rot:-1.2, mood:'happy'}); person(g, 0, .55, {rot:Math.PI, role:'student', mood:'o'}); }
    else { building(g, -.3, -.55, .9, .48, .4, 0xf3e6d4, {gable:0x6b6f78, door:0x8a5a3a, rows:1, cols:3}); g.add(mesh(rbox(.5,.32,.02,.02), 0xe8475f, .45,.55,-.34));
      const rr = rng(4); for(let i=0;i<8;i++) g.add(mesh(sph(.02,6,4), rr()<.5?0xffc0d0:0x8fd06a, .3+rr()*.3,.45+rr()*.2,-.325));
      const tb = table(g, -.2, .35, .7, .45); set(tb); for(const [x,c] of [[.62,0xf3e0b0],[.8,0xd8a06a]]) { tb.add(mesh(cyl(.07,.06,.04,12), 0xffffff, x-.6,.33,.18)); for(let k=0;k<4;k++) tb.add(mesh(rbox(.04,.02,.04,.01), c, x-.62+k*.015,.36,.18)); }
      person(g, .55, .4, {rot:-1.3, eth:'hakka', mood:'smile', bun:true}); } }],
  ['東方美人茶', (g,r,v) => {
    const rows = v === 0 ? 4 : 2;
    for(let i=0;i<rows;i++) for(let j=0;j<3;j++){ const b = mesh(capsule(.14,.45), 0x4f9a55, -.6+j*.55,.15,-.75+i*.42); b.rotation.x = Math.PI/2; b.rotation.z = Math.PI/2; b.scale.set(1,1,.8); g.add(b);
      leafhopper(g, -.6+j*.55+.1, .3, -.75+i*.42); }
    if(v === 0){ const pk = person(g, 0, .9, {role:'farmer', mood:'smile', walk:a => [Math.sin(a)*.7, .95], speed:.25}); }
    else { const tb = table(g, .2, .45, .6, .4, 0x8a5a3a); teapot(tb, -.1, .32, 0); for(let i=0;i<3;i++) cup(tb, .1+i*.08, .32, (i%2)*.08-.04); smoke(tb, -.05, .45, 0, .3, .5);
      for(let i=0;i<2;i++){ g.add(mesh(cyl(.25,.25,.03,20), 0xd8b07a, -.75+i*.4,.1+i*.0,.6)); for(let k=0;k<12;k++) g.add(mesh(sph(.02,5,4), 0x6a7a3a, -.75+i*.4+Math.cos(k)*.15*(k/12), .125, .6+Math.sin(k)*.15*(k/12))); g.add(mesh(cyl(.02,.02,.1,6), PAL.wood, -.75+i*.4,.05,.6)); }
      person(g, .2, .9, {rot:Math.PI, mood:'happy', eth:'hakka'}); person(g, .65, .45, {rot:-1.5, mood:'smile'}); } }],
  ['油桐花', (g,r,v) => {
    const spots = v === 0 ? [[-.6,-.4,1],[.5,-.5,.95],[0,.3,1.1],[.8,.5,.85],[-.7,.6,.8]] : [[-.7,-.3,1.05],[.7,-.4,1],[-.2,-.7,.85]];
    for(const [x,z,s] of spots) tungTree(g, x, z, s);
    for(let i=0;i<26;i++){ const a = r()*6.28, d = r()*1.5; g.add(mesh(sph(.03,6,4), 0xfffbf2, Math.cos(a)*d,.012,Math.sin(a)*d)); }
    petals(g, 14, 1.3, 1.5);
    if(v === 0){ for(let i=0;i<7;i++) g.add(mesh(rbox(.28,.02,.18,.06), 0xe0c99a, -1.0+i*.3,.01,-.05+Math.sin(i)*.2)); person(g, 0, 0, {mood:'happy', walk:a => [Math.sin(a)*.9, -.05], speed:.2}); }
    else { const sw = new THREE.Group(); sw.position.set(.2,0,.45); for(const x of [-.35,.35]) sw.add(mesh(cyl(.03,.03,.9,8), PAL.wood, x,.45,0));       const bar = mesh(cyl(.03,.03,.8,8), PAL.wood, 0,.9,0); bar.rotation.z = Math.PI/2; sw.add(bar); sw.add(mesh(rbox(.3,.03,.14,.01), 0xf28b7d, 0,.3,0)); g.add(sw);
      person(g, -.4, .55, {camera:true, mood:'grin', rot:1.2}); person(g, .2, .3, {mood:'laugh', bun:true, rot:0}); } }],
  ['通霄精鹽', (g,r,v) => {
    if(v === 0){ for(let i=0;i<4;i++) g.add(mesh(rbox(.55,.03,.45,.02), 0xbfe9f3, -.6+(i%2)*.65,.015,-.6+Math.floor(i/2)*.55));
      for(const [x,z,s] of [[.7,-.4,1],[.85,.2,.8],[.45,.55,1.1]]) g.add(mesh(cone(.28*s,.34*s,14), 0xffffff, x,.17*s,z));
      const rk = person(g, -.3, .5, {role:'farmer', mood:'smile', rot:.5}); g.add(mesh(cyl(.01,.01,.5,5), PAL.wood, -.15,.15,.6));  }
    else { building(g, -.35, -.4, .9, .5, .5, 0xfaf8f2, {roof:0x5b8def, door:0x5b8def, rows:1, cols:3});
      for(let i=0;i<6;i++){ const x = .45+(i%3)*.2, y = .07+Math.floor(i/3)*.13; g.add(mesh(rbox(.18,.12,.26,.05), 0xffffff, x,y,.1)); g.add(mesh(rbox(.1,.05,.005,.01), 0x5b8def, x,y,.24)); }
      g.add(mesh(rbox(1.6,.02,.3,.02), 0x6fd0e0, 0,.01,.95)); person(g, -.3, .5, {role:'driver', mood:'happy', rot:.8}); } }],
  ['卓蘭葡萄', (g,r,v) => {
    if(v === 0){ for(const sx of [-.7,.7]) for(const sz of [-.6,.6]) g.add(mesh(cyl(.025,.025,.7,6), PAL.wood, sx,.35,sz));
      g.add(mesh(rbox(1.5,.03,1.3,.01), 0x6cbf5f, 0,.7,0)); for(let i=0;i<9;i++){ const x = -.5+(i%3)*.5, z = -.4+Math.floor(i/3)*.4;
        for(let k=0;k<6;k++) g.add(mesh(sph(.04,8,6), 0x7a4fb5, x+(k%2)*.045-.02, .62-Math.floor(k/2)*.045, z)); g.add(mesh(sph(.04,8,6), 0x7a4fb5, x, .5, z)); }
      basket(g, .3, 0, .9, 0x7a4fb5, 1.2); person(g, -.1, .25, {role:'farmer', mood:'laugh', rot:.3}); }
    else { const tb = table(g, -.1, .2, .7, .36); for(let i=0;i<4;i++){ tb.add(mesh(cyl(.035,.035,.16,10), mat(0x6a2b8a,{transparent:true,opacity:.85}), -.22+i*.14,.4,0)); tb.add(mesh(cyl(.015,.015,.04,8), 0xffffff, -.22+i*.14,.5,0)); }
      for(let i=0;i<3;i++){ g.add(mesh(rbox(.3,.16,.22,.03), PAL.wood, .75,.08+i*.0,-.6+i*.32)); for(let k=0;k<5;k++) g.add(mesh(sph(.04,8,6), 0x7a4fb5, .65+k*.05,.18,-.6+i*.32)); }
      person(g, -.1, .65, {mood:'smile', rot:Math.PI, role:'housewife'}); person(g, -.6, -.4, {mood:'grin', role:'student'}); } }],
  ['苑裡藺草', (g,r,v) => {
    for(let i=0;i<(v?3:5);i++){ const x = -.7+i*.35; g.add(mesh(cyl(.09,.11,.6,10), 0xa8c26a, x,.3,-.55)); g.add(mesh(cyl(.115,.115,.06,10), 0xe86a5a, x,.3,-.55)); }
    if(v === 0){ g.add(mesh(rbox(1.1,.03,.7,.02), 0xd8c48a, .1,.02,.4)); for(let i=0;i<6;i++) g.add(mesh(rbox(1.1,.032,.03,.01), 0xc0a86a, .1,.025,.1+i*.12));
      person(g, -.6, .5, {mood:'happy', eth:'minnan', bun:true, elder:true, rot:.5}); }
    else { const rk = new THREE.Group(); rk.position.set(.3,0,.25); rk.add(mesh(cyl(.02,.02,1.0,6), PAL.wood, 0,.5,0));
      for(let i=0;i<3;i++){ const h = new THREE.Group(); h.position.set(Math.cos(i*2.1)*.18, .55+i*.15, Math.sin(i*2.1)*.18); h.add(mesh(cyl(.17,.17,.015,18), 0xd8c48a, 0,0,0)); h.add(mesh(cyl(.08,.09,.08,14), 0xd8c48a, 0,.04,0)); h.add(mesh(cyl(.092,.092,.02,14), [0xe86a5a,0x5b8def,0x5cc483][i], 0,.02,0)); rk.add(h); }
      g.add(rk); g.add(mesh(rbox(.24,.2,.08,.03), 0xd8c48a, -.4,.1,.6)); g.add(mesh(torus(.07,.01,Math.PI), 0xc0a86a, -.4,.2,.6));
      person(g, -.7, .2, {mood:'smile', eth:'minnan', bun:true, rot:.9}); } }],
  ['公館紅棗', (g,r,v) => {
    const jj = (x,z,s) => { const t = puffTree(g, x, z, s, 0x6cb35f); dotted(t, 16, 0xc9363e, .045, Math.round(x*50+z*9)+3); };
    if(v === 0){ jj(-.5,-.35,1); jj(.5,-.25,.9); jj(0,.55,1);
      for(let i=0;i<2;i++){ const y = .25+i*.18; g.add(mesh(cyl(.28,.28,.03,20), 0xd8b07a, .85,y,.45)); for(let k=0;k<14;k++) g.add(mesh(sph(.025,6,4), 0xb02a33, .85+Math.cos(k*1.3)*.18*((k%4+1)/4), y+.03, .45+Math.sin(k*1.3)*.18*((k%4+1)/4))); }
      g.add(mesh(cyl(.02,.02,.45,6), PAL.wood, .85,.2,.45)); person(g, -.6, .6, {role:'farmer', mood:'grin', rot:.6}); }
    else { jj(-.6,-.4,1.05); jj(.6,.5,.85);
      const ln = mesh(cyl(.006,.006,1.2,4), 0xdddddd, .1,.6,-.3); ln.rotation.z = Math.PI/2; g.add(ln); for(const x of [-.5,.7]) g.add(mesh(cyl(.015,.015,.62,6), PAL.wood, x,.31,-.3));
      for(let i=0;i<5;i++){ const b = mesh(capsule(.03,.14), 0x8a8a3a, -.3+i*.2,.47,-.3); g.add(b); }
      for(let i=0;i<3;i++) jar(g, -.2+i*.18, 0, .35, 0x8a8a3a, 0xd9363e, 1.3);
      person(g, .3, .6, {mood:'smile', eth:'hakka', bun:true, rot:-.6}); } }],
];
function natureFill(g, r, li){
  scatter(g, r, 2, .7, 1.35, (px,pz) => { const k = r(); k < .3 ? tungTree(g,px,pz,.8+r()*.3) : k < .6 ? pine(g,px,pz,.8+r()*.4) : puffTree(g,px,pz,.8+r()*.4); });
  scatter(g, r, 6, .2, 1.6, (px,pz) => flower(g, px, pz, pick([0xff9aa2,0xffd36e,0xffffff,0xc7a8ff], r)));
  LIFE[li % LIFE.length](g, r);
}
