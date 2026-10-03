# 루나랜드 — 야간 알바

놀이공원을 기본 맵으로 하는 1인칭 3D 스릴러 방탈출 게임 (중1 과학 '힘의 작용' 단원 마무리 활동).
루나랜드 일일 알바생이 되어 저녁 아이스크림 판매를 마치고, 밤새 공원을 점검하며 괴담의 진실을 파헤친다.
스토리 설정 · 검토 메모는 [docs/story.md](docs/story.md).

- 엔진 : three.js r128 (1인칭 이동 · 충돌 · 레이캐스트 조사) + Blender 맵(GLB)
- 시간 : 인트로(19:00~22:00 판매)는 이야기로 진행, 22:00 부터 실제 40분 = 공원 22:00 → 06:00

## 폴더 구조

| 경로 | 내용 |
|---|---|
| `web/index.html` | 화면 구성 (시작 · 불러오기 · HUD · 시간 카드 · 방송 · 지도 · 쪽지 · 정지 · 실패 · 성공) |
| `web/style.css` | 화면 스타일 |
| `web/game.js` | 엔진 : 이동 · 충돌 · 조사 · 화면 · 공원 시계 · 하늘(보름달) · 맵 읽기 · 번호 자물쇠 · 목적지 화살표 |
| `web/crowd.js` | 저녁 손님 NPC |
| `web/story.js` | 인트로(아이스크림 판매) · 22:00 마감 · 자정 등 밤의 사건 |
| `web/rooms/room1_dorm.js` | 방 1 : 직원 숙소 — 사물함 · 열쇠 · 장력 평형 잠금장치 (글 · 정답은 맨 위 `ROOM1`) |
| `web/rooms/room2_carousel.js` | 방 2 : 회전목마 — 조작반 · 용수철저울로 말의 중력 재기 (`ROOM2`) |
| `web/rooms/room3_bumper.js` | 방 3 : 범퍼카 — 마찰력 측정 · 윤활유 (`ROOM3`) |
| `web/rooms/room4_coaster.js` | 방 4 : 롤러코스터 = 후룸라이드 — 잠긴 조작실 키패드 · 직접 타기 · 크레인 힘 센서로 부력 재기 · 모래주머니로 무게 맞추기 (`ROOM4`) |
| `web/main.js` | 시작 |
| `web/vendor/` | three.js r128, GLTFLoader |
| `web/assets/` | `park.glb` (Blender 맵), `sky.jpg` (반사광용 HDRI) |
| `tools/build.py` | 전부 묶어서 `dist/lunaland.html` 한 파일로 만든다 |
| `blender/build_lunaland_v2.py` | 맵 만드는 스크립트 : v1 맵(`blender/source/park_v1.glb`) + 숙소 · 판매대 · 달토끼 동상 · 전구 줄 · 나무 등 → `web/assets/park.glb` |
| `blender/parts/` | 맵 부품 : `rabbit_plush.py`(달토끼 봉제인형) · `icecream_kiosk.py`(판매대) · `trees.py`(Sapling 나무) · `catalog_props.py`(카탈로그 소품 배치) · `dorm_dress.py`(숙소 벽 · 바닥 · 소품) · `carousel_booth.py`(조작실 · 회전목마 고치기) · `bumper_cars.py`(범퍼카 6대) |
| `blender/source/` | 원본 : v1 맵 · `catalog_props.glb`(Higgsfield 3D 카탈로그 소품) · `people/`(사람 모델) · `polyhaven/`(숙소 소품) |
| `blender/build_people.py` | 손님 모델 → `web/assets/people_*.glb` |
| `tools/optimize_glb.py` | GLB 압축 (glTF-Transform, Node.js 필요) |
| `blender/lunaland_v2.blend` | 위 스크립트 결과 (Blender 로 열어 볼 수 있음) |
| `docs/` | 기획 문서 |

## 실행

**온라인** — https://moonclipse-t.github.io/amusement-park-escape/ (`git subtree push --prefix web origin gh-pages` 후 1~2분 뒤 반영)

**개발 중** (파일을 고치면서 바로 확인) — `web/` 폴더에서 로컬 서버를 띄운다.
```
cd web
python ../tools/serve.py      # 캐시를 끈 개발 서버 (python -m http.server 8000 도 되지만 고친 파일이 늦게 반영될 수 있다)
```
브라우저에서 http://localhost:8000 을 연다. (`index.html` 을 더블클릭하면 맵을 못 읽는다.)

**배포용 한 파일** — 서버 없이 더블클릭으로 열린다.
```
python tools/build.py      # → dist/lunaland.html
```

## 맵 다시 만들기

```
blender -b --python blender/build_lunaland_v2.py
python tools/optimize_glb.py web/assets/park.glb      # 선택 : 17MB → 13MB
```
- 이 스크립트는 **v1 맵에서 처음부터 다시** 만든다. Blender 화면에서 직접 고친 내용은 덮어쓰므로,
  직접 고칠 때는 `blender/lunaland_v2.blend` 를 열어 고치고 `web/assets/park.glb` 로 내보낸 뒤 스크립트는 다시 돌리지 않는다
  (또는 고친 내용을 스크립트에 옮겨 적는다).

