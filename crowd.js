/* ============================================================
   CROWD : 저녁 손님들 (19:00 ~ 22:00 판매 근무 동안만)
   - 단순한 사람 모양(다리·몸·팔·머리)을 길 그래프 위로 걸어 다니게 한다
   - CROWD.customer(opts) : 판매대로 걸어오는 손님 하나 → await npc.walkTo(x,z)
   - CROWD.clear() : 22:00 마감 때 전부 지운다
   ============================================================ */
'use strict';
const CROWD=(()=>{
  // 걸어 다니는 길 (게임 좌표). 건물·분수와 겹치지 않게 큰길 위에만 둔다
  const N={M1:[0,52],M2:[0,40],M3:[0,28],PS:[0,21],PE:[10.5,9],PN:[0,-1.5],PW:[-10.5,9],SE:[7,19],SW:[-6,19.5],
           CAR:[-17.5,9],CIR:[27,10],N1:[0,-12],BUM:[-24,26]};
  const E=[['M1','M2'],['M2','M3'],['M3','PS'],['PS','SE'],['SE','PE'],['PE','PN'],['PN','PW'],['PW','SW'],['SW','PS'],['PW','CAR'],['PE','CIR'],['PN','N1'],['CAR','BUM']];
  const ADJ={}; E.forEach(([a,b])=>{ (ADJ[a]=ADJ[a]||[]).push(b); (ADJ[b]=ADJ[b]||[]).push(a); });
  const CLOTH=['#c8463c','#3b6fa8','#e0b33a','#4f8a5a','#8a5aa8','#e07a9a','#2a2a30','#d8d2c4','#5aa0b8','#a8643a'];
  const SKIN=['#f1d3b8','#e2b896','#c99a74','#a87652'], HAIR=['#1a1410','#3a2416','#6a4a2a','#14141a','#8a6a4a'];
  const G={}, MC={}; let list=[], root=null;
  const matOf=c=>MC[c]||(MC[c]=new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.85}));
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  function build(){ root=new THREE.Group(); WORLD.add(root);
    G.leg=new THREE.BoxGeometry(.13,.8,.14); G.leg.translate(0,-.4,0);
    G.body=new THREE.CylinderGeometry(.2,.23,.62,10); G.arm=new THREE.BoxGeometry(.09,.6,.1); G.arm.translate(0,-.3,0);
    G.head=new THREE.SphereGeometry(.15,12,10); G.hair=new THREE.SphereGeometry(.158,12,8,0,Math.PI*2,0,Math.PI*.55);
    G.earB=new THREE.CylinderGeometry(.03,.045,.32,6);
    G.balloon=new THREE.SphereGeometry(.22,12,10); G.str=new THREE.CylinderGeometry(.004,.004,1,3); G.cone=new THREE.ConeGeometry(.05,.14,8); G.scoop=new THREE.SphereGeometry(.055,8,6); }

  // 사람 하나 만들기 : kid(아이), ears(토끼 머리띠), balloon(풍선)
  function person({kid=false,ears=false,balloon=false,cloth}={}){ const g=new THREE.Group(), s=kid?.68:1+(Math.random()-.5)*.12;
    const c1=matOf(cloth||pick(CLOTH)), c2=matOf(pick(['#2a2a34','#3a4a6a','#4a3a2a','#6a6a72'])), sk=matOf(pick(SKIN)), hr=matOf(pick(HAIR));
    const legL=new THREE.Mesh(G.leg,c2), legR=new THREE.Mesh(G.leg,c2); legL.position.set(-.08,.8,0); legR.position.set(.08,.8,0);
    const body=new THREE.Mesh(G.body,c1); body.position.y=1.11;
    const armL=new THREE.Mesh(G.arm,c1), armR=new THREE.Mesh(G.arm,c1); armL.position.set(-.27,1.38,0); armR.position.set(.27,1.38,0);
    const head=new THREE.Mesh(G.head,sk); head.position.y=1.58; const hair=new THREE.Mesh(G.hair,hr); hair.position.y=1.6;
    g.add(legL,legR,body,armL,armR,head,hair);
    if(ears){ const w=matOf('#f4f0ea'); [-1,1].forEach(k=>{ const e=new THREE.Mesh(G.earB,w); e.position.set(k*.07,1.86,0); e.rotation.z=-k*.15; g.add(e); }); }
    if(balloon){ const b=new THREE.Mesh(G.balloon,matOf(pick(['#e8453c','#f2c230','#3b8fd9','#e86fb5']))); b.position.set(.3,2.5,0); b.scale.y=1.2;
      const st=new THREE.Mesh(G.str,matOf('#dddddd')); st.position.set(.3,1.75,0); st.scale.y=1.0; g.add(b,st); armR.rotation.z=.5; }
    g.scale.setScalar(s); g.userData={legL,legR,armL,armR,head}; root.add(g); return g; }

  function addCone(npc,flavor){ const col={vanilla:'#f3e6c4',strawberry:'#f2a2b2',choco:'#6b4128'}[flavor]||'#f3e6c4';
    const c=new THREE.Mesh(G.cone,matOf('#d39a52')); c.rotation.x=Math.PI; const sc=new THREE.Mesh(G.scoop,matOf(col)); sc.position.y=.09; c.add(sc);
    c.position.set(.06,-.62,.08); npc.g.userData.armR.add(c); npc.g.userData.armR.rotation.x=-.9; }

  // 한 명 : 경로(목표점 목록)를 따라 걷는다
  function npc(g,x,z){ const o={g,x,z,path:[],speed:1.1+Math.random()*.35,phase:Math.random()*6,wait:0,node:null,wander:false,arrive:null};
    g.position.set(x,0,z); list.push(o); return o; }
  function walkTo(o,x,z){ return new Promise(res=>{ o.path.push([x,z]); o.arrive=res; }); }
  function wanderNext(o){ const nb=ADJ[o.node]; const nx=pick(nb); o.node=nx; const [x,z]=N[nx]; o.path.push([x+(Math.random()-.5)*2.4,z+(Math.random()-.5)*2.4]);
    if(Math.random()<.25) o.wait=1+Math.random()*4; }

  function spawnWanderers(n){ const keys=Object.keys(N);
    for(let i=0;i<n;i++){ const k=pick(keys), [x,z]=N[k]; const kid=Math.random()<.25;
      const o=npc(person({kid,ears:kid&&Math.random()<.5||Math.random()<.12,balloon:kid&&Math.random()<.4}),x+(Math.random()-.5)*3,z+(Math.random()-.5)*3);
      o.node=k; o.wander=true; o.speed*=kid?.9:1; wanderNext(o); }
    // 벤치 · 테이블에 서 있는 사람 몇
    [[5.5,15.6],[15,15.1],[-8.5,15],[-3,24]].forEach(([x,z])=>{ const o=npc(person({}),x,z); o.g.rotation.y=Math.random()*6; o.idle=true; }); }

  function customer(opts={}){ const sp=PARK.spots.customer||{x:11.2,z:16.1}; const o=npc(person(opts),opts.fromX??0,opts.fromZ??24); o.customer=true;
    // 판매대 건물을 가로지르지 않게 (7.5, 15) 를 거쳐서 오간다
    return {o, walkTo:(x,z)=>walkTo(o,x,z), toCounter:()=>{ o.path.push([7.5,15]); return walkTo(o,sp.x,sp.z); }, give:f=>addCone(o,f),
      leave:async()=>{ o.path.push([7.5,15]); await walkTo(o,opts.fromX??0,opts.fromZ??26); remove(o); } }; }
  function remove(o){ root.remove(o.g); list=list.filter(x=>x!==o); }
  function clear(){ list.forEach(o=>root.remove(o.g)); list=[]; }

  function tick(dt){ if(!root) return; for(const o of list){ const u=o.g.userData;
      if(o.wait>0){ o.wait-=dt; } else if(o.path.length){ const [tx,tz]=o.path[0], dx=tx-o.x, dz=tz-o.z, d=Math.hypot(dx,dz);
        if(d<.08){ o.path.shift(); if(!o.path.length){ if(o.arrive){ const r=o.arrive; o.arrive=null; r(); } if(o.wander) wanderNext(o); } }
        else { const st=Math.min(d,o.speed*dt); o.x+=dx/d*st; o.z+=dz/d*st; const want=Math.atan2(dx,dz);
          let df=want-o.g.rotation.y; df=Math.atan2(Math.sin(df),Math.cos(df)); o.g.rotation.y+=df*Math.min(1,dt*8);
          o.phase+=dt*o.speed*5.5; } }
      const moving=o.path.length&&o.wait<=0, sw=moving?Math.sin(o.phase)*.55:0;
      u.legL.rotation.x=sw; u.legR.rotation.x=-sw; if(!o.customer||!u.armR.children.length){ u.armL.rotation.x=-sw*.8; if(!u.armR.children.length) u.armR.rotation.x=sw*.8; }
      o.g.position.set(o.x,moving?Math.abs(Math.cos(o.phase))*.03:0,o.z);
      // 손님은 판매대 앞에 서면 플레이어를 본다
      if(!moving&&o.customer){ const want=Math.atan2(P.x-o.x,P.z-o.z); o.g.rotation.y+= (Math.atan2(Math.sin(want-o.g.rotation.y),Math.cos(want-o.g.rotation.y)))*Math.min(1,dt*5); } } }

  return {build,tick,spawnWanderers,customer,clear,remove,get count(){ return list.length; }};
})();
