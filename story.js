/* ============================================================
   STORY : 루나랜드 야간 알바
   19:00 첫 출근 · 달토끼 아이스크림 판매 (손님 3명, 시간은 이야기로 흐른다)
   22:00 마감 → 화면 암전 후 시간 이동 · 손님은 모두 퇴장, 점검을 위해 불은 켜 둔다
        → 매니저 무전 : 직원 숙소의 '점검 지시서 #1' 을 찾아라  (방 1 : rooms/room1_dorm.js)
   00:00 자정 · 02:00 · 04:00 사건 → 06:00 시간 종료
   ============================================================ */
'use strict';
const FLAVOR={vanilla:'바닐라',strawberry:'딸기',choco:'초코'};

// 손님 주문 : next = 이 손님을 보낸 뒤 흐르는 공원 시각
const ORDERS=[
  {who:'손님', opts:{cloth:'#3b6fa8'}, flavor:'strawberry', next:19*60+50,
   say:['딸기 하나 주세요!'], thanks:['감사합니다~ 와, 노을 진짜 예쁘다.']},
  {who:'손님', opts:{cloth:'#e0b33a'}, flavor:'choco', next:21*60,
   say:['초코 하나요. …오늘 보름달이라던데, 여기서 보면 엄청 크게 보인다면서요?'], thanks:['감사해요. 퍼레이드 보러 가야지.']},
  {who:'아이', opts:{kid:true,ears:true,cloth:'#e07a9a'}, flavor:'vanilla', next:21*60+50,
   say:['바닐라 주세요!'], thanks:['고맙습니다!'], after:kidWarning},
];
let ORDER=null;

/* 근무지 설정 : 냉동고 통 3개를 조사 대상으로, 판매대 옆문은 근무 중에 막는다 */
ROOMS.push({id:'shift', build(){
  Object.keys(FLAVOR).forEach(f=>{ const m=PARK.items['tub_'+f]; if(!m) return;
    INTER.push({mesh:m,name:FLAVOR[f]+' 아이스크림 통',range:2.8,fn:()=>scoop(f),enabled:()=>S.stage==='shift'}); });
  addBox(13.3,17.85,13.6,20.1,()=>S.stage==='shift');
  S.flags.open_dorm=true;                          // 숙소 문은 처음엔 열려 있다 (방 1 에서 닫힌다)
  const d=PARK.anim.dormdoor; if(d) d.rotation.y=Math.PI/2*0.95;
  const eye=PARK.mat.rabbit_eye; if(eye) eye.emissiveIntensity=0;
}, tick(dt){ tickRabbit(dt); }});

async function scoop(f){ if(!ORDER){ await mono('…다음 손님을 기다리자.'); return; } if(ORDER.busy) return;
  if(f!==ORDER.flavor){ AUDIO.err(); ORDER.busy=true; await mono([`어… 그거 말고 ${FLAVOR[ORDER.flavor]}요!`],ORDER.who); ORDER.busy=false; return; }
  AUDIO.click(); AUDIO.noise(.15,.15,0,1800); const r=ORDER.done; ORDER=null; r(); }

// 손님 줄 : 처음부터 판매대 앞에 줄을 서 있고, 한 명씩 앞으로 나온다
const QUEUE=[[11.1,14.6],[10.8,13.2],[10.4,11.8]];
async function serve(od,c){ await c.toCounter(); if(S.introSkip) return;
  await mono(od.say,od.who); objective(`냉동고에서 ${FLAVOR[od.flavor]} 아이스크림을 퍼 주자`);
  await new Promise(r=>{ ORDER={...od,done:r}; if(S.introSkip) r(); });
  if(S.introSkip) return;
  c.give(od.flavor); c.wave(); AUDIO.ok(); toast('판매 완료'); await mono(od.thanks,od.who);
  if(od.after) await od.after(c); c.leave(); }

/* 공원 시각을 부드럽게 흘려보낸다 (인트로 전용) */
function passTime(to,ms=2500){ return new Promise(res=>{ const from=S.introMin, t0=performance.now();
  const step=()=>{ const k=Math.min(1,(performance.now()-t0)/ms); S.introMin=from+(to-from)*k; drawClock(); tickSky(0,true); if(k<1) requestAnimationFrame(step); else res(); }; step(); }); }

