/* ============================================================
   CROWD : 저녁 손님들 (19:00 ~ 22:00 판매 근무 동안만)
   - 사람 모델 2종 (web/assets/people_michelle.glb · people_rpm.glb) 에 걷기 · 대기 동작(people_anims.glb)을 입힌다
   - Ready Player Me 아바타는 상의 · 하의 색 · 모자 · 수염 · 키를 바꿔 여러 사람으로 보이게 한다
   - 길 그래프 위를 걸어 다니고, 가끔 멈춰 선다
   - CROWD.customer(opts) : 판매대로 걸어오는 손님 하나 → await c.toCounter()
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
  const BOTTOMS=['#23252e','#34466a','#5a4a3a','#6a6a72','#2e3a2e','#c8bca8'];
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const MAT={}; const matOf=c=>MAT[c]||(MAT[c]=new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.85}));
  const proto={}, clips={}, H={}, G={}; let list=[], root=null, ready=false;

  async function build(){ root=new THREE.Group(); WORLD.add(root);
    try{
      const [mi,rp,an]=await Promise.all([loadGLB('people_michelle'),loadGLB('people_rpm'),loadGLB('people_anims')]);
      proto.michelle=mi; proto.rpm=rp;
      // 동작 : 이름에 Walk / Idle 이 든 것 중 트랙이 가장 많은 것. 회전 트랙만 쓰고 (이동은 코드가 한다)
      // 골반(Hips) 회전은 뺀다 — 모델마다 기본 자세의 방향이 달라서, 넣으면 사람이 눕거나 뒤집힌다 (시험해서 확인함)
      const src=an.userData.animations||[];
      const best=k=>src.filter(c=>c.name.includes(k)).sort((a,b)=>b.tracks.length-a.tracks.length)[0];
      const clean=(c,strip)=>new THREE.AnimationClip(c.name,c.duration,c.tracks.filter(t=>t.name.endsWith('.quaternion')&&!/Hips\.quaternion$/.test(t.name)).map(t=>{ const u=t.clone(); if(strip) u.name=u.name.replace(/^mixamorig:?/,''); return u; }));
      const walk=best('Walk'), idle=best('Idle');
      clips.michelle={walk:clean(walk,false),idle:clean(idle,false)}; clips.rpm={walk:clean(walk,true),idle:clean(idle,true)};
      // 원래 키 : 머리 뼈 높이로 잰다 (r128 은 뼈대 있는 메시의 경계 상자를 잘못 계산한다)
      for(const k in proto){ proto[k].updateMatrixWorld(true); const hb=bone(proto[k],['Head','mixamorigHead']), v=new THREE.Vector3();
        if(hb) hb.getWorldPosition(v); H[k]=Math.max(.3,v.y*1.08); }
      G.ear=new THREE.SphereGeometry(1,14,10); G.str=new THREE.CylinderGeometry(.004,.004,1,4); G.balloon=new THREE.SphereGeometry(.22,16,12);
      G.cone=new THREE.ConeGeometry(.045,.13,14); G.scoop=new THREE.SphereGeometry(.05,12,10);
      ready=true;
    }catch(e){ console.warn('손님 모델을 읽지 못했다',e); } }

  function bone(g,names){ for(const n of names){ const b=g.getObjectByName(n); if(b) return b; } return null; }
  // 뼈에 장식을 붙일 때 : 모델 크기(배율)를 되돌려서 월드 기준 크기로 맞춘다
  function attach(b,mesh){ b.updateWorldMatrix(true,false); const s=new THREE.Vector3(); b.getWorldScale(s); mesh.scale.divide(s); mesh.position.divide(s); b.add(mesh); return mesh; }

  // 사람 하나 : kind('rpm'|'michelle'), kid(아이), ears(토끼 머리띠), balloon(풍선), cloth(상의 색)
  function person({kind,kid=false,ears=false,balloon=false,cloth}={}){
    kind=kind||(Math.random()<.6?'rpm':'michelle');
    const g=THREE.SkeletonUtils.clone(proto[kind]);
    const top=cloth||pick(TOPS), bottom=pick(BOTTOMS), hat=Math.random()<.35, beard=Math.random()<.3;
    g.traverse(o=>{ if(!o.isMesh) return; o.frustumCulled=false;
      if(kind!=='rpm') return; const n=o.material.name||'';
      if(/Outfit_Top/.test(n)){ o.material=o.material.clone(); o.material.map=null; o.material.color.set(top).convertSRGBToLinear(); }
      if(/Outfit_Bottom/.test(n)){ o.material=o.material.clone(); o.material.map=null; o.material.color.set(bottom).convertSRGBToLinear(); }
      if(/Headwear/.test(n)) o.visible=hat; if(/Beard/.test(n)) o.visible=beard&&!kid; });
    const h=kid?1.12+Math.random()*.15:(kind==='michelle'?1.62:1.7)+(Math.random()-.5)*.14;
    g.scale.multiplyScalar(h/H[kind]);
    const wrap=new THREE.Group(); wrap.add(g); root.add(wrap);
    const mixer=new THREE.AnimationMixer(g), walk=mixer.clipAction(clips[kind].walk), idle=mixer.clipAction(clips[kind].idle);
    walk.play(); idle.play(); walk.setEffectiveWeight(0); idle.setEffectiveWeight(1); idle.time=Math.random()*idle.getClip().duration;
    const head=bone(g,['Head','mixamorigHead']), hand=bone(g,['RightHand','mixamorigRightHand']);
    g.updateMatrixWorld(true);
    if(ears&&head){ const w=matOf('#f6f0e6'), p=matOf('#f3aebd');
      [-1,1].forEach(k=>{ const e=new THREE.Mesh(G.ear,w); e.scale.set(.035,.13,.02); e.position.set(k*.06,.27,0); e.rotation.z=-k*.18; attach(head,e);
        const i=new THREE.Mesh(G.ear,p); i.scale.set(.02,.1,.012); i.position.set(k*.06,.27,.012); i.rotation.z=-k*.18; attach(head,i); }); }
    if(balloon&&hand){ const b=new THREE.Mesh(G.balloon,matOf(pick(['#e8453c','#f2c230','#3b8fd9','#e86fb5']))); b.position.set(0,.85,0); b.scale.y=1.2; attach(hand,b);
      const st=new THREE.Mesh(G.str,matOf('#dddddd')); st.position.set(0,.4,0); st.scale.y=.8; attach(hand,st); }
    return {wrap,g,mixer,walk,idle,hand,h,w:0}; }

  function addCone(o,flavor){ if(!o.p.hand) return; const col={vanilla:'#f3e6c4',strawberry:'#f2a2b2',choco:'#6b4128'}[flavor]||'#f3e6c4';
    const c=new THREE.Mesh(G.cone,matOf('#d39a52')); c.rotation.x=Math.PI; const sc=new THREE.Mesh(G.scoop,matOf(col)); sc.position.y=-.09; c.add(sc);
    c.position.set(0,.08,.03); attach(o.p.hand,c); }

  // 한 명 : 경로(목표점 목록)를 따라 걷는다
  function npc(p,x,z){ const o={p,x,z,path:[],speed:1.0+Math.random()*.3,wait:0,node:null,wander:false,arrive:null}; p.wrap.position.set(x,0,z); list.push(o); return o; }
  function walkTo(o,x,z){ return new Promise(res=>{ o.path.push([x,z]); o.arrive=res; }); }
  function wanderNext(o){ const nx=pick(ADJ[o.node]); o.node=nx; const [x,z]=N[nx]; o.path.push([x+(Math.random()-.5)*2.4,z+(Math.random()-.5)*2.4]);
    if(Math.random()<.25) o.wait=1.5+Math.random()*4; }

  function spawnWanderers(n){ if(!ready) return; const keys=Object.keys(N);
    for(let i=0;i<n;i++){ const k=pick(keys), [x,z]=N[k], kid=Math.random()<.2;
      const o=npc(person({kid,ears:kid&&Math.random()<.5||Math.random()<.1,balloon:kid&&Math.random()<.5}),x+(Math.random()-.5)*3,z+(Math.random()-.5)*3);
      o.node=k; o.wander=true; o.speed*=kid?.85:1; wanderNext(o); }
    // 테이블 · 노점 앞에 서 있는 사람
    [[5.2,15.4],[15.4,14.6],[-11.2,4.6],[-3,24]].forEach(([x,z])=>{ const o=npc(person({}),x,z); o.p.wrap.rotation.y=Math.random()*6; o.idleOnly=true; }); }

  function customer(opts={}){ if(!ready) return fakeCustomer();
    const sp=PARK.spots.customer||{x:11.2,z:16.1}; const o=npc(person(opts),opts.fromX??0,opts.fromZ??24); o.customer=true; o.speed=1.25;
    // 판매대 건물을 가로지르지 않게 (7.5, 15) 를 거쳐서 오간다
    return {o, walkTo:(x,z)=>walkTo(o,x,z), toCounter:()=>{ o.path.push([7.5,15]); return walkTo(o,sp.x,sp.z); }, give:f=>addCone(o,f),
      leave:async()=>{ o.path.push([7.5,15]); await walkTo(o,opts.fromX??0,opts.fromZ??26); remove(o); } }; }
  function fakeCustomer(){ return {o:null,walkTo:async()=>{},toCounter:async()=>{},give(){},leave:async()=>{}}; }   // 모델을 못 읽었을 때도 이야기는 진행
  function remove(o){ if(!o) return; root.remove(o.p.wrap); list=list.filter(x=>x!==o); }
  function clear(){ list.forEach(o=>root.remove(o.p.wrap)); list=[]; }

  function tick(dt){ if(!root) return; for(const o of list){ const p=o.p; let moving=false;
      if(o.wait>0){ o.wait-=dt; } else if(o.path.length){ const [tx,tz]=o.path[0], dx=tx-o.x, dz=tz-o.z, d=Math.hypot(dx,dz);
        if(d<.08){ o.path.shift(); if(!o.path.length){ if(o.arrive){ const r=o.arrive; o.arrive=null; r(); } if(o.wander) wanderNext(o); } }
        else { moving=true; const st=Math.min(d,o.speed*dt); o.x+=dx/d*st; o.z+=dz/d*st; const want=Math.atan2(dx,dz);
          let df=want-p.wrap.rotation.y; df=Math.atan2(Math.sin(df),Math.cos(df)); p.wrap.rotation.y+=df*Math.min(1,dt*7); } }
      // 손님은 판매대 앞에 서면 플레이어를 본다
      if(!moving&&o.customer){ const want=Math.atan2(P.x-o.x,P.z-o.z); p.wrap.rotation.y+=Math.atan2(Math.sin(want-p.wrap.rotation.y),Math.cos(want-p.wrap.rotation.y))*Math.min(1,dt*5); }
      p.w+=((moving?1:0)-p.w)*Math.min(1,dt*6); p.walk.setEffectiveWeight(p.w); p.idle.setEffectiveWeight(1-p.w);
      p.walk.timeScale=o.speed/1.3*(1.7/p.h);      // 발이 미끄러지지 않게 걸음 속도 맞춤
      p.mixer.update(dt); p.wrap.position.set(o.x,0,o.z); } }

  return {build,tick,spawnWanderers,customer,clear,remove,get count(){ return list.length; },get ready(){ return ready; }};
})();
