/* ============================================================
   방 4 : 후룸라이드 (통나무 보트가 마지막에 물로 떨어지는 놀이기구)   [9과05-04 부력]
   흐름 : 범퍼카 공포 → 후룸라이드 조작실 (문이 잠겨 있다 · 문 옆 키패드 + 쪽지)
        → 키패드 퍼즐 (과학과 상관없는 추리) : 쪽지에 김근수가 그린 '코스 그림' (후룸라이드 트랙을 위에서 본 모양)
          키패드(3×3)를 그 그림처럼 보고, 역(왼쪽 아래 = 7)에서 출발해 코스대로 누른다 → 7 4 1 2 6 9 8 7
          (트랙 제어점을 3×3 칸에 나눠 넣으면 그대로 나오는 순서 — 실제 트랙 모양)
        → 점검 방법 : ① 전원을 켜고 점검용 보트에 직접 타서 코스를 끝까지 ② 물에 떨어진 보트는 옆면 초록 선까지만 잠겨 떠야 한다
                      ③ 아니면 크레인 힘 센서로 부력을 재서 무게를 맞춘다 ④ 전원 종료
        → 조작반 전원 ON → 역의 보트에 타면 1인칭으로 트랙을 따라 달린다 (뒷자리 : 앞쪽 보트 · 모래주머니가 보인다)
        → 첫 탑승 : 모래주머니 9개(550 N) — 보트가 다 잠겨도 부력은 500 N 까지라 보트째 꼬르륵 가라앉는다 (물속 연출)
        → 크레인 리모컨 (게임 화면 그대로, 3D) : 리모컨으로 보트를 물에 내리고 올리면 실제로 내려가고,
          바로 앞 크레인 계기판(3D 화면)에 힘 센서 값이 실시간으로 뜬다 · 1칸마다 계기판 아래 기록
            550 → 450 → 350 → 250 …  (잠긴 부피가 클수록 부력이 크다)
            Q. 초록 선(3칸)까지 잠겼을 때 부력은? → 550 − 250 = 300 N   (부력 = 물에 넣기 전 값 − 잠겼을 때 값)
          리모컨으로 모래주머니(한 개 50 N)를 내리고 줄을 풀어 띄워 본다 : 떠서 멈춘 보트는 중력 = 부력 (힘의 평형)
            500 N 넘으면 가라앉음 · 300 N 보다 무거우면 초록 선 아래로 · 가벼우면 너무 뜬다 · 300 N(4개) 이면 딱 초록 선
        → 다시 타서 마지막 낙하만 확인 → 초록 선에 맞게 뜬다 → 조작실 전원 OFF
   ★ 글 · 숫자는 아래 ROOM4 에서 고친다 (bags 를 바꾸면 Blender flume_ride.py 의 SAND_N 도 같이)
   ============================================================ */
'use strict';
const ROOM4={
  route:[7,4,1,2,6,9,8,7],            // 키패드 비밀번호 = 코스 그림을 키패드 위에서 따라간 순서 (역 = 7 에서 출발해 다시 역까지)
  manual:{title:'후룸라이드 야간 점검 방법',
    body:`1. 조작반 전원을 켜고, 역에 있는 점검용 보트에 <b>직접 타서</b> 코스를 끝까지 따라가며 제대로 움직이는지 확인한다. (보트에는 손님 무게 대신 <b>모래주머니</b>를 싣는다)<br>
2. 마지막에 물에 떨어진 보트는 옆면의 <b>초록 선</b>까지만 잠겨서 떠야 한다. 너무 가라앉아도, 너무 떠도 안 된다.<br>
3. 맞지 않으면 스플래시 풀의 <b>크레인</b>에 보트를 매달고 힘 센서로 <b>부력</b>을 잰 다음, 모래주머니로 보트의 무게를 맞춘다.<br>
<b class="red">4. 점검이 끝나면 전원 장치를 종료한다.</b>`},
  boat:100, bag:50, bags:9,           // 빈 보트 100 N · 모래주머니 한 개 50 N · 처음 9개 → 550 N
  perLevel:100, levels:5, line:3,     // 보트 깊이를 5칸으로 나눠 한 칸 잠길 때마다 부력 +100 N · 초록 선 = 3칸 → 부력 300 N
};
ROOM4.code=ROOM4.route.join('');
/* 쪽지 : 키패드 숫자 자리(3×3)에 맞춰 손으로 그린 코스 — 점은 그리지 않는다 (키패드랑 겹쳐 보는 게 퍼즐) */
ROOM4.note={title:'키패드 옆 쪽지', body:(()=>{ const at=k=>[60+((k-1)%3)*90+[3,-4,2,-2,4,-3,1,-1,2][k-1], 50+Math.floor((k-1)/3)*90+[-2,3,-3,2,-1,3,-2,1,-3][k-1]];
  const pts=ROOM4.route.map(at), [sx,sy]=pts[0], d='M'+pts.map(p=>p.join(' ')).join(' L');
  return `<svg viewBox="0 0 300 260" style="width:min(320px,80vw);display:block;margin:4px auto 8px;background:#f6e9a6;border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,.25)">
  <defs><marker id="nar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2340b8"/></marker></defs>
  <text x="14" y="24" font-size="15" fill="#5a4a2a" font-style="italic">코스 그림</text>
  <path d="${d}" fill="none" stroke="#2340b8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#nar)"/>
  <rect x="${sx-24}" y="${sy+10}" width="48" height="22" fill="none" stroke="#a3271c" stroke-width="2.5"/><text x="${sx}" y="${sy+26}" font-size="14" text-anchor="middle" fill="#a3271c" font-weight="700">역</text>
  <text x="${sx+26}" y="${sy-30}" font-size="12" fill="#a3271c">출발 ↑</text>
  <text x="${(at(8)[0]+at(7)[0])/2}" y="${at(8)[1]+30}" font-size="13" text-anchor="middle" fill="#2a6f8a">~ 풍덩 ~</text></svg>
  <i>비밀번호 또 까먹으면 이 코스 그대로 누를 것.<br>역에서 출발해서 한 바퀴 돌아 다시 역까지! — 근수</i>`; })()};
