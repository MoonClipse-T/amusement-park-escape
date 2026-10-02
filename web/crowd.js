/* ============================================================
   CROWD : 저녁 손님들 (19:00 ~ 22:00 판매 근무 동안만)
   - 사람 모델 5종 (web/assets/people_<kind>.glb, Quaternius CC0 · blender/build_people.py 로 만든다)
     모두 같은 뼈대에 Walk · Idle · Wave 동작이 들어 있다
   - 옷 · 머리 색은 재질 이름으로 골라 사람마다 바꾼다 (TINT)
   - 길 그래프 위를 걸어 다니고, 가끔 멈춰 선다
   - CROWD.customer(opts) : 판매대 손님 하나 → await c.toCounter()
   - CROWD.clear() : 22:00 마감 때 전부 지운다
   ============================================================ */
'use strict';
const CROWD=(()=>{
  // 걸어 다니는 길 (게임 좌표). 건물 · 분수와 겹치지 않게 큰길 위에만 둔다
  const N={M1:[0,52],M2:[0,40],M3:[0,28],PS:[0,21],PE:[10.5,9],PN:[0,-1.5],PW:[-10.5,9],SE:[7,19],SW:[-6,19.5],
           CAR:[-17.5,9],CIR:[27,10],N1:[0,-12],BUM:[-24,26]};
  const E=[['M1','M2'],['M2','M3'],['M3','PS'],['PS','SE'],['SE','PE'],['PE','PN'],['PN','PW'],['PW','SW'],['SW','PS'],['PW','CAR'],['PE','CIR'],['PN','N1'],['CAR','BUM']];
  const ADJ={}; E.forEach(([a,b])=>{ (ADJ[a]=ADJ[a]||[]).push(b); (ADJ[b]=ADJ[b]||[]).push(a); });
  const TOPS=['#c8463c','#3b6fa8','#e0b33a','#4f8a5a','#8a5aa8','#e07a9a','#2a2a30','#e8e2d6','#5aa0b8','#a8643a','#f08a4a'];
  const BOTTOMS=['#23252e','#34466a','#5a4a3a','#6a6a72','#2e3a2e','#c8bca8','#41557a'];
  const HAIRS=['#1b1410','#2e1f16','#4a3020','#6b4a2c','#a07a4a','#d8b878','#151515'];
  // 종류별로 색을 바꿀 재질 이름 (top 상의 · bottom 하의 · hair 머리)
  const TINT={woman:{top:/^White$/,bottom:/^Orange$/,hair:/^Hair_/}, dress:{top:/^LimeGreen$/,hair:/^Red$/},
    man:{top:/^White$/,bottom:/^LightBlue$/,hair:/^Hair$/}, suit:{hair:/^Hair$/}, hoodie:{top:/^Purple$/,bottom:/^LightBlue$/,hair:/^Hair$/}};
  const KINDS=Object.keys(TINT);
  // 얼굴 부위 재질 (모델마다 이름이 다르다). dress 는 눈썹이 눈과 한 덩어리라 눈썹은 손대지 않는다
  const FACEMAT={woman:{eye:/^Brown$/,brow:/^Hair_Brown$/}, dress:{eye:/^Brown$/}, man:{eye:/^Eye$/,brow:/^Eyebrows$/},
    suit:{eye:/^Eye$/,brow:/^Eyebrows$/}, hoodie:{eye:/^Eye$/,brow:/^Eyebrows$/}};
  const SKINS=['#f3d6bd','#efcdb0','#e8c09d','#e2b48e','#d6a47c','#c08a62','#9a6544'];   // 밝은 톤이 많게
  const GREYS=['#b9b4ac','#8f8a84','#d8d4cc'];
  const pick=a=>a[Math.floor(Math.random()*a.length)], rnd=(a,b)=>a+Math.random()*(b-a);
  const MAT={}; const matOf=c=>MAT[c]||(MAT[c]=new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.85}));
  const proto={}, clips={}, H={}, G={}, FACE={}; let list=[], root=null, ready=false;

  async function build(){ root=new THREE.Group(); WORLD.add(root);
    try{
      const scenes=await Promise.all(KINDS.map(k=>loadGLB('people_'+k)));
      // 동작의 크기(scale) 트랙은 뺀다 — 남겨 두면 아이 머리를 키운 배율을 매 프레임 되돌려 버린다
      const clean=c=>new THREE.AnimationClip(c.name,c.duration,c.tracks.filter(t=>!t.name.endsWith('.scale')));
      KINDS.forEach((k,i)=>{ const g=scenes[i], an=g.userData.animations, by=n=>clean(an.find(c=>c.name===n));
        proto[k]=g; clips[k]={walk:by('Walk'),idle:by('Idle'),wave:by('Wave')};
        // 원래 키 : 머리 뼈 높이로 잰다 (r128 은 뼈대 있는 메시의 경계 상자를 잘못 계산한다)
        g.updateMatrixWorld(true); const v=new THREE.Vector3(); g.getObjectByName('Head').getWorldPosition(v); H[k]=v.y*1.12; FACE[k]=measureFace(k,g,v); });
      G.ear=new THREE.SphereGeometry(1,14,10); G.str=new THREE.CylinderGeometry(.004,.004,1,4); G.balloon=new THREE.SphereGeometry(.22,16,12);
      G.cone=new THREE.ConeGeometry(.045,.13,14); G.scoop=new THREE.SphereGeometry(.05,12,10);
      const arc=Math.PI*.7; G.smile=new THREE.TorusGeometry(.017,.0032,6,14,arc); G.smile.rotateZ(-Math.PI/2-arc/2); G.smile.translate(0,.012,0);
      G.grin=new THREE.CircleGeometry(.017,14,Math.PI,Math.PI); G.flat=new THREE.BoxGeometry(.026,.0038,.004); G.oh=new THREE.TorusGeometry(.008,.003,6,12);
      G.cheek=new THREE.CircleGeometry(.013,12); G.lens=new THREE.TorusGeometry(.02,.0028,6,18); G.bridge=new THREE.BoxGeometry(.022,.003,.003);
      G.cap=new THREE.SphereGeometry(1,18,8,0,Math.PI*2,0,Math.PI/2); G.brim=new THREE.CylinderGeometry(1,1,.01,18,1,false,-Math.PI/2,Math.PI);
      ready=true;
    }catch(e){ console.warn('손님 모델을 읽지 못했다',e); } }

  /* 얼굴 재기 : 모델 메시 좌표(m)는 x 좌우 · y 위 · z 앞 이다.
     눈 · 입 · 정수리 위치를 머리 뼈 기준(월드 m) 차이로 바꿔 둔다 → 입 · 안경 · 모자를 붙일 때 쓴다 */
  function measureFace(k,g,headPos){ const F=FACEMAT[k], meshes=[]; g.traverse(o=>{ if(o.isMesh) meshes.push(o); });
    const verts=re=>{ const out=[]; meshes.filter(o=>re.test(o.material.name)&&/Head/.test(o.name)).forEach(o=>{ const p=o.geometry.attributes.position; for(let i=0;i<p.count;i++) out.push([p.getX(i),p.getY(i),p.getZ(i)]); }); return out; };
    const eye=verts(F.eye), skin=verts(/^Skin$/), hair=verts(/^(Hair|Hair_Blond|Red)$/);
    const ex=Math.max(...eye.map(v=>Math.abs(v[0]))), ef=Math.max(...eye.map(v=>v[2])), ey=(Math.min(...eye.map(v=>v[1]))+Math.max(...eye.map(v=>v[1])))/2;
    const my=ey-ex*1.25;                                                      // 입 높이 : 눈 아래로 눈 사이 거리만큼
    const near=skin.filter(v=>Math.abs(v[0])<.02&&Math.abs(v[1]-my)<.015), front=near.length?Math.max(...near.map(v=>v[2])):ef;
    const top=Math.max(...(hair.length?hair:skin).map(v=>v[1]));
    const w=Math.max(...skin.filter(v=>Math.abs(v[1]-ey)<.03).map(v=>Math.abs(v[0])));
    const W=(x,y,z)=>new THREE.Vector3(x,y-headPos.y,z-headPos.z);           // 메시 좌표 → 머리 뼈 기준 차이
    return {eyeX:ex*.62, eye:W(0,ey,ef), mouth:W(0,my,front+.003), top:W(0,top,0), headW:w}; }

  // 눈썹 · 눈 모양 바꾸기 (메시 좌표에서) : 눈썹은 올리고 안쪽 끝을 들어 부드럽게, 눈은 크기를 바꾼다
  function shapeFace(g,kind,{browLift,browInner,eyeScale}){ const F=FACEMAT[kind];
    g.traverse(o=>{ if(!o.isMesh||!/Head/.test(o.name)) return; const isBrow=F.brow&&F.brow.test(o.material.name), isEye=F.eye.test(o.material.name); if(!isBrow&&!isEye) return;
      o.geometry=o.geometry.clone(); const p=o.geometry.attributes.position, c={};
      for(const s of [-1,1]){ let n=0,x=0,y=0; for(let i=0;i<p.count;i++) if(Math.sign(p.getX(i))===s){ x+=p.getX(i); y+=p.getY(i); n++; } c[s]=[x/n,y/n]; }
      for(let i=0;i<p.count;i++){ const s=Math.sign(p.getX(i))||1, [cx,cy]=c[s];
        if(isBrow){ const inner=1-Math.min(1,Math.abs(p.getX(i))/Math.abs(cx)/1.6), y=p.getY(i)+browLift+inner*browInner; p.setY(i,cy+browLift+(y-cy-browLift)*.75); }
        else { p.setX(i,cx+(p.getX(i)-cx)*eyeScale); p.setY(i,cy+(p.getY(i)-cy)*eyeScale); } }
      p.needsUpdate=true; }); }

  // 머리 뼈에 얼굴 소품 붙이기 (사람 크기를 바꾸기 전에 붙여서 함께 커지고 작아지게)
  function onHead(head,mesh,off){ mesh.position.copy(off); return attach(head,mesh); }
  function dressFace(head,kind,kid,adultOld){ const F=FACE[kind], dark=matOf('#5a2622');
    const mouth=new THREE.Mesh(G[kid?pick(['grin','grin','smile','oh']):pick(['smile','smile','flat','grin'])],dark);
    onHead(head,mouth,F.mouth.clone().add(new THREE.Vector3(0,0,.004)));
    if(kid) [-1,1].forEach(s=>{ const ch=new THREE.Mesh(G.cheek,new THREE.MeshStandardMaterial({color:0xf08a96,transparent:true,opacity:.45,roughness:1}));
      onHead(head,ch,F.mouth.clone().add(new THREE.Vector3(s*F.eyeX*1.25,.022,-.012))); ch.rotation.y=s*.45; });
    if(!kid&&Math.random()<(adultOld?.6:.2)){ const m=matOf(pick(['#1d1d22','#4a2c1a','#8a7a6a']));
      [-1,1].forEach(s=>onHead(head,new THREE.Mesh(G.lens,m),F.eye.clone().add(new THREE.Vector3(s*F.eyeX,0,.014))));
      onHead(head,new THREE.Mesh(G.bridge,m),F.eye.clone().add(new THREE.Vector3(0,.004,.016))); }
    if(/man|hoodie/.test(kind)&&Math.random()<(kid?.35:.22)){ const m=matOf(pick(['#c8463c','#2a3a6a','#e0b33a','#2a2a30','#4f8a5a'])), r=F.headW*1.12;
      const cap=new THREE.Mesh(G.cap,m); cap.scale.set(r,r*.62,r*1.05); onHead(head,cap,F.top.clone().add(new THREE.Vector3(0,-r*.42,0)));
      const brim=new THREE.Mesh(G.brim,m); brim.scale.set(r*.9,1,r*1.5); onHead(head,brim,F.top.clone().add(new THREE.Vector3(0,-r*.4,r*.3))); } }

  // 뼈에 장식을 붙일 때 : 모델 크기(배율)를 되돌려서 월드 기준 크기로 맞춘다
  function attach(b,mesh){ b.updateWorldMatrix(true,false); const s=new THREE.Vector3(); b.getWorldScale(s); mesh.scale.divide(s); mesh.position.divide(s); b.add(mesh); return mesh; }

  // 사람 하나 : kind, kid(아이), ears(토끼 머리띠), balloon(풍선), cloth(상의 색)
  function person({kind,kid=false,ears=false,balloon=false,cloth}={}){
    kind=kind||pick(kid?['woman','man','hoodie','dress']:KINDS);
    const g=THREE.SkeletonUtils.clone(proto[kind]), old=!kid&&Math.random()<.18;
    const T={...TINT[kind],skin:/^Skin$/,skin2:/^Skin_Darker$/};
    const sk=new THREE.Color(pick(SKINS)), col={top:cloth||pick(TOPS),bottom:pick(BOTTOMS),hair:old?pick(GREYS):pick(HAIRS),skin:sk,skin2:sk.clone().multiplyScalar(.82)};
    g.traverse(o=>{ if(!o.isMesh) return; o.frustumCulled=false; o.castShadow=false;
      const mats=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{ for(const k in T) if(T[k].test(m.name)){ m=m.clone(); m.color.set(col[k]).convertSRGBToLinear(); } return m; });
      o.material=Array.isArray(o.material)?mats:mats[0]; });
    // 얼굴 : 사람마다 눈썹 · 눈 크기 · 입 표정 · 안경 · 모자가 다르다. 아이는 머리가 크고 눈이 크다
    shapeFace(g,kind,{browLift:rnd(.002,.009),browInner:rnd(.003,.011),eyeScale:kid?rnd(1.25,1.4):rnd(.88,1.12)});
    const head=g.getObjectByName('Head'), hand=g.getObjectByName('Wrist.R');
    g.updateMatrixWorld(true); dressFace(head,kind,kid,old);
    // 토끼 머리띠 : 정수리 기준으로 붙여서 아이 머리를 키워도 함께 따라간다
    if(ears){ const w=matOf('#f6f0e6'), p=matOf('#f3aebd'), t=FACE[kind].top;
      [-1,1].forEach(k=>{ const e=new THREE.Mesh(G.ear,w); e.scale.set(.03,.11,.018); onHead(head,e,t.clone().add(new THREE.Vector3(k*.055,.07,-.01))).rotation.z=-k*.18;
        const n=new THREE.Mesh(G.ear,p); n.scale.set(.017,.085,.011); onHead(head,n,t.clone().add(new THREE.Vector3(k*.055,.07,0))).rotation.z=-k*.18; }); }
    if(kid) head.scale.setScalar(rnd(1.28,1.4));
    const h=kid?rnd(1.05,1.3):(/woman|dress/.test(kind)?1.62:1.74)+(Math.random()-.5)*.12-(old?.05:0);
    g.scale.multiplyScalar(h/H[kind]);
    const wrap=new THREE.Group(); wrap.add(g); root.add(wrap);
    const mixer=new THREE.AnimationMixer(g), C=clips[kind], walk=mixer.clipAction(C.walk), idle=mixer.clipAction(C.idle), wave=mixer.clipAction(C.wave);
    [walk,idle,wave].forEach(a=>{ a.play(); a.setEffectiveWeight(0); }); idle.setEffectiveWeight(1); idle.time=Math.random()*C.idle.duration;
    g.updateMatrixWorld(true);
    if(balloon&&hand){ const b=new THREE.Mesh(G.balloon,matOf(pick(['#e8453c','#f2c230','#3b8fd9','#e86fb5']))); b.position.set(0,.85,0); b.scale.y=1.2; attach(hand,b);
      const st=new THREE.Mesh(G.str,matOf('#dddddd')); st.position.set(0,.4,0); st.scale.y=.8; attach(hand,st); }
    return {wrap,g,mixer,walk,idle,wave,hand,h,w:0,wv:0}; }

  function addCone(o,flavor){ if(!o.p.hand) return; const col={vanilla:'#f3e6c4',strawberry:'#f2a2b2',choco:'#6b4128'}[flavor]||'#f3e6c4';
    const c=new THREE.Mesh(G.cone,matOf('#d39a52')); c.rotation.x=Math.PI; const sc=new THREE.Mesh(G.scoop,matOf(col)); sc.position.y=-.09; c.add(sc);
    c.position.set(0,.1,.04); attach(o.p.hand,c); }

  // 한 명 : 경로(목표점 목록)를 따라 걷는다
  function npc(p,x,z){ const o={p,x,z,path:[],speed:1.0+Math.random()*.3,wait:0,node:null,wander:false,arrive:null,waveT:0}; p.wrap.position.set(x,0,z); list.push(o); return o; }
  function walkTo(o,x,z){ return new Promise(res=>{ o.path.push([x,z]); o.arrive=res; }); }
  function wanderNext(o){ const nx=pick(ADJ[o.node]); o.node=nx; const [x,z]=N[nx]; o.path.push([x+(Math.random()-.5)*2.4,z+(Math.random()-.5)*2.4]);
    if(Math.random()<.25) o.wait=1.5+Math.random()*4; }

  function spawnWanderers(n){ if(!ready) return; const keys=Object.keys(N);
    for(let i=0;i<n;i++){ const k=pick(keys), [x,z]=N[k], kid=Math.random()<.2;
      const o=npc(person({kid,ears:kid&&Math.random()<.5||Math.random()<.1,balloon:kid&&Math.random()<.5}),x+(Math.random()-.5)*3,z+(Math.random()-.5)*3);
      o.node=k; o.wander=true; o.speed*=kid?.85:1; wanderNext(o); }
    // 테이블 · 노점 앞에 서 있는 사람
    [[5.2,15.4],[15.4,14.6],[-11.2,4.6],[-3,24]].forEach(([x,z])=>{ const o=npc(person({}),x,z); o.p.wrap.rotation.y=Math.random()*6; o.idleOnly=true; }); }

  // 판매대 손님 : (x,z) 에 서서 기다리다가 차례가 되면 판매대 앞으로 온다
  function customer(opts={}){ if(!ready) return fakeCustomer();
    const sp=PARK.spots.customer||{x:11.2,z:16.1}; const o=npc(person(opts),opts.x??sp.x,opts.z??sp.z-2); o.customer=true; o.speed=1.3;
    o.p.wrap.rotation.y=Math.atan2(sp.x-o.x,sp.z-o.z);
    return {o, walkTo:(x,z)=>walkTo(o,x,z), toCounter:()=>walkTo(o,sp.x,sp.z), give:f=>addCone(o,f), wave:()=>{ o.waveT=2.2; },
      // 판매대 건물을 가로지르지 않게 (7.5, 15) 를 거쳐 큰길로 나간다
      leave:async()=>{ o.customer=false; o.path.push([7.5,15]); await walkTo(o,0,26); remove(o); } }; }
  function fakeCustomer(){ return {o:null,walkTo:async()=>{},toCounter:async()=>{},give(){},wave(){},leave:async()=>{}}; }   // 모델을 못 읽었을 때도 이야기는 진행
  function remove(o){ if(!o) return; root.remove(o.p.wrap); list=list.filter(x=>x!==o); }
  function clear(){ list.forEach(o=>root.remove(o.p.wrap)); list=[]; }

  function tick(dt){ if(!root) return; for(const o of list){ const p=o.p; let moving=false;
      if(o.wait>0){ o.wait-=dt; } else if(o.path.length){ const [tx,tz]=o.path[0], dx=tx-o.x, dz=tz-o.z, d=Math.hypot(dx,dz);
        if(d<.08){ o.path.shift(); if(!o.path.length){ if(o.arrive){ const r=o.arrive; o.arrive=null; r(); } if(o.wander) wanderNext(o); } }
        else { moving=true; const st=Math.min(d,o.speed*dt); o.x+=dx/d*st; o.z+=dz/d*st; const want=Math.atan2(dx,dz);
          let df=want-p.wrap.rotation.y; df=Math.atan2(Math.sin(df),Math.cos(df)); p.wrap.rotation.y+=df*Math.min(1,dt*7); } }
      // 손님은 판매대 앞에 서면 플레이어를 본다
      if(!moving&&o.customer){ const want=Math.atan2(P.x-o.x,P.z-o.z); p.wrap.rotation.y+=Math.atan2(Math.sin(want-p.wrap.rotation.y),Math.cos(want-p.wrap.rotation.y))*Math.min(1,dt*5); }
      if(o.waveT>0) o.waveT-=dt;
      p.w+=((moving?1:0)-p.w)*Math.min(1,dt*6); p.wv+=((o.waveT>0&&!moving?1:0)-p.wv)*Math.min(1,dt*6);
      p.walk.setEffectiveWeight(p.w); p.wave.setEffectiveWeight(p.wv*(1-p.w)); p.idle.setEffectiveWeight((1-p.w)*(1-p.wv));
      p.walk.timeScale=o.speed/1.25*(1.7/p.h);      // 발이 미끄러지지 않게 걸음 속도 맞춤
      p.mixer.update(dt); p.wrap.position.set(o.x,0,o.z); } }

  return {build,tick,spawnWanderers,customer,clear,remove,get count(){ return list.length; },get ready(){ return ready; }};
})();
