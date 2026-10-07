/* ============================================================
   HUNT : 달토끼 추격 · 찢어진 일지 조각 · 달빛
   달토끼의 정체 (김근수의 일지 조각을 처음 점검 장소부터 하나씩 주우며 규칙을 알게 된다 — ④ 를 읽으면 그동안 모은 쪽지가 한 화면에 모인다)
     처음엔 야간 근무자에게 장난을 친다 (물건을 옮기고, 놀이기구를 망가뜨리고, 킥킥 웃는다)
     → 장난에 싫증이 나면 배가 고파진다 → 배가 고프면 웃는다 (킥킥) → 동상에서 사라지면 그때부터 쫓아온다
   추격 규칙 (자이로드롭 두 번째 탑승에서 내려온 뒤 HUNT.start() 부터)
     · 어둠 속에서만 나타난다 — 달빛이 비치는 곳(MOON, 하늘에서 내려오는 푸른 빛기둥) 안으로는 못 들어오고, 그 안에 서 있으면 공격하지 못한다
     · 조작실 · 놀이기구(SAFE) 안으로는 못 들어오지만, 조작실 안에 있으면 창(문) 바깥에 바짝 붙어 들여다본다 — PEEK 초 안에 손전등으로 쫓아내지 못하면
       창을 깨고 덮친다. 조작실 안에 있으면 덜 자주 온다 (BOOTH_AWAY 초마다, 밖에서는 AWAY 초마다)
     · 플레이어 RADIUS m 안으로 들어오면 웃는다 (sfx laugh, LAUGH_GAP 초마다) — 웃음소리 = 가까이 왔다는 신호
     · 손전등으로 NEED 초 이상 비추면 어둠 속으로 천천히 사라진다 (fade)
     · 비추지 않은 채 GRACE 초가 지나거나 CATCH m 까지 오면 — 달려들어 입을 크게 벌리고 삼킨다 (bite : 모델의 morph target 0 'open')
       → 암전 → '잡아먹혔다' → 마지막에 들른 조작실에서 다시 시작 (시간은 줄지 않는다)
     · 04:00 붉은 달(S.redMoon) 뒤에는 달빛이 막지 못한다 — 손전등뿐
   소리는 web/assets/sfx/ (ElevenLabs : laugh(달토끼 웃음, 한 가지 목소리) · maw(턱이 벌어지는 소리) · chomp(깨무는 소리) · glass(창 깨지는 소리) · thump(범퍼카 쿵) · scare)
   ★ 빠르기 · 반경 · 초는 아래 HUNT 의 숫자, 일지 글은 SCRAPS, 달빛 자리는 HUNT.MOON
   ============================================================ */
'use strict';

/* 바닥에 떨어진 일지 조각 : at = 게임 좌표 (조작실 바닥). ④ 는 자이로드롭 조작실 책상 위 (room5_gyro.js ROOM5.note) */
const SCRAPS=[
  {id:'scrap1', at:[-18.8,14.5], rot:.5, title:'찢어진 일지 ①',
   body:'<i>…첫째 주.</i><br>밤마다 물건이 옮겨져 있다.<br>오늘은 회전목마 <b>5번 말</b>이 기둥에서 빠져 있었다. 내가 한 게 아니다.<br>멀리서 <b>킥킥</b> 웃는 소리.<br>달빛이 환한 광장에서는 한 번도 못 봤다. <b>늘 그늘 쪽</b>에서 들린다.',
   say:['찢어진 종이. 김근수 씨의 일지 조각 같다.','5번 말이 빠져 있던 게… 누가 장난친 거라고?','…늘 그늘 쪽에서.']},
  {id:'scrap2', at:[-38.7,30.7], rot:-.3, title:'찢어진 일지 ②',
   body:'<i>…둘째 주.</i><br>범퍼카가 혼자 굴러와 있다. 바닥엔 누가 윤활유를 엎질러 놨다.<br>어젯밤 그늘에서 <b>흰 것</b>을 봤다. 손전등을 비추니 — 천천히, 어둠 속으로 녹아 없어졌다.<br><b>한참 비추고 있어야</b> 했다. 잠깐으로는 안 된다.<br>장난이 점점 심해진다.',
   say:['또 일지 조각이다.','…손전등을 한참 비추고 있어야 사라진다고.']},
  {id:'scrap3', at:[22.4,1.5], rot:.9, title:'찢어진 일지 ③',
   body:'<i>…셋째 주.</i><br>보트에 자석을 잔뜩 붙여 놓은 것도 그 녀석이다. 물에 빠진 나를 보고 웃었다.<br>광장의 <b>달토끼</b>가 어제와 다른 쪽을 보고 있다. 요즘은 웃지 않는다.<br><b>장난에 싫증이 난 것 같다.</b><br>그 녀석은 <b>달빛이 비치는 곳으로는 절대 오지 않는다.</b> 밤길은 달빛을 따라 걸어야 한다.',
   say:['…달토끼가, 다른 쪽을 보고 있었다고.','달빛이 비치는 곳으로는 오지 않는다 — 기억해 두자.']},
  {id:'scrap5', at:[-42.7,-19.1], rot:-.6, title:'찢어진 일지 ⑤',
   body:'<i>…보름밤.</i><br>달이 붉어지면 달이 <b>눈을 뜬다.</b><br>붉은 달빛은 내 편이 아니다. 그때부터는 <b>달빛도 소용없다.</b> 어디든 온다.<br>남는 건 <b>손전등뿐.</b><br>새벽 6시. <b>달이 질 때까지만</b> 버티면 —',
   say:['달이… 눈을 뜬다고?','붉은 달이 뜨면 달빛도 소용없다. 손전등뿐.','새벽 6시. 달이 질 때까지.']},
];

