/* ============================================================
   방 6 : 관람차 (일정한 빠르기로 원을 그리며 도는 놀이기구)   [9과05-03 알짜힘과 운동 상태 변화 — 운동 방향만 변하는 운동]
   흐름 : 자이로드롭 전원 OFF → 웃음소리 · 추격 시작 (hunt.js) → 관람차 조작실 (달토끼는 조작실 안으로 못 들어온다)
        → 「점검 방법」 : ① 전원을 켜고 관람차가 일정한 빠르기로 도는지 ② 덜컹거리면 방향 조절 장치에서 곤돌라 4개의 알짜힘 방향을 맞춘다 ③ 전원 종료
        → 전원 ON : 관람차가 돌기 시작하지만 빨라졌다 느려졌다 덜컹거린다 (알짜힘 방향이 운동 방향과 나란하게 틀어져 있다)
        → 방향 조절 장치 화면
            ① 곤돌라 4개(위 · 왼쪽 · 아래 · 오른쪽)를 눌러 알짜힘 화살표를 돌린다 → 모두 **중심 쪽** (운동 방향과 수직)
            ② 알짜힘이 운동 방향과 수직일 때 변하는 것은? → **운동 방향** (빠르기는 그대로)
        → 관람차가 일정한 빠르기로 부드럽게 돈다 → 전원 OFF → 다음 점검 : 바이킹 (rooms/room7_viking.js)
        → (유인) 점검을 끝낸 뒤 전원 버튼을 다시 누르면 45초 동안 관람차가 돌고, 달토끼가 구경하러 온다
   조작반 : 전원 장치(IT_fpower · IT_flamp) · 방향 조절 장치(IT_fforce 다이얼 · IT_fscreen 화면) — gyro_drop.py 의 _console
   ★ 글은 아래 ROOM6 에서 고친다
   ============================================================ */
'use strict';
const ROOM6={ manual:{title:'관람차 야간 점검 방법',
  body:DOC(['조작반 <b>전원 ON</b> → 관람차가 <b>일정한 빠르기</b>로 도는지 본다.','덜컹거리면 조작반의 <b>방향 조절 장치</b>에서 곤돌라 4개의 <b>알짜힘 방향</b>을 맞춘다.','!점검이 끝나면 <b>전원을 끈다.</b>'],
    '※ 관람차의 곤돌라는 <b>빠르기는 변하지 않고 운동 방향만</b> 변한다. 이런 운동에서 알짜힘은 운동 방향과 <b>수직</b>이다.')} };
