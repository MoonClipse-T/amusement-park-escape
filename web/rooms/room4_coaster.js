/* ============================================================
   방 4 : 롤러코스터 = 후룸라이드 (통나무 보트가 마지막에 물로 떨어지는 놀이기구)   [9과05-04 부력]
   흐름 : 범퍼카 공포 → 롤러코스터 조작실 (문이 잠겨 있다 · 문 옆 키패드 + 쪽지)
        → 키패드 퍼즐 (과학과 상관없는 추리) : 키패드를 보면 버튼 1 · 4 · 6 · 9 만 닳아 있다
          쪽지는 반으로 찢겨 있고 (단서 ① ②), 나머지 반쪽(③ ④)은 바람에 날려 롤러코스터 승강장 바닥에 있다
          ① 맨 앞은 짝수 ② 9는 맨 앞도 맨 끝도 아니다 ③ 6 바로 다음에 9 ④ 1은 4보다 먼저 → 6914 (답은 하나뿐)
        → 점검 방법 : ① 전원을 켜고 점검용 보트에 직접 타서 코스를 끝까지 따라간다 (손님 대신 모래주머니)
                      ② 물에 떨어진 보트는 옆면 초록 선까지만 잠겨 떠야 한다 ③ 아니면 크레인 힘 센서로 부력을 재서 무게를 맞춘다 ④ 전원 종료
        → 조작반 전원 ON → 역의 보트에 타면 1인칭으로 트랙을 따라 달린다 (체인 리프트 → 낙하 → 스플래시 풀에 풍덩)
        → 첫 탑승 : 모래주머니 9개(550 N) — 보트가 다 잠겨도 부력은 500 N 까지라 가라앉는다 (물속 연출)
        → 크레인 · 힘 센서 (교과서 '물속에서 부력 측정하기' 과정 그대로)
            보트를 한 칸씩 물에 내리며 힘 센서 값을 읽는다 : 550 → 450 → 350 → 250 …  (잠긴 부피가 클수록 부력이 크다)
            Q. 초록 선(3칸)까지 잠겼을 때 부력은? → 550 − 250 = 300 N   (부력 = 물에 넣기 전 값 − 잠겼을 때 값)
            모래주머니(한 개 50 N)를 내리고 줄을 풀어 띄워 본다 : 떠서 멈춘 보트는 중력 = 부력 (힘의 평형)
              무게 > 500 N 가라앉음 · 300 N 보다 무거우면 초록 선 아래로 · 가벼우면 둥둥 너무 뜬다 · 300 N(4개) 이면 딱 초록 선
        → 다시 타서 마지막 낙하만 확인 → 초록 선에 맞게 뜬다 → 조작실 전원 OFF
   ★ 글 · 숫자는 아래 ROOM4 에서 고친다 (bags 를 바꾸면 Blender flume_ride.py 의 SAND_N 도 같이)
   ============================================================ */
