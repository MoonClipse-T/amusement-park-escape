/* ============================================================
   방 2 : 회전목마 (첫 번째 점검 장소)
   흐름 : 입구 옆 조작실 → 벽의 '회전목마 야간 점검 방법'
        → 조작반 전원(ON/OFF) : 버튼 8개(가로 4 × 세로 2)에 하나씩 불이 들어오는데 5번만 빨간불
        → 버튼 번호 = 무대 구역 번호. 무대(높이 0.5 m)에 점프해서 올라가 5번 구역 → 말 한 마리가 기둥에서 빠져 쓰러져 있다
        → 용수철저울로 말의 무게(중력)를 잰다 : 저울 표 '100 N → 5 cm', 늘어난 길이 15 cm → 300 N   [9과05-02 중력 · 탄성력]
        → 기둥 리프트가 말을 위로 당기는 힘을 중력과 같게(위로 300 N) → 힘의 평형으로 말이 제자리에 걸린다 [9과05-01]
        → 5번도 초록불 → 레버를 내리면 회전목마가 돈다 → 다음 점검 (범퍼카, 준비 중)
   ★ 글 · 정답은 아래 ROOM2 에서 고친다
   ============================================================ */
'use strict';
const ROOM2={
  manual:{title:'회전목마 야간 점검 방법',
    body:`1. 조작반 왼쪽의 <b>전원(ON / OFF)</b> 버튼을 눌러 전원이 들어오는지 확인한다.<br>
2. 버튼 8개에 모두 불이 들어오는지 확인한다.<br>&nbsp;&nbsp;&nbsp;<b>8개가 모두 초록색</b>이면 레버를 아래로 내려 회전목마를 작동시킨다.<br><br>
※ 버튼 번호는 회전목마 무대의 <b>구역 번호(1~8)</b>와 같다.<br>&nbsp;&nbsp;&nbsp;초록색이 아닌 버튼이 있으면 그 번호 구역을 먼저 점검할 것.`},
  bad:5,                                   // 고장 난 구역 (Blender 쪽 fix_carousel 의 FALLEN 과 같아야 한다)
  // 용수철저울 : 표에 적힌 기준(refN 일 때 refCm 늘어남), 말을 걸었을 때 늘어난 길이 cm → 무게 = refN × cm / refCm
  scale:{refN:100, refCm:5, cm:15},
};
SIGNS.booth_carousel=['회전목마 조작실','CAROUSEL CONTROL · 관계자 외 출입금지','#8e231c','#f2ede2'];
SIGNS.cpower=['ON / OFF','','#1b1b1b','#f2ede2'];
for(let k=1;k<=8;k++){ SIGNS['csec_'+k]=[String(k),'','#f2ede2','#8e231c']; SIGNS['cfloor_'+k]=[String(k),'','#8e231c','#f2ede2']; SIGNS['cnum_'+k]=[String(k),'','#1b1b1b','#e8e2d6']; }

