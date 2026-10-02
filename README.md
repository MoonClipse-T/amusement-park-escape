# 루나랜드 — 야간 개장

놀이공원을 기본 맵으로 하는 1인칭 3D 스릴러 방탈출 게임.
저녁 7시 야간 개장부터 새벽 3시까지, 공원에서 벌어지는 일들을 따라간다. 목표 플레이 시간 약 40분.

- 엔진 : three.js r128 (1인칭 이동 · 충돌 · 레이캐스트 조사) + Blender 맵(GLB)
- 시간 : 실제 40분 = 공원 시간 19:00 → 03:00 (실제 1분 = 공원 12분)

## 폴더 구조

| 경로 | 내용 |
|---|---|
| `web/index.html` | 화면 구성 (시작 · 불러오기 · HUD · 시간 카드 · 방송 · 지도 · 쪽지 · 정지 · 실패 · 성공) |
| `web/style.css` | 화면 스타일 |
| `web/game.js` | 엔진 · 공원 시계와 사건표(EVENTS) · 하늘 · 맵 읽기 · 방(ROOMS) |
| `web/vendor/` | three.js r128, GLTFLoader |
| `web/assets/` | `park.glb` (Blender 맵), `sky.jpg` (반사광용 HDRI) |
| `tools/build.py` | 전부 묶어서 `dist/lunaland.html` 한 파일로 만든다 |
| `blender/` | 원본 `.blend` 파일 |
| `docs/` | 기획 문서 |

## 실행

**개발 중** (파일을 고치면서 바로 확인) — `web/` 폴더에서 로컬 서버를 띄운다.
```
cd web
python -m http.server 8000
```
브라우저에서 http://localhost:8000 을 연다. (`index.html` 을 더블클릭하면 맵을 못 읽는다.)

**배포용 한 파일** — 서버 없이 더블클릭으로 열린다.
```
python tools/build.py      # → dist/lunaland.html
```

## 제작용 단축키

Shift+D 정보 · Shift+1~0 구역 이동 · Shift+G 모든 문 열기 · Shift+N 밝게 보기 · Shift+T 공원 시간 +1시간

## 방(퍼즐) 붙이는 법

`game.js` 의 `ROOMS` 에 추가한다.
```js
ROOMS.push({ id:'haunted',
  async build(){ /* 물체 만들고 INTER.push({mesh,name,fn}) */ },
  tick(dt){ } });
```
- 구역 위치 : `PARK.zones.find(z=>z.id==='haunted')`
- 잠긴 문 열기 : `openGate('haunted')` (Blender 의 `COL_GATE_haunted`)
- 특정 시각에 사건 : `EVENTS.push({at:23*60, fn:()=>announce('…')})`
- 연출 : `card('23:00','제목','부제')` · `announce('방송 문구',{broken:true})` · `mono(['대사'])` · `showMsg('쪽지 제목','내용')`
- 끝내기 : `gameClear('엔딩 문장')` / 시간이 다 되면 자동으로 실패 화면

## 두 PC에서 작업하기 (학교 노트북 / 집 데스크톱)

1. 처음 한 번 : `git clone https://github.com/MoonClipse-T/amusement-park-escape`
2. 작업 시작 전 : `git pull`
3. 작업 끝나면 : `git add -A` → `git commit -m "작업 내용"` → `git push`

- Git LFS 는 쓰지 않는다 (클라우드 세션에서 LFS 서버 접속이 막혀 있다). 파일 하나가 100MB 를 넘으면 GitHub 에 올라가지 않으니, `.blend` 는 텍스처를 외부 파일로 빼서 가볍게 유지한다.
- `.blend` 는 합칠 수 없으니, 한쪽 PC 에서 push 하기 전에 다른 PC 에서 같은 파일을 고치지 않는다.
- 저장소 폴더는 OneDrive 밖(예: `C:\dev\`)에 두는 것을 권장한다.
