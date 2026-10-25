/* ---------- three scene ---------- */
THREE.ColorManagement.legacyMode = false;
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth <= 860 ? 1.5 : 1.75));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 900);
const controls = new THREE.MapControls(camera, renderer.domElement); // drag = pan the map; right-drag / two fingers = rotate & zoom
controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = false;
controls.maxPolarAngle = 1.3; controls.minPolarAngle = .12; controls.minDistance = 3.5; controls.maxDistance = 150; controls.zoomSpeed = .9; controls.panSpeed = 1.1;

const hemi = new THREE.HemisphereLight(0xfff6e8, 0x9cc7a0, .75); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d6, 1.45);
sun.castShadow = true; sun.shadow.mapSize.setScalar(innerWidth <= 860 ? 1024 : 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
Object.assign(sun.shadow.camera, {left:-44,right:44,top:28,bottom:-28,near:1,far:170});
scene.add(sun, sun.target);

/* materials + shared geometry */
const M = {};
function mat(hex, o={}){ const k = hex+'|'+JSON.stringify(o); return M[k] || (M[k] = new THREE.MeshStandardMaterial(Object.assign({color:hex, roughness:.72, metalness:0}, o))); }
const winMat = new THREE.MeshStandardMaterial({color:0xbfe6f5, roughness:.2, emissive:0xffcf73, emissiveIntensity:0});
const lampMat = new THREE.MeshStandardMaterial({color:0xfff2b8, emissive:0xffd36b, emissiveIntensity:.3});
const lanternMat = new THREE.MeshStandardMaterial({color:0xffa94d, emissive:0xff8a2a, emissiveIntensity:.15, roughness:.5});
const G = {}; const geo = (k, fn) => G[k] || (G[k] = fn());
function mesh(g, m, x=0,y=0,z=0){ const o = new THREE.Mesh(g, typeof m === 'number' ? mat(m) : m); o.position.set(x,y,z); o.castShadow = o.receiveShadow = true; return o; }
const sph = (r,ws=16,hs=12) => geo(`s${r},${ws}`, () => new THREE.SphereGeometry(r,ws,hs));
const cyl = (rt,rb,h,s=16) => geo(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt,rb,h,s));
const cone = (r,h,s=16) => geo(`k${r},${h},${s}`, () => new THREE.ConeGeometry(r,h,s));
const rbox = (w,h,d,r=.06) => geo(`b${w},${h},${d},${r}`, () => new THREE.RoundedBoxGeometry(w,h,d,3,Math.min(r, w/2-.002, h/2-.002, d/2-.002)));
const capsule = (r,l) => geo(`p${r},${l}`, () => new THREE.CapsuleGeometry(r,l,4,12));
const torus = (r,t,arc=Math.PI*2) => geo(`t${r},${t},${arc}`, () => new THREE.TorusGeometry(r,t,8,20,arc));
const prism = (w,h,len) => geo(`r${w},${h},${len}`, () => { const s = new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(0,h); s.lineTo(-w/2,0);
  const g = new THREE.ExtrudeGeometry(s, {depth:len, bevelEnabled:true, bevelThickness:.03, bevelSize:.03, bevelSegments:2}); g.translate(0,0,-len/2); return g; });
const heart = () => geo('heart', () => { const s = new THREE.Shape(), k = .006;
  s.moveTo(25*k,25*k); s.bezierCurveTo(25*k,25*k,20*k,0,0,0); s.bezierCurveTo(-30*k,0,-30*k,35*k,-30*k,35*k); s.bezierCurveTo(-30*k,55*k,-10*k,77*k,25*k,95*k);
  s.bezierCurveTo(60*k,77*k,80*k,55*k,80*k,35*k); s.bezierCurveTo(80*k,35*k,80*k,0,50*k,0); s.bezierCurveTo(35*k,0,25*k,25*k,25*k,25*k);
  const g = new THREE.ExtrudeGeometry(s, {depth:.06, bevelEnabled:true, bevelThickness:.03, bevelSize:.03, bevelSegments:3}); g.translate(-25*k,-50*k,-.03); g.rotateZ(Math.PI); return g; });
const disc = (r) => geo(`d${r}`, () => { const c = new THREE.CircleGeometry(r, 32); c.rotateX(-Math.PI/2); return c; });

const PAL = {
  grass:0x8fd468, grassFill:0x9fdb74, dirt:0xd4935f, sand:0xf2d79c,
  tree:[0x5fc062,0x4fb06a,0x7ccf6a,0x46a565], wall:[0xfff5e4,0xfde8d4,0xf3f0ff,0xe8f6ee],
  roof:[0xf28b7d,0x7fb3e8,0xf7cf62,0x8fd8b9,0xbaa4e6], skin:0xffd9bd, hair:[0x3b2f2a,0x5a3d2b,0x222222,0x8a5a3a],
  shirt:[0xff9aa2,0x8fc7ff,0xffd36e,0x9de0b8,0xc7a8ff,0xffb36b],
  ribbon:[0x5cc483,0x6f93e8], brick:0xd8805a, gold:0xffcf4d, wood:0xb98257, water:0x6fd0e0,
};
const put = (parent, m) => (parent.add(m), m);
const pick = (arr, r) => arr[Math.floor(r()*arr.length)];
const movers = [], tickers = [];

/* ---------- small cute builders ---------- */
function puffTree(g, x, z, s=1, col){
  const t = new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
  const c = col ?? PAL.tree[Math.abs(Math.round(x*13+z*7)) % 4];
  t.add(mesh(cyl(.06,.09,.42,10), 0xa8714a, 0,.21,0));
  t.add(mesh(sph(.34), c, 0,.66,0)); t.add(mesh(sph(.24), c, .18,.52,.1)); t.add(mesh(sph(.22), c, -.16,.55,-.09));
  g.add(t); return t;
}
function dotted(t, n, col, r=.05, seed=5, rad=.34, cy=.66){ const rr = rng(seed);
  for(let i=0;i<n;i++){ const v = new THREE.Vector3(rr()-.5, rr()*.9+.1, rr()-.5).normalize().multiplyScalar(rad); t.add(mesh(sph(r,8,6), col, v.x, cy+v.y, v.z)); } }
function tungTree(g, x, z, s=1){ const t = puffTree(g, x, z, s, 0x86c97a); dotted(t, 11, 0xfffbf2, .05, Math.abs(Math.round(x*1000+z*37))+5); return t; }
function pine(g, x, z, s=1){
  const t = new THREE.Group(); t.position.set(x,0,z); t.scale.setScalar(s);
  t.add(mesh(cyl(.05,.07,.3,8), 0xa8714a, 0,.15,0));
  [[.34,.45,.42],[.27,.4,.68],[.18,.34,.92]].forEach(([r,h,y]) => t.add(mesh(cone(r,h,12), 0x5fae78, 0,y,0)));
  g.add(t); return t;
}
function flower(g, x, z, col){ g.add(mesh(cyl(.012,.012,.14,5), 0x6cbf5f, x,.07,z)); g.add(mesh(sph(.045,8,6), col, x,.15,z)); }
function tuft(g, x, z){ for(let i=0;i<3;i++) g.add(mesh(cone(.035,.16,5), 0x86cf66, x+(i-1)*.04, .08, z+(i%2)*.03)); }
function rock(g, x, z, s=1, col=0xd3cdc3){ const m = mesh(geo('rock', () => new THREE.DodecahedronGeometry(.16,0)), col, x,.06*s,z); m.scale.set(s, s*.6, s); g.add(m); return m; }
function windowsOn(g, x, y0, z, w, h, d, rows, cols){
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++){
    const wx = x - w/2 + (j+.5)*w/cols, wy = y0 + (i+.6)*h/(rows+.4);
    g.add(mesh(rbox(w/cols*.55, h/(rows+.4)*.5, .03, .015), winMat, wx, wy, z + d/2 + .005));
  }
}
function house(g, x, z, o={}){
  const h = new THREE.Group(); h.position.set(x,0,z); h.scale.setScalar(o.s || 1); h.rotation.y = o.rot || 0;
  const wall = o.wall ?? PAL.wall[0], roof = o.roof ?? PAL.roof[0];
  h.add(mesh(rbox(.62,.46,.52,.07), wall, 0,.23,0));
  const rf = mesh(prism(.78,.36,.6), roof, 0,.44,0); rf.rotation.y = Math.PI/2; h.add(rf);
  h.add(mesh(rbox(.14,.24,.03,.03), 0xa8714a, -.12,.12,.265));
  h.add(mesh(rbox(.14,.12,.03,.02), winMat, .14,.27,.265));
  h.add(mesh(rbox(.08,.18,.08,.02), roof, .18,.68,-.1));
  g.add(h); return h;
}
function building(g, x, z, w, h, d, col, o={}){
  const b = new THREE.Group(); b.position.set(x,0,z); b.rotation.y = o.rot || 0;
  b.add(mesh(rbox(w,h,d,.08), col, 0,h/2,0));
  if(o.roof) b.add(mesh(rbox(w+.04,.08,d+.04,.03), o.roof, 0,h+.02,0));
  if(o.gable){ const rf = mesh(prism(d+.16,o.gableH ?? .3,w+.06), o.gable, 0,h,0); b.add(rf); }
  windowsOn(b, 0, 0, 0, w*.86, h*(o.door ? .9 : 1), d, o.rows ?? Math.max(1, Math.round(h/.32)), o.cols ?? Math.max(2, Math.round(w/.22)));
  if(o.door) b.add(mesh(rbox(.18,.26,.03,.03), o.door, 0,.13,d/2+.01));
  g.add(b); return b;
}
function sign(g, x, y, z, w, h, col, rotY=0){ const s = mesh(rbox(w,h,.04,.02), col, x,y,z); s.rotation.y = rotY; g.add(s); return s; }
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
  if(o.walk){ p.userData.walker = true; movers.push({obj:p, path:o.walk, speed:o.speed ?? .35, t:o.t ?? r()*6, hop:9, avoid:.13*p.scale.x}); }
  return p;
}
function glasses(q, HY){ for(const s of [-1,1]) q.add(mesh(torus(.032,.006), 0x2b2b2b, s*.052,HY+.004,.15)); q.add(mesh(rbox(.03,.006,.006,.002), 0x2b2b2b, 0,HY+.01,.155)); }

function vehicle(g, o){
  const v = new THREE.Group(); v.userData.dyn = true; const L = o.len ?? .5, H = o.h ?? .2;
  v.add(mesh(rbox(.3,H,L,.07), o.col, 0,.14+H/2-.1,0));
  v.add(mesh(rbox(.27,.13,L*(o.cab ?? .5),.05), winMat, 0,.14+H-.02, o.cabZ ?? -.02));
  if(o.stripe) v.add(mesh(rbox(.31,.05,L*.98,.02), o.stripe, 0,.12+H/2-.1,0));
  if(o.roofSign) v.add(mesh(rbox(.14,.07,.08,.02), o.roofSign, 0,.14+H+.08,0));
  if(o.heart){ const h = mesh(heart(), 0xff6b8a, 0,.14+H+.12,0); h.scale.setScalar(.5); v.add(h); }
  for(const sx of [-.15,.15]) for(const sz of [-L*.32, L*.32]){ const w = mesh(cyl(.065,.065,.05,14), 0x3b3f4a, sx,.07,sz); w.rotation.z = Math.PI/2; v.add(w); }
  if(o.light){ const lm = new THREE.MeshStandardMaterial({color:o.light, emissive:o.light, emissiveIntensity:1}); v.add(mesh(rbox(.12,.05,.08,.02), lm, 0,.14+H+.08,0));
    tickers.push((dt,t) => lm.emissiveIntensity = (Math.sin(t*8) > 0) ? 1.6 : .1); }
  g.add(v);
  if(o.path) movers.push({obj:v, path:o.path, speed:o.speed ?? .5, t:o.t ?? 0, y:o.y ?? 0}); else { v.position.set(o.x, o.y ?? 0, o.z); v.rotation.y = o.rot ?? 0; }
  return v;
}
function bike(g, x, z, col=0xffa630, rot=0){
  const b = new THREE.Group(); b.position.set(x,0,z); b.rotation.y = rot;
  for(const s of [-.11,.11]){ const w = mesh(torus(.07,.012), 0x333333, 0,.08,s); w.rotation.y = Math.PI/2; b.add(w); }
  const f = mesh(rbox(.025,.025,.24,.01), col, 0,.13,0); b.add(f); b.add(mesh(rbox(.025,.1,.025,.01), col, 0,.16,-.05));
  b.add(mesh(rbox(.06,.02,.08,.01), 0x333333, 0,.21,-.06)); b.add(mesh(rbox(.14,.02,.02,.01), 0x333333, 0,.2,.1));
  b.add(mesh(rbox(.1,.06,.08,.02), col, 0,.18,.14)); g.add(b); return b;
}
function ellipseRing(g, rx, rz, w, col, y=.012, n=48){
  const shape = new THREE.Shape(); shape.absellipse(0,0,rx+w/2,rz+w/2,0,Math.PI*2); const hole = new THREE.Path(); hole.absellipse(0,0,rx-w/2,rz-w/2,0,Math.PI*2,true); shape.holes.push(hole);
  const gm = new THREE.ShapeGeometry(shape, n); gm.rotateX(-Math.PI/2); const m = mesh(gm, col, 0,y,0); m.castShadow = false; g.add(m); return m;
}
function track(g, rx, rz, sleepers=26){
  ellipseRing(g, rx, rz, .3, 0xb7a58f, .01);
  for(let i=0;i<sleepers;i++){ const a = i/sleepers*Math.PI*2, x = Math.cos(a)*rx, z = Math.sin(a)*rz, tx = -Math.sin(a)*rx, tz = Math.cos(a)*rz;
    const s = mesh(rbox(.26,.025,.06,.01), 0x8a5a3a, x,.03,z); s.rotation.y = Math.atan2(tx, tz) + Math.PI/2; g.add(s); }
  ellipseRing(g, rx-.08, rz-.08*rz/rx, .025, 0x8c9099, .05); ellipseRing(g, rx+.08, rz+.08*rz/rx, .025, 0x8c9099, .05);
}
function train(g, rx, rz, cols, speed, ph){
  const path = a => [Math.cos(a)*rx, Math.sin(a)*rz];
  cols.forEach((c,i) => { const car = new THREE.Group(); car.userData.dyn = true;
    car.add(mesh(rbox(.26,.24,.5,.08), c, 0,.2,0)); car.add(mesh(rbox(.27,.08,.42,.03), winMat, 0,.25,0)); car.add(mesh(rbox(.27,.04,.5,.02), 0xffffff, 0,.15,0));
    if(i===0){ car.add(mesh(sph(.025,8,6), lampMat, -.07,.18,.25)); car.add(mesh(sph(.025,8,6), lampMat, .07,.18,.25)); }
    g.add(car); movers.push({obj:car, path, speed, t:ph - i*.55/((rx+rz)/2)}); });
}
function roadRing(g, r1, r2){
  const road = mesh(geo(`road${r1}`, () => new THREE.RingGeometry(r1, r2, 48)), 0x7d8593, 0,.012,0); road.rotation.x = -Math.PI/2; road.castShadow = false; g.add(road);
  const mid = (r1+r2)/2; for(let i=0;i<14;i++){ const a = i/14*Math.PI*2; const d = mesh(rbox(.04,.012,.14,.005), 0xffffff, Math.cos(a)*mid,.022,Math.sin(a)*mid); d.rotation.y = -a; g.add(d); }
}
function flag(g, x, y, z, col, w=.5, h=.32){
  g.add(mesh(cyl(.02,.025,y+.05,8), 0xf2f2f2, x,(y+.05)/2,z)); g.add(mesh(sph(.04,10,8), PAL.gold, x,y+.08,z));
  const pg = new THREE.PlaneGeometry(w, h, 10, 4); pg.translate(w/2,0,0);
  const f = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({color:col, side:THREE.DoubleSide, roughness:.8})); f.castShadow = true;
  const holder = new THREE.Group(); holder.userData.dyn = true; holder.position.set(x, y-h/2+.02, z); holder.add(f); g.add(holder);
  const base = pg.attributes.position.array.slice();
  tickers.push((dt,t) => { const a = pg.attributes.position.array; for(let i=0;i<a.length;i+=3){ const px = base[i]; a[i+2] = Math.sin(px*7 - t*5)*.06*px/w; } pg.attributes.position.needsUpdate = true; });
}
function smoke(g, x, y, z, s=1, op=.9){
  const holder = new THREE.Group(); holder.userData.dyn = true; holder.position.set(x,y,z); g.add(holder);
  const puffs = [0,1,2].map(i => { const m = new THREE.Mesh(sph(.13*s,12,10), new THREE.MeshStandardMaterial({color:0xffffff, transparent:true, opacity:op, roughness:1, depthWrite:false})); holder.add(m); return m; });
  tickers.push((dt,t) => puffs.forEach((p,i) => { const k = ((t*.35 + i/3) % 1); p.position.set(Math.sin(k*4)*.08, k*.9*s, 0); p.scale.setScalar(.6 + k*1.2); p.material.opacity = op*(1-k); }));
}
function strawberry(g, x, y, z, s=1){
  const b = mesh(cone(.05*s,.1*s,10), 0xff5468, x,y,z); b.rotation.x = Math.PI; g.add(b);
  g.add(mesh(cyl(.045*s,.03*s,.02*s,8), 0x5fbf6a, x,y+.055*s,z));
}
function bench(g, x, z, rot=0){ const b = new THREE.Group(); b.position.set(x,0,z); b.rotation.y = rot;
  b.add(mesh(rbox(.42,.04,.14,.015), 0xc98a5a, 0,.14,0)); b.add(mesh(rbox(.42,.12,.03,.012), 0xc98a5a, 0,.24,-.06));
  for(const s of [-.17,.17]) b.add(mesh(rbox(.03,.14,.12,.01), 0x6a6f7a, s,.07,0)); g.add(b); }