/* 그동안 모은 쪽지를 한 화면에 하나씩 펼친다 (자이로드롭 일지 ④ 를 읽은 뒤). last = {title, body} 마지막 조각 */
function scrapWall(last){ return new Promise(res=>{
  const list=SCRAPS.filter(s=>s.id!=='scrap5').map(s=>({id:s.id,title:s.title,body:s.body})).concat([last]);
  list.forEach(s=>s.id&&INV.note(s.id,s.title,TORN(s.body)));              // 줍지 못한 조각도 — 근수 씨의 쪽지는 모두 소지품으로
  S.busy=true; P.free=false;
  const w=document.createElement('div'); w.id='scrapwall';
  w.innerHTML='<p class="sw-cap">근수 씨의 쪽지를 모아 보자</p><div class="sw-grid"></div><button class="sw-ok">다 읽었다</button>'; document.body.appendChild(w);
  const grid=w.querySelector('.sw-grid'), ok=w.querySelector('.sw-ok'); let n=0, timer=null;
  const next=()=>{ if(n>=list.length){ ok.classList.add('on'); return; } const s=list[n++], d=document.createElement('div');
    d.className='sw-note'; d.style.setProperty('--r',((n%2?-1:1)*(.6+Math.random()*1.4)).toFixed(2)+'deg'); d.innerHTML=`<h3>${s.title}</h3><div>${s.body}</div>`;
    grid.appendChild(d); AUDIO.noise(.14,.28,0,3200); timer=setTimeout(next,1100); };
  timer=setTimeout(next,450);
  w.addEventListener('pointerdown',e=>{ if(e.target===ok) return; if(n<list.length){ clearTimeout(timer); next(); } });      // 누르면 다음 쪽지를 바로
  ok.onclick=()=>{ clearTimeout(timer); w.classList.add('out'); setTimeout(()=>w.remove(),400); S.busy=false; P.free=true; AUDIO.click(); res(); }; }); }

