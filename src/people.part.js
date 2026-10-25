/* ---------- people: faces, ethnic dress, jobs ---------- */
const SKIN = [0xffdcc2, 0xf7cba8, 0xeab48e, 0xdca07a];
const MOODS = ['smile','laugh','happy','grin','wink','smile','laugh','o'];
const ETHS = ['minnan','hakka','indigenous','minnan','hakka','indigenous','newcomer'];
const mouthD = () => geo('mouthD', () => { const s = new THREE.Shape(); s.absarc(0,0,.034,Math.PI,2*Math.PI,false); s.lineTo(-.034,0); return new THREE.ShapeGeometry(s, 10); });
const halfSph = (r, k) => geo(`hs${r},${k}`, () => new THREE.SphereGeometry(r,16,10,0,Math.PI*2,0,Math.PI*k));
function face(p, y, mood, hair){
  const zf = .138;
  for(const s of [-1,1]){
    if(mood === 'happy' || (mood === 'wink' && s > 0)){ const e = mesh(torus(.021,.0075,Math.PI), 0x2b2b2b, s*.052, y+.004, zf); if(mood === 'wink') e.rotation.z = Math.PI; p.add(e); }
    else { p.add(mesh(sph(.025,10,8), 0x2b2b2b, s*.052, y+.004, zf-.008)); p.add(mesh(sph(.0085,6,4), 0xffffff, s*.052+.009, y+.015, zf+.012)); }
    const br = mesh(rbox(.04,.011,.012,.004), hair, s*.054, y+.052, zf-.012); br.rotation.z = s*(mood === 'o' ? -.3 : .14); p.add(br);
    const bl = mesh(sph(.03,8,6), 0xff9e9e, s*.088, y-.035, zf-.03); bl.scale.set(1,.7,.35); p.add(bl);
  }
  if(mood === 'laugh' || mood === 'grin'){ const m = mesh(mouthD(), 0x7a2a3a, 0, y-.052, zf+.006); m.scale.setScalar(mood === 'grin' ? 1.25 : 1); p.add(m);
    p.add(mesh(sph(.014,8,6), 0xff8a9a, 0, y-.075, zf+.004)); }
  else if(mood === 'o') p.add(mesh(torus(.016,.007), 0x7a2a3a, 0, y-.058, zf+.002));
  else { const m = mesh(torus(.03,.008,Math.PI), 0x7a2a3a, 0, y-.045, zf); m.rotation.z = Math.PI; p.add(m); }
}
function dots(p, n, cols, y0, y1, rad, seed, zmin=-1){ const r = rng(seed); for(let i=0;i<n;i++){ const a = r()*Math.PI*2, y = y0 + r()*(y1-y0); const z = Math.sin(a); if(z < zmin) continue;
  p.add(mesh(sph(.014,6,4), cols[i % cols.length], Math.cos(a)*rad, y, z*rad)); } }
