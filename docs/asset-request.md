# 에셋 받아오기 (PC 로컬 · Blender MCP 용)

이 파일은 **PC 의 Claude 데스크톱(로컬) + Blender MCP** 에서 읽고 따라 하는 작업 목록이다.
클라우드 세션은 Sketchfab · Poly Haven 에 접속할 수 없어서, 받는 일은 PC 에서 하고 GitHub 로 넘긴다.

## 저장 규칙

- 받은 모델은 **GLB 한 파일**로 내보내 `blender/source/downloads/` 에 둔다.
  - 파일 이름 : 영어 소문자_밑줄 (예: `plush_rabbit.glb`, `person_casual_01.glb`)
  - 크기 : 파일 하나 **50MB 미만** (GitHub 은 100MB 부터 거부, 50MB 부터 경고). 텍스처는 2K 이하로.
  - 내보낼 때 : Format = glTF Binary(.glb), Apply Modifiers 켜기, 사람은 Armature · Animation 포함
- 같은 폴더의 `SOURCES.md` 에 한 줄씩 적는다 : 파일명 · 출처 URL · 작가 · 라이선스
  - Poly Haven 은 전부 CC0 (표기 의무 없음)
  - Sketchfab 은 모델마다 다르다. **CC0 · CC-BY 만** 받는다 (CC-BY 는 작가 이름 표기 필요). NC(비영리) · ND 는 피한다.
- 좌표 · 크기는 신경 쓰지 않아도 된다 (클라우드에서 맞춘다). 단, 실제 크기(미터)로 내보내면 좋다.

## 받을 목록 (우선순위 순)

| # | 파일 이름 | 무엇 | 어디서 | 메모 |
|---|---|---|---|---|
| 1 | `person_*.glb` (3~6개) | 걷는 사람 (리깅 된 캐주얼 복장 남녀, 아이 1명 이상) | Sketchfab "rigged character casual" | Mixamo 뼈대면 가장 좋다. Walk · Idle 애니메이션이 들어 있으면 더 좋다 |
| 2 | `plush_rabbit_ref.glb` | 흰 토끼 봉제인형 (참고 · 교체 후보) | Sketchfab "bunny plush" | 지금 직접 만든 인형과 비교해서 고른다 |
| 3 | `icecream_cart.glb` | 아이스크림 수레 · 가판대 | Sketchfab "ice cream cart / stand" | |
| 4 | `carousel.glb` | 회전목마 | Sketchfab "carousel" | 지금 맵의 회전목마 교체 후보 |
| 5 | `locker_tall.glb`, `office_desk.glb`, `office_chair.glb` | 숙소용 긴 사물함 · 책상 · 의자 | Poly Haven Models | |
| 6 | `tree_*.glb` (2~3종) | 활엽수 | Poly Haven Models | |
| 7 | 텍스처 (`*_2k.jpg`) | 보도블록 · 페인트 벽 · 나무판 | Poly Haven Textures | `blender/source/downloads/textures/` |

## 다 받았으면

```
git add blender/source/downloads
git commit -m "Add downloaded assets"
git push
```
클라우드 세션에 "에셋 올렸어" 라고 말하면 맵 · 게임에 붙인다.
