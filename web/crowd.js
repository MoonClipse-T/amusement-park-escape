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
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const MAT={}; const matOf=c=>MAT[c]||(MAT[c]=new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.85}));
  const proto={}, clips={}, H={}, G={}; let list=[], root=null, ready=false;

  async function build(){ root=new THREE.Group(); WORLD.add(root);
    try{
      const scenes=await Promise.all(KINDS.map(k=>loadGLB('people_'+k)));
      KINDS.forEach((k,i)=>{ const g=scenes[i], an=g.userData.animations, by=n=>an.find(c=>c.name===n);
        proto[k]=g; clips[k]={walk:by('Walk'),idle:by('Idle'),wave:by('Wave')};
        // 원래 키 : 머리 뼈 높이로 잰다 (r128 은 뼈대 있는 메시의 경계 상자를 잘못 계산한다)
        g.updateMatrixWorld(true); const v=new THREE.Vector3(); g.getObjectByName('Head').getWorldPosition(v); H[k]=v.y*1.12; });
      G.ear=new THREE.SphereGeometry(1,14,10); G.str=new THREE.CylinderGeometry(.004,.004,1,4); G.balloon=new THREE.SphereGeometry(.22,16,12);
      G.cone=new THREE.ConeGeometry(.045,.13,14); G.scoop=new THREE.SphereGeometry(.05,12,10);
      ready=true;
    }catch(e){ console.warn('손님 모델을 읽지 못했다',e); } }

  // 뼈에 장식을 붙일 때 : 모델 크기(배율)를 되돌려서 월드 기준 크기로 맞춘다
  function attach(b,mesh){ b.updateWorldMatrix(true,false); const s=new THREE.Vector3(); b.getWorldScale(s); mesh.scale.divide(s); mesh.position.divide(s); b.add(mesh); return mesh; }

  // 사람 하나 : kind, kid(아이), ears(토끼 머리띠), balloon(풍선), cloth(상의 색)
  function person({kind,kid=false,ears=false,balloon=false,cloth}={}){
    kind=kind||pick(kid?['woman','man','hoodie','dress']:KINDS);
    const g=THREE.SkeletonUtils.clone(proto[kind]), T=TINT[kind];
    const col={top:cloth||pick(TOPS),bottom:pick(BOTTOMS),hair:pick(HAIRS)};
    g.traverse(o=>{ if(!o.isMesh) return; o.frustumCulled=false; o.castShadow=false;
      const mats=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{ for(const k in T) if(T[k].test(m.name)){ m=m.clone(); m.color.set(col[k]).convertSRGBToLinear(); } return m; });
      o.material=Array.isArray(o.material)?mats:mats[0]; });
    const h=kid?1.12+Math.random()*.15:(/woman|dress/.test(kind)?1.62:1.74)+(Math.random()-.5)*.12;
    g.scale.multiplyScalar(h/H[kind]);
    const wrap=new THREE.Group(); wrap.add(g); root.add(wrap);
    const mixer=new THREE.AnimationMixer(g), C=clips[kind], walk=mixer.clipAction(C.walk), idle=mixer.clipAction(C.idle), wave=mixer.clipAction(C.wave);
    [walk,idle,wave].forEach(a=>{ a.play(); a.setEffectiveWeight(0); }); idle.setEffectiveWeight(1); idle.time=Math.random()*C.idle.duration;
    const head=g.getObjectByName('Head'), hand=g.getObjectByName('Wrist.R');
    g.updateMatrixWorld(true);
    if(ears&&head){ const w=matOf('#f6f0e6'), p=matOf('#f3aebd');
      [-1,1].forEach(k=>{ const e=new THREE.Mesh(G.ear,w); e.scale.set(.035,.13,.02); e.position.set(k*.07,.34,0); e.rotation.z=-k*.18; attach(head,e);
        const i=new THREE.Mesh(G.ear,p); i.scale.set(.02,.1,.012); i.position.set(k*.07,.34,.012); i.rotation.z=-k*.18; attach(head,i); }); }
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
