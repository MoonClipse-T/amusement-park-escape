/* ============================================================
   루나랜드 — 야간 개장 (저녁 19:00 → 새벽 03:00) 스릴러 방탈출 · 기본 맵
   three.js r128 · 터치/키보드 겸용 · 1인칭
   구조 : ENGINE(렌더/플레이어/충돌/입력/UI) + TIME(공원 시계·하늘·사건) + PARK(Blender 맵) + ROOMS[](방 단위 스크립트)
   실제 40분 = 공원 시간 8시간 (실제 1분 = 공원 12분)
   맵은 build/build_park.py(Blender)에서 만들고, 이름 규칙(COL_/FLOOR_/SIGN_/ZONE_…)으로 엔진이 읽는다.
   ============================================================ */
'use strict';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const IS_TOUCH=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window);
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

/* ---------------- 오디오 (합성음) ---------------- */
const AUDIO={ctx:null,
 init(){ if(this.ctx) return; try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} },
 tone(f,dur,type='sine',vol=.25,t0=0,slide=0){ const c=this.ctx; if(!c) return; const o=c.createOscillator(),g=c.createGain();
   o.type=type; o.frequency.setValueAtTime(f,c.currentTime+t0); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),c.currentTime+t0+dur);
   g.gain.setValueAtTime(0,c.currentTime+t0); g.gain.linearRampToValueAtTime(vol,c.currentTime+t0+.01); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t0+dur);
   o.connect(g); g.connect(c.destination); o.start(c.currentTime+t0); o.stop(c.currentTime+t0+dur+.05); },
 noise(dur,vol=.2,t0=0,freq=900){ const c=this.ctx; if(!c) return; const n=c.sampleRate*dur, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0);
   for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n); const s=c.createBufferSource(); s.buffer=b; const g=c.createGain(); g.gain.value=vol;
   const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=freq; s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime+t0); },
 click(){ this.tone(200,.05,'square',.12); this.noise(.05,.15); },
 err(){ this.tone(300,.25,'square',.18); this.tone(240,.25,'square',.18,.12); },
 ok(){ this.tone(900,.1,'sine',.2); this.tone(1350,.18,'sine',.2,.1); },
 tick(){ this.tone(2000,.02,'square',.05); },
 // 바람 소리 (계속 재생)
 // 안내 방송 차임 (딩-동-댕-동)
 chime(broken){ [784,659,523,392].forEach((f,i)=>this.tone(broken?f*(0.94+Math.random()*.1):f,.7,'sine',.16,i*.32)); },
 // 회전목마 오르간 (합성 왈츠) : 운영 시간엔 밝게, 자정엔 느리고 어긋나게
 music(mode='open'){ const c=this.ctx; if(!c) return; this.stopMusic(); this.musicMode=mode;
   const mel=[67,71,74,79,78,74,76,72,69,72,76,74,71,67,69,71, 67,71,74,79,81,79,76,72,74,76,72,69,67,66,67,0];
   const bass=[43,50,50, 43,50,50, 45,52,52, 38,50,50, 43,50,50, 43,50,50, 45,52,52, 38,45,45];
   const slow=mode==='dead', beat=slow?0.42:0.24; let i=0;
   const hz=n=>440*Math.pow(2,(n-69)/12)*(slow?(0.97+Math.random()*.02):1);
   const step=()=>{ const m=mel[i%mel.length]; if(m) this.tone(hz(m),beat*1.6,slow?'triangle':'square',slow?.035:.03);
     const b=bass[i%bass.length]; this.tone(hz(b),beat*.9,'triangle',i%3===0?.07:.035); i++;
     if(slow&&Math.random()<.08) i+=Math.floor(Math.random()*3); };
   step(); this.musicTimer=setInterval(step,beat*1000); },
 stopMusic(){ clearInterval(this.musicTimer); this.musicTimer=null; this.musicMode=null; },
 wind(){ const c=this.ctx; if(!c||this.windOn) return; this.windOn=true; const n=c.sampleRate*4, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); let v=0;
   for(let i=0;i<n;i++){ v=v*.995+(Math.random()*2-1)*.05; d[i]=v; } const s=c.createBufferSource(); s.buffer=b; s.loop=true;
   const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=380; f.Q.value=.6; const g=c.createGain(); g.gain.value=.35;
   const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=.07; lg.gain.value=160; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
   s.connect(f); f.connect(g); g.connect(c.destination); s.start(); }
};

/* ---------------- 캔버스 텍스처 ---------------- */
function cvs(w,h,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); fn(g,w,h,c); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; return t; }
function grime(g,w,h,a=.18){ for(let k=0;k<w*h/90;k++){ g.fillStyle=`rgba(20,14,8,${Math.random()*a})`; g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3); }
  for(let k=0;k<6;k++){ const x=Math.random()*w; g.fillStyle=`rgba(40,25,10,${a*.6})`; g.fillRect(x,Math.random()*h*.3,1+Math.random()*3,h*(.3+Math.random()*.7)); } }
const TEX={};
TEX.sign=(lines,bg,fg,w=1024,h=256)=>cvs(w,h,(g)=>{ g.fillStyle=bg; g.fillRect(0,0,w,h); g.strokeStyle=fg; g.lineWidth=h*.03; g.strokeRect(h*.06,h*.06,w-h*.12,h-h*.12);
  g.fillStyle=fg; g.textAlign='center'; g.textBaseline='middle'; const n=lines.length;
  lines.forEach((l,i)=>{ const big=i===0; let fs=big?h*(n>1?.42:.56):h*.2; g.font=`${big?900:500} ${fs}px "Malgun Gothic",sans-serif`;
    while(g.measureText(l).width>w*.9&&fs>8){ fs*=.92; g.font=`${big?900:500} ${fs}px "Malgun Gothic",sans-serif`; }
    g.fillText(l,w/2,n>1?(big?h*.42:h*.76):h/2); }); grime(g,w,h); });
TEX.scrawl=(text,col='rgba(110,12,10,.9)')=>cvs(1024,384,(g,w,h)=>{ g.fillStyle=col; g.font='900 120px "Malgun Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.save(); g.translate(w/2,h/2); g.rotate(-.05); g.fillText(text,0,0); g.restore();
  for(let k=0;k<22;k++){ const x=w*.15+Math.random()*w*.7,y=h*.55+Math.random()*h*.1; g.fillRect(x,y,3+Math.random()*3,20+Math.random()*90); } });

