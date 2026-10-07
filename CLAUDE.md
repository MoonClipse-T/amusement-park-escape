# 루나랜드 — 작업 규칙

1인칭 3D 스릴러 방탈출 (three.js r128), 중1 과학 '힘의 작용' 단원 마무리 활동. 구조와 실행 방법은 README.md, 스토리 · 검토 메모는 docs/story.md 참고.
- 과학 내용은 2022 개정 교육과정 성취기준 [9과05-01]~[9과05-04] 범위 안에서, 사실 확인을 거쳐 쓴다.

## 작업 환경 (두 곳을 섞어 쓴다)

| 어디서 | 무엇을 |
|---|---|
| PC 로컬 (Claude 데스크톱 + Blender MCP) — **주 작업 환경** | 게임 코드 · 맵 · 에셋 받기 · 빌드 전부. Blender 5.2 |
| 클라우드 세션 (claude.ai/code) | 코드 · 문서만 (Blender · 에셋 사이트가 막혀 있음) |

두 곳 모두 이 GitHub 저장소 하나로 이어진다. **작업 시작 전 `git pull`, 끝나면 commit + push.**
사이트 반영 : `git subtree push --prefix web origin gh-pages` (`web/` 만 gh-pages 브랜치로) → https://moonclipse-t.github.io/amusement-park-escape/

**수정할 때마다 (선생님 요청)** : ① commit + main push ② gh-pages 반영 ③ `python tools/build.py` → `dist/lunaland.html` 을 저장소 바깥 `프로젝트_놀이공원/lunaland_vN.html` (번호 하나씩 올림)로 복사 ④ 사이트 주소와 html 파일을 선생님께 공유

## 규칙