SIGNS.booth_ferris=['관람차 조작실','MOON WHEEL CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.manual_ferris=['점검 방법','관람차 · 야간 점검','#fbf6e8','#2f4f7a'];
SIGNS.fpower=['전원','POWER','#111111','#f2c230']; SIGNS.fforce=['알짜힘 방향 조절','NET FORCE DIRECTION','#111111','#7dffb0'];

(function(){
  const R=ROOM6, st={power:false,fixed:false};
  const spot=()=>PARK.spots.booth_ferris||{x:-40.3,z:-19.4};
  const inBooth=()=>P.x>-43.35&&P.x<-41.05&&P.z>-20.95&&P.z<-18.65;

  /* ---------- 방향 조절 화면 : 곤돌라 4개의 알짜힘 화살표 (눌러서 90° 씩 돌린다) ---------- */
  const el=$('#ferrispad'), cv=$('#wcv'), g=cv.getContext('2d'), go=el.querySelector('.fgo'), opt=el.querySelector('.wopt');
  // 화면에서 관람차는 반시계 방향으로 돈다. 방향 : 0 오른쪽 · 1 위 · 2 왼쪽 · 3 아래 (화면 기준)
  const G=[{n:'가',a:90,mv:2,in:3},{n:'나',a:180,mv:3,in:0},{n:'다',a:270,mv:0,in:1},{n:'라',a:0,mv:1,in:2}];      // 위 · 왼쪽 · 아래 · 오른쪽 곤돌라 : 운동 방향 mv · 중심 쪽 in
  const V=[[1,0],[0,-1],[-1,0],[0,1]], CX=250, CY=225, RAD=150;
  const pad={step:0,dir:G.map(q=>q.mv),pick:null,done:false};
  const pos=q=>[CX+RAD*Math.cos(q.a*Math.PI/180),CY-RAD*Math.sin(q.a*Math.PI/180)];
  function msg(h,ok){ const m=el.querySelector('.fmsg'); m.innerHTML=h; m.className='fmsg'+(ok?' ok':''); }
  function arrow(x,y,d,len,c,w){ const [ux,uy]=V[d], x2=x+ux*len, y2=y+uy*len; g.strokeStyle=g.fillStyle=c; g.lineWidth=w; g.beginPath(); g.moveTo(x,y); g.lineTo(x2-ux*12,y2-uy*12); g.stroke();
    g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-ux*18-uy*11,y2-uy*18+ux*11); g.lineTo(x2-ux*18+uy*11,y2-uy*18-ux*11); g.fill(); }
  function draw(){ const W=720, H=440, F='"Noto Sans KR","Malgun Gothic",sans-serif'; g.fillStyle='#0e1013'; g.fillRect(0,0,W,H);
    g.strokeStyle='#6a4a3a'; g.lineWidth=8; g.beginPath(); g.arc(CX,CY,RAD,0,7); g.stroke(); g.lineWidth=2; g.strokeStyle='#4a3a30';
    for(let k=0;k<16;k++){ const a=k*Math.PI/8; g.beginPath(); g.moveTo(CX,CY); g.lineTo(CX+RAD*Math.cos(a),CY+RAD*Math.sin(a)); g.stroke(); }
    g.fillStyle='#8a6a4a'; g.beginPath(); g.arc(CX,CY,12,0,7); g.fill();
    // 도는 방향 (반시계)
    g.strokeStyle='#cfc8b8'; g.lineWidth=3; g.beginPath(); g.arc(CX,CY,52,-.3,-2.6,true); g.stroke(); const ax=CX+52*Math.cos(-2.6), ay=CY+52*Math.sin(-2.6);
    g.fillStyle='#cfc8b8'; g.beginPath(); g.moveTo(ax-2,ay+13); g.lineTo(ax-11,ay-4); g.lineTo(ax+9,ay-3); g.fill();
    g.font='700 17px '+F; g.textAlign='center'; g.fillText('일정한 빠르기',CX,CY+82);
    G.forEach((q,i)=>{ const [x,y]=pos(q); arrow(x,y,q.mv,74,'#f2c230',5); arrow(x,y,pad.dir[i],56,'#6fb7ff',9);
      g.fillStyle='#c8322a'; g.strokeStyle=pad.pick===i?'#fff':'#1b1b1b'; g.lineWidth=3; g.beginPath(); g.arc(x,y,20,0,7); g.fill(); g.stroke();
      g.fillStyle='#fff'; g.font='700 19px '+F; g.textAlign='center'; g.fillText(q.n,x,y+7); });
    // 범례
    g.textAlign='left'; g.font='700 19px '+F; arrow(470,96,0,60,'#f2c230',5); g.fillStyle='#f2c230'; g.fillText('운동 방향',545,103);
    arrow(470,146,0,60,'#6fb7ff',9); g.fillStyle='#6fb7ff'; g.fillText('알짜힘',545,153);
    g.fillStyle='#cfc8b8'; g.font='500 16px '+F; ['곤돌라(가~라)를 누르면','알짜힘 화살표가 돌아간다.'].forEach((l,k)=>g.fillText(pad.step?'':l,470,200+k*24));
    g.fillStyle='#8a8d93'; g.font='700 17px '+F; g.textAlign='right'; g.fillText(`${pad.step+1} / 2`,W-12,24); }
  function showStep(){ pad.done=false; pad.pick=null; opt.style.display=pad.step?'':'none'; opt.querySelectorAll('.fdir').forEach(b=>b.classList.remove('on')); go.textContent='확인'; msg('');
    el.querySelector('.fq').innerHTML=pad.step?'<b>②</b> 곤돌라에 작용하는 알짜힘은 운동 방향과 <b>수직</b>이다. 이때 곤돌라의 운동에서 <b>변하는 것</b>은?'
      :'<b>①</b> 관람차가 덜컹거린다 — 알짜힘 방향이 틀어져 있다.<br>곤돌라가 <b>일정한 빠르기로 원을 그리도록</b>, 네 곤돌라의 <b>알짜힘 방향</b>을 맞추자.'; draw(); }
  function openPad(){ pad.step=S.flags.ferris_step||0; showStep(); ov('#ferrispad',true); AUDIO.click(); }
  function right(h){ AUDIO.ok(); msg(h,true); pad.done=true; S.flags.ferris_step=pad.step+1; go.textContent=pad.step?'닫기':'다음 ▶'; }
  function check(){ if(pad.done){ AUDIO.click(); if(!pad.step){ pad.step=1; return showStep(); } ov('#ferrispad',false); return solved(); }
    if(!pad.step){ const bad=G.map((q,i)=>pad.dir[i]===q.in?0:(pad.dir[i]-q.mv)%2===0?1:2);      // 0 맞음 · 1 운동 방향과 나란함 · 2 바깥쪽
      if(bad.every(b=>!b)) return right('네 곤돌라 모두 알짜힘이 <b>원의 중심 쪽</b> — 운동 방향과 <b>수직</b>이다. 그래서 빠르기는 그대로이고, 방향만 계속 꺾이며 원을 그린다.');
      AUDIO.err(); return msg(bad.includes(1)?'운동 방향과 <b>나란한</b> 알짜힘은 빠르기를 바꾼다 (자이로드롭처럼). 관람차는 빠르기가 일정해야 한다 — 알짜힘은 운동 방향과 <b>수직</b>.'
        :'수직이긴 한데 — 바깥쪽으로 힘을 받으면 곤돌라가 원 밖으로 벗어난다. 원을 그리게 <b>붙잡아 주는</b> 쪽은 어디일까?'); }
    if(!pad.pick){ AUDIO.err(); return msg('셋 중에서 하나를 고르자.'); }
    if(pad.pick==='dir') return right('알짜힘이 운동 방향과 수직이면 <b>빠르기는 그대로</b>, <b>운동 방향만</b> 변한다 — 관람차 · 회전목마가 그런 운동이다.');
    AUDIO.err(); msg(pad.pick==='speed'?'빠르기를 바꾸려면 알짜힘이 운동 방향과 <b>나란해야</b> 한다 (자이로드롭). 관람차의 빠르기는 일정하다.':'빠르기와 방향이 <b>둘 다</b> 변하는 건 알짜힘이 비스듬할 때다 (바이킹 · 롤러코스터). 관람차의 빠르기는 일정하다.'); }
  cv.addEventListener('pointerdown',e=>{ if(pad.step||pad.done) return; const r=cv.getBoundingClientRect(), x=(e.clientX-r.left)*cv.width/r.width, y=(e.clientY-r.top)*cv.height/r.height;
    const i=G.findIndex(q=>{ const [gx,gy]=pos(q); return Math.hypot(gx-x,gy-y)<62; }); if(i<0) return; pad.dir[i]=(pad.dir[i]+1)%4; pad.pick=i; AUDIO.tick(); msg(''); draw(); });
  opt.querySelectorAll('.fdir').forEach(b=>b.onclick=()=>{ if(pad.done) return; AUDIO.tick(); pad.pick=b.dataset.d; opt.querySelectorAll('.fdir').forEach(o=>o.classList.toggle('on',o===b)); });
  go.onclick=check;
  async function solved(){ st.fixed=true; S.flags.ferris_set=true; drawScreen(); AUDIO.tone(700,.12,'sine',.12); setGoal(null);
    await mono(['덜컹거림이 멎었다. 관람차가 일정한 빠르기로 부드럽게 돈다.','알짜힘이 운동 방향과 수직 — 빠르기는 그대로, 방향만 바뀌는 운동이다.','점검 끝. 점검 방법대로 전원을 끄자.']);
    objective('관람차 전원을 끄자'); const c=itemPos('fpower'); if(c) setGoal(c.x,c.z,'전원 버튼'); }

  /* ---------- 조작실 : 점검 방법 · 전원 장치 · 방향 조절 장치 ---------- */
  let scr=null;
  function lamp(on){ const o=PARK.items.flamp; o&&o.traverse(m=>{ if(m.material){ m.material.color.setHex(on?0x3ddc84:0x2c312c); m.material.emissive.setHex(0x3ddc84); m.material.emissiveIntensity=on?1.4:0; } }); }
  function drawScreen(){ if(!scr) return; const q=scr.g, w=scr.w, h=scr.h, F='"Noto Sans KR","Malgun Gothic",sans-serif'; q.fillStyle=st.power?'#07130d':'#050607'; q.fillRect(0,0,w,h); q.textAlign='center';
    if(!st.power){ q.fillStyle='#2f3d36'; q.font='700 36px '+F; q.fillText('전원 꺼짐',w/2,h/2+12); scr.tex.needsUpdate=true; return; }
    const ok=st.fixed; q.strokeStyle=ok?'#3dff8a':'#ff6a50'; q.lineWidth=6; q.strokeRect(4,4,w-8,h-8);
    q.fillStyle='#7dffb0'; q.font='700 30px '+F; q.fillText('곤돌라 알짜힘 방향',w/2,50);
    q.strokeStyle='#9dffc4'; q.lineWidth=5; q.beginPath(); q.arc(w/2,150,58,0,7); q.stroke();
    [[0,-1],[1,0],[0,1],[-1,0]].forEach(([ux,uy])=>{ const x=w/2+ux*58, y=150+uy*58, dx=ok?-ux:-uy, dy=ok?-uy:ux; q.strokeStyle=q.fillStyle=ok?'#3dff8a':'#ff8a7a'; q.lineWidth=5;
      q.beginPath(); q.moveTo(x,y); q.lineTo(x+dx*30,y+dy*30); q.stroke(); q.beginPath(); q.arc(x+dx*30,y+dy*30,6,0,7); q.fill(); q.fillStyle='#e8fff0'; q.beginPath(); q.arc(x,y,8,0,7); q.fill(); });
    q.fillStyle=ok?'#3dff8a':'#ff8a7a'; q.font='700 28px '+F; q.fillText(ok?'● 정상 · 일정한 빠르기':'▲ 방향 오류 — 덜컹거림',w/2,262); scr.tex.needsUpdate=true; }
  async function readManual(){ AUDIO.click(); await showMsg(R.manual.title,R.manual.body);
    if(S.flags.manual_ferris) return; S.flags.manual_ferris=true; INV.note('manual_ferris',R.manual.title,R.manual.body); setGoal(null);
    await mono(['관람차는 타 보라는 말이 없다. …다행이다.','일정한 빠르기로 도는지만 보면 된다.']); objective('조작반의 전원 버튼을 누르자'); const c=itemPos('fpower'); if(c) setGoal(c.x,c.z,'전원 버튼'); }
  async function power(){ AUDIO.click();
    if(!S.flags.manual_ferris) return mono('…점검 방법부터 찾자.');
    if(S.flags.ferris_done) return lureRun();
    if(!st.power){ st.power=true; S.flags.ferris_power=true; lamp(true); drawScreen(); AUDIO.tone(120,.4,'sawtooth',.06,0,60); AUDIO.tone(1100,.08,'square',.07,.4); await sleep(1600);
      await mono(['관람차가 돌기 시작했다. 그런데… 덜컹, 덜컹.','빨라졌다 느려졌다 한다. 일정한 빠르기가 아니다.','점검 방법 2번 — 방향 조절 장치에서 알짜힘 방향을 맞추자.']);
      objective('방향 조절 장치로 곤돌라의 알짜힘 방향을 맞추자'); const c=itemPos('fforce'); if(c) setGoal(c.x,c.z,'방향 조절 장치'); return; }
    if(st.fixed&&!S.flags.ferris_done){ st.power=false; S.flags.ferris_done=true; lamp(false); drawScreen(); AUDIO.tone(300,.15,'square',.08); setGoal(null);
      await mono(['관람차 점검도 끝. 전원도 껐다.','…일지에 쓰여 있었지. 놀이기구가 돌아가면 그것이 구경하러 간다고.','급할 땐 이 전원 버튼을 다시 눌러 관람차를 돌리자. 그 틈에 지나가면 된다.','남은 점검은 바이킹 하나.']);
      objective('바이킹 조작실로 가자 (관람차를 다시 돌리면 달토끼가 구경하러 간다)'); const v=PARK.spots.booth_viking; if(v) setGoal(v.x,v.z,'바이킹 조작실'); return; }
    mono('전원 버튼. 점검이 끝나면 꺼야 한다.'); }
  // 유인 : 점검을 끝낸 관람차를 45초 동안 다시 돌린다 → 달토끼가 승강장 앞으로 구경하러 온다
  async function lureRun(){ if(st.power) return mono('관람차가 돌고 있다. 달토끼가 구경하는 동안 움직이자.');
    st.power=true; lamp(true); drawScreen(); AUDIO.tone(120,.4,'sawtooth',.06,0,60); const ok=typeof HUNT!=='undefined'&&HUNT.lureAt(-34,-20.6,45,'관람차');
    setTimeout(()=>{ st.power=false; lamp(false); drawScreen(); AUDIO.tone(300,.15,'square',.08); if(typeof HUNT!=='undefined') HUNT.lureOff('관람차'); toast('관람차가 멈췄다'); },45000);
    mono(ok?['전원을 다시 켰다. 관람차가 돈다.','…그것이 관람차 쪽으로 간다. 지금이다.']:['전원을 다시 켰다. 관람차가 돈다. 45초 뒤 저절로 꺼진다.']); }
  function forceDev(){ if(!st.power){ AUDIO.click(); return mono('방향 조절 장치. 화면이 꺼져 있다 — 전원부터 켜야 한다.'); }
    if(!st.fixed) return openPad(); AUDIO.click(); mono('네 곤돌라 모두 알짜힘이 중심 쪽을 향한다. 일정한 빠르기로 돈다.'); }

  /* ---------- 디버그 바로 가기 (Shift+6) ---------- */
  window.room6Done=()=>{ room5Done(); st.power=false; st.fixed=true; Object.assign(S.flags,{ferris_arrive:true,manual_ferris:true,ferris_power:true,ferris_set:true,ferris_done:true}); };
  CHECKPOINTS.push({key:'6',name:'관람차 조작실 앞',go(){ room5Done(); S.flags.ferris_arrive=true; const s=spot(); warp(s.x+2.4,s.z,s.x,s.z); objective('관람차 조작실에서 점검 방법을 찾자'); }});

  ROOMS.push({id:'room6', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    if(I.flamp) I.flamp.traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    add('manual_ferris','관람차 야간 점검 방법',readManual,2.4,inBooth);
    add('fpower','전원 버튼',power,2.4,inBooth);
    add('fforce','방향 조절 장치 (알짜힘 방향)',forceDev,2.4,inBooth);
    add('fscreen','방향 조절 장치 화면',forceDev,2.4,inBooth);
    add('console_ferris','관람차 조작반',()=>{ AUDIO.click(); mono(['관람차 조작반.','왼쪽은 전원 장치, 오른쪽은 곤돌라의 알짜힘 방향을 조절하는 다이얼과 화면이다.']); },2.4,inBooth);
    add('mic_ferris','안내 방송 마이크',()=>{ AUDIO.click(); mono('…전기가 나가서 방송이 켜지지 않는다.'); },2.4,inBooth);
    if(I.fscreen){ scr=screenOn(I.fscreen,{x:-42.2,z:-19.8}); drawScreen(); }
  },
  tick(dt){ if(S.stage!=='night') return; const f=S.flags, A=PARK.anim.wheel;
    // 관람차 : 고치기 전엔 빨라졌다 느려졌다 덜컹거리고(알짜힘이 운동 방향과 나란), 고친 뒤엔 일정한 빠르기로 돈다
    if(st.power&&A){ const w=st.fixed?.13:.13*(1+.9*Math.sin(S.t*3.1))*(Math.sin(S.t*.9)>.72?0:1); A.rotation.z+=dt*w; PARK.gondolas.forEach(q=>q.rotation.z=-A.rotation.z);
      if(!st.fixed&&Math.sin(S.t*.9)>.72&&Math.sin((S.t-dt)*.9)<=.72&&Math.hypot(P.x+34,P.z+26)<40) AUDIO.noise(.25,.25,0,300); }       // 덜컹
    if(f.gyro_done&&!f.ferris_arrive&&!S.busy&&P.free){ const s=spot();
      if(Math.hypot(P.x-s.x,P.z-s.z)<8){ f.ferris_arrive=true; setGoal(null);
        mono(['관람차. 어둠 속에 멈춰 서 있다.','조작실은 저기다. 안으로 들어가면 — 그것은 못 들어온다.']).then(()=>{ objective('관람차 조작실에서 점검 방법을 찾자'); const m=itemPos('manual_ferris'); if(m) setGoal(m.x,m.z,'점검 방법'); }); } }
  }});
})();