/* ---------------- 엔진 ---------------- */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!IS_TOUCH,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,IS_TOUCH?1.5:2)); renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
const FOG_COL=0x11151b;
const scene=new THREE.Scene(); scene.background=new THREE.Color(FOG_COL); scene.fog=new THREE.FogExp2(FOG_COL,0.024);
const camera=new THREE.PerspectiveCamera(72,1,0.05,260);
function resize(){ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();

const P={x:0,z:0,y:0,eye:1.6,yaw:0,pitch:0,vx:0,vz:0,vy:0,r:0.3,speed:2.6,free:false,grounded:true};
const FLOORS=[]; // {test:(x,z)=>bool, y:(x,z)=>number}
function floorAt(x,z){ let y=0; for(const f of FLOORS){ if(f.test(x,z)) y=Math.max(y,f.y(x,z)); } return y; }
const LIGHTS=[]; function regLight(l){ LIGHTS.push({l,base:l.intensity}); return l; }
const COL=[];   // {x1,z1,x2,z2,on}  AABB
const CIRC=[];  // {x,z,r,on}        원기둥
const INTER=[]; // {mesh,name,range,fn,enabled}
const WORLD=new THREE.Group(); scene.add(WORLD);
const S={phase:'title',flags:{},t:0,timerOn:false,paused:false,over:false,busy:false,inv:[]};

/* --- 충돌 (원 vs AABB/원, 축별 분리) --- */
function blocked(x,z){ const r=P.r;
  for(const b of COL){ if(b.on&&!b.on()) continue; if(x+r>b.x1&&x-r<b.x2&&z+r>b.z1&&z-r<b.z2) return true; }
  for(const c of CIRC){ if(c.on&&!c.on()) continue; const dx=x-c.x,dz=z-c.z,rr=c.r+r; if(dx*dx+dz*dz<rr*rr) return true; } return false; }
function move(dx,dz){ if(blocked(P.x,P.z)){ P.x+=dx; P.z+=dz; return; } // 이미 끼어 있으면 빠져나오게
  let nx=P.x+dx; if(!blocked(nx,P.z)) P.x=nx; else { for(let k=0;k<4;k++){ dx*=.5; if(!blocked(P.x+dx,P.z)){ P.x+=dx; break; } } }
  let nz=P.z+dz; if(!blocked(P.x,nz)) P.z=nz; else { for(let k=0;k<4;k++){ dz*=.5; if(!blocked(P.x,P.z+dz)){ P.z+=dz; break; } } } }
function addBox(x1,z1,x2,z2,on){ COL.push({x1:Math.min(x1,x2),z1:Math.min(z1,z2),x2:Math.max(x1,x2),z2:Math.max(z1,z2),on}); }

/* --- 입력 --- */
const keys={};
addEventListener('keydown',e=>{ keys[e.code]=true; if(e.code==='Space'&&$('#mono').classList.contains('on')){ monoNext(); return; } if(S.phase!=='play') return;
  if(e.code==='KeyE'&&!S.busy) tryInteract(); if(e.code==='Escape') togglePause(); if(e.code==='KeyF') toggleLight(); if(e.code==='KeyM') toggleMap();
  if(e.code==='Space') jump(); dbgKey(e); });
addEventListener('keyup',e=>{ keys[e.code]=false; });
const stick={id:null,cx:0,cy:0,dx:0,dy:0}, look={id:null,lx:0,ly:0,sx:0,sy:0,t0:0,moved:false};
const stickEl=$('#stick'),knob=$('#knob');
canvas.addEventListener('pointerdown',e=>{ if(S.busy||S.phase!=='play') return; AUDIO.init(); canvas.setPointerCapture(e.pointerId);
  const leftZone=e.pointerType==='touch'&&e.clientX<innerWidth*0.45&&e.clientY>110;
  if(stick.id===null&&leftZone&&P.free){ stick.id=e.pointerId; stick.cx=e.clientX; stick.cy=e.clientY; stickEl.style.left=(e.clientX-70)+'px'; stickEl.style.top=(e.clientY-70)+'px'; stickEl.style.bottom='auto'; stickEl.classList.add('live'); setStick(e.clientX,e.clientY); return; }
  if(look.id===null){ look.id=e.pointerId; look.lx=look.sx=e.clientX; look.ly=look.sy=e.clientY; look.t0=performance.now(); look.moved=false; } });
canvas.addEventListener('pointermove',e=>{ if(e.pointerId===stick.id){ setStick(e.clientX,e.clientY); return; }
  if(e.pointerId===look.id){ const dx=e.clientX-look.lx, dy=e.clientY-look.ly; look.lx=e.clientX; look.ly=e.clientY;
    if(Math.hypot(e.clientX-look.sx,e.clientY-look.sy)>8) look.moved=true; if(!P.free) return;
    const k=(e.pointerType==='touch'?0.0048:0.0032); P.yaw-=dx*k; P.pitch=clamp(P.pitch-dy*k,-1.35,1.35); } });
function endPointer(e){ if(e.pointerId===stick.id){ stick.id=null; stick.dx=stick.dy=0; knob.style.transform=''; stickEl.classList.remove('live'); stickEl.style.left=''; stickEl.style.top=''; stickEl.style.bottom=''; return; }
  if(e.pointerId===look.id){ look.id=null; if(!look.moved&&performance.now()-look.t0<400) tapAt(e.clientX,e.clientY); } }
canvas.addEventListener('pointerup',endPointer); canvas.addEventListener('pointercancel',endPointer);
function setStick(x,y){ let dx=x-stick.cx, dy=y-stick.cy; const m=Math.hypot(dx,dy), R=60; if(m>R){ dx=dx/m*R; dy=dy/m*R; } stick.dx=dx/R; stick.dy=dy/R; knob.style.transform=`translate(${dx}px,${dy}px)`; }

/* --- 조사 (레이캐스트) --- */
const ray=new THREE.Raycaster(); ray.far=3.4; let hot=null;
function pick(nx,ny){ ray.setFromCamera(new THREE.Vector2(nx,ny),camera); const list=INTER.filter(i=>i.mesh.visible&&(!i.enabled||i.enabled())); const hits=ray.intersectObjects(list.map(i=>i.mesh),true);
  for(const h of hits){ let o=h.object; while(o){ const it=list.find(i=>i.mesh===o); if(it){ return h.distance<=(it.range||2.8)?it:null; } o=o.parent; } } return null; }
function tapAt(cx,cy){ if(!P.free||S.busy||performance.now()-(S.lastClose||0)<350) return; const it=pick((cx/innerWidth)*2-1,-(cy/innerHeight)*2+1); if(it) it.fn(); }
function tryInteract(){ if(!P.free) return; const it=hot||pick(0,0); if(it) it.fn(); }
$('#interact').addEventListener('pointerdown',e=>{ e.stopPropagation(); AUDIO.init(); tryInteract(); });

/* --- UI 도우미 --- */
let toastT=null; function toast(s,ms=2200){ const t=$('#toast'); t.textContent=s; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),ms); }
function objective(s){ $('#objtext').textContent=s; }
function ov(id,on){ const el=$(id); el.classList.toggle('on',on); if(!on) S.lastClose=performance.now(); S.busy=!!document.querySelector('.ov.on:not(#start)')||$('#mono').classList.contains('on'); if(S.busy){ stick.dx=stick.dy=0; } }
document.querySelectorAll('.ov .close').forEach(b=>b.addEventListener('click',()=>{ ov('#'+b.parentElement.id,false); AUDIO.click(); }));
function showMsg(t,p){ return new Promise(res=>{ $('#msgT').textContent=t; $('#msgP').innerHTML=p; ov('#msg',true); $('#msgOk').onclick=()=>{ ov('#msg',false); res(); }; }); }

