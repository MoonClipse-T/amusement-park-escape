/* ============================================================
   루나랜드 — 야간 알바 스릴러 방탈출 (중1 과학 '힘의 작용')
   three.js r128 · 터치/키보드 겸용 · 1인칭
   파일 : game.js(엔진) → crowd.js(손님 NPC) → story.js(인트로·시간 사건) → rooms/*.js(방) → main.js(시작)
   시간 : 인트로 19:00~22:00 은 이야기로 진행(타이머 없음), 22:00 부터 실제 40분 = 공원 8시간 (06:00 까지)
   맵은 blender/build_lunaland_v2.py 에서 만들고, 이름 규칙(COL_/FLOOR_/SIGN_/ZONE_/IT_/SPAWN_…)으로 엔진이 읽는다.
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
 // 문이 쾅 닫힘 : 낮은 쿵(나무 문짝) + 짧은 울림 + 걸쇠 찰칵
 slam(){ const c=this.ctx; if(!c) return; this.noise(.35,.9,0,160); this.noise(.12,.5,0,900); this.tone(62,.5,'sine',.55,0,-30); this.tone(110,.18,'triangle',.25,0,-50);
   this.noise(.6,.12,.05,400); this.tone(1800,.03,'square',.06,.16); this.tone(1200,.04,'square',.05,.19); },
 // 녹음된 안내 방송 (web/assets/voice/<key>.mp3). broken 이면 느리고 찢어진 스피커 소리. → Promise<길이(초)>
 voice(key,broken,delay=1.3){ const c=this.ctx; if(!c) return Promise.resolve(0);
   const get=INLINE?Promise.resolve(ASSETS[key]?b64buf(ASSETS[key]):null):fetch('assets/voice/'+key+'.mp3').then(r=>r.ok?r.arrayBuffer():null);
   return get.then(b=>b&&c.decodeAudioData(b)).then(buf=>{ if(!buf) return 0; const s=c.createBufferSource(); s.buffer=buf; if(broken) s.playbackRate.value=.9;
     const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=broken?1300:1800; f.Q.value=broken?.9:.35;
     const g=c.createGain(); g.gain.value=broken?1.6:1.25; s.connect(f); f.connect(g); g.connect(c.destination);
     if(broken){ const d=c.createWaveShaper(), cv=new Float32Array(256); for(let i=0;i<256;i++){ const x=i/128-1; cv[i]=Math.tanh(x*4); } d.curve=cv; f.disconnect(); f.connect(d); d.connect(g); }
     s.start(c.currentTime+delay); return buf.duration/(broken?.9:1); }).catch(()=>0); },
 // 녹음된 효과음 (web/assets/sfx/<key>.mp3 — ElevenLabs 로 만든 절구 소리 · 비명 · 웃음). 한 번 읽어 두고 다시 쓴다
 sfxBuf:{}, sfx(key,vol=1,rate=1){ const c=this.ctx; if(!c||(S.gentle&&key==='laugh')) return;      // 비공포 모드 : 웃음소리 없음
   const play=buf=>{ if(!buf) return; const s=c.createBufferSource(); s.buffer=buf; s.playbackRate.value=rate; const g=c.createGain(); g.gain.value=vol; s.connect(g); g.connect(c.destination); s.start(); };
   if(this.sfxBuf[key]) return play(this.sfxBuf[key]);
   const get=INLINE?Promise.resolve(ASSETS['sfx_'+key]?b64buf(ASSETS['sfx_'+key]):null):fetch('assets/sfx/'+key+'.mp3').then(r=>r.ok?r.arrayBuffer():null);
   get.then(b=>b&&c.decodeAudioData(b)).then(buf=>{ this.sfxBuf[key]=buf; play(buf); }).catch(()=>{}); },
 // 걸쇠가 풀림 : 철컥 + 끼익
 unlatch(){ this.tone(1500,.03,'square',.08); this.tone(900,.05,'square',.08,.05); this.noise(.08,.3,0,2500); this.tone(380,.9,'sawtooth',.03,.25,140); },
 // 바람 소리 (계속 재생)
 // 안내 방송 차임 (딩-동-댕-동)
 chime(broken){ [784,659,523,392].forEach((f,i)=>this.tone(broken?f*(0.94+Math.random()*.1):f,.7,'sine',.16,i*.32)); },
 // 회전목마 오르간 (합성 왈츠) : 운영 시간엔 밝게, 자정엔 느리고 어긋나게
 music(mode='open'){ const c=this.ctx; if(!c) return; this.stopMusic(); this.musicMode=mode;
   const mel=[67,71,74,79,78,74,76,72,69,72,76,74,71,67,69,71, 67,71,74,79,81,79,76,72,74,76,72,69,67,66,67,0];
   const bass=[43,50,50, 43,50,50, 45,52,52, 38,50,50, 43,50,50, 43,50,50, 45,52,52, 38,45,45];
   const slow=mode==='dead', beat=slow?0.42:0.24; let i=0;
   const hz=n=>440*Math.pow(2,(n-69)/12)*(slow?(0.97+Math.random()*.02):1);
   const step=()=>{ const m=mel[i%mel.length]; if(m) this.tone(hz(m),beat*1.6,slow?'triangle':'square',slow?.11:.085);
     const b=bass[i%bass.length]; this.tone(hz(b),beat*.9,'triangle',i%3===0?.2:.1); i++;
     if(slow&&Math.random()<.08) i+=Math.floor(Math.random()*3); };
   step(); this.musicTimer=setInterval(step,beat*1000); },
 stopMusic(){ clearInterval(this.musicTimer); this.musicTimer=null; this.musicMode=null; },
 wind(){ const c=this.ctx; if(!c||this.windOn) return; this.windOn=true; const n=c.sampleRate*4, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); let v=0;
   for(let i=0;i<n;i++){ v=v*.995+(Math.random()*2-1)*.05; d[i]=v; } const s=c.createBufferSource(); s.buffer=b; s.loop=true;
   const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=380; f.Q.value=.6; const g=c.createGain(); g.gain.value=.13;
   const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=.07; lg.gain.value=160; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
   s.connect(f); f.connect(g); g.connect(c.destination); s.start(); }
};

/* ---------------- 캔버스 텍스처 ---------------- */
function cvs(w,h,fn){ const k=LITE&&Math.max(w,h)>=512?.5:1, c=document.createElement('canvas'); c.width=w*k; c.height=h*k; const g=c.getContext('2d'); g.scale(k,k); fn(g,w,h,c); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; return t; }      // 태블릿은 절반 크기로 그린다 (그리는 좌표는 그대로)
function grime(g,w,h,a=.18){ for(let k=0;k<w*h/90;k++){ g.fillStyle=`rgba(20,14,8,${Math.random()*a})`; g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3); }
  for(let k=0;k<6;k++){ const x=Math.random()*w; g.fillStyle=`rgba(40,25,10,${a*.6})`; g.fillRect(x,Math.random()*h*.3,1+Math.random()*3,h*(.3+Math.random()*.7)); } }
const TEX={};
TEX.sign=(lines,bg,fg,w=1024,h=256)=>cvs(w,h,(g)=>{ g.fillStyle=bg; g.fillRect(0,0,w,h); g.strokeStyle=fg; g.lineWidth=h*.03; g.strokeRect(h*.06,h*.06,w-h*.12,h-h*.12);
  g.fillStyle=fg; g.textAlign='center'; g.textBaseline='middle'; const n=lines.length;
  lines.forEach((l,i)=>{ const big=i===0; let fs=big?h*(n>1?.42:.56):h*.2; g.font=`${big?900:500} ${fs}px "Malgun Gothic",sans-serif`;
    while(g.measureText(l).width>w*.9&&fs>8){ fs*=.92; g.font=`${big?900:500} ${fs}px "Malgun Gothic",sans-serif`; }
    g.fillText(l,w/2,n>1?(big?h*.42:h*.76):h/2); }); grime(g,w,h); });
// 조작실 벽의 '점검 방법' 포스터 : 남색 머리띠 + 번호 단계 줄 (글은 화면에서 읽는다)
TEX.poster=(title,sub,w=1024,h=1024)=>cvs(w,h,(g)=>{ const F='"Noto Sans KR","Malgun Gothic",sans-serif', C='#1d3557';
  g.fillStyle='#f7f5ef'; g.fillRect(0,0,w,h); g.fillStyle=C; g.fillRect(0,0,w,h*.24); g.fillStyle='#e9b949'; g.fillRect(0,h*.24,w,h*.018);
  g.fillStyle='#fff'; g.textAlign='left'; g.textBaseline='middle'; g.font=`900 ${h*.1}px ${F}`; g.fillText(title,w*.07,h*.1);
  g.font=`700 ${h*.035}px ${F}`; g.fillStyle='rgba(255,255,255,.75)'; g.fillText('INSPECTION CHECKLIST',w*.07,h*.19);
  g.fillStyle='#22252b'; g.font=`800 ${h*.05}px ${F}`; g.fillText(sub,w*.07,h*.33);
  [0,1,2,3].forEach(i=>{ const y=h*(.46+i*.115), last=i===3, col=last?'#c8322a':C;
    g.fillStyle=col; g.beginPath(); g.arc(w*.11,y,h*.035,0,7); g.fill(); g.fillStyle='#fff'; g.font=`900 ${h*.04}px ${F}`; g.textAlign='center'; g.fillText(i+1,w*.11,y+2); g.textAlign='left';
    g.fillStyle=last?'rgba(200,50,42,.55)':'rgba(34,37,43,.32)'; [.62,.45].forEach((l,j)=>{ g.fillRect(w*.18,y-h*.022+j*h*.04,w*l*(1-.12*((i+j)%3)),h*.016); }); });
  g.strokeStyle='#d8d2c2'; g.lineWidth=3; g.beginPath(); g.moveTo(w*.07,h*.93); g.lineTo(w*.93,h*.93); g.stroke();
  g.fillStyle='#7a7d84'; g.font=`600 ${h*.03}px ${F}`; g.fillText('루나랜드 시설관리팀',w*.07,h*.965); grime(g,w,h); });