function lamp(g, x, z){ g.add(mesh(cyl(.018,.025,.6,8), 0x5b6170, x,.3,z)); g.add(mesh(sph(.06,10,8), lampMat, x,.63,z)); }
function cones(g, pts){ for(const [x,z] of pts){ g.add(mesh(cone(.06,.16,12), 0xff8a3d, x,.08,z)); g.add(mesh(cyl(.044,.05,.03,12), 0xffffff, x,.08,z)); } }
function stroller(g, path, ph, speed, col=0xffb3c7, po={}){
  const s = new THREE.Group(); s.userData.dyn = true;
  s.add(mesh(rbox(.2,.12,.26,.05), col, 0,.17,0)); s.add(mesh(geo('hood', () => new THREE.SphereGeometry(.13,14,10,0,Math.PI,0,Math.PI/2)), col, 0,.22,-.08));
  for(const sx of [-.09,.09]) for(const sz of [-.09,.09]){ const w = mesh(torus(.04,.012), 0x555555, sx,.05,sz); w.rotation.y = Math.PI/2; s.add(w); }
  s.add(mesh(cyl(.01,.01,.22,6), 0x555555, 0,.28,-.17)); g.add(s);
  s.userData.walker = true; movers.push({obj:s, path, speed, t:ph, avoid:.15});
  person(g, 0, 0, Object.assign({walk:path, speed, t:ph - .35}, po));
}
function tooth(g, x, y, z, s=1){
  const t = new THREE.Group(); t.position.set(x,y,z); t.scale.setScalar(s);
  const c = mesh(sph(.2,18,14), 0xffffff, 0,.1,0); c.scale.set(1.1,.85,.85); t.add(c);
  for(const sx of [-1,1]){ const rt = mesh(capsule(.06,.12), 0xffffff, sx*.09,-.08,0); rt.rotation.z = sx*.25; t.add(rt);
    t.add(mesh(sph(.022,8,6), 0x2b2b2b, sx*.07,.13,.16)); const bl = mesh(sph(.03,8,6), 0xff9e9e, sx*.13,.07,.14); bl.scale.z = .4; t.add(bl); }
  g.add(t); return t;
}
function cat(g, x, z, rot=0, fur=0xf4a85e){
  const c = new THREE.Group(); c.position.set(x,0,z); c.rotation.y = rot; c.userData.dyn = true;
  const body = mesh(sph(.16), fur, 0,.15,0); body.scale.set(1,.85,1.25); c.add(body);
  c.add(mesh(sph(.13), fur, 0,.33,.12));
  for(const s of [-1,1]){ const e = mesh(cone(.05,.09,8), fur, s*.07,.45,.12); e.rotation.z = -s*.3; c.add(e);
    c.add(mesh(sph(.016,8,6), 0x2b2b2b, s*.045,.35,.235)); const bl = mesh(sph(.022,8,6), 0xff9e9e, s*.075,.31,.22); bl.scale.z=.4; c.add(bl); }
  c.add(mesh(sph(.02,8,6), 0xff8a8a, 0,.32,.25));
  for(const s of [-1,1]) c.add(mesh(sph(.05,10,8), 0xfff3e6, s*.07,.04,.15));
  const tail = new THREE.Group(); tail.position.set(0,.16,-.18); tail.add(mesh(capsule(.03,.22), fur, 0,.13,0)); c.add(tail);
  tickers.push((dt,t) => { tail.rotation.z = Math.sin(t*2.6 + x)*.5; tail.rotation.x = -.5; });
  g.add(c); return c;
}
function duck(parent, path, ph){
  const d = new THREE.Group(); d.userData.dyn = true;
  const b = mesh(sph(.16), 0xffe066, 0,.08,0); b.scale.set(1,.8,1.3); d.add(b);
  d.add(mesh(sph(.11), 0xffe066, 0,.25,.14)); const bk = mesh(cone(.04,.1,8), 0xff9a3d, 0,.24,.27); bk.rotation.x = Math.PI/2; d.add(bk);
  d.add(mesh(sph(.015,8,6), 0x222222, -.05,.28,.22)); d.add(mesh(sph(.015,8,6), 0x222222, .05,.28,.22));
  parent.add(d); movers.push({obj:d, path, speed:.05, t:ph, y:-.08, bob:1});
}
function sailboat(parent, col, path, ph, speed=.05){
  const b = new THREE.Group(); b.userData.dyn = true;
  b.add(mesh(rbox(.42,.18,1,.08), 0xfffaf2, 0,.06,0)); b.add(mesh(rbox(.44,.05,1.02,.02), col, 0,.1,0));
  b.add(mesh(cyl(.02,.02,1.1,8), 0xc98a5a, 0,.66,.05));
  const sail = mesh(prism(.6,.85,.02), 0xffffff, 0,.22,.08); sail.rotation.y = Math.PI/2; b.add(sail);
  parent.add(b); movers.push({obj:b, path, speed, t:ph, y:-.05, bob:1});
}
function lighthouse(g, x, z){
  [0xffffff,0xf28b7d,0xffffff,0xf28b7d].forEach((c,i) => g.add(mesh(cyl(.2-i*.025,.22-i*.025,.3,16), c, x,.15+i*.3,z)));
  g.add(mesh(cyl(.17,.17,.22,16), lampMat, x,1.3,z)); g.add(mesh(cone(.24,.26,16), 0xf28b7d, x,1.54,z));
}
function pig(g, x, z, s=1, rot=.4){
  const p = new THREE.Group(); p.position.set(x,0,z); p.rotation.y = rot; p.scale.setScalar(s); const pk = 0xffadc4;
  const body = mesh(sph(.42,24,18), pk, 0,.5,0); body.scale.set(1,.88,1.18); p.add(body);
  const sn = mesh(cyl(.13,.13,.08,18), 0xff92ae, 0,.5,.5); sn.rotation.x = Math.PI/2; p.add(sn);
  for(const k of [-1,1]){ p.add(mesh(sph(.025,8,6), 0x8a4a5a, k*.045,.5,.545)); p.add(mesh(sph(.035,8,6), 0x2b2b2b, k*.17,.66,.36));
    const bl = mesh(sph(.05,8,6), 0xff7f9f, k*.27,.52,.33); bl.scale.z=.4; p.add(bl);
    const ear = mesh(cone(.1,.16,10), pk, k*.2,.88,.15); ear.rotation.z = -k*.35; p.add(ear);
    for(const zz of [-.25,.25]) p.add(mesh(cyl(.07,.07,.18,12), pk, k*.2,.1,zz)); }
  p.add(mesh(rbox(.2,.03,.05,.012), 0x6a3a4a, 0,.86,0));
  p.add(mesh(torus(.06,.02,Math.PI*1.6), pk, 0,.55,-.5)); g.add(p); return p;
}
function droppingCoin(g, x, top, z){
  const coin = new THREE.Group(); coin.userData.dyn = true; coin.position.set(x,top,z); const cm = mesh(cyl(.13,.13,.03,22), mat(PAL.gold,{metalness:.35,roughness:.35})); cm.rotation.x = Math.PI/2; coin.add(cm); g.add(coin);
  tickers.push((dt,t) => { const k = (t*.5) % 1; coin.position.y = top + .25 - k*.5; coin.rotation.y += dt*4; coin.scale.setScalar(k > .85 ? (1-k)/.15 : 1); });
}
function coinStack(g, x, z, n){ for(let i=0;i<n;i++) g.add(mesh(cyl(.14,.14,.05,20), mat(PAL.gold,{metalness:.35,roughness:.35}), x,.03+i*.055,z)); }
function stall(g, x, z, rot=0, stripe=0xff8a8a){
  const s = new THREE.Group(); s.position.set(x,0,z); s.rotation.y = rot;
  for(const px of [-.3,.3]) for(const pz of [-.15,.15]) s.add(mesh(cyl(.015,.015,.5,6), 0xffffff, px,.25,pz));
  for(let i=0;i<5;i++) s.add(mesh(rbox(.13,.04,.42,.02), i%2 ? 0xffffff : stripe, -.26+i*.13,.52,0));
  s.add(mesh(rbox(.66,.05,.32,.02), PAL.wood, 0,.22,0));
  [0xff5a5a,0x6cc070,0xffa94d,0xffe066,0x9b6bd6].forEach((c,i) => s.add(mesh(sph(.05,10,8), c, -.24+i*.12,.28,(i%2)*.08-.04)));
  g.add(s); return s;
}
function shield(g, x, y, z, col=0x5cc483, s=1){
  const sh = new THREE.Group(); sh.position.set(x,y,z); sh.scale.setScalar(s);
  const shp = geo('shield', () => { const p = new THREE.Shape(); p.moveTo(-.25,.3); p.lineTo(.25,.3); p.lineTo(.25,0); p.quadraticCurveTo(.25,-.25,0,-.35); p.quadraticCurveTo(-.25,-.25,-.25,0); p.lineTo(-.25,.3);
    return new THREE.ExtrudeGeometry(p, {depth:.06, bevelEnabled:true, bevelThickness:.03, bevelSize:.03, bevelSegments:3}); });
  sh.add(mesh(shp, col)); const a = mesh(rbox(.06,.16,.04,.015), 0xffffff, -.07,-.03,.09); a.rotation.z = .7; sh.add(a); const b = mesh(rbox(.06,.3,.04,.015), 0xffffff, .06,.03,.09); b.rotation.z = -.6; sh.add(b);
  g.add(sh); return sh;
}
function book(g, x, y, z, col, w=.36, h=.08, d=.26){ g.add(mesh(rbox(w,h,d,.02), col, x,y,z)); g.add(mesh(rbox(w*.92,h*.7,d+.005,.01), 0xfffaf0, x+.01,y,z)); }

/* ---------- Miaoli specialties for the open land ---------- */
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
  s.add(mesh(rbox(.16,.18,.02,.02), 0x5a2a1a, 0,.2,.125)); s.add(mesh(cyl(.05,.06,.07,10), 0xc9a34a, 0,.12,.17)); textSign(s, '福德祠', 0,.335,.128, .24,.065, {bg:'#c0392b', fg:'#ffe08a', border:false});
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
      for(let i=0;i<3;i++){ g.add(mesh(rbox(1.3,.08,.22,.04), 0xc0855a, -.3,.04,-.6+i*.4)); for(let j=0;j<5;j++){ const lf = mesh(sph(.07,10,8), 0x4fb35a, -.85+j*.27,.1,-.62+i*.4); lf.scale.y = .55; g.add(lf); berry(g, -.85+j*.27+.04, .13, -.55+i*.4, .9); } }
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