SIGNS.coaster=['후룸라이드','키 120cm 이상 탑승','#8e231c','#f2ede2'];
SIGNS.booth_coaster=['후룸라이드 조작실','LOG FLUME CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.manual_coaster=['점검 방법','후룸라이드 · 야간 점검','#fbf6e8','#8e231c'];
SIGNS.flume_pool=['스플래시 풀','마지막 낙하 지점 · 물이 튈 수 있어요','#f2ede2','#1d5a6a'];
SIGNS.flume_crane=['힘 센서','CRANE · N','#10241c','#7dffb0'];
GATES.coaster='후룸라이드 탑승구'; GATES.cbooth='후룸라이드 조작실 문';

(function(){
  const R=ROOM4, door={t:0,base:null};
  const WATER=1.0, D=0.68, REST=new THREE.Vector3(32.3,0,0.6), BEAM=5.9;      // 수면 높이 · 보트 깊이(테두리까지, m) · 풀에서 보트가 서는 자리(크레인 밑) · 크레인 들보 높이
  const W=n=>R.boat+R.bag*n, B=L=>R.perLevel*L, BMAX=B(R.levels), BLINE=B(R.line);
  const st={power:false}, bz={n:R.bags,lvl:-1.5,tgt:-1.5,mode:'hang',rec:{},busy:false};
  const spot=()=>PARK.spots.booth_coaster||{x:22.6,z:4.1};
  const boat=()=>PARK.items.flume_boat;

  /* ---------- 트랙 : v1 맵(build_park.py)의 트랙 제어점 → 같은 Catmull-Rom 곡선 (게임 좌표 x, 높이, z) ---------- */
  const CPS=[[26,4,1.2],[26,9,1.2],[26,14,1.2],[26,19,2.6],[26,24,8],[26,29,14],[27.5,33,16.2],[32,34.5,15],[37,31,6],[40,26,2.8],
    [45,22.5,5.5],[50.5,18,10],[52,11,9],[49,5,6],[43,2.2,6.5],[36,0.8,4],[30,0.6,2.0],[26.4,1.8,1.3]];
  const T=[], CUM=[0]; let LEN=0;
  (function(){ const P=CPS.map(([x,y,h])=>new THREE.Vector3(x,h,-y)), n=P.length;
    for(let i=0;i<n;i++){ const p0=P[(i-1+n)%n], p1=P[i], p2=P[(i+1)%n], p3=P[(i+2)%n], segs=Math.max(2,Math.floor(p2.distanceTo(p1)/.6));
      for(let j=0;j<segs;j++){ const t=j/segs, t2=t*t, t3=t2*t, v=new THREE.Vector3();
        for(const k of ['x','y','z']) v[k]=.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);
        T.push(v); } }
    for(let i=1;i<T.length;i++) CUM.push(CUM[i-1]+T[i].distanceTo(T[i-1])); LEN=CUM[CUM.length-1]+T[0].distanceTo(T[T.length-1]); })();
  const near=(x,z,from=0)=>{ let b=from, d=1e9; for(let i=from;i<T.length;i++){ const e=Math.hypot(T[i].x-x,T[i].z-z); if(e<d){ d=e; b=i; } } return b; };
  const iPeak=T.reduce((b,p,i)=>p.y>T[b].y?i:b,0), H_PEAK=T[iPeak].y;
  const iStation=near(26,-9), iDrop=near(34.6,-.6,iPeak), iLast=near(50.5,-18,iPeak);
  function at(s){ s=((s%LEN)+LEN)%LEN; let k=CUM.length-1; for(let i=1;i<CUM.length;i++) if(CUM[i]>s){ k=i-1; break; }
    const a=T[k], b=T[(k+1)%T.length], seg=(k+1<CUM.length?CUM[k+1]:LEN)-CUM[k];
    return { p:a.clone().lerp(b,(s-CUM[k])/seg), f:b.clone().sub(a).normalize() }; }

  /* ---------- 3D : 보트 놓기 · 모래주머니 · 밧줄 · 물보라 · 거품 · 물속 화면 ---------- */
  let rope, uw, drops=[];
  function placeBoat(pos,fwd){ const b=boat(); if(!b) return; b.parent.updateMatrixWorld(true);
    b.position.copy(b.parent.worldToLocal(pos.clone())); b.updateMatrixWorld(true); b.lookAt(pos.clone().add(fwd)); }     // +Z(보트 긴 축)가 진행 방향
  const restFwd=new THREE.Vector3(-1,0,0);
  function floatBoat(draft,fwd=restFwd){ placeBoat(new THREE.Vector3(REST.x,WATER-draft,REST.z),fwd); }
  function syncBags(){ for(let k=1;k<=R.bags;k++){ const o=PARK.items['fsand_'+k]; if(o) o.visible=k<=bz.n; } }
  // 뒷자리에 앉는다 : 앞쪽으로 보트 · 모래주머니가 보여서 보트와 함께 움직이는 느낌
  function seat(pos,fwd,pitch,eyeUp=1.78){ const e=pos.clone().addScaledVector(fwd,-1.0); P.x=e.x; P.z=e.z; P.y=e.y+eyeUp-P.eye;
    P.yaw=Math.atan2(-fwd.x,-fwd.z); P.pitch=pitch??Math.atan2(fwd.y,Math.hypot(fwd.x,fwd.z))*.8-.12; }
  const dropGeo=new THREE.SphereGeometry(.07,5,4), dropMat=new THREE.MeshBasicMaterial({color:0xcfefff,transparent:true,opacity:.85});
  function spray(x,z,n,up,out,bubble){ for(let i=0;i<n;i++){ const d=new THREE.Mesh(dropGeo,dropMat), a=Math.random()*Math.PI*2, r=out*(.4+Math.random());
      d.position.set(x+Math.cos(a)*(bubble?.5:.6),bubble?WATER-.5-Math.random()*.4:WATER,z+Math.sin(a)*(bubble?.3:.6)); if(bubble) d.scale.setScalar(.4+Math.random()*.6);
      d.userData={v:new THREE.Vector3(Math.cos(a)*r,up*(.6+Math.random()*.6),Math.sin(a)*r),bubble}; scene.add(d); drops.push(d); } }
  function splash(at){ AUDIO.noise(1.4,.9,0,700); AUDIO.noise(.7,.6,0,2600); AUDIO.tone(60,.7,'sine',.5,0,-30); spray(at.x,at.z,80,6,2.2,false);
    if(uw){ uw.style.opacity=.45; setTimeout(()=>{ if(!rd||!rd.sink) uw.style.opacity=0; },350); } }
  function tickDrops(dt){ drops=drops.filter(d=>{ const u=d.userData; if(u.bubble){ d.position.y+=u.v.y*.4*dt; if(d.position.y>WATER){ scene.remove(d); return false; } return true; }
    u.v.y-=9.8*dt; d.position.addScaledVector(u.v,dt); if(d.position.y<WATER-.1){ scene.remove(d); return false; } return true; }); }

  /* ---------- 타기 : 트랙 → 낙하 → 물 (보트와 함께) ---------- */
  let rd=null, parked=false;      // parked : 다시 타기 전 보트를 트랙에 올려 둔 동안 (풀 출렁임이 덮어쓰지 않게)
  function ride(fromI,last){ return new Promise(res=>{ setGoal(null); P.free=false; zoom(camera.fov+10,800);
    rd={mode:'track',s:CUM[fromI],end:CUM[iDrop]+(iDrop<fromI?LEN:0),lift:fromI<iPeak?CUM[iPeak]:-1,t:0,v:last?5:0,tick:0,res,sink:W(bz.n)>BMAX}; }); }
  function stepRide(dt){
    if(rd.mode==='track'){ const {p,f}=at(rd.s), lifting=rd.s<rd.lift;
      const vt=lifting?3.2:.8*Math.sqrt(2*9.8*Math.max(0,H_PEAK+.5-p.y))+2.5; rd.v+=(vt-rd.v)*Math.min(1,dt*(lifting?3:1.5)); rd.s+=rd.v*dt;
      const pos=p.clone(); pos.y+=.2; placeBoat(pos,f); seat(pos,f);
      rd.tick-=dt; if(rd.tick<=0){ rd.tick=lifting?.22:.18; if(lifting) AUDIO.tone(70,.05,'square',.07); else AUDIO.noise(.22,Math.min(.22,rd.v/70),0,400+rd.v*70); }
      if(rd.s>=rd.end){ rd.mode='drop'; rd.t=0; rd.p0=pos; rd.f0=f; AUDIO.noise(1,.25,0,1400); } }
    else if(rd.mode==='drop'){ rd.t=Math.min(1,rd.t+dt/.9); const t=rd.t, pos=rd.p0.clone().lerp(REST,t);
      pos.y=rd.p0.y+(WATER-.12-rd.p0.y)*t*t; const f=rd.f0.clone().lerp(restFwd,t); f.y=-.25-.45*t; f.normalize();
      placeBoat(pos,f); seat(pos,f);
      if(t>=1){ splash(REST); rd.mode='water'; rd.t=0; rd.d=.12; rd.vd=2.6; rd.bub=0; } }
    else { rd.t+=dt; const tgt=rd.sink?WATER-.12:W(bz.n)/BMAX*D;          // 가라앉으면 풀 바닥(0.1 m)에 닿을 때까지
      if(rd.sink) rd.d=Math.min(tgt,rd.d+(rd.d<D*.5?1.1:.26)*dt);      // 풍덩 → 보트째 천천히 꼬르륵
      else { rd.vd+=(18*(tgt-rd.d)-3.2*rd.vd)*dt; rd.d+=rd.vd*dt; }
      const nose=rd.sink?Math.min(.22,rd.t*.06):0, f=new THREE.Vector3(-1,-nose,0).normalize();       // 가라앉으며 앞머리가 숙여진다
      floatBoat(rd.d,f); const pos=new THREE.Vector3(REST.x,WATER-rd.d,REST.z);
      const sunk=rd.sink?Math.max(0,Math.min(1,(rd.d-.3)/(tgt-.3))):0;                              // 물이 차오르며 몸도 같이 잠긴다
      seat(pos,f,lerp(P.pitch,rd.sink?-.42:-.05,Math.min(1,dt*2)),1.78-1.05*sunk);                                     // 보트 안을 내려다본다 — 물이 차오르는 게 보이게
      if(rd.sink){ rd.bub-=dt; if(rd.bub<=0){ rd.bub=.09; spray(REST.x,REST.z,3,1.3,.15,true); }
        if(P.y+P.eye<WATER+.03) uw.style.opacity=1;
        if(rd.t>1.2&&rd.t%0.45<dt) AUDIO.noise(.3,.22,0,260+Math.random()*200); }                     // 보글보글
      if(rd.sink?rd.d>=tgt-.01&&rd.t>4.6:rd.t>3){ const r=rd.res, sank=rd.sink; rd=null; zoom(camera.fov-10,600); r(sank?'sank':'float'); } } }

  async function ride1(){ AUDIO.click(); await mono(['보트 뒷자리에 올라탔다. 앞쪽엔 손님 대신 모래주머니가 잔뜩 실려 있다.','…좋아. 점검 방법 1번, 코스를 끝까지 따라가 보자.']);
    toast('후룸라이드 출발'); const r=await ride(iStation,false);
    S.flags.flume_rode=true; if(r==='sank') await afterSink(); }
  async function afterSink(){ S.flags.flume_sank=true; const f=$('#fade'); f.classList.remove('clear'); await sleep(1300);
    uw.style.opacity=0; floatBoat(D+.1); warp(29.8,3.8,REST.x,REST.z); f.classList.add('clear');
    await mono(['푸핫…! 콜록, 콜록.','보트가 물에 떨어지자마자 나랑 같이 통째로 가라앉았다.','모래주머니를 너무 많이 실었어. 이대로면 손님이 다 물에 빠지겠어.','점검 방법 3번 — 크레인에 보트를 매달고 힘 센서로 부력을 재 보자.']);
    objective('크레인 리모컨으로 보트를 건져 부력을 재자'); const c=itemPos('flume_crane'); if(c) setGoal(c.x,c.z,'크레인 리모컨'); }
  async function ride2(){ AUDIO.click(); P.free=false; parked=true; setGoal(null); const f=$('#fade'); f.classList.remove('clear'); await sleep(1300);
    const {p,f:fw}=at(CUM[iLast]); p.y+=.2; placeBoat(p,fw); seat(p,fw); f.classList.add('clear');
    await mono(['보트를 다시 트랙에 올렸다. 모래주머니는 4개.','마지막 낙하 구간부터 다시. …간다!']); parked=false; await ride(iLast,true);
    S.flags.flume_ok=true; await mono(['…풍덩!','초록 선까지 딱 맞게 잠겨서 떠 있다. 중력과 부력이 평형을 이룬다.','점검 끝. 점검 방법 4번 — 조작실로 가서 전원을 끄자.']);
    const fd=$('#fade'); fd.classList.remove('clear'); await sleep(1300); warp(29.8,3.8,REST.x,REST.z); fd.classList.add('clear');
    objective('조작실에서 후룸라이드 전원을 끄자'); const s=spot(); setGoal(s.x,s.z,'후룸라이드 조작실'); }

  /* ---------- 크레인 리모컨 (3D 그대로) · 계기판 (3D 화면, 실시간) ---------- */
  const rm=$('#remote'), rmsg=rm.querySelector('.rmsg'), LBL=['물 밖','1칸','2칸','3칸','4칸','5칸'];
  const cr={on:false,dir:0,tick:0,gauge:null,g:null,tex:null,key:''};
  const lim=()=>Math.min(R.levels,W(bz.n)/R.perLevel);
  const reading=()=>!S.flags.crane_seen?0:bz.mode==='hang'?Math.max(0,Math.round(W(bz.n)-B(Math.max(0,bz.lvl)))):0;
  function say(h,ok){ rmsg.innerHTML=h; rmsg.className='rmsg'+(ok?' ok':ok===false?' bad':''); }
  function drawGauge(){ if(!cr.g) return; const g=cr.g, w=512, h=300, v=reading();
    const k=[v,bz.mode,Math.round(bz.lvl*20),bz.n,JSON.stringify(bz.rec)].join('|'); if(k===cr.key) return; cr.key=k;
    g.fillStyle='#0a1a12'; g.fillRect(0,0,w,h); g.strokeStyle='#2c6b48'; g.lineWidth=6; g.strokeRect(3,3,w-6,h-6);
    g.fillStyle='#7dffb0'; g.font='700 26px "Noto Sans KR",sans-serif'; g.textAlign='left'; g.fillText('힘 센서',22,42);
    g.textAlign='right'; g.fillStyle='#9fd8b8'; g.font='700 22px "Noto Sans KR",sans-serif';
    g.fillText(bz.mode!=='hang'?'줄 풀림':bz.lvl<=0.02?'물 밖':v===0?'줄 느슨함':`잠긴 깊이 ${(Math.round(bz.lvl*10)/10).toFixed(1)}칸`,w-22,42);
    g.textAlign='center'; g.fillStyle=bz.mode==='hang'?'#9dffc4':'#4a7a5c'; g.font='700 110px "Noto Sans KR",sans-serif'; g.fillText(v+' N',w/2,165);
    g.font='700 19px "Noto Sans KR",sans-serif';
    for(let i=0;i<=R.levels;i++){ const x=14+i*81, y=196, line=i===R.line; g.strokeStyle=line?'#3dff8a':'#2c6b48'; g.lineWidth=line?3:2; g.strokeRect(x,y,76,86);
      g.fillStyle=line?'#3dff8a':'#9fd8b8'; g.fillText(LBL[i]+(line?' ●':''),x+38,y+28); g.fillStyle='#e8fff0'; g.font='700 24px "Noto Sans KR",sans-serif';
      g.fillText(bz.rec[i]===undefined?'—':bz.rec[i],x+38,y+66); g.font='700 19px "Noto Sans KR",sans-serif'; }
    cr.tex.needsUpdate=true; }
  function setRemote(){ const q2=!!S.flags.buoy_q1; rm.querySelectorAll('.rq1').forEach(r=>r.style.display=q2?'none':''); rm.querySelectorAll('.rq2').forEach(r=>r.style.display=q2?'':'none');
    rm.querySelector('.rq').innerHTML=q2
      ?`보트가 크레인 없이 <b>혼자</b> 초록 선까지 잠겨 떠 있으려면? 떠서 멈춘 보트는 <b>중력(무게) = 부력</b>. 모래주머니(한 개 ${R.bag} N)로 무게를 맞추고 줄을 풀어 보자.`
      :'보트를 <b>물속으로 내리면서</b> 계기판의 힘 센서 값을 읽자. 초록 선(3칸)까지 잠겼을 때 보트에 작용하는 <b>부력</b>은?';
    rm.querySelector('.rbags').textContent=`모래주머니 ${bz.n}개`; }
  async function openCrane(){ if(!S.flags.flume_sank){ AUDIO.click(); await mono(['크레인 리모컨이 걸려 있다. 옆에 힘 센서 계기판.','…점검 방법대로 먼저 보트를 타 보자.']); return; }
    if(S.flags.buoy_done){ AUDIO.click(); await mono('보트는 초록 선에 맞게 떠 있다. 크레인은 이제 됐다.'); return; }
    setGoal(null); AUDIO.click(); P.free=false; cr.on=true; cr.dir=0;
    await camTo({x:28.9,z:4.2,y:.3,yaw:Math.atan2(-(30.9-28.9),-(1.63-4.2)),pitch:-.13},.8);     // 계기판(왼쪽 아래)과 보트(오른쪽)가 한 화면에
    if(!S.flags.crane_seen){ S.flags.crane_seen=true; bz.mode='hang'; bz.lvl=bz.tgt=-1.5; AUDIO.tone(90,1.2,'sawtooth',.05,0,40);
      await mono(['리모컨으로 가라앉은 보트를 건져 올렸다.','이제 천천히 물속으로 내리면서, 앞에 있는 계기판의 힘 센서 값을 읽어 보자.']); }
    say(''); rm.querySelector('.rnum').value=''; setRemote(); rm.classList.add('on'); }
  function closeCrane(){ if(!cr.on) return; cr.on=false; cr.dir=0; rm.classList.remove('on'); if(!S.busy) P.free=true; }
  function hold(btn,dir){ const b=rm.querySelector(btn); b.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); cr.dir=dir; });
    ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>{ if(cr.dir===dir) cr.dir=0; })); }
  hold('.rdown',1); hold('.rup',-1);
  addEventListener('keydown',e=>{ if(!cr.on||e.target.tagName==='INPUT') return; if(e.code==='ArrowDown'||e.code==='KeyS') cr.dir=1; else if(e.code==='ArrowUp'||e.code==='KeyW') cr.dir=-1; else if(e.code==='KeyQ') closeCrane(); });
  addEventListener('keyup',e=>{ if(cr.on&&['ArrowDown','KeyS','ArrowUp','KeyW'].includes(e.code)) cr.dir=0; });
  rm.addEventListener('pointerdown',e=>e.stopPropagation());
  function tickCrane(dt){ if(bz.mode==='hang'){ if(!cr.on||!cr.dir||bz.busy) return;
      const prev=bz.lvl, L=lim(); let nl=Math.max(-1.5,Math.min(L,prev+cr.dir*.8*dt));
      if(cr.dir>0&&nl>=L&&prev<L) say(L<R.levels?'줄이 느슨해졌다 — 보트가 더 내려가지 않고 혼자 떠 버린다.':'보트 테두리까지 다 잠겼다. 더 내리면 물이 들어온다.');
      for(let k=0;k<=R.levels;k++) if(k<=L+1e-6&&bz.rec[k]===undefined&&(prev-k)*(nl-k)<=0&&prev!==nl){ bz.rec[k]=W(bz.n)-B(k); AUDIO.tick(); }
      bz.lvl=nl; cr.tick-=dt; if(cr.tick<=0&&prev!==nl){ cr.tick=.14; AUDIO.tone(95,.12,'sawtooth',.035,0,cr.dir*20); } }
    else { const d=bz.tgt-bz.lvl; bz.lvl+=Math.sign(d)*Math.min(Math.abs(d),1.1*dt); } }
  function setBags(d){ if(bz.mode!=='hang'||bz.busy) return; const n=bz.n+d; if(n<0||n>R.bags) return;
    bz.n=n; bz.rec={}; bz.lvl=Math.min(bz.lvl,lim()); syncBags(); setRemote(); AUDIO.tone(d<0?160:90,.2,'square',.1); AUDIO.noise(.15,.3,0,400);
    say((d<0?'모래주머니를 하나 내렸다':'모래주머니를 하나 실었다')+` (${n}개). 무게가 바뀌어 계기판 기록을 지웠다.`); }
  const until=async f=>{ while(!f()) await sleep(50); };
  async function release(){ if(bz.mode!=='hang'||bz.busy) return; bz.busy=true; const w=W(bz.n), fl=w/R.perLevel;
    bz.mode='float'; bz.tgt=fl>R.levels?(WATER-.15)/D*R.levels:fl; AUDIO.noise(.5,.3,0,600); say('줄을 풀었다…');
    await until(()=>Math.abs(bz.tgt-bz.lvl)<.01); await sleep(700);
    if(fl>R.levels){ say(`보트가 다 잠겨도 부력은 <b>${BMAX} N</b> 까지인데, 무게(중력)가 그보다 크다 — <b>가라앉았다!</b>`,false); AUDIO.err(); }
    else if(w===BLINE){ S.flags.buoy_done=true; say(`보트의 무게(중력) <b>${w} N</b> = 부력 <b>${w} N</b> — <b>힘의 평형!</b> 초록 선까지 딱 맞게 잠겨 떠 있다.`,true); AUDIO.ok();
      await sleep(3000); closeCrane(); return solved(); }
    else if(w>BLINE){ say(`무게 ${w} N = 부력 ${w} N 인 곳(${fl}칸)에서 멈췄다 — <b>초록 선보다 더 잠겼다.</b> 손님이 타면 물이 넘칠 것 같다.`,false); AUDIO.err(); }
    else { say(`무게 ${w} N = 부력 ${w} N 인 곳(${fl}칸)에서 멈췄다 — <b>초록 선보다 덜 잠겨 너무 떴다.</b> 흔들흔들, 뒤집힐 것 같다.`,false); AUDIO.err(); }
    await sleep(2600); bz.tgt=-1.5; AUDIO.tone(90,1,'sawtooth',.05,0,40); await until(()=>Math.abs(bz.tgt-bz.lvl)<.01);
    bz.mode='hang'; bz.busy=false; say('크레인으로 보트를 다시 매달아 올렸다.'); }
  function check(){ const v=rm.querySelector('.rnum').value.trim(), w=W(bz.n), n=+v;
    if(!/^\d{1,4}$/.test(v)){ AUDIO.err(); return say('부력의 크기를 숫자로 입력하자 (단위 N).',false); }
    if(n===BLINE){ AUDIO.ok(); S.flags.buoy_q1=true; setRemote();
      return say(`맞다! 물에 넣기 전 <b>${w} N</b> − 초록 선까지 잠겼을 때 <b>${w-BLINE} N</b> = 부력 <b>${BLINE} N</b>. 힘 센서 값이 줄어든 만큼이 부력이다.`,true); }
    AUDIO.err();
    say(n===w-BLINE?'그건 초록 선까지 잠겼을 때 <b>힘 센서의 값</b>이다. 물에 넣기 전 값과 비교해 보자.'
      :n===w?'그건 물에 넣기 전 힘 센서의 값 — 보트에 작용하는 <b>중력(무게)</b>이다.'
      :n===BMAX?'그건 5칸까지 다 잠겼을 때다. 초록 선은 3칸.'
      :'보트를 물에 넣으면 힘 센서의 값이 줄어든다. <b>얼마나 줄었는지</b>가 부력이다.',false); }
  rm.querySelector('.rok').onclick=check; rm.querySelector('.rnum').addEventListener('keydown',e=>{ if(e.key==='Enter') check(); });
  rm.querySelector('.rsub').onclick=()=>setBags(-1); rm.querySelector('.radd').onclick=()=>setBags(1); rm.querySelector('.rrel').onclick=release;
  rm.querySelector('.rexit').onclick=closeCrane;
  async function solved(){ syncBags();
    await mono(['초록 선에 딱 맞게 떴다. 모래주머니는 4개 — 보트 무게 300 N 과 부력 300 N 이 평형이다.','점검 방법 2번 — 다시 타서, 마지막에 물에 떨어졌을 때도 잘 뜨는지 확인하자.']);
    objective('보트에 다시 타서 확인하자'); const b=itemPos('flume_boat'); if(b) setGoal(b.x,b.z,'통나무 보트'); }

  /* ---------- 조작실 · 키패드(코스 그림) · 점검 방법 · 조작반 ---------- */
  async function readNote(){ AUDIO.click(); await showMsg(R.note.title,R.note.body);
    if(S.flags.keynote) return; S.flags.keynote=true; INV.note('keynote',R.note.title,R.note.body);
    await mono(['김근수 씨 글씨다. 비밀번호 대신… 그림?','후룸라이드 코스를 위에서 본 모양 같은데. 역에서 출발해서 한 바퀴.']);
    objective('쪽지의 코스 그림으로 키패드 비밀번호를 풀자'); }
  let wrong=0;
  async function openPad(){ if(S.flags.open_cbooth) return;
    const ok=await keypad({title:'조작실 키패드',len:R.code.length,hint:S.flags.keynote?'쪽지의 코스 그림을 떠올려 보자 — 여덟 자리':'문 옆 쪽지에 단서가 있다',
      check:c=>{ if(c===R.code) return true; if(++wrong===3) setTimeout(()=>toast('힌트 : 키패드를 코스 그림이라고 생각해 보자. 역은 왼쪽 아래'),700); return false; }}); if(!ok) return;
    openGate('cbooth'); door.t=1; AUDIO.unlatch(); toast('조작실 문이 열렸다');
    await mono(['…열렸다. 코스를 그대로 누르는 거였구나.']); objective('조작실 안에서 점검 방법을 찾자'); const m=itemPos('manual_coaster'); if(m) setGoal(m.x,m.z,'점검 방법'); }
  async function readManual(){ AUDIO.click(); await showMsg(R.manual.title,R.manual.body);
    if(S.flags.manual_coaster) return; S.flags.manual_coaster=true; INV.note('manual_coaster',R.manual.title,R.manual.body); setGoal(null);
    await mono(['직접 타 보라고…? 손님 대신 모래주머니를 싣고.','마지막엔 물에 떨어지니까, 보트가 알맞게 뜨는지 — 부력을 봐야 하는구나.']); objective('조작반 전원을 켜자'); }
  function lamps(n){ for(let k=1;k<=3;k++){ const o=PARK.items['cbtn_'+k]; o&&o.traverse(m=>{ if(m.material){ m.material.color.setHex(k<=n?0x3ddc84:0x2c312c); m.material.emissive.setHex(0x3ddc84); m.material.emissiveIntensity=k<=n?1.2:0; } }); } }
  async function console_(){ AUDIO.click();
    if(!S.flags.manual_coaster) return mono('…점검 방법부터 찾자.');
    if(!st.power){ st.power=true; S.flags.coaster_power=true; AUDIO.tone(120,.4,'sawtooth',.06,0,60);
      for(let k=1;k<=3;k++){ await sleep(350); lamps(k); AUDIO.tone(900+k*120,.07,'square',.07); }
      openGate('coaster'); toast('후룸라이드 전원 ON');
      await mono(['전원이 들어왔다. 멀리서 체인 돌아가는 소리가 난다.','점검 방법 1번 — 역에 있는 점검용 보트에 타 보자.']);
      objective('역에서 점검용 보트에 타자'); const b=itemPos('flume_boat'); if(b) setGoal(b.x,b.z,'점검용 보트'); return; }
    if(S.flags.flume_ok&&!S.flags.coaster_done){ st.power=false; S.flags.coaster_done=true; lamps(0); AUDIO.tone(300,.15,'square',.08); setGoal(null);
      await mono(['후룸라이드 점검도 끝. 전원도 껐다.']); objective('다음 점검 : (준비 중)'); return; }
    mono(st.power?'후룸라이드 조작반. 전원이 들어와 있다.':'후룸라이드 조작반. 전원은 꺼져 있다.'); }
  async function tapBoat(){
    if(!S.flags.flume_rode){ if(!st.power){ AUDIO.click(); return mono(['점검용 통나무 보트. 모래주머니가 잔뜩 실려 있다.','…조작실에서 전원부터 켜야 움직이겠지.']); } return ride1(); }
    if(!S.flags.buoy_done){ AUDIO.click(); return mono('물에 잠긴 보트. 크레인 리모컨으로 건져서 부력을 재 보자.'); }
    if(!S.flags.flume_ok) return ride2();
    AUDIO.click(); mono('초록 선까지 딱 맞게 잠겨 떠 있다.'); }

  /* ---------- 디버그 바로 가기 (Shift+4) ---------- */
  CHECKPOINTS.push({key:'4',name:'후룸라이드 조작실 앞',go(){ room3Done(); S.flags.coaster_arrive=true; const s=spot(), k=itemPos('keypad_coaster')||s; warp(s.x,s.z+1.6,k.x,k.z); objective('조작실 키패드의 비밀번호를 찾자'); }});

  ROOMS.push({id:'room4', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    for(let k=1;k<=3;k++) I['cbtn_'+k]&&I['cbtn_'+k].traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    add('keypad_coaster','조작실 키패드',openPad,2.4,()=>!S.flags.open_cbooth);
    add('keynote_coaster','키패드 옆 쪽지',readNote);
    add('manual_coaster','후룸라이드 야간 점검 방법',readManual);
    add('console_coaster','후룸라이드 조작반',console_);
    add('mic_coaster','안내 방송 마이크',async()=>{ AUDIO.tone(1800,.4,'sine',.05); await announce('아, 아… 저기, 아무도 없습니까?',{ms:1600,voice:'mic_bumper'}); await mono('…역시 대답이 없다.'); });
    add('flume_pool','스플래시 풀',()=>{ AUDIO.noise(.5,.08,0,1200); mono(['후룸라이드가 마지막에 떨어지는 물. 스플래시 풀이다.','…물에 뜨는 힘, 부력.']); },3.4);
    add('flume_boat','통나무 보트',tapBoat,3.6);
    add('flume_crane','크레인 리모컨 · 힘 센서',openCrane,2.6);
    GATE_TAP.cbooth=async()=>{ AUDIO.click(); AUDIO.noise(.3,.25,0,400); await mono(['…잠겨 있다. 문 옆에 키패드가 있다.']); };
    rope=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,6),new THREE.MeshLambertMaterial({color:0x2a2a2a})); rope.visible=false; scene.add(rope);
    uw=document.createElement('div'); uw.style.cssText='position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(ellipse at 50% 25%,rgba(70,160,180,.4),rgba(4,30,45,.93));';
    document.body.appendChild(uw);
    // 크레인 계기판 : 조작 기둥 앞면에 3D 화면 (힘 센서 값 · 1칸마다 기록) — 리모컨을 쓰면 바로 앞에 보인다
    const cv=document.createElement('canvas'); cv.width=512; cv.height=300; cr.g=cv.getContext('2d'); cr.tex=new THREE.CanvasTexture(cv);
    const p=itemPos('flume_crane')||new THREE.Vector3(29.5,1.25,2.5);
    cr.gauge=new THREE.Group(); cr.gauge.position.set(p.x,1.9,2.6); cr.gauge.rotation.x=-.12; scene.add(cr.gauge);       // 조작 기둥 위에 세운 큰 계기판
    const scr=new THREE.Mesh(new THREE.PlaneGeometry(.96,.56),new THREE.MeshBasicMaterial({map:cr.tex})); scr.position.z=.031;
    const box=new THREE.Mesh(new THREE.BoxGeometry(1.06,.66,.06),new THREE.MeshLambertMaterial({color:0x1b1b1b}));
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.5,8),new THREE.MeshLambertMaterial({color:0x55585e})); pole.position.y=-.55;
    cr.gauge.add(scr,box,pole); drawGauge();
  },
  tick(dt){
    if(S.stage==='night'&&S.flags.bumper_scare&&!S.flags.coaster_arrive&&!S.busy){ const s=spot();
      if(Math.hypot(P.x-s.x,P.z-s.z)<7){ S.flags.coaster_arrive=true; setGoal(null);
        mono(['후룸라이드. 통나무 보트를 타고 돌다가, 마지막엔 저 물로 떨어지는 놀이기구.','조작실 문이 잠겨 있다. 문 옆에 키패드랑… 쪽지가 붙어 있다.']).then(()=>{
          objective('조작실 키패드의 비밀번호를 찾자'); const k=itemPos('keypad_coaster'); if(k) setGoal(k.x,k.z,'키패드'); }); } }
    const Dd=PARK.anim.cbdoor; if(Dd){ if(door.base===null) door.base=Dd.rotation.y; const to=door.base-door.t*Math.PI/2*.92; Dd.rotation.y+=(to-Dd.rotation.y)*Math.min(1,dt*3); }
    if(drops.length) tickDrops(dt);
    if(rd||parked){ if(rd) stepRide(dt); return; }
    if(!S.flags.flume_sank||!boat()) return;
    // 풀에 있는 보트 : 크레인에 매달림(리모컨으로 오르내림) / 가라앉음 / 알맞게 뜸 (살짝 출렁)
    if(cr.on&&GOAL.on) setGoal(null);
    tickCrane(dt); drawGauge();
    const bob=Math.sin(S.t*1.6)*.015;
    if(S.flags.buoy_done&&!cr.on){ rope.visible=false; floatBoat(BLINE/BMAX*D+bob); return; }
    if(!S.flags.crane_seen){ rope.visible=false; floatBoat(D+.1+bob); return; }
    const y=WATER-bz.lvl/R.levels*D+(bz.mode==='hang'?0:bob); placeBoat(new THREE.Vector3(REST.x,y,REST.z),restFwd);
    rope.visible=bz.mode==='hang'; if(rope.visible){ const top=y+.9, len=BEAM-top; rope.scale.y=Math.max(.1,len); rope.position.set(REST.x,top+len/2,REST.z); }
  }});
})();
