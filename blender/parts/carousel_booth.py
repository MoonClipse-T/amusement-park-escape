"""회전목마 조작실 — 입구(동쪽, z≈10) 바로 남쪽의 작은 부스. 안에서 마이크로 방송하고 기계를 조작한다.

  dorm_dress.py 의 도우미(_box · _cyl · _prop · _empty · _mat · _kids)를 쓴다. build 스크립트는 parts 를 차례로 exec 하므로 그대로 쓰인다.
  Blender 화면에서 따로 돌릴 때 : dorm_dress.py 를 먼저 exec 한 뒤 이 파일을 exec 하고 build_booth()
  좌표는 게임 좌표. 부스 바깥 x[-20.6,-18.2] z[12.6,15.0], 높이 2.6 · 문 : 북쪽 벽(입구 쪽) · 큰 창 : 서쪽 벽(회전목마 쪽)
  엔진이 읽는 이름 : IT_manual_carousel(점검 방법) · IT_console_carousel(조작반) · IT_mic_carousel(마이크) · LIGHT_booth_carousel · SIGN_booth_carousel
"""
import bpy

BX1, BX2, BZ1, BZ2, BH, BT = -20.6, -18.2, 12.6, 15.0, 2.6, 0.12
DOOR = (-19.55, -18.5)      # 북쪽 벽 문 구멍 x 범위


def _glass():
    """반투명 창유리 (안에서 회전목마가 보이게)"""
    m = _mat("boothx_glass", "#a9c8d8", 0.05)
    next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Alpha"].default_value = 0.18
    return m