TEX.scrawl=(text,col='rgba(110,12,10,.9)')=>cvs(1024,384,(g,w,h)=>{ g.fillStyle=col; g.font='900 120px "Malgun Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.save(); g.translate(w/2,h/2); g.rotate(-.05); g.fillText(text,0,0); g.restore();
  for(let k=0;k<22;k++){ const x=w*.15+Math.random()*w*.7,y=h*.55+Math.random()*h*.1; g.fillRect(x,y,3+Math.random()*3,20+Math.random()*90); } });

/* 조작반 화면 : 맵의 화면 자리(IT_…screen, 얇은 상자) 바로 앞에 캔버스 화면을 세운다. toward = 화면이 바라볼 쪽(조작실 안)의 점 → {g, tex, w, h, mesh} */
function screenOn(item,toward,pw=512,ph=288){ const bb=new THREE.Box3().setFromObject(item), c=bb.getCenter(new THREE.Vector3()), s=bb.getSize(new THREE.Vector3());
  const cv=document.createElement('canvas'); cv.width=pw; cv.height=ph; const tex=new THREE.CanvasTexture(cv); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=4;
  const alongX=s.x<s.z, m=new THREE.Mesh(new THREE.PlaneGeometry(alongX?s.z:s.x,s.y),new THREE.MeshBasicMaterial({map:tex}));
  const sg=alongX?Math.sign(toward.x-c.x):Math.sign(toward.z-c.z); m.position.copy(c); if(alongX){ m.position.x+=sg*(s.x/2+.004); m.rotation.y=sg*Math.PI/2; } else { m.position.z+=sg*(s.z/2+.004); m.rotation.y=sg>0?0:Math.PI; }
  WORLD.add(m); return {g:cv.getContext('2d'),tex,w:pw,h:ph,mesh:m}; }

/* ---------------- 엔진 ---------------- */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!IS_TOUCH,powerPreference:'high-performance'});
// 태블릿(터치 · 디벗 갤럭시 탭) : 그래픽 메모리를 줄인다 — 맵 그림 1024 px 211장을 그대로 풀면 1 GB 가까이 되어 4 GB 태블릿에서 탭이 죽고(다시 불러오기) 그림이 하얗게 빈다
//   → GLB 속 그림을 512 × 512 로 줄여서 푼다(UV 는 0~1 이라 비율이 바뀌어도 그대로 입혀진다) · 해상도 배율 1 · PC 는 그대로 (확인용 : ?lite)
const LITE=IS_TOUCH||/[?&]lite/.test(location.search);
if(LITE&&typeof createImageBitmap!=='undefined'){ const cib=createImageBitmap.bind(window);
  window.createImageBitmap=(src,...a)=>src instanceof Blob&&a.length<=1?cib(src,Object.assign({},a[0],{resizeWidth:512,resizeHeight:512,resizeQuality:'medium'})):cib(src,...a); }
renderer.setPixelRatio(Math.min(devicePixelRatio,LITE?1:2)); renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
// 태블릿 GPU(디벗 갤럭시 탭 · Mali) 안전장치 : 손전등(눈 바로 옆의 스포트라이트)이 매끈한 면에 비치면 반사광 계산이 넘쳐(무한대 · NaN)
//   그 빛이 닿는 자리 전체가 하얗게 덮이는 일이 있다 (PC 는 같은 값을 검게 버려서 보이지 않는다)
//   → 반사광 분포 D 를 넘치지 않는 꼴(|N×H|² — 모바일 PBR 에서 쓰는 식, 값은 같다)로 · 한 빛의 반사광 상한 · 마지막 색이 NaN/무한대면 검게. PC 화면은 그대로
(function safeShaders(){ const C=THREE.ShaderChunk, a='float D = D_GGX( alpha, dotNH );', r='return F * ( G * D );';
  if(!C.bsdfs.includes(a)||!C.bsdfs.includes(r)) return console.warn('safeShaders : three.js 셰이더가 바뀌었다');
  C.bsdfs=C.bsdfs.split(a).join('vec3 nxh_ = cross( normal, halfDir ); float k_ = alpha / max( dot( nxh_, nxh_ ) + pow2( dotNH * alpha ), 1e-8 ); float D = min( RECIPROCAL_PI * k_ * k_, 6e4 );')
    .split(r).join('return min( F * ( G * D ), vec3( 6e4 ) );');
  C.tonemapping_fragment='{ float s_ = gl_FragColor.r + gl_FragColor.g + gl_FragColor.b; if( !( s_ >= 0.0 && s_ < 1e6 ) ) gl_FragColor.rgb = vec3( 0.0 ); }'+String.fromCharCode(10)+C.tonemapping_fragment; })();
