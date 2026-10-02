# 루나랜드 — 작업 규칙

1인칭 3D 스릴러 방탈출 (three.js r128). 구조와 실행 방법은 README.md, 시간 흐름과 사건은 docs/map-plan.md 참고.

## 작업 환경 (두 곳을 섞어 쓴다)

| 어디서 | 무엇을 |
|---|---|
| 클라우드 세션 (claude.ai/code) | 게임 코드(`web/`), 퍼즐(ROOMS), 화면, 문서, 빌드. 맵은 Blender 스크립트(백그라운드)로 수정 가능 |
| PC 로컬 (Claude 데스크톱 + Blender MCP) | Blender 에서 눈으로 보며 하는 맵 작업 |

두 곳 모두 이 GitHub 저장소 하나로 이어진다. **작업 시작 전 `git pull`, 끝나면 commit + push.**

## 규칙

- 맵을 바꾸면 `web/assets/park.glb` 를 다시 내보내고 커밋한다. 엔진은 GLB 만 읽는다.
- Blender 오브젝트 이름 규칙을 지킨다 (엔진이 이름으로 읽음):
  `COL_`(사각 충돌) · `COLC_`(원기둥 충돌) · `COL_GATE_<key>`(잠긴 문) · `FLOOR_`(밟는 바닥 높이) ·
  `LAMP_`/`LIGHT_`(점광원, 속성 color·i·d) · `SIGN_<key>`(간판, 속성 w·h) · `ZONE_<id>`(구역, 속성 title·r) ·
  `SPAWN` · `ANIM_carousel` · `ANIM_wheel` · `GONDOLA_`
- glTF 내보낼 때 Custom Properties(extras) 포함.
- 클라우드 Blender 는 4.0.2 (apt). PC 와 주고받는 기준은 `.glb` 로 하고, `.blend` 는 버전 차이에 주의한다.
- Git LFS 는 쓰지 않는다 (클라우드에서 LFS 서버가 막혀 있음). 파일 하나 100MB 미만 유지.
- `dist/` 는 빌드 결과라 커밋하지 않는다 (`python tools/build.py` 로 생성).
- 대사·문구는 한국어.