/* 독백창 */
const monoQ={lines:[],i:0,res:null,typing:null,full:'',pend:[]};
function mono(lines,who='나'){ return new Promise(res=>{ if(monoQ.res){ monoQ.pend.push([lines,who,res]); return; } monoStart(lines,who,res); }); }
function monoStart(lines,who,res){ monoQ.lines=Array.isArray(lines)?lines:[lines]; monoQ.i=0; monoQ.res=res; $('#mono .who').textContent=who; ov('#mono',true); S.busy=true; monoShow(); }
function monoShow(){ const txt=$('#mono .txt'); const s=monoQ.lines[monoQ.i]; monoQ.full=s; txt.textContent=''; let k=0; clearInterval(monoQ.typing);
  monoQ.typing=setInterval(()=>{ k++; txt.textContent=s.slice(0,k); if(k>=s.length) clearInterval(monoQ.typing); },22); }
function monoNext(){ const txt=$('#mono .txt'); if(txt.textContent.length<monoQ.full.length){ clearInterval(monoQ.typing); txt.textContent=monoQ.full; return; }
  monoQ.i++; if(monoQ.i<monoQ.lines.length) monoShow(); else { const r=monoQ.res; monoQ.res=null; const nx=monoQ.pend.shift(); if(nx){ monoStart(nx[0],nx[1],nx[2]); } else ov('#mono',false); r&&r(); } }
$('#mono').addEventListener('pointerdown',e=>{ e.stopPropagation(); monoNext(); });
addEventListener('pointerdown',e=>{ if($('#mono').classList.contains('on')&&e.target===canvas){ e.stopPropagation(); monoNext(); } },true);

/* ============================================================
   TIME : 공원 시계 (19:00 → 03:00) · 남은 시간 · 사건
   - 공원 시각(분) = 19:00 + 경과 비율 × 8시간
   - EVENTS 의 at(공원 시각)에 도달하면 fn 실행 (방 스크립트도 EVENTS.push 로 붙일 수 있다)
   ============================================================ */
const TIMER_SEC=40*60; let timeLeft=TIMER_SEC;
const CLOCK_START=19*60, CLOCK_SPAN=8*60;            // 19:00 시작, 8시간
function parkMin(){ return CLOCK_START+(1-timeLeft/TIMER_SEC)*CLOCK_SPAN; }   // 19:00 → 27:00(=03:00)
function hhmm(m,ap){ m=Math.floor(m)%1440; const h=Math.floor(m/60), mm=String(m%60).padStart(2,'0');
  if(!ap) return String(h).padStart(2,'0')+':'+mm; return [(h>=12?'PM':'AM'), String(h%12||12).padStart(2,'0')+':'+mm]; }
function fmt(s){ s=Math.max(0,Math.ceil(s)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
function startTimer(){ S.timerOn=true; $('#clock').classList.add('on'); drawClock(); }
function drawClock(){ const [ap,hm]=hhmm(parkMin(),true); const el=$('#clock'); el.querySelector('.ap').textContent=ap; el.querySelector('.hm').textContent=hm;
  el.querySelector('.left b').textContent=fmt(timeLeft); el.classList.toggle('late',parkMin()>=24*60+120); el.classList.toggle('warn',timeLeft<300); }
function tickTimer(dt){ if(!S.timerOn||S.paused||S.over) return; const prev=timeLeft; timeLeft-=dt; drawClock();
  if(Math.floor(prev)!==Math.floor(timeLeft)&&timeLeft<60&&timeLeft>0) AUDIO.tick();
  const pm=parkMin(); for(const e of EVENTS){ if(!e.done&&pm>=e.at){ e.done=true; e.fn(); } }
  if(timeLeft<=0){ timeLeft=0; gameOver(); } }
function gameOver(){ if(S.over) return; S.over=true; P.free=false; AUDIO.stopMusic(); $('#hud').classList.remove('on');
  AUDIO.noise(2.4,.25,0,260); setTimeout(()=>AUDIO.noise(.25,.4,0,180),2300);
  $('#overT').textContent='운행이 종료되었습니다'; $('#overP').innerHTML='새벽 3시. 마지막 불이 꺼지고 셔터가 내려왔다.<br>루나랜드는 오늘도 손님 한 명을 남겼다.'; ov('#over',true); }
function gameClear(text){ if(S.over) return; S.over=true; P.free=false; AUDIO.stopMusic(); $('#hud').classList.remove('on'); AUDIO.ok();
  $('#clearP').innerHTML=(text||'정문 너머로 첫차 소리가 들린다.')+`<br>공원 시각 ${hhmm(parkMin())} · 걸린 시간 ${fmt(TIMER_SEC-timeLeft)}`; ov('#clear',true); }
$('#overRe').onclick=()=>location.reload(); $('#clearRe').onclick=()=>location.reload();
function togglePause(){ if(S.phase!=='play'||S.over) return; S.paused=!S.paused; ov('#pause',S.paused); }
$('#pauseBtn').addEventListener('pointerdown',e=>{ e.stopPropagation(); togglePause(); });
$('#resume').onclick=()=>togglePause(); $('#restart').onclick=()=>location.reload();

/* 시간 카드 : 화면 위아래 검은 띠 + 큰 시각 */
function card(time,title,sub='',cls='',ms=3600){ return new Promise(res=>{ const c=$('#card'); c.className=cls; c.querySelector('.time').textContent=time;
  c.querySelector('.title').textContent=title; c.querySelector('.sub').textContent=sub; void c.offsetWidth; c.classList.add('on');
  setTimeout(()=>{ c.classList.remove('on'); setTimeout(res,800); },ms); }); }
/* 안내 방송 : 상단 배너, 차임 후 한 글자씩 */
function announce(text,{broken=false,ms}={}){ return new Promise(res=>{ const el=$('#pa'), t=el.querySelector('.txt'); el.classList.toggle('broken',broken); AUDIO.chime(broken);
  t.textContent=''; el.classList.add('on'); let k=0; const iv=setInterval(()=>{ k++; t.textContent=text.slice(0,k); if(k>=text.length){ clearInterval(iv);
    setTimeout(()=>{ el.classList.remove('on'); setTimeout(res,400); },ms||Math.max(2600,text.length*60)); } },broken?70:40); }); }

/* 사건표 : at = 공원 시각(분, 자정 이후는 24*60+) */
const EVENTS=[
  {at:20*60, fn:()=>announce('잠시 후 8시, 서커스 텐트에서 야간 특별 공연이 시작됩니다. 많은 관람 바랍니다.')},
  {at:21*60+30, fn:()=>announce('손님 여러분께 안내 말씀 드립니다. 오늘 루나랜드는 밤 10시에 폐장합니다.')},
  {at:22*60, fn:closingTime},
  {at:24*60, fn:midnight},
  {at:24*60+120, fn:async()=>{ await card('02:00','새벽 2시','해가 뜨기 전에 나가야 한다','dead',3000); objective('새벽 3시 전에 공원을 빠져나가자'); }},
];
async function closingTime(){ S.closed=true; await announce('오늘 루나랜드를 찾아주셔서 감사합니다. 모든 놀이기구의 운행을 종료합니다. 출구는 정문입니다. 안녕히 돌아가십시오.',{ms:3200});
  AUDIO.stopMusic(); setLightsClosed(); AUDIO.noise(.6,.3,0,200);
  await card('22:00','폐장','정문 쪽 불이 꺼졌다','close');
  await mono(['…방송이 끝나자마자 불이 한꺼번에 꺼졌다.','정문으로 가 보자. 아직 열려 있겠지.']); objective('정문으로 돌아가 보자'); }
async function midnight(){ document.body.classList.add('midnight'); AUDIO.music('dead'); S.ridesGhost=true;
  await card('00:00','자정','아무도 없는데, 회전목마가 다시 돈다','dead');
  await announce('…손님 여러분… 아직… 공원에 남아 계신 분은… 회전목마 앞으로…',{broken:true,ms:3400});
  AUDIO.stopMusic(); setTimeout(()=>{ if(!S.over) AUDIO.music('dead'); },6000); }

/* 카메라 연출 */
let camAnim=null;
function camTo(to,dur){ return new Promise(res=>{ camAnim={from:{x:P.x,z:P.z,y:P.y,yaw:P.yaw,pitch:P.pitch},to,t:0,dur,res}; }); }
function tickCam(dt){ if(!camAnim) return; camAnim.t+=dt; const k=Math.min(1,camAnim.t/camAnim.dur), e=k<.5?2*k*k:-1+(4-2*k)*k; const f=camAnim.from,t=camAnim.to;
  P.x=lerp(f.x,t.x??f.x,e); P.z=lerp(f.z,t.z??f.z,e); P.y=lerp(f.y,t.y??f.y,e); P.yaw=lerp(f.yaw,t.yaw??f.yaw,e); P.pitch=lerp(f.pitch,t.pitch??f.pitch,e);
  if(k>=1){ const r=camAnim.res; camAnim=null; r(); } }

/* GLB 로더 */
function b64buf(b){ const s=atob(b), a=new Uint8Array(s.length); for(let i=0;i<s.length;i++) a[i]=s.charCodeAt(i); return a.buffer; }
const gltfLoader=new THREE.GLTFLoader();
// 빌드본(dist/lunaland.html)은 window.ASSETS 에 base64 로 들어 있고, 개발 중에는 assets/ 폴더에서 읽는다
const INLINE=typeof ASSETS!=='undefined';
async function glbBuffer(key){ if(INLINE) return b64buf(ASSETS[key]); const r=await fetch('assets/'+key+'.glb'); if(!r.ok) throw new Error(key+'.glb '+r.status); return r.arrayBuffer(); }
async function loadGLB(key){ const buf=await glbBuffer(key); return new Promise((res,rej)=>gltfLoader.parse(buf,'',g=>{ g.scene.userData.animations=g.animations||[]; res(g.scene); },e=>rej(e))); }
function loadImg(key){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>rej(new Error(key+'.jpg')); im.src=INLINE?'data:image/jpeg;base64,'+ASSETS[key]:'assets/'+key+'.jpg'; }); }