def build_booth():
    mine = ("boothx_", "COL_booth_", "IT_manual_carousel", "IT_console_carousel", "IT_mic_carousel", "LIGHT_booth_carousel", "SIGN_booth_carousel",
            "IT_cpower", "IT_clever", "IT_cbtn_", "SIGN_cpower", "SIGN_cnum_")
    for o in [o for o in bpy.data.objects if o.name.startswith(mine)]:
        bpy.data.objects.remove(o, do_unlink=True)
    M = bpy.data.materials
    wall, trim, glass, wood, iron, col = _mat("boothx_wall", "#efe3c8", 0.7), M["paint_red"], _glass(), M["darkwood"], M["iron"], M["collider"]
    roof = M.get("stripe_red") or trim
    floor = _mat("boothx_floor", "#5a4636", 0.8)
    x1, x2, z1, z2, t = BX1, BX2, BZ1, BZ2, BT

    # 바닥 · 벽 (서쪽 벽은 허리 높이부터 유리창)
    _box("boothx_floor", x1, x2, 0.0, 0.04, z1, z2, floor)
    _box("boothx_w_low", x1, x1 + t, 0, 1.0, z1, z2, wall)
    _box("boothx_w_top", x1, x1 + t, 2.05, BH, z1, z2, wall)
    _box("boothx_w_glass", x1 + .04, x1 + .08, 1.0, 2.05, z1 + .1, z2 - .1, glass)
    for k, z in enumerate((z1 + .05, (z1 + z2) / 2, z2 - .05)):
        _box(f"boothx_w_mull{k}", x1 - .01, x1 + t + .01, 1.0, 2.05, z - .04, z + .04, trim)
    _box("boothx_s", x1, x2, 0, BH, z2 - t, z2, wall)
    _box("boothx_e_low", x2 - t, x2, 0, 1.1, z1, z2, wall)
    _box("boothx_e_top", x2 - t, x2, 1.8, BH, z1, z2, wall)
    _box("boothx_e_glass", x2 - .08, x2 - .04, 1.1, 1.8, z1 + .3, z2 - .3, glass)
    _box("boothx_n_a", x1, DOOR[0], 0, BH, z1, z1 + t, wall)
    _box("boothx_n_b", DOOR[1], x2, 0, BH, z1, z1 + t, wall)
    _box("boothx_n_lintel", DOOR[0], DOOR[1], 2.15, BH, z1, z1 + t, wall)
    for k, (a, b) in enumerate(((DOOR[0] - .06, DOOR[0]), (DOOR[1], DOOR[1] + .06))):
        _box(f"boothx_door_frame{k}", a, b, 0, 2.15, z1 - .02, z1 + t + .02, trim)
    _box("boothx_door_frame_t", DOOR[0] - .06, DOOR[1] + .06, 2.15, 2.22, z1 - .02, z1 + t + .02, trim)
    # 지붕 (빨강 · 흰 줄무늬 처마) · 아래 빨간 띠
    _box("boothx_roof", x1 - .25, x2 + .25, BH, BH + .14, z1 - .25, z2 + .25, roof, uv=0.6)
    _box("boothx_band", x1 - .01, x2 + .01, BH - .22, BH, z1 - .01, z2 + .01, trim)
    _box("boothx_ceiling", x1 + t, x2 - t, BH - .25, BH - .22, z1 + t, z2 - t, M["paint_white"])

    # 조작 책상 (서쪽 창 아래) · 조작반 · 마이크 · 의자
    _box("boothx_desk", x1 + t, x1 + t + .55, 0.74, 0.8, z1 + t + .05, z2 - t - .05, wood)
    _box("boothx_desk_front", x1 + t + .5, x1 + t + .55, 0.04, 0.74, z1 + t + .05, z2 - t - .05, wood)
    # 조작반 : 조작하는 사람(동쪽에 서서 창을 봄)의 왼쪽부터 전원(ON/OFF) · 레버 · 버튼 8개(가로 4 × 세로 2, 1~4 윗줄 · 5~8 아랫줄)
    #   IT_cpower · IT_clever(축) · IT_cbtn_1~8 (버튼마다 재질이 따로라 엔진이 하나씩 불을 켠다) · 번호 · ON/OFF 글씨는 SIGN_
    top = 0.9
    con = _box("IT_console_carousel", x1 + t + .05, x1 + t + .42, 0.8, top, 13.15, 14.35, M["locker_dark"])
    kids = [_cyl("IT_cpower", -20.24, top + .012, 14.18, 0.032, 0.024, M["paint_red"], verts=20)]
    _orient(_empty("SIGN_cpower", -20.15, top + .003, 14.18, w=0.1, h=0.04), (0, 0, 1), (-1, 0, 0))
    lever = _empty("IT_clever", -20.24, top + .03, 13.97)
    _kids(lever, _cyl("boothx_lever_rod", -20.24, top + .12, 13.97, 0.009, 0.18, iron, verts=8),
          _cyl("boothx_lever_knob", -20.24, top + .22, 13.97, 0.026, 0.05, M["paint_red"], verts=14))
    kids += [lever, _box("boothx_lever_base", -20.3, -20.18, top, top + .03, 13.92, 14.02, iron)]
    for k in range(1, 9):
        bx, bz = (-20.31 if k <= 4 else -20.17), 13.78 - ((k - 1) % 4) * 0.15
        kids.append(_cyl(f"IT_cbtn_{k}", bx, top + .01, bz, 0.024, 0.02, _mat(f"boothx_btn_{k}", "#2c312c", 0.35), verts=18))
        _orient(_empty(f"SIGN_cnum_{k}", bx + .045, top + .003, bz, w=0.05, h=0.03), (0, 0, 1), (-1, 0, 0))
    _kids(con, *kids)
    mic = _cyl("IT_mic_carousel", x1 + t + .3, 0.815, 14.55, 0.05, 0.03, iron, verts=16)
    _kids(mic, _cyl("boothx_mic_neck", x1 + t + .3, 0.98, 14.55, 0.007, 0.32, iron, verts=6),
          _cyl("boothx_mic_head", x1 + t + .27, 1.15, 14.55, 0.022, 0.07, M["locker_dark"], axis="x", verts=12))
    _prop("plastic_monobloc_chair_01", -19.55, 13.75, -90, height=0.8, decimate=0.4, name="boothx_chair")

    # 점검 방법 (남쪽 벽 안쪽, 문으로 들어오면 정면) · 시간표 종이 · 등
    man = _box("IT_manual_carousel", -19.75, -19.05, 1.15, 1.85, z2 - t - .006, z2 - t, M["paper"])
    _kids(man, _box("boothx_manual_clip", -19.5, -19.3, 1.83, 1.88, z2 - t - .012, z2 - t, M["brass"]),
          _box("boothx_manual_head", -19.72, -19.08, 1.72, 1.8, z2 - t - .008, z2 - t - .006, M["paint_red"]))
    _box("boothx_paper2", -18.95, -18.55, 1.3, 1.6, z2 - t - .005, z2 - t, M["paper"])
    _empty("LIGHT_booth_carousel", -19.4, 2.25, 13.8, color="#ffd9a0", i=0.9, d=5.5)
    _box("boothx_lamp", -19.6, -19.2, BH - .26, BH - .25, 13.7, 13.9, M["bulb"])
    _empty("SIGN_booth_carousel", (DOOR[0] + DOOR[1]) / 2, 2.4, z1 - .02, 180, w=1.3, h=0.3)

    # 충돌 : 벽 · 책상 (문 구멍은 비워 둔다)
    _box("COL_booth_w", x1, x1 + t, 0, 2.5, z1, z2, col)
    _box("COL_booth_e", x2 - t, x2, 0, 2.5, z1, z2, col)
    _box("COL_booth_s", x1, x2, 0, 2.5, z2 - t, z2, col)
    _box("COL_booth_na", x1, DOOR[0], 0, 2.5, z1, z1 + t, col)
    _box("COL_booth_nb", DOOR[1], x2, 0, 2.5, z1, z1 + t, col)
    _box("COL_booth_desk", x1 + t, x1 + t + .55, 0, 1.0, z1 + t, z2 - t, col)
    print("BOOTH_OK")