/* 셋째 손님 : 괴담 한 조각 + 달토끼 동상 눈이 잠깐 빛난다 */
async function kidWarning(){
  await mono(['…알바생님, 오늘 밤에 여기 남아요?','자정이 넘으면 달토끼가 배고파진대요.','쿵, 쿵 — 절구 찧는 소리가 들리면, 꼭 숨어야 해요.'],'아이');
  const yaw0=P.yaw, R=PARK.anim.rabbithead; P.free=false;
  if(R){ const p=new THREE.Vector3(); R.getWorldPosition(p); await camTo({yaw:Math.atan2(-(p.x-P.x),-(p.z-P.z)),pitch:0.08},1.2); }
  await zoom(24,700); rabbitGlint(); AUDIO.tone(70,1.2,'sine',.25); await sleep(1100); await zoom(72,500);
  await camTo({yaw:yaw0,pitch:0},0.8); P.free=true;
  await mono(['…요즘 애들 괴담이란.','방금, 저 동상 눈이… 빛났나?']); }
/* 화면 확대 (시야각 바꾸기) */
function zoom(fov,ms){ return new Promise(res=>{ const f0=camera.fov, t0=performance.now();
  const step=()=>{ const k=Math.min(1,(performance.now()-t0)/ms), e=k<.5?2*k*k:-1+(4-2*k)*k; camera.fov=f0+(fov-f0)*e; camera.updateProjectionMatrix(); if(k<1) requestAnimationFrame(step); else res(); }; step(); }); }
function rabbitGlint(){ const m=PARK.mat.rabbit_eye; if(!m) return; const t0=performance.now();
  const step=()=>{ const k=(performance.now()-t0)/700; m.emissiveIntensity=k<1?Math.sin(k*Math.PI)*4:S.rabbitAwake?2.5:0; if(k<1) requestAnimationFrame(step); }; step(); }

/* 자정 이후 : 달토끼 동상이 고개를 돌려 플레이어를 본다 */
const _rp=new THREE.Vector3(); let rabbitBase=null;
function tickRabbit(dt){ const R=PARK.anim.rabbithead; if(!R) return; if(rabbitBase===null) rabbitBase=R.rotation.y;
  let want=rabbitBase; if(S.rabbitAwake){ R.getWorldPosition(_rp); want=rabbitBase+Math.atan2(P.x-_rp.x,P.z-_rp.z)-Math.PI/2; }
  let d=want-R.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); R.rotation.y+=d*Math.min(1,dt*1.5); }

/* ---------------- 인트로 ---------------- */
async function intro(){
  const sp=PARK.spawns.kiosk||PARK.spawn; P.x=sp.x; P.z=sp.z; P.y=0; P.yaw=0; P.pitch=0.02; P.free=false;
  S.stage='shift'; S.introMin=19*60; tickSky(0,true);
  $('#hud').classList.add('on'); if(IS_TOUCH){ $('#jumpBtn').classList.add('on'); stickEl.classList.add('on'); }
  if(/night/.test(location.search)) return startNight(true);           // 주소 끝에 ?night 를 붙이면 22:00 부터 (시험용)
  CROWD.spawnWanderers(IS_TOUCH?12:22); const line=ORDERS.map((od,i)=>CROWD.customer({...od.opts,x:QUEUE[i][0],z:QUEUE[i][1]})); objective('…'); showClock('마감 22:00'); AUDIO.music('open');
  await sleep(300); $('#fade').classList.add('clear');
  await card('19:00','첫 출근','루나랜드 · 달토끼 아이스크림 판매대','dusk',3200);
  await mono(['여기가 루나랜드…. 듣던 대로 하늘이 예쁘다.','밤 10시까지는 아이스크림 판매, 그다음엔 아침까지 공원 점검.']);
  await mono(['신입, 벌써 줄 섰어요! 주문 들으면 냉동고에서 그 맛을 퍼 주면 돼요.','10시 마감까지만 버텨요. 그 뒤 일은 그때 알려 줄게요.'],'무전 · 매니저');
  P.free=true; S.phase='play';
  $('#hint').textContent=IS_TOUCH?'아이스크림 통을 탭해서 퍼 주기':'마우스로 둘러보기 · 아이스크림 통을 보고 E (또는 클릭)'; setTimeout(()=>$('#hint').textContent='',10000);
  for(let i=0;i<ORDERS.length&&!S.introSkip;i++){ await serve(ORDERS[i],line[i]); if(S.introSkip) break;
    line.slice(i+1).forEach((c,j)=>c.walkTo(...QUEUE[j])); objective(`손님에게 아이스크림 팔기 (${i+1}/3)`); await passTime(ORDERS[i].next,1600); }
  if(S.introSkip) return startNight(true);
  objective('마감 준비'); await announce('오늘도 루나랜드를 찾아 주셔서 감사합니다. 잠시 후 밤 10시, 모든 운행을 마칩니다. 안녕히 돌아가십시오.',{ms:2600});
  await startNight(false); }

