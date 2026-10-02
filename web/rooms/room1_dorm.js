/* ============================================================
   방 1 : 직원 숙소 (22:00 ~)
   - 숙소에 들어오면 문이 저절로 닫히고 잠긴다
   - 책상 위 '야간 점검 지시서 #1' 을 읽으면 방 1 시작
   - 조사 대상 : 긴 사물함 1~10 · 게시판 · 벽시계 · 책상 서랍 · 문 옆 번호 자물쇠
   - 번호 자물쇠를 풀면 문이 열리고 방 1 끝

   ★ 퍼즐 내용은 아래 ROOM1 만 고치면 된다. 지금은 공간과 흐름만 잡아 둔 상태 (문제는 추후 추가)
   ============================================================ */
'use strict';
const ROOM1={
  code:null,          // 문 자물쇠 정답 4자리 (예: '1234'). null 이면 '제작 중' — 아무 4자리나 열린다
  codeHint:'',        // 자물쇠 화면 아래 작은 글씨 (힌트가 필요하면)
  note:{title:'야간 점검 지시서 #1',
    body:`야간 점검조 신입에게.<br><br>
1. 점검은 숙소에서 시작한다. 숙소 문은 <b>점검 준비</b>가 끝나야 열린다.<br>
2. 점검 장비는 사물함 안에 있다. 네 사물함 번호는 스스로 찾아라.<br>
3. 자정이 넘으면 달토끼 동상과 눈을 마주치지 말 것.<br>
4. 절구 찧는 소리가 들리면 가까운 건물로 들어가 문을 닫을 것.<br><br>
<span style="opacity:.6">(문제 준비 중 — 이 자리에 첫 번째 퍼즐 안내가 들어갑니다)</span>`},
  // 사물함 : locked 면 잠김 메시지, 아니면 열리면서 text 를 보여 준다
  lockers:{
    1:{locked:true}, 2:{locked:true}, 3:{locked:true},
    4:{locked:false, text:'누군가의 근무복이 걸려 있다. 가슴에 출입증이 그대로 달려 있다.<br><b>야간 점검조 · No. 0730</b><br>…내 출입증 번호는 0731인데.'},
    5:{locked:true}, 6:{locked:true}, 7:{locked:true}, 8:{locked:true}, 9:{locked:true}, 10:{locked:true},
  },
  board:'근무표와 공지가 빼곡히 붙어 있다.<br>· 지난 보름밤 야간 점검 — 담당자(출입증 0730) 연락 두절, 확인 바람<br>· 회전목마 3번 말 점검 요망<br>(퍼즐 단서가 들어갈 자리)',
  clock:'벽시계 바늘이 <b>10시 정각</b>에서 멈춰 있다.<br>(퍼즐 단서가 들어갈 자리)',
  drawer:{locked:true, text:'책상 서랍. 작은 자물쇠가 걸려 있다.'},
};

