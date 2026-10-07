/* ============================================================
   방 5 : 자이로드롭 (꼭대기까지 올라갔다가 그대로 떨어지는 놀이기구)   [9과05-03 알짜힘 · 9과05-01 힘의 평형]
   흐름 : 후룸라이드 전원 OFF → "달토끼가 왜…" 광장 동상을 확인하러 간다 → 멀쩡하게 서 있다 (원래 얼굴) → "이상하다…" → 자이로드롭으로
        → 조작실 「점검 방법」 : ① 전원을 켜고 탑승 의자에 직접 앉아 꼭대기까지 ② 자석 브레이크 구간에서 부드럽게 멈추는지
                               ③ 세게 부딪히면 조작반 힘 화면에서 브레이크 힘을 다시 맞춘다 ④ 전원 종료
        → 조작반 전원 ON → (공포) 불이 전부 나간다 — 비상 전원도 없다. 조작실 안도 깜깜하고 브레이크 힘 화면의 초록 글씨만 남는다. 이제부터 손전등 · 받침대의 달토끼가 사라진다
          "정전인데 왜 이 기구는 아직 돌아가는 거지"
        → 첫 탑승 : 한 바퀴 돌며 올라간다 → 꼭대기에서 광장 쪽 — 받침대가 비어 있다 → 떨어진다 → 브레이크가 약해(9000 N) 바닥 완충기에 쾅
        → 조작반 힘 화면 (화살표 한 칸 = 3000 N, 의자에 작용하는 중력 6000 N)
            ① 출발할 때 : 승강장에 멈춰 있다(알짜힘 0) → 리프트가 끄는 힘을 중력 6000 N 보다 크게 입력해야 위쪽 알짜힘이 생겨 움직이기 시작한다
            ② 올라갈 때 (일정한 빠르기) : 리프트 6000 N ↑ · 중력 6000 N ↓ → 알짜힘 0
            ③ 떨어질 때 : 중력뿐 → 알짜힘 아래쪽 6000 N (점점 빨라진다)
            ④ 브레이크 구간 : 알짜힘이 위쪽 9000 N 이 되게 브레이크 힘을 정한다 → 15000 N (운동 방향과 반대쪽 알짜힘 → 느려진다)
        → 다시 탑승 : (점프 스케어) 꼭대기에서 옆자리를 돌아본다 — 비어 있다 … 다시 앞을 본 순간, 옆자리에 달토끼가 같이 타고 있다 → 떨어진다 → 부드럽게 멈춤 · 옆자리는 비어 있다
        → 전원 OFF → 책상 위 김근수의 찢어진 일지 ④ (달토끼 규칙) → 토끼 웃음소리 (킥킥) — 여기서부터 추격 (hunt.js HUNT.start) → 관람차로
   조작반 : 전원 장치(IT_gpower 빨간 버튼 · IT_glamp 표시등)와 힘 조절 장치(IT_gforce 다이얼 · IT_gscreen 화면)가 따로 있다
   ★ 글 · 숫자는 아래 ROOM5 에서 고친다. 탑 자리 · 높이는 Blender gyro_drop.py 와 맞춘다
   ============================================================ */
'use strict';
const ROOM5={
  W:6000, cell:3000,                  // 탑승 의자에 작용하는 중력 · 힘 화면 화살표 한 칸
  brake0:9000, need:9000,             // 처음 브레이크 힘 (약하다 → 알짜힘 위쪽 3000 N 뿐) · 브레이크 구간에서 필요한 알짜힘 (위쪽)
  manual:{title:'자이로드롭 야간 점검 방법'},
  note:{title:'찢어진 일지 ④',
    body:'<i>…보름 전날. 급하게 쓴 글씨.</i><br>장난이 재미없어지면 <b>배가 고파진다.</b><br>배가 고프면 <b>웃는다. 킥킥, 킥킥.</b><br>웃음소리가 나는 동안에만 움직인다.<br><b>손전등을 비추면 멈춘다.</b><br>조작실과 놀이기구 안으로는 들어오지 못한다.<br>놀이기구가 돌아가면 <b>구경하러 간다.</b> 장난치던 버릇이다.<br>— 근수'},
};
ROOM5.brake=ROOM5.W+ROOM5.need;       // 정답 : 15000 N
ROOM5.rab={a:-.5,r:2.28,y:.70,leg:-1.3};  // 옆자리 달토끼 : 의자 고리에서의 각도 · 반지름 · 높이(앉는 판 위, 안전바 뒤) · 다리 접는 각(라디안)
ROOM5.manual.body=DOC(['조작반 <b>전원 ON</b> → 탑승 의자에 <b>직접 앉아</b> 꼭대기까지 올라갔다 내려온다.','<b>자석 브레이크 구간</b>(노란 띠 아래)에서 의자가 <b>부드럽게 멈추는지</b> 본다.','바닥에 세게 부딪히면 조작반 <b>힘 화면</b>에서 브레이크 힘을 다시 맞춘다.','!점검이 끝나면 <b>전원을 끈다.</b>'],
  `※ 의자에 작용하는 중력은 <b>${ROOM5.W} N</b>. 브레이크 구간에서 <b>알짜힘이 위쪽 ${ROOM5.need} N</b> 이어야 알맞게 멈춘다.`);