'use strict';
const ROOM4={
  code:'6914', worn:'1 · 4 · 6 · 9',            // 비밀번호 · 키패드에서 닳아 있는 버튼 (단서를 바꾸면 둘 다 같이)
  note:{title:'키패드 옆 쪽지 (찢어진 반쪽)',
    body:`<i>비밀번호 또 까먹을까 봐 적어 둔다.<br>지문 묻은 버튼 네 개를 한 번씩만 누른다.</i><br><br>
① 맨 앞 숫자는 <b>짝수</b>.<br>② <b>9</b>는 맨 앞도 아니고, 맨 끝도 아니다.<br><br><span style="opacity:.55">─ ─ ─ 여기서부터 찢겨 나갔다 ─ ─ ─</span>`},
  note2:{title:'찢어진 쪽지 (나머지 반쪽)',
    body:`<span style="opacity:.55">─ ─ ─ 찢긴 자국 ─ ─ ─</span><br><br>③ <b>6</b> 바로 다음에 <b>9</b>.<br>④ <b>1</b>은 <b>4</b>보다 먼저.<br><br><i>— 근수. 이 쪽지는 꼭 버릴 것!</i>`},
  manual:{title:'후룸라이드 야간 점검 방법',
    body:`1. 조작반 전원을 켜고, 역에 있는 점검용 보트에 <b>직접 타서</b> 코스를 끝까지 따라가며 제대로 움직이는지 확인한다. (보트에는 손님 무게 대신 <b>모래주머니</b>를 싣는다)<br>
2. 마지막에 물에 떨어진 보트는 옆면의 <b>초록 선</b>까지만 잠겨서 떠야 한다. 너무 가라앉아도, 너무 떠도 안 된다.<br>
3. 맞지 않으면 스플래시 풀의 <b>크레인</b>에 보트를 매달고 힘 센서로 <b>부력</b>을 잰 다음, 모래주머니로 보트의 무게를 맞춘다.<br>
<b class="red">4. 점검이 끝나면 전원 장치를 종료한다.</b>`},
  boat:100, bag:50, bags:9,           // 빈 보트 100 N · 모래주머니 한 개 50 N · 처음 9개 → 550 N
  perLevel:100, levels:5, line:3,     // 보트 깊이를 5칸으로 나눠 한 칸 잠길 때마다 부력 +100 N · 초록 선 = 3칸 → 부력 300 N
};
SIGNS.booth_coaster=['롤러코스터 조작실','LOG FLUME CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.manual_coaster=['점검 방법','후룸라이드 · 야간 점검','#fbf6e8','#8e231c'];
SIGNS.flume_pool=['스플래시 풀','마지막 낙하 지점 · 물이 튈 수 있어요','#f2ede2','#1d5a6a'];
SIGNS.flume_crane=['힘 센서','CRANE · N','#10241c','#7dffb0'];
GATES.cbooth='롤러코스터 조작실 문';

(function(){
  const R=ROOM4, door={t:0,base:null};
  const WATER=1.0, D=0.68, REST=new THREE.Vector3(32.3,0,0.6);      // 수면 높이 · 보트 깊이(테두리까지, m) · 풀에서 보트가 서는 자리 (크레인 밑)
  const W=n=>R.boat+R.bag*n, B=L=>R.perLevel*L, BMAX=B(R.levels), BLINE=B(R.line);
  const st={power:false}, bz={n:R.bags,lvl:0,to:0,mode:'hang',rec:{},busy:false,open:false,timer:0};
  const spot=()=>PARK.spots.booth_coaster||{x:22.6,z:4.1};
  const boat=()=>PARK.items.flume_boat;

  /* ---------- 트랙 : v1 맵(build_park.py)의 롤러코스터 제어점 → 같은 Catmull-Rom 곡선 (게임 좌표 x, 높이, z) ---------- */
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

  /* ---------- 3D : 보트 놓기 · 모래주머니 · 밧줄 · 물보라 · 물속 화면 ---------- */
  let rope, uw, drops=[];
  function placeBoat(pos,fwd){ const b=boat(); if(!b) return; b.parent.updateMatrixWorld(true);
    b.position.copy(b.parent.worldToLocal(pos.clone())); b.updateMatrixWorld(true); b.lookAt(pos.clone().add(fwd)); }     // +Z(보트 긴 축)가 진행 방향
  const restFwd=new THREE.Vector3(-1,0,0);
  function floatBoat(draft){ placeBoat(new THREE.Vector3(REST.x,WATER-draft,REST.z),restFwd); }
  function syncBags(){ for(let k=1;k<=R.bags;k++){ const o=PARK.items['fsand_'+k]; if(o) o.visible=k<=bz.n; } }
  function seat(pos,fwd,eyeUp=1.0){ const e=pos.clone().addScaledVector(fwd,1.1); P.x=e.x; P.z=e.z; P.y=e.y+eyeUp-P.eye;      // 맨 앞자리 (앞 등받이보다 앞)
    P.yaw=Math.atan2(-fwd.x,-fwd.z); P.pitch=Math.atan2(fwd.y,Math.hypot(fwd.x,fwd.z))*.85; }
  function splash(at){ AUDIO.noise(1.4,.9,0,700); AUDIO.noise(.7,.6,0,2600); AUDIO.tone(60,.7,'sine',.5,0,-30);
    const g=new THREE.SphereGeometry(.07,5,4), m=new THREE.MeshBasicMaterial({color:0xcfefff,transparent:true,opacity:.85});
    for(let i=0;i<70;i++){ const d=new THREE.Mesh(g,m), a=Math.random()*Math.PI*2, r=1+Math.random()*2.5;
      d.position.set(at.x+Math.cos(a)*.6,WATER,at.z+Math.sin(a)*.6); d.userData.v=new THREE.Vector3(Math.cos(a)*r,3+Math.random()*4,Math.sin(a)*r); scene.add(d); drops.push(d); }
    if(uw){ uw.style.opacity=.45; setTimeout(()=>{ if(!rd||rd.mode!=='water'||!rd.sink) uw.style.opacity=0; },350); } }
  function tickDrops(dt){ drops=drops.filter(d=>{ const v=d.userData.v; v.y-=9.8*dt; d.position.addScaledVector(v,dt); if(d.position.y<WATER-.1){ scene.remove(d); return false; } return true; }); }

  /* ---------- 타기 : 트랙 → 낙하 → 물 ---------- */
  let rd=null, parked=false;      // parked : 다시 타기 전 보트를 트랙에 올려 둔 동안 (풀 출렁임이 덮어쓰지 않게)
  function ride(fromI,last){ return new Promise(res=>{ setGoal(null); P.free=false; zoom(camera.fov+10,800);
    rd={mode:'track',s:CUM[fromI],end:CUM[iDrop]+(iDrop<fromI?LEN:0),lift:fromI<iPeak?CUM[iPeak]:-1,t:0,v:last?5:0,tick:0,res,sink:W(bz.n)>BMAX}; }); }
  function stepRide(dt){ const b=boat();
    if(rd.mode==='track'){ const {p,f}=at(rd.s), lifting=rd.s<rd.lift;
      const vt=lifting?3.2:.8*Math.sqrt(2*9.8*Math.max(0,H_PEAK+.5-p.y))+2.5; rd.v+=(vt-rd.v)*Math.min(1,dt*(lifting?3:1.5)); rd.s+=rd.v*dt;
      const pos=p.clone(); pos.y+=.2; placeBoat(pos,f); seat(pos,f);
      rd.tick-=dt; if(rd.tick<=0){ rd.tick=lifting?.22:.18; if(lifting) AUDIO.tone(70,.05,'square',.07); else AUDIO.noise(.22,Math.min(.22,rd.v/70),0,400+rd.v*70); }
      if(rd.s>=rd.end){ rd.mode='drop'; rd.t=0; rd.p0=pos; rd.f0=f; AUDIO.noise(1,.25,0,1400); } }
    else if(rd.mode==='drop'){ rd.t=Math.min(1,rd.t+dt/.9); const t=rd.t, pos=rd.p0.clone().lerp(REST,t);
      pos.y=rd.p0.y+(WATER-.12-rd.p0.y)*t*t; const f=rd.f0.clone().lerp(restFwd,t); f.y=-.25-.45*t; f.normalize();
      placeBoat(pos,f); seat(pos,f);
      if(t>=1){ splash(REST); rd.mode='water'; rd.t=0; rd.d=.12; rd.vd=2.6; } }
    else { rd.t+=dt; const tgt=rd.sink?D+.75:W(bz.n)/BMAX*D;
      if(rd.sink) rd.d=Math.min(tgt,rd.d+(rd.d<D*.6?1.2:.4)*dt);      // 풍덩 → 천천히 꼬르륵
      else { rd.vd+=(18*(tgt-rd.d)-3.2*rd.vd)*dt; rd.d+=rd.vd*dt; }
      floatBoat(rd.d); const pos=new THREE.Vector3(REST.x,WATER-rd.d,REST.z), f=restFwd.clone(); seat(pos,f);
      P.pitch=lerp(P.pitch,0,Math.min(1,dt*3));
      if(rd.sink&&P.y+P.eye<WATER+.05) uw.style.opacity=1;                // 물속
      if(rd.sink&&rd.t>1.2&&rd.t%0.5<dt) AUDIO.noise(.3,.25,0,300);      // 보글보글
      if(rd.sink?rd.d>=tgt-.01&&rd.t>3.4:rd.t>3){ const r=rd.res, sank=rd.sink; rd=null; zoom(camera.fov-10,600); r(sank?'sank':'float'); } } }

  async function ride1(){ AUDIO.click(); await mono(['보트에 올라탔다. 손님 대신 모래주머니가 잔뜩 실려 있다.','…좋아. 점검 방법 1번, 코스를 끝까지 따라가 보자.']);
    toast('후룸라이드 출발'); const r=await ride(iStation,false);
    S.flags.flume_rode=true; if(r==='sank') await afterSink(); }
  async function afterSink(){ S.flags.flume_sank=true; const f=$('#fade'); f.classList.remove('clear'); await sleep(1300);
    uw.style.opacity=0; floatBoat(D+.1); warp(29.8,3.8,REST.x,REST.z); f.classList.add('clear');
    await mono(['푸핫…! 콜록, 콜록.','보트가 물에 떨어지자마자 통째로 가라앉았다.','모래주머니를 너무 많이 실었어. 이대로면 손님이 다 물에 빠지겠어.','점검 방법 3번 — 크레인에 보트를 매달고 힘 센서로 부력을 재 보자.']);
    objective('스플래시 풀 크레인에서 부력을 재자'); const c=itemPos('flume_crane'); if(c) setGoal(c.x,c.z,'크레인 힘 센서'); }
  async function ride2(){ AUDIO.click(); P.free=false; parked=true; setGoal(null); const f=$('#fade'); f.classList.remove('clear'); await sleep(1300);
    const {p,f:fw}=at(CUM[iLast]); p.y+=.2; placeBoat(p,fw); seat(p,fw); f.classList.add('clear');
    await mono(['보트를 다시 트랙에 올렸다. 모래주머니는 4개.','마지막 낙하 구간부터 다시. …간다!']); parked=false; await ride(iLast,true);
    S.flags.flume_ok=true; await mono(['…풍덩!','초록 선까지 딱 맞게 잠겨서 떠 있다. 중력과 부력이 평형을 이룬다.','점검 끝. 점검 방법 4번 — 조작실로 가서 전원을 끄자.']);
    const fd=$('#fade'); fd.classList.remove('clear'); await sleep(1300); warp(29.8,3.8,REST.x,REST.z); fd.classList.add('clear');
    objective('조작실에서 후룸라이드 전원을 끄자'); const s=spot(); setGoal(s.x,s.z,'롤러코스터 조작실'); }

  /* ---------- 크레인 · 힘 센서 (화면) ---------- */
  const el=$('#buoy'), cv=$('#bcv'), msg=el.querySelector('.fmsg'), LBL=['물 밖','1칸','2칸','3칸 (초록 선)','4칸','5칸'];
  const reading=()=>bz.mode==='hang'?Math.max(0,Math.round(W(bz.n)-B(bz.lvl))):0;
  function draw(){ const g=cv.getContext('2d'), Wd=cv.width, Hd=cv.height, WY=250, HP=150, bx=200, bw=320;
    g.clearRect(0,0,Wd,Hd);
    g.fillStyle='#3d4148'; g.fillRect(14,WY-34,22,Hd); g.fillRect(Wd-36,WY-34,22,Hd);
    g.fillStyle='#e0b02a'; g.fillRect(40,14,Wd-80,16); g.fillStyle='#b88a14'; g.fillRect(330,30,60,24);         // 크레인 들보 · 감아올리개
    const by=WY-24+bz.lvl/R.levels*HP, top=by-HP, sy=top-96, slack=bz.mode!=='hang';
    // 밧줄 · 힘 센서
    g.strokeStyle='#c9c2b0'; g.lineWidth=2; g.beginPath(); g.moveTo(360,54);
    if(slack){ g.quadraticCurveTo(330,(54+sy)/2,360,sy); } else g.lineTo(360,sy); g.stroke();
    g.beginPath(); g.moveTo(360,sy+44); g.lineTo(bx+40,top+4); g.moveTo(360,sy+44); g.lineTo(bx+bw-40,top+4); g.stroke();
    g.fillStyle='#1a2b22'; g.fillRect(304,sy,112,44); g.strokeStyle='#7dffb0'; g.lineWidth=1.5; g.strokeRect(304,sy,112,44);
    g.fillStyle='#7dffb0'; g.font='700 28px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText(reading()+' N',360,sy+33);
    g.font='700 15px "Noto Sans KR",sans-serif'; g.fillStyle='#9fb8a8'; g.fillText('힘 센서',360,sy-8);
    // 보트 (옆에서 본 단면) · 안의 모래주머니
    g.fillStyle='#7a4f33'; g.beginPath(); g.moveTo(bx,top+10); g.lineTo(bx+bw,top+10); g.quadraticCurveTo(bx+bw+20,by-HP/2,bx+bw-20,by); g.lineTo(bx+20,by); g.quadraticCurveTo(bx-20,by-HP/2,bx,top+10); g.fill();
    g.fillStyle='#2e1e14'; g.fillRect(bx+18,top+22,bw-36,HP-50);
    for(let i=0;i<bz.n;i++){ const row=i<5?0:1, col=row?i-5:i, x=bx+30+col*54+row*27, y=by-44-row*26;
      g.fillStyle='#a08660'; g.beginPath(); g.ellipse(x+24,y+12,26,13,0,0,7); g.fill(); g.strokeStyle='#6e5a3c'; g.lineWidth=1; g.stroke(); }
    // 깊이 눈금 · 초록 선
    for(let k=1;k<=R.levels;k++){ const y=by-k/R.levels*HP, line=k===R.line;
      g.strokeStyle=line?'#3dff8a':'rgba(255,255,255,.5)'; g.lineWidth=line?4:1.5; g.beginPath(); g.moveTo(bx+bw-6,y); g.lineTo(bx+bw+26,y); g.stroke();
      if(line){ g.beginPath(); g.moveTo(bx,y); g.lineTo(bx+bw,y); g.stroke(); }
      g.fillStyle=line?'#3dff8a':'#e9e2d2'; g.font='700 18px "Noto Sans KR",sans-serif'; g.textAlign='left'; g.fillText(k+'칸',bx+bw+30,y+5); }
    // 물 (잠긴 부분 위에 덮는다)
    const grd=g.createLinearGradient(0,WY,0,Hd); grd.addColorStop(0,'rgba(60,160,190,.62)'); grd.addColorStop(1,'rgba(10,50,70,.85)');
    g.fillStyle=grd; g.fillRect(36,WY,Wd-72,Hd-WY); g.strokeStyle='#9be3f5'; g.lineWidth=2; g.beginPath(); g.moveTo(36,WY); g.lineTo(Wd-36,WY); g.stroke();
    for(let k=1;k<=R.levels;k++){ const y=by-k/R.levels*HP; g.fillStyle=k===R.line?'#3dff8a':'#e9e2d2'; g.font='700 18px "Noto Sans KR",sans-serif'; g.textAlign='left'; g.fillText(k+'칸',bx+bw+30,y+6); }   // 눈금 글씨는 물 위에
    g.fillStyle='#e9e2d2'; g.font='700 19px "Noto Sans KR",sans-serif'; g.textAlign='left';
    const depth=Math.max(0,bz.lvl); g.fillText(bz.mode==='hang'?(depth<.05?'보트가 물 밖에 매달려 있다':`물에 잠긴 깊이 : ${(Math.round(depth*10)/10)}칸`):'줄을 풀었다 — 보트 혼자 떠 있다',20,30+20); }
  function table(){ el.querySelector('.btab').innerHTML=LBL.map((l,k)=>`<div class="${k===Math.round(bz.to)&&bz.mode==='hang'?'cur':''}${k===R.line?' line':''}"><b>${l}</b><span>${bz.rec[k]===undefined?'—':bz.rec[k]+' N'}</span></div>`).join('');
    el.querySelector('.finfo').textContent=`모래주머니 ${bz.n}개 · 한 개 = ${R.bag} N`; }
  function anim(){ clearTimeout(bz.timer); if(!bz.open) return;
    const d=bz.to-bz.lvl; bz.lvl+=Math.sign(d)*Math.min(Math.abs(d),.06);
    if(Math.abs(bz.to-bz.lvl)<1e-6&&bz.mode==='hang'&&Number.isInteger(bz.to)&&bz.rec[bz.to]===undefined){ bz.rec[bz.to]=reading(); table(); AUDIO.tick(); }
    draw(); bz.timer=setTimeout(anim,30); }
  function move(dir){ if(bz.mode!=='hang'||bz.busy) return; const lim=Math.min(R.levels,W(bz.n)/R.perLevel); let to=Math.round(bz.to)+dir;
    msg.className='fmsg'; msg.textContent='';
    if(to<0) return; if(to>R.levels){ msg.textContent='보트 테두리까지 다 잠겼다. 더 내리면 물이 들어온다.'; return; }
    if(to>lim){ to=lim; msg.textContent='줄이 느슨해졌다 — 보트가 더 내려가지 않고 떠 버린다.'; }
    bz.to=to; AUDIO.tone(110,.18,'sawtooth',.05,0,dir*40); table(); }
  function setBags(d){ if(bz.mode!=='hang'||bz.busy) return; const n=bz.n+d; if(n<0||n>R.bags) return;
    bz.n=n; bz.rec={}; bz.to=Math.min(bz.to,W(n)/R.perLevel); syncBags(); AUDIO.tone(d<0?160:90,.2,'square',.1); AUDIO.noise(.15,.3,0,400);
    msg.className='fmsg'; msg.textContent=(d<0?'모래주머니를 하나 내렸다':'모래주머니를 하나 실었다')+` (${n}개). 무게가 바뀌어 기록을 지웠다.`; table(); }
  async function release(){ if(bz.mode!=='hang'||bz.busy) return; bz.busy=true; const w=W(bz.n), fl=w/R.perLevel;
    bz.mode='float'; bz.to=fl>R.levels?R.levels+1.6:fl; AUDIO.noise(.5,.3,0,600); msg.className='fmsg'; msg.textContent='줄을 풀었다…';
    await sleep(Math.abs(bz.to-bz.lvl)/.06*30+700);
    if(fl>R.levels){ msg.innerHTML=`보트가 다 잠겨도 부력은 <b>${BMAX} N</b> 까지인데, 무게(중력)가 그보다 크다 — <b>가라앉았다!</b>`; AUDIO.err(); }
    else if(w===BLINE){ S.flags.buoy_done=true; msg.className='fmsg ok';
      msg.innerHTML=`보트의 무게(중력) <b>${w} N</b> = 부력 <b>${w} N</b> — <b>힘의 평형!</b> 초록 선까지 딱 맞게 잠겨 떠 있다.`; AUDIO.ok();
      await sleep(2800); ov('#buoy',false); return solved(); }
    else if(w>BLINE){ msg.innerHTML=`무게 ${w} N = 부력 ${w} N 인 곳(${fl}칸)에서 멈췄다 — <b>초록 선보다 더 잠겼다.</b> 손님이 타면 물이 넘칠 것 같다.`; AUDIO.err(); }
    else { msg.innerHTML=`무게 ${w} N = 부력 ${w} N 인 곳(${fl}칸)에서 멈췄다 — <b>초록 선보다 덜 잠겨 너무 떴다.</b> 흔들흔들, 뒤집힐 것 같다.`; AUDIO.err(); }
    await sleep(2600); bz.mode='hang'; bz.to=0; bz.busy=false; msg.className='fmsg'; msg.textContent='크레인으로 보트를 다시 매달아 올렸다.'; table(); }
  function check(){ const v=el.querySelector('.fnum').value.trim(), w=W(bz.n), n=+v; msg.className='fmsg';
    if(!/^\d{1,4}$/.test(v)){ AUDIO.err(); msg.textContent='부력의 크기를 숫자로 입력하자 (단위 N).'; return; }
    if(n===BLINE){ AUDIO.ok(); S.flags.buoy_q1=true; msg.className='fmsg ok';
      msg.innerHTML=`맞다! 물에 넣기 전 <b>${w} N</b> − 초록 선까지 잠겼을 때 <b>${w-BLINE} N</b> = 부력 <b>${BLINE} N</b>. 힘 센서 값이 줄어든 만큼이 부력이다.`; phase(); return; }
    AUDIO.err();
    msg.innerHTML=n===w-BLINE?'그건 초록 선까지 잠겼을 때 <b>힘 센서의 값</b>이다. 물에 넣기 전 값과 비교해 보자.'
      :n===w?'그건 물에 넣기 전 힘 센서의 값 — 보트에 작용하는 <b>중력(무게)</b>이다.'
      :n===BMAX?'그건 5칸까지 다 잠겼을 때다. 초록 선은 3칸.'
      :'보트를 물에 넣으면 힘 센서의 값이 줄어든다. <b>얼마나 줄었는지</b>가 부력이다.'; }
  function phase(){ const two=!!S.flags.buoy_q1; el.querySelectorAll('.bq1').forEach(r=>r.style.display=two?'none':''); el.querySelectorAll('.bq2').forEach(r=>r.style.display=two?'':'none');
    el.querySelector('.fq').innerHTML=two
      ?'보트가 크레인 없이 <b>혼자</b> 초록 선까지 잠겨 떠 있으려면? 물 위에 떠서 멈춰 있는 보트는 <b>중력(무게)과 부력이 평형</b>을 이룬다.<br>모래주머니로 무게를 맞추고, 줄을 풀어 띄워 보자.'
      :'가라앉은 보트를 크레인으로 건져 올렸다. 보트를 <b>한 칸씩 물속으로 내리면서</b> 힘 센서의 값을 읽어 보자.<br>초록 선까지 잠겼을 때, 보트에 작용하는 <b>부력</b>은 얼마일까?'; }
  async function openCrane(){ if(!S.flags.flume_sank){ AUDIO.click(); await mono(['크레인 조작 기둥. 힘 센서 화면이 붙어 있다.','…점검 방법대로 먼저 보트를 타 보자.']); return; }
    if(S.flags.buoy_done){ AUDIO.click(); await mono('보트는 초록 선에 맞게 떠 있다. 크레인은 이제 됐다.'); return; }
    if(!S.flags.crane_seen){ S.flags.crane_seen=true; bz.mode='hang'; bz.lvl=bz.to=0; }
    setGoal(null); el.querySelector('.fnum').value=''; msg.className='fmsg'; msg.textContent=''; phase(); table();
    bz.open=true; ov('#buoy',true); AUDIO.click(); anim(); }
  el.querySelector('.close').addEventListener('click',()=>{ bz.open=false; });
  el.querySelector('.bdown').onclick=()=>move(1); el.querySelector('.bup').onclick=()=>move(-1);
  el.querySelector('.bok').onclick=check; el.querySelector('.fnum').addEventListener('keydown',e=>{ if(e.key==='Enter') check(); });
  el.querySelector('.bsub').onclick=()=>setBags(-1); el.querySelector('.badd').onclick=()=>setBags(1); el.querySelector('.brel').onclick=release;
  async function solved(){ bz.open=false; syncBags();
    await mono(['초록 선에 딱 맞게 떴다. 모래주머니는 4개 — 보트 무게 300 N 과 부력 300 N 이 평형이다.','점검 방법 2번 — 다시 타서, 마지막에 물에 떨어졌을 때도 잘 뜨는지 확인하자.']);
    objective('보트에 다시 타서 확인하자'); const b=itemPos('flume_boat'); if(b) setGoal(b.x,b.z,'통나무 보트'); }

  /* ---------- 조작실 · 키패드 · 점검 방법 · 조작반 ---------- */
  async function readNote(){ AUDIO.click(); await showMsg(R.note.title,R.note.body);
    if(S.flags.keynote) return; S.flags.keynote=true; INV.note('keynote',R.note.title,R.note.body);
    await mono(['김근수 씨 글씨다. …아래쪽이 찢겨 나갔다.','나머지 반쪽은 바람에 날아갔나? 바람이 롤러코스터 승강장 쪽으로 불고 있다.']);
    if(!S.flags.keynote2) objective('찢어진 쪽지의 나머지 반쪽을 찾자 (승강장 쪽)'); }
  async function readNote2(){ AUDIO.noise(.3,.12,0,3000); await showMsg(R.note2.title,R.note2.body);
    if(S.flags.keynote2) return; S.flags.keynote2=true; INV.note('keynote2',R.note2.title,R.note2.body); show2(false);
    await mono(['찾았다, 나머지 반쪽.','단서가 네 개… 키패드 비밀번호를 풀어 보자.']);
    objective('쪽지 단서로 키패드 비밀번호를 풀자'); const k=itemPos('keypad_coaster'); if(k) setGoal(k.x,k.z,'키패드'); }
  const show2=v=>{ const o=PARK.items.keynote2_coaster; if(o) o.visible=v; };
  let wrong=0;
  async function openPad(){ if(S.flags.open_cbooth) return;
    if(!S.flags.pad_seen){ S.flags.pad_seen=true; AUDIO.click(); await mono(['숫자 버튼 네 개만 반질반질하게 닳아 있다. '+R.worn+'…','자주 누른 버튼이겠지. 비밀번호는 이 네 숫자로 되어 있을 거야.']); }
    const ok=await keypad({title:'조작실 키패드',len:R.code.length,hint:'닳은 버튼 : '+R.worn+' — 쪽지 단서대로 순서를 맞추자',
      check:c=>{ if(c===R.code) return true; if(++wrong===3) setTimeout(()=>toast('힌트 : ① 맨 앞이 짝수라면 4 아니면 6. 하나씩 넣어 보자'),700); return false; }}); if(!ok) return;
    openGate('cbooth'); door.t=1; AUDIO.unlatch(); toast('조작실 문이 열렸다');
    await mono(['…열렸다.']); objective('조작실 안에서 점검 방법을 찾자'); const m=itemPos('manual_coaster'); if(m) setGoal(m.x,m.z,'점검 방법'); }
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
    if(!S.flags.buoy_done){ AUDIO.click(); return mono('물에 잠긴 보트. 크레인으로 건져서 부력을 재 보자.'); }
    if(!S.flags.flume_ok) return ride2();
    AUDIO.click(); mono('초록 선까지 딱 맞게 잠겨 떠 있다.'); }

  /* ---------- 디버그 바로 가기 (Shift+4) ---------- */
  CHECKPOINTS.push({key:'4',name:'롤러코스터(후룸라이드) 조작실 앞',go(){ room3Done(); S.flags.coaster_arrive=true; const s=spot(), k=itemPos('keypad_coaster')||s; warp(s.x,s.z+1.6,k.x,k.z); objective('조작실 키패드의 비밀번호를 찾자'); }});

  ROOMS.push({id:'room4', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    for(let k=1;k<=3;k++) I['cbtn_'+k]&&I['cbtn_'+k].traverse(o=>{ if(o.material) o.material=o.material.clone(); });
    add('keypad_coaster','조작실 키패드',openPad,2.4,()=>!S.flags.open_cbooth);
    add('keynote_coaster','키패드 옆 쪽지',readNote);
    add('keynote2_coaster','바닥에 떨어진 쪽지',readNote2,2.6);
    add('manual_coaster','후룸라이드 야간 점검 방법',readManual);
    add('console_coaster','후룸라이드 조작반',console_);
    add('mic_coaster','안내 방송 마이크',async()=>{ AUDIO.tone(1800,.4,'sine',.05); await announce('아, 아… 저기, 아무도 없습니까?',{ms:1600,voice:'mic_bumper'}); await mono('…역시 대답이 없다.'); });
    add('flume_pool','스플래시 풀',()=>{ AUDIO.noise(.5,.08,0,1200); mono(['후룸라이드가 마지막에 떨어지는 물. 스플래시 풀이다.','…물에 뜨는 힘, 부력.']); },3.4);
    add('flume_boat','통나무 보트',tapBoat,3.6);
    add('flume_crane','크레인 · 힘 센서',openCrane,2.6);
    GATE_TAP.cbooth=async()=>{ AUDIO.click(); AUDIO.noise(.3,.25,0,400); await mono(['…잠겨 있다. 문 옆에 키패드가 있다.']); };
    rope=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,6),new THREE.MeshLambertMaterial({color:0x2a2a2a})); rope.visible=false; scene.add(rope);
    uw=document.createElement('div'); uw.style.cssText='position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(ellipse at 50% 25%,rgba(70,160,180,.4),rgba(4,30,45,.93));';
    document.body.appendChild(uw);
  },
  tick(dt){
    if(S.stage==='night'&&S.flags.bumper_scare&&!S.flags.coaster_arrive&&!S.busy){ const s=spot();
      if(Math.hypot(P.x-s.x,P.z-s.z)<7){ S.flags.coaster_arrive=true; setGoal(null);
        mono(['롤러코스터… 아니, 통나무 보트를 타는 후룸라이드구나. 마지막엔 저 물로 떨어지고.','조작실 문이 잠겨 있다. 문 옆에 키패드랑… 쪽지가 붙어 있다.']).then(()=>{
          objective('조작실 키패드의 비밀번호를 찾자'); const k=itemPos('keypad_coaster'); if(k) setGoal(k.x,k.z,'키패드'); }); } }
    const Dd=PARK.anim.cbdoor; if(Dd){ if(door.base===null) door.base=Dd.rotation.y; const to=door.base-door.t*Math.PI/2*.92; Dd.rotation.y+=(to-Dd.rotation.y)*Math.min(1,dt*3); }
    if(drops.length) tickDrops(dt);
    if(rd||parked){ if(rd) stepRide(dt); return; }
    // 풀에 있는 보트 : 크레인에 매달림 / 가라앉음 / 알맞게 뜸 (살짝 출렁)
    if(S.flags.flume_sank&&boat()){ const bob=Math.sin(S.t*1.6)*.015;
      if(bz.open&&bz.mode==='hang'){ const y=WATER+.25-bz.lvl/R.levels*D*1.1; placeBoat(new THREE.Vector3(REST.x,y,REST.z),restFwd);
        rope.visible=true; const top=y+.9, len=5.9-top; rope.scale.y=Math.max(.1,len); rope.position.set(REST.x,top+len/2,REST.z); }
      else { rope.visible=false; floatBoat((S.flags.buoy_done?BLINE/BMAX*D:D+.1)+bob); } }
  }});
})();
