"""사람(손님 NPC) 에셋 만들기
  blender -b --python blender/build_people.py

  원본 (blender/source/people/, three.js 저장소 예제 모델) :
    Michelle.glb  — 여성 캐릭터 (Mixamo)
    rpm.glb       — Ready Player Me 아바타 (남성, 옷이 상의 · 하의 · 신발로 나뉨 → 색을 바꿔 여러 명으로)
    Soldier.glb   — 걷기 · 대기 동작만 뽑아 쓴다 (Mixamo 뼈대 이름이 같아 그대로 옮겨 쓸 수 있다)
  결과 (web/assets/) : people_michelle.glb · people_rpm.glb · people_anims.glb(뼈대 + Walk · Idle 동작만)
"""
import bpy, os, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source", "people")
OUT = os.path.join(os.path.dirname(HERE), "web", "assets")

# 1) 동작만 : Soldier 를 읽고 몸 메시는 지운 뒤 뼈대 + Walk · Idle 만 내보낸다
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, "Soldier.glb"))
for o in list(bpy.data.objects):
    if o.type == "MESH":
        bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions):
    if not any(k in a.name for k in ("Walk", "Idle")):
        bpy.data.actions.remove(a)
print("ACTIONS", [a.name for a in bpy.data.actions])
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "people_anims.glb"), export_format="GLB", export_animation_mode="ACTIONS",
                          export_skins=True, export_morph=False, export_cameras=False, export_lights=False)

# 2) 캐릭터 두 명은 원본 그대로 쓴다 (다시 내보내면 뼈대 · 재질이 달라질 수 있어서)
shutil.copy(os.path.join(SRC, "Michelle.glb"), os.path.join(OUT, "people_michelle.glb"))
shutil.copy(os.path.join(SRC, "rpm.glb"), os.path.join(OUT, "people_rpm.glb"))
for f in ("people_anims.glb", "people_michelle.glb", "people_rpm.glb"):
    print("PEOPLE_OK", f, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB")
