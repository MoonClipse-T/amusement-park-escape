/* ============================================================
   방 2 : 회전목마 (첫 번째 점검 장소)
   - 입구 옆 조작실(Blender : blender/parts/carousel_booth.py)에 들어가 '회전목마 점검 방법'을 찾는다
   - 조사 대상 : 점검 방법(벽) · 조작반 · 마이크
   ★ 점검 방법 내용 · 다음 문제는 아래 ROOM2 에서 고친다 (지금은 자리만 잡아 둠)
   ============================================================ */
'use strict';
const ROOM2={
  manual:{title:'회전목마 점검 방법',
    body:`<b>야간 점검 순서</b><br>
1. 조작반 전원을 켜기 전에, 말 기둥이 제자리에 고정되어 있는지 확인한다.<br>
2. 점검 결과는 조작반에 입력한다.<br>
3. 점검이 끝나기 전에는 회전목마에 오르지 말 것.<br><br>
<span style="opacity:.6">(이 자리에 회전목마 점검 문제가 들어갑니다 — 준비 중)</span>`},
};
SIGNS.booth_carousel=['회전목마 조작실','CAROUSEL CONTROL · 관계자 외 출입금지','#8e231c','#f2ede2'];

(function(){
  const IN=(x,z)=>x>-20.5&&x<-18.3&&z>12.7&&z<14.9;          // 조작실 안
  ROOMS.push({id:'room2', build(){
    const I=PARK.items, add=(k,name,fn,range=2.4)=>{ if(I[k]) INTER.push({mesh:I[k],name,range,fn}); };
    add('manual_carousel','회전목마 점검 방법',async()=>{ AUDIO.click(); await showMsg(ROOM2.manual.title,ROOM2.manual.body);
      if(!S.flags.manual_carousel){ S.flags.manual_carousel=true; setGoal(null); objective('점검 방법대로 회전목마를 점검하자 (준비 중)'); } });
    add('console_carousel','조작반',()=>{ AUDIO.click(); mono(S.flags.manual_carousel?['전원 레버가 내려가 있다.','점검 방법 순서대로 하자.']:['버튼과 레버가 잔뜩이다.','…함부로 누르기 전에 점검 방법부터 찾자.']); });
    add('mic_carousel','안내 방송 마이크',async()=>{ AUDIO.tone(1800,.4,'sine',.05); await announce('아, 아… 마이크 테스트.',{ms:1600}); await mono('…텅 빈 공원에 내 목소리만 울린다.'); });
  },
  tick(){ if(S.stage==='night'&&S.flags.door_open&&!S.flags.booth_in&&IN(P.x,P.z)){ S.flags.booth_in=true;
      mono(['회전목마 조작실. 창 너머로 말들이 보인다.','점검 방법이 어딘가 붙어 있을 텐데.']); objective('조작실 안에서 점검 방법을 찾자'); } }});
})();
