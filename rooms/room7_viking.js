/* ============================================================
   방 7 : 바이킹 — 마지막 점검 · 엔딩 「해돋이 바이킹」   [9과05-03 알짜힘과 운동 상태 변화]
   흐름 : 관람차 점검 뒤(04:00 붉은 달) → 바이킹 조작실
        → 벽의 「점검 방법」은 매직으로 지워져 있고, 그 위에 김근수의 찢어진 일지 ⑥ (마지막)이 핀으로 꽂혀 있다 : 달토끼는 해를 보면 돌이 된다 · 해는 높은 곳에 먼저 닿는다
          · 전원을 켜고 조종기를 들고 배에 타면 따라 탄다 · 배가 가장 빠를 때 [밀기] · 그 녀석이 있는 끝을 햇빛에 네 번
          → 공원 시계 05:30 (동쪽 하늘이 옅어진다)
        → 무선 조종기를 챙긴다 → 전원 ON → 승강대에서 배에 탄다 (서쪽 끝 좌석, 동쪽 뱃머리를 바라본다)
        → 달토끼가 웃으며 동쪽 뱃머리로 따라 탄다 → 배가 동쪽 끝(달토끼 쪽)으로 올라갈 때마다 좌석을 한 줄씩 넘어 온다 (턴)
           · 조종기 [밀기] : 배가 가장 낮은 곳(가장 빠를 때)을 지날 때 누르면 더 높이 · 엇박자면 덜컹 느려진다
           · 달토끼 쪽 끝이 점검 높이(ROOM7.target)를 넘어 꼭대기에 닿으면 — 지평선 위 첫 햇빛을 받는다 → 몸이 조금씩 돌로 굳는다
           · 햇빛 4번 → 완전히 돌 → 배가 내려가며 굴러떨어져 부서진다 → 배가 멈춘다 → 06:00 해돋이 · 엔딩
           · 그 전에 내 앞 줄까지 오면 — 덮쳐서 삼킨다 → 배에 타기 직전(승강대)에서 다시
   ★ 숫자는 아래 ROOM7, 좌석 줄은 Blender viking_ride.py BENCH_X 와 맞춘다
   ============================================================ */
'use strict';
const ROOM7={ target:50, hits:4,                 // 햇빛이 닿는 높이 (도) · 돌이 되려면 받아야 하는 햇빛 횟수
  rows:[4.5,3,1.5,0,-1.5,-3], seat:-4.5, bow:6.0, // 달토끼가 넘어오는 좌석 줄 (배 가운데에서 x, 동 → 서) · 내 자리 · 달토끼가 올라타는 뱃머리
  W2:3.6, push:.42, zone:.22, damp:.05,          // 흔들리는 빠르기² (한 번 왕복 약 3.3초) · 한 번 밀 때 더해지는 빠르기 · 가장 낮은 곳 구간(rad) · 마찰
  manual:{title:'바이킹 야간 점검 방법',
    body:DOC(['조작반 <b>전원 ON</b>.','책상 위 <b>무선 조종기</b>를 들고 배에 탄다.','조종기 <b>[밀기]</b>로 배를 흔들어 <b>점검 높이</b>까지 올린다. 배가 <b>가장 빠를 때</b> 밀어야 높이 올라간다.','!점검이 끝나면 배에서 내려 <b>전원을 끈다.</b>'])},
  note:{id:'scrap6', title:'찢어진 일지 ⑥',
    body:'<i>…마지막 조각. 점검 방법은 내가 지웠다. 이대로 하면 안 된다.</i><br>그 녀석은 원래 <b>돌</b>이다. <b>햇빛</b>을 보면 다시 돌이 된다 — 그래서 낮엔 광장의 동상.<br>해는 땅보다 <b>높은 곳에 먼저</b> 닿는다. 이 공원에서 가장 높이 올라가는 곳은 <b>바이킹</b>.<br>전원을 켜고, 책상 위 <b>무선 조종기</b>를 들고 점검하는 척 배에 타면 — 그 녀석이 <b>따라 탄다.</b><br>배가 <b>가장 빠를 때 [밀기]</b>. 끝까지 띄워, 그 녀석이 있는 끝이 <b>햇빛에 네 번</b> 닿게 하라.<br>그 녀석은 배가 오르내릴 때마다 <b>좌석을 한 줄씩</b> 넘어 온다. 그 전에.<br>나는 혼자서는 배를 높이 띄우지 못했다.<br>— 근수'} };