/* ---------- one scene per policy theme ---------- */
const ring = (rx, rz=rx, cx=0, cz=0) => a => [cx+Math.cos(a)*rx, cz+Math.sin(a)*rz];
const SCENES = {
  /* 陳品安 */
  babycard(g){ // 生育津貼、栗寶卡、公托
    const card = new THREE.Group(); card.position.set(-.55,0,-.55); card.rotation.y = .35;
    card.add(mesh(rbox(.95,.6,.06,.08), 0xffc65c, 0,.62,0)); card.add(mesh(rbox(.2,.15,.02,.03), PAL.gold, -.27,.68,.04));
    const nut = mesh(sph(.13,16,12), 0x8a4f2e, .2,.62,.06); nut.scale.set(1,.9,.5); card.add(nut); put(card, mesh(sph(.1,14,10), 0xe8c38f, .2,.71,.07)).scale.set(1,.5,.4);
    card.add(mesh(rbox(.06,.3,.06,.02), 0xdddddd, 0,.15,0)); card.add(mesh(cyl(.18,.2,.04,16), 0xdddddd, 0,.02,0)); g.add(card);
    building(g, .65, -.45, .7, .5, .5, 0xfff0f5, {gable:0xffb3c7, door:0xff9ab5, rows:1, cols:3, rot:-.4});
    [[.9,.35,0xff8a8a],[1.08,.35,0x8fc7ff],[.99,.5,0xffd36e]].forEach(([x,z,c]) => g.add(mesh(rbox(.16,.16,.16,.03), c, x,.08,z)));
    g.add(mesh(rbox(.16,.16,.16,.03), 0x9de0b8, .99,.24,.42));
    stroller(g, ring(.75,.45,-.1,.45), 0, .35, 0xffb3c7, {role:'housewife', eth:'hakka', mood:'smile'}); stroller(g, ring(.75,.45,-.1,.45), 3.1, .35, 0x9ccfff, {eth:'indigenous', bun:false, mood:'laugh'});
    person(g, .35, -.05, {role:'teacher', mood:'happy', rot:-.6, bun:true}); person(g, .6, .1, {role:'student', s:.6, mood:'laugh', rot:-2.4});
  },
  maternity(g){ // 好孕專車、產檢、坐月子
    building(g, -.25, -.45, 1.0, .62, .6, 0xfff0f5, {roof:0xff9ab5, door:0xffffff, rows:2, cols:4});
    const h = mesh(heart(), 0xff6b8a, -.25,.95,-.12); h.scale.setScalar(1.3); g.add(h);
    tickers.push((dt,t) => { const k = 1.3 + Math.max(0, Math.sin(t*3))**8*.25; h.scale.setScalar(k); });
    vehicle(g, {col:0xffb3c7, len:.62, h:.3, cab:.35, cabZ:.15, x:.85, z:-.2, rot:-.4, heart:true});
    person(g, -.2, .5, {belly:true, bun:true, eth:'minnan', mood:'happy', shirt:0xffc0d4, walk:ring(.35,.18,-.2,.55), speed:.15});
    person(g, -.2, .5, {bun:false, mood:'grin', walk:ring(.35,.18,-.2,.55), speed:.15, t:-.6});
    person(g, .35, -.05, {role:'nurse', bun:true, mood:'smile', rot:-.3});
    person(g, .55, .55, {baby:true, bun:true, eth:'newcomer', mood:'happy', rot:-.5});
    bench(g, .6, .85, -.2); [0xff9aa2,0xffd36e,0xffffff,0xff9aa2].forEach((c,i) => flower(g, -.95+i*.12, .2+(i%2)*.1, c));
  },
  elderdental(g){ // 免健保費、假牙、敬老卡、疫苗
    building(g, -.35, -.45, .85, .55, .55, 0xe8f6ff, {roof:0x7fb3e8, door:0x7fb3e8, rows:1, cols:3});
    tooth(g, -.35, .95, -.45, 1.0);
    g.add(mesh(rbox(.5,.05,.5,.02), PAL.wood, .55,.32,.35)); g.add(mesh(cyl(.04,.06,.3,8), PAL.wood, .55,.15,.35));
    for(let i=0;i<4;i++) for(let j=0;j<4;j++) if((i+j)%2) g.add(mesh(rbox(.1,.005,.1,.002), 0xb5523b, .4+i*.1,.35,.2+j*.1));
    [[.4,.3],[.6,.4],[.5,.25]].forEach(([x,z],i) => g.add(mesh(cyl(.03,.03,.015,10), i%2?0xd9363e:0x333333, x,.36,z)));
    person(g, .55, -.05, {elder:true, eth:'hakka', bun:false, mood:'grin', rot:0}); person(g, .55, .75, {elder:true, eth:'minnan', bun:false, mood:'o', rot:Math.PI});
    person(g, .05, -.05, {role:'doctor', mood:'smile', rot:.3});
    puffTree(g, 1.0, -.2, 1.1);
    person(g, -.6, .5, {elder:true, eth:'indigenous', bun:true, mood:'laugh', walk:ring(.35,.2,-.5,.55), speed:.15});
    const card = mesh(rbox(.36,.22,.03,.04), 0xffd36e, -1.0,.5,.3); card.rotation.y = .8; g.add(card); g.add(mesh(cyl(.015,.015,.4,6), 0xdddddd, -1.0,.2,.3));
  },
  rail(g){ // 雙軌化、竹科通勤、交流道
    track(g, 1.35, .95); track(g, 1.0, .6);
    train(g, 1.35, .95, [0xff8a3d, 0xfff3d6, 0xfff3d6], .32, 0);
    train(g, 1.0, .6, [0x5b8def, 0xe9f0ff, 0xe9f0ff], -.42, 2.5);
    const st = new THREE.Group(); st.position.set(0,0,0);
    st.add(mesh(rbox(.75,.42,.36,.05), 0xb98257, 0,.21,0)); const rf = mesh(prism(.5,.22,.85), 0x5b4a3e, 0,.42,0); rf.rotation.y = Math.PI/2; st.add(rf);
    st.add(mesh(rbox(.36,.1,.03,.02), 0xfff5e4, 0,.62,.18)); st.add(mesh(rbox(.14,.22,.03,.02), winMat, -.18,.15,.185)); st.add(mesh(rbox(.14,.22,.03,.02), winMat, .18,.15,.185));
    g.add(st);
    person(g, -.45, .3, {role:'engineer', mood:'smile', rot:Math.PI}); person(g, .45, .3, {role:'finance', mood:'happy', rot:Math.PI, seed:3}); person(g, .2, .38, {role:'student', mood:'laugh', rot:Math.PI});
  },
  shuttle(g){ // 幸福巴士、通學、候車亭無障礙
    ellipseRing(g, 1.15, .75, .32, 0xd8c8a8, .012);
    const hill = mesh(sph(.55,20,14), 0x6cbf5f, 0,.05,0); hill.scale.set(1.2,.6,.75); g.add(hill);
    for(let i=0;i<3;i++){ const b = mesh(capsule(.08,.45), 0x4f9a55, -.3+i*.3,.33-Math.abs(i-1)*.05,-.05); b.rotation.x = Math.PI/2; b.rotation.z = Math.PI/2; g.add(b); }
    vehicle(g, {col:0x7ed49b, stripe:0xffffff, len:.55, h:.3, cab:.8, cabZ:0, path:ring(1.15,.75), speed:.35});
    const sh = new THREE.Group(); sh.position.set(.75,0,.95); sh.rotation.y = -.2;
    sh.add(mesh(rbox(.6,.04,.26,.02), 0x7ed49b, 0,.5,0)); sh.add(mesh(rbox(.58,.44,.02,.01), mat(0xd9f2ff,{transparent:true,opacity:.6}), 0,.26,-.12));
    sh.add(mesh(rbox(.04,.5,.04,.01), 0xdddddd, -.27,.25,.1)); sh.add(mesh(rbox(.04,.5,.04,.01), 0xdddddd, .27,.25,.1));
    const ramp = mesh(rbox(.3,.02,.3,.01), 0x8fc7ff, -.45,.04,.05); ramp.rotation.z = .12; sh.add(ramp); g.add(sh);
    const wc = new THREE.Group(); wc.position.set(.55,0,1.0); wc.userData.dyn = true;
    for(const s of [-.1,.1]){ const w = mesh(torus(.09,.015), 0x5b6170, s,.1,0); w.rotation.y = Math.PI/2; wc.add(w); } wc.add(mesh(rbox(.18,.04,.16,.02), 0x5b8def, 0,.18,0));
    g.add(wc); const pw = person(g, .55, 1.0, {sit:true, elder:true, eth:'minnan', mood:'happy'}); pw.position.y = .05; person(g, 1.0, .75, {role:'cleaner', mood:'smile', rot:-1.2});
    for(let i=0;i<5;i++) g.add(mesh(rbox(.08,.012,.3,.004), 0xffffff, -.6+i*.13,.025,-.82));
    person(g, -.5, -.82, {role:'student', mood:'laugh', walk:a => [-.35+Math.sin(a)*.4, -.82], speed:.5}); person(g, -.5, -.82, {role:'student', mood:'happy', walk:a => [-.35+Math.sin(a+.4)*.4, -.82], speed:.5});
  },
  sciencepark(g){ // 對接大矽谷、招商、山線露營
    building(g, -.35, -.35, .95, .7, .65, 0xe7f1fb, {roof:0x5b6170, rows:2, cols:5});
    const wafer = new THREE.Group(); wafer.position.set(-.35,1.05,-.35); wafer.userData.dyn = true; const wd = mesh(cyl(.28,.28,.03,32), mat(0xc9d6e8,{metalness:.6,roughness:.25})); wd.rotation.x = Math.PI/2; wafer.add(wd);
    for(let i=-2;i<=2;i++) wafer.add(mesh(rbox(.5,.006,.035,.002), 0x7b9bd6, 0,i*.09,.02)); g.add(wafer); tickers.push(dt => wafer.rotation.y += dt*.8);
    person(g, .2, .2, {role:'cleanroom', mood:'smile', walk:a => [.2+Math.sin(a)*.3, .25], speed:.3}); person(g, .15, .65, {eth:'indigenous', mood:'laugh', rot:.6});
    g.add(mesh(cyl(.02,.02,.7,6), 0xdddddd, .65,.35,-.55)); const ar = mesh(rbox(.42,.12,.03,.02), 0x5cc483, .82,.6,-.55); g.add(ar); put(g, mesh(cone(.09,.12,3), 0x5cc483, 1.08,.6,-.55)).rotation.z = -Math.PI/2;
    for(const [x,z,c] of [[.55,.6,0xff9a3d],[.95,.3,0x7ed49b]]){ const t = mesh(cone(.3,.36,4), c, x,.18,z); t.rotation.y = Math.PI/4; g.add(t); g.add(mesh(rbox(.1,.2,.02,.01), 0x3b3f4a, x,.1,z+.21)); }
    g.add(mesh(cyl(.12,.14,.06,12), 0x8a8a8a, .35,.03,.95)); smoke(g, .35, .1, .95, .5, .5);
    pine(g, -.9, .6, .9); pine(g, -.6, .9, .7);
  },
  startup(g){ // 閒置老屋青創、創業貸款、在地就業
    const old = new THREE.Group(); old.position.set(-.35,0,-.4);
    old.add(mesh(rbox(1.0,.46,.5,.05), PAL.brick, 0,.23,0)); const rf = mesh(prism(.66,.3,1.08), 0x6b6f78, 0,.46,0); rf.rotation.y = Math.PI/2; old.add(rf);
    old.add(mesh(rbox(.5,.22,.03,.02), winMat, 0,.2,.255)); for(let i=0;i<5;i++) old.add(mesh(rbox(.2,.04,.18,.02), i%2? 0xffffff:0x5cc483, -.4+i*.2,.42,.33));
    old.add(mesh(rbox(.4,.1,.03,.02), 0xfff5e4, 0,.58,.2)); g.add(old);
    const rk = new THREE.Group(); rk.position.set(.75,0,-.3);
    rk.add(mesh(cyl(.2,.24,.12,16), 0xdddddd, 0,.06,0)); rk.add(mesh(capsule(.13,.4), 0xffffff, 0,.45,0)); rk.add(mesh(cone(.13,.22,16), 0xff6b6b, 0,.82,0));
    put(rk, mesh(cyl(.06,.06,.03,14), 0x8fc7ff, 0,.5,.12)).rotation.x = Math.PI/2;
    for(let k=0;k<3;k++){ const f = mesh(rbox(.03,.16,.14,.01), 0xff6b6b, Math.cos(k*2.094)*.13,.25,Math.sin(k*2.094)*.13); f.rotation.y = -k*2.094; rk.add(f); } g.add(rk);
    for(let i=0;i<6;i++) g.add(mesh(sph(.035,8,6), lampMat, -.9+i*.36,.62-Math.sin(i/5*Math.PI)*.1,.25));
    for(const x of [-.9,.9]) g.add(mesh(cyl(.012,.012,.62,6), 0x5b6170, x,.31,.25));
    g.add(mesh(cyl(.16,.16,.02,14), 0xffffff, -.2,.32,.6)); g.add(mesh(cyl(.015,.015,.3,6), 0x777777, -.2,.16,.6));
    person(g, -.5, .62, {role:'engineer', laptop:true, mood:'grin', rot:Math.PI/2}); person(g, .1, .62, {laptop:true, eth:'hakka', rot:-Math.PI/2, bun:true, mood:'smile'});
    person(g, .6, .7, {role:'finance', mood:'happy', walk:a => [.5+Math.sin(a)*.35, .8], speed:.35});
  },
  schools(g){ // 小校、共學空間、聯大國際學程
    building(g, -.5, -.45, .8, .42, .45, 0xfff0c9, {gable:0xf28b7d, door:0xa8714a, rows:1, cols:3});
    const u = new THREE.Group(); u.position.set(.55,0,-.35);
    u.add(mesh(rbox(.7,.7,.55,.06), 0xe9eef7, 0,.35,0)); for(let i=0;i<4;i++) u.add(mesh(cyl(.035,.035,.62,10), 0xffffff, -.24+i*.16,.31,.3));
    u.add(mesh(geo('dome', () => new THREE.SphereGeometry(.24,20,12,0,Math.PI*2,0,Math.PI/2)), 0x7fb3e8, 0,.7,0)); g.add(u);
    const cap = new THREE.Group(); cap.position.set(.75,0,.6); cap.add(mesh(cyl(.12,.16,.25,12), 0xdddddd, 0,.12,0));
    cap.add(mesh(cyl(.16,.16,.12,16), 0x2b2f3a, 0,.32,0)); cap.add(mesh(rbox(.48,.035,.48,.01), 0x2b2f3a, 0,.39,0)); cap.add(mesh(cyl(.01,.01,.18,4), PAL.gold, .2,.31,.2)); g.add(cap);
    person(g, .3, .4, {hat:'grad', eth:'newcomer', mood:'laugh', rot:-.5}); person(g, -.05, .1, {role:'teacher', mood:'smile', rot:.4});
    for(let i=0;i<3;i++) person(g, -.5, .45, {role:'student', seed:i, walk:ring(.35,.22,-.45,.45), speed:.6, t:i*2.1});
  },
  forest(g){ // 台3線森林療癒、苗東裂谷、海線低碳
    const path = []; for(let i=0;i<9;i++){ const x = -1.3+i*.32, z = Math.sin(i*.8)*.35; path.push([x,z]); g.add(mesh(rbox(.3,.02,.2,.06), 0xe0c99a, x,.012,z)); }
    for(const [x,z,s] of [[-1.0,-.55,1],[-.35,-.75,.95],[.3,-.6,1.05],[-.7,.65,.9],[.1,.7,1],[.75,.6,.85]]) tungTree(g, x, z, s);
    for(const [x,s] of [[.95,1],[1.25,.8]]){ const c = mesh(geo('cliff', () => new THREE.DodecahedronGeometry(.4,0)), 0xb8a48c, x,.32*s,-.15); c.scale.set(.5*s,1.4*s,.9*s); g.add(c); }
    const walk = a => { const k = (Math.sin(a)+1)/2*(path.length-1), i = Math.floor(k), f = k-i, p0 = path[i], p1 = path[Math.min(i+1,path.length-1)]; return [p0[0]+(p1[0]-p0[0])*f, p0[1]+(p1[1]-p0[1])*f]; };
    person(g, 0, 0, {walk, speed:.2, eth:'indigenous', mood:'laugh'}); person(g, 0, 0, {walk, speed:.2, t:.3, role:'pt', mood:'happy'});
    const bk = bike(g, 0, 0, 0x5cc483); bk.userData.dyn = true; movers.push({obj:bk, path:walk, speed:.3, t:2});
  },
  futurefund(g){ // 未來基金、兒少專戶
    pig(g, -.55, -.3, .8, .5); droppingCoin(g, -.55, .95, -.3);
    const t = new THREE.Group(); t.position.set(.55,0,-.2);
    t.add(mesh(cyl(.07,.1,.7,10), 0xa8714a, 0,.35,0)); t.add(mesh(sph(.42,18,14), 0x7ccf6a, 0,.9,0));
    const cm = mat(PAL.gold,{metalness:.35,roughness:.35}); const rr = rng(77);
    for(let i=0;i<14;i++){ const v = new THREE.Vector3(rr()-.5, rr()*.8, rr()-.5).normalize().multiplyScalar(.42); const c = mesh(cyl(.06,.06,.015,12), cm, v.x,.9+v.y,v.z); c.rotation.set(rr()*3, rr()*3, 0); t.add(c); }
    g.add(t); g.add(mesh(cyl(.3,.34,.08,16), 0xc0855a, .55,.04,-.2));
    person(g, 0, .6, {role:'student', mood:'laugh', walk:ring(.3,.15,0,.65), speed:.5}); person(g, .3, .7, {role:'finance', mood:'smile', rot:-.4});
    coinStack(g, -1.0, .55, 3);
  },
  urbanrural(g){ // 先治排水、鐵路分歧、城鄉均衡
    g.add(mesh(rbox(2.6,.02,.22,.05), 0x6fc3e0, 0,.01,.9));
    g.add(mesh(cyl(.12,.16,.3,6), 0x8a8f99, 0,.15,-.1)); const pivot = new THREE.Group(); pivot.position.set(0,.32,-.1); pivot.userData.dyn = true;
    pivot.add(mesh(rbox(1.8,.06,.22,.02), PAL.wood, 0,0,0));
    const hs = new THREE.Group(); hs.position.set(-.7,.03,0); building(hs, -.08, 0, .26, .5, .22, 0xe9eef7, {rows:2, cols:2, roof:0x7fb3e8}); building(hs, .16, 0, .2, .32, .2, 0xfff5e4, {gable:0xf28b7d, rows:1, cols:1}); pivot.add(hs);
    const fm = new THREE.Group(); fm.position.set(.7,.03,0); fm.add(mesh(rbox(.42,.04,.2,.02), 0x9ed86a, 0,0,0));
    for(let i=0;i<4;i++) fm.add(mesh(cone(.03,.14,5), 0x5fbf6a, -.15+i*.1,.08,0)); puffTree(fm, .12, 0, .5); pivot.add(fm); g.add(pivot);
    tickers.push((dt,t) => pivot.rotation.z = Math.sin(t*.9)*.08);
    for(const x of [-1.0,-.6]) house(g, x, .3, {s:.75, roof:PAL.roof[x<-.8?1:4]});
    for(let i=0;i<4;i++) g.add(mesh(rbox(.18,.04,.36,.02), 0x9ed86a, .45+i*.22,.02,.35));
    person(g, -.2, .5, {role:'plumber', mood:'grin', walk:a => [Math.sin(a)*.5, .55], speed:.3});
  },
  foodsafety(g){ // 中彰投苗食安聯防、稽查
    stall(g, -.45, -.35, .2); stall(g, .45, -.5, -.2, 0x8fc7ff);
    building(g, .6, .45, .55, .45, .42, 0xffffff, {roof:0x5cc483, rows:1, cols:2, rot:-.5});
    const fl = new THREE.Group(); fl.position.set(.6,.62,.45); fl.add(mesh(sph(.08,12,10), mat(0x9de0b8,{transparent:true,opacity:.8}), 0,0,0)); fl.add(mesh(cyl(.025,.03,.1,8), mat(0xd9f2ff,{transparent:true,opacity:.8}), 0,.1,0)); g.add(fl);
    shield(g, -.85, .75, .4, 0x5cc483, .9);
    [0xff9aa2,0xffd36e,0x8fc7ff,0x9de0b8].forEach((c,i) => flag(g, -.3+i*.18, .5, .9, c, .16, .1));
    person(g, -.2, .3, {role:'inspector', magnifier:true, mood:'o', walk:a => [-.2+Math.sin(a)*.35, .25], speed:.25}); person(g, -.55, .05, {role:'housewife', eth:'minnan', mood:'smile', rot:.3});
  },

  /* 鍾東錦 */
  parkexpand(g){ // 擴編園區、育成、零售市場
    building(g, -.45, -.4, .8, .6, .6, 0xe7f1fb, {roof:0x5b6170, rows:2, cols:4}); building(g, .2, -.6, .5, .9, .4, 0xcfe6ff, {roof:0x8fd8b9, rows:3, cols:2});
    g.add(mesh(rbox(.6,.18,.45,.04), 0xd8d2c4, .55,.09,.25)); for(const x of [.32,.55,.78]) for(const z of [.08,.42]) g.add(mesh(cyl(.012,.012,.42,6), 0xffc83d, x,.3,z));
    const mast = new THREE.Group(); mast.position.set(.95,0,-.2);
    mast.add(mesh(rbox(.1,1.8,.1,.02), 0xffc83d, 0,.9,0)); for(let i=0;i<6;i++) mast.add(mesh(rbox(.12,.02,.12,.005), 0xe0a020, 0,.2+i*.28,0));
    const jib = new THREE.Group(); jib.position.y = 1.82; jib.userData.dyn = true; jib.add(mesh(rbox(1.3,.07,.07,.02), 0xffc83d, -.3,0,0)); jib.add(mesh(rbox(.2,.14,.14,.03), 0x5b6170, .4,0,0));
    jib.add(mesh(cyl(.006,.006,.6,4), 0x333333, -.75,-.3,0)); jib.add(mesh(rbox(.12,.08,.12,.02), 0xff8a3d, -.75,-.62,0)); mast.add(jib); g.add(mast); tickers.push(dt => jib.rotation.y += dt*.3);
    stall(g, -.6, .55, .3, 0xffd36e); cones(g, [[.2,.7],[.4,.8]]);
    person(g, -.1, .45, {role:'worker', mood:'grin', walk:a => [Math.sin(a)*.4, .5], speed:.3}); person(g, .25, .15, {role:'engineer', hat:'helmet', mood:'smile', rot:-.4});
  },
  greenwater(g){ // 氫能、地熱、天花湖水庫、土資場
    const lake = mesh(disc(.62), mat(0x5fc7e0,{roughness:.15}), -.45,.03,-.25); g.add(lake);
    g.add(mesh(rbox(.16,.22,1.0,.04), 0xc9c4bb, .2,.11,-.3));
    const t = new THREE.Group(); t.position.set(.6,0,-.65); t.add(mesh(cyl(.035,.07,1.5,12), 0xffffff, 0,.75,0)); t.add(mesh(rbox(.12,.12,.24,.04), 0xffffff, 0,1.52,0));
    const hub = new THREE.Group(); hub.position.set(0,1.52,.14); hub.userData.dyn = true; hub.add(mesh(sph(.06,12,10), 0x6f93e8));
    for(let k=0;k<3;k++){ const pv = new THREE.Group(); pv.rotation.z = k*2.094; pv.add(mesh(rbox(.07,.6,.025,.03), 0xffffff, 0,.32,0)); hub.add(pv); } t.add(hub); g.add(t); tickers.push(dt => hub.rotation.z += dt*2.4);
    const h2 = new THREE.Group(); h2.position.set(.7,0,.3); const tank = mesh(capsule(.2,.5), 0xffffff, 0,.32,0); tank.rotation.z = Math.PI/2; h2.add(tank);
    put(h2, mesh(cyl(.205,.205,.1,18), 0x5b8def, 0,.32,0)).rotation.z = Math.PI/2; for(const x of [-.25,.25]) h2.add(mesh(rbox(.06,.14,.3,.02), 0x8a8f99, x,.07,0)); g.add(h2);
    rock(g, -.3, .65, 1.6, 0x9a8f86); smoke(g, -.3, .2, .65, .8, .75); person(g, .3, .55, {role:'plumber', mood:'smile', rot:-.5});
    g.add(mesh(cone(.3,.3,8), 0xb08860, -.95,.15,.55)); g.add(mesh(cone(.22,.22,8), 0xa07850, -.75,.11,.8));
  },
  expressway(g){ // 台61立體化、交流道、歸鄉之路
    g.add(mesh(rbox(1.0,.03,3.4,.02), 0xf2d79c, .95,.015,0)); for(let i=0;i<3;i++) g.add(mesh(rbox(.06,.02,3.2,.02), 0xffffff, 1.35+i*.0,.03,0));
    g.add(mesh(rbox(.3,.02,3.3,.02), 0x6fd0e0, 1.55,.02,0));
    const deck = new THREE.Group(); deck.position.set(.2,.55,0); deck.add(mesh(rbox(.62,.08,3.4,.03), 0x9aa0aa, 0,0,0));
    for(const s of [-1,1]) deck.add(mesh(rbox(.04,.08,3.4,.01), 0xffffff, s*.3,.07,0)); for(let i=0;i<9;i++) deck.add(mesh(rbox(.03,.01,.16,.004), 0xffffff, 0,.045,-1.6+i*.4));
    for(const z of [-1.2,-.4,.4,1.2]) deck.add(mesh(cyl(.07,.08,.55,10), 0xd8d2c4, 0,-.3,z)); g.add(deck);
    const ramp = mesh(rbox(.4,.06,1.3,.02), 0x9aa0aa, -.45,.27,.55); ramp.rotation.x = .4; ramp.rotation.y = .5; g.add(ramp);
    const lane = (x, dir) => a => { const k = ((a % 1) + 1) % 1; return [x, dir*(-1.6 + k*3.2)]; };
    [[.06,1,0xf28b7d,0],[.06,1,0xffd36e,.5],[.34,-1,0x7fb3e8,.2],[.34,-1,0xffffff,.7]].forEach(([x,dir,c,ph]) => {
      const v = vehicle(g, {col:c, path:lane(x,dir), speed:.12, t:ph, y:.6});
      tickers.push(() => { const z = Math.abs(v.position.z); v.scale.setScalar(Math.max(0, Math.min(1, (1.6 - z)*5))); }); });
    house(g, -.8, -.6, {roof:PAL.roof[2], s:.9});
    person(g, -.8, .1, {suitcase:true, eth:'hakka', mood:'laugh', walk:a => [-.8+Math.sin(a)*.25, .0], speed:.3}); person(g, -.8, .1, {role:'student', mood:'happy', walk:a => [-.8+Math.sin(a-.3)*.25, .0], speed:.3}); person(g, -.55, -.25, {elder:true, eth:'hakka', bun:true, mood:'happy', rot:2.6});
  },
  coldchain(g){ // 苑裡農業冷鏈物流中心
    building(g, -.35, -.45, 1.0, .58, .62, 0xffffff, {roof:0x5b8def, rows:1, cols:2});
    const sf = new THREE.Group(); sf.position.set(-.35,.42,-.13); put(sf, mesh(cyl(.17,.17,.03,20), 0x5b8def, 0,0,0)).rotation.x = Math.PI/2;
    for(let k=0;k<3;k++){ const b = mesh(rbox(.24,.03,.02,.01), 0xffffff, 0,0,.02); b.rotation.z = k*Math.PI/3; sf.add(b); } g.add(sf);
    vehicle(g, {col:0xffffff, stripe:0x8fc7ff, len:.75, h:.32, cab:.25, cabZ:.28, x:.75, z:-.35, rot:Math.PI*.9});
    g.add(mesh(rbox(1.3,.03,.75,.04), 0x9fd8c8, -.1,.02,.6));
    for(let i=0;i<6;i++) for(let j=0;j<3;j++) g.add(mesh(cone(.03,.15,5), 0x5fbf6a, -.65+i*.22,.09,.4+j*.2));
    [[.85,.35,0xff5a5a],[.85,.6,0xffa94d],[1.05,.48,0x7ed49b]].forEach(([x,z,c]) => { g.add(mesh(rbox(.2,.12,.16,.02), PAL.wood, x,.06,z)); for(let k=0;k<3;k++) g.add(mesh(sph(.04,8,6), c, x-.06+k*.06,.14,z)); });
    person(g, .2, .2, {role:'farmer', mood:'laugh', walk:a => [.2+Math.sin(a)*.3, .2], speed:.3}); person(g, .55, -.05, {role:'driver', mood:'smile', rot:-2});
  },
  hospital(g){ // 醫院、白沙屯媽祖醫院、長照養生村
    building(g, -.35, -.4, 1.0, .75, .6, 0xffffff, {roof:0x8fd8b9, rows:2, cols:5});
    g.add(mesh(rbox(.1,.32,.04,.02), 0xff6b6b, -.35,.98,-.1)); g.add(mesh(rbox(.32,.1,.04,.02), 0xff6b6b, -.35,.98,-.1));
    const tp = new THREE.Group(); tp.position.set(.7,0,-.45);
    tp.add(mesh(rbox(.55,.4,.4,.04), 0xd9534f, 0,.2,0)); const r1 = mesh(prism(.58,.2,.66), 0xf2a03d, 0,.4,0); r1.rotation.y = Math.PI/2; tp.add(r1);
    for(const s of [-1,1]){ const ridge = mesh(capsule(.03,.08), PAL.gold, s*.33,.6,0); ridge.rotation.z = s*.9; tp.add(ridge); } tp.add(mesh(sph(.05,10,8), PAL.gold, 0,.62,0));
    tp.add(mesh(rbox(.16,.24,.03,.02), 0xffd36e, 0,.12,.205)); g.add(tp);
    vehicle(g, {col:0xffffff, stripe:0xff6b6b, len:.6, h:.28, cab:.3, cabZ:.15, x:.1, z:.35, rot:.3, light:0xff4a4a});
    house(g, -.8, .55, {s:.7, roof:PAL.roof[3]}); house(g, .85, .55, {s:.7, roof:PAL.roof[2], rot:-.4});
    person(g, -.3, .75, {elder:true, eth:'minnan', mood:'happy', walk:ring(.35,.12,-.2,.8), speed:.15}); person(g, -.3, .75, {role:'pt', mood:'smile', walk:ring(.35,.12,-.2,.8), speed:.15, t:-.5});
    person(g, -.75, .0, {role:'doctor', mood:'smile', rot:.5}); person(g, -.45, .05, {role:'nurse', bun:true, mood:'happy', rot:.2});
  },
  ethnic(g){ // 客家交流中心、部落住宅、新住民
    const hk = new THREE.Group(); hk.position.set(-.35,0,-.35);
    hk.add(mesh(rbox(1.0,.36,.32,.04), 0xc8644a, 0,.18,-.3)); const r0 = mesh(prism(.42,.2,1.08), 0x6b6f78, 0,.36,-.3); r0.rotation.y = Math.PI/2; hk.add(r0);
    for(const s of [-1,1]){ hk.add(mesh(rbox(.28,.3,.55,.04), 0xc8644a, s*.38,.15,.12)); const rw = mesh(prism(.36,.18,.6), 0x6b6f78, s*.38,.3,.12); hk.add(rw); }
    hk.add(mesh(rbox(.5,.02,.5,.02), 0xe0d8cc, 0,.01,.1)); g.add(hk);
    const cloth = mesh(rbox(.5,.32,.02,.02), 0xe8475f, .2,.75,-.85); g.add(cloth); g.add(mesh(cyl(.012,.012,.92,6), PAL.wood, -.06,.46,-.85)); g.add(mesh(cyl(.012,.012,.92,6), PAL.wood, .46,.46,-.85));
    const rr = rng(31); for(let i=0;i<10;i++) g.add(mesh(sph(.025,8,6), rr()<.5?0xffc0d0:0x8fd06a, .0+rr()*.4,.62+rr()*.26,-.835));
    const hut = new THREE.Group(); hut.position.set(.75,0,.0); hut.add(mesh(cyl(.3,.32,.38,14), 0xc9a46a, 0,.19,0)); hut.add(mesh(cone(.42,.42,14), 0xb08850, 0,.58,0));
    hut.add(mesh(rbox(.14,.22,.03,.02), 0x6a4a30, 0,.11,.31)); for(let i=0;i<4;i++) hut.add(mesh(rbox(.02,.38,.02,.005), 0xe8475f, Math.cos(i*1.57)*.32,.19,Math.sin(i*1.57)*.32)); g.add(hut);
    for(let i=0;i<7;i++){ const x = -.9+i*.3, y = .55-Math.sin(i/6*Math.PI)*.12; put(g, mesh(cone(.05,.08,3), [0xff9aa2,0xffd36e,0x8fc7ff,0x9de0b8][i%4], x,y,.95)).rotation.x = Math.PI; }
    for(const x of [-1.0,1.0]) g.add(mesh(cyl(.012,.012,.6,6), 0x5b6170, x,.3,.95));
    person(g, -.2, .6, {eth:'indigenous', mood:'laugh', walk:ring(.3,.12,-.1,.6), speed:.25}); person(g, -.2, .6, {eth:'indigenous', s:.7, mood:'happy', walk:ring(.3,.12,-.1,.6), speed:.25, t:-.6}); person(g, -.35, .05, {eth:'hakka', bun:true, mood:'smile', rot:.3}); person(g, .6, .55, {bun:true, eth:'newcomer', mood:'happy', rot:-.4}); person(g, .3, .75, {elder:true, eth:'minnan', bun:false, mood:'laugh', rot:-.8});
  },
  sciencehigh(g){ // 竹南科學實驗高中、縣立總圖
    building(g, -.4, -.35, .9, .5, .5, 0xfff0c9, {roof:0xf28b7d, rows:1, cols:4});
    const ob = new THREE.Group(); ob.position.set(-.4,.5,-.35); ob.add(mesh(cyl(.22,.22,.12,18), 0xffffff, 0,.06,0));
    ob.add(mesh(geo('dome2', () => new THREE.SphereGeometry(.22,20,12,0,Math.PI*2,0,Math.PI/2)), 0xdfe6ee, 0,.12,0)); ob.add(mesh(rbox(.06,.18,.2,.01), 0x3b3f4a, 0,.25,.1));
    const tel = mesh(cyl(.035,.045,.32,10), 0x5b6170, 0,.38,.16); tel.rotation.x = .7; ob.add(tel); g.add(ob);
    const cols = [0xf28b7d,0x8fc7ff,0xffd36e,0x9de0b8,0xc7a8ff]; for(let i=0;i<5;i++) book(g, .65+(i%2)*.03, .05+i*.09, -.4, cols[i], .5-i*.03, .08, .36);
    const open = new THREE.Group(); open.position.set(.6,0,.45); for(const s of [-1,1]){ const pg = mesh(rbox(.24,.02,.32,.01), 0xfffaf0, s*.12,.22,0); pg.rotation.z = -s*.25; open.add(pg); }
    open.add(mesh(rbox(.1,.2,.1,.02), 0xdddddd, 0,.1,0)); g.add(open);
    person(g, -.3, .5, {role:'student', mood:'o', walk:a => [-.3+Math.sin(a)*.4, .5], speed:.3}); person(g, .2, .7, {role:'teacher', rot:Math.PI*.8, mood:'smile'}); person(g, .0, .25, {role:'student', mood:'laugh', rot:2.5});
  },
  mountainsea(g){ // 明湖水岸、白沙屯–好望角、舊山線鐵道自行車、沙雕
    const m = mesh(sph(.75,22,16), 0x6cbf5f, -.75,.0,-.45); m.scale.set(1,.85,.9); g.add(m);
    tungTree(g, -.95, -.55, .7).position.y = .45; tungTree(g, -.5, -.3, .6).position.y = .45;
    const br = new THREE.Group(); br.position.set(-.55,0,.55); br.rotation.y = .3;
    for(let i=0;i<3;i++){ const x = -.4+i*.4; br.add(mesh(rbox(.13,.55,.16,.03), PAL.brick, x,.27,0)); if(i<2 && i!==1){ br.add(mesh(torus(.14,.05,Math.PI), PAL.brick, x+.2,.44,0)); br.add(mesh(rbox(.4,.07,.16,.02), PAL.brick, x+.2,.62,0)); } }
    g.add(br);
    g.add(mesh(rbox(1.1,.03,2.6,.05), 0xf2d79c, .85,.015,.0)); g.add(mesh(rbox(.3,.02,2.4,.02), 0x6fd0e0, 1.45,.02,0));
    const sc = new THREE.Group(); sc.position.set(.75,0,-.35); sc.add(mesh(cyl(.32,.36,.18,14), 0xe8c88a, 0,.09,0)); sc.add(mesh(sph(.22,16,12), 0xe8c88a, 0,.36,0));
    for(const s of [-1,1]){ const e = mesh(cone(.07,.12,8), 0xe8c88a, s*.12,.56,0); e.rotation.z = -s*.3; sc.add(e); sc.add(mesh(sph(.02,8,6), 0x8a6a4a, s*.07,.38,.2)); } g.add(sc);
    g.add(mesh(cyl(.015,.015,.6,6), 0xdddddd, .9,.3,.55)); g.add(mesh(cone(.32,.16,12), 0xff8a8a, .9,.62,.55)); g.add(mesh(rbox(.3,.01,.5,.01), 0x8fc7ff, .7,.02,.6));
    g.add(mesh(rbox(.06,.02,1.0,.01), 0x8c9099, -.1,.02,.0)); g.add(mesh(rbox(.06,.02,1.0,.01), 0x8c9099, .1,.02,.0));
    const rb = new THREE.Group(); rb.userData.dyn = true; rb.add(mesh(rbox(.32,.06,.28,.02), 0x5cc483, 0,.1,0)); person(rb, -.07, 0, {s:.7, rot:0, mood:'laugh'}).position.y = .05; person(rb, .07, 0, {s:.7, rot:0, bun:true, mood:'happy'}).position.y = .05;
    g.add(rb); movers.push({obj:rb, path:a => [0, Math.sin(a)*.35], speed:.6, t:0, noRot:true});
  },
  debt(g){ // 減債、稅收、招商
    [[.95,0xf28b7d],[.7,0xffb36b],[.45,0x7ed49b]].forEach(([h,c],i) => g.add(mesh(rbox(.26,h,.26,.05), c, -.75+i*.34,h/2,-.45)));
    const ar = new THREE.Group(); ar.position.set(-.4,.95,-.45); ar.rotation.z = -.55; ar.add(mesh(rbox(.7,.06,.06,.02), PAL.gold, 0,0,0)); const hd = mesh(cone(.1,.16,12), PAL.gold, .4,0,0); hd.rotation.z = -Math.PI/2; ar.add(hd); g.add(ar);
    building(g, .65, -.4, .5, 1.2, .45, 0xcfe6ff, {roof:0x8fd8b9, rows:4, cols:2});
    pig(g, -.1, .55, .6, -.3); coinStack(g, .55, .45, 5); coinStack(g, .85, .65, 3);
    person(g, .3, .9, {role:'finance', mood:'grin', walk:a => [.3+Math.sin(a)*.4, .95], speed:.3}); person(g, .95, .05, {role:'finance', bun:true, mood:'smile', rot:-1.2});
  },
  eldertaxi(g){ // 敬老卡擴及計程車、農會、關懷據點
    roadRing(g, 1.05, 1.35);
    vehicle(g, {col:0xffd23f, roofSign:0xffffff, path:ring(1.2), speed:.5, t:0}); vehicle(g, {col:0xffd23f, roofSign:0xffffff, path:ring(1.2), speed:.5, t:3});
    const shop = new THREE.Group(); shop.position.set(-.3,0,-.25); shop.add(mesh(rbox(.75,.45,.45,.05), 0xfff5e4, 0,.22,0)); shop.add(mesh(rbox(.5,.12,.03,.02), 0x5cc483, 0,.5,.23));
    shop.add(mesh(rbox(.3,.22,.03,.02), winMat, 0,.15,.235)); g.add(shop);
    for(let i=0;i<3;i++) g.add(mesh(rbox(.2,.14,.14,.05), 0xe8d8b0, .3+(i%2)*.1,.07+Math.floor(i/2)*.13,-.35));
    g.add(mesh(cyl(.22,.22,.04,18), 0xffffff, .3,.3,.35)); g.add(mesh(cyl(.03,.03,.3,6), 0x888888, .3,.15,.35));
    for(let k=0;k<3;k++){ const a = k*2.094+.5; person(g, .3+Math.cos(a)*.38, .35+Math.sin(a)*.38, {elder:true, eth:['hakka','minnan','indigenous'][k], mood:['laugh','happy','grin'][k], rot:-a-Math.PI/2}); }
    person(g, .75, .7, {role:'pt', mood:'smile', rot:-2.2});
  },
  lunch(g){ // 免費營養午餐、第二胎、托嬰、新校舍
    building(g, -.35, -.6, 1.1, .5, .4, 0xfff0c9, {gable:0xf28b7d, rows:1, cols:5});
    for(const z of [-.05,.4]){ g.add(mesh(rbox(1.0,.04,.26,.02), 0xfff5e4, -.2,.22,z)); for(const x of [-.6,.2]) g.add(mesh(rbox(.04,.22,.2,.01), 0xbfb8aa, x,.11,z));
      for(let i=0;i<3;i++){ const x = -.55+i*.33; g.add(mesh(rbox(.18,.02,.13,.01), 0x8fc7ff, x,.25,z)); [0xffe066,0x7ed49b,0xff8a8a].forEach((c,k) => g.add(mesh(sph(.025,8,6), c, x-.05+k*.05,.27,z)));
        const kid = person(g, x, z-.22, {role:'student', s:.62, rot:0, seed:i+z*10}); } }
    person(g, .65, .1, {role:'chef', pot:true, mood:'laugh', rot:-1.2}); person(g, .65, -.3, {role:'teacher', mood:'smile', rot:-1.4});
    stroller(g, ring(.4,.15,.4,.85), 0, .3, 0xffd36e);
  },
  youbike(g){ // YouBike、人行道、苗栗幣、2027台灣燈會
    g.add(mesh(rbox(.9,.03,.3,.02), 0xbfb8aa, -.4,.015,-.75));
    for(let i=0;i<4;i++) bike(g, -.75+i*.22, -.72, 0xffa630, Math.PI/2);
    g.add(mesh(rbox(.2,.5,.16,.04), 0xffa630, .15,.25,-.72)); g.add(mesh(rbox(.14,.12,.02,.02), winMat, .15,.38,-.63));
    const lan = new THREE.Group(); lan.position.set(-.45,0,.25);
    lan.add(mesh(cyl(.25,.3,.1,16), 0xd9534f, 0,.05,0)); const body = mesh(sph(.38,22,16), lanternMat, 0,.48,0); body.scale.set(1,.95,.9); lan.add(body);
    for(const s of [-1,1]){ const e = mesh(cone(.1,.18,10), lanternMat, s*.2,.85,0); e.rotation.z = -s*.35; lan.add(e); lan.add(mesh(sph(.035,8,6), 0x2b2b2b, s*.12,.55,.33)); const bl = mesh(sph(.05,8,6), 0xff7f7f, s*.22,.45,.3); bl.scale.z = .4; lan.add(bl); }
    lan.add(mesh(rbox(.3,.03,.03,.01), PAL.gold, 0,.25,.32)); g.add(lan);
    const ph = new THREE.Group(); ph.position.set(.75,0,.2); ph.rotation.y = -.5; ph.add(mesh(rbox(.36,.62,.06,.06), 0x2b2f3a, 0,.38,0)); ph.add(mesh(rbox(.3,.52,.01,.04), 0x8fd3ff, 0,.38,.032));
    const pc = mesh(cyl(.09,.09,.02,18), mat(PAL.gold,{metalness:.35,roughness:.35}), 0,.4,.05); pc.rotation.x = Math.PI/2; ph.add(pc); g.add(ph);
    const rider = new THREE.Group(); rider.userData.dyn = true; bike(rider, 0, 0, 0xffa630); const pr = person(rider, 0, -.02, {s:.85, mood:'laugh'}); pr.position.y = .1; person(g, -.9, -.35, {role:'cleaner', mood:'happy', rot:.5}); g.add(rider);
    movers.push({obj:rider, path:ring(1.2,.85), speed:.35, t:1});
  },
};