const FOG_COL=0x11151b;
const scene=new THREE.Scene(); scene.background=new THREE.Color(FOG_COL); scene.fog=new THREE.FogExp2(FOG_COL,0.024);
const camera=new THREE.PerspectiveCamera(72,1,0.05,260);
function resize(){ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();

const P={x:0,z:0,y:0,eye:1.6,yaw:0,pitch:0,vx:0,vz:0,vy:0,r:0.3,speed:2.6,free:false,grounded:true};
const FLOORS=[]; // {test:(x,z)=>bool, y:(x,z)=>number}
const LEDGES=[]; // 점프해야 오를 수 있는 원형 단 {x,z,r,y} (Blender FLOORC_)
function ledgeAt(x,z){ let y=0; for(const c of LEDGES){ const dx=x-c.x,dz=z-c.z; if(dx*dx+dz*dz<c.r*c.r) y=Math.max(y,c.y); } return y; }
function floorAt(x,z){ let y=0; for(const f of FLOORS){ if(f.test(x,z)) y=Math.max(y,f.y(x,z)); } return y; }
const LIGHTS=[]; function regLight(l){ LIGHTS.push({l,base:l.intensity}); return l; }
const COL=[];   // {x1,z1,x2,z2,on}  AABB
const CIRC=[];  // {x,z,r,on}        원기둥
const INTER=[]; // {mesh,name,range,fn,enabled}
const WORLD=new THREE.Group(); scene.add(WORLD);
const S={phase:'title',flags:{},t:0,timerOn:false,paused:false,over:false,busy:false,inv:[]};

/* --- 충돌 (원 vs AABB/원, 축별 분리) --- */
function blocked(x,z){ const r=P.r; if(ledgeAt(x,z)>P.y+0.3) return true;     // 높은 단은 점프해서 올라선다
  for(const b of COL){ if(b.on&&!b.on()) continue; if(x+r>b.x1&&x-r<b.x2&&z+r>b.z1&&z-r<b.z2) return true; }
  for(const c of CIRC){ if(c.on&&!c.on()) continue; const dx=x-c.x,dz=z-c.z,rr=c.r+r; if(dx*dx+dz*dz<rr*rr) return true; } return false; }
function move(dx,dz){ if(blocked(P.x,P.z)){ P.x+=dx; P.z+=dz; return; } // 이미 끼어 있으면 빠져나오게
  let nx=P.x+dx; if(!blocked(nx,P.z)) P.x=nx; else { for(let k=0;k<4;k++){ dx*=.5; if(!blocked(P.x+dx,P.z)){ P.x+=dx; break; } } }
  let nz=P.z+dz; if(!blocked(P.x,nz)) P.z=nz; else { for(let k=0;k<4;k++){ dz*=.5; if(!blocked(P.x,P.z+dz)){ P.z+=dz; break; } } } }
function addBox(x1,z1,x2,z2,on){ COL.push({x1:Math.min(x1,x2),z1:Math.min(z1,z2),x2:Math.max(x1,x2),z2:Math.max(z1,z2),on}); }

/* --- 입력 --- */
const keys={};
addEventListener('keydown',e=>{ if(e.target&&e.target.tagName==='INPUT') return; keys[e.code]=true; if(e.code==='Space'&&$('#mono').classList.contains('on')){ monoNext(); return; } if(S.phase!=='play'){ if(S.phase==='intro') dbgKey(e); return; }
  if(e.code==='KeyE'&&!S.busy) tryInteract(); if(e.code==='Escape') togglePause(); if(e.code==='KeyF') toggleLight(); if(e.code==='KeyM') toggleMap(); if(e.code==='KeyI'&&!S.busy) INV.open();
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
function objective(s){ $('#objtext').textContent=s; $('#objective').classList.toggle('on',!!s&&s!=='…'); }   // 할 일이 없으면 쪽지를 숨긴다
function ov(id,on){ const el=$(id); el.classList.toggle('on',on); if(!on) S.lastClose=performance.now(); S.busy=!!document.querySelector('.ov.on:not(#start)')||$('#mono').classList.contains('on'); if(S.busy){ stick.dx=stick.dy=0; } }
document.querySelectorAll('.ov .close').forEach(b=>b.addEventListener('click',()=>{ ov('#'+b.parentElement.id,false); AUDIO.click(); }));
// 점검 방법처럼 번호 단계가 있는 글(DOC)은 손글씨 쪽지가 아니라 깔끔한 공식 안내문으로 보여 준다
const DOC=(steps,note='')=>`<ol class="steps">${steps.map(s=>s[0]==='!'?`<li class="warn">${s.slice(1)}</li>`:`<li>${s}</li>`).join('')}</ol>${note?`<div class="doc-note">${note}</div>`:''}`;
// 찢어진 쪽지(TORN) : 김근수의 일지 조각 — 가장자리가 찢긴 공책 종이로 보여 준다
const TORN=h=>'<i class="tornmark"></i>'+h;
function showMsg(t,p){ return new Promise(res=>{ $('#msgT').textContent=t; $('#msgP').innerHTML=p; $('#msg .note').classList.toggle('doc',/class="steps"/.test(p)); $('#msg .note').classList.toggle('torn',/class="tornmark"/.test(p)); ov('#msg',true); $('#msgOk').onclick=()=>{ ov('#msg',false); res(); }; }); }

/* 소지품 : INV.note(id,제목,본문) — 지시서 · 쪽지 (언제든 다시 읽기) · INV.item(id,이름,설명) — 물건 · INV.has(id) · INV.drop(id) */
const INV={notes:[],items:[],
  note(id,title,body){ if(this.notes.some(n=>n.id===id)) return; this.notes.push({id,title,body}); this.ping('소지품에 넣었다 · '+title); },
  item(id,name,desc=''){ if(this.has(id)) return; this.items.push({id,name,desc}); this.ping('소지품에 넣었다 · '+name); },
  drop(id){ this.items=this.items.filter(i=>i.id!==id); },
  has(id){ return this.items.some(i=>i.id===id); },
  ping(msg){ toast(msg); const b=$('#invBtn'); b.classList.remove('new'); void b.offsetWidth; b.classList.add('new'); },
  open(){ const n=$('#inv .bnotes'), it=$('#inv .bitems'); n.innerHTML=this.notes.length?'':'<p class="empty">아직 없다</p>';
    this.notes.forEach(x=>{ const b=document.createElement('button'); b.textContent=x.title; b.onclick=()=>{ ov('#inv',false); showMsg(x.title,x.body); }; n.appendChild(b); });
    it.innerHTML=this.items.length?this.items.map(x=>`<div><b>${x.name}</b>${x.desc}</div>`).join(''):'<p class="empty">아직 없다</p>'; ov('#inv',true); AUDIO.click(); } };
$('#invBtn').addEventListener('pointerdown',e=>{ e.stopPropagation(); if(S.phase==='play'&&!S.busy) INV.open(); });

/* 도구 고르기 : 소지품의 물건 이름만 보여 주고 하나를 고르게 한다 → Promise<고른 물건 id | null> (학생이 알맞은 도구를 스스로 추론) */
function chooseTool(q,skip=['toolbox']){ return new Promise(res=>{ const el=$('#tools .tlist'); $('#tools .tq').textContent=q; el.innerHTML='';
  INV.items.filter(it=>!skip.includes(it.id)).forEach(it=>{ const b=document.createElement('button'); b.textContent=it.name; b.onclick=()=>{ ov('#tools',false); AUDIO.click(); res(it.id); }; el.appendChild(b); });
  $('#tools .close').onclick=()=>{ ov('#tools',false); res(null); }; ov('#tools',true); AUDIO.click(); }); }

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
   TIME : 공원 시계 · 남은 시간 · 사건
   - 인트로(타이머 전) : 공원 시각 = S.introMin (이야기가 직접 19:00 → 21:50 으로 옮긴다)
   - 22:00 startTimer() 이후 : 남은 시간(실제 40분, timeLeft)과 공원 시각(S.clock)은 따로 간다
     공원 시각은 점검 진행으로 정한다 — 점검을 끝내면 CLOCK_MILES 의 시각으로 넘어가고(빠른 학생), 그 사이엔 천천히 흐르다 다음 시각 5분 전에서 기다린다(느린 학생)
     → 누구나 관람차 뒤 04:00(붉은 달) · 바이킹 쪽지 뒤 05:30 · 해돋이 06:00 을 같은 순서로 겪는다. 남은 시간이 0이 되면 실패 엔딩
   - EVENTS 의 at(공원 시각, 자정 이후는 24*60+)에 도달하면 fn 실행 (story.js · 방 스크립트에서 EVENTS.push)
   ============================================================ */
const TIMER_SEC=40*60; let timeLeft=TIMER_SEC;
const CLOCK_START=22*60, CLOCK_SPAN=8*60;            // 22:00 시작, 8시간 → 06:00
const CLOCK_RATE=.2;                                    // 기준 시각 사이에서 흐르는 빠르기 (공원 분 / 실제 초 = 실제 1분에 12분)
const CLOCK_MILES=[['carousel_off',23*60],['bumper_done',24*60],['coaster_done',25*60+30],['gyro_done',26*60+30],['ferris_done',28*60],['vnote',29*60+30],['viking_end',30*60]];      // 끝낸 점검 → 공원 시각
function clockFloor(){ let m=CLOCK_START; for(const [f,t] of CLOCK_MILES) if(S.flags[f]) m=Math.max(m,t); return m; }
function clockCap(){ const fl=clockFloor(), nx=CLOCK_MILES.find(([,t])=>t>fl); return nx?nx[1]-5:30*60; }
function parkMin(){ return S.timerOn?(S.clock??CLOCK_START):(S.introMin??19*60); }
function hhmm(m,ap){ m=Math.floor(m)%1440; const h=Math.floor(m/60), mm=String(m%60).padStart(2,'0');
  if(!ap) return String(h).padStart(2,'0')+':'+mm; return [(h>=12?'PM':'AM'), String(h%12||12).padStart(2,'0')+':'+mm]; }
function fmt(s){ s=Math.max(0,Math.ceil(s)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
function startTimer(){ S.clock=CLOCK_START; S.timerOn=true; $('#clock').classList.add('on'); $('#clock .left').innerHTML='남은 시간 <b></b>'; drawClock(); }
function showClock(label){ $('#clock').classList.add('on'); if(label) $('#clock .left').textContent=label; drawClock(); }
function drawClock(){ const [ap,hm]=hhmm(parkMin(),true); const el=$('#clock'); el.querySelector('.ap').textContent=ap; el.querySelector('.hm').textContent=hm;
  const b=el.querySelector('.left b'); if(b) b.textContent=fmt(timeLeft); el.classList.toggle('late',S.timerOn&&parkMin()>=24*60+240); el.classList.toggle('warn',S.timerOn&&timeLeft<300); }
function tickTimer(dt){ if(!S.timerOn||S.paused||S.over) return; const prev=timeLeft; timeLeft-=dt;
  const fl=clockFloor(); if(fl-(S.clock??CLOCK_START)>20&&!S.flags.viking_end) toast('…벌써 '+KICK2(fl),2600);      // 점검을 끝내면 그 시각으로 (빨리 끝낸 학생)
  S.clock=Math.max(fl,Math.min(clockCap(),(S.clock??CLOCK_START)+dt*CLOCK_RATE)); drawClock();
  if(Math.floor(prev)!==Math.floor(timeLeft)&&timeLeft<60&&timeLeft>0) AUDIO.tick();
  const pm=parkMin(); for(const e of EVENTS){ if(!e.done&&pm>=e.at){ e.done=true; e.fn(); } }
  if(timeLeft<=0){ timeLeft=0; gameOver(); } }
// 실패 엔딩 (남은 시간 0) : 해가 떴지만 높은 곳에서 해를 보여 주지 못했다 — 달토끼는 다시 동상으로, 다음 보름까지
function gameOver(){ if(S.over) return; S.over=true; clearSave(); S.clock=30*60; drawClock(); P.free=false; AUDIO.stopMusic(); $('#hud').classList.remove('on');
  AUDIO.noise(2.4,.25,0,260); setTimeout(()=>AUDIO.noise(.25,.4,0,180),2300);
  $('#overT').textContent='해가 떴다 — 하지만 늦었다'; $('#overP').innerHTML='달토끼는 높은 곳에서 해를 보지 못한 채, 다시 광장의 동상이 되었다. <b>다음 보름까지.</b><br>아침, 매표소 유리창에 새 전단이 붙었다. 그 아래엔 낡은 작업화 한 켤레.'
    +'<span class="flyer"><b>야간 아르바이트 구함</b>루나랜드 · 보름 야간 점검<small>숙소 제공 · 즉시 근무 · 경력 무관</small></span>'; ov('#over',true); }
function gameClear(text,title){ if(S.over) return; S.over=true; clearSave(); P.free=false; AUDIO.stopMusic(); $('#hud').classList.remove('on'); AUDIO.ok(); if(title) $('#clear h2').textContent=title;
  $('#clearP').innerHTML=(text||'정문 너머로 해가 뜬다.')+`<br>공원 시각 ${hhmm(parkMin())} · 걸린 시간 ${fmt(TIMER_SEC-timeLeft)}`; ov('#clear',true); }
$('#overRe').onclick=()=>location.reload(); $('#clearRe').onclick=()=>location.reload();
function togglePause(){ if(S.phase!=='play'||S.over) return; S.paused=!S.paused; ov('#pause',S.paused); }
$('#pauseBtn').addEventListener('pointerdown',e=>{ e.stopPropagation(); togglePause(); });
$('#resume').onclick=()=>togglePause(); $('#restart').onclick=()=>location.reload();

/* 시간 카드 : 화면 위아래 검은 띠 + 큰 시각 */
const KICK={'19:00':'저녁 7시','22:00':'밤 10시','00:00':'밤 12시 · 자정','02:00':'새벽 2시','04:00':'새벽 4시','05:30':'새벽 5시 반','06:00':'아침 6시'};
function KICK2(m){ const h=Math.floor(m/60)%24, mm=Math.round(m%60); return (h<6?'새벽 ':h<12?'아침 ':'밤 ')+(h%12||12)+'시'+(mm?(mm===30?' 반':' '+mm+'분'):'')+'이다.'; }
function card(time,title,sub='',cls='',ms=3600){ return new Promise(res=>{ const c=$('#card'); c.className=cls; c.querySelector('.time').textContent=time;
  c.querySelector('.kick').textContent=time?'지금 공원 시각 · '+(KICK[time]||time):'';
  c.querySelector('.title').textContent=title; c.querySelector('.sub').textContent=sub; void c.offsetWidth; c.classList.add('on');
  setTimeout(()=>{ c.classList.remove('on'); setTimeout(res,800); },ms); }); }
/* 안내 방송 : 상단 배너, 차임 후 한 글자씩 */
function announce(text,{broken=false,ms,voice}={}){ return new Promise(res=>{ const el=$('#pa'), t=el.querySelector('.txt'); el.classList.toggle('broken',broken); AUDIO.chime(broken);
  const t0=performance.now(), vd=voice?AUDIO.voice(voice,broken):Promise.resolve(0);
  t.textContent=''; el.classList.add('on'); let k=0; const iv=setInterval(async()=>{ k++; t.textContent=text.slice(0,k); if(k>=text.length){ clearInterval(iv);
    const d=await vd, left=d?t0+1300+d*1000+500-performance.now():0;
    setTimeout(()=>{ el.classList.remove('on'); setTimeout(res,400); },Math.max(left,ms||Math.max(2600,text.length*60))); } },broken?70:40); }); }

/* 사건표 : at = 공원 시각(분, 자정 이후는 24*60+). 내용은 story.js · rooms/*.js 에서 push */
const EVENTS=[];

/* 목적지 화살표 : setGoal(x,z,'이름') / setGoal(null) */
const GOAL={on:false};
function setGoal(x,z,name){ if(x===null||x===undefined){ GOAL.on=false; $('#goal').classList.remove('on'); BEACON.visible=false; return; } Object.assign(GOAL,{on:true,x,z,name}); $('#goal').classList.add('on'); BEACON.visible=true; }
// 목적지 표시 (3D) : 목적지 위에 떠서 위아래로 움직이는 빛기둥 + 아래를 가리키는 화살표
const BEACON=(()=>{ const g=new THREE.Group(), m=new THREE.MeshBasicMaterial({color:0xffb340,transparent:true,opacity:.9,depthWrite:false,fog:false});
  const head=new THREE.Mesh(new THREE.ConeGeometry(.28,.5,4),m); head.rotation.x=Math.PI; head.position.y=1.0; const shaft=new THREE.Mesh(new THREE.BoxGeometry(.12,.55,.12),m); shaft.position.y=1.5;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,8,8,1,true),new THREE.MeshBasicMaterial({color:0xffb340,transparent:true,opacity:.18,depthWrite:false,fog:false})); beam.position.y=4;
  g.add(head,shaft,beam); g.visible=false; g.renderOrder=5; scene.add(g); return g; })();
function tickGoal(){ if(!GOAL.on) return; const dx=GOAL.x-P.x, dz=GOAL.z-P.z, d=Math.hypot(dx,dz);
  const rel=Math.atan2(-dx,-dz)-P.yaw; $('#goal svg').style.transform=`rotate(${-rel}rad)`; $('#goal span').textContent=`${GOAL.name||''} · ${d<2?'도착':Math.round(d)+' m'}`; $('#goal').classList.toggle('here',d<2);
  BEACON.position.set(GOAL.x,floorAt(GOAL.x,GOAL.z)+1.2+Math.sin(S.t*3)*.15,GOAL.z); BEACON.rotation.y+=.03; BEACON.visible=d>1.5; }

/* 번호 자물쇠 : keypad({title, len, hint, check:(code)=>bool}) → Promise<성공 여부> */
function keypad({title='번호 자물쇠',len=4,hint='',check}){ return new Promise(res=>{ const el=$('#keypad'), scr=el.querySelector('.scr'); let code='';
  el.querySelector('.kt').textContent=title; el.querySelector('.kh').innerHTML=hint; scr.classList.toggle('long',len>6); const draw=()=>{ scr.textContent=code.padEnd(len,'_').split('').join(' '); }; draw();
  el.querySelectorAll('.keys button').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; AUDIO.tick();
    if(k==='C'){ code=''; draw(); return; }
    if(k==='OK'){ if(code.length<len){ AUDIO.err(); return; } if(check(code)){ AUDIO.ok(); scr.classList.add('ok'); setTimeout(()=>{ scr.classList.remove('ok'); ov('#keypad',false); res(true); },700); }
      else { AUDIO.err(); scr.classList.add('bad'); setTimeout(()=>{ scr.classList.remove('bad'); code=''; draw(); },600); } return; }
    if(code.length<len){ code+=k; draw(); } });
  el.querySelector('.close').onclick=()=>{ ov('#keypad',false); res(false); }; ov('#keypad',true); }); }

/* 카메라 연출 */
let camAnim=null;
// 지점(x,z)을 바라보는 yaw — 지금 yaw 에서 가까운 쪽으로 돈다
function yawTo(x,z){ const a=Math.atan2(-(x-P.x),-(z-P.z)); return P.yaw+Math.atan2(Math.sin(a-P.yaw),Math.cos(a-P.yaw)); }
function camTo(to,dur){ if(to.yaw!==undefined) to={...to,yaw:P.yaw+Math.atan2(Math.sin(to.yaw-P.yaw),Math.cos(to.yaw-P.yaw))};      // 늘 가까운 쪽으로 (반 바퀴 안쪽)
  return new Promise(res=>{ camAnim={from:{x:P.x,z:P.z,y:P.y,yaw:P.yaw,pitch:P.pitch},to,t:0,dur,res}; }); }
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
function jump(){ if(!P.free||S.busy||!P.grounded) return; P.vy=5.4; P.grounded=false; }   // 약 1 m 높이
$('#jumpBtn').addEventListener('pointerdown',e=>{ e.stopPropagation(); AUDIO.init(); jump(); });
$('#runBtn').addEventListener('pointerdown',e=>{ e.stopPropagation(); AUDIO.init(); S.run=!S.run; e.currentTarget.classList.toggle('run',S.run); e.currentTarget.textContent=S.run?'달리는 중':'달리기'; AUDIO.tick(); });      // 터치 : 달리기 켜고 끄기
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
function toggleLight(){ if(!S.flags.torch){ toast('손전등이 없다'); return; } S.torch=!S.torch; torch.intensity=S.torch?1.6:0; AUDIO.click(); $('#lightBtn').style.borderColor=S.torch?'var(--amber)':''; }
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
  coaster:['후룸라이드','키 120cm 이상 탑승','#8e231c','#f2ede2'], viking:['바이킹','VIKING · 키 110cm 이상 탑승','#3a2416','#f0c27a'],
  game_0:['오리 낚시','','#8e231c','#f2ede2'], game_1:['사 격','','#2f4f7a','#f2ede2'], game_2:['고리 던지기','','#2f6a4a','#f2ede2'],
  food_8:['핫도그','','#f0e6d0','#8e231c'], food_15:['음료','','#f0e6d0','#2f4f7a'], tower:['자이로드롭','GYRO DROP · 키 130cm 이상 탑승','#e8dcc0','#8e231c'], bumper:['범퍼카','BUMPER CARS','#e3b54a','#1b1b1b'],
  shed:['창고','','#d8d2c2','#2a2a2a'], staff:['관계자 외 출입금지','STAFF ONLY','#e8dcc0','#8e231c'], office:['관리동','통제실 2F','#d8d2c2','#2a2a2a'], exit:['비상구','','#1f6a3a','#f2ede2'],
  // v2 맵
  icecream:['달토끼 아이스크림','MOON BUNNY ICE CREAM','#fbe9ef','#c0405f'], icecream_menu:['딸기 · 초코 · 바닐라','한 스쿱 3,000원 · 보름달 콘 +500원','#3a2430','#ffd9e4'],
  dorm:['직원 숙소','STAFF DORM · 야간 점검조','#e8eef2','#2a3a4a'], dorm_rule:['야간 점검조 수칙','자정 이후 혼자 다니지 말 것 · 점검 중에는 손전등을 켤 것','#f2ede2','#7a1d16'],
  dorm_safety:['안전 제일','야간 점검 시 손전등 · 무전기 필수 · 혼자 기구에 오르지 말 것','#f2c230','#1b1b1b'],
  rabbit_plate:['달토끼','LUNA LAND 마스코트 · 달에서 떡방아를 찧는 토끼','#c9a23e','#2a1a0a'],
  dir_0:['← 회전목마 · 직원 숙소','','#2f4f7a','#f2ede2'], dir_1:['서커스 →','','#8e231c','#f2ede2'], dir_2:['↑ 관람차 · 바이킹','','#2f6a4a','#f2ede2'],
  poster_0:['보름달 축제','달토끼와 함께하는 야간 개장 · 매일 19:00','#1b2440','#ffe2a8'], poster_1:['달빛 퍼레이드','오늘 밤 보름달 · 20:30 중앙 광장','#2a1a3a','#f2d2ff'],
};
for(let i=1;i<=10;i++) SIGNS['locker_'+i]=[String(i),'','#e8e4da','#1a1a1a'];
// 잠긴 문 (Blender COL_GATE_<key>) — 방에서 openGate(key) 로 연다
const GATES={dorm:'숙소 문', coaster:'후룸라이드 탑승구', staff:'관계자 출입문', office:'관리동 문', exit:'비상구'};
const GATE_TAP={};   // 방 스크립트가 문마다 동작을 붙인다 : GATE_TAP.dorm=()=>{…}
function openGate(k){ S.flags['open_'+k]=true; }
const PARK={mats:[],mat:{},items:{},signs:{},spawns:{},spots:{},lights:{},zones:[],anim:{},gondolas:[],bulbs:[],spawn:{x:0,z:60,yaw:0},bounds:{x1:-58,x2:58,z1:-58,z2:56}};

