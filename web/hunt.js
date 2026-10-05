/* ============================================================
   HUNT : 달토끼 추격 · 찢어진 일지 조각
   달토끼의 정체 (김근수의 일지 조각을 처음 점검 장소부터 하나씩 주우며 알게 된다)
     처음엔 야간 근무자에게 장난을 친다 (물건을 옮기고, 놀이기구를 망가뜨리고, 킥킥 웃는다)
     → 장난에 싫증이 나면 배가 고파진다 → 배가 고프면 절구를 찧는다 (쿵, 쿵)
   추격 규칙 (자이로드롭 전원을 끈 뒤 HUNT.start() 부터)
     · 절구 소리(쿵)가 나는 동안에만 움직인다. 소리가 멎으면 그 자리에 굳는다
     · 손전등으로 비추고 있으면 소리가 나도 움직이지 못한다
     · 조작실 · 놀이기구(SAFE) 안으로는 들어오지 못한다
     · 유인 : 놀이기구가 돌아가면 그쪽으로 구경하러 간다 (장난치던 버릇) — HUNT.lureAt(x, z, 초, 이름). 구경하는 동안은 나를 쫓지 않는다
       (회전목마 레버 · 점검을 끝낸 관람차의 전원 버튼 · 돌아가는 바이킹)
     · 잡히면 — 얼굴이 화면 가득 (점프 스케어) → 마지막에 들른 조작실에서 깨어나고 공원 시간 30분이 지나간다
   소리는 web/assets/sfx/ (ElevenLabs 로 만든 thump · thump2 · scare · giggle)
   ★ 빠르기 · 간격 · 벌칙은 아래 HUNT 의 숫자, 일지 글은 SCRAPS 에서 고친다
   ============================================================ */
'use strict';

/* 바닥에 떨어진 일지 조각 : at = 게임 좌표 (조작실 바닥). ④ 는 자이로드롭 조작실 책상 위 (room5_gyro.js) */
const SCRAPS=[
  {id:'scrap1', at:[-18.8,14.5], rot:.5, title:'찢어진 일지 ①',
   body:'<i>…첫째 주.</i><br>밤마다 물건이 옮겨져 있다.<br>오늘은 회전목마 <b>5번 말</b>이 기둥에서 빠져 있었다. 내가 한 게 아니다.<br>멀리서 <b>킥킥</b> 웃는 소리.<br>누가 장난을 치는 것 같다.',
   say:['찢어진 종이. 김근수 씨의 일지 조각 같다.','5번 말이 빠져 있던 게… 누가 장난친 거라고?'], sfx:'giggle'},
  {id:'scrap2', at:[-38.7,30.7], rot:-.3, title:'찢어진 일지 ②',
   body:'<i>…둘째 주.</i><br>범퍼카가 혼자 굴러와 있다. 바닥엔 누가 윤활유를 엎질러 놨다.<br>보닛 위에 <b>토끼 인형</b>. 아까는 없었다.<br>장난이 점점 심해진다.<br>그래도 아직은 — 장난이다.',
   say:['또 일지 조각이다.','…장난이 점점 심해진다고.']},
  {id:'scrap3', at:[22.4,1.5], rot:.9, title:'찢어진 일지 ③',
   body:'<i>…셋째 주.</i><br>보트에 자석을 잔뜩 붙여 놓은 것도 그 녀석이다. 물에 빠진 나를 보고 웃었다.<br>광장의 <b>달토끼</b>가 어제와 다른 쪽을 보고 있다.<br>요즘은 웃지 않는다.<br><b>장난에 싫증이 난 것 같다.</b> 가만히 서서 나를 본다.',
   say:['…달토끼가, 다른 쪽을 보고 있었다고.','장난에 싫증이 나면 — 그다음엔 뭘 하는 거지.']},
  {id:'scrap5', at:[-42.7,-19.1], rot:-.6, title:'찢어진 일지 ⑤',
   body:'<i>…보름밤.</i><br>달이 붉어지면 달이 <b>눈을 뜬다.</b><br>그때부터는 숨어도 소용없다. 달이 그 녀석에게 내가 어디 있는지 알려 준다.<br>새벽 6시. <b>달이 질 때까지만</b> 버티면 —',
   say:['달이… 눈을 뜬다고?','새벽 6시. 달이 질 때까지.']},
];

