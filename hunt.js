/* ============================================================
   HUNT : 달토끼 추격 · 찢어진 일지 조각 · 달빛 웅덩이
   달토끼의 정체 (김근수의 일지 조각을 처음 점검 장소부터 하나씩 주우며 규칙을 알게 된다 — ④ 를 읽으면 쪽지를 모아 '달토끼 규칙' 카드가 된다)
     처음엔 야간 근무자에게 장난을 친다 (물건을 옮기고, 놀이기구를 망가뜨리고, 킥킥 웃는다)
     → 장난에 싫증이 나면 배가 고파진다 → 배가 고프면 웃는다 (킥킥) → 동상에서 사라지면 그때부터 쫓아온다
   추격 규칙 (자이로드롭 두 번째 탑승에서 내려온 뒤 HUNT.start() 부터)
     · 어둠 속에서만 나타난다 — 달빛 웅덩이(MOON, 바닥의 푸른 빛) 안으로는 못 들어온다 · 조작실 · 놀이기구(SAFE) 안으로도 못 들어온다
     · 플레이어 RADIUS m 안으로 들어오면 웃는다 (sfx laugh, LAUGH_GAP 초마다) — 웃음소리 = 가까이 왔다는 신호
     · 손전등으로 NEED 초 이상 비추면 어둠 속으로 천천히 사라진다 (fade) → AWAY 초 뒤 다시 어둠 속에서 나타난다
     · 비추지 않은 채 GRACE 초가 지나거나 CATCH m 까지 오면 — 긴 팔이 뻗어 와 낚아챈다 (grab : 공중에 뜬 채 거꾸로, 얼굴이 화면 가득)
       → 암전 → '잡혔다' 카드 → 마지막에 들른 조작실에서 깨어나고 공원 시간 30분이 지나간다
     · 04:00 붉은 달(S.redMoon) 뒤에는 달빛 웅덩이가 막지 못한다 — 손전등뿐
   소리는 web/assets/sfx/ (ElevenLabs : laugh(달토끼 웃음, 한 가지 목소리) · thump(범퍼카 쿵) · scare(점프 스케어))
   ★ 빠르기 · 반경 · 초 · 벌칙은 아래 HUNT 의 숫자, 일지 글은 SCRAPS · RULES 에서 고친다. 달빛 웅덩이 자리는 HUNT.MOON
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
/* ④ 를 읽은 뒤 쪽지를 모아 정리한 규칙 카드 (소지품) */
const RULES={id:'rules', title:'달토끼 규칙 — 근수 씨의 쪽지를 모아서',
  body:DOC(['<b>어둠 속에서만</b> 나타난다. <b>달빛이 비치는 곳</b>(바닥의 푸른 빛)으로는 못 온다.','<b>웃음소리</b>가 들리면 — 이미 가까이 온 것.','<b>손전등으로 3초 이상</b> 비추면 어둠 속으로 사라진다. 늦으면 <b>긴 팔</b>이 온다.','조작실 · 놀이기구 안으로는 못 들어온다.','!동상에서 사라지면, 그때부터 나를 쫓아온다.'])};

