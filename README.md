# 놀이공원 스릴러 방탈출

놀이공원을 기본 맵으로 하는 1인칭 3D 스릴러 방탈출 게임. 3D 물리엔진 기반, 목표 플레이 시간 약 40분.

## 폴더 구조

| 경로 | 내용 |
|---|---|
| `blender/` | 원본 `.blend` 파일 (맵, 방, 소품) |
| `blender/textures/` | 텍스처 |
| `exports/glb/` | 게임에서 불러올 `.glb` 내보내기 결과 |
| `web/` | 게임 코드 (1인칭 컨트롤, 물리, 퍼즐 로직) |
| `docs/` | 기획 문서 (구역/방 구성, 퍼즐 흐름) |

## 두 PC에서 작업하기 (학교 노트북 / 집 데스크톱)

1. 처음 한 번: `git lfs install` 후 `git clone <저장소 주소>`
2. 작업 시작 전: `git pull`
3. 작업 끝나면: `git add -A && git commit -m "작업 내용" && git push`

- `.blend`, `.glb`, 이미지, 사운드는 Git LFS로 관리됩니다 (`.gitattributes` 참고).
- Git LFS는 `.blend` 파일을 병합할 수 없으므로, 한쪽 PC에서 push하기 전에 다른 PC에서 같은 파일을 수정하지 마세요.
- 이 폴더는 OneDrive 밖(예: `C:\dev\amusement-park-escape`)에 두는 것을 권장합니다. `.git` 폴더가 OneDrive 동기화와 충돌할 수 있습니다.