(function(){
  const IN=(x,z)=>x>-56.8&&x<-47.3&&z>0.25&&z<7.75;        // 숙소 안쪽
  const door={target:Math.PI/2*0.95};
  let lightFlick=0, swings=[];

  // 사물함 문 · 서랍 여닫기 : 경첩 위치에 축을 만들고 그 축을 돌린다
  function swing(mesh,kind){ const bb=new THREE.Box3().setFromObject(mesh), pv=new THREE.Group();
    if(kind==='e'){ pv.position.set(bb.max.x,0,bb.min.z); } else { pv.position.set(bb.min.x,0,bb.max.z); }
    mesh.parent.add(pv); pv.attach(mesh); const s={pv,to:kind==='e'?Math.PI*0.55:-Math.PI*0.55}; swings.push(s); }

  async function readNote(){ AUDIO.click(); await showMsg(ROOM1.note.title,ROOM1.note.body);
    if(!S.flags.room1_note){ S.flags.room1_note=true; objective('숙소 문을 열 방법을 찾자'); setGoal(null); } }
  async function tapLocker(n){ const L=ROOM1.lockers[n]||{locked:true};
    if(L.locked){ AUDIO.click(); AUDIO.noise(.12,.2,0,600); await mono(`${n}번 사물함. 잠겨 있다.`); return; }
    if(!S.flags['locker_'+n]){ S.flags['locker_'+n]=true; AUDIO.noise(.35,.25,0,900); const m=PARK.items['locker_'+n]; if(m) swing(m,n<=6?'e':'s'); await sleep(350); }
    if(L.text) await showMsg(`${n}번 사물함`,L.text); }
  async function openKeypad(){ if(S.flags.open_dorm) return;
    const ok=await keypad({title:'숙소 문 · 번호 자물쇠',len:4,
      hint:ROOM1.code?ROOM1.codeHint:'(제작 중 : 문제가 들어갈 자리 — 지금은 아무 4자리나 열립니다)',
      check:c=>ROOM1.code?c===ROOM1.code:true});
    if(ok) solve(); }
  async function solve(){ openGate('dorm'); door.target=Math.PI/2*0.95; AUDIO.noise(.6,.3,0,500); S.flags.room1=true; setGoal(null);
    toast('숙소 문이 열렸다'); await mono(['…열렸다.','이제 진짜 점검 시작이다.']);
    objective('다음 점검 지시를 찾자 (준비 중)'); }

  ROOMS.push({id:'room1', build(){
    const it=PARK.items;
    if(it.note_dorm) INTER.push({mesh:it.note_dorm,name:'점검 지시서',range:2.4,fn:readNote});
    for(let n=1;n<=10;n++) if(it['locker_'+n]) INTER.push({mesh:it['locker_'+n],name:`${n}번 사물함`,range:2.4,fn:()=>tapLocker(n)});
    if(it.board_dorm) INTER.push({mesh:it.board_dorm,name:'게시판',range:2.6,fn:()=>{ AUDIO.click(); showMsg('게시판',ROOM1.board); }});
    if(it.clock_dorm) INTER.push({mesh:it.clock_dorm,name:'벽시계',range:3.2,fn:()=>{ AUDIO.click(); showMsg('벽시계',ROOM1.clock); }});
    if(it.drawer_dorm) INTER.push({mesh:it.drawer_dorm,name:'책상 서랍',range:2.2,fn:async()=>{ AUDIO.click();
      if(ROOM1.drawer.locked){ await mono(ROOM1.drawer.text); return; } if(!S.flags.drawer){ S.flags.drawer=true; it.drawer_dorm.position.z-=0.3; } await showMsg('서랍',ROOM1.drawer.text); }});
    if(it.keypad_dorm) INTER.push({mesh:it.keypad_dorm,name:'번호 자물쇠',range:2.4,fn:openKeypad,enabled:()=>!S.flags.open_dorm});
    GATE_TAP.dorm=async()=>{ if(IN(P.x,P.z)) return openKeypad(); await mono('…잠겨 있다.'); };
  },
  tick(dt){
    // 숙소 안으로 충분히 들어오면 문이 저절로 닫힌다 (22:00 이후 한 번)
    if(S.stage==='night'&&!S.flags.room1_in&&IN(P.x,P.z)&&P.x<-48.4){
      S.flags.room1_in=true; S.flags.open_dorm=false; door.target=0; lightFlick=1.4; setGoal(null);
      setTimeout(()=>{ AUDIO.noise(.5,.5,0,300); AUDIO.tone(55,.6,'square',.2); },250);
      setTimeout(async()=>{ await mono(['…!','문이 저절로 닫혔다.','…바람이겠지. 지시서부터 찾자.']); objective('책상 위 점검 지시서를 읽자');
        const d=PARK.items.note_dorm; if(d){ const p=new THREE.Box3().setFromObject(d).getCenter(new THREE.Vector3()); setGoal(p.x,p.z,'지시서'); } },900); }
    // 문 · 사물함 문 움직임
    const D=PARK.anim.dormdoor; if(D){ D.rotation.y+=(door.target-D.rotation.y)*Math.min(1,dt*(door.target===0?14:3)); }
    swings.forEach(s=>{ s.pv.rotation.y+=(s.to-s.pv.rotation.y)*Math.min(1,dt*5); });
    // 문이 닫힐 때 형광등이 깜빡인다
    const L=PARK.lights.dorm; if(L){ if(lightFlick>0){ lightFlick-=dt; L.l.intensity=L.base*(Math.random()<.5?.1:1); } else L.l.intensity=L.base; }
  }});
})();
