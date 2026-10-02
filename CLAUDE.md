# 루나랜드 — 작업 규칙

1인칭 3D 스릴러 방탈출 (three.js r128), 중1 과학 '힘의 작용' 단원 마무리 활동. 구조와 실행 방법은 README.md, 스토리 · 검토 메모는 docs/story.md 참고.
- 과학 내용은 2022 개정 교육과정 성취기준 [9과05-01]~[9과05-04] 범위 안에서, 사실 확인을 거쳐 쓴다.

## 작업 환경 (두 곳을 섞어 쓴다)

| 어디서 | 무엇을 |
|---|---|
| 클라우드 세션 (claude.ai/code) | 게임 코드(`web/`), 퍼즐(ROOMS), 화면, 문서, 빌드. 맵은 Blender 스크립트(백그라운드)로 수정 가능 |
| PC 로컬 (Claude 데스크톱 + Blender MCP) | Blender 에서 눈으로 보며 하는 맵 작업 |

두 곳 모두 이 GitHub 저장소 하나로 이어진다. **작업 시작 전 `git pull`, 끝나면 commit + push.**

## 규칙

- 맵을 바꾸면 `web/assets/park.glb` 를 다시 내보내고 커밋한다. 엔진은 GLB 만 읽는다.
- `blender/build_lunaland_v2.py` 는 v1 맵에서 전부 다시 만든다. Blender 화면에서 직접 고친 뒤에는 스크립트를 다시 돌리지 말거나, 고친 내용을 스크립트에 옮긴다.
- 방은 `web/rooms/roomN_*.js` 로 하나씩 추가하고 `web/index.html` 의 script 목록(main.js 앞)에 넣는다.
- Blender 오브젝트 이름 규칙을 지킨다 (엔진이 이름으로 읽음):
  `COL_`(사각 충돌) · `COLC_`(원기둥 충돌) · `COL_GATE_<key>`(잠긴 문) · `FLOOR_`(밟는 바닥 높이) ·
  `LAMP_`/`LIGHT_`(점광원, 속성 color·i·d) · `SIGN_<key>`(간판, 속성 w·h) · `ZONE_<id>`(구역, 속성 title·r) ·
  `SPAWN` · `SPAWN_<id>`(시작 위치) · `SPOT_<id>`(NPC 위치) · `IT_<id>`(조사 대상) · `ANIM_<id>`(움직이는 축: carousel, wheel, dormdoor, rabbithead) · `GONDOLA_`
- glTF 내보낼 때 Custom Properties(extras) 포함.
- 클라우드 Blender 는 4.0.2 (apt). PC 와 주고받는 기준은 `.glb` 로 하고, `.blend` 는 버전 차이에 주의한다.
- Git LFS 는 쓰지 않는다 (클라우드에서 LFS 서버가 막혀 있음). 파일 하나 100MB 미만 유지.
- `dist/` 는 빌드 결과라 커밋하지 않는다 (`python tools/build.py` 로 생성).
- 대사·문구는 한국어.