const HUNT={on:false, rab:null, phase:'away', el:0, tOut:6, tIn:40, near:false, litT:0, darkT:0, laughT:0, stuck:0, fade:1, busy:false, lastSafe:null, biteA:null, beams:[],
  AWAY:[9,18], BOOTH_AWAY:[30,60],  // 사라진 뒤 다시 나타나기까지 (초) : 밖 · 조작실 안
  SPEED:2.1, RADIUS:9, NEED:3, GRACE:3, CATCH:1.2,     // 걷는 빠르기 (플레이어 걷기 2.6 · 달리기 4.2) · 웃는 반경 · 비춰야 하는 초 · 안 비추고 버티는 초 · 잡히는 거리
  CHARGE:6.5, BITE_D:1.9,           // 달려드는 빠르기 · 입을 벌리기 시작하는 거리
  PEEK:3,                           // 조작실 창에 붙은 뒤 손전등을 비추기 시작해야 하는 시간 (초) — 비추는 동안은 멈추고, NEED 초 계속 비추면 사라진다
  LIGHT_R:24, LIGHT_A:.34,          // 손전등이 닿는 거리 · 비추는 각도 (라디안, 화면 가운데에서)
  LAUGH:'laugh', LAUGH_GAP:3.4,     // 웃음소리 파일 (한 가지 목소리) · 반경 안에 있는 동안 되풀이 간격 (초)
  // 달빛 : 하늘에서 내려오는 빛기둥 (x, z, 반지름) — 붉은 달(04:00) 뒤에는 막지 못한다
  MOON:[ {x:-6,z:12,r:7}, {x:-30,z:24,r:5.5}, {x:14,z:5,r:6}, {x:-14,z:-20,r:6}, {x:-37,z:-36,r:5}, {x:-22,z:-35,r:5}, {x:-44,z:9,r:5}, {x:4,z:-20,r:6} ],
  // 달토끼가 들어오지 못하는 곳 : 조작실(in = 잡혔을 때 다시 시작하는 자리) · 숙소 · 놀이기구 — 안에 있어도 창밖에서 덮친다
  SAFE:[
    {n:'직원 숙소',x1:-56.9,x2:-47.2,z1:.2,z2:7.8},
    {n:'회전목마 조작실',x1:-20.7,x2:-18.1,z1:12.5,z2:15.1,in:[-19.4,13.9],b:[-20.6,12.6,0]},
    {n:'범퍼카 조작실',x1:-40.7,x2:-38.1,z1:30.0,z2:32.6,in:[-39.4,31.2],b:[-40.6,32.5,270]},
    {n:'후룸라이드 조작실',x1:21.7,x2:24.3,z1:.9,z2:3.5,in:[23,2.3],b:[24.2,3.4,180]},
    {n:'자이로드롭 조작실',x1:-28.9,x2:-26.3,z1:-49.1,z2:-46.5,in:[-27.5,-47.9],b:[-26.4,-46.6,180]},
    {n:'관람차 조작실',x1:-43.5,x2:-40.9,z1:-21.1,z2:-18.5,in:[-42.3,-19.6],b:[-41.0,-21.0,90]},
    {n:'바이킹 조작실',x1:-12.1,x2:-9.5,z1:-40.5,z2:-37.9,in:[-10.9,-39.3],b:[-9.6,-38.0,180]},
    {n:'회전목마',cx:-30,cz:10,r:7.9}, {n:'자이로드롭',cx:-20,cz:-49,r:5.1}, {n:'관람차 승강장',x1:-38.6,x2:-29.4,z1:-29.1,z2:-22.9},
  ],
  safeAt(x,z){ return this.SAFE.find(s=>s.r?(x-s.cx)**2+(z-s.cz)**2<s.r*s.r:x>s.x1&&x<s.x2&&z>s.z1&&z<s.z2)||null; },
  indoor(x=P.x,z=P.z){ const s=this.safeAt(x,z); return !!(s&&(s.in||s.n==='직원 숙소')); },        // 조작실 · 숙소 안 (하늘이 안 보인다)
  moonAt(x,z,pad){ if(S.redMoon) return null; return this.MOON.find(p=>{ const r=pad?p.r*1.2+.5:p.r; return (x-p.x)**2+(z-p.z)**2<r*r; })||null; },      // pad : 달토끼 몸 — 바닥에 번진 빛 가장자리까지 들어오지 않는다
  // 조작실 창 · 문 바깥 자리 (부스 좌표 : 큰 창 = x 0 쪽 벽 · 작은 창 = x 2.4 쪽 벽 · 문 = z 0 쪽 벽) — 달토끼가 바짝 붙어 들여다보는 곳
  winSpots(bz){ const [ox,oz,rot]=bz.b, W=(lx,lz)=>({0:[ox+lx,oz+lz],90:[ox-lz,oz+lx],180:[ox-lx,oz-lz],270:[ox+lz,oz-lx]})[rot];
    return [[-.62,1.2,1],[3.02,1.2,1],[1.57,-.62,0]].map(([lx,lz,glass])=>{ const [x,z]=W(lx,lz); return {x,z,glass,b:bz,at:false}; }).filter(p=>!this.blk(p.x,p.z)); },
  pickWin(bz){ const L=this.winSpots(bz), r=this.rab.position; if(!L.length) return null; return this.rab.visible?L.reduce((a,b)=>Math.hypot(a.x-r.x,a.z-r.z)<Math.hypot(b.x-r.x,b.z-r.z)?a:b):L[Math.floor(Math.random()*L.length)]; },
  anim(n){ const o=this.rab.userData; if(o.cur!==n){ o.play(n,.3); o.cur=n; } },
  // 달토끼가 설 수 없는 자리 : 공원 밖 · 조작실 · 놀이기구 · 달빛 · 벽 · 기둥 · 높은 단
  blk(x,z){ const B=PARK.bounds, r=.45; if(x<B.x1+1||x>B.x2-1||z<B.z1+1||z>B.z2-1||this.safeAt(x,z)||this.moonAt(x,z,true)||ledgeAt(x,z)>.3) return true;
    for(const b of COL){ if(b.on&&!b.on()) continue; if(x+r>b.x1&&x-r<b.x2&&z+r>b.z1&&z-r<b.z2) return true; }
    for(const c of CIRC){ if(c.on&&!c.on()) continue; const dx=x-c.x, dz=z-c.z, rr=c.r+r; if(dx*dx+dz*dz<rr*rr) return true; } return false; },
  // (x1,z1) 에서 (x2,z2) 쪽으로 곧장 걸어갈 수 있는가 (끝의 stop m 는 보지 않는다 — 목표가 조작실 안일 수 있다)
  clear(x1,z1,x2,z2,stop=2.5){ const len=Math.hypot(x2-x1,z2-z1), n=Math.ceil(len/1.2); for(let i=1;i<n;i++){ const t=i/n; if(len*(1-t)<stop) break; if(this.blk(x1+(x2-x1)*t,z1+(z2-z1)*t)) return false; } return true; },
  rnd(a){ return a[0]+Math.random()*(a[1]-a[0]); },
  goAway(){ this.phase='away'; this.el=0; this.tOut=this.rnd(this.AWAY); this.tIn=this.rnd(this.BOOTH_AWAY); this.near=false; },
  start(){ if(this.on) return;
    if(!this.rab){ const o=MOONRABBIT.make('Walk'); MOONRABBIT.face(o,1); o.traverse(m=>{ if(m.material){ m.material=m.material.clone(); m.material.transparent=true; } });      // 사라질 때 투명해지므로 재질을 따로
      o.visible=false; o.userData.mixer.timeScale=0; o.userData.mouth=[]; o.traverse(m=>{ if(m.morphTargetInfluences) o.userData.mouth.push(m); }); scene.add(o); this.rab=o; }
    this.on=true; this.goAway(); this.tOut=6; this.beams.forEach(b=>b.g.visible=true); },
  stop(){ this.on=false; if(this.rab) this.rab.visible=false; this.beams.forEach(b=>b.g.visible=false); },
  setFade(a){ this.fade=a; this.rab.traverse(m=>{ if(m.material) m.material.opacity=a; }); },
  setMouth(k){ this.rab.userData.mouth.forEach(m=>m.morphTargetInfluences[0]=k); },
  // 어둠 속 어딘가에서 나타난다 : 되도록 등 뒤 — 달빛 · 조작실 · 벽을 피해, 걸어올 수 있는 자리
  spawn(bz){ const r=this.rab, W=bz?this.pickWin(bz):null; if(bz&&!W) return false; const tx=W?W.x:P.x, tz=W?W.z:P.z;
    for(let k=0;k<60;k++){ const back=k<30, a=P.yaw+(back?Math.PI:0)+(Math.random()-.5)*(back?2.4:6.28), dist=(bz?8:12)+Math.random()*6;
      const x=P.x-Math.sin(a)*dist, z=P.z-Math.cos(a)*dist; if(this.blk(x,z)||(k<45&&!this.clear(x,z,tx,tz,W?.2:2.5))) continue;
      r.position.set(x,floorAt(x,z),z); r.rotation.y=Math.atan2(P.x-x,P.z-z); this.setFade(1); r.visible=true; this.phase='approach'; this.near=false; this.stuck=0; this.win=W; this.peekT=0; this.anim('Walk'); return true; } return false; },
  // 지금 이 자리에 세운다 (첫 만남 · 디버그)
  appear(x,z){ const r=this.rab; r.position.set(x,floorAt(x,z),z); r.rotation.y=Math.atan2(P.x-x,P.z-z); this.setFade(1); r.visible=true; this.phase='approach'; this.near=false; this.stuck=0; },
  // 손전등 불빛 안에 있는가
  lit(dx,dz,d){ if(!S.torch||d>this.LIGHT_R) return false; const cp=Math.cos(P.pitch), fx=-Math.sin(P.yaw)*cp, fy=Math.sin(P.pitch), fz=-Math.cos(P.yaw)*cp;
    const vy=this.rab.position.y+1.3-(P.y+P.eye), L=Math.hypot(dx,vy,dz)||1; return (-fx*dx+fy*vy-fz*dz)/L>Math.cos(this.LIGHT_A); },
  laugh(d){ AUDIO.sfx(this.LAUGH,clamp(1.25-d/30,.45,1.1),.96+Math.random()*.08); const fx=$('#thumpfx'); fx.classList.add('hit'); setTimeout(()=>fx.classList.remove('hit'),140); },      // 킥킥 — 가까울수록 크게 · 화면 가장자리가 붉게
  vanish(quiet){ this.phase='fade'; this.near=false; this.rab.userData.mixer.timeScale=0; if(!quiet) toast('…어둠 속으로 천천히 사라진다',2400); },

  /* ---------- 잡아먹기 : 달려든다 → 멈춰 노려본다 → 입이 크게 벌어진다(턱이 빠지듯) → 덮친다 → 암전 ----------
     모든 움직임은 이음매 없이 이어지게 : 위치 · 각도는 늘 부드러운 곡선(ease)으로, 단계가 바뀌어도 속도가 튀지 않게 */
  bite(W){ if(this.busy) return; this.busy=true; this.near=false; P.free=false; P.vx=P.vz=0; const r=this.rab, o=r.userData;
    if(!S.torch&&S.flags.torch) toggleLight();
    BEACON.visible=false;      // 길 안내 표시가 얼굴에 겹치지 않게
    this.setFade(1); r.visible=true; AUDIO.sfx(this.LAUGH,1.1,.82);
    this.biteA={ph:'charge',t:0,head:r.getObjectByName('head'),f0:camera.fov,v:0,win:W||null,shards:[]};
    if(W){ this.biteA.ph='stare'; this.biteA.p0=r.position.clone(); this.anim('Idle'); o.mixer.timeScale=1; AUDIO.tone(46,1.6,'sawtooth',.16,0,-8); }      // 창에 붙어 있던 그대로 — 노려보다가
    else { o.mixer.timeScale=1.3; this.anim('Run'); } },
  // 창이 깨지며 유리 조각이 안쪽으로 튄다 (작은 조각들이 돌며 떨어진다)
  shards(at,dir){ const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, .05,.012,0, .018,.06,0],3));
    const mat=new THREE.MeshBasicMaterial({color:0xcfe4ee,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false});
    for(let i=0;i<34;i++){ const m=new THREE.Mesh(geo,mat); m.position.copy(at).add(new THREE.Vector3((Math.random()-.5)*.8,(Math.random()-.5)*.7,(Math.random()-.5)*.8)); m.scale.setScalar(.3+Math.random()*.8);
      m.userData.v=dir.clone().multiplyScalar(2.5+Math.random()*4).add(new THREE.Vector3((Math.random()-.5)*3,.5+Math.random()*2,(Math.random()-.5)*3)); m.userData.w=new THREE.Vector3(Math.random()*14,Math.random()*14,Math.random()*14);
      scene.add(m); this.biteA.shards.push(m); } },
  mouthAt(tilt){ const r=this.rab, m=r.getObjectByName('rabbit_hmouth')||r; r.updateMatrixWorld(true);       // 벌린 입의 가운데 (입 원점에서 아래 · 앞으로)
    const p=m.getWorldPosition(new THREE.Vector3()), s=r.scale.x; return p.add(new THREE.Vector3(0,-.2*s,.16*s).applyAxisAngle(new THREE.Vector3(1,0,0),-tilt).applyAxisAngle(new THREE.Vector3(0,1,0),r.rotation.y)); },
  tilt(a,roll=0){ const A=this.biteA; if(!A.head) return; if(!A.hq0) A.hq0=A.head.quaternion.clone();      // 머리 : 고개를 젖히고(a) 갸웃(roll) — 몸 기준 축으로
    const pq=A.head.parent.getWorldQuaternion(new THREE.Quaternion()), rq=this.rab.getWorldQuaternion(new THREE.Quaternion());
    const w=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0).applyQuaternion(rq),-a).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1).applyQuaternion(rq),roll));
    A.head.quaternion.copy(pq.clone().invert().multiply(w).multiply(pq)).multiply(A.hq0); },
  tickBite(dt){ const A=this.biteA, r=this.rab, o=r.userData; A.t+=dt; const t=A.t, E=x=>x*x*(3-2*x), out=x=>1-(1-x)**3, back=x=>{ const c=1.9; return 1+(c+1)*(x-1)**3+c*(x-1)**2; };
    const eye=new THREE.Vector3(P.x,P.y+P.eye,P.z); let look=null, cam=eye.clone(), fov=A.f0, shake=0;
    if(A.ph==='charge'){ const dx=P.x-r.position.x, dz=P.z-r.position.z, d=Math.hypot(dx,dz); r.rotation.y=Math.atan2(dx,dz);
      A.v=Math.min(this.CHARGE,A.v+this.CHARGE*dt*3); const st=Math.min(A.v*dt,Math.max(0,d-this.BITE_D)), x=r.position.x+dx/d*st, z=r.position.z+dz/d*st;
      const ox=r.position.x, oz=r.position.z, sx=x-ox, sz=z-oz; let moved=true;      // 막히면 걷기처럼 옆으로 비켜 간다
      if(!this.blk(x,z)){ r.position.x=x; r.position.z=z; } else if(Math.abs(sx)>.001&&!this.blk(ox+Math.sign(sx)*Math.hypot(sx,sz),oz)) r.position.x=ox+Math.sign(sx)*Math.hypot(sx,sz); else if(Math.abs(sz)>.001&&!this.blk(ox,oz+Math.sign(sz)*Math.hypot(sx,sz))) r.position.z=oz+Math.sign(sz)*Math.hypot(sx,sz); else moved=st<.001;
      r.position.y=floorAt(r.position.x,r.position.z); A.blockT=moved?0:(A.blockT||0)+dt;
      look=r.position.clone().setY(r.position.y+1.35*r.scale.x);
      if(d<=this.BITE_D+.02||A.blockT>.3||t>2.2){ A.ph='stare'; A.t=0; A.p0=r.position.clone(); o.play('Idle',.18); o.mixer.timeScale=1; AUDIO.tone(46,1.6,'sawtooth',.16,0,-8); } }
    else if(A.ph==='stare'){ if(t>.2&&!A.frozen){ A.frozen=true; o.mixer.stopAllAction(); }       // 자세를 굳히고 — 머리만 움직인다
      this.tilt(0,.14*E(clamp(t/.4,0,1))); look=this.mouthAt(0); if(t>.45){ A.ph='open'; A.t=0; AUDIO.sfx('maw',1.3); } }
    else if(A.ph==='open'){ const k=clamp(t/.62,0,1); this.setMouth(back(k)*.98+.02*Math.sin(t*40)*k);                   // 턱이 빠지듯 — 살짝 넘쳤다가 자리 잡는다
      this.tilt(.3*out(k),.14*(1-E(k))); r.position.y=A.p0.y+.06*E(k); look=this.mouthAt(.3*out(k)); cam.addScaledVector(eye.clone().sub(r.position).setY(0).normalize(),.1*E(k)); shake=.25*k;
      if(t>.62+.2){ A.ph='lunge'; A.t=0; A.m0=this.mouthAt(.3); A.r0=r.position.clone(); A.off=A.m0.clone().sub(A.r0); AUDIO.sfx('scare',1.2); } }
    else if(A.ph==='lunge'){ const k=clamp(t/.3,0,1), e=k*k*(1.3-.3*k), tl=.3*(1-e)-.08*e;
      if(A.win&&!A.smash){ A.smash=true; if(A.win.glass){ AUDIO.sfx('glass',1.5); this.shards(A.m0.clone().addScaledVector(eye.clone().sub(A.r0).setY(0).normalize(),.35),eye.clone().sub(A.r0).setY(0).normalize()); } else AUDIO.noise(.4,.9,0,400); }      // 창을 깨고 (문이면 문틀을 부수며)                                // 점점 빨라지며 덮친다 — 벌린 입 한가운데가 눈앞으로
      const fwd=eye.clone().sub(A.r0).setY(0).normalize(), M=A.m0.clone().lerp(eye.clone().addScaledVector(fwd,-.3),e);      // 눈앞 30 cm 에서 끝 (더 가면 입 안쪽 면을 뚫고 지나간다)
      this.tilt(tl,0); this.setMouth(1); r.position.add(M.clone().sub(this.mouthAt(tl)));
      cam.addScaledVector(fwd,.1); look=M.clone().addScaledVector(fwd,-1); fov=A.f0*(1-.18*e); shake=.6;
      if(k>=1){ A.ph='dead'; this.dead(); } }
    A.shards.forEach(m=>{ m.userData.v.y-=9.8*dt; m.position.addScaledVector(m.userData.v,dt); m.rotation.x+=m.userData.w.x*dt; m.rotation.y+=m.userData.w.y*dt; m.rotation.z+=m.userData.w.z*dt; });
    if(look){ const f=Math.min(1,dt*(A.ph==='charge'?7:12)), ty=Math.atan2(-(look.x-cam.x),-(look.z-cam.z)), tp=Math.atan2(look.y-cam.y,Math.hypot(look.x-cam.x,look.z-cam.z));
      P.yaw+=Math.atan2(Math.sin(ty-P.yaw),Math.cos(ty-P.yaw))*f; P.pitch+=(tp-P.pitch)*f; }
    camera.position.copy(cam); camera.rotation.set(P.pitch+Math.sin(S.t*53)*.012*shake,P.yaw+Math.sin(S.t*47)*.01*shake,Math.sin(S.t*61)*.02*shake);
    camera.fov=fov; camera.updateProjectionMatrix(); },
  async dead(){ const f=$('#fade'), r=this.rab, o=r.userData, f0=this.biteA.f0; f.style.transition='none'; f.classList.remove('clear');        // 깜깜 — 깨무는 소리
    AUDIO.sfx('chomp',1.5); AUDIO.noise(.5,.8,0,250); await sleep(1300);
    this.biteA.shards.forEach(m=>scene.remove(m)); this.biteA=null; this.setMouth(0); r.visible=false; o.cur=null; this.anim('Walk'); o.mixer.timeScale=0; this.win=null;
    S.flags.caught=(S.flags.caught||0)+1; await card('','잡아먹혔다','','dead',2400);
    const sp=this.lastSafe||this.SAFE[4]; warp(sp.in[0],sp.in[1]); camera.fov=f0; camera.updateProjectionMatrix(); this.goAway(); this.tIn=Math.max(this.tIn,40);
    BEACON.visible=GOAL.on; f.style.transition=''; f.classList.add('clear'); await sleep(700); this.busy=false; P.free=true; },

  // 걸어서 (tx, tz) 쪽으로 — 막히면 옆으로 비켜 간다
  step(tx,tz,dt,stop){ const r=this.rab, dx=tx-r.position.x, dz=tz-r.position.z, d=Math.hypot(dx,dz); if(d<=stop) return true;
    const st=Math.min(this.SPEED*dt,d-stop), ux=dx/d, uz=dz/d, x=r.position.x, z=r.position.z;
    if(!this.blk(x+ux*st,z+uz*st)){ r.position.x+=ux*st; r.position.z+=uz*st; }
    else if(Math.abs(ux)>.2&&!this.blk(x+Math.sign(ux)*st,z)) r.position.x+=Math.sign(ux)*st;
    else if(Math.abs(uz)>.2&&!this.blk(x,z+Math.sign(uz)*st)) r.position.z+=Math.sign(uz)*st;
    else { const sd=this.side||(this.side=Math.random()<.5?1:-1); let ok=false;      // 달빛 · 기둥에 막히면 한쪽으로 빙 돌아간다 (같은 쪽을 유지해 갈팡질팡하지 않게)
      for(const a of [.7,1.2,1.6]){ const c=Math.cos(a*sd), s2=Math.sin(a*sd), vx=ux*c-uz*s2, vz=ux*s2+uz*c; if(!this.blk(x+vx*st,z+vz*st)){ r.position.x+=vx*st; r.position.z+=vz*st; ok=true; break; } }
      if(!ok){ this.side=-sd; return false; } }
    r.position.y=floorAt(r.position.x,r.position.z); return true; },
  tick(dt){ if(this.biteA) return this.tickBite(dt);
    if(this.on) this.tickBeams(dt);
    if(!this.on||!this.rab||this.busy) return; const r=this.rab, mx=r.userData.mixer;
    const sz=this.safeAt(P.x,P.z); if(sz&&sz.in) this.lastSafe=sz; const bz=sz&&sz.b?sz:null;
    if(S.busy||!P.free||S.paused){ mx.timeScale=0; return; }                  // 글을 읽거나 놀이기구를 타는 동안은 멈춰 있다
    if(this.phase==='away'){ this.el+=dt; if(this.el>=(bz?this.tIn:this.tOut)&&!this.spawn(bz)) this.el-=3; return; }
    if(this.phase==='fade'){ this.setFade(Math.max(0,this.fade-dt/1.8)); if(this.fade<=0){ r.visible=false; this.goAway(); } return; }
    // 조작실 안이면 목표는 창(문) 바깥 자리 — 밖으로 나오면 다시 나를 쫓는다
    if(bz){ if(!this.win||this.win.b!==bz){ this.win=this.pickWin(bz); this.peekT=0; } } else if(this.win){ this.win=null; this.anim('Walk'); }
    const W=this.win, dx=P.x-r.position.x, dz=P.z-r.position.z, d=Math.hypot(dx,dz); r.rotation.y=Math.atan2(dx,dz);
    const isLit=this.lit(dx,dz,d), moon=this.moonAt(P.x,P.z);              // 달빛 안에서만 안전하다
    if(d<this.RADIUS&&!this.near){ this.near=true; this.litT=0; this.darkT=0; this.laughT=this.LAUGH_GAP; this.laugh(d); }
    if(this.near){ this.laughT-=dt; if(this.laughT<=0){ this.laughT=this.LAUGH_GAP; this.laugh(d); } if(!W&&d>this.RADIUS*1.7) this.near=false; }
    if(this.near&&isLit){ this.litT+=dt; this.darkT=0; if(this.litT>=this.NEED) return this.vanish(); } else this.litT=Math.max(0,this.litT-dt*.5);
    if(W){                                                                     // ---- 조작실 : 창에 바짝 붙어 들여다보다가, PEEK 초가 지나면 창을 깨고 덮친다
      if(W.at||Math.hypot(W.x-r.position.x,W.z-r.position.z)<.3){
        if(!W.at){ W.at=true; this.peekT=0; r.position.set(W.x,floorAt(W.x,W.z),W.z); this.anim('Idle'); if(!this.near){ this.near=true; this.laughT=this.LAUGH_GAP; this.laugh(d); } }
        mx.timeScale=isLit?0:1; if(!isLit){ this.peekT+=dt; if(this.peekT>=this.PEEK) return this.bite(W); } return; }
      if(isLit){ mx.timeScale=0; return; }
      const moved=this.step(W.x,W.z,dt,0); mx.timeScale=moved?1:0;
      if(!moved){ this.stuck+=dt; if(this.stuck>4){ this.stuck=0; const n=this.winSpots(bz).filter(q=>q.x!==W.x||q.z!==W.z); if(n.length) this.win=n[0]; else return this.vanish(true); } } else this.stuck=0;
      return; }
    // ---- 밖 : 나를 향해 걸어온다. 반경 안에서 GRACE 초 동안 비추지 않으면 달려들어 삼킨다
    if(this.near&&!isLit){ if(moon) this.darkT=0; else { this.darkT+=dt; if(this.darkT>=this.GRACE) return this.bite(); } }
    if(isLit){ mx.timeScale=0; return; }                                       // 불빛 안에서는 굳는다
    const moved=d>this.CATCH*.8&&this.step(P.x,P.z,dt,this.CATCH*.8); mx.timeScale=moved?1:0;
    if(!moved){ this.stuck+=dt; if(this.stuck>(this.near?7:8)&&(moon||!this.near)) return this.vanish(!this.near); } else this.stuck=0;      // 내가 달빛 안이거나, 막혀서 다가오지 못하면 — 스스로 물러난다
    if(!moon&&d<this.CATCH) this.bite(); },

  /* ---------- 달빛 : 하늘(달 쪽)에서 비스듬히 내려오는 빛기둥 + 바닥에 번진 빛 + 떠다니는 먼지 ---------- */
  tickBeams(dt){ const md=SKY.u&&SKY.u.moonDir.value, red=!!S.redMoon, up=new THREE.Vector3(0,1,0);
    const dir=md?new THREE.Vector3(md.x*.45,Math.max(.8,md.y),md.z*.45).normalize():up;      // 거의 곧게 (많이 기울면 빛기둥이 바닥 빛 밖으로 나간다)
    this.beams.forEach(b=>{ b.beam.quaternion.setFromUnitVectors(up,dir); b.u.t.value=S.t; b.u.col.value.setHex(red?0xff5038:0xa8c0ff); b.u.op.value=red?1.8:3.2;
      b.disc.material.color.setHex(red?0xd05040:0x8fa8e0); b.disc.material.opacity=(red?.38:.5)+.04*Math.sin(S.t*.9+b.x);
      const a=b.dust.geometry.attributes.position; for(let i=0;i<a.count;i++){ let y=a.getY(i)+dt*(.06+.03*Math.sin(i)); if(y>4.5) y=.1; a.setY(i,y); a.setX(i,a.getX(i)+Math.sin(S.t*.4+i)*dt*.03); } a.needsUpdate=true;
      b.dust.material.color.setHex(red?0xff9a80:0xd8e4ff); }); } };

