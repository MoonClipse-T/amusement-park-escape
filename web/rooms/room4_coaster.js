/* ============================================================
   방 4 : 롤러코스터 = 후룸라이드 (통나무 보트가 마지막에 물로 떨어지는 놀이기구)   [9과05-04 부력 — 퍼즐 준비 중]
   흐름 : 범퍼카 공포 → 롤러코스터 조작실 (역 남쪽, 창 너머로 마지막 낙하 지점의 물이 보인다)
        → 문이 잠겨 있다. 문 옆 키패드 + 그 옆에 붙은 쪽지 (비밀번호 단서)
        → 문을 열고 점검 방법 : 스플래시 풀(마지막 낙하 지점의 물)에서 '부력'으로 점검 — 점검 퍼즐은 준비 중
   ★ 글 · 숫자는 아래 ROOM4 에서 고친다. code · note 는 퍼즐이 정해지면 바꿀 임시 값
   ============================================================ */
'use strict';
const ROOM4={
  code:'0731',                                   // 임시 비밀번호 (= 이해권 출입증 번호)
  note:{title:'키패드 옆 쪽지',
    body:`<span style="opacity:.7">(준비 중) 키패드 비밀번호의 단서가 들어갈 자리.</span><br><br>임시 단서 : 비밀번호는 <b>내 출입증 번호</b>.`},
  manual:{title:'후룸라이드 야간 점검 방법',
    body:`1. 마지막 낙하 지점의 물(<b>스플래시 풀</b>)을 확인한다.<br>
2. 통나무 보트가 물에 잘 뜨는지, <b>물에 뜨는 힘(부력)</b>으로 점검한다.<br>
<span style="opacity:.6">(점검 내용은 준비 중)</span>`},
};
SIGNS.booth_coaster=['롤러코스터 조작실','LOG FLUME CONTROL · 관계자 외 출입금지','#1b1b1b','#e3b54a'];
SIGNS.manual_coaster=['점검 방법','후룸라이드 · 야간 점검','#fbf6e8','#8e231c'];
SIGNS.flume_pool=['스플래시 풀','마지막 낙하 지점 · 물이 튈 수 있어요','#f2ede2','#1d5a6a'];
GATES.cbooth='롤러코스터 조작실 문';

(function(){
  const R=ROOM4, door={t:0,base:null};
  const spot=()=>PARK.spots.booth_coaster||{x:22.6,z:4.1};
  async function readNote(){ AUDIO.click(); await showMsg(R.note.title,R.note.body);
    if(!S.flags.keynote){ S.flags.keynote=true; INV.note('keynote',R.note.title,R.note.body); } }
  async function openPad(){ if(S.flags.open_cbooth) return;
    const ok=await keypad({title:'조작실 키패드',len:R.code.length,hint:'문 옆 쪽지에 단서가 있다',check:c=>c===R.code}); if(!ok) return;
    openGate('cbooth'); door.t=1; AUDIO.unlatch(); toast('조작실 문이 열렸다');
    await mono(['…열렸다.']); objective('조작실 안에서 점검 방법을 찾자'); const m=itemPos('manual_coaster'); if(m) setGoal(m.x,m.z,'점검 방법'); }
  async function readManual(){ AUDIO.click(); await showMsg(R.manual.title,R.manual.body);
    if(S.flags.manual_coaster) return; S.flags.manual_coaster=true; INV.note('manual_coaster',R.manual.title,R.manual.body); setGoal(null);
    await mono(['마지막에 보트가 떨어지는 저 물…','이번 점검은 물에 뜨는 힘, 부력으로 하라는 거구나.']); objective('롤러코스터 점검 — 부력 (준비 중)'); }

  /* ---------- 디버그 바로 가기 (Shift+0) ---------- */
  CHECKPOINTS.push({key:'0',name:'롤러코스터(후룸라이드) 조작실 · 키패드',go(){ room3Done(); S.flags.coaster_arrive=true; const s=spot(), k=itemPos('keypad_coaster')||s;
    warp(s.x,s.z+1.6,k.x,k.z); objective('조작실 키패드의 비밀번호를 찾자'); }});

  ROOMS.push({id:'room4', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4,enabled)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn,enabled}); };
    add('keypad_coaster','조작실 키패드',openPad,2.4,()=>!S.flags.open_cbooth);
    add('keynote_coaster','키패드 옆 쪽지',readNote);
    add('manual_coaster','후룸라이드 야간 점검 방법',readManual);
    add('console_coaster','후룸라이드 조작반',()=>{ AUDIO.click(); mono(S.flags.manual_coaster?'후룸라이드 조작반. …아직 손댈 때가 아니다. (준비 중)':'…점검 방법부터 찾자.'); });
    add('mic_coaster','안내 방송 마이크',async()=>{ AUDIO.tone(1800,.4,'sine',.05); await announce('아, 아… 저기, 아무도 없습니까?',{ms:1600,voice:'mic_bumper'}); await mono('…역시 대답이 없다.'); });
    add('flume_pool','스플래시 풀',()=>{ AUDIO.noise(.5,.08,0,1200); mono(['후룸라이드가 마지막에 떨어지는 물. 스플래시 풀이다.','통나무 보트가 물 위에 떠 있다. …물에 뜨는 힘, 부력.']); },3.4);
    add('flume_boat','통나무 보트',()=>{ AUDIO.noise(.4,.08,0,900); mono('통나무 보트. 반쯤 잠긴 채 물에 떠 있다.'); },3.6);
    GATE_TAP.cbooth=async()=>{ AUDIO.click(); AUDIO.noise(.3,.25,0,400); await mono(['…잠겨 있다. 문 옆에 키패드가 있다.']); };
  },
  tick(dt){
    if(S.stage==='night'&&S.flags.bumper_scare&&!S.flags.coaster_arrive&&!S.busy){ const s=spot();
      if(Math.hypot(P.x-s.x,P.z-s.z)<7){ S.flags.coaster_arrive=true; setGoal(null);
        mono(['롤러코스터… 아니, 통나무 보트를 타는 후룸라이드구나. 마지막엔 저 물로 떨어지고.','조작실 문이 잠겨 있다. 문 옆에 키패드랑… 쪽지가 붙어 있다.']).then(()=>{
          objective('조작실 키패드의 비밀번호를 찾자'); const k=itemPos('keypad_coaster'); if(k) setGoal(k.x,k.z,'키패드'); }); } }
    const D=PARK.anim.cbdoor; if(D){ if(door.base===null) door.base=D.rotation.y; const to=door.base-door.t*Math.PI/2*.92; D.rotation.y+=(to-D.rotation.y)*Math.min(1,dt*3); }
  }});
})();
