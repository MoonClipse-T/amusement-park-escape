"""광장 달토끼 동상 — 새 디자인 : 오래된 천 토끼 인형 (Sketchfab "Old Patchwork Bunny" by AVOPLAYDEODD, Sketchfab Standard 무료)

  build_rabbit() (rabbit_plush.py, 복셀로 만든 귀여운 인형) 로 세운 동상을 지우고 같은 받침대 위에 새 인형을 앉힌다.
  - 인형 전체를 ANIM_rabbithead 아래에 둔다 → 엔진이 자정에 인형째 고개(몸)를 돌린다 (story.js tickRabbit)
  - 절구 · 떡(rabbit_mortar · rabbit_mortar_in)은 인형 옆에 남긴다
  - 공포 연출(room4)이 입을 정확히 맞추도록, 입 · 머리 폭을 재서 ANIM_rabbithead 에 적어 둔다 (glTF extras)
      rabbit_mouth_mark : 입 가운데에 둔 빈 물체 (ANIM_rabbithead 아래) · 속성 head_w = 입 높이에서 머리 폭 (m)
  dorm_dress.py 의 _prop · _box 등 도우미를 쓴다 (build 스크립트가 parts 를 차례로 exec).
"""
import bpy, math, mathutils

RABBIT_XZ = (-11.0, 17.5)        # 받침대 가운데 (게임 좌표) — build_lunaland_v2.py 의 RX, RZ
RABBIT_TOP, RABBIT_H = 0.9, 2.3  # 받침대 윗면 높이 · 인형 높이 (앉은 키)


def build_moon_rabbit():
    hd = bpy.data.objects["ANIM_rabbithead"]
    for o in list(hd.children_recursive):
        bpy.data.objects.remove(o, do_unlink=True)
    for n in ("rabbit_body", "rabbit_seam", "rabbit_padL", "rabbit_padR", "rabbit_ribbon_knot", "rabbit_ribbon_L", "rabbit_ribbon_R",
              "rabbit_pestle", "rabbit_pestle_head"):
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)
    gx, gz = RABBIT_XZ
    doll = _prop("sketchfab/patchwork_bunny.glb", gx - .4, gz, rot=90,      # 뻗은 다리가 받침대 안에 들도록 조금 뒤로
                  y=RABBIT_TOP, height=RABBIT_H, name="rabbit_doll", child="rabbit_doll_")
    bpy.context.view_layer.update()
    doll.parent = hd
    doll.matrix_parent_inverse = hd.matrix_world.inverted()
    bpy.context.view_layer.update()
    # 절구는 인형 옆(남쪽)으로 — 몸을 가리지 않게
    for n, d in (("rabbit_mortar", (0.15, 1.0)), ("rabbit_mortar_in", (0.15, 1.0))):
        o = bpy.data.objects.get(n)
        if o:
            c = sum((o.matrix_world @ mathutils.Vector(v) for v in o.bound_box), mathutils.Vector()) / 8
            o.location += mathutils.Vector((gx + d[0], -(gz + d[1]), c.z)) - c
    # 입 · 머리 폭 재기 : 얼굴 앞(+X = 동쪽)으로 가장 튀어나온 머리 점 = 코끝, 입은 그보다 조금 아래
    me = next(c for c in doll.children_recursive if c.type == "MESH")
    P = [me.matrix_world @ v.co for v in me.data.vertices]
    feet, top = RABBIT_TOP, max(p.z for p in P)
    H = top - feet
    head = [p for p in P if p.z > feet + .55 * H and abs(p.y + gz) < .35 * H]
    nose = max(head, key=lambda p: p.x)
    mz = nose.z - .065 * H
    ring = [p for p in P if abs(p.z - mz) < .03 * H and p.x > nose.x - .12 * H]      # 얼굴 앞쪽만 (늘어진 귀 · 팔 제외)
    hw = max(p.y for p in ring) - min(p.y for p in ring)
    front = max(p.x for p in ring if abs(p.y + gz) < .1 * H)
    # 입 자리 표식 : 빈 물체를 입 가운데에 두고(ANIM_rabbithead 아래) 머리 폭을 속성으로 — 새로 만든 물체라 glTF 에 그대로 나간다
    o = bpy.data.objects.get("rabbit_mouth_mark")
    if o:
        bpy.data.objects.remove(o, do_unlink=True)
    mk = bpy.data.objects.new("rabbit_mouth_mark", None)
    mk["head_w"] = round(hw, 3)
    bpy.context.scene.collection.objects.link(mk)
    mk.parent = hd
    mk.location = hd.matrix_world.inverted() @ mathutils.Vector((front, nose.y, mz))
    print("moon rabbit : H", round(H, 2), "mouth(local)", [round(v, 3) for v in mk.location], "head_w", round(hw, 3))
    return doll
