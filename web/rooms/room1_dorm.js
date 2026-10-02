/* ============================================================
   방 1 : 직원 숙소 (22:00 ~)
   흐름 : 숙소에 들어서면 문이 쾅 닫히고 잠긴다 → 책상 위 지시서 #1 (내 사물함은 3번)
        → 3번 사물함(이해권 · 나)은 잠김, 문에 쪽지 "열쇠는 이전 근무자의 사물함 안에"
        → 벤치 위 근무복 명찰 '김근수' → 이름표가 김근수인 6번 사물함 → 가방 · 열쇠
        → 열쇠로 3번 사물함 → 공구함 · 손전등 · 지시서 #2
        → 문 옆 '장력 평형 잠금장치' : 바깥 용수철이 당기는 힘과 평형이 되게 당기면 문이 열린다 [9과05-01 힘의 표현과 평형]
        → 회전목마 조작실로 (rooms/room2_carousel.js)
   ★ 글 · 정답은 아래 ROOM1 만 고치면 된다
   ============================================================ */
'use strict';
const ROOM1={
  me:3, prev:6,                          // 내 사물함 · 이전 근무자 사물함
  names:{1:'박서연',2:'최민준',3:'이해권',4:'정다은',5:'윤도현',6:'김근수',7:'한지우',8:'오승민',9:'강하늘',10:'임채원'},
  note1:{title:'야간 점검 지시서 #1',
    body:`야간 점검조 신입에게.<br><br>
1. 야간 점검 순서는 다음과 같다.<br>&nbsp;&nbsp;&nbsp;회전목마 → 범퍼카 → 롤러코스터 → 유령의 집<br>
2. 점검 장비는 사물함 안에 있다. 네 사물함은 <b>3번</b>이다.<br>
3. 각 시설에 들어가면 시설 점검 방법이 붙어 있다. 점검 방법을 숙지한 뒤 정확히 진행할 것.<br>
4. 지시서와 점검 방법을 어기지 말 것.<br>
5. 절구 찧는 소리가 들리면 가까운 건물로 들어가 문을 닫을 것.`},
  lockerNote:'3번 사물함 열쇠는<br><b>이전 근무자의 사물함</b> 안에 있다.<br><br><span style="opacity:.6">— 관리실</span>',
  uniform:'반듯하게 개어 둔 야간 점검조 점퍼. 소매에 반사띠가 달려 있다.<br>가슴의 명찰 : <b>김근수</b><br><span style="opacity:.6">…지난 보름밤 근무자?</span>',
  bag:'김근수 씨의 가방. 구겨진 근무 일지가 꽂혀 있다.<br><br><i>“22:40 숙소 문 장치, 바깥 용수철이 또 문을 당기고 있다.<br>23:50 절구 소리. 점점 가까워진다. 혹시 이걸 읽는다면 —”</i><br><br>뒷장은 찢겨 나갔다.',
  toolbox:'점검 공구함 : 드라이버 · 렌치 · 줄자 · <b>용수철저울</b>.<br>용수철저울은 따로 챙겼다. 힘의 크기를 잴 때 쓸 수 있다.',
  note2:{title:'야간 점검 지시서 #2',
    body:`장비를 챙겼다면 점검을 시작한다.<br><br>
1. 첫 번째 점검 장소는 <b>회전목마</b>다. 회전목마 입구 옆 조작실로 갈 것.<br>
2. 숙소 문을 열려면 <b>적절한 힘</b>이 필요하다.<br>&nbsp;&nbsp;&nbsp;문 옆 장치를 이용해, 알맞은 힘으로 문을 당겨 열 것.`},
  // 장력 평형 잠금장치 : 바깥 용수철이 손잡이를 바깥쪽으로 outN 만큼 당긴다. 화살표 한 칸 = perCell N
  force:{outN:10, perCell:2,
    q:'문 손잡이(작용점)를 바깥쪽 용수철이 잡아당기고 있어 걸쇠가 풀리지 않는다.<br>손잡이에 작용하는 <b>두 힘이 평형</b>을 이루면 걸쇠가 풀린다. 화살표 한 칸은 <b>2 N</b>.'},
  board:'근무표와 공지가 빼곡히 붙어 있다.<br>· 지난 보름밤 야간 점검 — 담당 <b>김근수</b>(출입증 0730) 연락 두절, 확인 바람<br>· 숙소 문 장력 장치 점검 요망 (바깥 용수철 교체 예정)<br>· 회전목마 3번 말 점검 요망',
  clock:'벽시계 바늘이 <b>10시 정각</b>에서 멈춰 있다.',
  drawer:'책상 서랍. 작은 자물쇠가 걸려 있다.',
};
// 사물함 이름표 글씨 (엔진이 Blender 의 SIGN_lname_N 자리에 붙인다)
for(const n in ROOM1.names) SIGNS['lname_'+n]=[ROOM1.names[n],'','#f4efe2','#1a1a1a'];
SIGNS.forcedev=['장력 평형 잠금장치','','#f2c230','#111111'];