async function buildPark(){
  const root=await loadGLB('park'); WORLD.add(root); root.updateMatrixWorld(true);
  const kill=[], ride=[], bb=new THREE.Box3(), v=new THREE.Vector3(), q=new THREE.Quaternion();
  const mats=new Set();
  root.traverse(o=>{ const n=o.name||'';
    if(/^COLC_/.test(n)){ bb.setFromObject(o); CIRC.push({x:(bb.min.x+bb.max.x)/2,z:(bb.min.z+bb.max.z)/2,r:(bb.max.x-bb.min.x)/2}); kill.push(o); return; }
    if(/^COL_/.test(n)){ bb.setFromObject(o); const gm=n.match(/^COL_GATE_([a-z]+)/); const k=gm&&gm[1];
      addBox(bb.min.x,bb.min.z,bb.max.x,bb.max.z,k?()=>!S.flags['open_'+k]:undefined);
      if(k){ const pk=new THREE.Mesh(new THREE.BoxGeometry(bb.max.x-bb.min.x+.2,2.4,bb.max.z-bb.min.z+.2),PICK); bb.getCenter(v); pk.position.set(v.x,1.2,v.z); WORLD.add(pk);
        INTER.push({mesh:pk,name:GATES[k]||k,range:3.2,fn:()=>gateTap(k),enabled:()=>!S.flags['open_'+k]}); }
      kill.push(o); return; }
    if(/^FLOORC_/.test(n)){ bb.setFromObject(o); const c={x:(bb.min.x+bb.max.x)/2,z:(bb.min.z+bb.max.z)/2,r:(bb.max.x-bb.min.x)/2,y:bb.max.y};
      FLOORS.push({test:(x,z)=>(x-c.x)**2+(z-c.z)**2<c.r*c.r,y:()=>c.y}); LEDGES.push(c); kill.push(o); return; }
    if(/^FLOOR_/.test(n)){ bb.setFromObject(o); const f={x1:bb.min.x,x2:bb.max.x,z1:bb.min.z,z2:bb.max.z,y:bb.max.y};
      FLOORS.push({test:(x,z)=>x>f.x1&&x<f.x2&&z>f.z1&&z<f.z2,y:()=>f.y}); kill.push(o); return; }
    if(/^(LAMP|LIGHT)_/.test(n)){ const u=o.userData; const l=regLight(new THREE.PointLight(new THREE.Color(u.color||'#ffb46b'),u.i||1,u.d||14,1.6)); o.getWorldPosition(l.position); scene.add(l);
      const e=LIGHTS[LIGHTS.length-1]; PARK.lights[n.slice(n.indexOf('_')+1)]=e; if(n.startsWith('LAMP_')&&Math.random()<.22) e.flicker=Math.random()*10; if((u.d||0)>30) e.far=30; return; }
    if(/^SIGN_/.test(n)){ const k=n.slice(5), u=o.userData, s=SIGNS[k]; if(k==='map') return addMapBoard(o,u); if(!s) return;
      const tex=/^manual_/.test(k)?TEX.poster(s[0],s[1]):TEX.sign(s.slice(0,2).filter(Boolean),s[2],s[3],1024,Math.round(1024*u.h/u.w)||256);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(u.w,u.h),new THREE.MeshStandardMaterial({map:tex,roughness:.8,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.08}));
      o.getWorldPosition(m.position); o.getWorldQuaternion(m.quaternion); m.translateZ(0.04); WORLD.add(m); PARK.signs[k]=m; if(/^ANIM_/.test(o.parent&&o.parent.name)) ride.push([o.parent,m]); return; }
    if(/^ZONE_/.test(n)){ o.getWorldPosition(v); PARK.zones.push({id:n.slice(5),title:o.userData.title||n,r:o.userData.r||8,x:v.x,z:v.z}); return; }
    if(n==='SPAWN'){ o.getWorldPosition(v); PARK.spawn={x:v.x,z:v.z,yaw:0}; return; }
    if(/^(SPAWN|SPOT)_/.test(n)){ o.getWorldPosition(v); o.getWorldQuaternion(q); const e=new THREE.Euler().setFromQuaternion(q,'YXZ');
      (n.startsWith('SPAWN_')?PARK.spawns:PARK.spots)[n.replace(/^(SPAWN|SPOT)_/,'')]={x:v.x,z:v.z,yaw:e.y}; return; }
    if(/^IT_/.test(n)) PARK.items[n.slice(3)]=o;      // 조사할 수 있는 물체 (방 스크립트가 INTER 에 붙인다)
    if(/^ANIM_/.test(n)) PARK.anim[n.slice(5)]=o;
    if(/^GONDOLA_/.test(n)) PARK.gondolas.push(o);
    if(o.isMesh){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m)); }
  });
  kill.forEach(o=>o.parent&&o.parent.remove(o));
  ride.forEach(([p,m])=>{ m.updateMatrixWorld(true); p.attach(m); });
  Object.values(PARK.items).forEach(dequant);
  // 재질 손보기 : Blender 속성(tint, glow) 반영
  mats.forEach(m=>{ const u=m.userData||{};
    if(u.tint) m.color.set(u.tint).convertSRGBToLinear();
    if(u.glow!==undefined){ m.emissiveIntensity=u.glow; if(/bulb/.test(m.name)&&u.glow>0) PARK.bulbs.push(m); }
    PARK.mat[m.name]=m;
    ['map','normalMap','roughnessMap'].forEach(k=>{ if(m[k]) m[k].anisotropy=8; });
    m.envMapIntensity=0.55; PARK.mats.push(m); });
  mergeStatic(root);      // 움직이지 않는 배경을 칸 · 재질별로 합쳐 그리기 횟수를 줄인다 (태블릿)
  // 낙서 한 줄 (정문 안쪽 담)
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.65),new THREE.MeshBasicMaterial({map:TEX.scrawl('돌아가'),transparent:true,depthWrite:false}));
  sc.position.set(-14,1.7,55.7); sc.rotation.y=Math.PI; sc.visible=false; PARK.scrawl=sc; WORLD.add(sc);   // 폐장 후에만 보인다
}
/* 배경 합치기 : 같이 움직이는 덩어리(공원 바닥 · 놀이기구 축 ANIM_ · 곤돌라 GONDOLA_) 안에서, 같은 재질끼리 메시 하나로 — 모양 · 재질 · 움직임은 그대로, 그리기 횟수만 준다
   공원 바닥은 화면 밖을 계속 걸러낼 수 있게 CELL m 칸으로 나눠 합친다. 놀이기구 · 곤돌라는 그 축의 자식으로 합쳐서 같이 돈다
   합치지 않는 것 : 조사 대상(IT_) · 간판(SIGN_ · 엔진이 만든 이름 없는 메시) · 투명한 재질 · 모양이 바뀌는(morph) 메시 · 숨겨진 것
   ?nomerge = 끄기 · ?cell=N = 칸 크기 · ?mergetest = 원래 메시를 남겨 두고 __setMerge(true/false) 로 바꿔 보기 (전후 비교) */
