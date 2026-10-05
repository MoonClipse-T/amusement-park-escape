/* ============================================================
   방 2 : 회전목마 (첫 번째 점검 장소)
   흐름 : 입구 옆 조작실 → 벽의 '회전목마 야간 점검 방법'
        → 조작반 전원(ON/OFF) : 버튼 8개(가로 4 × 세로 2)에 하나씩 불이 들어오는데 5번만 빨간불
        → 버튼 번호 = 무대 구역 번호. 무대(높이 0.5 m)에 점프해서 올라가 5번 구역 → 말 한 마리가 기둥에서 빠져 바닥에 내려앉아 있다
        → 용수철저울 : 고정대에 매달린 용수철 끝 고리에 말을 끌어다 건다 → 줄자로 늘어난 길이(15 cm)를 읽고
          기준 '5 cm 늘어나면 100 N' 으로 말에 작용하는 중력(300 N)을 추정한다   [9과05-02 탄성력 · 중력]
        → 5번도 초록불 → 레버를 내리면 회전목마가 돈다 → 규칙대로 전원을 끈다 → 다음 점검 : 범퍼카
        → (공포) 범퍼카 앞에 도착하면, 꺼 둔 회전목마가 혼자 돌기 시작한다
   ★ 글 · 정답은 아래 ROOM2 에서 고친다
   ============================================================ */
'use strict';
const ROOM2={
  manual:{title:'회전목마 야간 점검 방법',
    body:DOC(['조작반 왼쪽 <b>전원(ON / OFF)</b> 버튼을 누른다.','버튼 <b>8개가 모두 초록색</b>이면 <b>레버를 내려</b> 회전목마를 돌린다.','!점검이 끝나면 반드시 <b>전원을 끈다.</b>'],
      '※ 버튼 번호 = 무대의 <b>구역 번호(1~8)</b>. 초록색이 아닌 번호의 구역부터 점검한다.')},
  bad:5,                                   // 고장 난 구역 (Blender 쪽 fix_carousel 의 FALLEN 과 같아야 한다)
  // 용수철저울 : 기준(refN 일 때 refCm 늘어남), 말을 걸었을 때 늘어난 길이 cm → 중력 = refN × cm / refCm
  scale:{refN:100, refCm:5, cm:15},
};
SIGNS.booth_carousel=['회전목마 조작실','CAROUSEL CONTROL · 관계자 외 출입금지','#8e231c','#f2ede2'];
SIGNS.cpower=['ON / OFF','','#1b1b1b','#f2ede2'];
SIGNS.manual_carousel=['점검 방법','회전목마 · 야간 점검','#fbf6e8','#8e231c'];
for(let k=1;k<=8;k++){ SIGNS['csec_'+k]=[String(k),'','#f2ede2','#8e231c']; SIGNS['cfloor_'+k]=[String(k),'','#8e231c','#f2ede2']; SIGNS['cnum_'+k]=[String(k),'','#1b1b1b','#e8e2d6']; }

