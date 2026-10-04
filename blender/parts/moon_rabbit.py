"""광장 달토끼 동상 자리 — 받침대 · 절구만 남기고 비운다. 달토끼는 엔진이 캐릭터 모델(web/assets/moonrabbit.glb)로 세운다.

  달토끼 캐릭터는 걷고 쫓아올 수 있어야 해서 맵(park.glb)과 따로 만든다 → moon_rabbit_char.py
  - ANIM_rabbithead (머리 축 빈 물체)는 남긴다 : 엔진이 달토끼를 이 축 아래에 세우고, 자정에 몸째 돌린다 (story.js tickRabbit)
  - 예전 동상 부품(복셀 인형 · 천 인형 · 입 표식)은 지운다 · 절구 · 떡은 받침대 옆에
  dorm_dress.py 의 도우미를 쓴다 (build 스크립트가 parts 를 차례로 exec).
"""
import bpy, mathutils

RABBIT_XZ = (-11.0, 17.5)        # 받침대 가운데 (게임 좌표) — build_lunaland_v2.py 의 RX, RZ


def build_moon_rabbit():
    hd = bpy.data.objects["ANIM_rabbithead"]
    for o in list(hd.children_recursive):
        bpy.data.objects.remove(o, do_unlink=True)
    for n in ("rabbit_body", "rabbit_seam", "rabbit_padL", "rabbit_padR", "rabbit_ribbon_knot", "rabbit_ribbon_L", "rabbit_ribbon_R",
              "rabbit_pestle", "rabbit_pestle_head", "rabbit_doll", "rabbit_hmouth", "rabbit_mouth_mark"):
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)
    gx, gz = RABBIT_XZ
    for n in ("rabbit_mortar", "rabbit_mortar_in"):                     # 절구는 받침대 옆(남쪽)으로
        o = bpy.data.objects.get(n)
        if o:
            bpy.context.view_layer.update()
            c = sum((o.matrix_world @ mathutils.Vector(v) for v in o.bound_box), mathutils.Vector()) / 8
            o.location += mathutils.Vector((gx + .55, -(gz + .75), c.z)) - c