/* role → look. Every option is plain geometry so the whole figure bakes into one draw call. */
function person(g, x, z, o={}){
  const r = rng(Math.abs(Math.round(x*311+z*97+(o.seed||0)*13))+1);
  const p = new THREE.Group(); p.position.set(x,0,z); p.scale.setScalar(o.s || (o.role === 'student' ? .74 : 1)); p.rotation.y = o.rot || 0; p.userData.dyn = true;
  const role = o.role || (o.elder ? 'elder' : null);
  const eth = o.eth || pick(ETHS, r), mood = o.mood || pick(MOODS, r);
  const skin = eth === 'indigenous' ? pick([SKIN[2],SKIN[3]], r) : eth === 'newcomer' ? SKIN[2] : pick([SKIN[0],SKIN[1]], r);
  let hair = o.elder ? 0xe6e2dc : (o.hair ?? pick([0x2b2220,0x3b2f2a,0x1d1d1d,0x5a3d2b], r));
  const fem = o.bun ?? (r() < .5);
  let top = o.shirt ?? pick(PAL.shirt, r), pants = 0x56607a, skirt = false, shoes = 0x3b3f4a;
  const extra = [];   // functions(p) adding garments
  const hand = [];    // things held in the right hand
  const HY = .5;      // head centre
  // ethnic everyday dress for people without a uniform
  if(!role || role === 'elder' || role === 'housewife' || role === 'farmer'){
    if(eth === 'hakka'){ top = 0x2f4f8f; pants = 0x2a3550;
      extra.push(q => { q.add(mesh(capsule(.094,.13), 0x2f4f8f, 0,.22,0)); const tr = mesh(rbox(.02,.16,.02,.008), 0x111827, .05,.27,.085); tr.rotation.z = .5; q.add(tr);
        if(fem && !o.elder) { const sc = mesh(halfSph(.158,.5), 0xe8475f, 0,HY+.01,-.005); q.add(sc); dots(q, 18, [0xffc0d0,0x8fd06a,0xffffff], HY+.03, HY+.1, .145, 7, -.2); } }); }
    else if(eth === 'indigenous'){ top = 0xfaf7f2; pants = 0x2b2b2b;
      extra.push(q => { [0xd7263d,0x111111,0xd7263d].forEach((c,i) => q.add(mesh(cyl(.093,.093,.022,16), c, 0,.2+i*.035,0)));
        for(let i=0;i<6;i++){ const d = mesh(rbox(.024,.024,.01,.004), 0xffffff, -.06+i*.024,.235,.088); d.rotation.z = Math.PI/4; q.add(d); }
        q.add(mesh(cyl(.152,.152,.035,18), 0xd7263d, 0,HY+.06,0)); for(let i=0;i<5;i++){ const d = mesh(rbox(.018,.018,.01,.003), 0xffffff, -.05+i*.025,HY+.06,.15); d.rotation.z = Math.PI/4; q.add(d); } }); }
    else if(eth === 'newcomer'){ top = pick([0xf6c1d1,0xbfe3d0,0xffe08a], r); skirt = true;
      extra.push(q => { q.add(mesh(cone(.1,.22,16), top, 0,.13,0)); if(!o.hat) { q.add(mesh(cone(.27,.13,20), 0xe8cf8a, 0,HY+.17,0)); } }); }
    else { // 閩南：花襯衫、白汗衫、藍白拖
      if(o.elder && !fem){ top = 0xffffff; pants = 0x6b7280; } else { extra.push(q => dots(q, 16, [0xffffff, 0xffd36e], .19,.33,.088, 11, -.3)); }
      extra.push(q => { for(const s of [-.04,.04]){ q.add(mesh(rbox(.06,.012,.09,.006), 0xffffff, s,.006,.01)); q.add(mesh(rbox(.06,.012,.02,.005), 0x2f6fd0, s,.018,.03)); } }); shoes = null; }
  }
  switch(role){
    case 'doctor': top = 0xffffff; pants = 0x4b6584;
      extra.push(q => { q.add(mesh(capsule(.095,.12), 0xffffff, 0,.22,0)); q.add(mesh(rbox(.05,.12,.02,.01), 0x8fc7ff, 0,.3,.088)); const st = mesh(torus(.06,.007,Math.PI*1.3), 0x5b6170, 0,.32,.07); st.rotation.x = -.9; q.add(st); q.add(mesh(cyl(.016,.016,.01,10), 0xc9ced6, .03,.25,.095)); }); break;
    case 'nurse': top = 0xffc6d9; pants = 0xffc6d9; extra.push(q => { q.add(mesh(rbox(.14,.05,.1,.02), 0xffffff, 0,HY+.15,0)); q.add(mesh(rbox(.03,.03,.01,.005), 0xff6b8a, 0,HY+.15,.05)); }); break;
    case 'teacher': top = pick([0xf6d6a8, 0xc7d8f0], r); pants = 0x4b5563; skirt = fem;
      extra.push(q => { q.add(mesh(capsule(.093,.1), 0x8a6a9a, 0,.25,-.005)); q.add(mesh(rbox(.05,.14,.02,.01), top, 0,.27,.087)); glasses(q, HY); }); hand.push(q => q.add(mesh(rbox(.1,.13,.03,.01), 0xf28b7d, 0,0,0))); break;
    case 'student': top = 0xffffff; pants = 0x1f3a6b; skirt = fem;
      extra.push(q => { q.add(mesh(rbox(.14,.17,.07,.03), pick([0xff7b6b,0x5b8def,0xffc83d], r), 0,.27,-.1)); q.add(mesh(rbox(.06,.02,.02,.008), 0x1f3a6b, 0,.33,.085));
        if(r() < .6){ q.add(mesh(halfSph(.158,.48), 0xffd23f, 0,HY+.01,0)); q.add(mesh(cyl(.17,.17,.012,18), 0xffd23f, 0,HY+.06,.03)); } }); break;
    case 'housewife': extra.push(q => { q.add(mesh(rbox(.12,.17,.02,.02), 0xfff3f0, 0,.22,.088)); dots(q, 6, [0xff8a8a], .17,.28,.092, 3, .6); q.add(mesh(torus(.03,.006), 0xfff3f0, 0,.34,.07)); });
      hand.push(q => { q.add(mesh(cyl(.06,.05,.07,12), 0xc98a5a, 0,-.02,0)); for(let i=0;i<3;i++) q.add(mesh(cyl(.006,.006,.16,5), i? 0x6cbf5f:0xffffff, -.02+i*.02,.06,0)); }); break;
    case 'plumber': top = 0x3d6fb6; pants = 0x3d6fb6;
      extra.push(q => { q.add(mesh(rbox(.04,.12,.02,.01), 0x2a4f8a, -.05,.3,.085)); q.add(mesh(rbox(.04,.12,.02,.01), 0x2a4f8a, .05,.3,.085)); const bt = mesh(torus(.092,.016), 0x8a5a3a, 0,.18,0); bt.rotation.x = Math.PI/2; q.add(bt); q.add(mesh(rbox(.04,.05,.03,.01), 0xffc83d, .07,.17,.06));
        q.add(mesh(halfSph(.158,.5), 0xff8a3d, 0,HY+.01,0)); }); hand.push(q => { q.add(mesh(rbox(.025,.14,.02,.008), 0x9aa0aa, 0,0,0)); q.add(mesh(torus(.025,.01), 0x9aa0aa, 0,.08,0)); }); break;
    case 'engineer': top = pick([0x7aa6d8, 0x9ad1b5], r); pants = 0x2f3a4a;
      extra.push(q => { for(let i=0;i<3;i++) q.add(mesh(rbox(.17,.008,.01,.003), 0x2f4f7f, 0,.21+i*.05,.088)); q.add(mesh(rbox(.035,.05,.008,.004), 0xffffff, .03,.22,.095)); q.add(mesh(rbox(.008,.12,.008,.003), 0x5b8def, .02,.29,.09)); glasses(q, HY); });
      if(!o.laptop) hand.push(q => { q.add(mesh(rbox(.12,.09,.012,.004), 0x2b2f3a, 0,0,0)); q.add(mesh(rbox(.1,.07,.004,.003), 0x8fc7ff, 0,0,.008)); }); break;
    case 'cleanroom': top = 0xffffff; pants = 0xffffff; extra.push(q => { q.add(mesh(halfSph(.162,.62), 0xffffff, 0,HY-.01,-.01)); q.add(mesh(rbox(.16,.05,.03,.02), 0x8fc7ff, 0,HY-.05,.13)); }); break;
    case 'cleaner': top = 0x3aa05a; pants = 0x2f3a4a;
      extra.push(q => { q.add(mesh(capsule(.094,.1), 0xff8a2a, 0,.25,0)); for(const y of [.21,.29]) q.add(mesh(cyl(.096,.096,.018,16), 0xf2f2f2, 0,y,0)); q.add(mesh(halfSph(.158,.5), 0xffd23f, 0,HY+.01,0)); q.add(mesh(cyl(.2,.2,.012,18), 0xffd23f, 0,HY+.07,0)); });
      hand.push(q => { q.add(mesh(cyl(.008,.008,.45,5), 0xb98257, 0,.1,0)); const br = mesh(cone(.06,.1,8), 0xe8d29a, 0,-.15,0); q.add(br); }); break;
    case 'pt': top = 0x2bb3a8; pants = 0x2f3a4a; o.bun ??= fem;
      extra.push(q => { q.add(mesh(rbox(.06,.03,.02,.01), 0xffffff, 0,.33,.085)); q.add(mesh(sph(.02,8,6), 0xffffff, -.04,.27,.09)); });
      hand.push(q => { const b = mesh(torus(.06,.009,Math.PI*1.5), 0xff6b8a, 0,.02,0); q.add(b); }); break;
    case 'finance': top = 0xffffff; pants = 0x2b2f3a;
      extra.push(q => { q.add(mesh(capsule(.095,.11), 0x2b3550, 0,.23,0)); q.add(mesh(rbox(.05,.16,.02,.01), 0xffffff, 0,.27,.087)); q.add(mesh(rbox(.022,.11,.012,.005), 0xd9363e, 0,.26,.098)); q.add(mesh(rbox(.03,.02,.012,.005), 0xd9363e, 0,.33,.098)); });
      hand.push(q => { q.add(mesh(rbox(.14,.1,.04,.012), 0x6b3f22, 0,-.05,0)); q.add(mesh(rbox(.04,.015,.01,.005), PAL.gold, 0,.005,0)); }); break;
    case 'chef': top = 0xffffff; pants = 0x56607a; extra.push(q => { q.add(mesh(cyl(.12,.1,.12,14), 0xffffff, 0,HY+.18,0)); q.add(mesh(sph(.12,12,10), 0xffffff, 0,HY+.26,0)); q.add(mesh(rbox(.13,.17,.02,.02), 0xfff3d6, 0,.22,.088)); }); break;
    case 'inspector': top = 0xffffff; pants = 0x3b4a5a; extra.push(q => { q.add(mesh(capsule(.094,.1), 0x5cc483, 0,.25,0)); q.add(mesh(rbox(.06,.04,.01,.004), 0xffffff, .03,.29,.096)); }); break;
    case 'farmer': o.hat ??= 'straw'; top = pick([0xc9d8b5, 0xf3e3c3], r); extra.push(q => { for(const s of [-1,1]) q.add(mesh(cyl(.036,.036,.07,8), 0x3d6b3a, s*.04,.04,0)); }); break;
    case 'worker': o.hat ??= 'helmet'; top = 0xff9a3d; extra.push(q => { for(const y of [.22,.3]) q.add(mesh(cyl(.091,.091,.016,16), 0xf2f2f2, 0,y,0)); }); break;
    case 'driver': top = 0xe9f0ff; pants = 0x2b3550; o.hat ??= 'cap'; o.capCol ??= 0x2b3550; break;
    case 'elder': break;
  }
  p.userData.top = top;
  // legs, shoes, skirt
  for(const s of [-1,1]){ p.add(mesh(capsule(.037,.06), pants, s*.04,.07,0)); if(shoes != null) p.add(mesh(sph(.04,8,6), shoes, s*.04,.02,.015)); }
  if(skirt) p.add(mesh(cone(.11,.16,16), pants === 0x1f3a6b ? 0x1f3a6b : pick([0xff9aa2,0x8fc7ff,0x6b7280], r), 0,.17,0));
  p.add(mesh(capsule(.088,.1), top, 0,.25,0));
  put(p, mesh(torus(.045,.012), top === 0xffffff ? 0xf1f1f1 : 0xffffff, 0,.335,0)).rotation.x = Math.PI/2;
  // head + hair
  p.add(mesh(sph(.152,20,16), skin, 0,HY,0));
  const hm = mesh(halfSph(.16,.52), hair, 0,HY+.008,-.016); hm.rotation.x = -.32; p.add(hm);
  if(fem && !o.elder) p.add(mesh(capsule(.06,.12), hair, 0,HY-.08,-.11));
  if(o.bun || (fem && o.elder)) p.add(mesh(sph(.065,10,8), hair, 0,HY+.13,-.08));
  if(!fem && r() < .4) p.add(mesh(sph(.05,10,8), hair, .05,HY+.15,.04));
  face(p, HY, mood, hair);
  for(const s of [-1,1]) p.add(mesh(sph(.03,8,6), skin, s*.15,HY-.01,0));
  if(o.elder) p.add(mesh(cyl(.012,.012,.32,6), 0x9a6a45, .15,.16,.08));
  if(o.belly) p.add(mesh(sph(.085,12,10), top, 0,.22,.07));
  if(o.baby){ p.add(mesh(sph(.075,12,10), 0xfff3f6, 0,.3,.11)); p.add(mesh(sph(.045,10,8), SKIN[0], 0,.35,.14)); }
  if(o.hat === 'straw'){ p.add(mesh(cone(.27,.12,20), 0xe8cf8a, 0,HY+.18,0)); p.add(mesh(cyl(.121,.121,.025,14), 0xf28b7d, 0,HY+.13,0)); }
  if(o.hat === 'helmet'){ p.add(mesh(halfSph(.17,.5), 0xffc83d, 0,HY+.02,0)); p.add(mesh(cyl(.19,.19,.015,16), 0xffc83d, 0,HY+.03,.02)); }
  if(o.hat === 'cap'){ p.add(mesh(halfSph(.162,.45), o.capCol ?? 0x3c5aa6, 0,HY+.02,0)); p.add(mesh(rbox(.15,.02,.11,.01), o.capCol ?? 0x3c5aa6, 0,HY+.07,.15)); }
  if(o.hat === 'grad'){ p.add(mesh(rbox(.32,.03,.32,.01), 0x2b2f3a, 0,HY+.16,0)); p.add(mesh(cyl(.11,.11,.06,12), 0x2b2f3a, 0,HY+.13,0)); p.add(mesh(cyl(.008,.008,.12,4), PAL.gold, .14,HY+.1,.14)); }
  if(o.hat === 'towel') p.add(mesh(rbox(.22,.06,.18,.03), 0xffffff, 0,HY+.14,0));
  if(o.camera) p.add(mesh(rbox(.1,.07,.05,.015), 0x333333, 0,.3,.1));
  if(o.laptop){ p.add(mesh(rbox(.16,.012,.11,.004), 0xd8dde6, 0,.28,.12)); const sc = mesh(rbox(.16,.1,.01,.004), 0x8fc7ff, 0,.34,.07); sc.rotation.x = -.3; p.add(sc); }
  if(o.magnifier) hand.push(q => { q.add(mesh(torus(.05,.011), 0x5b6170, 0,.09,0)); q.add(mesh(cyl(.01,.01,.08,6), 0x8a5a3a, 0,.02,0)); });
  if(o.suitcase) p.add(mesh(rbox(.14,.18,.08,.02), 0xff8a8a, .2,.1,0));
  if(o.pot) hand.push(q => { q.add(mesh(cyl(.1,.09,.12,14), 0xc9ced6, -.06,.0,.06)); });
  extra.forEach(f => f(p));
  // arms (kept separate so they can swing)
  const arms = [];
  for(const s of [-1,1]){ const a = new THREE.Group(); a.position.set(s*.105,.33,0); a.userData.dyn = true;
    a.add(mesh(capsule(.03,.09), top, 0,-.07,0)); a.add(mesh(sph(.034,8,6), skin, 0,-.15,0));
    if(s > 0 && hand.length){ const h = new THREE.Group(); h.position.set(0,-.17,.02); hand.forEach(f => f(h)); a.add(h); a.rotation.x = -.6; a.userData.hold = true; }
    a.rotation.z = s*.18; p.add(a); bake(a); arms.push(a); }
  p.userData.arms = arms;
  bake(p);
  g.add(p);
  if(o.walk) movers.push({obj:p, path:o.walk, speed:o.speed ?? .35, t:o.t ?? r()*6, hop:9});
  return p;
}
function glasses(q, HY){ for(const s of [-1,1]) q.add(mesh(torus(.032,.006), 0x2b2b2b, s*.052,HY+.004,.15)); q.add(mesh(rbox(.03,.006,.006,.002), 0x2b2b2b, 0,HY+.01,.155)); }