const HUNT={on:false, rab:null, phase:'away', t:0, near:false, litT:0, darkT:0, laughT:0, stuck:0, fade:1, busy:false, lastSafe:null, shake:0, grabA:null, pools:[],
  AWAY:[9,18],                      // 사라진 뒤 다시 나타나기까지 (초, 그 사이에서 무작위)
  SPEED:2.1, RADIUS:9, NEED:3, GRACE:3, CATCH:1.2,     // 걷는 빠르기 (플레이어 걷기 2.6 · 달리기 4.2) · 웃는 반경 · 비춰야 하는 초 · 안 비추고 버티는 초 · 잡히는 거리
  LIGHT_R:24, LIGHT_A:.34,          // 손전등이 닿는 거리 · 비추는 각도 (라디안, 화면 가운데에서)
  PENALTY:150,                      // 잡혔을 때 줄어드는 시간 (초) = 공원 시간 30분
  LAUGH:'laugh', LAUGH_GAP:3.4,     // 웃음소리 파일 (한 가지 목소리) · 반경 안에 있는 동안 되풀이 간격 (초)
  // 달빛 웅덩이 : 달토끼가 못 들어오는 밝은 바닥 (x, z, 반지름) — 붉은 달(04:00) 뒤에는 소용없다
  MOON:[ {x:-6,z:12,r:7}, {x:-30,z:24,r:5.5}, {x:14,z:5,r:6}, {x:-14,z:-20,r:6}, {x:-37,z:-36,r:5}, {x:-22,z:-35,r:5}, {x:-44,z:9,r:5}, {x:4,z:-20,r:6} ],
  // 달토끼가 들어오지 못하는 곳 : 조작실(in = 잡혔을 때 깨어나는 자리) · 숙소 · 놀이기구
  SAFE:[
    {n:'직원 숙소',x1:-56.9,x2:-47.2,z1:.2,z2:7.8},
    {n:'회전목마 조작실',x1:-20.7,x2:-18.1,z1:12.5,z2:15.1,in:[-19.4,13.9]},
    {n:'범퍼카 조작실',x1:-40.7,x2:-38.1,z1:30.0,z2:32.6,in:[-39.4,31.2]},
    {n:'후룸라이드 조작실',x1:21.7,x2:24.3,z1:.9,z2:3.5,in:[23,2.3]},
    {n:'자이로드롭 조작실',x1:-28.9,x2:-26.3,z1:-49.1,z2:-46.5,in:[-27.5,-47.9]},
    {n:'관람차 조작실',x1:-43.5,x2:-40.9,z1:-21.1,z2:-18.5,in:[-42.3,-19.6]},
    {n:'바이킹 조작실',x1:-12.1,x2:-9.5,z1:-40.5,z2:-37.9,in:[-10.9,-39.3]},
    {n:'회전목마',cx:-30,cz:10,r:7.9}, {n:'자이로드롭',cx:-20,cz:-49,r:5.1}, {n:'관람차 승강장',x1:-38.6,x2:-29.4,z1:-29.1,z2:-22.9},
  ],
  safeAt(x,z){ return this.SAFE.find(s=>s.r?(x-s.cx)**2+(z-s.cz)**2<s.r*s.r:x>s.x1&&x<s.x2&&z>s.z1&&z<s.z2)||null; },
  moonAt(x,z){ if(S.redMoon) return null; return this.MOON.find(p=>(x-p.x)**2+(z-p.z)**2<p.r*p.r)||null; },
  // 달토끼가 설 수 없는 자리 : 공원 밖 · 안전한 곳 · 달빛 웅덩이 · 벽 · 기둥 · 높은 단
  blk(x,z){ const B=PARK.bounds, r=.45; if(x<B.x1+1||x>B.x2-1||z<B.z1+1||z>B.z2-1||this.safeAt(x,z)||this.moonAt(x,z)||ledgeAt(x,z)>.3) return true;
    for(const b of COL){ if(b.on&&!b.on()) continue; if(x+r>b.x1&&x-r<b.x2&&z+r>b.z1&&z-r<b.z2) return true; }
    for(const c of CIRC){ if(c.on&&!c.on()) continue; const dx=x-c.x, dz=z-c.z, rr=c.r+r; if(dx*dx+dz*dz<rr*rr) return true; } return false; },
  // (x1,z1) 에서 (x2,z2) 쪽으로 곧장 걸어갈 수 있는가 (끝의 stop m 는 보지 않는다 — 목표가 조작실 · 웅덩이 안일 수 있다)
  clear(x1,z1,x2,z2,stop=2.5){ const len=Math.hypot(x2-x1,z2-z1), n=Math.ceil(len/1.2); for(let i=1;i<n;i++){ const t=i/n; if(len*(1-t)<stop) break; if(this.blk(x1+(x2-x1)*t,z1+(z2-z1)*t)) return false; } return true; },
  start(){ if(this.on) return;
    if(!this.rab){ const o=MOONRABBIT.make('Walk'); MOONRABBIT.face(o,1); o.traverse(m=>{ if(m.material){ m.material=m.material.clone(); m.material.transparent=true; } });      // 사라질 때 투명해지므로 재질을 따로
      o.visible=false; o.userData.mixer.timeScale=0; o.userData.s0=o.scale.x; scene.add(o); this.rab=o; }
    this.on=true; this.phase='away'; this.t=6; this.pools.forEach(p=>p.visible=true); },
  stop(){ this.on=false; if(this.rab) this.rab.visible=false; this.pools.forEach(p=>p.visible=false); },
  setFade(a){ this.fade=a; this.rab.traverse(m=>{ if(m.material) m.material.opacity=a; }); },
  // 어둠 속 어딘가에서 나타난다 : 되도록 등 뒤 12 ~ 18 m — 달빛 웅덩이 · 안전한 곳 · 벽을 피해, 걸어올 수 있는 자리
  spawn(near){ const r=this.rab; for(let k=0;k<50;k++){ const back=k<30, a=P.yaw+(back?Math.PI:0)+(Math.random()-.5)*(back?2.4:6.28), dist=(near?9:12)+Math.random()*6;
      const x=P.x-Math.sin(a)*dist, z=P.z-Math.cos(a)*dist; if(this.blk(x,z)||(k<40&&!this.clear(x,z,P.x,P.z))) continue;
      r.position.set(x,floorAt(x,z),z); r.rotation.y=Math.atan2(P.x-x,P.z-z); this.setFade(1); r.visible=true; this.phase='approach'; this.near=false; this.stuck=0; return true; } return false; },
  // 지금 이 자리에 세운다 (첫 만남)
  appear(x,z){ const r=this.rab; r.position.set(x,floorAt(x,z),z); r.rotation.y=Math.atan2(P.x-x,P.z-z); this.setFade(1); r.visible=true; this.phase='approach'; this.near=false; this.stuck=0; },
  // 손전등 불빛 안에 있는가
  lit(dx,dz,d){ if(!S.torch||d>this.LIGHT_R) return false; const cp=Math.cos(P.pitch), fx=-Math.sin(P.yaw)*cp, fy=Math.sin(P.pitch), fz=-Math.cos(P.yaw)*cp;
    const vy=this.rab.position.y+1.3-(P.y+P.eye), L=Math.hypot(dx,vy,dz)||1; return (-fx*dx+fy*vy-fz*dz)/L>Math.cos(this.LIGHT_A); },
  laugh(d){ AUDIO.sfx(this.LAUGH,clamp(1.25-d/30,.45,1.1),.96+Math.random()*.08); const fx=$('#thumpfx'); fx.classList.add('hit'); setTimeout(()=>fx.classList.remove('hit'),140); },      // 킥킥 — 가까울수록 크게 · 화면 가장자리가 붉게
  vanish(){ this.phase='fade'; this.near=false; this.rab.userData.mixer.timeScale=0; toast('…어둠 속으로 천천히 사라진다',2400); },
  // 긴 팔 : 어깨에서 내 쪽으로 쭉 뻗어 와 낚아챈다 → 공중에 뜬 채 거꾸로 — 얼굴이 화면 가득 → 암전 → '잡혔다' → 마지막에 들른 조작실에서 깨어난다
  async grab(){ if(this.busy) return; this.busy=true; this.near=false; P.free=false; P.vx=P.vz=0; const r=this.rab, f0=camera.fov; r.userData.mixer.timeScale=0;
    if(!S.torch&&S.flags.torch) toggleLight();
    const dir=new THREE.Vector3(P.x-r.position.x,0,P.z-r.position.z).normalize(); r.rotation.y=Math.atan2(dir.x,dir.z);
    const mat=new THREE.MeshStandardMaterial({color:0xf4f1ec,roughness:.85}), arm=new THREE.Group();
    const seg=new THREE.Mesh(new THREE.CylinderGeometry(.075,.115,1,10),mat); seg.position.y=.5; arm.add(seg);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),mat); hand.position.y=1; hand.scale.set(1,.55,1.35); arm.add(hand);
    const sh=new THREE.Vector3(r.position.x+dir.x*.22,r.position.y+1.02*r.scale.y,r.position.z+dir.z*.22), to=new THREE.Vector3(P.x,P.y+P.eye-.45,P.z);
    arm.position.copy(sh); arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(sh).normalize()); arm.scale.set(1,.1,1); scene.add(arm);
    AUDIO.noise(.35,.7,0,700); AUDIO.tone(80,.45,'sawtooth',.35,0,-30);
    this.grabA={t:0,arm,len:to.distanceTo(sh),r,f0,s0:r.userData.s0||1,from:new THREE.Vector3(P.x,P.y+P.eye,P.z),yaw0:P.yaw};
    await sleep(380);
    AUDIO.sfx('scare',1.4); AUDIO.tone(1900,1.1,'sawtooth',.2,0,-1400); AUDIO.noise(.9,.7,0,3000); AUDIO.tone(55,1.4,'sine',.6,0,-25); this.shake=1.3;      // 번쩍 — 낚아챈다
    const fx=$('#thumpfx'); fx.classList.add('hit');
    await sleep(2300); $('#fade').classList.remove('clear'); await sleep(800);
    this.grabA=null; scene.remove(arm); this.shake=0; fx.classList.remove('hit'); r.visible=false; r.scale.setScalar(r.userData.s0||1); camera.fov=f0; camera.updateProjectionMatrix(); camera.rotation.z=0;
    await card('','잡혔다','달토끼에게 — 공원 시간 30분이 지나갔다','dead',2600);
    timeLeft=Math.max(45,timeLeft-this.PENALTY); const sp=this.lastSafe||this.SAFE[4]; warp(sp.in[0],sp.in[1]); this.phase='away'; this.t=16;
    $('#fade').classList.add('clear'); await sleep(700); this.busy=false; S.flags.caught=(S.flags.caught||0)+1;
    await mono(['…헉!','정신을 차려 보니 '+sp.n+' 바닥이다.','시계가 한참 지나 있다. …다시는 잡히면 안 된다.']); },
  // 낚아채는 동안의 카메라 : 팔이 뻗어 온다 → 공중으로 번쩍, 거꾸로 — 커진 달토끼의 얼굴 바로 앞
  tickGrab(dt){ const g=this.grabA, r=g.r; g.t+=dt; const ease=x=>x*x*(3-2*x);
    g.arm.scale.y=.1+(g.len-.1)*clamp(g.t/.35,0,1);
    if(g.t<.38){ camera.position.copy(g.from); camera.rotation.set(P.pitch,P.yaw,0); return; }
    const k=ease(clamp((g.t-.38)/.55,0,1)); r.scale.setScalar(g.s0*(1+.6*k)); r.updateMatrixWorld(true);
    const m=r.getObjectByName('rabbit_hmouth')||r.getObjectByName('head')||r, fp=m.getWorldPosition(new THREE.Vector3()); fp.y+=.08;
    const fx=Math.sin(r.rotation.y), fz=Math.cos(r.rotation.y), tgt=new THREE.Vector3(fp.x+fx*2.3,fp.y+.05,fp.z+fz*2.3);      /* 커진 얼굴 앞 2.3 m — 얼굴 전체가 화면에 가득 (더 가까우면 이빨만 보인다) */
    const up=new THREE.Vector3(g.from.x,g.from.y+2.4,g.from.z);                                                // 먼저 번쩍 위로, 그다음 얼굴 앞으로
    const pos=k<.5?g.from.clone().lerp(up,ease(k*2)):up.clone().lerp(tgt,ease((k-.5)*2));
    camera.position.copy(pos); const dx=fp.x-pos.x, dy=fp.y-pos.y, dz=fp.z-pos.z;
    camera.rotation.set(Math.atan2(dy,Math.hypot(dx,dz))+Math.sin(S.t*53)*.02*this.shake,Math.atan2(-dx,-dz)+Math.sin(S.t*47)*.015*this.shake,Math.PI*k+Math.sin(S.t*61)*.03*this.shake);
    camera.fov=lerp(g.f0,50,k); camera.updateProjectionMatrix(); r.rotation.y=Math.atan2(pos.x-r.position.x,pos.z-r.position.z); },
  tick(dt){ if(this.grabA) return this.tickGrab(dt);
    if(this.shake>0){ camera.rotation.z=Math.sin(S.t*61)*.035*this.shake; camera.position.x+=Math.sin(S.t*47)*.012*this.shake; }
    if(this.on){ const red=!!S.redMoon; this.pools.forEach(g=>{ g.children[0].material.color.setHex(red?0xff5a40:0x8fb0ff); g.children[1].material.color.setHex(red?0xff8a70:0xb9ccff); g.children[0].material.opacity=(red?.07:.09)+.03*Math.sin(S.t*1.7); }); }
    if(!this.on||!this.rab||this.busy) return; const r=this.rab, mx=r.userData.mixer, rnd=a=>a[0]+Math.random()*(a[1]-a[0]);
    const sz=this.safeAt(P.x,P.z); if(sz&&sz.in) this.lastSafe=sz;
    if(S.busy||!P.free||S.paused){ mx.timeScale=0; return; }                  // 글을 읽거나 놀이기구를 타는 동안은 멈춰 있다
    this.t-=dt;
    if(this.phase==='away'){ if(this.t<=0&&!this.spawn(!!sz)) this.t=3; return; }
    if(this.phase==='fade'){ this.setFade(Math.max(0,this.fade-dt/1.8)); if(this.fade<=0){ r.visible=false; this.phase='away'; this.t=rnd(this.AWAY); } return; }
    const dx=P.x-r.position.x, dz=P.z-r.position.z, d=Math.hypot(dx,dz); r.rotation.y=Math.atan2(dx,dz);
    const isLit=this.lit(dx,dz,d), shelter=sz||this.moonAt(P.x,P.z);       // 조작실 · 놀이기구 · 달빛 웅덩이 안에서는 잡히지 않는다
    if(d<this.RADIUS&&!this.near){ this.near=true; this.litT=0; this.darkT=0; this.laughT=this.LAUGH_GAP; this.laugh(d); }
    if(this.near){ this.laughT-=dt; if(this.laughT<=0){ this.laughT=this.LAUGH_GAP; this.laugh(d); }
      if(isLit){ this.litT+=dt; this.darkT=0; if(this.litT>=this.NEED) return this.vanish(); }
      else { this.litT=Math.max(0,this.litT-dt*.5); if(shelter) this.darkT=0; else { this.darkT+=dt; if(this.darkT>=this.GRACE) return this.grab(); } }
      if(d>this.RADIUS*1.7) this.near=false; }
    if(isLit){ mx.timeScale=0; return; }                                       // 불빛 안에서는 굳는다
    const st=this.SPEED*dt, ux=dx/d, uz=dz/d, x=r.position.x, z=r.position.z; let moved=false;
    if(d>this.CATCH*.8){
      if(!this.blk(x+ux*st,z+uz*st)){ r.position.x+=ux*st; r.position.z+=uz*st; moved=true; }
      else if(Math.abs(ux)>.2&&!this.blk(x+Math.sign(ux)*st,z)){ r.position.x+=Math.sign(ux)*st; moved=true; }
      else if(Math.abs(uz)>.2&&!this.blk(x,z+Math.sign(uz)*st)){ r.position.z+=Math.sign(uz)*st; moved=true; } }
    r.position.y=floorAt(r.position.x,r.position.z); mx.timeScale=moved?1:0;
    if(!moved){ this.stuck+=dt; if(this.stuck>7) return this.vanish(); } else this.stuck=0;      // 막혀서 못 오면 (내가 달빛 · 조작실 안) 한참 뒤 스스로 사라진다
    if(!shelter&&d<this.CATCH) this.grab(); } };

ROOMS.push({id:'hunt', build(){
    const fx=document.createElement('div'); fx.id='thumpfx'; document.body.appendChild(fx);
    // 달빛 웅덩이 : 바닥의 푸른 빛 (추격이 시작되면 보인다 · 붉은 달 뒤에는 붉게)
    HUNT.MOON.forEach(p=>{ const g=new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CircleGeometry(p.r,40),new THREE.MeshBasicMaterial({color:0x8fb0ff,transparent:true,opacity:.08,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending})));
      g.add(new THREE.Mesh(new THREE.RingGeometry(p.r-.14,p.r,48),new THREE.MeshBasicMaterial({color:0xb9ccff,transparent:true,opacity:.5,depthWrite:false,depthTest:false,side:THREE.DoubleSide})));
      g.renderOrder=5; g.rotation.x=-Math.PI/2;      /* 포장된 단이 바닥보다 조금 높은 곳이 있어 깊이 검사 없이 늘 보이게 */ g.position.set(p.x,floorAt(p.x,p.z)+.04,p.z); g.visible=false; WORLD.add(g); HUNT.pools.push(g); });
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