SIGNS.booth_viking=['바이킹 조작실','VIKING CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.manual_viking=['점검 방법','바이킹 · 야간 점검','#fbf6e8','#3a2416'];
SIGNS.vpower=['전원','POWER','#111111','#f2c230']; SIGNS.vforce=['밀기 장치','SWING · PUSH','#111111','#7dffb0'];

(function(){
  const R=ROOM7, st={power:false}, T=R.target*Math.PI/180, DECK=2.17-13, SEAT=2.62-13;      // 배 안 바닥 · 좌석 높이 (축 기준)
  const spot=()=>PARK.spots.booth_viking||{x:-11.2,z:-37.3};
  const inBooth=()=>P.x>-11.95&&P.x<-9.65&&P.z>-40.35&&P.z<-38.05;
  const sw={th:.03,om:0,cool:0,damp:R.damp};                                         // 배의 기울기(+ = 동쪽 끝이 올라감) · 빠르기
  const rd={on:false,t:0,rab:null,body:null,row:-2,hits:0,stone:0,hop:null,bite:null,fall:null,flash:0,shake:0,chunks:[],end:false,msgT:0};
  const V=new THREE.Vector3(); R.rd=rd; R.sw=sw;      // (디버그 : ROOM7.rd · ROOM7.sw)
  const ease=x=>x*x*(3-2*x);
  const A=()=>PARK.anim.viking;

  /* ---------- 무선 조종기 화면 (손에 든 조종기 : 밀기 버튼 · 높이 · 햇빛 · 달토끼가 남은 줄) ---------- */
  const rm=$('#vremote'), rcv=$('#vrcv'), rg=rcv.getContext('2d'), pushBtn=rm.querySelector('.vr-push');
  function drawRemote(){ const W=rcv.width, H=rcv.height, F='"Noto Sans KR","Malgun Gothic",sans-serif', cx=W*.3, cy=16, L=H-34;
    rg.fillStyle='#07130d'; rg.fillRect(0,0,W,H);
    rg.strokeStyle='#2c6b48'; rg.lineWidth=3; rg.beginPath(); rg.arc(cx,cy,L,Math.PI/2-1.1,Math.PI/2+1.1); rg.stroke();
    rg.strokeStyle='#f2c230'; rg.lineWidth=3; rg.setLineDash([5,4]); const ta=Math.PI/2-T; rg.beginPath(); rg.moveTo(cx+Math.cos(ta)*(L-14),cy+Math.sin(ta)*(L-14)); rg.lineTo(cx+Math.cos(ta)*(L+10),cy+Math.sin(ta)*(L+10)); rg.stroke(); rg.setLineDash([]);
    rg.fillStyle='#f2c230'; rg.font='700 15px '+F; rg.textAlign='left'; rg.fillText('햇빛',cx+Math.cos(ta)*(L+12)+2,cy+Math.sin(ta)*(L+12)+4);
    const a=Math.PI/2-sw.th; rg.strokeStyle='#9dffc4'; rg.lineWidth=5; rg.beginPath(); rg.moveTo(cx,cy); rg.lineTo(cx+Math.cos(a)*L,cy+Math.sin(a)*L); rg.stroke();
    rg.fillStyle=Math.abs(sw.th)<R.zone?'#3dff8a':'#2f5a42'; rg.beginPath(); rg.arc(cx+Math.cos(a)*L,cy+Math.sin(a)*L,9,0,7); rg.fill();
    rg.textAlign='left'; rg.font='700 15px '+F; rg.fillStyle='#9dffc4'; rg.fillText('햇빛',W*.62,26);
    for(let k=0;k<R.hits;k++){ rg.fillStyle=k<rd.hits?'#ffcf5a':'#1d2a22'; rg.beginPath(); rg.arc(W*.62+58+k*24,21,9,0,7); rg.fill(); }
    rg.fillStyle='#9dffc4'; rg.fillText('남은 줄',W*.62,62); const left=Math.max(0,R.rows.length-1-Math.max(-1,rd.row));
    for(let k=0;k<R.rows.length;k++){ rg.fillStyle=k<left?'#3dff8a':'#3a1414'; rg.fillRect(W*.62+58+k*16,51,12,14); }
    if(rd.msgT>0){ rg.fillStyle=rd.msgOk?'#3dff8a':'#ff8a7a'; rg.font='700 16px '+F; rg.fillText(rd.msg,W*.62,H-14); } }
  function say(m,ok){ rd.msg=m; rd.msgOk=ok; rd.msgT=1.6; }
  function push(){ if(!rd.on||rd.end||rd.bite||sw.cool>0) return; sw.cool=.35; pushBtn.classList.add('hit'); setTimeout(()=>pushBtn.classList.remove('hit'),120);
    const mx=Math.sqrt(2*R.W2*(1-Math.cos(1.05)));
    if(Math.abs(sw.om)<.12&&Math.abs(sw.th)<.15){ sw.om=.55; AUDIO.tone(200,.25,'sawtooth',.07,0,-80); return say('배가 움직이기 시작했다',true); }
    if(Math.abs(sw.th)<R.zone){ sw.om=clamp(sw.om+Math.sign(sw.om)*R.push,-mx,mx); AUDIO.tone(520,.09,'square',.08); AUDIO.noise(.14,.25,0,800); say('좋아 — 더 높이!',true); }
    else { sw.om*=.7; AUDIO.err(); AUDIO.noise(.25,.35,0,300); say('덜컹! 엇박자'); } }
  pushBtn.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); AUDIO.init(); push(); });
  addEventListener('keydown',e=>{ if(e.code==='Space'&&rd.on){ e.preventDefault(); push(); } });

  /* ---------- 배에 탄 달토끼 : 배(ANIM_viking)의 자식 — 좌석을 한 줄씩 넘어 온다 ---------- */
  function makeRabbit(){ const o=MOONRABBIT.make('Walk'); MOONRABBIT.face(o,1); o.userData.mats=[];
    o.traverse(m=>{ if(m.material){ m.material=m.material.clone(); o.userData.mats.push({m:m.material,c:m.material.color.clone(),r:m.material.roughness,e:m.material.emissive?m.material.emissive.clone():null}); } });
    o.userData.mouth=[]; o.traverse(m=>{ if(m.morphTargetInfluences) o.userData.mouth.push(m); });
    const g=new THREE.Group(); g.add(o); o.scale.setScalar(.85); g.rotation.y=-Math.PI/2; A().add(g); return {g,o}; }
  function setStone(k,glow){ const grey=new THREE.Color(0x6f6a63); rd.o.userData.mats.forEach(({m,c,r,e})=>{ m.color.copy(c).lerp(m.vertexColors?new THREE.Color(.5,.48,.45):grey,k); m.roughness=r+(1-r)*k;
      if(e){ m.emissive.copy(e).lerp(new THREE.Color(0xffb54a),glow); m.emissiveIntensity=Math.max(m.emissiveIntensity||0,glow); } }); }
  function rowX(i){ return i<0?R.bow:R.rows[i]; }
  function hop(to,dur){ const g=rd.g, fromX=g.position.x, fromY=g.position.y, toX=rowX(to), toY=to<0?DECK:SEAT; rd.hop={t:0,dur,fromX,fromY,toX,toY,to};
    rd.o.userData.mixer.timeScale=1.5-rd.stone*.35; rd.o.userData.play('Walk',.15); AUDIO.noise(.25,.25,0,500); AUDIO.tone(90,.25,'sine',.15,0,-20); }
  function tickHop(dt){ const h=rd.hop; if(!h) return; h.t+=dt; const k=Math.min(1,h.t/h.dur), e=ease(k);
    rd.g.position.x=h.fromX+(h.toX-h.fromX)*e; rd.g.position.y=h.fromY+(h.toY-h.fromY)*e+Math.sin(Math.PI*k)*.55;      // 좌석을 넘어 — 포물선으로
    rd.o.rotation.x=.45*Math.sin(Math.PI*k);                                                                                // 앞으로 숙였다가 펴며
    if(k>=1){ rd.hop=null; rd.row=h.to; rd.o.rotation.x=.12; rd.o.userData.play('Idle',.25); rd.o.userData.mixer.timeScale=1-rd.stone*.3; AUDIO.noise(.2,.3,0,300); } }

  /* ---------- 타기 ---------- */
  async function startRide(){ if(rd.on) return; P.free=false; setGoal(null); const f=$('#fade'); f.classList.remove('clear'); await sleep(700);
    HUNT.stop(); rd.on=true; rd.end=false; rd.t=0; rd.row=-2; rd.hits=0; rd.stone=0; rd.hop=null; rd.bite=null; rd.fall=null; sw.th=.03; sw.om=0; sw.damp=R.damp;
    S.flags.viking_ride=true; document.body.classList.add('riding'); rm.classList.add('on'); objective('조종기 [밀기] — 배가 가장 빠를 때 누른다');
    if(!S.torch&&S.flags.torch) toggleLight(); f.classList.add('clear'); await sleep(400);
    await mono(['배에 올라탔다. 맨 뒤 좌석. 무선 조종기를 꽉 쥔다.','…뱃머리 쪽, 동쪽 하늘이 옅어지고 있다.']); P.free=false; }
  function board(){ const r=makeRabbit(); rd.g=r.g; rd.o=r.o; setStone(0,0); rd.g.position.set(R.bow+.6,-8.55,0); rd.row=-1;      // 뱃전을 넘어 뱃머리로
    AUDIO.sfx('laugh',1.1,.92); hop(-1,.7); rd.hop.fromX=R.bow+.6; rd.hop.fromY=-8.55; rd.hop.to=-1; toast('…따라 탔다.',2000); }
  // 달토끼 쪽 끝이 꼭대기에 닿았다 (한 턴) : 높이가 되면 햇빛 → 그다음 한 줄 넘어 온다
  function rabbitPeak(pk){ if(!rd.g||rd.fall||rd.bite) return;
    if(rd.stone<R.hits&&pk>=T-.01){ rd.hits++; rd.stone=rd.hits; rd.flash=1.2; rd.shake=.5; AUDIO.sfx('stone',1.3); AUDIO.tone(880,.6,'sine',.05,0,200); say(`햇빛! (${rd.hits}/${R.hits})`,true); puff(1.2);
      if(rd.hits>=R.hits){ rd.o.userData.mixer.timeScale=0; rd.o.userData.mixer.stopAllAction(); rd.topple=true; return; } }      // 완전히 돌 — 배가 내려갈 때 굴러떨어진다
    if(rd.hop) return; const next=rd.row+1;
    if(next>=R.rows.length) return startBite();                                                                                // 내 앞 줄에서 — 덮친다
    hop(next,.75+rd.stone*.18); }
  // 햇빛을 받을 때 · 부서질 때 : 돌가루
  const DUST=cvs(32,32,g=>{ const gr=g.createRadialGradient(16,16,0,16,16,16); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,32,32); });      // 둥근 돌가루
  function puff(n){ const geo=new THREE.BufferGeometry(), N=Math.floor(40*n), p=new Float32Array(N*3); rd.o.updateMatrixWorld(true); const c=rd.o.getWorldPosition(V).clone(); c.y+=1.1;
    for(let i=0;i<N;i++){ p[i*3]=c.x+(Math.random()-.5)*1.2; p[i*3+1]=c.y+(Math.random()-.5)*1.6; p[i*3+2]=c.z+(Math.random()-.5)*1.2; }
    geo.setAttribute('position',new THREE.BufferAttribute(p,3)); const pt=new THREE.Points(geo,new THREE.PointsMaterial({map:DUST,color:0xbdb6aa,size:.09,transparent:true,opacity:.8,depthWrite:false}));
    scene.add(pt); rd.chunks.push({o:pt,t:0,dust:true}); }

  /* ---------- 덮치기 (배 위) : 노려본다 → 입이 크게 벌어진다 → 덮친다 — 배 안 좌표에서 (배가 흔들려도 같이) ---------- */
  function startBite(){ rd.bite={ph:'stare',t:0,head:rd.o.getObjectByName('head')}; rd.o.userData.mixer.stopAllAction(); AUDIO.sfx('laugh',1.2,.8); AUDIO.tone(46,1.4,'sawtooth',.16,0,-8); }
  function headTilt(a,roll){ const b=rd.bite, h=b.head; if(!h) return; if(!b.q0) b.q0=h.quaternion.clone();
    const pq=h.parent.getWorldQuaternion(new THREE.Quaternion()), rq=rd.o.getWorldQuaternion(new THREE.Quaternion());
    const w=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0).applyQuaternion(rq),-a).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1).applyQuaternion(rq),roll));
    h.quaternion.copy(pq.clone().invert().multiply(w).multiply(pq)).multiply(b.q0); }
  const mouth=k=>rd.o.userData.mouth.forEach(m=>m.morphTargetInfluences[0]=k);
  function tickBite(dt){ const b=rd.bite; b.t+=dt; const t=b.t, back=x=>{ const c=1.9; return 1+(c+1)*(x-1)**3+c*(x-1)**2; };
    if(b.ph==='stare'){ headTilt(0,.14*ease(Math.min(1,t/.4))); if(t>.4){ b.ph='open'; b.t=0; AUDIO.sfx('maw',1.3); } }
    else if(b.ph==='open'){ const k=Math.min(1,t/.6); mouth(back(k)*.98); headTilt(.3*(1-(1-k)**3),.14*(1-ease(k))); if(t>.78){ b.ph='lunge'; b.t=0; b.x0=rd.g.position.x; b.y0=rd.g.position.y; AUDIO.sfx('scare',1.2); } }
    else if(b.ph==='lunge'){ const k=Math.min(1,t/.28), e=k*k*(1.3-.3*k); mouth(1); headTilt(.3*(1-e)-.08*e,0);
      rd.g.position.x=b.x0+(R.seat+.55-b.x0)*e; rd.g.position.y=b.y0+(SEAT+.25-b.y0)*e; rd.shake=.6;            // 입이 내 눈앞으로
      if(k>=1){ b.ph='dead'; eaten(); } } }
  async function eaten(){ const f=$('#fade'); f.style.transition='none'; f.classList.remove('clear'); AUDIO.sfx('chomp',1.5); AUDIO.noise(.5,.8,0,250); await sleep(1300);
    endRide(); S.flags.caught=(S.flags.caught||0)+1; await card('','잡아먹혔다','','dead',2400);
    warp(-3.5,-38.6,-3.5,-43);      // 배에 타기 직전 (승강대) — 달토끼는 배에서 기다린다 (추격은 다시 켜지 않는다)
    objective('다시 배에 타자 — 배가 가장 빠를 때 밀어서, 더 빨리 높이'); setGoal(-3.5,-40.4,'바이킹'); f.style.transition=''; f.classList.add('clear'); await sleep(700); P.free=true; }
  function endRide(){ rd.on=false; if(rd.g){ A().remove(rd.g); scene.remove(rd.g); } rd.g=null; rd.o=null; rd.bite=null; rd.hop=null; rd.fall=null; rd.topple=false;
    sw.th=.03; sw.om=0; sw.damp=R.damp; rm.classList.remove('on'); document.body.classList.remove('riding'); S.flags.viking_ride=false; camera.fov=72; camera.updateProjectionMatrix(); }

  /* ---------- 돌이 된 달토끼가 굴러떨어져 부서진다 → 배가 멈춘다 → 06:00 ---------- */
  function topple(){ const g=rd.g; scene.attach(g); const w=A().getWorldPosition(V).clone(), p=g.getWorldPosition(new THREE.Vector3());
    const r=p.clone().sub(w), v=new THREE.Vector3(-r.y,r.x,0).multiplyScalar(sw.om);                     // 배와 같이 움직이던 빠르기 그대로 (축 둘레 접선 방향)
    rd.fall={v:v.add(new THREE.Vector3(0,.8,1.2)),w:new THREE.Vector3(1.8,.4,2.4)}; rd.topple=false; AUDIO.noise(.6,.4,0,200); }
  function tickFall(dt){ const f=rd.fall, g=rd.g; f.v.y-=9.8*dt; g.position.addScaledVector(f.v,dt); g.rotation.x+=f.w.x*dt; g.rotation.z+=f.w.z*dt;
    const fl=floorAt(g.position.x,g.position.z); if(g.position.y<=fl&&!f.done){ f.done=true; g.position.y=fl; AUDIO.sfx('shatter',1.6); rd.shake=1; puff(2.5);
      const geo=new THREE.TetrahedronGeometry(.12), mat=new THREE.MeshStandardMaterial({color:0x8d8880,roughness:1}), c=g.getWorldPosition(V).clone();       // 돌 조각
      for(let i=0;i<26;i++){ const m=new THREE.Mesh(geo,mat); m.position.copy(c).add(new THREE.Vector3((Math.random()-.5)*.8,.3+Math.random()*1.2,(Math.random()-.5)*.8)); m.scale.setScalar(.5+Math.random()*1.6);
        m.userData.v=new THREE.Vector3((Math.random()-.5)*5,2+Math.random()*3,(Math.random()-.5)*5); scene.add(m); rd.chunks.push({o:m,t:0}); }
      g.visible=false; rd.end=true; sw.damp=.55; rm.classList.remove('on'); say('',true); ending(); } }
  async function ending(){ await sleep(2200); await mono(['…돌이 됐다. 부서졌다.','배가 천천히 멈춘다.']); await sleep(1800);
    const f=$('#fade'); f.classList.remove('clear'); await sleep(1200); endRide(); rd.chunks.forEach(c=>scene.remove(c.o)); rd.chunks=[];
    S.flags.viking_end=true; S.blackout=false; objective(''); tickSky(0,true); AUDIO.stopMusic(); AUDIO.sfx('dawn',.9);
    await card('06:00','아침 6시','해가 떴다','',3200);
    if(MOONRABBIT.statue) MOONRABBIT.statue.visible=true; S.flags.rabbit_gone=false; S.rabbitAwake=false;
    const sh=PARK.items.bshoes&&PARK.items.bshoes.clone(true); if(sh){ sh.visible=true; sh.position.set(STATUE.x+1.3,floorAt(STATUE.x+1.3,STATUE.z+1)+.02,STATUE.z+1); sh.rotation.set(0,.5,0); scene.add(sh); }
    warp(STATUE.x+5.5,STATUE.z+4.5,STATUE.x,STATUE.z); P.free=false; f.classList.add('clear'); await sleep(900);
    await camTo({yaw:yawTo(STATUE.x,STATUE.z),pitch:.12},1.2); await zoom(38,1200);
    await mono(['…해가 떴다.','광장의 달토끼는 원래 자리에 서 있다. 낮에 본 그 얼굴 그대로.','받침대 아래 — 낡은 작업화 한 켤레.','…근수 씨. 끝났어요.']);
    gameClear('바이킹 꼭대기에서 첫 햇빛 — 달토끼는 다시 돌이 되었다.','야간 점검 완료'); }

  /* ---------- 매 프레임 (배를 탄 동안) ---------- */
  const seat=new THREE.Vector3(R.seat,SEAT+.95,0);
  function tickRide(dt){ rd.t+=dt; sw.cool=Math.max(0,sw.cool-dt); rd.msgT=Math.max(0,rd.msgT-dt); rd.flash=Math.max(0,rd.flash-dt*.9); rd.shake=Math.max(0,rd.shake-dt*1.5);
    if(!rd.g&&!rd.end&&rd.t>3.2&&!S.busy) board();
    const busy=S.busy||S.paused;
    if(!busy){ const sub=4, h=dt/sub; for(let i=0;i<sub;i++){ const o0=sw.om; sw.om+=(-R.W2*Math.sin(sw.th)-sw.damp*sw.om)*h; sw.th+=sw.om*h;
        if(o0*sw.om<0&&Math.abs(sw.th)>.08){ const pk=sw.th; if(Math.abs(pk)>.35) AUDIO.sfx('creak',clamp(Math.abs(pk),.3,1),.9+Math.random()*.2);
          if(pk>0&&!rd.end) rabbitPeak(pk); else if(pk<0&&rd.topple) topple(); } } }
    A().rotation.z=sw.th;
    if(rd.g&&!busy){ tickHop(dt); if(rd.bite) tickBite(dt); if(rd.fall) tickFall(dt);
      if(rd.o&&!rd.fall) setStone(rd.stone/R.hits*.9+(rd.stone>=R.hits?.1:0),rd.flash*.8); }
    rd.chunks.forEach(c=>{ c.t+=dt; if(c.dust){ c.o.material.opacity=Math.max(0,.8-c.t*.5); c.o.position.y+=dt*.3; } else if(c.o.userData.v){ const v=c.o.userData.v; v.y-=9.8*dt; c.o.position.addScaledVector(v,dt); const fl=floorAt(c.o.position.x,c.o.position.z); if(c.o.position.y<fl){ c.o.position.y=fl; v.multiplyScalar(.35); v.y=Math.abs(v.y)*.3; } c.o.rotation.x+=dt*4; } });
    // 동틀 녘 : 동쪽 지평선이 밝아지고, 햇빛을 받을 때 배가 금빛으로
    if(SKY.u){ SKY.u.sunDir.value.set(1,-.03,.05).normalize(); SKY.u.sunAmt.value=.55+rd.flash*.8; }
    if(SKY.sun){ SKY.sun.position.set(80,6,4); SKY.sun.color.setHex(0xffb060); SKY.sun.intensity=(rd.end?1.2:.15)+rd.flash*2.2; }
    // 카메라 : 서쪽 끝 좌석에서 달토끼(없으면 뱃머리)를 본다 — 배와 같이 오르내린다
    const a=A(); a.updateMatrixWorld(true); const eye=a.localToWorld(seat.clone());
    const tgt=rd.g&&!rd.fall?rd.g.localToWorld(new THREE.Vector3(0,1.25,0)):a.localToWorld(new THREE.Vector3(R.bow,DECK+2.2,0));
    if(rd.bite&&rd.bite.ph!=='stare'){ const m=rd.o.getObjectByName('rabbit_hmouth'); if(m) tgt.copy(m.getWorldPosition(V)).add(new THREE.Vector3(0,-.15,0)); }
    const dx=tgt.x-eye.x, dy=tgt.y-eye.y, dz=tgt.z-eye.z, ty=Math.atan2(-dx,-dz), tp=Math.atan2(dy,Math.hypot(dx,dz)), f=Math.min(1,dt*6);
    P.yaw+=Math.atan2(Math.sin(ty-P.yaw),Math.cos(ty-P.yaw))*f; P.pitch+=(tp-P.pitch)*f; P.x=eye.x; P.z=eye.z; P.y=eye.y-P.eye;
    camera.position.copy(eye); camera.rotation.set(P.pitch+Math.sin(S.t*53)*.012*rd.shake,P.yaw+Math.sin(S.t*47)*.01*rd.shake,Math.sin(S.t*61)*.02*rd.shake);
    drawRemote(); }

  /* ---------- 조작실 : 지워진 점검 방법 위에 꽂힌 일지 ⑥ · 무선 조종기 · 전원 ---------- */
  // 벽 포스터 : 점검 방법 줄마다 검은 매직으로 죽죽 긋고, 그 위에 찢어진 공책 쪽지를 빨간 핀으로 꽂는다
  function eraseManual(){ const m=PARK.signs.manual_viking; if(!m) return; const tex=m.material.map, c=tex.image, g=c.getContext('2d'), w=c.width, h=c.height;
    g.lineCap='round'; g.lineJoin='round'; g.strokeStyle='rgba(18,16,20,.92)';
    [0,1,2,3].forEach(i=>{ const y=h*(.46+i*.115); g.lineWidth=h*.034; g.beginPath(); g.moveTo(w*.15,y-h*.01); for(let x=w*.15;x<w*.86;x+=w*.07) g.lineTo(x+w*.035,y+(((x/w*100)|0)%2?h*.022:-h*.02)); g.stroke(); });
    g.lineWidth=h*.02; g.beginPath(); g.moveTo(w*.06,h*.3); g.lineTo(w*.9,h*.36); g.stroke();
    g.save(); g.translate(w*.55,h*.6); g.rotate(-.09); const pw=w*.6, ph=h*.5;      // 찢어진 쪽지
    g.fillStyle='#ece3c4'; g.beginPath(); const P=[[0,.02],[.12,0],[.25,.03],[.4,0],[.55,.02],[.7,0],[.85,.03],[1,.01],[.98,.25],[1,.5],[.97,.75],[1,1],[.85,.97],[.7,1],[.55,.96],[.4,1],[.25,.97],[.1,1],[0,.98],[.02,.7],[0,.45],[.03,.2]];
    P.forEach(([x,y],k)=>{ const X=-pw/2+x*pw, Y=-ph/2+y*ph; k?g.lineTo(X,Y):g.moveTo(X,Y); }); g.closePath(); g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=18; g.fill(); g.shadowBlur=0;
    g.strokeStyle='rgba(110,130,165,.6)'; g.lineWidth=2.5; for(let y=-ph/2+ph*.16;y<ph/2-10;y+=ph*.1){ g.beginPath(); g.moveTo(-pw/2+8,y); g.lineTo(pw/2-8,y); g.stroke(); }
    g.strokeStyle='rgba(30,40,70,.9)'; g.lineWidth=4; for(let y=-ph/2+ph*.14,k=0;y<ph/2-20;y+=ph*.1,k++){ g.beginPath(); let x=-pw/2+pw*.08; g.moveTo(x,y); while(x<pw/2-pw*(.1+.25*((k*7)%3)/3)){ x+=pw*.035; g.lineTo(x,y+(k+x)%7-3); } g.stroke(); }
    g.fillStyle='#c8322a'; g.beginPath(); g.arc(0,-ph/2+ph*.06,h*.018,0,7); g.fill(); g.restore(); tex.needsUpdate=true; }

  let scr=null;
  function lamp(on){ const o=PARK.items.vlamp; o&&o.traverse(m=>{ if(m.material){ m.material.color.setHex(on?0x3ddc84:0x2c312c); m.material.emissive.setHex(0x3ddc84); m.material.emissiveIntensity=on?1.4:0; } }); }
  function drawScreen(){ if(!scr) return; const q=scr.g, w=scr.w, h=scr.h, F='"Noto Sans KR","Malgun Gothic",sans-serif'; q.fillStyle=st.power?'#07130d':'#050607'; q.fillRect(0,0,w,h); q.textAlign='center';
    if(!st.power){ q.fillStyle='#2f3d36'; q.font='700 36px '+F; q.fillText('전원 꺼짐',w/2,h/2+12); scr.tex.needsUpdate=true; return; }
    q.strokeStyle='#3dff8a'; q.lineWidth=6; q.strokeRect(4,4,w-8,h-8); q.fillStyle='#7dffb0'; q.font='700 30px '+F; q.fillText('바이킹 · 무선 조종 대기',w/2,70);
    q.font='700 24px '+F; q.fillStyle='#9dffc4'; q.fillText('조종기 [밀기] — 배에 타서',w/2,140); q.fillText('점검 높이 50°',w/2,180); scr.tex.needsUpdate=true; }
  async function readNote(){ AUDIO.noise(.12,.25,0,3200); const first=!S.flags.vnote;
    if(first) await mono(['점검 방법이… 매직으로 죽죽 지워져 있다.','그 위에 찢어진 쪽지가 핀으로 꽂혀 있다.']);
    await showMsg(R.note.title,TORN(R.note.body)); INV.note(R.note.id,R.note.title,TORN(R.note.body));
    if(!first) return; S.flags.vnote=true; S.flags.manual_viking=true; setGoal(null);      // 공원 시계 05:30 (game.js CLOCK)
    await mono(['…그래서 낮엔 동상이었던 거구나.','해는 높은 곳에 먼저 닿는다. 배를 끝까지 띄워서 — 그 녀석이 있는 끝을 햇빛에 네 번.','점검하는 척 타면 따라 탄다. 한 줄씩 넘어 오기 전에.']);
    await card('05:30','새벽 5시 반','동쪽 하늘이 옅어진다','',2600);
    objective('책상 위의 무선 조종기를 챙기자'); const c=itemPos('vremote'); if(c) setGoal(c.x,c.z,'무선 조종기'); }
  async function takeRemote(){ if(!S.flags.vnote) return mono('무선 조종기. …먼저 쪽지부터 읽자.'); AUDIO.click(); PARK.items.vremote.visible=false; S.flags.vremote=true; setGoal(null);
    INV.item('vremote','무선 조종기','바이킹 배를 밀어 주는 조종기. 초록 버튼 [밀기].');
    await mono(['무선 조종기. 초록 버튼이 [밀기].','배가 가장 빠를 때 눌러야 높이 올라간다고 했지.']); objective('조작반 전원을 켜자'); const c=itemPos('vpower'); if(c) setGoal(c.x,c.z,'전원 버튼'); }
  async function power(){ AUDIO.click();
    if(!S.flags.vnote) return mono('…벽의 점검 방법부터 보자.');
    if(!S.flags.vremote) return mono('무선 조종기부터 챙기자.');
    if(st.power) return mono('전원은 켜져 있다. 배에 타자.');
    st.power=true; S.flags.viking_power=true; lamp(true); drawScreen(); AUDIO.tone(120,.4,'sawtooth',.06,0,60); AUDIO.tone(1100,.08,'square',.07,.4); await sleep(1000);
    await mono(['전원이 들어왔다. 배는 거의 멈춰 있다.','…이제 배에 탄다. 승강대로.']); objective('승강대에서 바이킹에 타자'); setGoal(-3.5,-40.4,'승강대'); }

  /* ---------- 디버그 바로 가기 (Shift+7) ---------- */
  CHECKPOINTS.push({key:'7',name:'바이킹 조작실 앞',go(){ room6Done(); S.flags.viking_arrive=true; const s=spot(); warp(s.x,s.z+2.2,s.x,s.z-2); objective('바이킹 조작실에서 점검 방법을 찾자'); }});
  window.room7Ready=()=>{ room6Done(); Object.assign(S.flags,{viking_arrive:true,manual_viking:true,vnote:true,vremote:true,viking_power:true}); st.power=true; lamp(true); drawScreen(); if(PARK.items.vremote) PARK.items.vremote.visible=false; };

  ROOMS.push({id:'room7', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    if(I.vlamp) I.vlamp.traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    add('manual_viking','점검 방법 (찢어진 쪽지가 꽂혀 있다)',readNote,2.6,inBooth);
    eraseManual();
    const big=(k,name,fn,w,h,d,on)=>{ const p=itemPos(k); if(!p) return; const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),PICK); box.position.copy(p); WORLD.add(box); INTER.push({mesh:box,name,range:2.8,fn,enabled:on||inBooth}); };
    big('vpower','전원 버튼',power,.5,.34,.5);
    big('vremote','무선 조종기',takeRemote,.45,.3,.5,()=>inBooth()&&!S.flags.vremote);
    add('vforce','밀기 장치',()=>{ AUDIO.click(); mono('밀기 장치. 오늘은 무선 조종기로 — 배에 타서 민다.'); },2.4,inBooth);
    add('mic_viking','안내 방송 마이크',()=>{ AUDIO.click(); mono('…방송이 켜지지 않는다.'); },2.4,inBooth);
    if(I.vscreen){ scr=screenOn(I.vscreen,{x:-10.8,z:-39.2}); drawScreen(); }
    const pb=new THREE.Mesh(new THREE.BoxGeometry(3,2.2,1.6),PICK); pb.position.set(-3.5,2.2,-40.6); WORLD.add(pb);      // 승강대 쪽 배 옆구리 — 타는 자리
    INTER.push({mesh:pb,name:'바이킹에 타기',range:3.4,fn:()=>{ if(!st.power) return mono(S.flags.vremote?'전원부터 켜자.':'조작실에서 점검 준비부터.'); startRide(); },enabled:()=>S.stage==='night'&&!rd.on&&!S.flags.viking_end});
  },
  tick(dt){ if(S.stage!=='night') return; const f=S.flags, a=A();
    if(rd.on) return tickRide(dt);
    if(a) a.rotation.z=st.power?.04*Math.sin(S.t*1.9):.02*Math.sin(S.t*.7);
    if(f.ferris_done&&!f.viking_arrive&&!S.busy&&P.free){ const s=spot();
      if(Math.hypot(P.x-s.x,P.z-s.z)<8){ f.viking_arrive=true; setGoal(null);
        mono(['바이킹. 용머리 배가 바람에 조금씩 흔들린다. 끼익…','마지막 점검이다. 조작실로.']).then(()=>{ objective('바이킹 조작실에서 점검 방법을 보자'); const m=itemPos('manual_viking'); if(m) setGoal(m.x,m.z,'점검 방법'); }); } }
  }});
})();