/* ---------- baking static meshes into a few draw calls ---------- */
const vcMat = new THREE.MeshStandardMaterial({vertexColors:true, roughness:.72});
const KEEP_MATS = new Set([winMat, lampMat, lanternMat, glassMat]);
const isPlain = m => m.isMeshStandardMaterial && m !== vcMat && !KEEP_MATS.has(m) && !m.transparent && !m.map && m.metalness === 0 && m.side !== THREE.DoubleSide && (m.emissiveIntensity === 0 || m.emissive.getHex() === 0);
function bake(root){
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), buckets = new Map(), remove = [];
  (function walk(o){ for(const c of [...o.children]){ if(c.userData.dyn || c.userData.keep) continue;
    if(c.isMesh){ let g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
      for(const k of Object.keys(g.attributes)) if(!['position','normal','uv'].includes(k)) g.deleteAttribute(k);
      if(!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2), 2));
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld)); g.clearGroups();
      let key = c.material;
      if(isPlain(c.material)){ key = vcMat; const n = g.attributes.position.count, col = new Float32Array(n*3), cc = c.material.color;
        for(let i=0;i<n;i++){ col[i*3] = cc.r; col[i*3+1] = cc.g; col[i*3+2] = cc.b; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
      (buckets.get(key) || buckets.set(key, []).get(key)).push(g); remove.push(c); }
    walk(c); } })(root);
  remove.forEach(c => c.parent && c.parent.remove(c));
  for(const [m, arr] of buckets){ const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(arr); if(!merged) continue;
    const ms = new THREE.Mesh(merged, m); ms.castShadow = ms.receiveShadow = true; root.add(ms); }
}

