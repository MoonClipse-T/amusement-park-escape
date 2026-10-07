/* ============================================================
   방 7 : 바이킹 (좌우로 크게 흔들리는 배)   — 과학 문제가 아니라 박자 맞추기 놀이
   흐름 : 관람차 전원 OFF → 바이킹 조작실 (배 서쪽, 창으로 배가 보인다)
        → 「점검 방법」 : ① 전원 ON ② 밀기 장치로 배를 흔들어 점검 높이(노란 선)까지 ③ 배가 가운데(초록 구간)를 지날 때 밀 것 — 엇박자면 느려진다 ④ 세 번 연속 닿으면 전원 종료
        → 전원 ON : 배가 거의 움직이지 않는다
        → 밀기 장치 화면 : 그네를 밀듯, 배가 가운데를 지나는 순간 [밀기] (Space) → 점점 크게 흔들린다. 점검 높이에 세 번 연속 닿으면 성공
           (조작실 창밖의 진짜 배도 같이 흔들린다)
        → 전원 OFF → 지시서의 점검 끝
   조작반 : 전원 장치(IT_vpower · IT_vlamp) · 밀기 장치(IT_vforce 다이얼 · IT_vscreen 화면) — gyro_drop.py 의 _console
   ★ 글 · 숫자는 아래 ROOM7 에서 고친다
   ============================================================ */
'use strict';
const ROOM7={ target:50, need:3,          // 점검 높이 (도) · 연속으로 닿아야 하는 횟수
  manual:{title:'바이킹 야간 점검 방법',
    body:DOC(['조작반 <b>전원 ON</b>.','<b>밀기 장치</b>로 배를 흔들어 <b>점검 높이</b>(노란 선)까지 올린다.','배가 <b>가운데(초록 구간)를 지날 때</b> 민다. 엇박자로 밀면 오히려 느려진다.','!<b>세 번 연속</b> 점검 높이에 닿으면 끝 — <b>전원을 끈다.</b>'],
      '※ 그네를 밀어 줄 때처럼, 배가 <b>가는 방향</b>으로 박자를 맞춰 민다.')} };