- 맵을 바꾸면 `web/assets/park.glb` 를 다시 내보내고 커밋한다. 엔진은 GLB 만 읽는다.
- `blender/build_lunaland_v2.py` 는 v1 맵에서 전부 다시 만든다. Blender 화면에서 직접 고친 뒤에는 스크립트를 다시 돌리지 말거나, 고친 내용을 스크립트에 옮긴다.
- 소품은 직접 상자로 쌓지 말고 **Sketchfab**(Blender MCP 에 API 키 연결됨, CC BY 는 SOURCES.md 에 작가 표기) · Poly Pizza · Poly Haven 모델을 먼저 쓴다. 받은 모델은 blender/source/sketchfab/ 에 GLB 로 저장하고 optimize_glb.py 로 줄인다. 없으면 Blender 로 둥글게(Bevel · Torus · Subdivision) 모델링한다.
- 놀이기구 조작실은 `carousel_booth.py` 의 `_Booth` · `_booth_shell` 로 짓는다 (자리 · 각도만 바꿔 재사용). 후룸라이드 조작실 · 물길 · 스플래시 풀은 `flume_ride.py`, 자이로드롭 탑 · 탑승 의자(ANIM_gyro) · 조작실은 `gyro_drop.py`, 관람차 조작실은 `ferris_booth.py`, 바이킹 · 바이킹 조작실(유령의 집 자리, ANIM_viking)은 `viking_ride.py`, 광장 달토끼 자리(받침대 · 절구)는 `moon_rabbit.py`
- 달토끼는 맵과 따로인 캐릭터 모델 `web/assets/moonrabbit.glb` (`moon_rabbit_char.py` 를 Blender 에서 수동 실행 — 뼈 root · hips · head · arm/leg_L/R, 동작 Idle · Walk · Run · 입 shape key 'open' = morph target 0, 벌린 정도는 `JAW`). 엔진은 `MOONRABBIT.make(동작)` 로 세우고 `o.userData.play('Walk')` 로 동작을 바꾼다. 얼굴은 `MOONRABBIT.face(o, 0~1)` : 0 평소(귀여운 얼굴) ↔ 1 공포(얼굴 절반을 덮는 웃는 입 rabbit_hmouth · 피 묻은 송곳니, 코 · 눈썹 숨김, 눈은 위로 올라감 — 사이 값은 벌어지는 중). **동상은 평소 얼굴, 움직이는 달토끼는 공포 얼굴로 고정.**
- 위치가 있는 부모(원기둥 · 빈 물체)에 자식을 붙일 땐 `_kids` 가 아니라 `_keep`(carousel_booth.py) · `_adopt`(gyro_drop.py)를 쓴다 — `_kids` 만 쓰면 자식이 부모 위치만큼 밀려나 엉뚱한 곳 공중에 뜬다 (v23 에서 고친 마이크 · 레버).
- 학생들은 주로 **태블릿(디벗) 터치**로 한다 : 새 조작은 터치 버튼으로도 되게 만들고, 누르는 자리는 넉넉하게 (작은 물체는 보이지 않는 PICK 상자를 덧댄다).
- 맵 부품은 `blender/parts/*.py` 에 나눠 둔다. 새 소품은 도형을 직접 쌓기 전에 카탈로그 · 기존 모델을 먼저 찾고, 직접 만들 땐 모서리 깎기 · 매끈한 음영을 쓴다.
- 손님은 Quaternius CC0 캐릭터 (`blender/source/people/q_*.glb`, 같은 뼈대) → `blender/build_people.py` 로 Walk · Idle · Wave 만 남긴다. 옷 색은 crowd.js `TINT` 가 재질 이름으로 바꾼다. 사람 GLB 는 압축(quantize)하지 않는다.
- **배경 합치기 (태블릿 성능)** : 엔진이 불러올 때 움직이지 않는 배경을 같은 재질끼리 하나로 합친다 (game.js `mergeStatic` — 공원 바닥은 48 m 칸별, 놀이기구 축 `ANIM_` · `GONDOLA_` 안은 그 축의 자식으로). 합치지 않는 것 : `IT_` · `SIGN_` · 투명 재질 · morph 메시 · 숨겨진 것. **코드에서 맵 물체를 움직이거나 숨기거나 재질을 따로 바꾸려면 반드시 `IT_`(또는 `ANIM_`) 이름을 붙인다** — 아니면 합쳐져서 찾을 수 없다. 확인용 : `?nomerge` (끄기) · `?mergetest` (`__setMerge(true/false)` 로 전후 비교)
- 맵 GLB 는 quantize 되어 있어서 r128 레이캐스트가 빗나간다. 엔진이 조사 대상(`IT_`)만 좌표를 풀어 둔다 (game.js `dequant`). 조사할 물체는 꼭 `IT_` 로 이름 짓는다.
- 방을 만들면 디버그 바로 가기도 붙인다 : 방 스크립트에서 `CHECKPOINTS.push({key:'숫자', name, go(){ 앞 단계 끝낸 상태 만들기 → warp(…) }})` (**방마다 하나, 방 번호 = Shift+숫자** : 1 숙소 · 2 회전목마 · 3 범퍼카 · 4 후룸라이드 · 5 자이로드롭 · 6 관람차 · 7 바이킹 … 방 입구(그 앞 방을 다 끝낸 상태)로 간다. 세세한 단계는 만들지 않는다. README 표 갱신 · Shift+L 목록)
- 방은 `web/rooms/roomN_*.js` 로 하나씩 추가하고 `web/index.html` 의 script 목록(main.js 앞)에 넣는다.
- Blender 오브젝트 이름 규칙을 지킨다 (엔진이 이름으로 읽음):
  `COL_`(사각 충돌) · `COLC_`(원기둥 충돌) · `COL_GATE_<key>`(잠긴 문) · `FLOOR_`(밟는 바닥 높이) · `FLOORC_`(원형 바닥, 점프해야 오름) ·
  `LAMP_`/`LIGHT_`(점광원, 속성 color·i·d) · `SIGN_<key>`(간판, 속성 w·h) · `ZONE_<id>`(구역, 속성 title·r) ·
  `SPAWN` · `SPAWN_<id>`(시작 위치) · `SPOT_<id>`(NPC · 목적지 위치, 예: SPOT_booth_bumper) · `IT_<id>`(조사 대상) · `ANIM_<id>`(움직이는 축: carousel, wheel, dormdoor, rabbithead, cbdoor, gyro, viking) · `GONDOLA_`