## 제작용 단축키 · 주소

**방(퍼즐) 바로 가기** — 앞 단계를 모두 끝낸 상태로 새로 불러와 그 자리로 간다 (주소 끝 `?cp=번호` 와 같음)

| 키 | 바로 가기 |
|---|---|
| Shift+1 | 숙소 (22:00 시작) |
| Shift+2 | 회전목마 조작실 |
| Shift+3 | 범퍼카 조작실 |
| Shift+4 | 롤러코스터(후룸라이드) 조작실 앞 |
| Shift+L | 바로 가기 목록 |

그 밖 : Alt+1~0 구역 위치로만 이동 · Shift+D 정보 · Shift+G 모든 문 열기 · Shift+N 밝게 보기 · Shift+T 공원 시간 +1시간 · Shift+K 인트로 건너뛰기
주소 끝에 `?night` 를 붙이면 (`index.html?night`) 22:00 부터 시작한다.

## 방(퍼즐) 붙이는 법

`game.js` 의 `ROOMS` 에 추가한다.
```js
ROOMS.push({ id:'haunted',
  async build(){ /* 물체 만들고 INTER.push({mesh,name,fn}) */ },
  tick(dt){ } });
```
- 맵의 물체 : Blender 이름 `IT_<id>` → `PARK.items.<id>` (조사 대상), `SPAWN_<id>` / `SPOT_<id>` → `PARK.spawns` / `PARK.spots`, `ANIM_<id>` → `PARK.anim`
- 구역 위치 : `PARK.zones.find(z=>z.id==='haunted')`
- 잠긴 문 열기 : `openGate('haunted')` (Blender 의 `COL_GATE_haunted`)
- 특정 시각에 사건 : `EVENTS.push({at:23*60, fn:()=>announce('…')})`
- 연출 : `card('23:00','제목','부제')` · `announce('방송 문구',{broken:true})` · `mono(['대사'],'말하는 사람')` · `showMsg('쪽지 제목','내용')`
- 문제 : `keypad({title,len:4,check:c=>c==='1234'})` · 목적지 화살표 `setGoal(x,z,'이름')` · 할 일 `objective('…')`
- 끝내기 : `gameClear('엔딩 문장')` / 시간이 다 되면 자동으로 실패 화면

## 두 PC에서 작업하기 (학교 노트북 / 집 데스크톱)

1. 처음 한 번 : `git clone https://github.com/MoonClipse-T/amusement-park-escape`
2. 작업 시작 전 : `git pull`
3. 작업 끝나면 : `git add -A` → `git commit -m "작업 내용"` → `git push`

- Git LFS 는 쓰지 않는다 (클라우드 세션에서 LFS 서버 접속이 막혀 있다). 파일 하나가 100MB 를 넘으면 GitHub 에 올라가지 않으니, `.blend` 는 텍스처를 외부 파일로 빼서 가볍게 유지한다.
- `.blend` 는 합칠 수 없으니, 한쪽 PC 에서 push 하기 전에 다른 PC 에서 같은 파일을 고치지 않는다.
- 저장소 폴더는 OneDrive 밖(예: `C:\dev\`)에 두는 것을 권장한다.

## 에셋 출처

- 사람 : Quaternius 'Ultimate Animated Character Pack' (CC0) — https://poly.pizza (Animated Woman · Casual Character · Business Man · Hoodie Character · Animated Woman 드레스)
- 숙소 · 조작실 소품 : Poly Haven (CC0) — 소파 · 탁자 · 전기 주전자 · 무전기 · 철제 선반 · 상자 · 빗자루 · 소화기 · 화분 · 손전등 · 공구함 · 플라스틱 의자
- 가방 : Quaternius "Backpack" (CC0) · 열쇠 : iPoly3D "Key" (CC0) · 근무복 : Polygonal Mind "Jacket" (CC0) — poly.pizza
- 안내 방송 목소리 : Microsoft Edge 신경망 음성 (edge-tts 로 생성, web/assets/voice/) — 마감 방송 ko-KR-SunHi · 마이크 테스트(주인공) ko-KR-InJoon
- Sketchfab (CC BY) : "Rabbit plush / Conejo Peluche" by afzmtm · "Old Iron Kettlebell" by tomarranskinner · "FNAF SB | Foxy Logride Assets" by KPMisParrot (통나무 보트 · 물길만) · "CC0 - Keypad Door Lock" by plaggy · "Gantry Portica" by speedtwo · "Sandbag [Low Poly Realist]" by Islide (blender/source/sketchfab/)
- 소품 : Higgsfield 3D 카탈로그 (FoodCart · MarketStall · CafeTable · BeachUmbrella · PlazaBench · RecyclingBin · FlowerCart)
- 달토끼 인형 · 판매대 · 나무 : Blender 스크립트로 직접 생성 (`blender/parts/`)
- 배포 전에 각 에셋의 이용 조건을 한 번 확인할 것