SIGNS.booth_gyro=['자이로드롭 조작실','GYRO DROP CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.manual_gyro=['점검 방법','자이로드롭 · 야간 점검','#fbf6e8','#8e231c'];
SIGNS.gyro_brake=['자석 브레이크','노란 띠 아래 = 브레이크 구간','#f2c230','#111111'];
SIGNS.gpower=['전원','POWER','#111111','#f2c230']; SIGNS.gforce=['브레이크 힘 조절','BRAKE FORCE · N','#111111','#7dffb0'];

(function(){
  const R=ROOM5, TX=-20, TZ=-49, RS=2.28, EYE=1.66;        // 탑 가운데 · 앉은 자리 반지름 · 앉은 눈높이 (의자가 바닥에 있을 때)
  const TOP=34, BRK=14, G=9.8;                             // 의자가 올라가는 높이 · 브레이크 구간이 시작되는 높이 (m)
  const st={power:false,brake:R.brake0};
  const spot=()=>PARK.spots.booth_gyro||{x:-27.98,z:-45.9};
  const inBooth=()=>P.x>-28.75&&P.x<-26.45&&P.z>-48.95&&P.z<-46.65;      // 조작반 · 점검 방법 · 쪽지는 조작실 안에서만
  const ease=x=>x*x*(3-2*x), zf=v=>camera.aspect<1?Math.min(60,v/camera.aspect*.9):v;
  const turn=(a,b,k)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*k;
  const beat=()=>{ AUDIO.tone(52,.18,'sine',.55); AUDIO.tone(48,.16,'sine',.45,.18); };

  /* ---------- 정전 : 불이 전부 나간다 — 비상 전원도 없다 · 하늘빛도 어두워진다(game.js tickSky) · 받침대의 달토끼가 사라진다
     조작실 안에는 브레이크 힘 화면의 초록 글씨만 남는다 (조작실 불 하나를 화면 앞으로 옮겨 초록빛으로 — 불 개수를 바꾸지 않으려고) ---------- */
  function blackout(){ if(S.blackout) return; S.blackout=true;
    LIGHTS.forEach(o=>{ o.base=0; o.l.intensity=0; o.flicker=0; });        // 끄지 않고 밝기만 0 (보이는 불 개수가 바뀌면 셰이더를 다시 짠다)
    PARK.bulbs.forEach(m=>m.userData.dim=0);
    const o=PARK.lights.booth_gyro, p=scr&&scr.mesh?scr.mesh.position:null; if(o&&p){ o.l.position.set(p.x+.3,p.y,p.z-.2); o.l.color.setHex(0x3dff8a); o.l.distance=1.5; o.base=.3; o.l.intensity=.3; }
    if(MOONRABBIT.statue) MOONRABBIT.statue.visible=false; S.flags.rabbit_gone=true; tickSky(0,true); }
  // 꼭대기에서 광장을 볼 때 : 받침대 옆 가로등 하나만 깜빡인다 (가장 가까운 불을 잠깐 빌려 온다)
  let pk=null;
  function peekLight(on){
    if(on){ let o=null, bd=1e9; LIGHTS.forEach(q=>{ const d=Math.hypot(q.l.position.x-STATUE.x,q.l.position.z-STATUE.z); if(d<bd){ bd=d; o=q; } }); if(!o) return;
      pk={o,pos:o.l.position.clone(),far:o.far,dist:o.l.distance,fl:o.flicker}; o.l.position.set(STATUE.x+1.8,3.6,STATUE.z+1.7); o.l.distance=15; o.base=2.6; o.l.intensity=2.6; o.far=1e3; o.flicker=1.3; lightT=1; }
    else if(pk){ const o=pk.o; o.l.position.copy(pk.pos); o.l.distance=pk.dist; o.far=pk.far; o.flicker=pk.fl; o.base=0; o.l.intensity=0; pk=null; lightT=1; } }

  /* ---------- 탑승 의자 : ANIM_gyro 의 높이 · 회전 ---------- */
  let rd=null, gy=0, ga=0, base=null;
  function setRing(){ const A=PARK.anim.gyro; if(!A) return; if(base===null) base=A.position.y; A.position.y=base+gy; A.rotation.y=ga; }
  function sit(lean,dy){ const r=RS+lean; P.x=TX+r*Math.sin(ga); P.z=TZ+r*Math.cos(ga); P.y=gy+EYE-P.eye+dy; }
  function aim(x,y,z){ const ex=P.x, ey=P.y+P.eye, ez=P.z; return [Math.atan2(-(x-ex),-(z-ez)),Math.atan2(y-ey,Math.hypot(x-ex,z-ez))]; }

  /* ---------- 옆자리의 달토끼 (두 번째 탑승) : 탑승 의자(ANIM_gyro)의 오른쪽 옆자리에 같이 타고 있다 — 공포 얼굴로 나를 본다 ---------- */
  let rab=null, head=null, flash=null;
  function makeRabbit(){ const A=PARK.anim.gyro; if(!MOONRABBIT.src||!A) return;
    const o=MOONRABBIT.make('Idle',true); head=o.getObjectByName('head'); MOONRABBIT.face(o,true);
    rab=new THREE.Group(); rab.add(o); rab.scale.setScalar(.75); rab.visible=false; A.add(rab);
    const a=R.rab.a, r=R.rab.r; rab.position.set(r*Math.sin(a),R.rab.y,r*Math.cos(a));      // 오른쪽 옆 의자 (앉는 판 위) 에서 안전바 너머로 몸을 내밀고
    rab.rotation.y=Math.atan2(-rab.position.x,RS-rab.position.z)-.3;                 // 내 쪽으로 몸을 돌리고 있다 (얼굴이 거의 정면으로 보인다 — 살짝 비스듬히)
    ['leg_L','leg_R'].forEach(n=>{ const b=o.getObjectByName(n); if(b){ b.rotation.set(0,0,0); b.rotateX(R.rab.leg); } });      // 다리를 앞으로 접어 앉은 자세 (Idle 은 멈춰 있어 덮어쓰지 않는다)
    if(head){ head.rotateX(-.22); head.userData.q0=head.quaternion.clone(); } }
  function showRabbit(){ if(!rab) return; rab.visible=true; PARK.anim.gyro.updateMatrixWorld(true);
    const m=rab.getObjectByName('rabbit_hmouth')||head||rab; rab.userData.face=m.getWorldPosition(new THREE.Vector3()); rab.userData.face.y+=.1; }
  const roll=a=>{ if(head&&head.userData.q0) head.quaternion.copy(head.userData.q0).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),a)); };
  function blink(ms=140){ if(!flash) return; flash.style.opacity=1; setTimeout(()=>flash.style.opacity=0,ms); }

  /* ---------- 타기 : 올라간다(한 바퀴 돈다) → 꼭대기에서 멈춤 → 떨어진다 → 자석 브레이크 → 멈춤 / 쾅 ---------- */
  function ride(second){ return new Promise(res=>{ setGoal(null); P.free=false; P.vx=P.vz=0; gy=0; ga=0; if(S.flags.torch&&!S.torch) toggleLight();      // 정전 뒤라 손전등이 꺼져 있으면 옆자리가 안 보인다
    rd={mode:'up',t:0,v:0,tick:0,res,second,fov:camera.fov,fog:scene.fog.density,yaw:Math.PI,pitch:-.08,k:0,shake:0}; AUDIO.tone(120,.5,'sawtooth',.06,0,50); }); }
  function once(d,key){ if(d[key]) return false; d[key]=1; return true; }
  function stepRide(dt){ const d=rd; d.t+=dt; let lean=0, dy=0;
    if(d.mode==='up'){ d.v=Math.min(3.6,d.v+2.4*dt); gy=Math.min(TOP,gy+d.v*dt); ga=Math.PI*2*ease(gy/TOP); d.yaw=ga+Math.PI; d.pitch=-.1;
      d.tick-=dt; if(d.tick<=0){ d.tick=.24; AUDIO.tone(64,.05,'square',.07); }                    // 철컥, 철컥 — 리프트
      if(gy>=TOP){ d.mode='hold'; d.t=0; ga=0; d.yaw=Math.PI; AUDIO.tone(300,.12,'square',.08); AUDIO.noise(.25,.2,0,900); if(!d.second) peekLight(true); } }
    else if(d.mode==='hold'){ const t=d.t;
      if(!d.second){          // 첫 탑승 : 광장 쪽 — 받침대가 비어 있다
        d.k=t<.7?0:t<1.9?ease((t-.7)/1.2):t<5?1:t<5.7?1-ease((t-5)/.7):0; sit(0,0); const [ty,tp]=aim(STATUE.x,1.8,STATUE.z);
        d.yaw=turn(Math.PI,ty,d.k); d.pitch=lerp(-.1,tp,d.k);
        if(t>.7&&once(d,'z1')) zoom(zf(8),1200); if(t>2.3&&once(d,'h1')) beat(); if(t>2.6&&once(d,'say')) toast('…받침대 위에, 달토끼가 없다.',2600); if(t>3.3&&once(d,'h2')) beat();
        if(t>5&&once(d,'z2')) zoom(d.fov,600);
        if(t>6){ peekLight(false); d.mode='drop'; d.v=0; d.tick=0; AUDIO.tone(220,.1,'square',.1); AUDIO.noise(.3,.3,0,700); zoom(d.fov+16,600); } }
      else {                  // 두 번째 탑승 : 오른쪽 옆자리를 돌아본다 — 비어 있다 → 다시 앞 → (정적) → 옆자리에 달토끼가 타고 있다
        d.k=t<1.1?0:t<2.2?ease((t-1.1)/1.1):t<3?1:t<3.7?1-ease((t-3)/.7):0; d.yaw=Math.PI-1.05*d.k; d.pitch=lerp(-.1,-.24,d.k);
        if(t>.8&&once(d,'creak')){ AUDIO.tone(170,.6,'sawtooth',.035,0,-70); AUDIO.noise(.3,.08,0,2400); }            // 끼익 — 옆에서 무슨 소리가
        if(t>2.3&&once(d,'h1')) beat(); if(t>3.9&&once(d,'h2')) beat();
        if(t>4.5){ if(once(d,'snap')){ showRabbit(); blink(50); AUDIO.sfx('scare',1.3); AUDIO.tone(1900,1.1,'sawtooth',.18,0,-1400); AUDIO.noise(.9,.5,0,3000); AUDIO.tone(70,1.2,'sine',.5,0,-30);
            camera.fov=zf(50); camera.updateProjectionMatrix(); d.shake=1; }
          if(rab&&rab.userData.face){ sit(0,0); const fc=rab.userData.face, [ty,tp]=aim(fc.x,fc.y,fc.z); d.yaw=ty; d.pitch=tp; } d.shake=Math.max(.35,d.shake-dt); roll(Math.sin(t*38)*.05); }
        if(t>5.5){ d.mode='drop'; d.v=0; d.tick=0; AUDIO.tone(220,.1,'square',.1); AUDIO.noise(.3,.3,0,700); zoom(d.fov+16,500); } } }
    else if(d.mode==='drop'){ d.v+=G*dt; gy-=d.v*dt; d.pitch=lerp(d.pitch,-.38,Math.min(1,dt*3));
      if(d.second){ d.yaw=turn(d.yaw,Math.PI,Math.min(1,dt*5)); d.shake=Math.max(0,d.shake-dt*1.4); }                // 떨어지며 앞을 본다 — 옆자리엔 아직 그것이 있다
      d.tick-=dt; if(d.tick<=0){ d.tick=.12; AUDIO.noise(.16,Math.min(.3,d.v/60),0,500+d.v*60); }      // 바람 소리
      if(gy<=BRK){ d.mode='brake'; d.a=G*(st.brake-R.W)/R.W; AUDIO.tone(170,1.0,'sawtooth',.1,0,-100); zoom(d.fov,900);        // 알짜힘 ÷ 질량 = 느려지는 정도
        if(d.second){ blink(); if(rab) rab.visible=false; } } }
    else if(d.mode==='brake'){ d.v=Math.max(0,d.v-d.a*dt); gy-=d.v*dt; d.k=Math.max(0,d.k-dt*1.6); d.pitch=lerp(d.pitch,-.12,Math.min(1,dt*2));
      if(gy<=0){ gy=0; if(d.v>3){ d.mode='crash'; d.t=0; d.shake=1; blink(90); AUDIO.noise(.9,.9,0,300); AUDIO.tone(50,.8,'sine',.7,0,-20); AUDIO.tone(900,.25,'square',.12,0,-600); } else return finish('ok'); }
      else if(d.v<=.5) d.mode='settle'; }
    else if(d.mode==='settle'){ gy=Math.max(0,gy-1.3*dt); d.pitch=lerp(d.pitch,-.08,Math.min(1,dt*2)); if(gy<=0) return finish('ok'); }
    else if(d.mode==='crash'){ d.shake=Math.max(0,1-d.t/1.1); if(d.t>1.5) return finish('crash'); }
    dy+=d.shake*Math.sin(d.t*70)*.06; sit(lean,dy); P.yaw=d.yaw; P.pitch=d.pitch+d.shake*Math.sin(d.t*53)*.03;
    setRing(); scene.fog.density=d.fog*lerp(1,.3,clamp(gy/10,0,1));                     // 높이 올라가면 멀리까지 보인다
    camera.position.set(P.x,P.y+P.eye,P.z); camera.rotation.set(P.pitch,P.yaw,0); }      // 의자와 같은 프레임에 맞춘다 (한 프레임 늦으면 떨어질 때 어긋난다)
  function finish(r){ const d=rd; rd=null; gy=0; ga=0; setRing(); if(rab) rab.visible=false; peekLight(false); zoom(d.fov,500); scene.fog.density=d.fog;
    warp(TX,TZ+3.5,TX,TZ+12); d.res(r); }

  async function ride1(){ await mono(['의자에 앉아 무릎 안전바를 내렸다. 철컥.','…점검 방법 1번. 꼭대기까지 올라갔다가 내려온다.']); toast('자이로드롭 출발'); await ride(false);
    S.flags.gyro_rode=true;
    await mono(['으윽…! 허리가….','브레이크 구간에서 거의 느려지지 않았다. 바닥 완충기에 그대로 부딪혔어.','점검 방법 3번 — 조작반 힘 화면에서 자석 브레이크의 힘을 다시 맞춰야 한다.','…그리고 방금 꼭대기에서 본 광장. 받침대 위에 달토끼가 없었다.']);
    drawScreen(); objective('조작반의 힘 조절 장치로 브레이크 힘을 맞추자'); const c=itemPos('gforce'); if(c) setGoal(c.x,c.z,'힘 조절 장치'); }
  async function ride2(){ await mono([`다시 의자에 앉았다. 브레이크 힘은 ${R.brake} N.`,'…이번엔 부드럽게 멈춰야 한다.']); await ride(true);
    S.flags.gyro_ok=true;
    await mono(['…멈췄다. 이번엔 부드럽게.','브레이크가 위로 미는 힘이 중력보다 커서 알짜힘이 위쪽 — 떨어지던 의자가 점점 느려져 멈춘 거다.','…옆자리. 방금 옆자리에 — 달토끼가 같이 타고 있었다.','없다. 옆자리는 비어 있다.','…빨리 전원을 끄고 여기서 벗어나자.']);
    objective('조작실에서 자이로드롭 전원을 끄자'); const s=spot(); setGoal(s.x,s.z,'자이로드롭 조작실'); }
  async function tapSeat(){ if(rd) return; AUDIO.click();
    if(!st.power) return mono(['자이로드롭 탑승 의자. 무릎 안전바가 올라가 있다.','…조작실에서 전원부터 켜야 움직인다.']);
    if(!S.flags.gyro_rode) return ride1();
    if(!S.flags.gyro_set) return mono('브레이크가 약하다. 조작반의 힘 조절 장치로 브레이크 힘부터 맞추자.');
    if(!S.flags.gyro_ok) return ride2();
    mono('이제 브레이크 구간에서 부드럽게 멈춘다.'); }

  /* ---------- 조작반 힘 화면 : 화살표(한 칸 = 3000 N)를 읽고 알짜힘을 구한다 · 브레이크 힘을 정한다 ---------- */
  const el=$('#gyropad'), num=el.querySelector('.fnum'), go=el.querySelector('.fgo'), cv=$('#gcv'), g=cv.getContext('2d');
  const pad={step:0,dir:null,done:false};
  const STEPS=[
    {title:'① 출발할 때', set:'lift', up0:0, at:.9, mv:'■ 승강장에 멈춤', upName:'리프트가 끄는 힘', label:'리프트가 끄는 힘',
     q:`의자가 승강장에 <b>멈춰 있다</b> — 알짜힘 0. 출발하려면 리프트가 끄는 힘이 얼마여야 할까?<br>중력 <b>${R.W} N</b> 보다 <b>커야</b> 위쪽 알짜힘이 생겨 <b>움직이기 시작한다</b>. 리프트가 끄는 힘을 입력하자.`,
     ok:n=>`리프트 ${n} N − 중력 ${R.W} N = <b>위쪽 ${n-R.W} N</b>. 알짜힘이 위쪽이니, 멈춰 있던 의자가 <b>위로 움직이기 시작한다</b>.`,
     chk:n=>n>R.W?'':n===R.W?`리프트 힘 = 중력이면 알짜힘 0 — 멈춘 채 그대로다. 중력보다 <b>커야</b> 움직이기 시작한다.`:`리프트 힘이 중력 ${R.W} N 보다 작으면 알짜힘이 <b>아래쪽</b> — 의자가 올라가지 못한다.`},
    {title:'② 올라갈 때', q:'출발한 뒤, 의자가 <b>일정한 빠르기</b>로 올라간다. 화살표를 보고 의자에 작용하는 <b>알짜힘</b>을 구하자.', up:R.W, upName:'리프트가 끄는 힘', at:.5, mv:'▲ 올라가는 중', ans:['none',0],
     ok:`위쪽 ${R.W} N − 아래쪽 ${R.W} N = <b>0</b>. 알짜힘이 0이면 빠르기가 변하지 않는다 — 그래서 <b>일정한 빠르기</b>로 올라간다.`,
     hint:d=>d==='up'?'올라가고 있다고 알짜힘이 위쪽인 건 아니다. <b>두 화살표의 길이</b>를 비교해 보자.':'중력만 있는 게 아니다. 위로 끄는 힘의 화살표도 보자.'},
    {title:'③ 떨어질 때', q:'꼭대기에서 리프트가 의자를 <b>놓았다</b>. 의자에 작용하는 <b>알짜힘</b>은?', up:0, at:.12, mv:'▼ 떨어지는 중', ans:['down',R.W],
     ok:`남은 힘은 중력뿐 — 알짜힘은 <b>아래쪽 ${R.W} N</b>. 알짜힘의 방향으로 <b>점점 빨라진다</b>.`,
     hint:d=>d==='down'?`화살표는 ${R.W/R.cell}칸. 한 칸은 ${R.cell} N 이다.`:d==='up'?'위로 작용하는 힘은 이제 없다. 남은 화살표를 보자.':'의자를 끌어 주던 힘이 없어졌다. 남은 힘이 하나 있다.'},
    {title:'④ 브레이크 구간', set:'brake', up0:R.brake0, at:.66, mv:'▼ 떨어지는 중', upName:'브레이크가 미는 힘', label:'브레이크 힘',
     q:`<b>자석 브레이크</b>가 떨어지는 의자를 위로 민다. 지금 설정은 <b>${R.brake0} N</b> — 약해서 바닥에 부딪혔다.<br>알짜힘이 <b>위쪽 ${R.need} N</b> 이 되도록 <b>브레이크 힘</b>을 다시 정하자.`,
     ok:()=>`브레이크 ${R.brake} N − 중력 ${R.W} N = <b>위쪽 ${R.need} N</b>. 떨어지는 방향과 <b>반대쪽</b> 알짜힘 — 의자가 점점 느려진다.`,
     chk:n=>n===R.brake?'':n===R.need?`그건 필요한 <b>알짜힘</b>이다. 브레이크 힘에서 중력 ${R.W} N 을 빼야 알짜힘이 된다 — 지금은 위쪽 ${n-R.W} N 뿐.`
        :n<R.W?'브레이크 힘이 중력보다 작으면 알짜힘이 <b>아래쪽</b> — 의자가 계속 빨라진다!'
        :n===R.W?'브레이크 힘 = 중력이면 알짜힘이 0 — 빠르기가 그대로다. 멈추지 않는다.'
        :n>R.brake?'너무 세다. 알짜힘이 필요한 것보다 커서 의자가 갑자기 멈춘다 — 손님이 다친다.'
        :`알짜힘 = 브레이크 힘 − 중력. 위쪽 ${R.need} N 이 되려면 브레이크가 중력을 이기고도 ${R.need} N 이 남아야 한다.`},
  ];
  function msg(h,ok){ const m=el.querySelector('.fmsg'); m.innerHTML=h; m.className='fmsg'+(ok?' ok':''); }
  function arrow(x,y1,y2,c,w=7){ g.strokeStyle=g.fillStyle=c; g.lineWidth=w; g.lineCap='butt'; const s=Math.sign(y2-y1); g.beginPath(); g.moveTo(x,y1); g.lineTo(x,y2-s*14); g.stroke();
    g.beginPath(); g.moveTo(x,y2); g.lineTo(x-12,y2-s*18); g.lineTo(x+12,y2-s*18); g.fill(); }
  function draw(){ const s=STEPS[pad.step], W=720, H=380, C=40, cx=410, cy=236, F='"Noto Sans KR","Malgun Gothic",sans-serif';
    g.fillStyle='#0e1013'; g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(255,255,255,.08)'; g.lineWidth=1; for(let x=cx%C;x<W;x+=C){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); } for(let y=cy%C;y<H;y+=C){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
    g.fillStyle='#0e1013'; g.fillRect(0,0,290,H);
    // 왼쪽 : 탑과 의자의 자리
    g.fillStyle='#22406e'; g.fillRect(74,54,30,298); g.fillStyle='#b8713a'; g.fillRect(70,232,38,120); g.fillStyle='#f2c230'; g.fillRect(70,226,38,8);
    g.fillStyle='#c8322a'; g.fillRect(62,42,54,14); g.fillStyle='#55585e'; g.fillRect(30,352,118,8);
    const sy=58+s.at*276; g.fillStyle='#c8322a'; g.fillRect(54,sy-13,70,26); g.fillStyle='#1c1e23'; g.fillRect(40,sy-9,14,18); g.fillRect(124,sy-9,14,18);
    g.font='700 18px '+F; g.textAlign='left'; g.fillStyle='#b99a3a'; g.fillText('브레이크 구간',116,330); g.fillStyle='#e9e2d2'; g.font='700 20px '+F; g.fillText(s.mv,146,sy+7);
    g.font='700 24px '+F; g.fillStyle='#f2c230'; g.fillText(s.title,14,26);
    // 오른쪽 : 의자에 작용하는 힘 (작용점 = 의자 가운데)
    const up=s.set?(/^[0-9]{1,5}$/.test(num.value.trim())?+num.value:s.up0):s.up, cu=Math.min(5.5,up/R.cell);
    g.fillStyle='#3a3d42'; g.fillRect(cx-58,cy-18,116,36); g.strokeStyle='#8a8d93'; g.lineWidth=2; g.strokeRect(cx-58,cy-18,116,36);
    g.font='700 18px '+F; g.textAlign='center'; g.fillStyle='#cfc8b8'; g.fillText('의자',cx-32,cy+7);
    if(cu>0){ arrow(cx,cy,cy-cu*C,'#6fb7ff'); g.textAlign='left'; g.fillStyle='#6fb7ff'; g.font='700 22px '+F; g.fillText(s.upName,cx+22,cy-cu*C/2+2); if(s.set){ g.font='700 20px '+F; g.fillText(up+' N',cx+22,cy-cu*C/2+28); } }
    arrow(cx,cy,cy+R.W/R.cell*C,'#ff7a66'); g.textAlign='left'; g.fillStyle='#ff7a66'; g.font='700 22px '+F; g.fillText('중력',cx+22,cy+R.W/R.cell*C/2+12);
    g.fillStyle='#f2ede2'; g.beginPath(); g.arc(cx,cy,5,0,7); g.fill();
    // 눈금 안내
    g.strokeStyle='#cfc8b8'; g.lineWidth=2; g.beginPath(); g.moveTo(548,H-24); g.lineTo(548,H-24-C); g.moveTo(540,H-24); g.lineTo(556,H-24); g.moveTo(540,H-24-C); g.lineTo(556,H-24-C); g.stroke();
    g.fillStyle='#cfc8b8'; g.font='700 18px '+F; g.textAlign='left'; g.fillText(`한 칸 = ${R.cell} N`,562,H-38);
    g.textAlign='right'; g.fillStyle='#8a8d93'; g.font='700 17px '+F; g.fillText(`${pad.step+1} / ${STEPS.length}`,W-12,24); }
  function syncDir(){ el.querySelectorAll('.gdir .fdir').forEach(b=>b.classList.toggle('on',b.dataset.d===pad.dir)); num.disabled=!STEPS[pad.step].set&&pad.dir==='none'; if(num.disabled) num.value='0'; }
  function showStep(){ const s=STEPS[pad.step]; pad.dir=null; pad.done=false; num.value=''; num.disabled=false; el.querySelector('.fq').innerHTML=s.q;
    el.querySelector('.gdir').style.display=s.set?'none':''; el.querySelector('.gnum .fl').textContent=s.set?s.label:'알짜힘의 크기'; go.textContent=s.set?'설정':'확인';
    msg(''); syncDir(); draw(); if(!IS_TOUCH&&s.set) setTimeout(()=>num.focus(),50); }
  function openPad(){ pad.step=Math.min(STEPS.length-1,S.flags.gyro_step||0); showStep(); ov('#gyropad',true); AUDIO.click(); }
  function right(n){ const s=STEPS[pad.step]; AUDIO.ok(); msg(typeof s.ok==='function'?s.ok(n):s.ok,true); pad.done=true; S.flags.gyro_step=pad.step+1; go.textContent=pad.step<STEPS.length-1?'다음 ▶':'닫기'; if(s.set==='brake') st.brake=R.brake; }
  function check(){ const s=STEPS[pad.step], v=num.value.trim(), n=+v;
    if(pad.done){ AUDIO.click(); if(pad.step<STEPS.length-1){ pad.step++; showStep(); if(pad.step===2){ AUDIO.sfx('laugh',.45,.9); setTimeout(()=>toast('…킥킥. 방금, 지붕 위에서?'),300); } return; }
      ov('#gyropad',false); return solved(); }
    if(s.set){ if(!/^\d{1,5}$/.test(v)){ AUDIO.err(); return msg(s.label+'을 숫자로 입력하자 (단위 N).'); }
      const bad=s.chk(n); if(!bad) return right(n); AUDIO.err(); return msg(bad); }
    if(!pad.dir){ AUDIO.err(); return msg('알짜힘의 <b>방향</b>부터 고르자.'); }
    if(pad.dir!=='none'&&!/^\d{1,5}$/.test(v)){ AUDIO.err(); return msg('알짜힘의 크기를 숫자로 입력하자 (단위 N).'); }
    if(pad.dir===s.ans[0]&&(pad.dir==='none'||n===s.ans[1])) return right();
    AUDIO.err(); msg(s.hint(pad.dir)); }
  el.querySelectorAll('.gdir .fdir').forEach(b=>b.onclick=()=>{ if(pad.done) return; AUDIO.tick(); pad.dir=b.dataset.d; if(pad.dir!=='none'&&num.value==='0') num.value=''; syncDir(); });
  num.addEventListener('input',()=>{ if(STEPS[pad.step].set) draw(); }); num.addEventListener('keydown',e=>{ if(e.key==='Enter') check(); }); go.onclick=check;
  async function solved(){ S.flags.gyro_set=true; drawScreen();
    await mono([`브레이크 힘을 ${R.brake} N 으로 맞췄다.`,'점검 방법 2번 — 다시 타서, 이번엔 부드럽게 멈추는지 확인하자.']);
    objective('탑승 의자에 다시 앉아 확인하자'); setGoal(TX,TZ+3.2,'탑승 의자'); }

  /* ---------- 조작실 : 점검 방법 · 조작반 · 찢어진 일지 ---------- */
  async function readManual(){ AUDIO.click(); await showMsg(R.manual.title,R.manual.body);
    if(S.flags.manual_gyro) return; S.flags.manual_gyro=true; INV.note('manual_gyro',R.manual.title,R.manual.body); setGoal(null);
    await mono(['또 직접 타 보라고…. 이번엔 꼭대기에서 그대로 떨어지는 걸.','떨어지는 의자를 자석 브레이크가 멈춰 세우는 거구나.']); objective('조작반의 전원 버튼을 누르자'); const c=itemPos('gpower'); if(c) setGoal(c.x,c.z,'전원 버튼'); }
  async function readNote(){ AUDIO.noise(.12,.25,0,3200); await showMsg(R.note.title,TORN(R.note.body));
    if(S.flags.gnote) return; S.flags.gnote=true; INV.note('gnote',R.note.title,TORN(R.note.body));
    await mono(['김근수 씨의 글씨다.','장난에 싫증이 나면 배가 고파지고, 배가 고프면 — 웃는다.','웃음소리가 나는 동안에만 움직인다. 손전등을 비추면 멈춘다.']); }
  // 전원 표시등 · 힘 조절 장치의 화면 (조작반 위에 세운 3D 화면 — 지금 브레이크 힘)
  let scr=null;
  function lamp(on){ const o=PARK.items.glamp; o&&o.traverse(m=>{ if(m.material){ m.material.color.setHex(on?0x3ddc84:0x2c312c); m.material.emissive.setHex(0x3ddc84); m.material.emissiveIntensity=on?1.4:0; } }); }
  function drawScreen(){ if(!scr) return; const g=scr.g, w=scr.w, h=scr.h, F='"Noto Sans KR","Malgun Gothic",sans-serif'; g.fillStyle=st.power?'#07130d':'#050607'; g.fillRect(0,0,w,h); g.textAlign='center';
    if(!st.power){ g.fillStyle='#2f3d36'; g.font='700 36px '+F; g.fillText('전원 꺼짐',w/2,h/2+12); scr.tex.needsUpdate=true; return; }
    const ok=st.brake===R.brake, bad=S.flags.gyro_rode&&!ok;
    g.strokeStyle=ok?'#3dff8a':bad?'#ff6a50':'#2c6b48'; g.lineWidth=6; g.strokeRect(4,4,w-8,h-8);
    g.fillStyle='#7dffb0'; g.font='700 30px '+F; g.fillText('자석 브레이크가 위로 미는 힘',w/2,50);
    g.fillStyle=bad?'#ffb0a0':'#9dffc4'; g.font='700 112px '+F; g.fillText(st.brake+' N',w/2,170);
    g.fillStyle=ok?'#3dff8a':bad?'#ff8a7a':'#9fd8b8'; g.font='700 28px '+F; g.fillText(ok?'● 설정 완료':bad?'▲ 약하다 — 다시 맞출 것':'시험 운행 대기',w/2,240); scr.tex.needsUpdate=true; }
  // 전원 장치 : 빨간 버튼
  async function power(){ AUDIO.click();
    if(!S.flags.manual_gyro) return mono('…점검 방법부터 찾자.');
    if(S.flags.gyro_done) return mono('전원 버튼. 점검을 마치고 꺼 두었다.');
    if(!st.power){ st.power=true; S.flags.gyro_power=true; P.free=false; AUDIO.tone(120,.4,'sawtooth',.06,0,60); await sleep(400); lamp(true); drawScreen(); AUDIO.tone(1100,.08,'square',.07);
      await sleep(900); AUDIO.noise(.5,.7,0,180); AUDIO.tone(55,1.0,'sine',.55,0,-25); blink(220); blackout(); await sleep(1100); P.free=true;      // 퍽 — 정전
      await mono(['…뭐야. 불이 전부 나갔다.','조작실 안까지 깜깜하다. 비상등도 없다.','…브레이크 힘 화면만. 초록 글씨만 켜져 있다.','정전인데 — 왜 이 기구는 아직 돌아가는 거지.','손전등을 켜자. …점검은 계속해야 한다.']);
      S.flags.torch=true; if(!S.torch) toggleLight(); toast('정전 · 손전등 F');
      objective('탑승 의자에 앉아 시험 운행을 하자'); setGoal(TX,TZ+3.2,'탑승 의자'); return; }
    if(S.flags.gyro_ok&&!S.flags.gyro_done){ st.power=false; S.flags.gyro_done=true; lamp(false); drawScreen(); AUDIO.tone(300,.15,'square',.08); setGoal(null);
      await mono(['자이로드롭 점검도 끝. 전원도 껐다.']);
      if(!S.flags.gnote){ await mono(['…책상 위에 찢어진 종이가 한 장 있다.']); await readNote(); }
      return chase(); }
    mono(S.flags.gyro_done?'전원 버튼. 꺼 두었다.':'전원 버튼. 점검이 끝나면 꺼야 한다.'); }
  // 힘 조절 장치 : 다이얼 · 화면
  function forceDev(){ if(!st.power){ AUDIO.click(); return mono('힘 조절 장치. 다이얼 위 화면이 꺼져 있다 — 전원부터 켜야 한다.'); }
    if(!S.flags.gyro_rode){ AUDIO.click(); return mono([`자석 브레이크의 힘을 정하는 장치. 지금은 ${R.brake0} N 에 맞춰져 있다.`,'…점검 방법대로, 먼저 직접 타 보자.']); }
    if(!S.flags.gyro_set) return openPad();
    AUDIO.click(); mono(`브레이크 힘은 ${R.brake} N 으로 맞춰 두었다.`); }
  // 여기서부터 추격 : 웃음소리가 나는 동안 달토끼가 다가온다 (hunt.js)
  async function chase(){ await sleep(500); [0,2200,4400].forEach(ms=>setTimeout(()=>HUNT.thump(14),ms)); await sleep(5200);       // 킥킥… 킥킥…
    await mono(['…킥킥.','웃음소리. 일지에 쓰여 있던 — 그 소리다.','웃음소리가 나는 동안에만 움직인다. 손전등을 비추면 멈춘다. 조작실과 놀이기구 안으로는 못 들어온다.','그리고 — 놀이기구가 돌아가면 구경하러 간다.','…다음 점검은 관람차. 가야 한다.']);
    HUNT.start(); HUNT.appear(-24,-40,10);
    objective('관람차 조작실로 가자 — 웃음소리가 나면 손전등으로 달토끼를 비추자'); const f=PARK.spots.booth_ferris; if(f) setGoal(f.x,f.z,'관람차 조작실'); }

  /* ---------- 광장 동상 확인 (후룸라이드에서 본 뒤) : 멀쩡하게 서 있다 ---------- */
  async function checkStatue(){ S.flags.rabbit_checked=true; P.free=false; setGoal(null); const f0=camera.fov;
    await camTo({yaw:yawTo(STATUE.x,STATUE.z),pitch:.14},1.1); await zoom(34,800); await sleep(700);
    await mono(['…멀쩡하다.','받침대 위에 그대로 서 있다. 얼굴도 낮에 본 그대로.']); await zoom(f0,600);
    await mono(['내가 잘못 본 건가. …이상하다.','…다음 점검이나 하자. 다음은 자이로드롭.']); P.free=true;
    objective('자이로드롭 조작실로 가자'); const s=spot(); setGoal(s.x,s.z,'자이로드롭 조작실'); }

  window.room5Done=()=>{ room4Done(); st.power=false; st.brake=R.brake; Object.assign(S.flags,{rabbit_checked:true,gyro_arrive:true,manual_gyro:true,gyro_power:true,gyro_rode:true,gyro_set:true,gyro_ok:true,gyro_done:true,gnote:true,torch:true});
    $('#lightBtn').classList.add('on'); blackout(); if(!S.torch) toggleLight(); lamp(false); drawScreen(); HUNT.start(); };

  /* ---------- 디버그 바로 가기 (Shift+5) ---------- */
  CHECKPOINTS.push({key:'5',name:'자이로드롭 조작실 앞',go(){ room4Done(); Object.assign(S.flags,{rabbit_checked:true,gyro_arrive:true,torch:true}); const s=spot(); warp(s.x,s.z+2.2,s.x,s.z-2); objective('조작실에서 점검 방법을 찾자'); }});

  ROOMS.push({id:'room5', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    if(I.glamp) I.glamp.traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    add('manual_gyro','자이로드롭 야간 점검 방법',readManual,2.4,inBooth);
    const big=(k,name,fn,w,h,d)=>{ const p=itemPos(k); if(!p) return; const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),PICK); box.position.copy(p); WORLD.add(box); INTER.push({mesh:box,name,range:2.8,fn,enabled:inBooth}); };
    big('gpower','전원 버튼',power,.5,.34,.5); big('gforce','힘 조절 장치 (브레이크 힘)',forceDev,.6,.3,.6);      // 버튼 · 다이얼이 작아서 둘레를 넓게 잡는다 (보이지 않는 상자)
    add('gscreen','힘 조절 장치 화면',forceDev,2.6,inBooth);
    if(I.gnote_gyro&&HUNT.scrap){ const p=itemPos('gnote_gyro'); I.gnote_gyro.visible=false;      // 책상 위 일지도 가장자리가 찢긴 종이로 (hunt.js 의 일지 조각과 같은 모양)
      INTER.push({mesh:HUNT.scrap(p.x,p.y+.012,p.z,.45),name:'찢어진 쪽지',range:2.4,fn:readNote,enabled:inBooth}); }
    add('mic_gyro','안내 방송 마이크',()=>{ AUDIO.click(); mono(S.blackout?'…전기가 나가서 방송이 켜지지 않는다.':'안내 방송 마이크.'); },2.4,inBooth);
    add('gyro_seat','탑승 의자',tapSeat,3.2,()=>!rd);
    if(I.gscreen){ scr=screenOn(I.gscreen,{x:-27.6,z:-47.8}); I.gscreen.visible=true; drawScreen(); }
    makeRabbit();
    flash=document.createElement('div'); flash.style.cssText='position:fixed;inset:0;z-index:56;pointer-events:none;opacity:0;background:#000;'; document.body.appendChild(flash);
  },
  tick(dt){ if(S.stage!=='night') return; if(rd) return stepRide(dt);
    const f=S.flags, ds=Math.hypot(P.x-STATUE.x,P.z-STATUE.z);
    if(f.coaster_done&&!f.rabbit_checked&&!S.busy&&P.free&&ds<7.5) checkStatue();
    if(f.rabbit_checked&&S.rabbitCalm&&ds>11) S.rabbitCalm=false;      // 돌아서 멀어지면 — 다시 고개가 따라온다
    if(f.rabbit_checked&&!f.gyro_arrive&&!S.busy&&P.free){ const s=spot();
      if(Math.hypot(P.x-s.x,P.z-s.z)<9){ f.gyro_arrive=true; setGoal(null);
        mono(['자이로드롭. 꼭대기까지 끌려 올라갔다가, 그대로 떨어지는 놀이기구.','조작실은 탑 옆에 있다.']).then(()=>{ objective('조작실에서 점검 방법을 찾자'); const m=itemPos('manual_gyro'); if(m) setGoal(m.x,m.z,'점검 방법'); }); } }
  }});
})();