# ---------------------------------------------------------------- 회전목마 고치기
# 무대 : 중심 (-30, 10), 반지름 7.7, 높이 0.5 · 가운데 기둥 반지름 약 1.3 · 울타리 반지름 9.4 (입구 = 각도 -14°~14°, 광장 쪽)
# 구역 1~8 : 안쪽 줄 말 8마리를 하나씩 품는 45° 부채꼴. 구역 k 의 가운데 각도 = -11.5° + 45°(k-1) (각도는 +x 에서 +z 쪽으로)
# 쓰러진 말 : 5번 구역 안쪽 말(horse_statue_01.017). 제자리 모습은 IT_horsehome_5, 기둥에서 빠져 무대에 내려앉은 복사본은 IT_horse_5
CX, CZ, FALLEN = -30.0, 10.0, 5


def fix_carousel():
    import math, mathutils
    mine = ("COLC_cfence_", "COLC_carousel_pillar", "FLOORC_carousel", "SIGN_csec_", "SIGN_cfloor_", "IT_horse_5")
    for o in [o for o in bpy.data.objects if o.name.startswith(mine)]:
        bpy.data.objects.remove(o, do_unlink=True)
    col, car = bpy.data.materials["collider"], bpy.data.objects["ANIM_carousel"]
    old = bpy.data.objects.get("COLC_carousel")              # 무대 전체를 막던 큰 원기둥 → 가운데 기둥만 막는다
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
    _cyl("COLC_carousel_pillar", CX, 1.5, CZ, 1.4, 3.0, col, verts=16)
    _cyl("FLOORC_carousel", CX, 0.25, CZ, 7.7, 0.5, col, verts=48)          # 원형 바닥 (점프해야 올라감)
    for a in range(14, 347, 4):                                              # 울타리 기둥마다 작은 원기둥 충돌
        r = math.radians(a)
        _cyl(f"COLC_cfence_{a}", CX + 9.4 * math.cos(r), 1.0, CZ + 9.4 * math.sin(r), 0.3, 2.0, col, verts=8)

    def keep(e):                                                             # 회전목마와 함께 돌도록 자식으로
        e.parent = car
        e.matrix_parent_inverse = car.matrix_world.inverted()
    for k in range(1, 9):
        r = math.radians(-11.5 + 45 * (k - 1))
        dx, dz = math.cos(r), math.sin(r)
        keep(_orient(_empty(f"SIGN_csec_{k}", CX + 7.73 * dx, 0.26, CZ + 7.73 * dz, w=0.36, h=0.3), (dx, -dz, 0), (0, 0, 1)))
        keep(_orient(_empty(f"SIGN_cfloor_{k}", CX + 4.6 * dx, 0.506, CZ + 4.6 * dz, w=0.6, h=0.6), (0, 0, 1), (-dx, dz, 0)))

    home = bpy.data.objects.get("IT_horsehome_5") or bpy.data.objects["horse_statue_01.017"]
    home.name = "IT_horsehome_5"
    fall = home.copy()
    bpy.context.scene.collection.objects.link(fall)
    fall.name = "IT_horse_5"
    bpy.context.view_layer.update()
    r = math.radians(-11.5 + 45 * (FALLEN - 1))
    tangent = mathutils.Vector((-math.sin(r), -math.cos(r), 0))             # 게임 (-sin, cos) → Blender
    pts = [home.matrix_world @ mathutils.Vector(v) for v in home.bound_box]
    c = sum(pts, mathutils.Vector()) / 8
    # 기둥에서 빠져 무대 바닥에 내려앉은 모습 : 바깥쪽으로 비켜나 살짝 돌아가고 기울어 있다
    turn = mathutils.Matrix.Rotation(math.radians(28), 4, "Z") @ mathutils.Matrix.Rotation(math.radians(9), 4, tangent)
    m = mathutils.Matrix.Translation(c) @ turn @ mathutils.Matrix.Translation(-c) @ home.matrix_world
    fall.matrix_world = m
    bpy.context.view_layer.update()
    low = min((fall.matrix_world @ mathutils.Vector(v)).z for v in fall.bound_box)
    out = mathutils.Vector((math.cos(r), -math.sin(r), 0)) * -1.0      # 기둥 안쪽(가운데 기둥 쪽)으로 비켜남 · 바닥 번호판은 가리지 않게
    fall.matrix_world = mathutils.Matrix.Translation(out + mathutils.Vector((0, 0, 0.5 - low))) @ fall.matrix_world
    print("CAROUSEL_OK")