const NQ={Int8Array:127,Uint8Array:255,Int16Array:32767,Uint16Array:65535};
function qv(a,i,c){ let v=c===0?a.getX(i):c===1?a.getY(i):c===2?a.getZ(i):a.getW(i); if(a.normalized){ const k=NQ[(a.isInterleavedBufferAttribute?a.data.array:a.array).constructor.name]; if(k) v=Math.max(v/k,-1); } return v; }
function mergeStatic(root){ if(/[?&]nomerge/.test(location.search)) return; const T0=performance.now();
  const CELL=+(location.search.match(/cell=(\d+)/)||[0,48])[1], groups=new Map(), v=new THREE.Vector3(), nv=new THREE.Vector3(), nm=new THREE.Matrix3();
  root.updateMatrixWorld(true);
  const frameOf=o=>{ for(let p=o.parent;p&&p!==root;p=p.parent){ if(!p.visible||/^(IT_|SIGN_)/.test(p.name)) return null; if(/^(ANIM_|GONDOLA_)/.test(p.name)) return p; } return root; };      // 같이 움직이는 덩어리 (없으면 합치지 않음)
  root.traverse(o=>{ if(!o.isMesh||o.isSkinnedMesh||Array.isArray(o.material)||!o.visible||!o.name||/^IT_/.test(o.name)) return; const g=o.geometry, m=o.material;
    if(!g.attributes.position||m.transparent||m.opacity<1||g.attributes.tangent||Object.keys(g.morphAttributes||{}).length) return;
    const F=frameOf(o); if(!F) return; v.setFromMatrixPosition(o.matrixWorld);
    const key=F.uuid+'|'+m.uuid+'|'+Object.keys(g.attributes).sort().join(',')+(F===root?'|'+Math.floor(v.x/CELL)+','+Math.floor(v.z/CELL):'');
    (groups.get(key)||groups.set(key,{F,list:[]}).get(key)).list.push(o); });
  const test=/[?&]mergetest/.test(location.search), olds=[], news=[];
  groups.forEach(({F,list})=>{ if(list.length<2) return; const host=F===root?WORLD:F, inv=new THREE.Matrix4().copy(host.matrixWorld).invert(), g0=list[0].geometry, names=Object.keys(g0.attributes); let vc=0, ic=0;
    list.forEach(o=>{ const g=o.geometry; vc+=g.attributes.position.count; ic+=g.index?g.index.count:g.attributes.position.count; });
    const out={}; names.forEach(n=>out[n]=new Float32Array(vc*g0.attributes[n].itemSize)); const idx=vc>65535?new Uint32Array(ic):new Uint16Array(ic); let vo=0, io=0;
    list.forEach(o=>{ const g=o.geometry, mw=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld), flip=mw.determinant()<0, n=g.attributes.position.count; nm.getNormalMatrix(mw);
      names.forEach(nn=>{ const a=g.attributes[nn], sz=a.itemSize, d=out[nn];
        if(nn==='position') for(let i=0;i<n;i++){ v.set(qv(a,i,0),qv(a,i,1),qv(a,i,2)).applyMatrix4(mw); d[(vo+i)*3]=v.x; d[(vo+i)*3+1]=v.y; d[(vo+i)*3+2]=v.z; }
        else if(nn==='normal') for(let i=0;i<n;i++){ nv.set(qv(a,i,0),qv(a,i,1),qv(a,i,2)).applyMatrix3(nm).normalize(); d[(vo+i)*3]=nv.x; d[(vo+i)*3+1]=nv.y; d[(vo+i)*3+2]=nv.z; }
        else for(let i=0;i<n;i++) for(let c=0;c<sz;c++) d[(vo+i)*sz+c]=qv(a,i,c); });
      const tri=(a,b,c)=>{ idx[io++]=vo+a; idx[io++]=vo+(flip?c:b); idx[io++]=vo+(flip?b:c); };      // 뒤집힌 물체는 감는 방향도 뒤집는다
      if(g.index){ const ia=g.index; for(let t=0;t+2<ia.count;t+=3) tri(ia.getX(t),ia.getX(t+1),ia.getX(t+2)); } else for(let t=0;t+2<n;t+=3) tri(t,t+1,t+2);
      vo+=n; olds.push([o,o.parent]); o.parent.remove(o); });
    const geo=new THREE.BufferGeometry(); names.forEach(nn=>geo.setAttribute(nn,new THREE.BufferAttribute(out[nn],g0.attributes[nn].itemSize))); geo.setIndex(new THREE.BufferAttribute(idx,1)); geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,list[0].material); mesh.name='MERGED_'+(list[0].material.name||''); mesh.castShadow=list[0].castShadow; mesh.receiveShadow=list[0].receiveShadow; host.add(mesh); news.push(mesh); });
  PARK.merge={meshes:olds.length,into:news.length,ms:Math.round(performance.now()-T0)};
  if(test){ window.__setMerge=on=>{ news.forEach(m=>m.visible=on); olds.forEach(([o,p])=>{ if(on) p.remove(o); else p.add(o); }); }; } }
// 압축(quantize)된 GLB 는 좌표가 정수(normalized)로 들어 있는데, r128 레이캐스트는 그 정수를 그대로 읽어서 조사(클릭)가 빗나간다
// → 조사 대상(IT_)만 좌표를 실수로 풀어 둔다
function dequant(o){ o.traverse(m=>{ const a=m.geometry&&m.geometry.attributes.position; if(!a||!a.normalized) return;
  const k={Int8Array:127,Uint8Array:255,Int16Array:32767,Uint16Array:65535}[a.array.constructor.name]||1, f=new Float32Array(a.count*3);
  for(let i=0;i<a.count;i++){ f[i*3]=Math.max(a.getX(i)/k,-1); f[i*3+1]=Math.max(a.getY(i)/k,-1); f[i*3+2]=Math.max(a.getZ(i)/k,-1); }
  m.geometry.setAttribute('position',new THREE.BufferAttribute(f,3)); }); }