const HUNT={on:false, rab:null, phase:'quiet', t:0, beat:0, n:0, stuck:0, busy:false, lastSafe:null, shake:0, lure:null,
  QUIET:[12,18], THUMP:[7,10],      // 조용한 시간 · 절구 소리가 나는 시간 (초, 그 사이에서 무작위)
  SPEED:2.0, CATCH:1.3,             // 달토끼가 걷는 빠르기 (플레이어 걷기 2.6 · 달리기 4.2 m/s) · 잡히는 거리
  LIGHT_R:24, LIGHT_A:.34,          // 손전등이 닿는 거리 · 비추는 각도 (라디안, 화면 가운데에서)
  PENALTY:150,                      // 잡혔을 때 줄어드는 시간 (초) = 공원 시간 30분
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
  // 달토끼가 설 수 없는 자리 : 공원 밖 · 안전한 곳 · 벽 · 기둥 · 높은 단
  blk(x,z){ const B=PARK.bounds, r=.45; if(x<B.x1+1||x>B.x2-1||z<B.z1+1||z>B.z2-1||this.safeAt(x,z)||ledgeAt(x,z)>.3) return true;
    for(const b of COL){ if(b.on&&!b.on()) continue; if(x+r>b.x1&&x-r<b.x2&&z+r>b.z1&&z-r<b.z2) return true; }
    for(const c of CIRC){ if(c.on&&!c.on()) continue; const dx=x-c.x, dz=z-c.z, rr=c.r+r; if(dx*dx+dz*dz<rr*rr) return true; } return false; },
  // (x1,z1) 에서 (x2,z2) 쪽으로 곧장 걸어갈 수 있는가 (끝의 stop m 는 보지 않는다 — 목표가 조작실 안일 수 있다)
  clear(x1,z1,x2,z2,stop=2.5){ const len=Math.hypot(x2-x1,z2-z1), n=Math.ceil(len/1.2); for(let i=1;i<n;i++){ const t=i/n; if(len*(1-t)<stop) break; if(this.blk(x1+(x2-x1)*t,z1+(z2-z1)*t)) return false; } return true; },
  start(){ if(this.on) return; if(!this.rab){ const o=MOONRABBIT.make('Walk'); MOONRABBIT.face(o,1); o.visible=false; o.userData.mixer.timeScale=0; scene.add(o); this.rab=o; }
    this.on=true; this.phase='quiet'; this.t=6; },
  stop(){ this.on=false; this.lure=null; if(this.rab) this.rab.visible=false; },
  // 유인 : (x, z) 에 있는 놀이기구가 돌아간다 → sec 초 동안 그쪽으로 가서 구경한다. 너무 멀리 있으면 그 근처에서 나타난다
  lureAt(x,z,sec,name){ if(!this.on||!this.rab||this.busy) return false; const r=this.rab; this.lure={x,z,until:S.t+sec,name};
    if(!r.visible||Math.hypot(r.position.x-x,r.position.z-z)>24||!this.clear(r.position.x,r.position.z,x,z,3.5)){ for(let k=0;k<40;k++){ const a=Math.random()*6.28, d=11+Math.random()*6, px=x+Math.sin(a)*d, pz=z+Math.cos(a)*d;
        if(this.blk(px,pz)||Math.hypot(px-P.x,pz-P.z)<7||(k<34&&!this.clear(px,pz,x,z,3.5))) continue; r.position.set(px,floorAt(px,pz),pz); r.visible=true; break; } }
    toast('달토끼가 '+name+' 쪽으로 간다',2800); return true; },
  lureOff(name){ if(this.lure&&(!name||this.lure.name===name)) this.lure=null; },
  // 지금 이 자리에 세우고 바로 절구 소리를 낸다 (첫 만남)
  appear(x,z,sec=9){ const r=this.rab; r.position.set(x,floorAt(x,z),z); r.visible=true; r.rotation.y=Math.atan2(P.x-x,P.z-z); this.phase='thump'; this.t=sec; this.beat=.3; },
  // 절구 소리가 다시 시작될 때 : 너무 멀거나 막혀 있으면 플레이어 등 뒤 어딘가로 옮겨 선다
  relocate(near){ const r=this.rab; for(let k=0;k<40;k++){ const back=k<28, a=P.yaw+(back?Math.PI:0)+(Math.random()-.5)*(back?2.2:6.28), dist=(near?9:13)+Math.random()*6;
      const x=P.x-Math.sin(a)*dist, z=P.z-Math.cos(a)*dist; if(this.blk(x,z)||(k<34&&!this.clear(x,z,P.x,P.z))) continue; r.position.set(x,floorAt(x,z),z); r.visible=true; return true; } return false; },      // 되도록 벽에 막히지 않는 자리
  // 손전등 불빛 안에 있는가
  lit(dx,dz,d){ if(!S.torch||d>this.LIGHT_R) return false; const cp=Math.cos(P.pitch), fx=-Math.sin(P.yaw)*cp, fy=Math.sin(P.pitch), fz=-Math.cos(P.yaw)*cp;
    const vy=this.rab.position.y+1.3-(P.y+P.eye), L=Math.hypot(dx,vy,dz)||1; return (-fx*dx+fy*vy-fz*dz)/L>Math.cos(this.LIGHT_A); },
  thump(d){ this.n++; AUDIO.sfx(this.n%2?'thump':'thump2',clamp(1.3-d/38,.4,1.15)); const fx=$('#thumpfx'); fx.classList.add('hit'); setTimeout(()=>fx.classList.remove('hit'),90); },
  // 잡혔다 : 얼굴이 화면 가득 → 암전 → 마지막에 들른 조작실에서 깨어난다
  async caught(){ this.busy=true; P.free=false; const r=this.rab, f0=camera.fov, s=r.scale.x;
    if(!S.torch&&S.flags.torch) toggleLight();
    AUDIO.sfx('scare',1.3); AUDIO.tone(1900,1.0,'sawtooth',.2,0,-1400); AUDIO.noise(.8,.6,0,3000); AUDIO.tone(60,1.2,'sine',.6,0,-25);
    const fx=-Math.sin(P.yaw), fz=-Math.cos(P.yaw); P.pitch=0; P.vx=P.vz=0;
    r.position.set(P.x+fx*1.75,P.y+P.eye-1.33*s,P.z+fz*1.75); r.rotation.set(0,Math.atan2(-fx,-fz),0); r.userData.mixer.timeScale=0; r.visible=true;
    camera.fov=64; camera.updateProjectionMatrix(); zoom(40,200); this.shake=1.2;      // 얼굴이 화면으로 확 다가온다 $('#thumpfx').classList.add('hit');
    await sleep(1300); $('#fade').classList.remove('clear'); await sleep(900);
    this.shake=0; r.visible=false; $('#thumpfx').classList.remove('hit'); camera.fov=f0; camera.updateProjectionMatrix();
    timeLeft=Math.max(45,timeLeft-this.PENALTY); const sp=this.lastSafe||this.SAFE[4]; warp(sp.in[0],sp.in[1]); this.phase='quiet'; this.t=18;
    $('#fade').classList.add('clear'); await sleep(700); this.busy=false; S.flags.caught=(S.flags.caught||0)+1;
    await mono(['…헉!','정신을 차려 보니 '+sp.n+' 바닥이다.','시계가 한참 지나 있다. …다시는 잡히면 안 된다.']); toast('공원 시간 30분이 지나갔다',3000); },
  tick(dt){ if(this.shake>0){ camera.rotation.z=Math.sin(S.t*61)*.035*this.shake; camera.position.x+=Math.sin(S.t*47)*.012*this.shake; }
    if(!this.on||!this.rab||this.busy) return; const r=this.rab, mx=r.userData.mixer, rnd=a=>a[0]+Math.random()*(a[1]-a[0]);
    const sz=this.safeAt(P.x,P.z); if(sz&&sz.in) this.lastSafe=sz;
    if(S.busy||!P.free||S.paused){ mx.timeScale=0; return; }                  // 글을 읽거나 놀이기구를 타는 동안은 멈춰 있다
    if(this.lure&&S.t>this.lure.until) this.lure=null; const L=this.lure;                 // 유인 중이면 놀이기구 쪽이 목표
    this.t-=dt; const px=P.x-r.position.x, pz=P.z-r.position.z, pd=r.visible?Math.hypot(px,pz):99, dx=L?L.x-r.position.x:px, dz=L?L.z-r.position.z:pz, d=r.visible?Math.hypot(dx,dz):99;
    if(this.phase==='quiet'){ mx.timeScale=0;
      if(this.t<=0){ this.phase='thump'; this.t=rnd(this.THUMP); this.beat=0; if(!L&&(!r.visible||d>30||this.stuck>2.5)) this.relocate(!!sz); this.stuck=0; } return; }
    this.beat-=dt; if(this.beat<=0){ this.beat=.95; this.thump(pd); }          // 쿵… 쿵…
    if(this.t<=0){ this.phase='quiet'; this.t=rnd(this.QUIET); mx.timeScale=0; return; }
    if(!r.visible) return; r.rotation.y=Math.atan2(dx,dz);
    if(this.lit(px,pz,pd)){ mx.timeScale=0; return; }                         // 불빛 안에서는 굳는다
    const st=this.SPEED*dt, ux=dx/d, uz=dz/d, x=r.position.x, z=r.position.z; let moved=false;
    if(d>(L?3.2:this.CATCH*.8)){
      if(!this.blk(x+ux*st,z+uz*st)){ r.position.x+=ux*st; r.position.z+=uz*st; moved=true; }
      else if(Math.abs(ux)>.2&&!this.blk(x+Math.sign(ux)*st,z)){ r.position.x+=Math.sign(ux)*st; moved=true; }
      else if(Math.abs(uz)>.2&&!this.blk(x,z+Math.sign(uz)*st)){ r.position.z+=Math.sign(uz)*st; moved=true; } }
    r.position.y=floorAt(r.position.x,r.position.z); mx.timeScale=moved?1:0; if(!moved&&!sz) this.stuck+=dt;
    if(!L&&!sz&&d<this.CATCH) this.caught(); } };

