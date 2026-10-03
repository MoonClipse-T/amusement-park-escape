/* ============================================================
   방 3 : 범퍼카 (두 번째 점검 장소)   [9과05-02 마찰력 : 무게 · 접촉면]
   흐름 : 범퍼카 조작실 → 벽의 '범퍼카 야간 점검 방법'
        → 조작반 전원 : 범퍼카 6대의 전기 램프에 하나씩 불이 들어온다
        → 범퍼카를 어떻게 잴지 공구함에서 직접 고른다 (정답 : 마찰력 측정 장치)
        → 범퍼카마다 측정 장치를 걸고 천천히 당긴다 : 움직이기 시작할 때의 눈금 = 마찰력
          (교과서 실험 '용수철저울을 건 다음, 천천히 당겨 움직이기 시작할 때의 눈금을 측정한다' 와 같은 방법)
        → 4번은 너무 뻑뻑하고(60 N), 5번은 너무 잘 밀린다(10 N). 나머지는 20 N
          · 뻑뻑한 차 : 바닥에 윤활유 → 접촉면이 매끄러워져 마찰력이 작아진다 (너무 많이 뿌리면 걸레로 닦아 낸다)
          · 잘 밀리는 차 : 좌석에 추를 올린다 → 무거워져 마찰력이 커진다 (너무 많으면 추를 내린다)
        → 6대 모두 20 N → 규칙대로 전원을 끈다
        → 다음은 롤러코스터. 조작실을 나와 범퍼카장을 바라보는 순간 (공포) 화면이 잠깐 꺼지며 '쿵' —
          안쪽에 있던 2번 범퍼카가 입구까지 와서 이쪽을 보고 있고, 빨간 램프가 저절로 켜져 있으며,
          보닛 위에 아까는 없던 단추 눈 토끼 인형이 앉아 있다 (뒤돌아보지 않고 멀어지면 등 뒤에서 '쿵' 소리로 돌아보게 한다)
   ★ 글 · 숫자는 아래 ROOM3 에서 고친다
   ============================================================ */