const PICK=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}); // 보이지 않는 탭 판정용

async function gateTap(k){ if(GATE_TAP[k]) return GATE_TAP[k](); AUDIO.click(); AUDIO.noise(.3,.25,0,400); await mono(['…잠겨 있다.']); }

/* 공원 지도 (안내판 + M 키) */
function drawMap(g,W,H,me){
  const B=PARK.bounds, pad=60, sx=(W-pad*2)/(B.x2-B.x1), sz=(H-pad*2)/(B.z2-B.z1), s=Math.min(sx,sz);
  const X=x=>pad+(x-B.x1)*s, Y=z=>pad+(z-B.z1)*s;
  g.fillStyle='#ece5d3'; g.fillRect(0,0,W,H); g.strokeStyle='#2a2a2a'; g.lineWidth=3; g.strokeRect(X(B.x1),Y(B.z1),(B.x2-B.x1)*s,(B.z2-B.z1)*s);
  g.fillStyle='#ece5d3'; g.fillRect(X(-7.5),Y(B.z2)-4,15*s,8);
  g.fillStyle='#8e231c'; g.font=`900 ${W*.05}px "Malgun Gothic",sans-serif`; g.textAlign='left'; g.textBaseline='top'; g.fillText('LUNA LAND',pad,14*W/1000);
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
 {m:21*60,    top:'#070b1c',mid:'#121c3a',hor:'#3a3552',fog:'#181d30',fd:.016,ex:1.08,hemi:.40,sun:0,  star:.8, sy:-.2,env:.45},
 {m:22*60,    top:'#060a18',mid:'#101a32',hor:'#2a2c48',fog:'#141a2a',fd:.017,ex:1.05,hemi:.38,sun:0,  star:.9, sy:-.3,env:.40},
 {m:24*60,    top:'#03050c',mid:'#0a1020',hor:'#181a28',fog:'#0c0f18',fd:.024,ex:1.00,hemi:.32,sun:0,  star:1,  sy:-.4,env:.30},
 {m:27*60,    top:'#020308',mid:'#070a14',hor:'#12121c',fog:'#090a10',fd:.032,ex:.96, hemi:.26,sun:0,  star:1,  sy:-.4,env:.22},
 {m:29*60+20, top:'#0a1028',mid:'#1a2244',hor:'#4a3a58',fog:'#1a1c2c',fd:.022,ex:1.02,hemi:.34,sun:0,  star:.4, sy:-.1,env:.32},
 {m:30*60,    top:'#1a2448',mid:'#3a4a7a',hor:'#c08070',fog:'#3a3448',fd:.014,ex:1.12,hemi:.50,sun:.2, star:.05,sy:.0, env:.5},
];
const SKY={};
function buildSkyDome(){
  const u={top:{value:new THREE.Color()},mid:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3()},
           sunAmt:{value:1},starAmt:{value:0},moonDir:{value:new THREE.Vector3(-.45,.55,-.7).normalize()},t:{value:0},eye:{value:0}};
  const mat=new THREE.ShaderMaterial({uniforms:u,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vD; void main(){ vD=normalize(position); vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; gl_Position.z=gl_Position.w*.9999; }`,
    fragmentShader:`uniform vec3 top,mid,hor,sunDir,moonDir; uniform float sunAmt,starAmt,t,eye; varying vec3 vD;
      float h3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      void main(){ vec3 d=normalize(vD); float y=d.y;
        vec3 c=mix(hor,mid,smoothstep(-.02,.22,y)); c=mix(c,top,smoothstep(.18,.85,y)); c=mix(c,hor*.55,smoothstep(0.,-.25,y));
        float s=max(dot(d,normalize(sunDir)),0.); c+=vec3(1.,.62,.36)*(pow(s,6.)*.35+pow(s,64.)*.6+smoothstep(.9994,.9997,s)*1.2)*sunAmt;
        vec3 g=floor(d*380.); float st=step(.9975,h3(g)); float tw=.6+.4*sin(t*3.+h3(g+1.)*40.);
        c+=vec3(.85,.9,1.)*st*tw*starAmt*smoothstep(.06,.35,y);
        // 보름달 : 원반 + 무늬(바다) + 달무리. 지평선 아래면 안 보인다
        float m=dot(d,moonDir), up=smoothstep(-.02,.03,moonDir.y); float disc=smoothstep(.99935,.9995,m);
        float mar=h3(floor(d*900.))*.12+.88-.18*smoothstep(.4,.9,sin(d.x*700.)*sin(d.y*650.+1.3));
        vec3 mc=vec3(1.,.98,.9)*mar*1.15;
        // 새벽 4시 : 붉은 달이 눈을 뜬다 — 젖은 흰자와 핏줄 · 결이 있는 홍채 · 동공 · 눈꺼풀 · 반사광. 눈동자는 휙휙(단속 운동) 움직이고, 가끔 깜빡인다
        if(eye>0.){ vec3 mu=normalize(cross(moonDir,vec3(0.,1.,0.))), mv=cross(mu,moonDir); vec2 q=vec2(dot(d,mu),dot(d,mv))/.0316;
          float bp=fract(t/5.3), open=clamp(abs(bp-.965)/.035,0.,1.); open=open*open*(3.-2.*open);
          float hw=pow(max(0.,1.-pow(abs(q.x)/.9,2.)),.72), ue=(.5*hw+.02)*open, le=-(.4*hw-.01)*open;
          float inside=smoothstep(0.,.02,ue-q.y)*smoothstep(0.,.02,q.y-le);
          float sk=floor(t/2.9), sf=smoothstep(0.,.05,fract(t/2.9));
          vec2 g0=(vec2(h3(vec3(sk-1.,1.,2.)),h3(vec3(sk-1.,5.,7.)))-.5)*vec2(.36,.14), g1=(vec2(h3(vec3(sk,1.,2.)),h3(vec3(sk,5.,7.)))-.5)*vec2(.36,.14);
          vec2 iq=q-mix(g0,g1,sf); float ir=length(iq), an=atan(iq.y,iq.x), PR=.12+.015*sin(t*.5);
          float ao=smoothstep(0.,.2,min(ue-q.y,q.y-le));
          float vn=abs(sin(q.x*21.+sin(q.y*29.+q.x*6.)*2.4)*sin(q.y*17.-q.x*5.+sin(q.x*11.)*1.8));
          vec3 scl=mix(vec3(.94,.89,.83),vec3(.88,.52,.48),smoothstep(.3,.9,abs(q.x)));
          scl=mix(scl,vec3(.62,.06,.05),smoothstep(.07,0.,vn)*smoothstep(.2,.75,length(q*vec2(1.,1.7)))*.85);
          scl*=(.45+.55*ao)*(.85+.15*(1.-dot(q,q)));
          float fib=(.6+.4*sin(an*46.+sin(an*7.)*3.+ir*18.))*(.75+.25*sin(an*19.-ir*40.));
          vec3 iris=mix(vec3(.98,.66,.2),vec3(.5,.05,.03),smoothstep(.1,.33,ir))*fib;
          iris+=vec3(.3,.14,.02)*smoothstep(.035,0.,abs(ir-.18)); iris*=1.-.8*smoothstep(.25,.34,ir);
          vec3 e=mix(scl,iris*(.55+.45*ao),smoothstep(.34,.325,ir));
          e=mix(e,vec3(.01,0.,0.),smoothstep(PR,PR-.012,ir));
          e+=vec3(1.)*(smoothstep(.055,.0,length(iq-vec2(-.1,.11)))*.95+smoothstep(.14,.0,length(iq-vec2(.09,-.1)))*.12)*ao;
          e+=vec3(.9,.7,.7)*smoothstep(.018,0.,abs(q.y-le))*hw*.35;
          float lid=smoothstep(.16,0.,min(abs(q.y-ue),abs(q.y-le)));
          vec3 skin=vec3(1.,.36,.26)*mar*(1.-.45*lid*(1.-inside));
          mc=mix(mc,mix(skin,e,inside),eye); }
        c=mix(c,mc,disc*up); c+=mix(vec3(.35,.4,.55),vec3(.75,.1,.06),eye)*(pow(max(m,0.),120.)*.5+pow(max(m,0.),12.)*.08)*up;
        gl_FragColor=vec4(c,1.); }`});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(230,32,16),mat); dome.renderOrder=-1; dome.frustumCulled=false; scene.add(dome);
  SKY.u=u; SKY.dome=dome; }
async function buildSky(){ const im=await loadImg('sky'); const t=new THREE.Texture(im); t.encoding=THREE.sRGBEncoding; t.mapping=THREE.EquirectangularReflectionMapping; t.needsUpdate=true;
  const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromEquirectangular(t).texture; pm.dispose(); scene.background=null;
  buildSkyDome();
  SKY.hemi=new THREE.HemisphereLight(0x8a9ab8,0x1a1612,0.32); scene.add(SKY.hemi);
  SKY.moon=new THREE.DirectionalLight(0xb8c8f0,0.38); scene.add(SKY.moon);                          // 보름달 빛
  SKY.sun=new THREE.DirectionalLight(0xff9a5a,0); SKY.sun.position.set(-60,8,-25); scene.add(SKY.sun); // 해 질 녘 서북서 빛
  tickSky(0,true); }
const _c1=new THREE.Color(),_c2=new THREE.Color(); let skyT=0;
function tickSky(dt,force){ if(!SKY.u) return; SKY.u.t.value+=dt; skyT+=dt; if(!force&&skyT<0.2) return; skyT=0;
  const m=parkMin(); let i=0; while(i<SKY_KEYS.length-2&&m>SKY_KEYS[i+1].m) i++; const a=SKY_KEYS[i],b=SKY_KEYS[i+1]; const k=clamp((m-a.m)/(b.m-a.m),0,1);
  const col=(key,out)=>out.set(a[key]).lerp(_c2.set(b[key]),k), num=key=>lerp(a[key],b[key],k);
  col('top',SKY.u.top.value); col('mid',SKY.u.mid.value); col('hor',SKY.u.hor.value);
  const sy=num('sy'); SKY.u.sunDir.value.set(-.85,sy,-.35).normalize(); SKY.u.sunAmt.value=num('sun'); SKY.u.starAmt.value=num('star');
  // 보름달 : 해가 질 무렵 동쪽에서 떠서, 자정 무렵 남쪽 하늘 가장 높이, 해 뜰 무렵 서쪽으로 진다 (남중 고도 약 50°로 둠)
  const ma=(m-19*60)/(11*60)*Math.PI, alt=50*Math.PI/180; const md=SKY.u.moonDir.value.set(Math.cos(ma),Math.sin(ma)*Math.sin(alt),Math.sin(ma)*Math.cos(alt)).normalize();
  // 정전(S.blackout) 뒤로는 하늘빛도 낮춘다 — 손전등 없이는 잘 안 보이게. 새벽 4시부터 달이 붉어지며 눈을 뜬다 (달의 눈)
  const bk=S.blackout?.1:1, eye=m>=28*60&&!S.flags.viking_end?1:0; S.redMoon=eye>0; SKY.u.eye.value=eye;      // 04:00 이 되는 순간 바로 눈을 뜬다 (붉은 달 — 달빛 웅덩이가 소용없어진다, hunt.js) SKY.moon.color.setHex(0xb8c8f0).lerp(_c2.set(0xff4a34),eye);
  SKY.moon.position.copy(md).multiplyScalar(100); SKY.moon.intensity=(Math.max(0,md.y)*0.55+0.08)*(S.blackout?.22:1);
  col('fog',_c1); scene.fog.color.copy(_c1).convertSRGBToLinear(); scene.fog.density=num('fd'); renderer.toneMappingExposure=DBG.bright?2.6:num('ex')*(S.blackout?.8:1);
  SKY.hemi.intensity=num('hemi')*bk; const env=num('env')*bk; PARK.mats.forEach(m=>m.envMapIntensity=env); SKY.sun.intensity=num('sun')*0.9; }

/* 구역 : 처음 들어가면 이름 표시 */
let zoneT=0, curZone=null;
function tickZones(dt){ zoneT+=dt; if(zoneT<0.25) return; zoneT=0; let z=null;
  for(const q of PARK.zones){ if(Math.hypot(P.x-q.x,P.z-q.z)<q.r){ z=q; break; } }
  if(z!==curZone){ curZone=z; $('#zone').textContent=z?z.title:''; $('#zone').classList.toggle('on',!!z); if(z&&!S.flags['seen_'+z.id]){ S.flags['seen_'+z.id]=true; toast(z.title); } } }

/* ============================================================
   ROOMS : 방(퍼즐)을 하나씩 붙이는 자리
   ROOMS.push({ id:'viking', async build(){…INTER.push(…)}, tick(dt){…} })
   - 구역 위치 : PARK.zones.find(z=>z.id==='viking')
   - 잠긴 문 열기 : openGate('coaster')  (Blender 의 COL_GATE_coaster)
   ============================================================ */
const ROOMS=[];

/* ---------------- 메인 루프 ---------------- */
let last=performance.now(),fpsN=0,fpsT=0,fps=0;
function frame(now){ requestAnimationFrame(frame); const dtReal=Math.min(1,(now-last)/1000); const dt=Math.min(0.1,dtReal); last=now; S.t+=dt;
  if(S.paused) return;
  if(S.over){ S.overT=(S.overT||0)+dtReal; if(S.overT>3) return; }   // 끝 화면이 덮이면 3D 렌더 중지
  tickCam(dtReal); tickTimer(dtReal);
  if(P.free&&!S.busy&&!camAnim){ let fx=0,fz=0; if(keys.KeyW||keys.ArrowUp) fz+=1; if(keys.KeyS||keys.ArrowDown) fz-=1; if(keys.KeyA||keys.ArrowLeft) fx-=1; if(keys.KeyD||keys.ArrowRight) fx+=1;
    if(stick.id!==null){ fx+=stick.dx; fz-=stick.dy; } const m=Math.hypot(fx,fz); if(m>1){ fx/=m; fz/=m; }
    const sp=P.speed*(keys.ShiftLeft||keys.ShiftRight||S.run||m>0.95&&stick.id!==null?1.6:1); const s=Math.sin(P.yaw),c=Math.cos(P.yaw); // 전방 = (-sin yaw, -cos yaw)
    const vx=(-s*fz + c*fx)*sp, vz=(-c*fz - s*fx)*sp; P.vx=lerp(P.vx,vx,1-Math.pow(0.001,dt)); P.vz=lerp(P.vz,vz,1-Math.pow(0.001,dt)); move(P.vx*dt,P.vz*dt);
    const sp2=Math.hypot(P.vx,P.vz); P.bob=(P.bob||0)+sp2*dt*7; P.bobA=lerp(P.bobA||0,sp2>0.3?0.025:0,0.1); }
  tickJump(dt);
  const eyeY=P.free&&P.grounded?P.eye+Math.sin(P.bob||0)*(P.bobA||0):P.eye;
  camera.position.set(P.x,P.y+eyeY,P.z); camera.rotation.order='YXZ'; camera.rotation.set(P.pitch,P.yaw,0);
  tickLights(dt); tickZones(dt); tickGoal();
  // 놀이기구 : 운영 중엔 돌고, 폐장하면 서서히 멈추고, 자정엔 회전목마만 혼자 돈다
  const A=PARK.anim, tgtC=S.ridesGhost?0.25:S.carouselRun?0.45:S.closed?0:0.55, tgtW=S.closed?0:0.06;
  S.rC=lerp(S.rC??tgtC,tgtC,1-Math.pow(0.6,dt)); S.rW=lerp(S.rW??tgtW,tgtW,1-Math.pow(0.7,dt));
  if(A.viking) A.viking.rotation.z=Math.sin(S.t*.55)*.04;      // 바이킹 : 바람에 조금씩 흔들린다 (끼익…)
  if(A.carousel) A.carousel.rotation.y+=dt*S.rC; if(A.wheel){ A.wheel.rotation.z+=dt*S.rW; PARK.gondolas.forEach(g=>g.rotation.z=-A.wheel.rotation.z); }
  tickSky(dt);
  // 깜빡이는 가로등 · 전구
  LIGHTS.forEach(o=>{ if(o.flicker!==undefined) o.l.intensity=o.base*((Math.sin(S.t*17+o.flicker)>0.7||Math.random()<.02)?0.15:1); });
  const bk=0.85+0.15*Math.sin(S.t*1.3); PARK.bulbs.forEach(m=>m.emissiveIntensity=(m.userData.glow||1)*(m.userData.dim??1)*bk*(Math.random()<(S.closed?.03:.004)?.2:1));
  // 조사 대상
  if(P.free&&!S.busy){ const it=pick(0,0); if(it!==hot){ hot=it; $('#label').textContent=it?it.name:''; $('#label').classList.toggle('on',!!it); $('#cross').classList.toggle('hot',!!it); $('#interact').classList.toggle('on',!!it); } }
  else if(hot){ hot=null; $('#label').classList.remove('on'); $('#cross').classList.remove('hot'); $('#interact').classList.remove('on'); }
  ROOMS.forEach(r=>r.tick&&r.tick(dt)); if(typeof CROWD!=='undefined') CROWD.tick(dt);
  renderer.render(scene,camera);
  fpsN++; fpsT+=dt; if(fpsT>1){ fps=Math.round(fpsN/fpsT); fpsN=0; fpsT=0; if(DBG.on) $('#dbg').textContent=`fps ${fps}  x ${P.x.toFixed(1)} z ${P.z.toFixed(1)} yaw ${P.yaw.toFixed(2)}  calls ${renderer.info.render.calls} tris ${renderer.info.render.triangles}\nzone ${curZone?curZone.id:'-'}  flags ${Object.keys(S.flags).filter(k=>!k.startsWith('seen_')).join(',')}`; } }

/* 제작용 디버그 : Shift+숫자 = 방 바로 가기 (1 숙소 · 2 회전목마 · 3 범퍼카 · 4 후룸라이드 · 5 자이로드롭 · 6 관람차 · 7 바이킹 …) · Shift+L 바로 가기 목록 · Alt+1~0 구역 이동
   Shift+` 정보 (Shift+D 는 달리면서 오른쪽으로 갈 때 눌려서 바꿨다) · Shift+G 모든 문 열기 · Shift+N 밝게 보기 · Shift+T 공원 시간 +1시간 · Shift+K 인트로 건너뛰기 */
// 바로 가기 : 방마다 하나, 방 번호 = 숫자 키. 각 방 스크립트가 CHECKPOINTS.push({key:'3', name, go(){…}}) — go 는 그 앞 단계를 모두 끝낸 상태로 만들고 자리를 옮긴다
const CHECKPOINTS=[];
function warp(x,z,lookX,lookZ,y){ P.x=x; P.z=z; P.y=y??floorAt(x,z); P.vx=P.vz=P.vy=0; P.grounded=true; if(lookX!==undefined) P.yaw=Math.atan2(-(lookX-x),-(lookZ-z)); P.pitch=0; P.free=true; }
function itemPos(k){ const o=PARK.items[k]; return o?new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()):null; }
// 앞 단계로 돌아가도 상태가 섞이지 않게, 바로 가기는 늘 새로 불러온 뒤(?cp=번호) 그 자리로 간다
// 앞 방으로 가는 건 그 자리에서 바로 옮긴다. 이미 지나온 방으로 돌아갈 때만 새로 불러온다 (입장권 연출 없이 바로 시작)
function cpLevel(){ const f=S.flags; return S.stage!=='night'?0:f.ferris_done?7:f.gyro_done?6:f.coaster_done?5:f.coaster_arrive?4:f.bumper_booth_in?3:f.booth_in?2:1; }
function jumpTo(key){ if(!CHECKPOINTS.some(c=>c.key===key)) return;
  if(S.phase!=='title'&&+key>cpLevel()) return runCheckpoint(key);
  location.search='?cp='+key; }
// 바로 가기로 새로 불러오면 소리가 잠겨 있다 → 첫 클릭 · 키에서 깨운다
['pointerdown','keydown'].forEach(t=>addEventListener(t,()=>{ if(AUDIO.ctx&&AUDIO.ctx.state==='suspended') AUDIO.ctx.resume(); },true));
const CP=(location.search.match(/[?&]cp=(\w)/)||[])[1];
// 이어하기 : 밤 점검 중 하던 그대로를 이 기기에 저장 → 새로고침 · 탭이 죽어도 시작 화면 [이어하기] 로 그 자리에서 다시 (끝나면 지운다 · 이어한 뒤엔 주소를 비워 다시 새로고침하면 가장 최근 저장으로)
//   저장 : 지나온 방(lv) · 남은 시간 · 모드 · 서 있던 자리 · 모든 진행 표시(S.flags) · 소지품 · 공원 시각 · 지난 사건 · 할 일 · 목적지 · 손전등 · 방마다의 상태(ROOMS 의 save())
//   독백 · 문제 화면 · 놀이기구 탑승처럼 진행이 바뀌는 중에는 저장하지 않는다 → 늘 '멈춰 서 있던' 상태로 돌아간다 (탑승 중 나가면 타기 직전으로)
const SAVE_KEY='lunaland_save', RESUME=/[?&]resume/.test(location.search);
const SAVE=(()=>{ try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); return s&&s.lv>=1?s:null; }catch(e){ return null; } })();
if(RESUME&&SAVE) S.gentle=!!SAVE.g;
let lastPos=null;      // 마지막으로 자유롭게 서 있던 자리 (놀이기구 · 글 읽는 중 · 공중은 빼고)
function saveGame(){ if(S.stage!=='night'||!S.timerOn||S.over||(CP&&!S.cpReady)) return; const lv=cpLevel(); if(lv<1) return;
  if(!P.free||S.busy||!P.grounded||camAnim||document.body.classList.contains('riding')||document.querySelector('.ov.on')) return;
  lastPos={lv,x:+P.x.toFixed(2),z:+P.z.toFixed(2),yaw:+P.yaw.toFixed(3)}; const r={}; ROOMS.forEach(o=>{ if(o.save) r[o.id]=o.save(); });
  try{ localStorage.setItem(SAVE_KEY,JSON.stringify({lv,t:Math.round(timeLeft),g:!!S.gentle,p:lastPos,f:S.flags,inv:{n:INV.notes,i:INV.items},c:S.clock,ev:EVENTS.map(e=>e.done?1:0),
    o:$('#objtext').textContent,gl:GOAL.on?[GOAL.x,GOAL.z,GOAL.name]:null,tr:S.torch?1:0,r})); }catch(e){} }