/* 점프 · 중력 */
function jump(){ if(!P.free||S.busy||!P.grounded) return; P.vy=4.6; P.grounded=false; }
$('#jumpBtn').addEventListener('pointerdown',e=>{ e.stopPropagation(); AUDIO.init(); jump(); });
function tickJump(dt){ if(!P.free||camAnim) return; const fy=floorAt(P.x,P.z);
  if(!P.grounded||P.y>fy+0.45){ P.vy-=14*dt; P.y+=P.vy*dt; if(P.y<=fy){ P.y=fy; P.vy=0; P.grounded=true; } else P.grounded=false; }
  else P.y=lerp(P.y,fy,1-Math.pow(0.0005,dt)); }   // 계단·단상은 부드럽게 올라섬

/* 조명 컬링 : 가까운 점광원 N개만 (개수를 고정해서 셰이더 재컴파일 방지) */
let lightT=0; const MAX_LIGHTS=IS_TOUCH?6:12;
function tickLights(dt){ lightT+=dt; if(lightT<0.3) return; lightT=0; const px=camera.position.x,pz=camera.position.z;
  LIGHTS.forEach(o=>{ o.d=Math.hypot(o.l.position.x-px,o.l.position.z-pz)-(o.far||0); }); LIGHTS.sort((a,b)=>a.d-b.d);
  let n=0; LIGHTS.forEach(o=>{ const on=!o.off&&n<MAX_LIGHTS; o.l.visible=on; if(on) n++; }); }
/* 22:00 폐장 : 가로등 절반·전구 대부분이 꺼진다 (손전등이 필요해진다) */
function setLightsClosed(){ LIGHTS.forEach((o,i)=>{ if(o.keep) return; if(i%2===0||o.flicker!==undefined) o.off=true; });
  PARK.bulbs.forEach(m=>m.userData.dim=0.06); if(PARK.scrawl) PARK.scrawl.visible=true; lightT=1; }

/* 손전등 */
const torch=new THREE.SpotLight(0xfff2dc,0,28,0.42,0.45,1.4); torch.position.set(0,0,0); camera.add(torch); torch.target.position.set(0,0,-1); camera.add(torch.target); scene.add(camera);
function toggleLight(){ S.torch=!S.torch; torch.intensity=S.torch?1.6:0; AUDIO.click(); $('#lightBtn').style.borderColor=S.torch?'var(--amber)':''; }
$('#lightBtn').addEventListener('pointerdown',e=>{ e.stopPropagation(); AUDIO.init(); toggleLight(); });

/* ============================================================
   PARK : Blender 맵 읽기
   ============================================================ */