(function(){
  const IN=(x,z)=>x>-20.5&&x<-18.3&&z>12.7&&z<14.9;          // 조작실 안
  const C={x:-30,z:10}, BUMPER={x:-36,z:33}, weight=()=>ROOM2.scale.refN*ROOM2.scale.cm/ROOM2.scale.refCm;
  const st={power:false,lit:0,lever:false,busy:false}, lamp=k=>!st.power||k>st.lit?'off':(k===ROOM2.bad&&!S.flags.horse_fixed?'bad':'on');
  let horseAnim=null, hintT=0;
  const booth=()=>PARK.spots.booth_carousel||{x:-19.05,z:11.9};

  /* ---------- 3D 조작반 : 버튼 불 · 전원 버튼 · 레버 ---------- */
  const COL={off:[0x2c312c,0],on:[0x3ddc84,1.1],bad:[0xff3b30,1.3]};
  function sync3d(){ const I=PARK.items;
    for(let k=1;k<=8;k++){ const m=I['cbtn_'+k]; if(!m) continue; const [c,e]=COL[lamp(k)]; m.traverse(o=>{ if(!o.material) return; o.material.color.setHex(c); o.material.emissive.setHex(c); o.material.emissiveIntensity=e; }); }
    if(I.cpower) I.cpower.traverse(o=>{ if(o.material){ o.material.emissive.setHex(0xff2a1a); o.material.emissiveIntensity=st.power?1.2:0; } });
    if(I.clever) I.clever.rotation.z=st.lever?-0.8:0; }

  /* ---------- 조작반 화면 ---------- */
  function drawCtrl(){ $('#ctrl .cpbtn').classList.toggle('on',st.power); $('#ctrl .cslot').classList.toggle('down',st.lever);
    document.querySelectorAll('#ctrl .cl').forEach(el=>{ el.className='cl '+lamp(+el.dataset.n); }); sync3d(); }
  function openCtrl(){ AUDIO.click(); const m=$('#ctrl .fmsg'); m.className='fmsg'; m.textContent=S.flags.manual_carousel?'':'…버튼이 잔뜩이다. 함부로 누르기 전에 점검 방법부터 찾자.'; drawCtrl(); ov('#ctrl',true); }
  async function power(){ if(st.busy) return; const m=$('#ctrl .fmsg'); m.className='fmsg';
    if(st.power){ st.power=false; st.lit=0; st.lever=false; AUDIO.tone(300,.15,'square',.08); drawCtrl();
      if(S.carouselRun){ S.carouselRun=false; AUDIO.stopMusic(); }
      if(S.flags.carousel_done&&!S.flags.carousel_off){ S.flags.carousel_off=true; m.className='fmsg ok'; m.textContent='전원을 껐다. 회전목마가 천천히 멈춘다.';
        await sleep(1200); ov('#ctrl',false); await mono(['회전목마 점검 끝. 전원도 껐다.','다음은 범퍼카. 점검 순서대로 가자.']);
        objective('범퍼카로 가서 조작실을 찾자'); const b=PARK.spots.booth_bumper; setGoal(b?b.x:-41.3,b?b.z:30.9,'범퍼카 조작실'); }
      else m.textContent='전원이 꺼졌다.';
      return; }
    st.busy=true; st.power=true; st.lit=0; AUDIO.tone(120,.4,'sawtooth',.06,0,60); drawCtrl(); m.textContent='전원이 들어왔다…'; await sleep(500);
    for(let k=1;k<=8;k++){ st.lit=k; AUDIO.tone(k===ROOM2.bad&&!S.flags.horse_fixed?260:1400,.05,'square',.08); AUDIO.noise(.03,.15,0,3000); drawCtrl(); await sleep(260); }
    st.busy=false;
    if(S.flags.horse_fixed){ m.className='fmsg ok'; m.textContent='버튼 8개가 모두 초록색이다.'; return; }
    m.innerHTML=`<b>${ROOM2.bad}번</b> 버튼에만 빨간불이 들어왔다.`; AUDIO.err();
    if(!S.flags.saw_bad){ S.flags.saw_bad=true; await sleep(900); ov('#ctrl',false);
      await mono([`${ROOM2.bad}번만 빨간불이다.`,`버튼 번호가 무대 구역 번호랑 같다고 했지… ${ROOM2.bad}번 구역을 살펴보자.`]);
      objective(`회전목마 무대 ${ROOM2.bad}번 구역을 점검하자 (무대는 점프해서 올라간다)`); const s=PARK.signs['cfloor_'+ROOM2.bad]; if(s){ const p=s.getWorldPosition(new THREE.Vector3()); setGoal(p.x,p.z,`${ROOM2.bad}번 구역`); } } }
  async function pullLever(){ if(st.busy||st.lever) return; const m=$('#ctrl .fmsg'); m.className='fmsg';
    if(!st.power){ AUDIO.err(); m.textContent='전원이 꺼져 있어서 레버가 움직이지 않는다.'; return; }
    if(st.lit<8||!S.flags.horse_fixed){ AUDIO.err(); AUDIO.tone(90,.5,'square',.12); m.textContent='삐— 레버가 잠겨 있다. 버튼 8개가 모두 초록색일 때만 내려간다.'; return; }
    st.lever=true; drawCtrl(); AUDIO.tone(200,.3,'sawtooth',.06,0,-80); AUDIO.noise(.4,.3,0,600);
    m.className='fmsg ok'; m.textContent='레버를 내렸다. 회전목마가 돌기 시작한다!'; S.carouselRun=true; AUDIO.music('open');
    if(typeof HUNT!=='undefined'&&HUNT.on) HUNT.lureAt(-19.4,10.4,60,'회전목마');      // 추격 중이면 — 달토끼가 구경하러 온다 (hunt.js)
    await sleep(1600); ov('#ctrl',false);
    if(S.flags.carousel_done) return; S.flags.carousel_done=true; setGoal(null);
    await mono(['…돈다. 음악도 나온다. 고장 난 곳은 이제 없다.','점검 방법 3번 — 점검이 끝나면 반드시 전원을 끈다.']); objective('점검 끝 — 조작반 전원(ON/OFF)을 끄자'); }

  /* ---------- 쓰러진 말 : 고정대에 매달린 용수철에 말을 끌어다 걸고, 줄자로 늘어난 길이를 읽는다 ---------- */
  const SC={stand:120, arm:40, sx:290, top:56, hook0:110, px:9, rx:340};   // 그림 위치 : 고정대 · 용수철 위 끝 · 처음 고리 높이 · 1 cm = 9 px · 줄자 x (바닥 = 캔버스 아래 24 px)
  const TOOL_NO={rubber:'고무줄도 늘어나긴 하지만… 눈금이 없어서 몇 N 인지 정확히 읽을 수 없다.',gauge:'마찰력 측정 장치는 바닥에 놓인 물체를 옆으로 당길 때 쓰는 거다. 말을 매달아 무게를 잴 도구가 따로 있었는데.',
    oil:'윤활유로는 무게를 잴 수 없다.',weight:'추를 올려 봤자 무게를 알 수는 없다.',torch:'손전등으로 무게를 잴 수는 없지.',key:'열쇠로는… 아니지.'};
  const HOME={x:560}; let homeY=0;   // 말이 처음 서 있는 자리 (바닥 위)
  const lift={hooked:false, stretch:0, drag:null, hx:560, hy:0, busy:false};
  function horse(g,x,y,s=1){ g.save(); g.translate(x,y); g.scale(s,s);       // (x, y) = 등의 고리
    g.strokeStyle='#c9a23e'; g.lineWidth=4; g.beginPath(); g.arc(0,-6,7,0,7); g.stroke(); g.fillStyle='#c9a23e'; g.fillRect(-2,-2,4,14);
    g.fillStyle='#ece6da'; g.strokeStyle='#8a7f70'; g.lineWidth=2;
    g.beginPath(); g.ellipse(0,40,56,26,0,0,7); g.fill(); g.stroke();                                   // 몸
    g.beginPath(); g.moveTo(34,30); g.quadraticCurveTo(58,-6,70,-16); g.lineTo(84,-10); g.quadraticCurveTo(70,10,58,40); g.closePath(); g.fill(); g.stroke();   // 목
    g.beginPath(); g.ellipse(80,-14,18,10,-.5,0,7); g.fill(); g.stroke();                              // 머리
    g.fillStyle='#d8312a'; g.fillRect(-30,16,46,10);                                                    // 안장
    g.fillStyle='#ece6da'; [[-40,58,-48,96],[-20,62,-22,100],[22,62,30,98],[40,56,58,86]].forEach(([a,b,c,d])=>{ g.beginPath(); g.moveTo(a-6,b); g.lineTo(a+6,b); g.lineTo(c+5,d); g.lineTo(c-5,d); g.closePath(); g.fill(); g.stroke(); });
    g.strokeStyle='#bfb6a6'; g.lineWidth=6; g.beginPath(); g.moveTo(-54,34); g.quadraticCurveTo(-78,44,-72,74); g.stroke();   // 꼬리
    g.restore(); }
  function drawLift(){ const c=$('#lcv'), g=c.getContext('2d'), W=c.width, H=c.height, sc=ROOM2.scale, hookY=SC.hook0+lift.stretch*SC.px;
    g.clearRect(0,0,W,H); const ground=H-24; homeY=ground-92;
    g.fillStyle='#3a332b'; g.fillRect(0,ground,W,H-ground); g.fillStyle='#8a8d93'; g.font='600 12px "Noto Sans KR",sans-serif'; g.textAlign='left'; g.fillText('바닥',W-44,H-8);
    // 고정대
    g.fillStyle='#55585e'; g.fillRect(60,H-38,200,14); g.fillRect(SC.stand-6,SC.arm,12,H-38-SC.arm); g.fillRect(SC.stand,SC.arm,SC.sx-SC.stand+20,12);
    g.fillStyle='#8a8d93'; g.font='600 12px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText('고정대',SC.stand,H-44);
    // 줄자 (0 = 처음 고리 높이)
    g.fillStyle='#f2d24a'; g.fillRect(SC.rx,SC.hook0-8,38,22*SC.px+16); g.strokeStyle='#1a1a1a'; g.fillStyle='#1a1a1a';
    for(let k=0;k<=22;k++){ const y=SC.hook0+k*SC.px; g.lineWidth=k%5?1:2; g.beginPath(); g.moveTo(SC.rx,y); g.lineTo(SC.rx+(k%5?9:16),y); g.stroke();
      if(k%5===0){ g.font='700 12px "Noto Sans KR",sans-serif'; g.textAlign='left'; g.fillText(k,SC.rx+19,y+4); } }
    g.font='700 11px "Noto Sans KR",sans-serif'; g.fillText('cm',SC.rx+19,SC.hook0+22*SC.px+14);
    // 용수철 · 고리
    g.strokeStyle='#9aa3ad'; g.lineWidth=3; g.beginPath(); g.moveTo(SC.sx,SC.arm+12); g.lineTo(SC.sx,SC.top); const n=16;
    for(let i=1;i<n;i++) g.lineTo(SC.sx+(i%2?-12:12),SC.top+(hookY-12-SC.top)*i/n); g.lineTo(SC.sx,hookY-12); g.lineTo(SC.sx,hookY); g.stroke();
    g.strokeStyle='#c9a23e'; g.lineWidth=3; g.beginPath(); g.arc(SC.sx,hookY+6,6,-Math.PI/2,Math.PI*1.1); g.stroke();
    // 고리 높이 표시선 (줄자 쪽으로)
    g.strokeStyle='#ff5a3a'; g.lineWidth=2; g.setLineDash([5,4]); g.beginPath(); g.moveTo(SC.sx+8,hookY); g.lineTo(SC.rx,hookY); g.stroke(); g.setLineDash([]);
    if(!lift.hooked){ g.fillStyle='rgba(255,90,58,.18)'; g.beginPath(); g.arc(SC.sx,hookY+6,26,0,7); g.fill(); }
    // 기준표
    g.fillStyle='#fff6d6'; g.fillRect(W-210,18,190,62); g.strokeStyle='#8e231c'; g.lineWidth=2; g.strokeRect(W-210,18,190,62);
    g.fillStyle='#8e231c'; g.font='700 13px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText('이 용수철저울의 기준',W-115,38);
    g.fillStyle='#1a1a1a'; g.font='700 16px "Noto Sans KR",sans-serif'; g.fillText(`${sc.refCm} cm 늘어나면 ${sc.refN} N`,W-115,64);
    // 말 (걸려 있으면 고리 아래, 아니면 끌 수 있는 자리)
    if(lift.hooked) horse(g,SC.sx,hookY+14,.72); else horse(g,lift.hx,lift.hy||homeY,.9);
    if(!lift.hooked){ g.fillStyle='#d8cfbd'; g.font='600 14px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText('← 말을 끌어다 용수철 끝 고리에 걸자',540,120); } }
  function canvasXY(e){ const c=$('#lcv'), r=c.getBoundingClientRect(); return [(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]; }
  $('#lcv').addEventListener('pointerdown',e=>{ if(lift.hooked||lift.busy) return; const [x,y]=canvasXY(e); const hy=lift.hy||homeY; if(Math.abs(x-lift.hx-10)<90&&y>hy-30&&y<hy+110){ lift.hy=hy; lift.drag=[x-lift.hx,y-lift.hy]; $('#lcv').setPointerCapture(e.pointerId); AUDIO.tick(); } });
  $('#lcv').addEventListener('pointermove',e=>{ if(!lift.drag) return; const [x,y]=canvasXY(e); lift.hx=x-lift.drag[0]; lift.hy=y-lift.drag[1]; drawLift(); });
  $('#lcv').addEventListener('pointerup',()=>{ if(!lift.drag) return; lift.drag=null;
    if(Math.hypot(lift.hx-SC.sx,lift.hy-(SC.hook0+6))<60) hang(); else { lift.hx=HOME.x; lift.hy=homeY; drawLift(); } });
  async function hang(){ lift.hooked=true; lift.busy=true; AUDIO.tone(500,.4,'sine',.05,0,-250); AUDIO.noise(.2,.2,0,1200);
    const to=ROOM2.scale.cm; for(let t=0;t<=1.0001;t+=.04){ const e=1-Math.pow(1-t,3), wob=Math.sin(t*14)*(1-t)*1.2; lift.stretch=to*e+wob; drawLift(); await sleep(28); }
    lift.stretch=to; drawLift(); lift.busy=false;
    const m=$('#lift .fmsg'); m.className='fmsg'; m.textContent='용수철이 늘어났다. 줄자에서 늘어난 길이를 읽어 보자.'; if(!IS_TOUCH) $('#lift .fnum').focus(); }
  async function openLift(){ if(S.flags.horse_fixed) return;
    if(!S.flags.horse_seen){ S.flags.horse_seen=true; setGoal(null); await mono(['…말 하나가 기둥에서 빠져서 무대 바닥에 내려앉아 있다!','이 말의 무게를 정확히 알아야 다시 매달 수 있을 것 같다.']); }
    if(!S.flags.horse_tool){ if(!INV.has('toolbox')){ await mono('…잴 도구가 없다. 숙소 공구함을 챙겨 오자.'); return; }
      const t=await chooseTool('점검 공구함에서 무엇으로 이 말의 무게를 재야 할까?'); if(!t) return;
      if(t!=='scale'){ AUDIO.err(); await mono(TOOL_NO[t]||'…그걸로는 무게를 잴 수 없다.'); return; }
      S.flags.horse_tool=true; await mono(['용수철저울. 매달아서 늘어난 길이로 무게를 잴 수 있다.']); }
    Object.assign(lift,{hooked:false,stretch:0,drag:null,hx:HOME.x,hy:0,busy:false}); $('#lift .fnum').value=''; const m=$('#lift .fmsg'); m.className='fmsg'; m.textContent='';
    $('#lift .fq').innerHTML='고정대에 용수철저울을 매달았다. <b>말을 끌어다 용수철 끝 고리에 걸어 바닥에서 띄우고</b>, 줄자로 용수철이 늘어난 길이를 읽자.<br>기준을 이용해 <b>말에 작용하는 중력의 크기</b>를 구하자.';
    ov('#lift',true); AUDIO.click(); drawLift(); }
  async function checkLift(){ if(lift.busy) return; const m=$('#lift .fmsg'), v=$('#lift .fnum').value.trim(), w=weight();
    if(!lift.hooked){ AUDIO.err(); m.className='fmsg'; m.textContent='먼저 말을 용수철 끝 고리에 걸어 보자.'; return; }
    if(!/^\d{1,4}$/.test(v)){ AUDIO.err(); m.className='fmsg'; m.textContent='중력의 크기를 숫자로 입력하자 (단위 N).'; return; }
    if(+v===w){ m.className='fmsg ok'; m.innerHTML=`용수철이 <b>${ROOM2.scale.cm} cm</b> 늘어났다 — ${ROOM2.scale.refCm} cm에 ${ROOM2.scale.refN} N 이니 말에 작용하는 중력은 <b>${w} N</b>!<br>기둥 리프트를 ${w} N 으로 맞추자, 말이 제자리에 걸렸다.`;
      AUDIO.unlatch(); lift.busy=true; await sleep(2200); ov('#lift',false); lift.busy=false; fixHorse(); }
    else { AUDIO.err(); m.className='fmsg'; m.innerHTML='리프트가 덜컹 — 맞지 않는다. 줄자에서 늘어난 길이를 다시 읽고, 기준과 비교해 보자.<br>(용수철이 늘어난 길이는 걸어 둔 물체의 무게에 비례한다)'; } }
  async function fixHorse(){ const f=PARK.items.horse_5, h=PARK.items.horsehome_5; S.flags.horse_fixed=true;
    if(f&&h) horseAnim={f,h,t:0,p0:f.position.clone(),q0:f.quaternion.clone()};
    if(st.power) drawCtrl(); else sync3d(); AUDIO.ok();
    await sleep(1400); await mono(['됐다, 말이 제자리에 걸렸다.','이제 조작실로 돌아가서 버튼을 다시 확인하고, 레버를 내려 보자.']);
    objective('조작실에서 버튼 8개를 확인하고 레버를 내리자'); const b=booth(); setGoal(b.x,b.z,'회전목마 조작실'); }
  $('#lift .fnum').addEventListener('keydown',e=>{ if(e.key==='Enter') checkLift(); });
  $('#lift .fgo').onclick=checkLift;
  $('#ctrl .cpbtn').onclick=power; $('#ctrl .cslot').onclick=pullLever;
  $('#ctrl .cgrid').innerHTML=[1,2,3,4,5,6,7,8].map(n=>`<div class="cl off" data-n="${n}"><i></i><b>${n}</b></div>`).join('');

  /* 밤이 되면 회전목마를 멈춘 자리에서 돌려, 고장 난 구역이 조작실의 반대편에 오게 한다 (저녁 운행 동안 돈 각도와 상관없이) */
  function alignCarousel(){ const A=PARK.anim.carousel, s=PARK.signs['cfloor_'+ROOM2.bad], b=booth(); S.flags.carousel_aligned=true; if(!A||!s) return;
    A.updateMatrixWorld(true); const p=s.getWorldPosition(new THREE.Vector3()), a=Math.atan2(p.z-C.z,p.x-C.x), want=Math.atan2(b.z-C.z,b.x-C.x)+Math.PI;
    A.rotation.y-=Math.atan2(Math.sin(want-a),Math.cos(want-a)); }

  /* ---------- 공포 : 범퍼카 앞에 오면, 꺼 둔 회전목마가 혼자 돈다 ---------- */
  async function ghostRide(){ S.flags.ghost_carousel=true; const yaw0=P.yaw; P.free=false;
    AUDIO.noise(1.2,.25,0,200); AUDIO.tone(55,1.6,'sine',.3,0,-15); await sleep(400);
    S.ridesGhost=true; AUDIO.music('dead');
    await camTo({yaw:Math.atan2(-(C.x-P.x),-(C.z-P.z)),pitch:.06},1.3);
    await mono(['…?','음악 소리…','회전목마가… 돌고 있다. 분명히 전원을 껐는데.']);
    await camTo({yaw:yaw0,pitch:0},.9); P.free=true;
    await mono(['…일단 빨리 점검을 마무리하자.']); }

  /* ---------- 디버그 바로 가기 (Shift+2) · 범퍼카 바로 가기가 쓰는 room2Done() ---------- */
  function prep(n){ room1Done(); Object.assign(S.flags,{booth_in:true}); if(!S.flags.carousel_aligned) alignCarousel();
    if(n>=4){ S.flags.manual_carousel=true; INV.note('manual_carousel',ROOM2.manual.title,ROOM2.manual.body); st.power=true; st.lit=8; S.flags.saw_bad=true; S.flags.jump_hint=true; }
    if(n>=5){ Object.assign(S.flags,{horse_seen:true,horse_tool:true,horse_fixed:true}); const f=PARK.items.horse_5, h=PARK.items.horsehome_5; if(f) f.visible=false; if(h) h.visible=true; }
    if(n>=6){ Object.assign(S.flags,{carousel_done:true,carousel_off:true}); st.power=false; st.lit=0; st.lever=false; S.carouselRun=false; AUDIO.stopMusic(); }
    sync3d(); }
  window.room2Done=()=>prep(6);
  const inBooth=()=>{ const m=itemPos('manual_carousel'); warp(-19.05,13.3,m?m.x:-19.4,m?m.z:14.9); };
  CHECKPOINTS.push({key:'2',name:'회전목마 조작실',go(){ prep(3); inBooth(); objective('조작실 안에서 점검 방법을 찾자'); }});

  ROOMS.push({id:'room2', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    for(let k=1;k<=8;k++) I['cbtn_'+k]&&I['cbtn_'+k].traverse(o=>{ if(o.material) o.material=o.material.clone(); });   // 버튼마다 따로 불을 켠다
    I.cpower&&I.cpower.traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    if(I.horsehome_5) I.horsehome_5.visible=false;
    add('manual_carousel','회전목마 야간 점검 방법',async()=>{ AUDIO.click(); await showMsg(ROOM2.manual.title,ROOM2.manual.body);
      if(!S.flags.manual_carousel){ S.flags.manual_carousel=true; INV.note('manual_carousel',ROOM2.manual.title,ROOM2.manual.body); setGoal(null);
        await mono(['전원부터 켜 보라는 거구나. 조작반은 창가 책상 위에 있다.']); objective('조작반의 전원(ON/OFF)을 켜 보자'); } });
    add('console_carousel','회전목마 조작반',openCtrl);
    add('mic_carousel','안내 방송 마이크',async()=>{ AUDIO.tone(1800,.4,'sine',.05); await announce('아, 아… 마이크 테스트.',{ms:1600,voice:'mic_test'}); await mono('…텅 빈 공원에 내 목소리만 울린다.'); });
    add('horse_5','기둥에서 빠진 회전목마 말',openLift,2.8,()=>!S.flags.horse_fixed);
    sync3d();
  },
  tick(dt){
    if(S.stage==='night'&&!S.flags.carousel_aligned) alignCarousel();
    if(S.stage==='night'&&S.flags.door_open&&!S.flags.booth_in&&IN(P.x,P.z)){ S.flags.booth_in=true;
      mono(['회전목마 조작실. 창 너머로 말들이 보인다.','점검 방법이 어딘가 붙어 있을 텐데.']); objective('조작실 안에서 점검 방법을 찾자'); }
    // 무대 가장자리에서 한 번 : 점프 안내
    if(S.flags.saw_bad&&!S.flags.jump_hint&&P.y<.2){ const d=Math.hypot(P.x-C.x,P.z-C.z); if(d>7.7&&d<9){ S.flags.jump_hint=true;
      $('#hint').textContent=IS_TOUCH?'점프 버튼으로 무대에 올라가자':'Space 키로 점프해서 무대에 올라가자'; clearTimeout(hintT); hintT=setTimeout(()=>$('#hint').textContent='',6000); } }
    if(S.flags.carousel_off&&!S.flags.ghost_carousel&&P.free&&!S.busy&&Math.hypot(P.x-BUMPER.x,P.z-BUMPER.z)<7) ghostRide();
    if(horseAnim){ const a=horseAnim; a.t=Math.min(1,a.t+dt/1.4); const e=a.t<.5?2*a.t*a.t:-1+(4-2*a.t)*a.t;
      a.f.position.lerpVectors(a.p0,a.h.position,e); a.f.quaternion.copy(a.q0).slerp(a.h.quaternion,e); if(a.t>=1){ a.f.visible=false; a.h.visible=true; horseAnim=null; } } }});
})();