ROOMS.push({id:'hunt', build(){
    const fx=document.createElement('div'); fx.id='thumpfx'; document.body.appendChild(fx);
    // 달빛 (추격이 시작되면 보인다 · 붉은 달 뒤에는 붉게)
    const glow=cvs(128,128,(g,w,h)=>{ const gr=g.createRadialGradient(64,64,0,64,64,64); [[0,1],[.35,.7],[.65,.3],[.85,.08],[1,0]].forEach(([s,a])=>gr.addColorStop(s,`rgba(255,255,255,${a})`)); g.fillStyle=gr; g.fillRect(0,0,w,h); });
    const dot=cvs(32,32,(g)=>{ const gr=g.createRadialGradient(16,16,0,16,16,16); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,32,32); });
    HUNT.MOON.forEach(p=>{ const g=new THREE.Group(); g.position.set(p.x,floorAt(p.x,p.z),p.z); g.visible=false; WORLD.add(g);
      const disc=new THREE.Mesh(new THREE.CircleGeometry(p.r*1.2,48),new THREE.MeshBasicMaterial({map:glow,color:0xb4c8ff,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
      disc.rotation.x=-Math.PI/2; disc.position.y=.05; disc.renderOrder=4; g.add(disc);
      const u={col:{value:new THREE.Color(0xa8c0ff)},op:{value:.55},t:{value:0}};
      const geo=new THREE.CylinderGeometry(p.r*1.05,p.r*.92,22,40,1,true); geo.translate(0,11,0);
      const beam=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
        vertexShader:'varying float vY; varying vec3 vN,vV; varying float vD; void main(){ vY=uv.y; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); vD=length(mv.xyz); gl_Position=projectionMatrix*mv; }',
        fragmentShader:'uniform vec3 col; uniform float op,t; varying float vY; varying vec3 vN,vV; varying float vD; void main(){ float rim=pow(abs(dot(normalize(vN),normalize(vV))),2.4); float fall=pow(1.-vY,2.2)*smoothstep(0.,.02,vY); float sh=.8+.2*sin(t*.6+vY*11.)*sin(t*.37+vY*5.); gl_FragColor=vec4(col*rim*fall*sh*op*.5*exp(-vD*.03),1.); }'}));
      beam.renderOrder=5; g.add(beam);
      const N=36, pos=new Float32Array(N*3); for(let i=0;i<N;i++){ const a=Math.random()*6.28, rr=Math.sqrt(Math.random())*p.r*.8; pos[i*3]=Math.cos(a)*rr; pos[i*3+1]=.1+Math.random()*4.4; pos[i*3+2]=Math.sin(a)*rr; }
      const dg=new THREE.BufferGeometry(); dg.setAttribute('position',new THREE.BufferAttribute(pos,3));
      const dust=new THREE.Points(dg,new THREE.PointsMaterial({map:dot,color:0xd8e4ff,size:.07,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending})); beam.add(dust);
      HUNT.beams.push({g,disc,beam,dust,u,x:p.x}); });
    // 일지 조각 : 가장자리가 찢긴 공책 종이 한 장 (어두워도 희미하게 보인다)
    const tex=cvs(256,192,(g,w,h)=>{ g.clearRect(0,0,w,h); g.fillStyle='#e9dfc0'; g.beginPath(); const P=[[8,14],[40,4],[78,12],[120,3],[160,13],[204,5],[246,16],[250,60],[240,100],[252,140],[244,182],[200,176],[160,188],[118,178],[76,188],[36,178],[6,186],[12,140],[4,96],[14,56]];
      P.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); g.fill(); g.save(); g.clip();
      g.strokeStyle='rgba(120,140,170,.7)'; g.lineWidth=1.5; for(let y=34;y<h;y+=22){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); }
      g.strokeStyle='rgba(30,40,70,.85)'; g.lineWidth=2.2; for(let y=30;y<h-20;y+=22){ g.beginPath(); let x=26; g.moveTo(x,y); while(x<w-30-Math.random()*60){ x+=6+Math.random()*8; g.lineTo(x,y-3+Math.random()*6); } g.stroke(); }
      g.fillStyle='rgba(110,70,25,.25)'; g.beginPath(); g.arc(200,150,34,0,7); g.fill(); g.restore(); });
    HUNT.scrap=(x,y,z,rot)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(.36,.27),new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.5,roughness:.9,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.3,side:THREE.DoubleSide}));
      m.rotation.set(-Math.PI/2,0,rot); m.position.set(x,y,z); WORLD.add(m); return m; };
    SCRAPS.forEach(sc=>{ const m=HUNT.scrap(sc.at[0],floorAt(sc.at[0],sc.at[1])+.06,sc.at[1],sc.rot);
      INTER.push({mesh:m,name:'찢어진 쪽지',range:2.8,fn:async()=>{ AUDIO.noise(.12,.25,0,3200); m.visible=false; await showMsg(sc.title,TORN(sc.body)); INV.note(sc.id,sc.title,TORN(sc.body)); await mono(sc.say); }}); });
  },
  tick(dt){ HUNT.tick(dt); }});