/* ---------- hex terrain ---------- */
const HEX = 2.05;
function axial(q,r){ return [HEX*Math.sqrt(3)*(q + r/2), HEX*1.5*r]; }
function ringCoords(n){
  const out=[[0,0]]; const dirs=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
  for(let k=1; out.length<n; k++){ let q=-k, r=k; for(let d=0; d<6; d++) for(let s=0; s<k; s++){ out.push([q,r]); q+=dirs[d][0]; r+=dirs[d][1]; } }
  return out;
}
function hexShape(R, rr){
  const V = []; for(let k=0;k<6;k++){ const a = Math.PI/6 + k*Math.PI/3; V.push(new THREE.Vector2(Math.cos(a)*R, Math.sin(a)*R)); }
  const t = rr/R, P = (i,j) => V[i].clone().lerp(V[j], t), s = new THREE.Shape(), st = P(0,1); s.moveTo(st.x, st.y);
  for(let i=0;i<6;i++){ const n = (i+1)%6, pin = P(n,i), pout = P(n,(i+2)%6); s.lineTo(pin.x,pin.y); s.quadraticCurveTo(V[n].x,V[n].y,pout.x,pout.y); }
  return s;
}
function slab(R, h, b=.12){ return geo(`h${R},${h},${b}`, () => { const g = new THREE.ExtrudeGeometry(hexShape(R-b, .5), {depth:h, bevelEnabled:true, bevelThickness:b, bevelSize:b, bevelSegments:3, curveSegments:6});
  g.rotateX(-Math.PI/2); g.translate(0,b,0); return g; }); }
const foamMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.75, depthWrite:false});
function tileBody(grp, h, ribbon, grass){
  const parts = [mesh(slab(HEX-.2, h, .12), PAL.dirt, 0,0,0)];
  if(ribbon != null) parts.push(mesh(slab(HEX-.03, .05, .05), ribbon, 0,h-.05,0));
  parts.push(mesh(slab(HEX-.06, .1, .1), grass, 0,h+.06,0));
  parts.forEach(p => grp.add(p)); return {parts, top:h+.36};
}
function scatter(g, r, n, rmin, rmax, fn){ for(let i=0;i<n;i++){ const a = r()*Math.PI*2, d = rmin + r()*(rmax-rmin); fn(Math.cos(a)*d, Math.sin(a)*d, i); } }

/* plan cells first so the islands and boat lanes can be spaced from the real coastline */
function planIsland(ci){
  const n = DATA.candidates[ci].themes.length, coords = ringCoords(Math.max(n,7)), r = rng(ci*99+3);
  const used = new Set(coords.slice(0,n).map(c => c.join(','))), fillers = [];
  for(const [q,rr] of coords.slice(0,n)) for(const [dq,dr] of [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]]){
    const k = (q+dq)+','+(rr+dr); if(!used.has(k) && r() < .6){ used.add(k); fillers.push([q+dq, rr+dr]); } }
  const cells = [...coords.slice(0,n), ...fillers].map(c => axial(...c));
  const R = Math.max(...cells.map(([x,z]) => Math.hypot(x,z))) + HEX + .4;
  return {coords, fillers, cells, R, r};
}
const islands = [], tiles = [], specialHits = [];
function buildIsland(ci, plan, cx){
  const cand = DATA.candidates[ci], key = KEYS[ci], {coords, fillers, cells, R, r} = plan;
  const g = new THREE.Group(); g.position.set(cx,0,0); scene.add(g);
  const statics = new THREE.Group(); g.add(statics);
  for(const [x,z] of cells){
    statics.add(mesh(slab(HEX+.3, .25, .15), PAL.sand, x,-.25,z));
    const f = new THREE.Mesh(geo('foam', () => { const rg = new THREE.RingGeometry(HEX+.42, HEX+.75, 6, 1, Math.PI/6); rg.rotateX(-Math.PI/2); return rg; }), foamMat); f.position.set(x,.02,z); g.add(f);
  }
  const lag = new THREE.Mesh(geo(`lagoon${R|0}`, () => { const c = new THREE.CircleGeometry(R+2.5, 48); c.rotateX(-Math.PI/2); return c; }), shallowMat); lag.position.y = -.02; g.add(lag);
  // open land: every island gets the same Miaoli specialties, in its own order
  const order = SPECIAL.map((s,i) => [s, ((i*7 + ci*5) % SPECIAL.length)]).sort((a,b) => a[1]-b[1]).map(x => x[0]);
  const byZ = fillers.map((c,i) => [axial(...c), i]).sort((a,b) => a[0][1]-b[0][1]);
  const flagIdx = byZ[0]?.[1], lightIdx = byZ.at(-1)?.[1];
  let si = 0; const net = [];
  fillers.forEach(([q,rr], fi) => { const [x,z] = axial(q,rr); const fg = new THREE.Group(); fg.position.set(x,.05,z); statics.add(fg);
    const {parts, top} = tileBody(fg, .12 + r()*.12, null, PAL.grassFill); const deco = new THREE.Group(); deco.position.y = top; fg.add(deco);
    net.push({q, r:rr, x, z, y:.05+top, grp:deco});
    if(fi === flagIdx){ flag(deco, 0, 2.2, 0, ci===0 ? 0x5cc483 : 0x6f93e8, 1.0, .62); natureFill(deco, r, fi+ci); }
    else if(fi === lightIdx){ lighthouse(deco, .3, .2); natureFill(deco, r, fi+ci+1); }
    else if(si < order.length){ const [name, fn] = order[si++]; fn(deco, r, ci); const sg = SPECIAL_SIGN[name]?.[ci]; if(sg) postSign(deco, sg[3], sg[0], sg[1], sg[2], {bg:'#7a4a2a', fg:'#fff3d6', w:Math.max(.42, sg[3].length*.11)}); SPECIAL_EXTRA[name]?.[ci]?.(deco); computeObstacles(deco); parts.forEach(p => { p.userData.special = name; p.userData.keep = true; specialHits.push(p); }); }
    else natureFill(deco, r, fi+ci*2);
    if(!deco.userData.obs) computeObstacles(deco);
    stoneRing(deco);
  });
  const mid = byZ[Math.floor(byZ.length/2)]; if(mid){ const [[kx,kz]] = mid; const c = cat(g, kx+.9, kz-.6, ci ? -.6 : .6); c.position.y = .62; }
  cand.themes.forEach((th, i) => {
    const [q,rr] = coords[i], [x,z] = axial(q,rr);
    const grp = new THREE.Group(); grp.position.set(x,.1,z); g.add(grp);
    const h = i===0 ? .62 : .36 + r()*.22;
    const {parts, top} = tileBody(grp, h, PAL.ribbon[ci], PAL.grass);
    const props = new THREE.Group(); props.position.y = top; grp.add(props);
    (SCENES[th.scene] || (gg => { house(gg,-.4,-.2); house(gg,.4,.3,{roof:PAL.roof[1]}); }))(props, r);
    SIGNS[th.scene]?.(props);
    computeObstacles(props); stoneRing(props);
    net.push({q, r:rr, x, z, y:.1+top, grp:props});
    scatter(props, r, 5, 1.55, 1.72, (px,pz,k) => k%2 ? tuft(props,px,pz) : flower(props,px,pz, pick([0xff9aa2,0xffd36e,0xffffff], r)));
    bake(props);
    const ringM = new THREE.Mesh(geo('selring', () => { const rg = new THREE.RingGeometry(HEX-.05, HEX+.12, 6, 1, Math.PI/6); rg.rotateX(-Math.PI/2); return rg; }),
      new THREE.MeshBasicMaterial({color:0xffc94a, transparent:true, opacity:0, depthWrite:false}));
    ringM.position.y = top + .02; grp.add(ringM);
    const spark = new THREE.Group(); spark.position.y = top + 2.3; spark.visible = false; grp.add(spark);
    for(let k=0;k<5;k++){ const s = mesh(geo('star', () => new THREE.OctahedronGeometry(.12,0)), mat(PAL.gold,{emissive:PAL.gold, emissiveIntensity:.6}), Math.cos(k*1.256)*.9, Math.sin(k*2)*.15, Math.sin(k*1.256)*.9); s.castShadow = false; spark.add(s); }
    const t = {ci, key, ti:i, theme:th, grp, props, ring:ringM, spark, lift:0, v:0, world:new THREE.Vector3(cx+x, .1+top+1.55, z)};
    parts.forEach(p => p.userData.tile = t); t.hits = parts; tiles.push(t); net.at(-1).tile = t;
  });
  const adj = linkHexes(statics, net);
  bake(statics);
  net.forEach(c => c.obsI = (c.grp.userData.obs || []).map(([a,b,c2,d]) => [a+c.x, b+c.x, c2+c.z, d+c.z]));
  const nearCell = p => { let best = net[0], bd = 1e9; for(const c of net){ const d = (p.x-c.x)**2 + (p.z-c.z)**2; if(d < bd){ bd = d; best = c; } } return best; };
  const nearObs = p => nearCell(p).obsI, nearLift = p => nearCell(p).tile?.lift || 0;
  const TRAVEL = [{role:'teacher'},{role:'student'},{role:'housewife'},{role:'plumber'},{role:'engineer'},{role:'cleaner'},{role:'pt'},{role:'finance'},{eth:'indigenous'},{eth:'hakka', elder:true},{eth:'minnan'},{role:'doctor'}];
  for(let k=0;k<7;k++){ const o = TRAVEL[(k*2 + ci*5) % TRAVEL.length]; person(g, 0, 0, Object.assign({walk:travelerPath(net, adj, r, 5 + (k%4)*2), speed:.045 + (k%3)*.01, t:r()*6, seed:k+ci*20}, o)); movers.at(-1).obsAt = nearObs; movers.at(-1).liftAt = nearLift; }
  // water life keeps clear of the coast: lane radius = coastline + margin
  const lane = R + 2.3;
  sailboat(g, ci===0 ? 0x5cc483 : 0x6f93e8, ring(lane), ci*2, .045);
  sailboat(g, 0xffd36e, ring(lane), ci*2 + Math.PI, .045);
  for(let k=0;k<3;k++) duck(g, ring(.5 + k*.25, .5 + k*.25, 0, R + 4.3), k*2);
  // fireflies over the open land, visible at night
  const ffN = 50, ff = new THREE.InstancedMesh(sph(.05,6,4), fireflyMat, ffN), ffd = [];
  for(let i=0;i<ffN;i++){ const [x,z] = cells[Math.floor(r()*cells.length)]; ffd.push([x+(r()-.5)*3, .9+r()*1.2, z+(r()-.5)*3, r()*6.28]); }
  g.add(ff); tickers.push((dt,t) => { if(fireflyMat.opacity < .02) return; ffd.forEach(([x,y,z,p],i) => { _p.set(x+Math.sin(t*.7+p)*.4, y+Math.sin(t*1.3+p)*.25, z+Math.cos(t*.6+p)*.4); _s.setScalar(.6+.4*Math.sin(t*3+p)); _m4.compose(_p,_q,_s); ff.setMatrixAt(i,_m4); }); ff.instanceMatrix.needsUpdate = true; });
  islands.push({g, cx, R, cells});
}