// 이어하기 불러오기 : 바로 가기(c.go)로 그 방 입구까지 만든 뒤 → 저장된 진행 표시 · 소지품 · 시각으로 바꾸고 → 방마다 load() 가 그 상태(전원 · 불 꺼짐 · 문제 진행 …)를 다시 맞춘다
function loadGame(s){ if(!s.f) return;      // v37 이전 저장 : 방 입구에서
  const ping=INV.ping; INV.ping=()=>{};
  for(const k in S.flags) if(!(k in s.f)) delete S.flags[k]; Object.assign(S.flags,s.f); S.flags.viking_ride=false;
  INV.notes=s.inv.n; INV.items=s.inv.i; if(s.c!=null) S.clock=s.c;
  (s.ev||[]).forEach((d,i)=>{ const e=EVENTS[i]; if(d&&e&&!e.done){ e.done=true; if(e.quiet) e.quiet(); } });
  ROOMS.forEach(o=>{ if(o.load) o.load((s.r||{})[o.id]||{}); });
  INV.ping=ping; if(s.tr&&!S.torch&&S.flags.torch) toggleLight();
  objective(s.o||''); if(s.gl) setGoal(...s.gl); else setGoal(null); tickSky(0,true); }
function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
setInterval(saveGame,3000); addEventListener('pagehide',saveGame);
async function runCheckpoint(key){ const c=CHECKPOINTS.find(c=>c.key===key); if(!c) return;
  while($('#mono').classList.contains('on')) monoNext(); document.querySelectorAll('.ov.on').forEach(el=>{ if(el.id!=='start') ov('#'+el.id,false); });
  camAnim=null; await ensureNight(); while($('#mono').classList.contains('on')) monoNext();
  $('#fade').classList.add('clear'); $('#card').classList.remove('on'); setGoal(null); await c.go(); if(RESUME&&SAVE){ timeLeft=SAVE.t; loadGame(SAVE); const p=SAVE.p; if(p&&p.lv===SAVE.lv&&!blocked(p.x,p.z)){ warp(p.x,p.z); P.yaw=p.yaw; } try{ history.replaceState(null,'',location.pathname); }catch(e){} } S.cpReady=true; toast((RESUME?'이어하기 · ':'디버그 · '+key+'. ')+c.name); }