// 간판 글씨 (Blender 의 SIGN_<key> 위치에 붙는다)
const SIGNS={
  main:['LUNA LAND','루 나 랜 드','#e8dcc0','#8e231c'], ticket_l:['매표소  TICKETS','','#2a2a2a','#e8dcc0'], ticket_r:['매표소  TICKETS','','#2a2a2a','#e8dcc0'],
  shop_0:['기념품 가게','SOUVENIR','#f0e6d0','#8e231c'], shop_1:['솜사탕','COTTON CANDY','#f3e9ef','#a0405a'], shop_2:['사진관','PHOTO','#1d2a36','#e8dcc0'],
  shop_3:['분실물 센터','LOST & FOUND','#e8dcc0','#2a2a2a'], shop_4:['츄러스','CHURROS','#3a2416','#f0c27a'], shop_5:['인형 뽑기','CLAW MACHINE','#f0e6d0','#2f4f7a'],
  carousel:['회전목마','CAROUSEL','#e8dcc0','#8e231c'], circus:['서커스','매일 밤 8시 공연','#1b1b1b','#e3b54a'], wheel:['관람차','MOON WHEEL','#e8dcc0','#2f4f7a'],
  coaster:['롤러코스터','키 120cm 이상 탑승','#8e231c','#f2ede2'], haunted:['유령의 집','들어간 사람은 있어도…','#151515','#b8b0a0'],
  game_0:['오리 낚시','','#8e231c','#f2ede2'], game_1:['사 격','','#2f4f7a','#f2ede2'], game_2:['고리 던지기','','#2f6a4a','#f2ede2'],
  food_8:['핫도그','','#f0e6d0','#8e231c'], food_15:['음료','','#f0e6d0','#2f4f7a'], tower:['자이로드롭','','#e8dcc0','#8e231c'], bumper:['범퍼카','BUMPER CARS','#e3b54a','#1b1b1b'],
  shed:['창고','','#d8d2c2','#2a2a2a'], staff:['관계자 외 출입금지','STAFF ONLY','#e8dcc0','#8e231c'], office:['관리동','통제실 2F','#d8d2c2','#2a2a2a'], exit:['비상구','','#1f6a3a','#f2ede2']
};
// 잠긴 문 (Blender COL_GATE_<key>) — 방에서 openGate(key) 로 연다
const GATES={coaster:'롤러코스터 탑승구', haunted:'유령의 집 문', staff:'관계자 출입문', office:'관리동 문', exit:'비상구'};
function openGate(k){ S.flags['open_'+k]=true; }
const PARK={mats:[],zones:[],anim:{},gondolas:[],bulbs:[],spawn:{x:0,z:60,yaw:0},bounds:{x1:-58,x2:58,z1:-58,z2:56}};

async function buildPark(){
  const root=await loadGLB('park'); WORLD.add(root); root.updateMatrixWorld(true);
  const kill=[], bb=new THREE.Box3(), v=new THREE.Vector3(), q=new THREE.Quaternion();
  const mats=new Set();
  root.traverse(o=>{ const n=o.name||'';
    if(/^COLC_/.test(n)){ bb.setFromObject(o); CIRC.push({x:(bb.min.x+bb.max.x)/2,z:(bb.min.z+bb.max.z)/2,r:(bb.max.x-bb.min.x)/2}); kill.push(o); return; }
    if(/^COL_/.test(n)){ bb.setFromObject(o); const gm=n.match(/^COL_GATE_([a-z]+)/); const k=gm&&gm[1];
      addBox(bb.min.x,bb.min.z,bb.max.x,bb.max.z,k?()=>!S.flags['open_'+k]:undefined);
      if(k){ const pk=new THREE.Mesh(new THREE.BoxGeometry(bb.max.x-bb.min.x+.2,2.4,bb.max.z-bb.min.z+.2),PICK); bb.getCenter(v); pk.position.set(v.x,1.2,v.z); WORLD.add(pk);
        INTER.push({mesh:pk,name:GATES[k]||k,range:3.2,fn:()=>gateTap(k),enabled:()=>!S.flags['open_'+k]}); }
      kill.push(o); return; }
    if(/^FLOOR_/.test(n)){ bb.setFromObject(o); const f={x1:bb.min.x,x2:bb.max.x,z1:bb.min.z,z2:bb.max.z,y:bb.max.y};
      FLOORS.push({test:(x,z)=>x>f.x1&&x<f.x2&&z>f.z1&&z<f.z2,y:()=>f.y}); kill.push(o); return; }
    if(/^(LAMP|LIGHT)_/.test(n)){ const u=o.userData; const l=regLight(new THREE.PointLight(new THREE.Color(u.color||'#ffb46b'),u.i||1,u.d||14,1.6)); o.getWorldPosition(l.position); scene.add(l);
      const e=LIGHTS[LIGHTS.length-1]; if(n.startsWith('LAMP_')&&Math.random()<.22) e.flicker=Math.random()*10; if((u.d||0)>30) e.far=30; return; }
    if(/^SIGN_/.test(n)){ const k=n.slice(5), u=o.userData, s=SIGNS[k]; if(k==='map') return addMapBoard(o,u); if(!s) return;
      const tex=TEX.sign(s.slice(0,2).filter(Boolean),s[2],s[3],1024,Math.round(1024*u.h/u.w)||256);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(u.w,u.h),new THREE.MeshStandardMaterial({map:tex,roughness:.8,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.08}));
      o.getWorldPosition(m.position); o.getWorldQuaternion(m.quaternion); m.translateZ(0.04); WORLD.add(m); return; }
    if(/^ZONE_/.test(n)){ o.getWorldPosition(v); PARK.zones.push({id:n.slice(5),title:o.userData.title||n,r:o.userData.r||8,x:v.x,z:v.z}); return; }
    if(n==='SPAWN'){ o.getWorldPosition(v); PARK.spawn={x:v.x,z:v.z,yaw:0}; return; }
    if(/^ANIM_/.test(n)) PARK.anim[n.slice(5)]=o;
    if(/^GONDOLA_/.test(n)) PARK.gondolas.push(o);
    if(o.isMesh){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m)); }
  });
  kill.forEach(o=>o.parent&&o.parent.remove(o));
  // 재질 손보기 : Blender 속성(tint, glow) 반영
  mats.forEach(m=>{ const u=m.userData||{};
    if(u.tint) m.color.set(u.tint).convertSRGBToLinear();
    if(u.glow){ m.emissiveIntensity=u.glow; if(/bulb/.test(m.name)) PARK.bulbs.push(m); }
    ['map','normalMap','roughnessMap'].forEach(k=>{ if(m[k]) m[k].anisotropy=8; });
    m.envMapIntensity=0.55; PARK.mats.push(m); });
  // 낙서 한 줄 (정문 안쪽 담)
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.65),new THREE.MeshBasicMaterial({map:TEX.scrawl('돌아가'),transparent:true,depthWrite:false}));
  sc.position.set(-14,1.7,55.7); sc.rotation.y=Math.PI; sc.visible=false; PARK.scrawl=sc; WORLD.add(sc);   // 폐장 후에만 보인다
}
const PICK=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}); // 보이지 않는 탭 판정용

async function gateTap(k){ AUDIO.click(); AUDIO.noise(.3,.25,0,400); await mono(['…잠겨 있다.']); }

