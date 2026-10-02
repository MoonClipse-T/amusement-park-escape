/* ============================================================
   방 3 : 범퍼카 (두 번째 점검 장소)   [9과05-02 마찰력]
   흐름 : 범퍼카 조작실 → 벽의 '범퍼카 야간 점검 방법'
        → 조작반 전원 : 범퍼카 6대의 전기 램프에 하나씩 불이 들어온다
        → 범퍼카마다 마찰력 측정 장치를 걸고 천천히 당긴다 : 움직이기 시작할 때의 눈금 = 마찰력
          (교과서 실험 '용수철저울을 건 다음, 천천히 당겨 움직이기 시작할 때의 눈금을 측정한다' 와 같은 방법)
        → 한 대만 유난히 뻑뻑하다(60 N, 나머지 20 N) → 바닥에 윤활유를 뿌려 접촉면을 매끄럽게 → 다시 재서 20 N 으로 맞춘다
          (너무 많이 뿌리면 다른 차보다 잘 밀린다 → 걸레로 닦아 내고 다시)
        → 6대 모두 같으면 → 규칙대로 전원을 끈다 → 다음 점검 : 롤러코스터 (준비 중)
   ★ 글 · 숫자는 아래 ROOM3 에서 고친다
   ============================================================ */
'use strict';
const ROOM3={
  manual:{title:'범퍼카 야간 점검 방법',
    body:`1. 범퍼카와 연결된 <b>전기</b>를 작동시킨다. (조작반 전원 ON)<br>
2. 전기가 모두 들어온 것을 확인하면, 각 범퍼카로 이동하여 범퍼카가 <b>잘 밀리는지</b> 확인해 본다.<br>
3. 범퍼카가 밀리는 정도가 다르다면, <b>기름</b>을 이용하여 범퍼카가 밀리는 정도를 같게 만든다.<br>
<b class="red">4. 점검이 완료되면 전원 장치를 종료한다.</b>`},
  cars:6, base:20, stiff:4, stiffN:60, oilStep:10, max:80,     // 보통 차 마찰력 · 뻑뻑한 차 번호와 마찰력 · 윤활유 한 번에 줄어드는 양 · 눈금 끝
};
SIGNS.booth_bumper=['범퍼카 조작실','BUMPER CARS CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.bpower=['ON / OFF','','#1b1b1b','#f2ede2'];
for(let k=1;k<=ROOM3.cars;k++){ SIGNS['bcar_'+k]=[String(k),'','#f2ede2','#1b1b1b']; SIGNS['bnum_'+k]=[String(k),'','#1b1b1b','#e8e2d6']; }

(function(){
  const R=ROOM3, N=R.cars, IN=(x,z)=>x>-40.5&&x<-38.3&&z>30.2&&z<32.4;          // 조작실 안
  const orig=k=>k===R.stiff?R.stiffN:R.base;
  const st={power:false,lit:0,busy:false}, fr={}, meas={}, oiled={}, nudge={};
  for(let k=1;k<=N;k++){ fr[k]=orig(k); meas[k]=null; }
  const lampOn=k=>st.power&&k<=st.lit;

  /* ---------- 3D : 조작반 램프 · 전원 · 범퍼카 기둥 램프 ---------- */
  function sync3d(){ const I=PARK.items, glow=(o,on,c=0x3ddc84)=>o&&o.traverse(m=>{ if(!m.material) return; m.material.color.setHex(on?c:0x2c312c); m.material.emissive.setHex(c); m.material.emissiveIntensity=on?1.2:0; });
    for(let k=1;k<=N;k++){ glow(I['bbtn_'+k],lampOn(k)); glow(I['bcarlamp_'+k],lampOn(k),0xffd27a); }
    if(I.bpower) I.bpower.traverse(o=>{ if(o.material){ o.material.emissive.setHex(0xff2a1a); o.material.emissiveIntensity=st.power?1.2:0; } }); }

  /* ---------- 조작반 ---------- */
  function drawCtrl(){ $('#bctrl .cpbtn').classList.toggle('on',st.power); document.querySelectorAll('#bctrl .cl').forEach(el=>el.className='cl '+(lampOn(+el.dataset.n)?'on':'off')); sync3d(); }
  function openCtrl(){ AUDIO.click(); const m=$('#bctrl .fmsg'); m.className='fmsg'; m.textContent=S.flags.manual_bumper?'':'…점검 방법부터 찾자.'; drawCtrl(); ov('#bctrl',true); }
  async function power(){ if(st.busy) return; const m=$('#bctrl .fmsg'); m.className='fmsg';
    if(st.power){ st.power=false; st.lit=0; AUDIO.tone(300,.15,'square',.08); drawCtrl();
      if(S.flags.bumper_equal&&!S.flags.bumper_done){ S.flags.bumper_done=true; m.className='fmsg ok'; m.textContent='전원을 껐다. 범퍼카 점검 끝.';
        await sleep(1200); ov('#bctrl',false); await mono(['범퍼카 점검도 끝. 전원도 껐다.','다음은 롤러코스터다.']); objective('다음 점검 : 롤러코스터 (준비 중)'); setGoal(null); }
      else m.textContent='전원이 꺼졌다.';
      return; }
    st.busy=true; st.power=true; st.lit=0; AUDIO.tone(120,.4,'sawtooth',.06,0,60); drawCtrl(); m.textContent='범퍼카에 전기를 보내는 중…'; await sleep(500);
    for(let k=1;k<=N;k++){ st.lit=k; AUDIO.tone(900+k*80,.06,'square',.07); AUDIO.noise(.05,.2,0,4000); drawCtrl(); await sleep(320); }
    st.busy=false; m.className='fmsg ok'; m.textContent='범퍼카 6대 모두 불이 들어왔다.';
    if(!S.flags.bumper_power){ S.flags.bumper_power=true; await sleep(900); ov('#bctrl',false);
      await mono(['전기는 다 들어왔다. 이제 범퍼카가 잘 밀리는지 하나씩 확인해 보자.','공구함에 마찰력 측정 장치가 있었지. 걸고 당겨 보면 알 수 있겠다.']);
      objective('범퍼카마다 마찰력 측정 장치를 걸고 당겨 보자 (0/6)'); } }

  /* ---------- 마찰력 측정 : 누르고 있으면 당기는 힘이 커지고, 움직이기 시작하는 순간의 눈금이 남는다 ---------- */
  const pull={car:0,F:0,peak:null,moved:false,hold:false,shift:0,raf:0};
  function drawFric(){ const c=$('#fcv2'), g=c.getContext('2d'), W=c.width, H=c.height, ground=200, k=pull.car, carX=150+pull.shift;
    g.clearRect(0,0,W,H);
    g.fillStyle='#3a332b'; g.fillRect(0,ground,W,H-ground); g.fillStyle='#5a4e40'; for(let x=0;x<W;x+=22) g.fillRect(x,ground,12,3);
    if(oiled[k]){ g.fillStyle='rgba(120,200,255,.35)'; g.beginPath(); g.ellipse(carX+10,ground+4,120,7,0,0,7); g.fill(); }
    // 범퍼카 (옆모습)
    g.fillStyle='#151517'; g.beginPath(); g.ellipse(carX,ground-22,120,22,0,0,7); g.fill();
    const col=['#d8312a','#2f6fd6','#f2c230','#2fa35a','#f07a1e','#8a4fd0'][(k-1)%6]; g.fillStyle=col;
    g.beginPath(); g.moveTo(carX-100,ground-30); g.quadraticCurveTo(carX-104,ground-86,carX-60,ground-92); g.lineTo(carX-20,ground-92); g.quadraticCurveTo(carX,ground-60,carX+40,ground-62); g.quadraticCurveTo(carX+100,ground-64,carX+104,ground-30); g.closePath(); g.fill();
    g.fillStyle='#2a2a30'; g.fillRect(carX-70,ground-120,8,34); g.fillStyle='#c0c4c9'; g.fillRect(carX-74,ground-190,4,90);
    g.fillStyle='#f2ede2'; g.font='900 26px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText(k,carX+60,ground-36);
    // 줄 · 마찰력 측정 장치 (가로 용수철저울) · 손
    const gx=380, gw=280, hookX=carX+112, stretch=Math.min(pull.F,R.max)/R.max*60;
    g.strokeStyle='#c9a23e'; g.lineWidth=3; g.beginPath(); g.moveTo(hookX,ground-30); g.lineTo(gx,ground-30); g.stroke();
    g.fillStyle='#444a52'; g.fillRect(gx,ground-58,gw,56); g.fillStyle='#e8e2d6'; g.fillRect(gx+10,ground-52,gw-20,26);
    for(let v=0;v<=R.max;v+=5){ const x=gx+16+(v/R.max)*(gw-34); g.strokeStyle='#1a1a1a'; g.lineWidth=v%10?1:2; g.beginPath(); g.moveTo(x,ground-52); g.lineTo(x,ground-(v%10?44:38)); g.stroke();
      if(v%10===0){ g.fillStyle='#1a1a1a'; g.font='700 11px "Noto Sans KR",sans-serif'; g.fillText(v,x,ground-28); } }
    if(pull.peak!==null){ const x=gx+16+(pull.peak/R.max)*(gw-34); g.fillStyle='#ff3b30'; g.beginPath(); g.moveTo(x,ground-54); g.lineTo(x-6,ground-64); g.lineTo(x+6,ground-64); g.fill(); }
    const nx=gx+16+(Math.min(pull.F,R.max)/R.max)*(gw-34); g.fillStyle='#ff5a3a'; g.fillRect(nx-2,ground-56,4,30);
    g.fillStyle='#d8cfbd'; g.font='700 12px "Noto Sans KR",sans-serif'; g.fillText('N',gx+gw-8,ground-8);
    g.fillStyle='#e9c49a'; g.beginPath(); g.ellipse(gx+gw+16+stretch*.2,ground-30,16,12,0,0,7); g.fill();
    g.fillStyle='#d8cfbd'; g.font='600 14px "Noto Sans KR",sans-serif'; g.textAlign='left';
    g.fillText(pull.moved?`움직이기 시작했다! 그때의 눈금(▼)을 읽자.`:pull.hold?'천천히 당기는 중…':'아래 버튼을 누르고 있으면 천천히 당긴다',20,30); }
  function drawTable(){ $('#fric .ftab').innerHTML=Array.from({length:N},(_,i)=>{ const k=i+1, v=meas[k]; const odd=v!==null&&v!==R.base;
      return `<div class="${k===pull.car?'cur ':''}${odd?'odd':''}"><b>${k}번</b><span>${v===null?'—':v+' N'}</span></div>`; }).join(''); }
  function tickPull(){ if(!pull.hold) return; const k=pull.car; if(!pull.moved) pull.F=Math.min(R.max,pull.F+0.6);   // 움직이는 동안은 눈금이 마찰력에 머문다
    if(!pull.moved&&pull.F>=fr[k]){ pull.moved=true; pull.peak=fr[k]; pull.F=fr[k]; AUDIO.noise(.25,.35,0,500); AUDIO.tone(140,.2,'square',.06); }
    if(pull.moved) pull.shift=Math.min(60,pull.shift+2.2);
    drawFric(); if(pull.moved&&pull.shift>=60){ pull.hold=false; record(); return; } pull.raf=setTimeout(tickPull,30); }
  function startPull(){ if(pull.moved||pull.hold) return; pull.hold=true; AUDIO.tick(); tickPull(); }
  function stopPull(){ if(!pull.hold) return; pull.hold=false; clearTimeout(pull.raf); if(!pull.moved){ pull.F=0; drawFric(); $('#fric .fmsg').textContent='손을 놓자 눈금이 0 으로 돌아갔다. 범퍼카가 움직일 때까지 계속 당겨 보자.'; } }
  async function record(){ const k=pull.car, m=$('#fric .fmsg'); meas[k]=pull.peak; drawTable(); nudgeCar(k);
    const done=Object.values(meas).filter(v=>v!==null).length; m.className='fmsg'; m.innerHTML=`${k}번 범퍼카는 <b>${pull.peak} N</b> 에서 움직이기 시작했다.`;
    if(!S.flags.bumper_equal) objective(`범퍼카마다 마찰력 측정 장치를 걸고 당겨 보자 (${done}/${N})`);
    if(pull.peak>R.base){ m.innerHTML+=' 다른 범퍼카보다 훨씬 뻑뻑하다!'; if(!S.flags.saw_stiff){ S.flags.saw_stiff=true; await sleep(300); objective(`${k}번 범퍼카가 뻑뻑하다 — 윤활유로 마찰력을 다른 차와 같게 만들자`); } }
    if(pull.peak<R.base) m.innerHTML+=' 다른 범퍼카보다 너무 잘 밀린다. 기름을 너무 많이 뿌렸나?';
    checkDone(); }
  async function checkDone(){ if(S.flags.bumper_equal) return; for(let k=1;k<=N;k++) if(meas[k]!==R.base) return;
    S.flags.bumper_equal=true; AUDIO.ok(); await sleep(1600); ov('#fric',false);
    await mono([`6대 모두 ${R.base} N 에서 움직이기 시작한다. 밀리는 정도가 같아졌다.`,'점검 방법 4번 — 점검이 끝나면 전원 장치를 끈다.']);
    objective('점검 끝 — 범퍼카 조작반 전원을 끄자'); const b=PARK.spots.booth_bumper; if(b) setGoal(b.x,b.z,'범퍼카 조작실'); }
  function oil(){ const k=pull.car, m=$('#fric .fmsg'); if(pull.hold) return; if(!INV.has('oil')){ m.textContent='윤활유가 없다.'; return; }
    fr[k]=Math.max(R.base-R.oilStep,fr[k]-R.oilStep); oiled[k]=true; meas[k]=null; resetPull(); drawTable(); AUDIO.noise(.6,.18,0,3000);
    m.className='fmsg'; m.textContent=`${k}번 범퍼카 바닥에 윤활유를 조금 뿌렸다. 접촉면이 매끄러워졌다 — 다시 당겨서 확인하자.`; }
  function wipe(){ const k=pull.car, m=$('#fric .fmsg'); if(pull.hold||!oiled[k]) return; fr[k]=orig(k); oiled[k]=false; meas[k]=null; resetPull(); drawTable(); AUDIO.noise(.4,.15,0,800);
    m.className='fmsg'; m.textContent=`걸레로 윤활유를 닦아 냈다. ${k}번 범퍼카가 처음 상태로 돌아갔다.`; }
  function resetPull(){ Object.assign(pull,{F:0,peak:null,moved:false,hold:false,shift:0}); clearTimeout(pull.raf); drawFric(); }
  function nudgeCar(k){ const c=PARK.items['bcar_'+k]; if(!c||(nudge[k]||0)>=3) return; nudge[k]=(nudge[k]||0)+1;
    const p=c.getWorldPosition(new THREE.Vector3()), d=new THREE.Vector3(P.x-p.x,0,P.z-p.z).normalize().multiplyScalar(.18); c.position.add(d); }
  async function openFric(k){ if(S.flags.bumper_equal&&meas[k]===R.base){ await mono(`${k}번 범퍼카. ${R.base} N — 다른 차와 같다.`); return; }
    if(!st.power){ AUDIO.click(); await mono(['전기가 들어와 있지 않다.','점검 방법대로, 먼저 조작실에서 범퍼카 전기를 켜자.']); return; }
    if(!INV.has('gauge')){ await mono('마찰력 측정 장치가 없다. 숙소 공구함을 챙겨 오자.'); return; }
    pull.car=k; resetPull(); $('#fric .ft').textContent=`마찰력 측정 · ${k}번 범퍼카`; const m=$('#fric .fmsg'); m.className='fmsg';
    m.textContent=meas[k]===null?'':`${k}번 범퍼카 지난 측정값 : ${meas[k]} N`; $('#fric .fq').innerHTML='범퍼카에 마찰력 측정 장치를 걸었다. <b>누르고 있는 동안 천천히 당긴다.</b><br>범퍼카가 <b>움직이기 시작할 때의 눈금</b>이 범퍼카와 바닥 사이의 마찰력 크기다.';
    drawTable(); ov('#fric',true); AUDIO.click(); }
  const hb=$('#fric .fgo'); hb.addEventListener('pointerdown',e=>{ e.preventDefault(); startPull(); }); ['pointerup','pointerleave','pointercancel'].forEach(t=>hb.addEventListener(t,stopPull));
  addEventListener('keydown',e=>{ if(e.code==='Space'&&$('#fric').classList.contains('on')){ e.preventDefault(); startPull(); } });
  addEventListener('keyup',e=>{ if(e.code==='Space'&&$('#fric').classList.contains('on')) stopPull(); });
  $('#fric .foil').onclick=oil; $('#fric .fwipe').onclick=wipe;
  $('#bctrl .cpbtn').onclick=power;
  $('#bctrl .cgrid').innerHTML=Array.from({length:N},(_,i)=>`<div class="cl off" data-n="${i+1}"><i></i><b>${i+1}</b></div>`).join('');

  ROOMS.push({id:'room3', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    ['bpower',...Array.from({length:N},(_,i)=>'bbtn_'+(i+1)),...Array.from({length:N},(_,i)=>'bcarlamp_'+(i+1))].forEach(n=>I[n]&&I[n].traverse(o=>{ if(o.material) o.material=o.material.clone(); }));
    add('manual_bumper','범퍼카 야간 점검 방법',async()=>{ AUDIO.click(); await showMsg(R.manual.title,R.manual.body);
      if(!S.flags.manual_bumper){ S.flags.manual_bumper=true; INV.note('manual_bumper',R.manual.title,R.manual.body); setGoal(null);
        await mono(['범퍼카 전기부터 켜고, 하나씩 밀어 보라는 거구나.']); objective('범퍼카 조작반 전원을 켜자'); } });
    add('console_bumper','범퍼카 조작반',openCtrl);
    add('mic_bumper','안내 방송 마이크',async()=>{ AUDIO.tone(1800,.4,'sine',.05); await announce('…아무도 없습니까?',{ms:1600}); await mono('…대답이 있을 리가 없지.'); });
    for(let k=1;k<=N;k++) add('bcar_'+k,`${k}번 범퍼카`,()=>openFric(k),2.8);
    sync3d();
  },
  tick(){ if(S.stage==='night'&&S.flags.carousel_off&&!S.flags.bumper_booth_in&&IN(P.x,P.z)){ S.flags.bumper_booth_in=true; setGoal(null);
      mono(['범퍼카 조작실. 여기에도 점검 방법이 붙어 있겠지.']); objective('범퍼카 조작실에서 점검 방법을 찾자'); } }});
})();
