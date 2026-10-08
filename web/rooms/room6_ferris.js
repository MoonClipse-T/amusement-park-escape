/* ============================================================
   방 6 : 관람차 (일정한 빠르기로 원을 그리며 도는 놀이기구)   [9과05-03 알짜힘과 운동 상태 변화 — 운동 방향만 변하는 운동]
   흐름 : 자이로드롭 두 번째 탑승 뒤 추격 시작 (hunt.js) → 관람차 조작실 (달토끼는 조작실 안으로 못 들어온다)
        → 「점검 방법」 : ① 전원을 켜고 밖에 나가 관람차가 일정한 빠르기로 도는지 본다 ② 덜컹거리면 조절 장치에서 곤돌라 4개의 알짜힘 방향을 맞춘다 (빠르기 조절은 건드리지 않는다) ③ 밖에서 다시 확인 ④ 전원 종료
        → 전원 ON → 밖에 나가 관람차를 바라보면 : 빨라졌다 느려졌다 덜컹거린다 (알짜힘 방향이 운동 방향과 나란하게 틀어져 있다) → 조작실로
        → 조절 장치 화면 (한 문제) : 곤돌라 4개(위 · 왼쪽 · 아래 · 오른쪽)를 눌러 알짜힘 화살표를 돌린다 → 모두 **중심 쪽** (운동 방향과 수직)
                                   빠르기 조절(▲ ▼)은 **원래 빠르기(0)** 그대로 — 빠르기를 바꾸면 관람차가 정해진 빠르기로 돌지 못한다
        → 밖에 나가 관람차가 일정한 빠르기로 부드럽게 도는지 확인 → 전원 OFF → 다음 점검 : 바이킹 (rooms/room7_viking.js)
   조작반 : 전원 장치(IT_fpower · IT_flamp) · 조절 장치(IT_fforce 다이얼 · IT_fscreen 화면) — gyro_drop.py 의 _console
   ★ 글은 아래 ROOM6 에서 고친다
   ============================================================ */
'use strict';
const ROOM6={ manual:{title:'관람차 야간 점검 방법',
  body:DOC(['조작반 <b>전원 ON</b> → 밖에 나가 관람차가 <b>일정한 빠르기</b>로 도는지 <b>지켜본다.</b>','일정하지 않으면 조작반의 <b>조절 장치</b>로 곤돌라를 맞춘다.','다시 밖에 나가 <b>일정한 빠르기</b>로 도는지 확인한다.','!점검이 끝나면 <b>전원을 끈다.</b>'])},
  W:.22, watch:9 };      // 관람차가 도는 빠르기(rad/s) · 밖에서 지켜봐야 하는 시간(초) — 곤돌라가 여러 번 지나간다