/* 22:00 마감 → 야간 점검 시작 */
async function startNight(quick){ if(S.stage==='night') return; P.free=false; S.phase='play';
  $('#fade').classList.remove('clear'); await sleep(quick?200:1300);
  CROWD.clear(); AUDIO.stopMusic(); S.closed=true; S.stage='night'; S.rC=0; S.rW=0; ORDER=null;
  P.x=14.8; P.z=18.9; P.y=0; P.yaw=Math.atan2(14.8,8.9); P.pitch=0; P.vx=P.vz=0;   // 판매대 옆문 밖, 광장 쪽을 본다
  startTimer(); tickSky(0,true);
  if(!quick) await card('22:00','마감','손님이 모두 돌아갔다. 점검을 위해, 불은 끄지 않는다.','close',3800);
  $('#fade').classList.add('clear'); await sleep(600);
  if(!quick){ await mono(['수고했어요, 신입. 지금부터는 야간 점검조예요.','첫 번째 점검 지시서는 직원 숙소 책상 위에 뒀어요. 숙소는 회전목마 서쪽.','…아, 그리고. 자정 넘어서는 혼자 다니지 마요.'],'무전 · 매니저');
    await mono(['…혼자 다니지 말라니. 점검조는 나 혼자인데.']); }
  P.free=true; objective('직원 숙소에서 점검 지시서를 찾자 (회전목마 서쪽)');
  const d=PARK.spawns.dorm_door; setGoal(d?d.x:-45,d?d.z:4,'직원 숙소');
  $('#hint').textContent=IS_TOUCH?'':'M 지도 · E 조사'; setTimeout(()=>$('#hint').textContent='',8000); }

/* 시험용 : Shift+K 로 인트로 건너뛰기 */
function skipIntro(){ if(S.stage!=='shift') return; S.introSkip=true; if(ORDER){ const r=ORDER.done; ORDER=null; r(); }
  while($('#mono').classList.contains('on')) monoNext(); }

/* ---------------- 밤의 사건 ---------------- */
EVENTS.push(
  {at:24*60, fn:async()=>{ document.body.classList.add('midnight'); S.rabbitAwake=true; S.ridesGhost=true; rabbitGlint(); AUDIO.music('dead');
    if(PARK.scrawl) PARK.scrawl.visible=true;
    await card('00:00','자정','보름달이 가장 높이 떴다. 아무도 없는데, 회전목마가 돈다.','dead');
    await announce('…손님 여러분… 아직… 공원에 남아 계신 분은… 달토끼 앞으로… 모여 주십시오…',{broken:true,ms:3400});
    AUDIO.stopMusic(); setTimeout(()=>{ if(!S.over) AUDIO.music('dead'); },6000); }},
  {at:24*60+120, fn:()=>card('02:00','새벽 2시','달이 서쪽으로 기울기 시작했다','dead',3000)},
  {at:24*60+240, fn:()=>card('04:00','새벽 4시','해 뜨기까지 두 시간','dead',3000)},
);