- glTF 내보낼 때 Custom Properties(extras) 포함.
- `.blend` 는 PC 의 Blender 5.2 로 저장되어 있다 (클라우드의 4.0.2 로는 열리지 않을 수 있음). 맵을 고친 뒤 : `.blend` 저장 → `park.glb` 내보내기(extras 포함, 모디파이어 적용) → `python tools/optimize_glb.py web/assets/park.glb`
- Git LFS 는 쓰지 않는다 (클라우드에서 LFS 서버가 막혀 있음). 파일 하나 100MB 미만 유지.
- `dist/` 는 빌드 결과라 커밋하지 않는다 (`python tools/build.py` 로 생성).
- 대사·문구는 한국어.
- 점검 방법 같은 공식 안내문은 `DOC([...단계], 참고)` 로 쓴다 (game.js — 번호 체크리스트 모양, '!' 로 시작하면 빨간 마지막 단계). 벽 포스터는 SIGNS 의 manual_ 키가 자동으로 TEX.poster 로 그려진다.
- 설명 글은 짧게 : 한 줄에 한 동작, 핵심 낱말만 굵게. 리모컨 · 화면 안내는 '1단계 · 2단계 / ① ②' 로.
- 자이로드롭(방 5) 전원을 켜면 **불이 전부 꺼진다** — 정전이 아니라 '불이 꺼진 것'으로만 말한다 (room5 `blackout()` : 비상 전원 없음, 조작실 안도 깜깜하고 브레이크 힘 화면의 초록 글씨만 남는다 · 하늘빛도 어두워진다 · 광장 달토끼 동상이 사라진다 · `S.blackout`). 그 뒤는 어둠 + 손전등이 기본.
- **달토끼 추격은 `web/hunt.js` 의 `HUNT`** (방 5 두 번째 탑승에서 내려온 뒤 `HUNT.start()` — 그 전에는 어떤 웃음소리도 내지 않는다). 규칙 : **어둠 속에서만** 나타난다 — 달빛(`HUNT.MOON`, 하늘에서 비스듬히 내려오는 푸른 빛기둥) 안에 서 있으면 공격하지 못한다 · 조작실 · 놀이기구(`HUNT.SAFE`) 안으로는 못 들어오지만, 조작실 안에 있으면 **창(문) 바깥에 바짝 붙어 들여다보다가 `PEEK`(3)초 안에 비추기 시작하지 못하면 창을 깨고 덮친다 (비추는 동안은 멈추고 `NEED` 3초 계속 비추면 사라진다)**(창 자리는 SAFE 의 `b` = 부스 좌표 원점 · 각도로 계산 `winSpots` · 조작실 안이면 `BOOTH_AWAY` 30 ~ 60초마다, 밖에서는 `AWAY` 9 ~ 18초마다 온다) · 달빛 가장자리(반지름 ×1.2 + 0.5 m)까지도 들어오지 않고 빙 돌아온다 · `RADIUS` m 안으로 오면 **웃는다**(sfx laugh 한 가지 목소리) · **손전등으로 `NEED`(3)초 이상** 비추면 어둠 속으로 사라진다 · 안 비추고 `GRACE`(3)초가 지나면 **달려들어 입을 크게 벌리고 삼킨다**(`bite` : 모델 morph target 0 'open' — 달려옴 → 멈춰 노려봄 → 고개를 젖히며 턱이 빠지듯 벌어짐 → 덮침 → 암전 → '잡아먹혔다' → 마지막 조작실에서 다시 시작, **시간은 줄지 않고 독백도 없다**) · 04:00 붉은 달(`S.redMoon`) 뒤에는 달빛이 소용없다. 규칙 힌트는 김근수의 일지 ①~⑤(`SCRAPS`) 가 하나씩 주고, ④ 를 읽으면 그동안 모은 쪽지가 한 화면에 하나씩 펼쳐진다(`scrapWall`). 유인은 뺐다. 새 조작실 · 놀이기구를 지으면 `HUNT.SAFE` 에 넣는다.
- **움직임 · 연출은 '자연스러움'이 가장 중요하다 (선생님 강조)** : 실제 움직임처럼 — 이어 붙인 티가 나거나 도형이 늘어나는 식(예: 팔이 쭉 늘어나는 원통)이면 차라리 만들지 않는다. 위치 · 각도는 늘 부드러운 곡선으로, 단계가 바뀌어도 속도가 튀지 않게, 모델에 실제로 그 모양을 만들어(shape key · 뼈) 움직인다. 만들고 나면 단계마다 화면을 찍어 확인한다.
- 문제 · 점검 방법에 **답을 미리 적지 않는다** (예: '빠르기는 건드리지 않는다', '중력보다 커야 움직인다'). 판단할 거리는 학생이 직접 보고 고르게 — 밖에서 직접 지켜봐야(관람차 `ROOM6.watch` 초) 독백이 나온다.
- **달토끼의 눈은 늘 까만색** (빨갛게 빛나는 효과는 쓰지 않는다). 동상은 완전히 멈춰 있다 (`MOONRABBIT.make(동작, true)`).
- 조작반은 `gyro_drop.py` 의 `_console(b, tag, k)` 로 짓는다 : 전원 장치(`IT_<k>power` · `IT_<k>lamp`)와 조절 장치(`IT_<k>force` 다이얼 · `IT_<k>screen` 화면)가 따로 보인다. 화면 그림은 엔진 `screenOn()` 으로 그린다.
- 김근수의 일지는 **찢어진 쪽지** 모양 : 글은 `TORN(html)` 로 감싸 `showMsg` · `INV.note` 에 넘긴다. 바닥에 놓는 조각은 hunt.js `SCRAPS`.
- 효과음은 ElevenLabs(연동됨, sfx 노드 `eleven_text_to_sound_v2`)로 만들어 `web/assets/sfx/<key>.mp3` 에 두고 `AUDIO.sfx(key, 크기)` 로 쓴다 (build.py 가 자동으로 묶는다).
- **공원 시각은 점검 진행으로 간다** (game.js `CLOCK_MILES` · `S.clock`) — 남은 시간(실제 40분, `timeLeft`)과 따로. 점검을 끝내면 그 시각(회전목마 23:00 · 범퍼카 00:00 · 후룸라이드 01:30 · 자이로드롭 02:30 · 관람차 04:00 · 바이킹 일지 ⑥ 05:30 · 엔딩 06:00)으로 넘어가고, 그 사이엔 천천히 흐르다 다음 시각 5분 전에서 기다린다. 새 사건은 이 시각에 맞춰 `EVENTS` 에 건다. 남은 시간 0 = 실패 엔딩(`gameOver` — 다음 보름 전단).
- **방 7 바이킹 = 엔딩** : 무선 조종기(`IT_vremote`)를 들고 배에 타서 [밀기]를 배가 가장 빠를 때(가장 낮은 곳) 눌러 높이 띄운다. 달토끼가 따라 타 좌석(`BENCH_X` · `ROOM7.rows`)을 한 턴(동쪽 끝이 꼭대기에 닿을 때)에 한 줄씩 넘어 오고, 꼭대기가 점검 높이 이상이면 햇빛을 받아 돌로 굳는다(`ROOM7.hits` 4번 → 부서짐 → 06:00 해돋이 · `gameClear`). 내 앞 줄까지 오면 덮친다 → 승강대(배에 타기 직전)에서 다시. 바이킹 조작실의 점검 방법 포스터는 지워져 있고 그 위에 일지 ⑥ 이 꽂혀 있다(`eraseManual`).
- 새벽 4시 정각에 **달이 바로 눈을 뜨고 붉어진다** (game.js 하늘 셰이더 `eye` — 젖은 흰자 · 핏줄 · 결 있는 홍채 · 동공 · 눈꺼풀 · 반사광, 눈동자가 휙휙 움직이고 가끔 깜빡인다 · `S.redMoon`). 조작실 · 숙소 안이면 "밖으로 나가 달을 보자" → 밖에 나가면 시야가 달(하늘 돔 위 실제 자리)을 향하고 크게 당겨진다 (story.js). 그 뒤로는 손전등뿐.
- 작업하면서 더 좋은 결과에 필요한 도구 · 에셋 · 연동(유료 포함)이 보이면 선생님께 꼭 먼저 말씀드린다 (선생님이 바로 구입 · 연결해 주신다).