SIGNS.booth_ferris=['관람차 조작실','MOON WHEEL CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.manual_ferris=['점검 방법','관람차 · 야간 점검','#fbf6e8','#2f4f7a'];
SIGNS.fpower=['전원','POWER','#111111','#f2c230']; SIGNS.fforce=['알짜힘 · 빠르기 조절','NET FORCE · SPEED','#111111','#7dffb0'];

(function(){
  const R=ROOM6, st={power:false,fixed:false};
  const spot=()=>PARK.spots.booth_ferris||{x:-40.3,z:-19.4};
  const inBooth=()=>P.x>-43.35&&P.x<-41.05&&P.z>-20.95&&P.z<-18.65;
  const WHEEL={x:-34,z:-26};                                             // 관람차 가운데 (바라보는지 판정)
  const looking=()=>{ const dx=WHEEL.x-P.x, dz=WHEEL.z-P.z, d=Math.hypot(dx,dz); return !inBooth()&&d<60&&(-Math.sin(P.yaw)*dx-Math.cos(P.yaw)*dz)/d>.72; };

  /* ---------- 조절 장치 화면 : 곤돌라 4개의 알짜힘 화살표 (눌러서 90° 씩 돌린다) + 빠르기 ▲ ▼ (원래 빠르기 = 0) ---------- */
  const el=$('#ferrispad'), cv=$('#wcv'), g=cv.getContext('2d'), go=el.querySelector('.fgo'), rng=el.querySelector('.wrange'), sval=el.querySelector('.wval'); let watchT=0;
  // 화면에서 관람차는 반시계 방향으로 돈다. 방향 : 0 오른쪽 · 1 위 · 2 왼쪽 · 3 아래 (화면 기준)
  const G=[{n:'가',a:90,mv:2,in:3},{n:'나',a:180,mv:3,in:0},{n:'다',a:270,mv:0,in:1},{n:'라',a:0,mv:1,in:2}];      // 위 · 왼쪽 · 아래 · 오른쪽 곤돌라 : 운동 방향 mv · 중심 쪽 in
  const V=[[1,0],[0,-1],[-1,0],[0,1]], CX=250, CY=225, RAD=150;
  const pad={dir:G.map(q=>q.mv),speed:0,pick:null,done:false};
  const pos=q=>[CX+RAD*Math.cos(q.a*Math.PI/180),CY-RAD*Math.sin(q.a*Math.PI/180)];
  function msg(h,ok){ const m=el.querySelector('.fmsg'); m.innerHTML=h; m.className='fmsg'+(ok?' ok':''); }
  function arrow(x,y,d,len,c,w){ const [ux,uy]=V[d], x2=x+ux*len, y2=y+uy*len; g.strokeStyle=g.fillStyle=c; g.lineWidth=w; g.beginPath(); g.moveTo(x,y); g.lineTo(x2-ux*12,y2-uy*12); g.stroke();
    g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-ux*18-uy*11,y2-uy*18+ux*11); g.lineTo(x2-ux*18+uy*11,y2-uy*18-ux*11); g.fill(); }
  function draw(){ const W=720, H=440, F='"Noto Sans KR","Malgun Gothic",sans-serif'; g.fillStyle='#0e1013'; g.fillRect(0,0,W,H);
    g.strokeStyle='#6a4a3a'; g.lineWidth=8; g.beginPath(); g.arc(CX,CY,RAD,0,7); g.stroke(); g.lineWidth=2; g.strokeStyle='#4a3a30';
    for(let k=0;k<16;k++){ const a=k*Math.PI/8; g.beginPath(); g.moveTo(CX,CY); g.lineTo(CX+RAD*Math.cos(a),CY+RAD*Math.sin(a)); g.stroke(); }
    g.fillStyle='#8a6a4a'; g.beginPath(); g.arc(CX,CY,12,0,7); g.fill();
    // 도는 방향 (반시계) · 빠르기
    g.strokeStyle='#cfc8b8'; g.lineWidth=3; g.beginPath(); g.arc(CX,CY,52,-.3,-2.6,true); g.stroke(); const ax=CX+52*Math.cos(-2.6), ay=CY+52*Math.sin(-2.6);
    g.fillStyle='#cfc8b8'; g.beginPath(); g.moveTo(ax-2,ay+13); g.lineTo(ax-11,ay-4); g.lineTo(ax+9,ay-3); g.fill();
    g.font='700 22px '+F; g.textAlign='center'; g.fillStyle=pad.speed?'#ff8a7a':'#cfc8b8'; g.fillText(pad.speed?`빠르기 ${pad.speed>0?'+':''}${pad.speed}`:'지금 빠르기',CX,CY+82);
    const L=74*(1+pad.speed*.18);
    G.forEach((q,i)=>{ const [x,y]=pos(q); arrow(x,y,q.mv,L,'#f2c230',5); arrow(x,y,pad.dir[i],56,'#6fb7ff',9);
      g.fillStyle='#c8322a'; g.strokeStyle=pad.pick===i?'#fff':'#1b1b1b'; g.lineWidth=3; g.beginPath(); g.arc(x,y,26,0,7); g.fill(); g.stroke();
      g.fillStyle='#fff'; g.font='700 22px '+F; g.textAlign='center'; g.fillText(q.n,x,y+8); });
    // 범례
    g.textAlign='left'; g.font='700 22px '+F; arrow(470,96,0,60,'#f2c230',5); g.fillStyle='#f2c230'; g.fillText('운동 방향',545,103);
    arrow(470,146,0,60,'#6fb7ff',9); g.fillStyle='#6fb7ff'; g.fillText('알짜힘',545,153);
    g.fillStyle='#cfc8b8'; g.font='500 20px '+F; ['곤돌라(가~라)를 누르면','알짜힘 화살표가 돌아간다.','아래 막대는 빠르기 조절.'].forEach((l,k)=>g.fillText(l,470,200+k*24)); }
  function showPad(){ pad.done=false; pad.pick=null; go.textContent='확인'; msg(''); rng.value=pad.speed; sval.textContent=(pad.speed>0?'+':'')+pad.speed;
    el.querySelector('.fq').innerHTML='관람차가 <b>일정한 빠르기</b>로 원을 그리며 돌도록, 네 곤돌라의 <b>알짜힘 방향</b>과 <b>빠르기</b>를 맞추자.'; draw(); }
  function openPad(){ showPad(); ov('#ferrispad',true); AUDIO.click(); }
  function check(){ if(pad.done){ AUDIO.click(); ov('#ferrispad',false); return solved(); }
    const bad=G.map((q,i)=>pad.dir[i]===q.in?0:(pad.dir[i]-q.mv)%2===0?1:2);      // 0 맞음 · 1 운동 방향과 나란함 · 2 바깥쪽
    if(pad.speed){ AUDIO.err(); return msg(`빠르기를 ${pad.speed>0?'올리면':'내리면'} 곤돌라가 원래와 다른 빠르기로 돈다. 밖에서 본 관람차는 — 빠르기가 문제였을까?`); }
    if(bad.every(b=>!b)){ AUDIO.ok(); pad.done=true; S.flags.ferris_step=1; go.textContent='닫기';
      return msg('네 곤돌라 모두 알짜힘이 <b>원의 중심 쪽</b> — 운동 방향과 <b>수직</b>이다. 빠르기는 그대로이고 <b>운동 방향만</b> 계속 꺾이며 원을 그린다.',true); }
    AUDIO.err(); msg(bad.includes(1)?'운동 방향과 <b>나란한</b> 알짜힘은 빠르기를 바꾼다 (자이로드롭처럼). 관람차는 빠르기가 일정해야 한다 — 알짜힘은 운동 방향과 <b>수직</b>.'
      :'수직이긴 한데 — 바깥쪽으로 힘을 받으면 곤돌라가 원 밖으로 벗어난다. 원을 그리게 <b>붙잡아 주는</b> 쪽은 어디일까?'); }
  cv.addEventListener('pointerdown',e=>{ if(pad.done) return; const r=cv.getBoundingClientRect(), x=(e.clientX-r.left)*cv.width/r.width, y=(e.clientY-r.top)*cv.height/r.height;
    const i=G.findIndex(q=>{ const [gx,gy]=pos(q); return Math.hypot(gx-x,gy-y)<72; }); if(i<0) return; pad.dir[i]=(pad.dir[i]+1)%4; pad.pick=i; AUDIO.tick(); msg(''); draw(); });
  rng.addEventListener('input',()=>{ if(pad.done){ rng.value=pad.speed; return; } pad.speed=+rng.value; sval.textContent=(pad.speed>0?'+':'')+pad.speed; AUDIO.tick(); msg(''); draw(); });      // 빠르기 막대 (밀어서 조절)
  go.onclick=check;
  async function solved(){ st.fixed=true; S.flags.ferris_set=true; watchT=0; drawScreen(); AUDIO.tone(700,.12,'sine',.12); setGoal(null);
    await mono(['알짜힘을 전부 중심 쪽으로 맞췄다.','점검 방법 3번 — 밖에 나가서 일정한 빠르기로 도는지 지켜보자.']);
    objective('밖에 나가 관람차가 도는 모습을 지켜보자'); setGoal(WHEEL.x+8,WHEEL.z+6,'관람차'); }

  /* ---------- 조작실 : 점검 방법 · 전원 장치 · 조절 장치 ---------- */
  let scr=null;
  function lamp(on){ const o=PARK.items.flamp; o&&o.traverse(m=>{ if(m.material){ m.material.color.setHex(on?0x3ddc84:0x2c312c); m.material.emissive.setHex(0x3ddc84); m.material.emissiveIntensity=on?1.4:0; } }); }
  function drawScreen(){ if(!scr) return; const q=scr.g, w=scr.w, h=scr.h, F='"Noto Sans KR","Malgun Gothic",sans-serif'; q.fillStyle=st.power?'#07130d':'#050607'; q.fillRect(0,0,w,h); q.textAlign='center';
    if(!st.power){ q.fillStyle='#2f3d36'; q.font='700 36px '+F; q.fillText('전원 꺼짐',w/2,h/2+12); scr.tex.needsUpdate=true; return; }
    const ok=st.fixed; q.strokeStyle=ok?'#3dff8a':'#ff6a50'; q.lineWidth=6; q.strokeRect(4,4,w-8,h-8);
    q.fillStyle='#7dffb0'; q.font='700 30px '+F; q.fillText('곤돌라 알짜힘 방향 · 빠르기',w/2,50);
    q.strokeStyle='#9dffc4'; q.lineWidth=5; q.beginPath(); q.arc(w/2,150,58,0,7); q.stroke();
    [[0,-1],[1,0],[0,1],[-1,0]].forEach(([ux,uy])=>{ const x=w/2+ux*58, y=150+uy*58, dx=ok?-ux:-uy, dy=ok?-uy:ux; q.strokeStyle=q.fillStyle=ok?'#3dff8a':'#ff8a7a'; q.lineWidth=5;
      q.beginPath(); q.moveTo(x,y); q.lineTo(x+dx*30,y+dy*30); q.stroke(); q.beginPath(); q.arc(x+dx*30,y+dy*30,6,0,7); q.fill(); q.fillStyle='#e8fff0'; q.beginPath(); q.arc(x,y,8,0,7); q.fill(); });
    q.fillStyle=ok?'#3dff8a':'#ff8a7a'; q.font='700 28px '+F; q.fillText(ok?'● 설정 완료':'▲ 확인 필요',w/2,262); scr.tex.needsUpdate=true; }
  async function readManual(){ AUDIO.click(); await showMsg(R.manual.title,R.manual.body);
    if(S.flags.manual_ferris) return; S.flags.manual_ferris=true; INV.note('manual_ferris',R.manual.title,R.manual.body); setGoal(null);
    await mono(['관람차는 타 보라는 말이 없다. …다행이다.','전원을 켜고, 밖에서 일정한 빠르기로 도는지 보면 된다.']); objective('조작반의 전원 버튼을 누르자'); const c=itemPos('fpower'); if(c) setGoal(c.x,c.z,'전원 버튼'); }
  async function power(){ AUDIO.click();
    if(!S.flags.manual_ferris) return mono('…점검 방법부터 찾자.');
    if(S.flags.ferris_done) return mono('전원 버튼. 점검을 마치고 꺼 두었다.');
    if(!st.power){ st.power=true; S.flags.ferris_power=true; lamp(true); drawScreen(); AUDIO.tone(120,.4,'sawtooth',.06,0,60); AUDIO.tone(1100,.08,'square',.07,.4); await sleep(1200);
      await mono(['관람차가 돌기 시작했다. 여기서는 잘 안 보인다.','점검 방법 1번 — 밖에 나가서 어떻게 도는지 지켜보자. …조심해서.']);
      objective('밖에 나가 관람차가 도는 모습을 지켜보자'); setGoal(WHEEL.x+8,WHEEL.z+6,'관람차'); return; }
    if(st.fixed&&S.flags.ferris_seen2&&!S.flags.ferris_done){ st.power=false; S.flags.ferris_done=true; lamp(false); drawScreen(); AUDIO.tone(300,.15,'square',.08); setGoal(null);
      await mono(['관람차 점검도 끝. 전원도 껐다.','남은 점검은 바이킹 하나. …조심히 가자.']);
      objective('바이킹 조작실로 가자 — 달빛이 비치는 길로'); const v=PARK.spots.booth_viking; if(v) setGoal(v.x,v.z,'바이킹 조작실'); return; }
    mono(st.fixed?'전원 버튼. 먼저 밖에서 일정한 빠르기로 도는지 확인하자.':'전원 버튼. 점검이 끝나면 꺼야 한다.'); }
  function forceDev(){ if(!st.power){ AUDIO.click(); return mono('조절 장치. 화면이 꺼져 있다 — 전원부터 켜야 한다.'); }
    if(!S.flags.ferris_seen){ AUDIO.click(); return mono(['곤돌라의 알짜힘 방향과 빠르기를 조절하는 장치.','…먼저 밖에 나가서 관람차가 어떻게 도는지 보자.']); }
    if(!st.fixed) return openPad(); AUDIO.click(); mono('네 곤돌라 모두 알짜힘이 중심 쪽을 향한다.'); }

  /* ---------- 디버그 바로 가기 (Shift+6) ---------- */
  window.room6Done=()=>{ room5Done(); st.power=false; st.fixed=true; Object.assign(S.flags,{ferris_arrive:true,manual_ferris:true,ferris_power:true,ferris_seen:true,ferris_set:true,ferris_seen2:true,ferris_done:true}); };
  CHECKPOINTS.push({key:'6',name:'관람차 조작실 앞',go(){ room5Done(); S.flags.ferris_arrive=true; const s=spot(); warp(s.x+2.4,s.z,s.x,s.z); objective('관람차 조작실에서 점검 방법을 찾자'); }});

  ROOMS.push({id:'room6', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    if(I.flamp) I.flamp.traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    add('manual_ferris','관람차 야간 점검 방법',readManual,2.4,inBooth);
    const big=(k,name,fn,w,h,d)=>{ const p=itemPos(k); if(!p) return; const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),PICK); box.position.copy(p); WORLD.add(box); INTER.push({mesh:box,name,range:2.8,fn,enabled:inBooth}); };
    big('fpower','전원 버튼',power,.5,.34,.5); big('fforce','조절 장치 (알짜힘 방향 · 빠르기)',forceDev,.6,.3,.6);      // 버튼 · 다이얼이 작아서 둘레를 넓게 잡는다
    add('fscreen','조절 장치 화면',forceDev,2.6,inBooth);
    add('mic_ferris','안내 방송 마이크',()=>{ AUDIO.click(); mono('…방송이 켜지지 않는다.'); },2.4,inBooth);
    if(I.fscreen){ scr=screenOn(I.fscreen,{x:-42.2,z:-19.8}); drawScreen(); }
  },
  load(){ const f=S.flags; if(!f.gyro_done||f.ferris_done) return; st.power=!!f.ferris_power; st.fixed=!!f.ferris_set; lamp(st.power); drawScreen(); },
  tick(dt){ if(S.stage!=='night') return; const f=S.flags, A=PARK.anim.wheel;
    // 관람차 : 고치기 전엔 빨라졌다 느려졌다 덜컹거리고(알짜힘이 운동 방향과 나란), 고친 뒤엔 일정한 빠르기로 돈다
    if(st.power&&A){ const w=st.fixed?R.W:R.W*(1+.9*Math.sin(S.t*3.1))*(Math.sin(S.t*.9)>.72?0:1); A.rotation.z+=dt*w; PARK.gondolas.forEach(q=>q.rotation.z=-A.rotation.z);
      if(!st.fixed&&Math.sin(S.t*.9)>.72&&Math.sin((S.t-dt)*.9)<=.72&&Math.hypot(P.x+34,P.z+26)<40) AUDIO.noise(.25,.25,0,300); }       // 덜컹
    if(S.busy||!P.free) return;
    if(f.gyro_done&&!f.ferris_arrive){ const s=spot();
      if(Math.hypot(P.x-s.x,P.z-s.z)<8){ f.ferris_arrive=true; setGoal(null);
        mono(['관람차. 어둠 속에 멈춰 서 있다.','조작실은 저기다. 안으로 들어가면 — 그것은 못 들어온다.']).then(()=>{ objective('관람차 조작실에서 점검 방법을 찾자'); const m=itemPos('manual_ferris'); if(m) setGoal(m.x,m.z,'점검 방법'); }); } }
    // 밖에서 관람차를 지켜보면 (R.watch 초 — 곤돌라가 여러 번 지나가는 동안, 학생이 직접 판단하게) : 고치기 전 — 덜컹거림 / 고친 뒤 — 일정한 빠르기
    if(st.power&&looking()&&(!f.ferris_seen||st.fixed&&!f.ferris_seen2)) watchT+=dt;
    if(st.power&&!f.ferris_seen&&watchT>=R.watch){ f.ferris_seen=true; watchT=0; setGoal(null);
      mono(['…덜컹, 덜컹. 빨라졌다 느려졌다 한다.','일정한 빠르기가 아니다. 점검 방법 2번 — 조작실의 조절 장치로 맞추자.']).then(()=>{ objective('조작실의 조절 장치로 곤돌라의 알짜힘 방향을 맞추자'); const c=itemPos('fforce'); if(c) setGoal(c.x,c.z,'조절 장치'); }); }
    if(st.fixed&&!f.ferris_seen2&&watchT>=R.watch){ f.ferris_seen2=true; setGoal(null);
      mono(['부드럽게, 일정한 빠르기로 돈다. 덜컹거림이 없다.','알짜힘이 운동 방향과 수직 — 빠르기는 그대로, 방향만 바뀌는 운동이다.','점검 끝. 조작실로 돌아가 전원을 끄자.']).then(()=>{ objective('관람차 전원을 끄자'); const c=itemPos('fpower'); if(c) setGoal(c.x,c.z,'전원 버튼'); }); }
  }});
})();