(function(){
  const IN=(x,z)=>x>-20.5&&x<-18.3&&z>12.7&&z<14.9;          // 조작실 안
  const C={x:-30,z:10}, weight=()=>ROOM2.scale.refN*ROOM2.scale.cm/ROOM2.scale.refCm;
  const st={power:false,lit:0,lever:false,busy:false}, lamp=k=>!st.power||k>st.lit?'off':(k===ROOM2.bad&&!S.flags.horse_fixed?'bad':'on');
  let horseAnim=null, hintT=0;

  /* ---------- 3D 조작반 : 버튼 불 · 전원 버튼 · 레버 ---------- */
  const COL={off:[0x2c312c,0],on:[0x3ddc84,1.1],bad:[0xff3b30,1.3]};
  function sync3d(){ const I=PARK.items;
    for(let k=1;k<=8;k++){ const m=I['cbtn_'+k]; if(!m) continue; const [c,e]=COL[lamp(k)]; m.traverse(o=>{ if(!o.material) return; o.material.color.setHex(c); o.material.emissive.setHex(c); o.material.emissiveIntensity=e; }); }
    if(I.cpower) I.cpower.traverse(o=>{ if(o.material){ o.material.emissive.setHex(0xff2a1a); o.material.emissiveIntensity=st.power?1.2:0; } }); }

  /* ---------- 조작반 화면 ---------- */
  function drawCtrl(){ $('#ctrl .cpbtn').classList.toggle('on',st.power); $('#ctrl .cslot').classList.toggle('down',st.lever);
    document.querySelectorAll('#ctrl .cl').forEach(el=>{ el.className='cl '+lamp(+el.dataset.n); }); sync3d(); }
  function openCtrl(){ AUDIO.click(); const m=$('#ctrl .fmsg'); m.className='fmsg'; m.textContent=S.flags.manual_carousel?'':'…버튼이 잔뜩이다. 함부로 누르기 전에 점검 방법부터 찾자.'; drawCtrl(); ov('#ctrl',true); }
  async function power(){ if(st.busy) return; const m=$('#ctrl .fmsg'); m.className='fmsg';
    if(st.power){ st.power=false; st.lit=0; st.lever=false; AUDIO.tone(300,.15,'square',.08); drawCtrl(); m.textContent='전원이 꺼졌다.'; return; }
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
    st.lever=true; drawCtrl(); AUDIO.tone(200,.3,'sawtooth',.06,0,-80); AUDIO.noise(.4,.3,0,600); const L=PARK.items.clever; if(L) L.rotation.z=-0.8;
    m.className='fmsg ok'; m.textContent='레버를 내렸다. 회전목마가 돌기 시작한다!'; S.carouselRun=true; AUDIO.music('open'); await sleep(1600); ov('#ctrl',false);
    S.flags.carousel_done=true; await mono(['…돈다. 음악도 나온다.','회전목마 점검 끝. 다음은 범퍼카다.']); objective('다음 점검 : 범퍼카 (준비 중)'); setGoal(null);
    setTimeout(()=>{ S.carouselRun=false; AUDIO.stopMusic(); },12000); }

  /* ---------- 쓰러진 말 : 용수철저울로 무게 재기 → 리프트 ---------- */
  const lift={dir:'up',busy:false};
  function drawLift(t=0){ const c=$('#lcv'), g=c.getContext('2d'), W=c.width, H=c.height, sc=ROOM2.scale; g.clearRect(0,0,W,H);
    // 왼쪽 : 용수철저울 (자 눈금 0~20 cm, 1 cm = 12 px)
    const x0=150, top=30, px=12, len=sc.cm*px*Math.min(1,t);
    g.fillStyle='#c9a23e'; g.fillRect(x0-40,top-14,120,10); g.fillStyle='#444a52'; g.fillRect(x0-34,top-4,108,20*px+40);
    g.fillStyle='#e8e2d6'; g.fillRect(x0-30,top+20,100,20*px+12);
    g.strokeStyle='#1a1a1a'; g.fillStyle='#1a1a1a'; g.font='700 12px "Noto Sans KR",sans-serif'; g.textAlign='left';
    for(let k=0;k<=20;k++){ const y=top+26+k*px; g.lineWidth=k%5?1:2; g.beginPath(); g.moveTo(x0+14,y); g.lineTo(x0+(k%5?22:28),y); g.stroke(); if(k%5===0) g.fillText(k+' cm',x0+31,y+4); }
    // 용수철 · 바늘
    g.strokeStyle='#7d858e'; g.lineWidth=2.5; g.beginPath(); const sy=top+26, ey=sy+len; g.moveTo(x0-8,sy-6);
    for(let i=0;i<=12;i++) g.lineTo(x0-8+(i%2?-8:8)*(i&&i<12?1:0),sy+(ey-sy)*i/12); g.stroke();
    g.fillStyle='#ff5a3a'; g.fillRect(x0-14,ey-2,28,4); g.beginPath(); g.moveTo(x0+12,ey); g.lineTo(x0+2,ey-6); g.lineTo(x0+2,ey+6); g.fill();
    g.strokeStyle='#c9a23e'; g.lineWidth=3; g.beginPath(); g.moveTo(x0-8,ey); g.lineTo(x0-8,ey+24); g.arc(x0-2,ey+30,6,Math.PI,0,true); g.stroke();
    // 저울에 붙은 표
    g.fillStyle='#fff6d6'; g.fillRect(x0-130,top+70,92,58); g.strokeStyle='#8e231c'; g.lineWidth=2; g.strokeRect(x0-130,top+70,92,58);
    g.fillStyle='#8e231c'; g.font='700 13px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText('저울 표',x0-84,top+88); g.fillStyle='#1a1a1a'; g.font='700 14px "Noto Sans KR",sans-serif';
    g.fillText(`${sc.refN} N → ${sc.refCm} cm`,x0-84,top+112);
    // 오른쪽 : 말과 힘 화살표 (중력 · 리프트)
    const hx=520, hy=190; g.fillStyle='#e9e2d6'; g.beginPath(); g.ellipse(hx,hy,70,34,0,0,7); g.fill(); g.fillRect(hx+40,hy-70,26,60); g.beginPath(); g.ellipse(hx+62,hy-78,26,16,-.4,0,7); g.fill();
    [-50,-20,25,52].forEach(lx=>g.fillRect(hx+lx,hy+20,10,50)); g.fillStyle='#ffe08a'; g.beginPath(); g.arc(hx,hy,6,0,7); g.fill();
    const arr=(dy,col,label)=>{ const y1=hy+dy; g.strokeStyle=col; g.fillStyle=col; g.lineWidth=6; g.beginPath(); g.moveTo(hx,hy); g.lineTo(hx,y1-Math.sign(dy)*14); g.stroke();
      g.beginPath(); g.moveTo(hx,y1); g.lineTo(hx-11,y1-Math.sign(dy)*18); g.lineTo(hx+11,y1-Math.sign(dy)*18); g.fill(); g.font='700 14px "Noto Sans KR",sans-serif'; g.textAlign='left'; g.fillText(label,hx+16,(hy+y1)/2); };
    arr(110,'#ff5a3a','중력 ? N'); if(lift.F>0) arr(lift.dir==='up'?-Math.min(150,lift.F/weight()*110):Math.min(150,lift.F/weight()*110)*0.8,'#ffb340',`리프트 ${lift.F} N`);
    g.fillStyle='#b9bcc2'; g.font='600 13px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText('작용점 (말의 무게 중심)',hx,hy-110); }
  function readL(){ const v=$('#lift .fnum').value.trim(); lift.F=/^\d{1,4}$/.test(v)?+v:0; return v; }
  async function openLift(){ if(S.flags.horse_fixed) return;
    if(!S.flags.horse_seen){ S.flags.horse_seen=true; setGoal(null); await mono(['…말 하나가 기둥에서 빠져서 무대 바닥에 내려앉아 있다!','다시 기둥에 걸려면, 이 말을 들어 올릴 힘이 얼마나 필요한지 알아야 한다.','공구함에 용수철저울이 있었지.']); }
    if(!INV.has('scale')){ await mono('…잴 도구가 없다. 숙소 공구함을 챙겨 오자.'); return; }
    lift.dir='up'; lift.F=0; $('#lift .fnum').value=''; const m=$('#lift .fmsg'); m.className='fmsg'; m.textContent='';
    $('#lift .fq').innerHTML=`용수철저울을 말에 걸어 살짝 들어 올렸다. 저울에 붙은 표와 눈금을 읽어 <b>말에 작용하는 중력</b>의 크기를 구하자.<br>기둥 리프트가 말을 당기는 힘이 중력과 <b>평형</b>을 이루면 말이 제자리에 걸린다.`;
    document.querySelectorAll('#lift .fdir').forEach(b=>b.classList.toggle('on',b.dataset.d==='up')); ov('#lift',true); AUDIO.click();
    for(let t=0;t<=1.001;t+=.05){ drawLift(t); await sleep(25); } AUDIO.tone(500,.3,'sine',.05,0,-200); }
  async function runLift(){ if(lift.busy) return; const raw=readL(), m=$('#lift .fmsg'), w=weight();
    if(!/^\d{1,4}$/.test(raw)){ AUDIO.err(); m.className='fmsg'; m.textContent='힘의 크기를 숫자로 입력하자 (단위 N).'; return; }
    lift.busy=true; drawLift(1); AUDIO.tone(160,.6,'sawtooth',.05,0,80);
    if(lift.dir==='up'&&lift.F===w){ m.className='fmsg ok'; m.innerHTML=`위로 당기는 힘 <b>${w} N</b> = 말에 작용하는 중력 <b>${w} N</b> — 크기가 같고 방향이 반대, <b>힘의 평형</b>!<br>말이 기둥에 다시 걸렸다.`;
      AUDIO.unlatch(); await sleep(1800); ov('#lift',false); fixHorse(); }
    else { AUDIO.err(); m.className='fmsg'; m.innerHTML=lift.dir==='down'?'아래로 당기면 중력과 같은 방향이다 — 말이 무대에 더 세게 눌릴 뿐이다.'
      :lift.F<w?'리프트가 끙 하고 버티지만 말이 무대에서 떨어지지 않는다. 힘이 중력보다 작다.':'말이 휙 솟구쳤다가 덜컹 — 힘이 중력보다 커서 제자리에 멈추지 않는다.'; }
    lift.busy=false; }
  async function fixHorse(){ const f=PARK.items.horse_5, h=PARK.items.horsehome_5; S.flags.horse_fixed=true;
    if(f&&h) horseAnim={f,h,t:0,p0:f.position.clone(),q0:f.quaternion.clone()};
    if(st.power) drawCtrl(); else sync3d(); AUDIO.ok();
    await sleep(1400); await mono(['됐다, 말이 제자리에 걸렸다.','이제 조작실로 돌아가서 버튼을 다시 확인하고, 레버를 내려 보자.']);
    objective('조작실에서 버튼 8개를 확인하고 레버를 내리자'); setGoal(-19.05,11.9,'회전목마 조작실'); }

  document.querySelectorAll('#lift .fdir').forEach(b=>b.onclick=()=>{ AUDIO.tick(); lift.dir=b.dataset.d; document.querySelectorAll('#lift .fdir').forEach(x=>x.classList.toggle('on',x===b)); readL(); drawLift(1); });
  $('#lift .fnum').addEventListener('input',()=>{ readL(); drawLift(1); });
  $('#lift .fnum').addEventListener('keydown',e=>{ if(e.key==='Enter') runLift(); });
  $('#lift .fgo').onclick=runLift;
  $('#ctrl .cpbtn').onclick=power; $('#ctrl .cslot').onclick=pullLever;
  $('#ctrl .cgrid').innerHTML=[1,2,3,4,5,6,7,8].map(n=>`<div class="cl off" data-n="${n}"><i></i><b>${n}</b></div>`).join('');

  ROOMS.push({id:'room2', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    for(let k=1;k<=8;k++) I['cbtn_'+k]&&I['cbtn_'+k].traverse(o=>{ if(o.material) o.material=o.material.clone(); });   // 버튼마다 따로 불을 켠다
    I.cpower&&I.cpower.traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    if(I.horsehome_5) I.horsehome_5.visible=false;
    add('manual_carousel','회전목마 야간 점검 방법',async()=>{ AUDIO.click(); await showMsg(ROOM2.manual.title,ROOM2.manual.body);
      if(!S.flags.manual_carousel){ S.flags.manual_carousel=true; INV.note('manual_carousel',ROOM2.manual.title,ROOM2.manual.body); setGoal(null);
        await mono(['전원부터 켜 보라는 거구나. 조작반은 창가 책상 위에 있다.']); objective('조작반의 전원(ON/OFF)을 켜 보자'); } });
    add('console_carousel','조작반',openCtrl);
    add('mic_carousel','안내 방송 마이크',async()=>{ AUDIO.tone(1800,.4,'sine',.05); await announce('아, 아… 마이크 테스트.',{ms:1600}); await mono('…텅 빈 공원에 내 목소리만 울린다.'); });
    add('horse_5','기둥에서 빠진 회전목마 말',openLift,2.8,()=>!S.flags.horse_fixed);
    sync3d();
  },
  tick(dt){
    if(S.stage==='night'&&S.flags.door_open&&!S.flags.booth_in&&IN(P.x,P.z)){ S.flags.booth_in=true;
      mono(['회전목마 조작실. 창 너머로 말들이 보인다.','점검 방법이 어딘가 붙어 있을 텐데.']); objective('조작실 안에서 점검 방법을 찾자'); }
    // 무대 가장자리에서 한 번 : 점프 안내
    if(S.flags.saw_bad&&!S.flags.jump_hint&&P.y<.2){ const d=Math.hypot(P.x-C.x,P.z-C.z); if(d>7.7&&d<9){ S.flags.jump_hint=true;
      $('#hint').textContent=IS_TOUCH?'점프 버튼으로 무대에 올라가자':'Space 키로 점프해서 무대에 올라가자'; clearTimeout(hintT); hintT=setTimeout(()=>$('#hint').textContent='',6000); } }
    if(horseAnim){ const a=horseAnim; a.t=Math.min(1,a.t+dt/1.4); const e=a.t<.5?2*a.t*a.t:-1+(4-2*a.t)*a.t;
      a.f.position.lerpVectors(a.p0,a.h.position,e); a.f.quaternion.copy(a.q0).slerp(a.h.quaternion,e); if(a.t>=1){ a.f.visible=false; a.h.visible=true; horseAnim=null; } } }});
})();