/* 공원 지도 (안내판 + M 키) */
function drawMap(g,W,H,me){
  const B=PARK.bounds, pad=60, sx=(W-pad*2)/(B.x2-B.x1), sz=(H-pad*2)/(B.z2-B.z1), s=Math.min(sx,sz);
  const X=x=>pad+(x-B.x1)*s, Y=z=>pad+(z-B.z1)*s;
  g.fillStyle='#ece5d3'; g.fillRect(0,0,W,H); g.strokeStyle='#2a2a2a'; g.lineWidth=3; g.strokeRect(X(B.x1),Y(B.z1),(B.x2-B.x1)*s,(B.z2-B.z1)*s);
  g.fillStyle='#ece5d3'; g.fillRect(X(-7.5),Y(B.z2)-4,15*s,8);
  g.fillStyle='#8e231c'; g.font=`900 ${W*.05}px "Malgun Gothic",sans-serif`; g.textAlign='left'; g.textBaseline='top'; g.fillText('LUNA LAND',pad,14*W/1000);
  g.font=`500 ${W*.018}px "Malgun Gothic",sans-serif`; g.fillStyle='#555'; g.textAlign='right'; g.fillText('↑ 북',W-pad,24*W/1000);
  PARK.zones.forEach((z,i)=>{ g.fillStyle='rgba(142,35,28,.12)'; g.beginPath(); g.arc(X(z.x),Y(z.z),z.r*s,0,7); g.fill();
    g.fillStyle='#8e231c'; g.beginPath(); g.arc(X(z.x),Y(z.z),W*.008,0,7); g.fill();
    g.fillStyle='#1a1a1a'; g.font=`700 ${W*.022}px "Malgun Gothic",sans-serif`; g.textAlign='center'; g.textBaseline='top'; g.fillText(z.title,X(z.x),Y(z.z)+W*.012); });
  if(me){ g.save(); g.translate(X(P.x),Y(P.z)); g.rotate(-P.yaw); g.fillStyle='#1f6a3a'; g.beginPath(); g.moveTo(0,-W*.022); g.lineTo(W*.013,W*.014); g.lineTo(-W*.013,W*.014); g.fill(); g.restore();
    g.fillStyle='#1f6a3a'; g.font=`700 ${W*.018}px "Malgun Gothic",sans-serif`; g.textAlign='center'; g.fillText('현재 위치',X(P.x),Y(P.z)+W*.024); } }
function addMapBoard(o,u){ const tex=cvs(1024,512,(g,w,h)=>{ g.save(); g.scale(1,.5); drawMap(g,1024,1024,false); g.restore(); grime(g,w,h,.12); });
  const m=new THREE.Mesh(new THREE.PlaneGeometry(u.w,u.h),new THREE.MeshStandardMaterial({map:tex,roughness:.7,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.1}));
  o.getWorldPosition(m.position); o.getWorldQuaternion(m.quaternion); m.translateZ(0.04); WORLD.add(m);
  INTER.push({mesh:m,name:'공원 안내도',range:3,fn:()=>{ AUDIO.click(); toggleMap(true); }}); }
function toggleMap(force){ const on=force??!$('#map').classList.contains('on'); if(on){ $('#mapTime').textContent=hhmm(parkMin(),true).join(' '); const c=$('#mapcv'); drawMap(c.getContext('2d'),c.width,c.height,true); } ov('#map',on); }
$('#mapBtn').addEventListener('pointerdown',e=>{ e.stopPropagation(); toggleMap(); });

/* ============================================================
   하늘 · 분위기 : 공원 시각에 따라 노을 → 푸른 저녁 → 밤 → 심야
   - 하늘은 셰이더 돔(그라데이션 + 해 + 별 + 달), HDRI 는 반사광(environment)으로만 쓴다
   - SKY_KEYS 의 값을 시각 사이에서 보간한다 (색은 화면 색 그대로 = sRGB)
   ============================================================ */