/* ---------- sky, water, hills, clouds ---------- */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const fireflyMat = new THREE.MeshBasicMaterial({color:0xe9ff8a, transparent:true, opacity:0, depthWrite:false});
const skyU = {top:{value:new THREE.Color(0x8fd3ff)}, bottom:{value:new THREE.Color(0xfff1e0)}};
const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, fog:false, toneMapped:false, uniforms:skyU,
  vertexShader:'varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:'uniform vec3 top; uniform vec3 bottom; varying vec3 vW; void main(){ float h = clamp(vW.y*1.6+.05, 0., 1.); gl_FragColor = linearToOutputTexel(vec4(mix(bottom, top, pow(h,.7)),1.)); }'}));
scene.add(sky);
const starMat = new THREE.PointsMaterial({color:0xffffff, size:2.2, sizeAttenuation:false, fog:false, transparent:true, opacity:0});
const stars = new THREE.Points((() => { const gq = new THREE.BufferGeometry(), p = [], r = rng(42); for(let i=0;i<500;i++){ const a = r()*6.28, e = .15 + r()*1.3; p.push(Math.cos(a)*Math.cos(e)*600, Math.sin(e)*600, Math.sin(a)*Math.cos(e)*600); }
  gq.setAttribute('position', new THREE.Float32BufferAttribute(p,3)); return gq; })(), starMat);
scene.add(stars);
const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(16, 20, 14), new THREE.MeshBasicMaterial({color:0xfff1b0, fog:false, toneMapped:false}));
const moonDisc = new THREE.Mesh(new THREE.SphereGeometry(11, 20, 14), new THREE.MeshBasicMaterial({color:0xf3f1ff, fog:false, toneMapped:false}));
scene.add(sunDisc, moonDisc);

const waterU = {uTime:{value:0}};
const waterMat = new THREE.MeshStandardMaterial({color:0x4fb8d0, roughness:.18, metalness:.05});
waterMat.onBeforeCompile = sh => { sh.uniforms.uTime = waterU.uTime;
  sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(position.x*.35+uTime*1.1)*.06 + cos(position.y*.3+uTime*.8)*.06;'); };
const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 180, 180), waterMat);
water.rotation.x = -Math.PI/2; water.position.y = -.14; water.receiveShadow = true; scene.add(water);
const shallowMat = new THREE.MeshBasicMaterial({transparent:true, depthWrite:false, map:(() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const gr = x.createRadialGradient(64,64,10,64,64,64); gr.addColorStop(0,'rgba(150,232,228,.9)'); gr.addColorStop(.55,'rgba(130,225,225,.55)'); gr.addColorStop(1,'rgba(160,230,235,0)'); x.fillStyle = gr; x.fillRect(0,0,128,128);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })()});

const glints = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.18,0), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.85}), 80);
const glintData = []; { const r = rng(11); for(let i=0;i<80;i++){ glintData.push([(r()-.5)*110, (r()-.5)*70, r()*6.28, .6+r()*1.2]); } } scene.add(glints);
tickers.push((dt,t) => { glintData.forEach(([x,z,ph,sp], i) => { const k = Math.max(0, Math.sin(t*sp+ph)); const onLand = islands.some(s => Math.hypot(x-s.cx, z) < s.R+1); _p.set(x,.02,z); _s.set(onLand?0:k*1.2, .15*k, k*.5); _m4.compose(_p,_q,_s); glints.setMatrixAt(i,_m4); }); glints.instanceMatrix.needsUpdate = true; });

const hills = new THREE.Group(); scene.add(hills);
{ const r = rng(7);
  for(let i=0;i<50;i++){ const a = i/50*Math.PI*2 + r()*.05, d = 105 + r()*30, h = 9 + r()*18, w = 10 + r()*10;
    const hm = mesh(sph(1,24,14), PAL.tree[i%4], Math.cos(a)*d, -h*.15, Math.sin(a)*d*.8); hm.scale.set(w, h, w*.85); hm.castShadow = false; hills.add(hm);
    for(let k=0;k<3;k++){ const tx = hm.position.x + (r()-.5)*w, tz = hm.position.z + (r()-.5)*w*.6; const t = puffTree(hills, tx, tz, 3+r()*2); t.position.y = h*.45 + r()*2; } }
  bake(hills);
}
const clouds = []; { const r = rng(21); const cm = mat(0xffffff,{roughness:1, emissive:0xffffff, emissiveIntensity:.15});
  for(let i=0;i<12;i++){ const c = new THREE.Group(); const s = 1.4 + r()*1.6;
    [[0,0,0,1],[.9,-.1,.2,.75],[-.85,-.15,-.1,.7],[.3,.35,-.2,.65],[-.3,.3,.25,.6]].forEach(([x,y,z,k]) => { const m = mesh(sph(k*s,16,12), cm, x*s, y*s, z*s); m.receiveShadow = false; c.add(m); });
    c.position.set((r()-.5)*160, 17 + r()*8, (r()-.5)*80 - 10); c.scale.y = .75; scene.add(c); clouds.push({c, sp:.6 + r()*.8}); } }
/* butterflies over each island, egrets over the lake */
const wingGeo = (() => { const g = new THREE.CircleGeometry(.09, 8); g.translate(.08,0,0); return g; })();
function butterfly(col, cx, cz, rad, h, ph){
  const b = new THREE.Group(); const wm = new THREE.MeshStandardMaterial({color:col, side:THREE.DoubleSide, roughness:.6});
  const L = new THREE.Mesh(wingGeo, wm), Rw = new THREE.Mesh(wingGeo, wm); Rw.rotation.y = Math.PI; b.add(L, Rw); put(b, mesh(capsule(.012,.06), 0x333333)).rotation.x = Math.PI/2; scene.add(b);
  tickers.push((dt,t) => { const a = t*.5 + ph; b.position.set(cx + Math.cos(a)*rad + Math.sin(a*3)*.6, h + Math.sin(t*2+ph)*.35, cz + Math.sin(a*1.3)*rad*.7);
    b.rotation.y = -a; const f = Math.sin(t*18 + ph)*1.1; L.rotation.y = f; Rw.rotation.y = Math.PI - f; });
}
const egrets = [];
function egret(ph, rad, h){
  const e = new THREE.Group(); const body = mesh(sph(.22,12,10), 0xffffff); body.scale.set(.7,.6,1.5); e.add(body);
  const nk = mesh(capsule(.05,.25), 0xffffff, 0,.15,.32); nk.rotation.x = .9; e.add(nk); e.add(mesh(sph(.08,10,8), 0xffffff, 0,.27,.45)); const bk = mesh(cone(.025,.22,6), 0xffc83d, 0,.25,.6); bk.rotation.x = Math.PI/2; e.add(bk);
  const wm = mat(0xffffff, {side:THREE.DoubleSide}); const wg = new THREE.PlaneGeometry(.9,.35); wg.translate(.45,0,0); wg.rotateX(-Math.PI/2);
  const L = new THREE.Mesh(wg, wm), Rw = new THREE.Mesh(wg, wm); Rw.rotation.y = Math.PI; e.add(L, Rw); scene.add(e);
  tickers.push((dt,t) => { const a = t*.06 + ph; e.position.set(Math.cos(a)*rad, h + Math.sin(t*.7+ph)*.6, Math.sin(a)*rad*.55); e.rotation.y = -a; const f = Math.sin(t*3 + ph)*.5; L.rotation.z = f; Rw.rotation.z = -f; });
}
tickers.push(dt => clouds.forEach(o => { o.c.position.x += dt*o.sp; if(o.c.position.x > 90) o.c.position.x = -90; }));
tickers.push((dt,t) => { waterU.uTime.value = t; foamMat.opacity = .55 + Math.sin(t*1.4)*.2; });

/* ---------- 24-hour light ---------- */
const KEYS_TOD = [ // hour, sky top, sky bottom, fog, water, light colour, light intensity, hemi intensity, night 0-1
  [0,   0x0b1638, 0x2a2f5c, 0x232651, 0x1f4d6b, 0xaab8ff, .35, .45, 1],
  [4.8, 0x14204a, 0x3a3566, 0x2c2d5a, 0x24546f, 0xaab8ff, .3,  .45, 1],
  [6,   0x5a7fc2, 0xffb08a, 0xf2c3a6, 0x4f9fbf, 0xffb37a, .7,  .6, .45],
  [7.5, 0x6cbcf5, 0xffe2c4, 0xf3e3d0, 0x4fb8d0, 0xffe2b8, 1.25, .72, 0],
  [12,  0x58b2f2, 0xe9f6ff, 0xe8f1f2, 0x4fb8d0, 0xfff6e6, 1.55, .8, 0],
  [16.5,0x6aa6e0, 0xffd9ad, 0xf3e0c8, 0x52b0c8, 0xffd29a, 1.2, .72, 0],
  [18,  0x4a5aa0, 0xff9a72, 0xf0a888, 0x4a8fb0, 0xff8a5a, .55, .55, .4],
  [19.3,0x1b2556, 0x4a3f78, 0x34305e, 0x2a5a78, 0xaab8ff, .32, .45, .9],
  [24,  0x0b1638, 0x2a2f5c, 0x232651, 0x1f4d6b, 0xaab8ff, .35, .45, 1],
];
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
const lerpHex = (a, b, k, out) => out.set(a).lerp(_c2.set(b), k);
let nightAmt = 0;
function applyTime(h){
  h = ((h % 24) + 24) % 24; let i = 0; while(KEYS_TOD[i+1][0] <= h) i++;
  const A = KEYS_TOD[i], B = KEYS_TOD[i+1], k = (h - A[0]) / (B[0] - A[0]);
  lerpHex(A[1], B[1], k, skyU.top.value); lerpHex(A[2], B[2], k, skyU.bottom.value);
  if(!scene.fog) scene.fog = new THREE.Fog(0xffffff, 140, 360); lerpHex(A[3], B[3], k, scene.fog.color);
  lerpHex(A[4], B[4], k, waterMat.color); lerpHex(A[5], B[5], k, sun.color);
  sun.intensity = A[6] + (B[6]-A[6])*k; hemi.intensity = A[7] + (B[7]-A[7])*k; nightAmt = A[8] + (B[8]-A[8])*k;
  hemi.color.set(0xfff6e8).lerp(_c1.set(0x8fa2e0), nightAmt); hemi.groundColor.set(0x9cc7a0).lerp(_c1.set(0x2b3550), nightAmt);
  const ang = (h - 6) / 12 * Math.PI, el = Math.sin(ang), dirX = -Math.cos(ang);
  sunDisc.position.set(dirX*480, el*300, -260); moonDisc.position.set(-dirX*480, -el*300, -260);
  sunDisc.visible = el > -.08; moonDisc.visible = el < .08;
  const src = el > .05 ? sunDisc.position : moonDisc.position;
  sun.position.copy(src).normalize().multiplyScalar(70); sun.position.y = Math.max(sun.position.y, 18);
  winMat.emissiveIntensity = nightAmt*1.2; lampMat.emissiveIntensity = .3 + nightAmt*2; lanternMat.emissiveIntensity = .15 + nightAmt*2.2;
  starMat.opacity = Math.max(0, nightAmt - .3)/.7; fireflyMat.opacity = Math.max(0, nightAmt - .4)*1.4;
  shallowMat.opacity = 1 - nightAmt*.6;
  for(const m of signMats) m.emissiveIntensity = nightAmt*.55;
}

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
  forest: g => { postSign(g, '森林療癒步道', -1.05, .5, .5, {bg:'#3f7a4a', w:.62}); postSign(g, '苗東縱谷', 1.1, .6, -.7, {bg:'#8a6a4a', w:.45}); },
  futurefund: g => { postSign(g, '苗栗未來基金', -.55, .3, .3, {bg:'#c9a10f', fg:'#3a2a00', w:.6}); postSign(g, '兒少專戶', .95, .55, -.6, {bg:'#ff8fb1', w:.45}); },
  urbanrural: g => { postSign(g, '排水工程', 1.1, .6, -.6, {bg:'#3d7fd0', w:.45}); textSign(g, '城鄉均衡', 0, .2, -.1+.17, .3, .08, {bg:'#5b6170', border:false}); },
  foodsafety: g => { frontSign(g, '食安檢驗所', .6, .45, .42, .38, .5, -.5, {bg:'#2e9e5b'}); postSign(g, '中彰投苗 食安聯防', -.8, -1.0, .2, {bg:'#d9534f', w:.75}); },
  parkexpand: g => { textSign(g, '後龍科學園區', -.45, .72, -.4+.31, .74, .14, {bg:'#2b3550'}); frontSign(g, '育成中心', .2, -.6, .4, .78, .4, 0, {bg:'#2bb3a8', h:.1}); textSign(g, '零售市場', -.6, .62, .55+.16, .4, .09, {bg:'#e39a1f', rot:.3}); },
  greenwater: g => { postSign(g, '天花湖水庫', -.6, .35, .2, {bg:'#3d7fd0', w:.55}); postSign(g, '氫能示範園區', .95, .85, -.5, {bg:'#2e9e5b', w:.6}); postSign(g, '泰安地熱', -1.05, .9, .6, {bg:'#c56a2a', w:.42}); },
  expressway: g => { postSign(g, '台61', -.3, -1.15, 0, {bg:'#2e8b57', w:.3, h:.2, y:.7}); postSign(g, '歸鄉之路', -1.1, .45, .5, {bg:'#e39a1f', w:.45}); },
  coldchain: g => { textSign(g, '冷鏈物流中心', -.35, .7, -.45+.32, .76, .14, {bg:'#3d7fd0'}); postSign(g, '苑裡', .9, .9, -.5, {bg:'#2e9e5b', w:.3}); },
  hospital: g => { textSign(g, '竹南分院', -.35, .88, -.4+.31, .62, .14, {bg:'#2bb3a8'}); frontSign(g, '媽祖醫院', .7, -.45, .4, .32, .4, 0, {bg:'#c0392b', h:.09}); postSign(g, '長照醫養家園', 0, 1.05, 0, {bg:'#7ab55c', w:.55}); },
  ethnic: g => { textSign(g, '客庄交流中心', -.35, .3, -.35-.3+.17, .56, .1, {bg:'#2f4f8f'}); postSign(g, '司馬限部落', .75, .55, -.3, {bg:'#c0392b', w:.55}); postSign(g, '新住民服務中心', -1.0, .5, .5, {bg:'#e39a1f', w:.66}); },
  sciencehigh: g => { frontSign(g, '科學實驗高中', -.4, -.35, .5, .42, .62, 0, {bg:'#d9534f', h:.11}); postSign(g, '縣立圖書館', .65, .02, 0, {bg:'#3d5aa6', w:.55}); },
  mountainsea: g => { postSign(g, '龍騰斷橋', -.95, 1.0, .5, {bg:'#a0522d', w:.45}); postSign(g, '通霄沙雕節', .4, -.85, -.2, {bg:'#e39a1f', w:.55}); postSign(g, '鐵道自行車', -.3, -.75, .2, {bg:'#2e9e5b', w:.52}); },
  debt: g => { textSign(g, '招商中心', .65, 1.32, -.4+.23, .5, .12, {bg:'#2b3550'}); postSign(g, '縣府財政', -.4, .1, 0, {bg:'#5b6170', w:.42}); },
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