ROOMS.push({id:'hunt', build(){
    const fx=document.createElement('div'); fx.id='thumpfx'; document.body.appendChild(fx);
    // 일지 조각 : 가장자리가 찢긴 공책 종이 한 장 (어두워도 희미하게 보인다)
    const tex=cvs(256,192,(g,w,h)=>{ g.clearRect(0,0,w,h); g.fillStyle='#e9dfc0'; g.beginPath(); const P=[[8,14],[40,4],[78,12],[120,3],[160,13],[204,5],[246,16],[250,60],[240,100],[252,140],[244,182],[200,176],[160,188],[118,178],[76,188],[36,178],[6,186],[12,140],[4,96],[14,56]];
      P.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); g.fill(); g.save(); g.clip();
      g.strokeStyle='rgba(120,140,170,.7)'; g.lineWidth=1.5; for(let y=34;y<h;y+=22){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); }
      g.strokeStyle='rgba(30,40,70,.85)'; g.lineWidth=2.2; for(let y=30;y<h-20;y+=22){ g.beginPath(); let x=26; g.moveTo(x,y); while(x<w-30-Math.random()*60){ x+=6+Math.random()*8; g.lineTo(x,y-3+Math.random()*6); } g.stroke(); }
      g.fillStyle='rgba(110,70,25,.25)'; g.beginPath(); g.arc(200,150,34,0,7); g.fill(); g.restore(); });
    HUNT.scrap=(x,y,z,rot)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(.36,.27),new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.5,roughness:.9,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.3,side:THREE.DoubleSide}));
      m.rotation.set(-Math.PI/2,0,rot); m.position.set(x,y,z); WORLD.add(m); return m; };
    SCRAPS.forEach(sc=>{ const m=HUNT.scrap(sc.at[0],floorAt(sc.at[0],sc.at[1])+.06,sc.at[1],sc.rot);
      INTER.push({mesh:m,name:'찢어진 쪽지',range:2.8,fn:async()=>{ AUDIO.noise(.12,.25,0,3200); m.visible=false; await showMsg(sc.title,TORN(sc.body)); INV.note(sc.id,sc.title,TORN(sc.body));
        if(sc.sfx) AUDIO.sfx(sc.sfx,.5); await mono(sc.say); }}); });
  },
  tick(dt){ HUNT.tick(dt); }});