const SKY_KEYS=[
 // 시각       하늘 위     중간       지평선     안개색     안개   노출  반구광 해   별   해높이 반사광(env)
 {m:19*60,    top:'#2b2a5a',mid:'#a24f7c',hor:'#ff9a5a',fog:'#5a4058',fd:.010,ex:1.30,hemi:.75,sun:1.0,star:0,  sy:.06,env:.75},
 {m:19*60+50, top:'#141a40',mid:'#40407a',hor:'#b0607a',fog:'#2e2a44',fd:.014,ex:1.15,hemi:.50,sun:.25,star:.35,sy:-.04,env:.55},
 {m:21*60,    top:'#05070f',mid:'#0e1528',hor:'#3a2f48',fog:'#16192a',fd:.018,ex:1.05,hemi:.34,sun:0,  star:1,  sy:-.2,env:.42},
 {m:22*60+10, top:'#040509',mid:'#0a0f1c',hor:'#1c1d2a',fog:'#11141d',fd:.022,ex:1.00,hemi:.30,sun:0,  star:1,  sy:-.3,env:.32},
 {m:24*60,    top:'#020306',mid:'#06080f',hor:'#120f16',fog:'#0b0b10',fd:.030,ex:.95, hemi:.24,sun:0,  star:1,  sy:-.4,env:.18},
 {m:27*60,    top:'#020205',mid:'#05060b',hor:'#0e0b10',fog:'#08080b',fd:.036,ex:.92, hemi:.20,sun:0,  star:.8, sy:-.4,env:.14},
];
const SKY={};
function buildSkyDome(){
  const u={top:{value:new THREE.Color()},mid:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3()},
           sunAmt:{value:1},starAmt:{value:0},moonDir:{value:new THREE.Vector3(-.45,.55,-.7).normalize()},t:{value:0}};
  const mat=new THREE.ShaderMaterial({uniforms:u,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vD; void main(){ vD=normalize(position); vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; gl_Position.z=gl_Position.w*.9999; }`,
    fragmentShader:`uniform vec3 top,mid,hor,sunDir,moonDir; uniform float sunAmt,starAmt,t; varying vec3 vD;
      float h3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      void main(){ vec3 d=normalize(vD); float y=d.y;
        vec3 c=mix(hor,mid,smoothstep(-.02,.22,y)); c=mix(c,top,smoothstep(.18,.85,y)); c=mix(c,hor*.55,smoothstep(0.,-.25,y));
        float s=max(dot(d,normalize(sunDir)),0.); c+=vec3(1.,.62,.36)*(pow(s,6.)*.35+pow(s,64.)*.6+smoothstep(.9994,.9997,s)*1.2)*sunAmt;
        vec3 g=floor(d*380.); float st=step(.9975,h3(g)); float tw=.6+.4*sin(t*3.+h3(g+1.)*40.);
        c+=vec3(.85,.9,1.)*st*tw*starAmt*smoothstep(.06,.35,y);
        float m=dot(d,moonDir); c+=vec3(.9,.92,1.)*smoothstep(.99955,.9997,m)*starAmt + vec3(.25,.3,.45)*pow(max(m,0.),180.)*starAmt*.5;
        gl_FragColor=vec4(c,1.); }`});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(230,32,16),mat); dome.renderOrder=-1; dome.frustumCulled=false; scene.add(dome);
  SKY.u=u; SKY.dome=dome; }
async function buildSky(){ const im=await loadImg('sky'); const t=new THREE.Texture(im); t.encoding=THREE.sRGBEncoding; t.mapping=THREE.EquirectangularReflectionMapping; t.needsUpdate=true;
  const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromEquirectangular(t).texture; pm.dispose(); scene.background=null;
  buildSkyDome();
  SKY.hemi=new THREE.HemisphereLight(0x8a9ab8,0x1a1612,0.32); scene.add(SKY.hemi);
  SKY.moon=new THREE.DirectionalLight(0xa9bce0,0.38); SKY.moon.position.set(-30,40,-60); scene.add(SKY.moon);
  SKY.sun=new THREE.DirectionalLight(0xff9a5a,0); SKY.sun.position.set(60,8,30); scene.add(SKY.sun);   // 해 질 녘 서쪽 빛
  tickSky(0,true); }
const _c1=new THREE.Color(),_c2=new THREE.Color(); let skyT=0;
function tickSky(dt,force){ if(!SKY.u) return; SKY.u.t.value+=dt; skyT+=dt; if(!force&&skyT<0.2) return; skyT=0;
  const m=parkMin(); let i=0; while(i<SKY_KEYS.length-2&&m>SKY_KEYS[i+1].m) i++; const a=SKY_KEYS[i],b=SKY_KEYS[i+1]; const k=clamp((m-a.m)/(b.m-a.m),0,1);
  const col=(key,out)=>out.set(a[key]).lerp(_c2.set(b[key]),k), num=key=>lerp(a[key],b[key],k);
  col('top',SKY.u.top.value); col('mid',SKY.u.mid.value); col('hor',SKY.u.hor.value);
  const sy=num('sy'); SKY.u.sunDir.value.set(.85,sy,.5).normalize(); SKY.u.sunAmt.value=num('sun'); SKY.u.starAmt.value=num('star');
  col('fog',_c1); scene.fog.color.copy(_c1).convertSRGBToLinear(); scene.fog.density=num('fd'); renderer.toneMappingExposure=DBG.bright?2.6:num('ex');
  SKY.hemi.intensity=num('hemi'); const env=num('env'); PARK.mats.forEach(m=>m.envMapIntensity=env); SKY.sun.intensity=num('sun')*0.9; SKY.moon.intensity=0.18+num('star')*0.22; }

/* 구역 : 처음 들어가면 이름 표시 */
let zoneT=0, curZone=null;
function tickZones(dt){ zoneT+=dt; if(zoneT<0.25) return; zoneT=0; let z=null;
  for(const q of PARK.zones){ if(Math.hypot(P.x-q.x,P.z-q.z)<q.r){ z=q; break; } }
  if(z!==curZone){ curZone=z; $('#zone').textContent=z?z.title:''; $('#zone').classList.toggle('on',!!z); if(z&&!S.flags['seen_'+z.id]){ S.flags['seen_'+z.id]=true; toast(z.title); } } }

/* ============================================================
   ROOMS : 방(퍼즐)을 하나씩 붙이는 자리
   ROOMS.push({ id:'haunted', async build(){…INTER.push(…)}, tick(dt){…} })
   - 구역 위치 : PARK.zones.find(z=>z.id==='haunted')
   - 잠긴 문 열기 : openGate('haunted')  (Blender 의 COL_GATE_haunted)
   ============================================================ */
const ROOMS=[];

/* ---------------- 시작 ---------------- */
async function intro(){
  const sp=PARK.spawn; P.x=sp.x; P.z=sp.z; P.y=0; P.yaw=sp.yaw; P.pitch=0.12; P.free=false;
  $('#hud').classList.add('on'); if(IS_TOUCH){ $('#jumpBtn').classList.add('on'); stickEl.classList.add('on'); } $('#lightBtn').classList.add('on');
  objective('…'); AUDIO.music('open'); await sleep(300); $('#fade').classList.add('clear');
  await card('19:00','야간 개장','루나랜드 · 해 질 녘','dusk',3200);
  await mono(['…늦지 않았다. 7시 정각.','야간 개장 마지막 날이라더니, 생각보다 사람이 없네.','폐장은 밤 10시. 그 전에 한 바퀴 돌아보자.']);
  P.free=true; S.phase='play'; startTimer(); objective('공원 안으로 들어가 둘러보자 (폐장 22:00)');
  $('#hint').textContent=IS_TOUCH?'왼쪽 끌기 이동 · 오른쪽 끌기 시점 · 물체 탭 조사':'WASD 이동 · Shift 달리기 · 마우스 끌기 시점 · E 조사 · F 손전등 · M 지도';
  setTimeout(()=>$('#hint').textContent='',12000);
}

/* ---------------- 메인 루프 ---------------- */
let last=performance.now(),fpsN=0,fpsT=0,fps=0;
function frame(now){ requestAnimationFrame(frame); const dtReal=Math.min(1,(now-last)/1000); const dt=Math.min(0.1,dtReal); last=now; S.t+=dt;
  if(S.paused) return;
  if(S.over){ S.overT=(S.overT||0)+dtReal; if(S.overT>3) return; }   // 끝 화면이 덮이면 3D 렌더 중지
  tickCam(dtReal); tickTimer(dtReal);
  if(P.free&&!S.busy&&!camAnim){ let fx=0,fz=0; if(keys.KeyW||keys.ArrowUp) fz+=1; if(keys.KeyS||keys.ArrowDown) fz-=1; if(keys.KeyA||keys.ArrowLeft) fx-=1; if(keys.KeyD||keys.ArrowRight) fx+=1;
    if(stick.id!==null){ fx+=stick.dx; fz-=stick.dy; } const m=Math.hypot(fx,fz); if(m>1){ fx/=m; fz/=m; }
    const sp=P.speed*(keys.ShiftLeft||keys.ShiftRight||m>0.95&&stick.id!==null?1.6:1); const s=Math.sin(P.yaw),c=Math.cos(P.yaw); // 전방 = (-sin yaw, -cos yaw)
    const vx=(-s*fz + c*fx)*sp, vz=(-c*fz - s*fx)*sp; P.vx=lerp(P.vx,vx,1-Math.pow(0.001,dt)); P.vz=lerp(P.vz,vz,1-Math.pow(0.001,dt)); move(P.vx*dt,P.vz*dt);
    const sp2=Math.hypot(P.vx,P.vz); P.bob=(P.bob||0)+sp2*dt*7; P.bobA=lerp(P.bobA||0,sp2>0.3?0.025:0,0.1); }
  tickJump(dt);
  const eyeY=P.free&&P.grounded?P.eye+Math.sin(P.bob||0)*(P.bobA||0):P.eye;
  camera.position.set(P.x,P.y+eyeY,P.z); camera.rotation.order='YXZ'; camera.rotation.set(P.pitch,P.yaw,0);
  tickLights(dt); tickZones(dt);
  // 놀이기구 : 아주 느리게 돈다
  // 놀이기구 : 운영 중엔 돌고, 폐장하면 서서히 멈추고, 자정엔 회전목마만 혼자 돈다
  const A=PARK.anim, tgtC=S.ridesGhost?0.25:S.closed?0:0.55, tgtW=S.closed?0:0.06;
  S.rC=lerp(S.rC??tgtC,tgtC,1-Math.pow(0.6,dt)); S.rW=lerp(S.rW??tgtW,tgtW,1-Math.pow(0.7,dt));
  if(A.carousel) A.carousel.rotation.y+=dt*S.rC; if(A.wheel){ A.wheel.rotation.z+=dt*S.rW; PARK.gondolas.forEach(g=>g.rotation.z=-A.wheel.rotation.z); }
  tickSky(dt);
  // 깜빡이는 가로등 · 전구
  LIGHTS.forEach(o=>{ if(o.flicker!==undefined) o.l.intensity=o.base*((Math.sin(S.t*17+o.flicker)>0.7||Math.random()<.02)?0.15:1); });
  const bk=0.85+0.15*Math.sin(S.t*1.3); PARK.bulbs.forEach(m=>m.emissiveIntensity=(m.userData.glow||1)*(m.userData.dim??1)*bk*(Math.random()<(S.closed?.03:.004)?.2:1));
  // 조사 대상
  if(P.free&&!S.busy){ const it=pick(0,0); if(it!==hot){ hot=it; $('#label').textContent=it?it.name:''; $('#label').classList.toggle('on',!!it); $('#cross').classList.toggle('hot',!!it); $('#interact').classList.toggle('on',!!it); } }
  else if(hot){ hot=null; $('#label').classList.remove('on'); $('#cross').classList.remove('hot'); $('#interact').classList.remove('on'); }
  ROOMS.forEach(r=>r.tick&&r.tick(dt));
  renderer.render(scene,camera);
  fpsN++; fpsT+=dt; if(fpsT>1){ fps=Math.round(fpsN/fpsT); fpsN=0; fpsT=0; if(DBG.on) $('#dbg').textContent=`fps ${fps}  x ${P.x.toFixed(1)} z ${P.z.toFixed(1)} yaw ${P.yaw.toFixed(2)}  calls ${renderer.info.render.calls} tris ${renderer.info.render.triangles}\nzone ${curZone?curZone.id:'-'}  flags ${Object.keys(S.flags).filter(k=>!k.startsWith('seen_')).join(',')}`; } }

/* 제작용 디버그 : Shift+D 정보 · Shift+1~0 구역 이동 · Shift+G 모든 문 열기 · Shift+N 밝게 보기 · Shift+T 공원 시간 +1시간 */
const DBG={on:false};
function dbgKey(e){ if(!e.shiftKey) return;
  if(e.code==='KeyD'){ DBG.on=!DBG.on; $('#dbg').style.display=DBG.on?'block':'none'; }
  if(e.code==='KeyG'){ Object.keys(GATES).forEach(openGate); toast('모든 문 열림 (디버그)'); }
  if(e.code==='KeyN'){ DBG.bright=!DBG.bright; tickSky(0,true); }
  if(e.code==='KeyT'){ timeLeft=Math.max(1,timeLeft-300); toast('공원 시간 +1시간 (디버그)'); tickSky(0,true); }
  const d=(e.code.match(/Digit(\d)/)||[])[1]; if(d===undefined) return; const z=PARK.zones[(+d+9)%10]; if(!z) return;
  P.x=z.x; P.z=z.z; P.y=floorAt(z.x,z.z); P.vx=P.vz=0; toast(z.title); }

/* 불러오기 : 입장권이 발권기에서 조금씩 나온다 */
function loadStep(pct,msg){ $('.paper').style.height=Math.round(150*pct/100)+'px'; $('#lpct').textContent=pct+'%'; if(msg) $('#lmsg').textContent=msg; }
/* 시작 화면 : 관람차 살 · 전구 */
(function decorateTitle(){ const sp=$('#spokes'), wb=$('#wbulbs'), NS='http://www.w3.org/2000/svg';
  for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, l=document.createElementNS(NS,'line'); l.setAttribute('x1',0); l.setAttribute('y1',0); l.setAttribute('x2',Math.cos(a)*190); l.setAttribute('y2',Math.sin(a)*190); sp.appendChild(l); }
  for(let i=0;i<32;i++){ const a=i/32*Math.PI*2, c=document.createElementNS(NS,'circle'); c.setAttribute('cx',Math.cos(a)*190); c.setAttribute('cy',Math.sin(a)*190); c.setAttribute('r',5);
    c.style.animationDelay=(i%4)*0.6+'s'; wb.appendChild(c); }
  $('#guide').innerHTML=IS_TOUCH?'왼쪽 끌기 이동 · 오른쪽 끌기 시점 · 물체 탭 조사<br>새벽 3시가 되면 공원이 닫힙니다.':'이용 안내 · WASD 이동 · 마우스 끌기 시점 · E 조사 · F 손전등 · M 지도 · Esc 정지<br>공원 시간은 실제 1분에 12분씩 흐릅니다. 새벽 3시가 되면 공원이 닫힙니다.'; })();

async function boot(){ try{
    loadStep(8,'공원 불을 켜는 중…'); await buildSky(); loadStep(30,'놀이기구 점검 중…'); await sleep(30);
    await buildPark(); loadStep(85,'매표소 문 여는 중…');
    for(const r of ROOMS) if(r.build) await r.build();
    PARK.zones.sort((a,b)=>b.z-a.z);   // 남쪽(정문) → 북쪽 순서 = 디버그 단축키 순서
    loadStep(100,'발권 완료'); camera.position.set(PARK.spawn.x,1.6,PARK.spawn.z); renderer.compile(scene,camera); await sleep(500);
    $('#loading').style.transition='opacity .6s'; $('#loading').style.opacity=0; await sleep(600); $('#loading').style.display='none';
  }catch(e){ console.error(e); $('#lmsg').textContent='불러오기 실패 : '+e.message+(location.protocol==='file:'&&!INLINE?' (개발 버전은 로컬 서버로 열어야 합니다 — README 참고)':''); } }
$('#startBtn').onclick=async()=>{ if(S.phase!=='title') return; S.phase='intro'; AUDIO.init(); if(AUDIO.ctx&&AUDIO.ctx.state==='suspended') AUDIO.ctx.resume();
  $('#startBtn').classList.add('torn'); AUDIO.noise(.25,.3,0,2400); await sleep(700);
  $('#fade').classList.remove('clear'); await sleep(900); AUDIO.wind(); ov('#start',false); S.busy=false; intro(); };
boot(); requestAnimationFrame(frame);