(function(){
  const IN=(x,z)=>x>-56.8&&x<-47.3&&z>0.25&&z<7.75;        // 숙소 안쪽
  const door={target:Math.PI/2*0.95};
  let lightFlick=0; const swings=[];
  const it=()=>PARK.items, F=ROOM1.force;
  const show=(keys,on)=>keys.forEach(k=>{ if(it()[k]) it()[k].visible=on; });

  // 사물함 문 열기 : 경첩에 축을 두고 돌린다. 번호판 · 이름표(· 쪽지)도 문과 함께 돈다
  function swing(n,extra=[]){ const m=it()['locker_'+n]; if(!m) return; const bb=new THREE.Box3().setFromObject(m), pv=new THREE.Group(), e=n<=6;
    pv.position.set(e?bb.max.x:bb.min.x,0,e?bb.min.z:bb.max.z); m.parent.add(pv); pv.attach(m);
    [PARK.signs['locker_'+n],PARK.signs['lname_'+n],...extra].forEach(o=>o&&pv.attach(o));
    swings.push({pv,to:e?Math.PI*0.6:-Math.PI*0.6}); AUDIO.noise(.35,.25,0,900); AUDIO.tone(520,.25,'sawtooth',.03,0,-180); }

  async function readNote1(){ AUDIO.click(); await showMsg(ROOM1.note1.title,ROOM1.note1.body);
    if(!S.flags.note1){ S.flags.note1=true; objective(`내 사물함(${ROOM1.me}번)에서 점검 장비를 꺼내자`); setGoal(null); } }

  async function tapLocker(n){ const name=ROOM1.names[n]||'';
    if(n===ROOM1.me){
      if(S.flags.locker_me) return;
      if(!S.flags.key){ AUDIO.click(); AUDIO.noise(.12,.2,0,600); await mono([`${n}번 사물함. 이름표에 '${name}' — 내 사물함이다.`,'…잠겨 있다. 문에 쪽지가 붙어 있다.']); return; }
      S.flags.locker_me=true; AUDIO.tone(1400,.04,'square',.08); swing(n,[it().lockernote_dorm]); show(['toolbox_dorm','torch_dorm','note2_dorm'],true);
      await sleep(400); await mono(['열쇠가 맞는다.','…점검 장비다. 하나씩 챙기자.']); objective('사물함 속 장비 · 지시서를 챙기자'); return; }
    if(n===ROOM1.prev){
      if(S.flags.locker_prev) return;
      if(!S.flags.lockernote){ AUDIO.click(); await mono([`${n}번 사물함 · ${name}.`,'남의 사물함을 함부로 열 수는 없지.']); return; }
      S.flags.locker_prev=true; swing(n); show(['bag_dorm','key_dorm'],true); await sleep(400);
      await mono([`${name} 씨의 사물함… 잠겨 있지 않다.`,'가방이 하나 있고, 고리에 열쇠가 걸려 있다.']); objective('열쇠를 챙기자'); return; }
    AUDIO.click(); AUDIO.noise(.12,.2,0,600); await mono(`${n}번 사물함 · ${name}. 잠겨 있다.`); }

  async function readLockerNote(){ AUDIO.click(); await showMsg('쪽지',ROOM1.lockerNote);
    if(!S.flags.lockernote){ S.flags.lockernote=true; await mono(['이전 근무자…? 누군지부터 알아내야겠다.']); objective('이전 근무자가 누구인지 찾자 (사물함 이름표를 잘 보자)'); } }
  async function takeKey(){ S.flags.key=true; show(['key_dorm'],false); AUDIO.ok(); toast('3번 사물함 열쇠를 얻었다');
    await mono(['열쇠 고리에 작은 꼬리표 — 「3」.']); objective(`열쇠로 내 사물함(${ROOM1.me}번)을 열자`); }
  async function takeTorch(){ S.flags.torch=true; show(['torch_dorm'],false); $('#lightBtn').classList.add('on'); AUDIO.ok();
    toast(IS_TOUCH?'손전등을 챙겼다':'손전등을 챙겼다 · F 켜기/끄기'); afterTools(); }
  async function openToolbox(){ AUDIO.click(); await showMsg('점검 공구함',ROOM1.toolbox); if(!S.flags.scale){ S.flags.scale=true; S.inv.push('용수철저울'); } afterTools(); }
  async function readNote2(){ AUDIO.click(); await showMsg(ROOM1.note2.title,ROOM1.note2.body); S.flags.note2=true; afterTools(); }
  function afterTools(){ if(S.flags.door_open) return;
    if(S.flags.note2&&S.flags.torch){ objective('문 옆 장력 평형 잠금장치로 문을 열자'); const d=it().forcedev_dorm; if(d){ const p=new THREE.Box3().setFromObject(d).getCenter(new THREE.Vector3()); setGoal(p.x,p.z,'잠금장치'); } }
    else objective('사물함 속 장비 · 지시서를 챙기자'); }

  /* ---------------- 장력 평형 잠금장치 ---------------- */
  const pad={el:null,F:0,dir:'in',anim:0,busy:false};
  function drawPad(pull=0){ const c=$('#fcv'), g=c.getContext('2d'), W=c.width, H=c.height, cell=34, ox=W/2, oy=H/2+20;
    g.clearRect(0,0,W,H);
    g.strokeStyle='rgba(255,255,255,.06)'; g.lineWidth=1; for(let x=ox%cell;x<W;x+=cell){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); } for(let y=oy%cell;y<H;y+=cell){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
    g.font='600 15px "Noto Sans KR",sans-serif'; g.fillStyle='#8a8d93'; g.textAlign='left'; g.fillText('◀ 숙소 안쪽',14,24); g.textAlign='right'; g.fillText('바깥 ▶',W-14,24);
    // 문 (위에서 본 단면) · 손잡이 = 작용점
    const dx=pull*6; g.fillStyle='#6b4a32'; g.fillRect(ox-9+dx,oy-110,18,220); g.fillStyle='#3a2a1e'; g.fillRect(ox-9+dx,oy-110,4,220);
    g.fillStyle='#c9a23e'; g.beginPath(); g.arc(ox+dx,oy,8,0,7); g.fill();
    // 바깥 용수철 (오른쪽 벽에 걸림)
    g.strokeStyle='#9aa3ad'; g.lineWidth=3; g.beginPath(); const sx=ox+40+dx, ex=W-40; g.moveTo(ox+8+dx,oy); g.lineTo(sx,oy);
    for(let i=0;i<=14;i++){ const x=sx+(ex-sx)*i/14; g.lineTo(x,oy+(i%2?-12:12)*(i&&i<14?1:0)); } g.stroke(); g.fillStyle='#55585e'; g.fillRect(ex,oy-40,14,80);
    const arrow=(len,col,dirSign,label,y)=>{ if(len<=0) return; const x0=ox+dx, x1=x0+dirSign*len*cell; g.strokeStyle=col; g.fillStyle=col; g.lineWidth=5;
      g.beginPath(); g.moveTo(x0,y); g.lineTo(x1-dirSign*12,y); g.stroke(); g.beginPath(); g.moveTo(x1,y); g.lineTo(x1-dirSign*16,y-10); g.lineTo(x1-dirSign*16,y+10); g.fill();
      g.font='700 15px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText(label,(x0+x1)/2,y-14); };
    arrow(F.outN/F.perCell,'#ff6a4a',1,'용수철이 당기는 힘',oy-48);
    if(pad.F>0) arrow(pad.F/F.perCell,'#ffb340',pad.dir==='in'?-1:1,`내가 당기는 힘 ${pad.F} N`,oy+58);
    g.fillStyle='#c9a23e'; g.font='600 13px "Noto Sans KR",sans-serif'; g.textAlign='center'; g.fillText('작용점(손잡이)',ox+dx,oy+100);
    g.fillStyle='#8a8d93'; g.textAlign='left'; g.fillText('한 칸 = '+F.perCell+' N',14,H-14); }
  function setPad(){ $('#forcepad .fval').textContent=pad.F+' N'; document.querySelectorAll('#forcepad .fdir').forEach(b=>b.classList.toggle('on',b.dataset.d===pad.dir)); drawPad(); }
  function openForce(){ if(S.flags.door_open) return;
    if(!S.flags.note2){ AUDIO.click(); mono(['문을 붙잡고 있는 장치 같다. 줄이 문 위로 이어져 있다.','…먼저 지시서대로 장비부터 챙기자.']); return; }
    pad.F=0; pad.dir='in'; $('#forcepad .fq').innerHTML=F.q; $('#forcepad .fmsg').textContent=''; $('#forcepad .fmsg').className='fmsg'; setPad(); ov('#forcepad',true); AUDIO.click(); }
  async function pull(){ if(pad.busy) return; pad.busy=true; const btn=$('#forcepad .fgo'); btn.disabled=true; const msg=$('#forcepad .fmsg'); msg.className='fmsg'; msg.textContent='';
    const net=(pad.dir==='in'?pad.F:-pad.F)-F.outN;      // 안쪽(+) 으로 향하는 알짜힘
    AUDIO.tone(220,.5,'sawtooth',.04,0,net?-60:120); AUDIO.noise(.4,.15,0,700);
    for(let t=0;t<=1;t+=.05){ drawPad(Math.max(-1,Math.min(1,-net/10))*Math.sin(t*Math.PI)); await sleep(22); }
    if(net===0){ msg.className='fmsg ok'; msg.innerHTML=`두 힘의 크기가 <b>${F.outN} N</b>으로 같고, 한 직선 위에서 방향이 반대 — <b>힘의 평형</b>!<br>걸쇠를 누르던 힘이 사라졌다.`;
      drawPad(0); AUDIO.unlatch(); await sleep(1600); ov('#forcepad',false); solve(); }
    else { AUDIO.err(); msg.innerHTML=pad.dir==='out'?`같은 방향으로 당기면 두 힘이 더해진다 — 바깥쪽으로 <b>${F.outN+pad.F} N</b>. 걸쇠가 더 세게 물렸다.`
      :net<0?`아직 바깥쪽으로 <b>${-net} N</b> 더 당겨지고 있다. 걸쇠가 꿈쩍도 하지 않는다.`:`이번엔 안쪽으로 <b>${net} N</b> 더 당겨졌다. 문이 덜컹하더니 걸쇠가 다시 걸렸다.`; }
    btn.disabled=false; pad.busy=false; }
  document.querySelectorAll('#forcepad .fdir').forEach(b=>b.onclick=()=>{ AUDIO.tick(); pad.dir=b.dataset.d; setPad(); });
  document.querySelectorAll('#forcepad .fstep').forEach(b=>b.onclick=()=>{ AUDIO.tick(); pad.F=clamp(pad.F+(+b.dataset.s),0,30); setPad(); });
  $('#forcepad .fgo').onclick=pull;

  async function solve(){ openGate('dorm'); S.flags.door_open=true; door.target=Math.PI/2*0.95; AUDIO.noise(.6,.3,0,500); S.flags.room1=true;
    toast('숙소 문이 열렸다'); await mono(['…열렸다.','첫 번째 점검 장소는 회전목마. 입구 옆 조작실로 가자.']);
    objective('회전목마 조작실에서 점검 방법을 찾자'); setGoal(-19.05,11.9,'회전목마 조작실'); }

  ROOMS.push({id:'room1', build(){
    const I=it();
    show(['bag_dorm','key_dorm','toolbox_dorm','torch_dorm','note2_dorm'],false);    // 사물함이 열려야 보인다
    const add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    add('note_dorm','점검 지시서 #1',readNote1);
    for(let n=1;n<=10;n++) add('locker_'+n,`${n}번 사물함 · ${ROOM1.names[n]}`,()=>tapLocker(n));
    add('lockernote_dorm','사물함 쪽지',readLockerNote,2.4,()=>!S.flags.locker_me);
    add('uniform_dorm','벤치 위 근무복',()=>{ AUDIO.click(); S.flags.uniform=true; showMsg('근무복',ROOM1.uniform); });
    add('bag_dorm','김근수의 가방',()=>{ AUDIO.click(); showMsg('가방',ROOM1.bag); });
    add('key_dorm','열쇠',takeKey);
    add('toolbox_dorm','점검 공구함',openToolbox);
    add('torch_dorm','손전등',takeTorch);
    add('note2_dorm','점검 지시서 #2',readNote2);
    add('forcedev_dorm','장력 평형 잠금장치',openForce,2.6,()=>!S.flags.door_open);
    add('board_dorm','게시판',()=>{ AUDIO.click(); showMsg('게시판',ROOM1.board); },2.6);
    add('clock_dorm','벽시계',()=>{ AUDIO.click(); showMsg('벽시계',ROOM1.clock); },3.2);
    add('drawer_dorm','책상 서랍',()=>{ AUDIO.click(); mono(ROOM1.drawer); },2.2);
    GATE_TAP.dorm=async()=>{ if(IN(P.x,P.z)) return openForce(); await mono('…잠겨 있다.'); };
  },
  tick(dt){
    // 숙소 안으로 충분히 들어오면 문이 쾅 닫힌다 (22:00 이후 한 번)
    if(S.stage==='night'&&!S.flags.room1_in&&IN(P.x,P.z)&&P.x<-48.4){
      S.flags.room1_in=true; S.flags.open_dorm=false; door.target=0; setGoal(null);
      setTimeout(()=>{ AUDIO.slam(); lightFlick=1.4; },180);
      setTimeout(async()=>{ await mono(['…!','문이 저절로 닫혔다. 잠겼다.','…바람이겠지. 지시서부터 찾자.']); objective('책상 위 점검 지시서를 읽자');
        const d=it().note_dorm; if(d){ const p=new THREE.Box3().setFromObject(d).getCenter(new THREE.Vector3()); setGoal(p.x,p.z,'지시서'); } },900); }
    const D=PARK.anim.dormdoor; if(D){ D.rotation.y+=(door.target-D.rotation.y)*Math.min(1,dt*(door.target===0?16:2.5)); }
    swings.forEach(s=>{ s.pv.rotation.y+=(s.to-s.pv.rotation.y)*Math.min(1,dt*5); });
    const L=PARK.lights.dorm; if(L){ if(lightFlick>0){ lightFlick-=dt; L.l.intensity=L.base*(Math.random()<.5?.1:1); } else L.l.intensity=L.base; }
  }});
})();