'use strict';
const ROOM3={
  manual:{title:'범퍼카 야간 점검 방법',
    body:`1. 범퍼카와 연결된 <b>전기</b>를 작동시킨다. (조작반 전원 ON)<br>
2. 전기가 모두 들어온 것을 확인하면, 각 범퍼카로 가서 범퍼카를 <b>당겨 보며</b> 얼마나 잘 움직이는지 확인한다.<br>
3. 범퍼카마다 <b>움직이기 시작하는 힘</b>이 다르다면, 공구함의 도구를 이용해 모두 같게 맞춘다.<br>
<b class="red">4. 점검이 완료되면 전원 장치를 종료한다.</b>`},
  cars:6, base:20, max:80,                 // 보통 범퍼카의 마찰력 · 측정 장치 눈금 끝
  start:{4:60, 5:10},                       // 처음부터 다른 범퍼카 : 4번 뻑뻑함 · 5번 너무 잘 밀림
  oilStep:10, weightStep:5, maxWeights:4,   // 윤활유 한 번 −10 N · 추 하나 +5 N · 한 대에 추 최대 4개
};
SIGNS.booth_bumper=['범퍼카 조작실','BUMPER CARS CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.bpower=['ON / OFF','','#1b1b1b','#f2ede2'];
SIGNS.manual_bumper=['점검 방법','범퍼카 · 야간 점검','#fbf6e8','#8e231c'];
for(let k=1;k<=ROOM3.cars;k++){ SIGNS['bcar_'+k]=[String(k),'','#f2ede2','#1b1b1b']; SIGNS['bnum_'+k]=[String(k),'','#1b1b1b','#e8e2d6']; }

(function(){
  const R=ROOM3, N=R.cars, IN=(x,z)=>x>-40.5&&x<-38.3&&z>30.2&&z<32.4;          // 조작실 안
  const st={power:false,lit:0,busy:false}, oil={}, wt={}, meas={}, nudge={}, bells={};
  for(let k=1;k<=N;k++){ oil[k]=0; wt[k]=0; meas[k]=null; }
  const fr=k=>Math.max(5,(R.start[k]||R.base)-oil[k]*R.oilStep+wt[k]*R.weightStep);     // 지금 마찰력
  const lampOn=k=>st.power&&k<=st.lit;
  const TOOL_NO={scale:'용수철저울로도 당길 수는 있지만… 범퍼카는 무거워서 이 저울 눈금을 넘어가 버린다. 공구함에 더 알맞은 도구가 있었는데.',
    rubber:'고무줄로 당기면 늘어나긴 하는데, 눈금이 없어서 힘이 얼마인지 알 수 없다.',oil:'윤활유는 재는 도구가 아니다. 먼저 얼마나 잘 움직이는지부터 재 보자.',
    weight:'추를 올리기 전에, 먼저 얼마나 잘 움직이는지부터 재 보자.',torch:'손전등으로는 잴 수 없지.',key:'열쇠로는… 아니지.'};

  /* ---------- 3D : 조작반 램프 · 전원 · 범퍼카 기둥 램프 · 좌석의 추 ---------- */
  function glow(o,on,c=0x3ddc84){ o&&o.traverse(m=>{ if(!m.material) return; m.material.color.setHex(on?c:0x2c312c); m.material.emissive.setHex(c); m.material.emissiveIntensity=on?1.2:0; }); }
  function sync3d(){ const I=PARK.items;
    for(let k=1;k<=N;k++){ glow(I['bbtn_'+k],lampOn(k)); glow(I['bcarlamp_'+k],lampOn(k),0xffd27a); }
    if(I.bpower) I.bpower.traverse(o=>{ if(o.material){ o.material.emissive.setHex(0xff2a1a); o.material.emissiveIntensity=st.power?1.2:0; } }); }
  function syncBells(k){ const car=PARK.items['bcar_'+k], T=PARK.items.bweight; if(!car||!T) return; bells[k]=bells[k]||[];
    while(bells[k].length<wt[k]){ const i=bells[k].length, b=T.clone(); b.visible=true; b.position.set(i%2?.16:-.16,.72+Math.floor(i/2)*.26,-.3); b.quaternion.identity(); car.add(b); bells[k].push(b); }
    while(bells[k].length>wt[k]) car.remove(bells[k].pop()); }

  /* ---------- 조작반 ---------- */
  function drawCtrl(){ $('#bctrl .cpbtn').classList.toggle('on',st.power); document.querySelectorAll('#bctrl .cl').forEach(el=>el.className='cl '+(lampOn(+el.dataset.n)?'on':'off')); sync3d(); }
  function openCtrl(){ AUDIO.click(); const m=$('#bctrl .fmsg'); m.className='fmsg'; m.textContent=S.flags.manual_bumper?'':'…점검 방법부터 찾자.'; drawCtrl(); ov('#bctrl',true); }
  async function power(){ if(st.busy) return; const m=$('#bctrl .fmsg'); m.className='fmsg';
    if(st.power){ st.power=false; st.lit=0; AUDIO.tone(300,.15,'square',.08); drawCtrl();
      if(S.flags.bumper_equal&&!S.flags.bumper_done){ S.flags.bumper_done=true; m.className='fmsg ok'; m.textContent='전원을 껐다. 범퍼카 점검 끝.';
        await sleep(1200); ov('#bctrl',false); await mono(['범퍼카 점검도 끝. 전원도 껐다.','다음 점검 장소는 롤러코스터. 거기 조작실로 가 보자.']); toCoaster(); }
      else m.textContent='전원이 꺼졌다.';
      return; }
    st.busy=true; st.power=true; st.lit=0; AUDIO.tone(120,.4,'sawtooth',.06,0,60); drawCtrl(); m.textContent='범퍼카에 전기를 보내는 중…'; await sleep(500);
    for(let k=1;k<=N;k++){ st.lit=k; AUDIO.tone(900+k*80,.06,'square',.07); AUDIO.noise(.05,.2,0,4000); drawCtrl(); await sleep(320); }
    st.busy=false; m.className='fmsg ok'; m.textContent='범퍼카 6대 모두 불이 들어왔다.';
    if(!S.flags.bumper_power){ S.flags.bumper_power=true; await sleep(900); ov('#bctrl',false);
      await mono(['전기는 다 들어왔다. 이제 범퍼카를 하나씩 당겨 보며 얼마나 잘 움직이는지 확인해 보자.']);
      objective('범퍼카를 하나씩 당겨 보며 확인하자 (0/6)'); } }

  /* ---------- 마찰력 측정 : 누르고 있으면 천천히 당기고, 움직이기 시작하는 순간의 눈금이 바로 기록된다 ---------- */
  const pull={car:0,F:0,peak:null,moved:false,hold:false,shift:0,timer:0};
  function drawFric(){ const c=$('#fcv2'), g=c.getContext('2d'), W=c.width, H=c.height, ground=200, k=pull.car, carX=150+pull.shift;
    g.clearRect(0,0,W,H);
    g.fillStyle='#3a332b'; g.fillRect(0,ground,W,H-ground); g.fillStyle='#5a4e40'; for(let x=0;x<W;x+=22) g.fillRect(x,ground,12,3);
    if(oil[k]){ g.fillStyle=`rgba(120,200,255,${Math.min(.5,.15*oil[k])})`; g.beginPath(); g.ellipse(carX+10,ground+4,120,7,0,0,7); g.fill(); }
    // 범퍼카 (옆모습) · 좌석의 추
    g.fillStyle='#151517'; g.beginPath(); g.ellipse(carX,ground-22,120,22,0,0,7); g.fill();
    g.fillStyle=['#d8312a','#2f6fd6','#f2c230','#2fa35a','#f07a1e','#8a4fd0'][(k-1)%6];
    g.beginPath(); g.moveTo(carX-100,ground-30); g.quadraticCurveTo(carX-104,ground-86,carX-60,ground-92); g.lineTo(carX-20,ground-92); g.quadraticCurveTo(carX,ground-60,carX+40,ground-62); g.quadraticCurveTo(carX+100,ground-64,carX+104,ground-30); g.closePath(); g.fill();
    g.fillStyle='#2a2a30'; g.fillRect(carX-70,ground-120,8,34); g.fillStyle='#c0c4c9'; g.fillRect(carX-74,ground-190,4,90);
    for(let i=0;i<wt[k];i++){ const bx=carX-40+(i%2)*26, by=ground-70-Math.floor(i/2)*26; g.fillStyle='#3b3330'; g.beginPath(); g.arc(bx,by,11,0,7); g.fill(); g.strokeStyle='#3b3330'; g.lineWidth=4; g.beginPath(); g.arc(bx,by-12,6,Math.PI,0); g.stroke(); }
    g.fillStyle='#f2ede2'; g.font='900 26px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText(k,carX+60,ground-36);
    // 줄 · 마찰력 측정 장치 · 손
    const gx=380, gw=280, hookX=carX+112, at=v=>gx+16+(Math.min(v,R.max)/R.max)*(gw-34);
    g.strokeStyle='#c9a23e'; g.lineWidth=3; g.beginPath(); g.moveTo(hookX,ground-30); g.lineTo(gx,ground-30); g.stroke();
    g.fillStyle='#444a52'; g.fillRect(gx,ground-58,gw,56); g.fillStyle='#e8e2d6'; g.fillRect(gx+10,ground-52,gw-20,26);
    for(let v=0;v<=R.max;v+=5){ const x=at(v); g.strokeStyle='#1a1a1a'; g.lineWidth=v%10?1:2; g.beginPath(); g.moveTo(x,ground-52); g.lineTo(x,ground-(v%10?44:38)); g.stroke();
      if(v%10===0){ g.fillStyle='#1a1a1a'; g.font='700 11px "Noto Sans KR",sans-serif'; g.fillText(v,x,ground-28); } }
    if(pull.peak!==null){ const x=at(pull.peak); g.fillStyle='#ff3b30'; g.beginPath(); g.moveTo(x,ground-54); g.lineTo(x-7,ground-66); g.lineTo(x+7,ground-66); g.fill(); }
    g.fillStyle='#ff5a3a'; g.fillRect(at(pull.F)-2,ground-56,4,30);
    g.fillStyle='#d8cfbd'; g.font='700 12px "Noto Sans KR",sans-serif'; g.fillText('N',gx+gw-8,ground-8);
    g.fillStyle='#e9c49a'; g.beginPath(); g.ellipse(gx+gw+16,ground-30,16,12,0,0,7); g.fill();
    g.fillStyle='#d8cfbd'; g.font='600 14px "Noto Sans KR",sans-serif'; g.textAlign='left';
    g.fillText(pull.moved?'움직이기 시작했다! 그 순간의 눈금(▼)이 기록됐다.':pull.hold?'천천히 당기는 중…':'아래 버튼을 누르고 있으면 천천히 당긴다',20,30); }
  function drawTable(){ $('#fric .ftab').innerHTML=Array.from({length:N},(_,i)=>{ const k=i+1, v=meas[k], odd=v!==null&&v!==R.base;
      return `<div class="${k===pull.car?'cur ':''}${odd?'odd':''}"><b>${k}번</b><span>${v===null?'—':v+' N'}</span></div>`; }).join('');
    $('#fric .finfo').textContent=`윤활유 ${oil[pull.car]}번 · 추 ${wt[pull.car]}개`; }
  function tickPull(){ if(!pull.hold&&!pull.moved) return; const k=pull.car;
    if(!pull.moved){ pull.F=Math.min(R.max,pull.F+0.6); if(pull.F>=fr(k)){ pull.moved=true; pull.peak=fr(k); pull.F=fr(k); AUDIO.noise(.25,.35,0,500); AUDIO.tone(140,.2,'square',.06); record(); } }
    else pull.shift=Math.min(60,pull.shift+2.2);     // 움직이기 시작한 뒤에는 손을 놓아도 조금 더 끌려온다 (눈금은 마찰력에 머문다)
    drawFric(); if(pull.moved&&pull.shift>=60) return; pull.timer=setTimeout(tickPull,30); }
  function startPull(){ if(pull.moved||pull.hold) return; pull.hold=true; AUDIO.tick(); clearTimeout(pull.timer); tickPull(); }
  function stopPull(){ if(!pull.hold) return; pull.hold=false; if(!pull.moved){ clearTimeout(pull.timer); pull.F=0; drawFric(); $('#fric .fmsg').textContent='손을 놓자 눈금이 0 으로 돌아갔다. 범퍼카가 움직일 때까지 계속 누르고 있자.'; } }
  async function record(){ const k=pull.car, m=$('#fric .fmsg'), v=pull.peak; meas[k]=v; drawTable(); nudgeCar(k);
    const done=Object.values(meas).filter(x=>x!==null).length; m.className='fmsg'; m.innerHTML=`${k}번 범퍼카는 <b>${v} N</b> 에서 움직이기 시작했다. (기록됨)`;
    if(!S.flags.bumper_equal) objective(`범퍼카를 하나씩 당겨 보며 확인하자 (${done}/${N})`);
    if(v>R.base){ m.innerHTML+=' 다른 범퍼카보다 훨씬 뻑뻑하다!'; if(!S.flags.saw_stiff){ S.flags.saw_stiff=true; hintTools(); } }
    if(v<R.base){ m.innerHTML+=' 다른 범퍼카보다 너무 쉽게 움직인다!'; if(!S.flags.saw_slip){ S.flags.saw_slip=true; hintTools(); } }
    checkDone(); }
  function hintTools(){ if(!S.flags.bumper_equal) objective('움직이기 시작하는 힘이 다른 범퍼카가 있다 — 공구함 도구로 모두 같게 맞추자'); }
  async function checkDone(){ if(S.flags.bumper_equal) return; for(let k=1;k<=N;k++) if(meas[k]!==R.base) return;
    S.flags.bumper_equal=true; AUDIO.ok(); await sleep(1800); ov('#fric',false);
    await mono([`6대 모두 ${R.base} N 에서 움직이기 시작한다. 이제 다 똑같이 움직인다.`,'점검 방법 4번 — 점검이 끝나면 전원 장치를 종료한다.']);
    objective('점검 끝 — 범퍼카 조작반 전원을 끄자'); const b=PARK.spots.booth_bumper; if(b) setGoal(b.x,b.z,'범퍼카 조작실'); }
  function changed(msg){ const k=pull.car; meas[k]=null; resetPull(); drawTable(); syncBells(k); const m=$('#fric .fmsg'); m.className='fmsg'; m.textContent=msg+' — 다시 당겨서 확인하자.'; }
  function addOil(){ const k=pull.car; if(pull.hold) return; if(oil[k]>=6){ $('#fric .fmsg').textContent='이미 기름투성이다.'; return; } oil[k]++; AUDIO.noise(.6,.18,0,3000); changed(`${k}번 범퍼카 바닥에 윤활유를 조금 뿌렸다. 접촉면이 매끄러워졌다`); }
  function wipe(){ const k=pull.car; if(pull.hold||!oil[k]) return; oil[k]=0; AUDIO.noise(.4,.15,0,800); changed(`걸레로 ${k}번 범퍼카 바닥의 윤활유를 닦아 냈다`); }
  function addWeight(){ const k=pull.car; if(pull.hold) return; if(wt[k]>=R.maxWeights){ $('#fric .fmsg').textContent='좌석에 추를 더 올릴 자리가 없다.'; return; } wt[k]++; AUDIO.tone(90,.25,'square',.12); AUDIO.noise(.15,.3,0,400); changed(`${k}번 범퍼카 좌석에 추를 하나 올렸다. 범퍼카가 더 무거워졌다`); }
  function takeWeight(){ const k=pull.car; if(pull.hold||!wt[k]) return; wt[k]--; AUDIO.tone(160,.15,'square',.08); changed(`${k}번 범퍼카에서 추를 하나 내렸다`); }
  function resetPull(){ Object.assign(pull,{F:0,peak:null,moved:false,hold:false,shift:0}); clearTimeout(pull.timer); drawFric(); }
  function nudgeCar(k){ const c=PARK.items['bcar_'+k]; if(!c||(nudge[k]||0)>=3) return; nudge[k]=(nudge[k]||0)+1;
    const p=c.getWorldPosition(new THREE.Vector3()), d=new THREE.Vector3(P.x-p.x,0,P.z-p.z).normalize().multiplyScalar(.18); c.position.add(d); }
  async function openFric(k){ if(S.flags.bumper_done){ await mono(`${k}번 범퍼카. 전원이 꺼져 있다.`); return; }
    if(S.flags.bumper_equal&&meas[k]===R.base){ await mono(`${k}번 범퍼카. ${R.base} N — 다른 차와 같다.`); return; }
    if(!st.power){ AUDIO.click(); await mono(['전기가 들어와 있지 않다.','점검 방법대로, 먼저 조작실에서 범퍼카 전기를 켜자.']); return; }
    if(!S.flags.bumper_tool){ if(!INV.has('toolbox')){ await mono('…잴 도구가 없다. 숙소 공구함을 챙겨 오자.'); return; }
      const t=await chooseTool('범퍼카가 얼마나 잘 움직이는지(움직이기 시작하는 힘이 얼마인지) 재려면, 공구함에서 무엇을 써야 할까?'); if(!t) return;
      if(t!=='gauge'){ AUDIO.err(); await mono(TOOL_NO[t]||'…그걸로는 잴 수 없다.'); return; }
      S.flags.bumper_tool=true; await mono(['마찰력 측정 장치. 걸고 천천히 당기다가, 움직이기 시작할 때의 눈금을 읽으면 된다.']); }
    pull.car=k; resetPull(); $('#fric .ft').textContent=`마찰력 측정 · ${k}번 범퍼카`; const m=$('#fric .fmsg'); m.className='fmsg';
    m.textContent=meas[k]===null?'':`${k}번 범퍼카 지난 기록 : ${meas[k]} N`;
    $('#fric .fq').innerHTML='범퍼카에 마찰력 측정 장치를 걸었다. <b>누르고 있는 동안 천천히 당긴다.</b><br>범퍼카가 <b>움직이기 시작할 때의 눈금</b>이 범퍼카와 바닥 사이의 마찰력 크기다.';
    drawTable(); ov('#fric',true); AUDIO.click(); }
  const hb=$('#fric .fgo'); hb.addEventListener('pointerdown',e=>{ e.preventDefault(); startPull(); }); ['pointerup','pointerleave','pointercancel'].forEach(t=>hb.addEventListener(t,stopPull));
  addEventListener('keydown',e=>{ if(e.code==='Space'&&$('#fric').classList.contains('on')){ e.preventDefault(); startPull(); } });
  addEventListener('keyup',e=>{ if(e.code==='Space'&&$('#fric').classList.contains('on')) stopPull(); });
  $('#fric .foil').onclick=addOil; $('#fric .fwipe').onclick=wipe; $('#fric .fwt').onclick=addWeight; $('#fric .fwt0').onclick=takeWeight;
  $('#bctrl .cpbtn').onclick=power;
  $('#bctrl .cgrid').innerHTML=Array.from({length:N},(_,i)=>`<div class="cl off" data-n="${i+1}"><i></i><b>${i+1}</b></div>`).join('');

  /* ---------- 공포 : 조작실을 나와 범퍼카장을 바라보면 — 화면이 잠깐 꺼지며 '쿵', 2번 범퍼카가 입구에서 이쪽을 보고 있다 ---------- */
  const SPOT=new THREE.Vector3(-36,0,34.3);          // 범퍼카장 입구 바로 안쪽
  function toCoaster(){ objective('롤러코스터 조작실로 가자'); const b=PARK.spots.booth_coaster; if(b) setGoal(b.x,b.z,'롤러코스터 조작실'); }
  function looking(){ const dx=SPOT.x-P.x, dz=SPOT.z-P.z, d=Math.hypot(dx,dz); return { d, dot:(-Math.sin(P.yaw)*dx-Math.cos(P.yaw)*dz)/d }; }
  async function scare(){ const car=PARK.items.bcar_2, plush=PARK.items.bplush; S.flags.bumper_scare=true; if(!car) return;
    P.free=false; setGoal(null); const f=$('#fade'); f.style.transition='none'; f.classList.remove('clear');     // 한순간 깜깜
    AUDIO.noise(.45,1,0,180); AUDIO.tone(48,.8,'sine',.6,0,-20); AUDIO.noise(.15,.5,.05,1500);
    car.parent.updateMatrixWorld(true); car.position.copy(car.parent.worldToLocal(SPOT.clone()));
    const pq=car.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    car.quaternion.copy(pq.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.atan2(P.x-SPOT.x,P.z-SPOT.z),0))));   // 앞(+z)이 나를 본다
    if(plush){ plush.visible=true; plush.position.set(0,.84,.42); plush.scale.multiplyScalar(1.35); }   // 좌석이 아니라 보닛 위에 앉아 이쪽을 본다
    glow(PARK.items.bcarlamp_2,true,0xff2a1a);
    await sleep(160); f.classList.add('clear'); await sleep(30); f.style.transition='';
    await camTo({yaw:yawTo(SPOT.x,SPOT.z),pitch:-.06},.35); AUDIO.music('dead');
    const fov=camera.fov; zoom(fov*Math.max(.3,Math.min(.7,6/Math.hypot(SPOT.x-P.x,SPOT.z-P.z))),700);   // 멀리서 봐도 차가 크게 보이게
    await mono(['…!','2번 범퍼카…? 방금까지 저 안쪽에 있었는데.','전원도 꺼져 있는데, 불이 켜져 있다.','…저 인형은 뭐야. 아까는 분명히 없었어.','…눈이 하나 없다.']);
    await zoom(fov,500); P.free=true; await mono(['…여기 오래 있으면 안 될 것 같다. 롤러코스터로 가자.']); toCoaster(); }
  function tickScare(){ if(!S.flags.bumper_done||S.flags.bumper_scare||S.busy||!P.free||IN(P.x,P.z)) return;
    const {d,dot}=looking();
    if(P.z<33&&d>3.5&&d<(S.flags.bumper_lure?30:14)&&dot>.9) return scare();
    if(!S.flags.bumper_lure&&d>14){ S.flags.bumper_lure=true; AUDIO.noise(.35,.6,0,160); AUDIO.tone(55,.5,'sine',.35,0,-15);     // 뒤돌아보지 않고 멀어지면 등 뒤에서
      mono('…방금 뒤에서, 범퍼카 쪽에서 무슨 소리가?'); } }

  /* ---------- 디버그 바로 가기 (Shift+3) ---------- */
  function prep(n){ room2Done(); S.flags.ghost_carousel=true; S.flags.bumper_booth_in=true;
    if(n>=8){ S.flags.manual_bumper=true; INV.note('manual_bumper',R.manual.title,R.manual.body); st.power=true; st.lit=N; Object.assign(S.flags,{bumper_power:true,bumper_tool:true}); }
    if(n>=9){ for(const k in R.start){ const v=R.start[k]; if(v>R.base) oil[k]=Math.ceil((v-R.base)/R.oilStep); else wt[k]=Math.ceil((R.base-v)/R.weightStep); syncBells(k); }
      for(let k=1;k<=N;k++) meas[k]=R.base; Object.assign(S.flags,{saw_stiff:true,saw_slip:true,bumper_equal:true}); }
    sync3d(); }
  window.room3Done=()=>{ prep(9); st.power=false; st.lit=0; sync3d(); Object.assign(S.flags,{bumper_done:true,bumper_scare:true,bumper_lure:true}); };
  const inBooth=()=>{ const m=itemPos('manual_bumper'); warp(-39.6,31.2,m?m.x:-38.3,m?m.z:31.3); };
  CHECKPOINTS.push({key:'3',name:'범퍼카 조작실',go(){ prep(7); inBooth(); objective('범퍼카 조작실에서 점검 방법을 찾자'); }});

  ROOMS.push({id:'room3', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    ['bpower',...Array.from({length:N},(_,i)=>'bbtn_'+(i+1)),...Array.from({length:N},(_,i)=>'bcarlamp_'+(i+1))].forEach(n=>I[n]&&I[n].traverse(o=>{ if(o.material) o.material=o.material.clone(); }));
    if(I.bplush) I.bplush.visible=false; if(I.bweight) I.bweight.visible=false;
    add('manual_bumper','범퍼카 야간 점검 방법',async()=>{ AUDIO.click(); await showMsg(R.manual.title,R.manual.body);
      if(!S.flags.manual_bumper){ S.flags.manual_bumper=true; INV.note('manual_bumper',R.manual.title,R.manual.body); setGoal(null);
        await mono(['범퍼카 전기부터 켜고, 하나씩 당겨 보라는 거구나.']); objective('범퍼카 조작반 전원을 켜자'); } });
    add('console_bumper','범퍼카 조작반',openCtrl);
    add('mic_bumper','안내 방송 마이크',async()=>{ AUDIO.tone(1800,.4,'sine',.05); await announce('아, 아… 저기, 아무도 없습니까?',{ms:1600,voice:'mic_bumper'}); await mono('…대답이 있을 리가 없지.'); });
    for(let k=1;k<=N;k++) add('bcar_'+k,`${k}번 범퍼카`,()=>openFric(k),2.8);
    sync3d();
  },
  tick(){ if(S.stage==='night'&&S.flags.carousel_off&&!S.flags.bumper_booth_in&&IN(P.x,P.z)){ S.flags.bumper_booth_in=true; setGoal(null);
      mono(['범퍼카 조작실. 여기에도 점검 방법이 붙어 있겠지.']); objective('범퍼카 조작실에서 점검 방법을 찾자'); }
    tickScare(); }});
})();
