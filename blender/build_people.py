"""사람(손님 NPC) 에셋 만들기
  blender -b --python blender/build_people.py

  원본 (blender/source/people/q_*.glb) : Quaternius 'Ultimate Animated Character Pack' (CC0, poly.pizza)
    q_woman · q_dress · q_man · q_suit · q_hoodie — 모두 같은 뼈대(CharacterArmature)와 동작 24개를 가진다
  결과 (web/assets/people_<이름>.glb) : 동작은 Walk · Idle · Wave 만 남겨 가볍게 한다
  옷 색은 재질 이름(Shirt · Pants · Hair …)으로 엔진(crowd.js)이 사람마다 바꾼다
"""
import bpy, os, glob
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source", "people")
OUT = os.path.join(os.path.dirname(HERE), "web", "assets")
KEEP = ("Walk", "Idle", "Wave")

for src in sorted(glob.glob(os.path.join(SRC, "q_*.glb"))):
    key = os.path.basename(src)[2:-4]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    for a in list(bpy.data.actions):
        short = a.name.split("|")[-1]
        if short in KEEP:
            a.name = short
        else:
            bpy.data.actions.remove(a)
    out = os.path.join(OUT, f"people_{key}.glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_animation_mode="ACTIONS",
                              export_skins=True, export_morph=False, export_cameras=False, export_lights=False)
    print("PEOPLE_OK", key, [a.name for a in bpy.data.actions], os.path.getsize(out) // 1024, "KB")