function checkpointList(){ showMsg('디버그 · 방 바로 가기',CHECKPOINTS.slice().sort((a,b)=>a.key.localeCompare(b.key)).map(c=>'<b>Shift+'+c.key+'</b> &nbsp;'+c.name).join('<br>')+'<br><br><span style="opacity:.6">Alt+숫자 : 구역(놀이기구) 위치로만 이동</span>'); }
const DBG={on:false};
function dbgKey(e){ const d=(e.code.match(/Digit(\d)/)||[])[1];
  if(e.altKey&&d!==undefined){ e.preventDefault(); const z=PARK.zones[(+d+9)%10]; if(z){ P.x=z.x; P.z=z.z; P.y=floorAt(z.x,z.z); P.vx=P.vz=0; toast(z.title); } return; }
  if(!e.shiftKey) return;
  if(e.code==='Backquote'){ DBG.on=!DBG.on; $('#dbg').style.display=DBG.on?'block':'none'; }
  if(e.code==='KeyG'){ Object.keys(GATES).forEach(openGate); toast('모든 문 열림 (디버그)'); }
  if(e.code==='KeyN'){ DBG.bright=!DBG.bright; tickSky(0,true); }
  if(e.code==='KeyT'){ if(!S.timerOn) return; timeLeft=Math.max(1,timeLeft-300); toast('공원 시간 +1시간 (디버그)'); tickSky(0,true); }
  if(e.code==='KeyK'&&typeof skipIntro==='function') skipIntro();
  if(e.code==='KeyL') checkpointList();
  if(d===undefined) return; e.preventDefault(); jumpTo(d); }

/* 불러오기 : 입장권이 발권기에서 조금씩 나온다 */
function loadStep(pct,msg){ $('.paper').style.height=Math.round(150*pct/100)+'px'; $('#lpct').textContent=pct+'%'; if(msg) $('#lmsg').textContent=msg; }
/* 시작 화면 : 관람차 살 · 전구 */
(function decorateTitle(){ const sp=$('#spokes'), wb=$('#wbulbs'), NS='http://www.w3.org/2000/svg';
  for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, l=document.createElementNS(NS,'line'); l.setAttribute('x1',0); l.setAttribute('y1',0); l.setAttribute('x2',Math.cos(a)*190); l.setAttribute('y2',Math.sin(a)*190); sp.appendChild(l); }
  for(let i=0;i<32;i++){ const a=i/32*Math.PI*2, c=document.createElementNS(NS,'circle'); c.setAttribute('cx',Math.cos(a)*190); c.setAttribute('cy',Math.sin(a)*190); c.setAttribute('r',5);
    c.style.animationDelay=(i%4)*0.6+'s'; wb.appendChild(c); }
  $('#guide').innerHTML=IS_TOUCH?'왼쪽 끌기 이동 · 오른쪽 끌기 시점 · 물체 탭 조사<br>야간 점검은 아침 6시에 끝납니다.':'근무 안내 · WASD 이동 · 마우스 끌기 시점 · E 조사 · Space 점프 · F 손전등 · M 지도 · I 소지품 · Esc 정지<br>남은 시간 40분 안에 모든 점검을 끝내야 합니다. 공원 시각은 점검을 마칠 때마다 아침 6시를 향해 흐릅니다.'; })();

async function boot(){ try{
    loadStep(8,'공원 불을 켜는 중…'); await buildSky(); loadStep(30,'근무표 확인 중…'); await sleep(30);
    await buildPark(); loadStep(80,'손님 맞을 준비 중…'); if(typeof CROWD!=='undefined'){ loadStep(84,'손님 입장 중…'); await CROWD.build(); }
    for(const r of ROOMS) if(r.build) await r.build();
    PARK.zones.sort((a,b)=>b.z-a.z);   // 남쪽(정문) → 북쪽 순서 = 디버그 단축키 순서
    loadStep(100,'출입증 발급 완료'); camera.position.set(PARK.spawn.x,1.6,PARK.spawn.z); renderer.compile(scene,camera); await sleep(CP?0:500);
    $('#loading').style.transition='opacity .6s'; $('#loading').style.opacity=0; await sleep(CP?0:600); $('#loading').style.display='none';
    if(SAVE&&!CP){ const c=CHECKPOINTS.find(c=>c.key===String(SAVE.lv)), b=$('#resumeBtn'); b.textContent='이어하기 · '+(c?c.name:SAVE.lv+'번째 점검')+' · 남은 시간 '+Math.ceil(SAVE.t/60)+'분'; b.hidden=false;
      b.onclick=()=>{ if(S.phase==='title') location.search='?cp='+SAVE.lv+'&resume=1'; }; }
    if(CP){ S.phase='intro'; AUDIO.init(); ov('#start',false); S.busy=false; intro(); }     // 디버그 바로 가기 : 시작 화면 · 입장권 뜯기 없이 바로
  }catch(e){ console.error(e); $('#lmsg').textContent='불러오기 실패 : '+e.message+(location.protocol==='file:'&&!INLINE?' (개발 버전은 로컬 서버로 열어야 합니다 — README 참고)':''); } }
document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>{ if(S.phase!=='title') return; S.gentle=b.dataset.m==='1'; document.querySelectorAll('#mode button').forEach(x=>x.classList.toggle('on',x===b)); AUDIO.init(); AUDIO.click(); });      // 공포 · 비공포 모드
$('#startBtn').onclick=async()=>{ if(S.phase!=='title') return; S.phase='intro'; AUDIO.init(); if(AUDIO.ctx&&AUDIO.ctx.state==='suspended') AUDIO.ctx.resume();
  $('#startBtn').classList.add('torn'); AUDIO.noise(.25,.3,0,2400); await sleep(700);
  $('#fade').classList.remove('clear'); await sleep(900); AUDIO.wind(); ov('#start',false); S.busy=false; intro(); };