SIGNS.booth_viking=['바이킹 조작실','VIKING CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.manual_viking=['점검 방법','바이킹 · 야간 점검','#fbf6e8','#3a2416'];
SIGNS.vpower=['전원','POWER','#111111','#f2c230']; SIGNS.vforce=['밀기 장치','SWING · PUSH','#111111','#7dffb0'];

(function(){
  const R=ROOM7, st={power:false,run:false}, W2=3.6, T=R.target*Math.PI/180;       // W2 : 흔들리는 빠르기 (주기 약 3.3초)
  const sw={th:0,om:0,cool:0,hits:0,peak:0,flash:0,t:0};                           // 배의 기울기 · 빠르기 · 닿은 횟수
  const spot=()=>PARK.spots.booth_viking||{x:-11.2,z:-37.3};
  const inBooth=()=>P.x>-11.95&&P.x<-9.65&&P.z>-40.35&&P.z<-38.05;
  const amp=()=>Math.acos(clamp(1-(sw.om*sw.om/2+W2*(1-Math.cos(sw.th)))/W2,-1,1));  // 지금 힘으로 올라갈 수 있는 높이

  /* ---------- 밀기 장치 화면 : 옆에서 본 바이킹 ---------- */
  const el=$('#vikingpad'), cv=$('#vcv'), g=cv.getContext('2d'), go=el.querySelector('.fgo'); let raf=0, last=0, done=false;
  function msg(h,ok){ const m=el.querySelector('.fmsg'); m.innerHTML=h; m.className='fmsg'+(ok?' ok':''); }
  function draw(){ const W=720, H=400, px=360, py=52, L=250, F='"Noto Sans KR","Malgun Gothic",sans-serif';
    const sky=g.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#0a0f1e'); sky.addColorStop(1,'#1a1626'); g.fillStyle=sky; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,255,255,.5)'; for(let k=0;k<26;k++) g.fillRect((k*137+40)%W,(k*71+18)%(H-120),2,2);      // 별
    g.fillStyle='#14110f'; g.fillRect(0,H-34,W,34);
    g.strokeStyle='#8e231c'; g.lineWidth=12; g.lineCap='round'; g.beginPath(); g.moveTo(px,py); g.lineTo(px-225,H-34); g.moveTo(px,py); g.lineTo(px+225,H-34); g.stroke();
    // 가운데(초록) 구간 · 점검 높이(노란 선)
    g.strokeStyle='rgba(61,220,132,.38)'; g.lineWidth=30; g.lineCap='butt'; g.beginPath(); g.arc(px,py,L+18,Math.PI/2-.28,Math.PI/2+.28); g.stroke();
    [-1,1].forEach(s=>{ const a=Math.PI/2-s*T, x=px+Math.cos(a)*(L+52), y=py+Math.sin(a)*(L+52); g.strokeStyle='#f2c230'; g.lineWidth=4; g.setLineDash([9,7]); g.beginPath(); g.moveTo(px+Math.cos(a)*(L-70),py+Math.sin(a)*(L-70)); g.lineTo(x,y); g.stroke(); g.setLineDash([]);
      g.fillStyle='#f2c230'; g.font='700 17px '+F; g.textAlign=s>0?'left':'right'; g.fillText('점검 높이',x+s*8,y-4); });
    // 배 (축에 매달려 기운다)
    g.save(); g.translate(px,py); g.rotate(-sw.th);
    g.strokeStyle='#55585e'; g.lineWidth=5; g.beginPath(); g.moveTo(0,0); g.lineTo(-92,L-30); g.moveTo(0,0); g.lineTo(92,L-30); g.stroke();
    g.fillStyle=sw.flash>0?'#d99a52':'#8a5a2c'; g.beginPath(); g.moveTo(-152,L-48); g.quadraticCurveTo(0,L+66,152,L-48); g.lineTo(172,L-84); g.quadraticCurveTo(150,L-54,126,L-44); g.lineTo(-126,L-44); g.quadraticCurveTo(-150,L-54,-172,L-84); g.closePath(); g.fill();
    g.strokeStyle='#3a2416'; g.lineWidth=3; g.stroke();
    g.fillStyle='#8a5a2c'; g.beginPath(); g.arc(178,L-92,13,0,7); g.fill(); g.fillStyle='#f2ede2'; g.beginPath(); g.arc(182,L-95,3,0,7); g.fill();          // 용머리
    ['#2f4f9a','#c8322a','#e8dcc0','#2f6a4a','#e9b82a'].forEach((c,k)=>{ g.fillStyle=c; g.beginPath(); g.arc(-88+k*44,L-30,13,0,7); g.fill(); g.strokeStyle='#1b1b1b'; g.lineWidth=2; g.stroke(); });      // 방패
    g.restore();
    g.fillStyle='#e9b82a'; g.beginPath(); g.arc(px,py,15,0,7); g.fill();
    // 닿은 횟수 · 지금 높이
    g.textAlign='left'; g.font='700 17px '+F; g.fillStyle='#cfc8b8'; g.fillText('점검 높이에 닿은 횟수',20,30);
    for(let k=0;k<R.need;k++){ g.fillStyle=k<sw.hits?'#3ddc84':'#2c312c'; g.beginPath(); g.arc(34+k*34,56,12,0,7); g.fill(); g.strokeStyle='#55585e'; g.lineWidth=2; g.stroke(); }
    const a=Math.round(amp()*180/Math.PI); g.textAlign='right'; g.fillStyle='#cfc8b8'; g.fillText('지금 올라가는 높이',W-20,30); g.font='700 34px '+F; g.fillStyle=a>=R.target?'#3ddc84':'#f2ede2'; g.fillText(a+'°',W-20,66); }
  function step(dt){ sw.t+=dt; sw.cool=Math.max(0,sw.cool-dt); sw.flash=Math.max(0,sw.flash-dt); const o0=sw.om;
    sw.om+=(-W2*Math.sin(sw.th)-.05*sw.om)*dt; sw.th+=sw.om*dt;
    if(o0*sw.om<0){ const pk=Math.abs(sw.th); AUDIO.tone(140,.35,'sawtooth',.03,0,-50);                      // 끝에서 멈칫 — 끼익
      if(!done){ if(pk>=T-.02){ sw.hits++; AUDIO.tone(1300,.08,'square',.07); if(sw.hits>=R.need) win(); } else if(sw.hits){ sw.hits=0; msg('점검 높이에 못 미쳤다 — 다시 세 번 연속으로.'); } } } }
  function push(){ if(done){ AUDIO.click(); close(); return solved(); } if(sw.cool>0) return; sw.cool=.3;
    if(Math.abs(sw.om)<.1&&Math.abs(sw.th)<.12){ sw.om=.55; sw.flash=.15; AUDIO.tone(200,.2,'sawtooth',.06,0,-80); return msg('배가 움직이기 시작했다. 가운데를 지날 때마다 밀자.'); }
    if(Math.abs(sw.th)<.28){ sw.om+=Math.sign(sw.om)*.4; const mx=Math.sqrt(2*W2*(1-Math.cos(1.02))); sw.om=clamp(sw.om,-mx,mx); sw.flash=.15; AUDIO.tone(520,.09,'square',.08); AUDIO.noise(.12,.2,0,900); msg('좋아 — 박자가 맞았다.',true); }
    else { sw.om*=.5; sw.hits=0; AUDIO.err(); msg('엇박자! 배가 덜컹하며 느려졌다. <b>초록 구간</b>을 지날 때 밀자.'); } }
  function win(){ done=true; AUDIO.ok(); go.textContent='닫기'; msg('세 번 연속 점검 높이에 닿았다. 배가 크게, 부드럽게 흔들린다.',true); }
  function loop(now){ const dt=Math.min(.05,(now-last)/1000); last=now; if(!S.paused) step(dt); draw(); if(el.classList.contains('on')) raf=requestAnimationFrame(loop); }
  function openPad(){ done=false; sw.hits=0; go.textContent='밀기'; msg(IS_TOUCH?'':'Space 키로도 밀 수 있다.'); el.querySelector('.fq').innerHTML='그네를 밀듯, 배가 <b>가운데(초록 구간)</b>를 지날 때 <b>밀기</b>. 양쪽 <b>점검 높이</b>(노란 선)에 <b>세 번 연속</b> 닿게 하자.';
    ov('#vikingpad',true); AUDIO.click(); last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop); }
  function close(){ ov('#vikingpad',false); }
  go.onclick=push; go.addEventListener('pointerdown',e=>e.stopPropagation());
  addEventListener('keydown',e=>{ if(e.code==='Space'&&el.classList.contains('on')){ e.preventDefault(); push(); } });
  async function solved(){ st.run=true; S.flags.viking_set=true; drawScreen(); setGoal(null);
    await mono(['바이킹이 크게 흔들린다. 끼익 — 끼익 —','박자만 맞으면 작은 힘으로도 이렇게 크게 흔들린다.','점검 끝. 점검 방법대로 전원을 끄자.']);
    objective('바이킹 전원을 끄자'); const c=itemPos('vpower'); if(c) setGoal(c.x,c.z,'전원 버튼'); }

  /* ---------- 조작실 : 점검 방법 · 전원 장치 · 밀기 장치 ---------- */
  let scr=null;
  function lamp(on){ const o=PARK.items.vlamp; o&&o.traverse(m=>{ if(m.material){ m.material.color.setHex(on?0x3ddc84:0x2c312c); m.material.emissive.setHex(0x3ddc84); m.material.emissiveIntensity=on?1.4:0; } }); }
  function drawScreen(){ if(!scr) return; const q=scr.g, w=scr.w, h=scr.h, F='"Noto Sans KR","Malgun Gothic",sans-serif'; q.fillStyle=st.power?'#07130d':'#050607'; q.fillRect(0,0,w,h); q.textAlign='center';
    if(!st.power){ q.fillStyle='#2f3d36'; q.font='700 36px '+F; q.fillText('전원 꺼짐',w/2,h/2+12); scr.tex.needsUpdate=true; return; }
    const ok=st.run; q.strokeStyle=ok?'#3dff8a':'#ff6a50'; q.lineWidth=6; q.strokeRect(4,4,w-8,h-8);
    q.fillStyle='#7dffb0'; q.font='700 30px '+F; q.fillText('바이킹 흔들림',w/2,50);
    q.strokeStyle='#9dffc4'; q.lineWidth=5; q.beginPath(); q.arc(w/2,70,110,Math.PI/2-.9,Math.PI/2+.9); q.stroke();
    const a=ok?.87:.06; [-1,1].forEach(s=>{ q.strokeStyle=ok?'#3dff8a':'#ff8a7a'; q.beginPath(); q.moveTo(w/2,70); q.lineTo(w/2+Math.sin(s*a)*110,70+Math.cos(s*a)*110); q.stroke(); });
    q.fillStyle=ok?'#3dff8a':'#ff8a7a'; q.font='700 28px '+F; q.fillText(ok?'● 점검 높이 · 정상':'▲ 거의 안 움직임 — 밀기 장치',w/2,250); scr.tex.needsUpdate=true; }
  async function readManual(){ AUDIO.click(); await showMsg(R.manual.title,R.manual.body);
    if(S.flags.manual_viking) return; S.flags.manual_viking=true; INV.note('manual_viking',R.manual.title,R.manual.body); setGoal(null);
    await mono(['이번엔 계산이 아니라 박자다.','그네 밀어 주듯이. 가는 방향으로.']); objective('조작반의 전원 버튼을 누르자'); const c=itemPos('vpower'); if(c) setGoal(c.x,c.z,'전원 버튼'); }
  async function power(){ AUDIO.click();
    if(!S.flags.manual_viking) return mono('…점검 방법부터 찾자.');
    if(S.flags.viking_done) return mono('전원 버튼. 점검을 마치고 꺼 두었다.');
    if(!st.power){ st.power=true; S.flags.viking_power=true; lamp(true); drawScreen(); AUDIO.tone(120,.4,'sawtooth',.06,0,60); AUDIO.tone(1100,.08,'square',.07,.4); await sleep(1400);
      await mono(['전원이 들어왔다. 그런데 배가 거의 움직이지 않는다.','점검 방법 2번 — 밀기 장치로 흔들어 올리자.']);
      objective('밀기 장치로 배를 점검 높이까지 흔들자'); const c=itemPos('vforce'); if(c) setGoal(c.x,c.z,'밀기 장치'); return; }
    if(st.run){ st.power=false; st.run=false; S.flags.viking_done=true; lamp(false); drawScreen(); AUDIO.tone(300,.15,'square',.08); setGoal(null);
      await mono(['바이킹 점검도 끝. 이걸로 지시서의 점검은 모두 마쳤다.','…배가 멈추자, 그것이 다시 이쪽을 본다.','아침 6시. 달이 질 때까지만 버티면 된다.']);
      objective('모든 점검 완료 — 아침 6시까지 버티자 (엔딩 준비 중)'); return; }
    mono('전원 버튼. 점검이 끝나면 꺼야 한다.'); }
  function forceDev(){ if(!st.power){ AUDIO.click(); return mono('밀기 장치. 화면이 꺼져 있다 — 전원부터 켜야 한다.'); }
    if(!st.run) return openPad(); AUDIO.click(); mono('배가 점검 높이까지 잘 흔들린다.'); }

  /* ---------- 디버그 바로 가기 (Shift+7) ---------- */
  CHECKPOINTS.push({key:'7',name:'바이킹 조작실 앞',go(){ room6Done(); S.flags.viking_arrive=true; const s=spot(); warp(s.x,s.z+2.2,s.x,s.z-2); objective('바이킹 조작실에서 점검 방법을 찾자'); }});

  ROOMS.push({id:'room7', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    if(I.vlamp) I.vlamp.traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    add('manual_viking','바이킹 야간 점검 방법',readManual,2.4,inBooth);
    add('vpower','전원 버튼',power,2.4,inBooth);
    add('vforce','밀기 장치',forceDev,2.4,inBooth);
    add('vscreen','밀기 장치 화면',forceDev,2.4,inBooth);
    add('console_viking','바이킹 조작반',()=>{ AUDIO.click(); mono(['바이킹 조작반.','왼쪽은 전원 장치, 오른쪽은 배를 밀어 주는 장치와 화면이다.']); },2.4,inBooth);
    add('mic_viking','안내 방송 마이크',()=>{ AUDIO.click(); mono('…전기가 나가서 방송이 켜지지 않는다.'); },2.4,inBooth);
    if(I.vscreen){ scr=screenOn(I.vscreen,{x:-10.8,z:-39.2}); drawScreen(); }
  },
  tick(dt){ if(S.stage!=='night') return; const f=S.flags, A=PARK.anim.viking;
    // 창밖의 진짜 배 : 전원을 켜면 조금 · 밀기 화면이 열려 있으면 그대로 · 점검 뒤엔 크게 흔들린다
    if(A&&st.power){ const open=el.classList.contains('on'); if(!open&&st.run){ sw.th=.87*Math.sin(S.t*1.9); if(Math.abs(Math.cos(S.t*1.9))<dt*1.9&&Math.hypot(P.x,P.z+43)<30) AUDIO.tone(140,.35,'sawtooth',.03,0,-50); }
      A.rotation.z=open||st.run?sw.th:.05*Math.sin(S.t*1.9); }
    if(f.ferris_done&&!f.viking_arrive&&!S.busy&&P.free){ const s=spot();
      if(Math.hypot(P.x-s.x,P.z-s.z)<8){ f.viking_arrive=true; setGoal(null);
        mono(['바이킹. 용머리 배가 바람에 조금씩 흔들린다. 끼익…','마지막 점검이다. 조작실로.']).then(()=>{ objective('바이킹 조작실에서 점검 방법을 찾자'); const m=itemPos('manual_viking'); if(m) setGoal(m.x,m.z,'점검 방법'); }); } }
  }});
})();