/* ---------- keep people out of buildings ---------- */
const _bx = new THREE.Box3(), _mi = new THREE.Matrix4();
function computeObstacles(grp){
  grp.updateMatrixWorld(true); const inv = grp.matrixWorld.clone().invert(), obs = [];
  (function walk(o){ for(const c of o.children){ if(c.userData.dyn) continue;
    if(c.isMesh){ if(!c.geometry.boundingBox) c.geometry.computeBoundingBox(); _bx.copy(c.geometry.boundingBox).applyMatrix4(_mi.multiplyMatrices(inv, c.matrixWorld));
      if(_bx.max.y > .14 && _bx.min.y < .3 && Math.max(_bx.max.x-_bx.min.x, _bx.max.z-_bx.min.z) > .12) obs.push([_bx.min.x, _bx.max.x, _bx.min.z, _bx.max.z]); }
    walk(c); } })(grp);
  grp.userData.obs = obs;
  for(const c of grp.children) if(c.userData.dyn && !c.userData.walker && c.userData.arms) pushOut(c.position, obs, .13*c.scale.x);
}
function pushOut(p, obs, rad){
  for(let it=0; it<4; it++){ let moved = false;
    for(const [x0,x1,z0,z1] of obs){ if(p.x > x0-rad && p.x < x1+rad && p.z > z0-rad && p.z < z1+rad){
      const dl = p.x-(x0-rad), dr = (x1+rad)-p.x, db = p.z-(z0-rad), df = (z1+rad)-p.z, m = Math.min(dl,dr,db,df);
      if(m === dl) p.x = x0-rad; else if(m === dr) p.x = x1+rad; else if(m === db) p.z = z0-rad; else p.z = z1+rad; moved = true; } }
    if(!moved) break; }
}

/* ---------- coastal ring roads + arched bridge, with traffic between islands ---------- */
const DECK = .1, ROADW = .72;
function polyPath(pts){ // pts: [x,y,z]; returns a => [x,z,y] by arc length, looping
  const L = [0]; for(let i=1;i<pts.length;i++) L.push(L[i-1] + Math.hypot(pts[i][0]-pts[i-1][0], pts[i][2]-pts[i-1][2], pts[i][1]-pts[i-1][1]));
  const tot = L.at(-1);
  return a => { const d = (((a/(Math.PI*2)) % 1 + 1) % 1) * tot; let lo = 0, hi = L.length-1; while(hi - lo > 1){ const mid = (lo+hi) >> 1; if(L[mid] <= d) lo = mid; else hi = mid; }
    const k = (d - L[lo]) / ((L[hi] - L[lo]) || 1), p = pts[lo], q = pts[hi]; return [p[0]+(q[0]-p[0])*k, p[2]+(q[2]-p[2])*k, p[1]+(q[1]-p[1])*k]; };
}
function laneOffset(pts, off){ return pts.map((p,i) => { const a = pts[Math.max(0,i-1)], b = pts[Math.min(pts.length-1,i+1)]; let tx = b[0]-a[0], tz = b[2]-a[2]; const l = Math.hypot(tx,tz) || 1; tx /= l; tz /= l;
  return [p[0] - tz*off, p[1], p[2] + tx*off]; }); }
function buildRoads(){
  const [A, B] = islands, rA = A.R + .6, rB = B.R + .6, H = 1.5;
  const rr0 = [[A, rA, 0], [B, rB, Math.PI]];
  for(const [isl, rr, a0] of rr0){
    const grp = new THREE.Group(); grp.position.set(isl.cx,0,0); scene.add(grp);
    const top = mesh(new THREE.RingGeometry(rr-ROADW/2, rr+ROADW/2, 160).rotateX(-Math.PI/2), 0x7d8593, 0,DECK,0); top.castShadow = false; grp.add(top);
    for(const r2 of [rr-ROADW/2, rr+ROADW/2]) grp.add(mesh(new THREE.CylinderGeometry(r2,r2,.24,160,1,true), mat(0xe2dccf,{side:THREE.DoubleSide}), 0,DECK-.12,0));
    for(const r2 of [rr-ROADW/2+.02, rr+ROADW/2-.02]) grp.add(mesh(new THREE.TorusGeometry(r2,.02,6,160).rotateX(Math.PI/2), 0xffffff, 0,DECK+.04,0));
    const n = Math.round(rr*Math.PI*2/.55); for(let i=0;i<n;i+=1){ if(i%2) continue; const a = i/n*Math.PI*2; const d = mesh(rbox(.04,.01,.2,.004), 0xffd36e, Math.cos(a)*rr, DECK+.006, Math.sin(a)*rr); d.rotation.y = -a; grp.add(d); }
    const m = Math.round(rr*Math.PI*2/3.2); for(let i=0;i<m;i++){ const a = (i+.5)/m*Math.PI*2, x = Math.cos(a)*(rr+ROADW/2+.08), z = Math.sin(a)*(rr+ROADW/2+.08);
      grp.add(mesh(cyl(.02,.03,.75,8), 0x5b6170, x,DECK+.37,z)); grp.add(mesh(sph(.07,10,8), lampMat, x,DECK+.78,z)); }
    // short side roads onto the land
    const cells = isl.cells;
    for(let k=0;k<6;k++){ const a = a0 + k*Math.PI/3, dx = Math.cos(a), dz = Math.sin(a); let land = 0;
      for(let t=0;t<rr;t+=.1){ const px = dx*t, pz = dz*t; if(cells.some(([cx,cz]) => Math.hypot(px-cx, pz-cz) < HEX*.92)) land = t; }
      const s0 = land - .25, s1 = rr - ROADW/2 + .05, len = s1 - s0; if(len < .25) continue;
      const sp = mesh(rbox(len, .1, .5, .03), 0x8a909a, dx*(s0+len/2), DECK+.0, dz*(s0+len/2)); sp.rotation.y = -a; sp.rotation.z = 0; grp.add(sp);
      for(const s of [-1,1]){ const rl = mesh(rbox(len, .06, .03, .01), 0xffffff, dx*(s0+len/2) - dz*s*.26, DECK+.08, dz*(s0+len/2) + dx*s*.26); rl.rotation.y = -a; grp.add(rl); } }
    bake(grp);
  }
  // arched bridge
  const x0 = A.cx + rA, x1 = B.cx - rB, N = 22, bridge = new THREE.Group(); scene.add(bridge);
  const by = k => DECK + H*Math.sin(Math.PI*k);
  for(let i=0;i<N;i++){ const k0 = i/N, k1 = (i+1)/N, xa = x0+(x1-x0)*k0, xb = x0+(x1-x0)*k1, ya = by(k0), yb = by(k1), len = Math.hypot(xb-xa, yb-ya)+.02, ang = Math.atan2(yb-ya, xb-xa);
    const seg = mesh(rbox(len, .14, ROADW+.12, .03), 0x8a909a, (xa+xb)/2, (ya+yb)/2-.04, 0); seg.rotation.z = ang; bridge.add(seg);
    for(const s of [-1,1]){ const rl = mesh(rbox(len, .05, .04, .01), 0xf28b7d, (xa+xb)/2, (ya+yb)/2+.16, s*(ROADW/2+.05)); rl.rotation.z = ang; bridge.add(rl);
      if(i%2 === 0) bridge.add(mesh(cyl(.015,.015,.18,6), 0xffffff, xa, ya+.06, s*(ROADW/2+.05))); }
    if(i%2 === 0){ const dash = mesh(rbox(len*.6, .012, .04, .004), 0xffd36e, (xa+xb)/2, (ya+yb)/2+.035, 0); dash.rotation.z = ang; bridge.add(dash); } }
  const arch = mesh(new THREE.TorusGeometry((x1-x0)/2, .07, 8, 40, Math.PI), 0xf28b7d, (x0+x1)/2, DECK-.05, ROADW/2+.12); arch.scale.y = (H+.1)/((x1-x0)/2); bridge.add(arch);
  const arch2 = arch.clone(); arch2.position.z = -(ROADW/2+.12); bridge.add(arch2);
  for(const x of [x0+.3, x1-.3]) for(const s of [-1,1]){ bridge.add(mesh(cyl(.03,.04,.9,8), 0x5b6170, x, DECK+.45, s*(ROADW/2+.12))); bridge.add(mesh(sph(.08,10,8), lampMat, x, DECK+.92, s*(ROADW/2+.12))); }
  bake(bridge);
  // the route: around A, over the bridge, around B, back over the bridge
  const pts = [], ringPts = (isl, rr, a0, dir) => { for(let i=0;i<=140;i++){ const a = a0 + dir*i/140*Math.PI*2; pts.push([isl.cx + Math.cos(a)*rr, DECK, Math.sin(a)*rr]); } };
  const span = (xa, xb) => { for(let i=1;i<N;i++){ const k = i/N; const kk = xa < xb ? k : 1-k; pts.push([xa+(xb-xa)*k, by(kk), 0]); } };
  ringPts(A, rA, 0, 1); span(x0, x1); ringPts(B, rB, Math.PI, -1); span(x1, x0); pts.push(pts[0]);
  const fwd = polyPath(laneOffset(pts, .17)), back = polyPath(laneOffset(pts.slice().reverse(), .17));
  const fleet = [
    o => vehicle(scene, Object.assign({col:0x7ed49b, stripe:0xffffff, len:.72, h:.3, cab:.8, cabZ:0}, o)),
    o => vehicle(scene, Object.assign({col:0xffd23f, roofSign:0xffffff}, o)),
    o => vehicle(scene, Object.assign({col:0xf28b7d}, o)),
    o => vehicle(scene, Object.assign({col:0x8fc7ff, len:.7, h:.32, cab:.3, cabZ:.2}, o)),
    o => { const g = new THREE.Group(); g.userData.dyn = true; scooter(g, 0, 0, 0, pick([0xff9aa2,0x8fc7ff,0xffffff], Math.random)); const pr = person(g, 0, -.03, {s:.8, mood:'laugh'}); pr.position.y = .1; scene.add(g);
      movers.push({obj:g, path:o.path, speed:o.speed, t:o.t}); },
    o => vehicle(scene, Object.assign({col:0xffffff, stripe:0xff6b6b}, o)),
  ];
  const SP = .06;
  fleet.forEach((f, i) => { f({path:fwd, speed:SP, t:i/fleet.length*Math.PI*2}); f({path:back, speed:SP*1.05, t:(i+.5)/fleet.length*Math.PI*2}); });
}

/* comparison links: dotted golden arcs */
const linkGroup = new THREE.Group(); linkGroup.visible = false; scene.add(linkGroup);
function buildLinks(){
  const dot = sph(.08,10,8);
  for(const cat of CAT_ORDER){
    const a = tiles.filter(t => t.ci===0 && t.theme.category===cat), b = tiles.filter(t => t.ci===1 && t.theme.category===cat);
    for(const ta of a) for(const tb of b){
      const p0 = ta.world.clone(), p2 = tb.world.clone(), p1 = p0.clone().lerp(p2,.5); p1.y += 7;
      const curve = new THREE.QuadraticBezierCurve3(p0,p1,p2), N = 40;
      const im = new THREE.InstancedMesh(dot, new THREE.MeshBasicMaterial({color:0xffbf3a, transparent:true, opacity:.85}), N);
      for(let i=0;i<N;i++){ _m4.makeTranslation(...curve.getPoint(i/(N-1)).toArray()); im.setMatrixAt(i, _m4); }
      im.userData.cat = cat; im.userData.curve = curve; linkGroup.add(im);
    }
  }
  tickers.push((dt,t) => { if(!linkGroup.visible) return; linkGroup.children.forEach(im => { if(!im.visible) return; const N = im.count;
    for(let i=0;i<N;i++){ const k = i/(N-1), pulse = 1 + .8*Math.max(0, Math.cos((k - (t*.4 % 1))*Math.PI*6)) ** 8; _p.copy(im.userData.curve.getPoint(k)); _s.setScalar(pulse); _m4.compose(_p,_q,_s); im.setMatrixAt(i,_m4); }
    im.instanceMatrix.needsUpdate = true; }); });
}

