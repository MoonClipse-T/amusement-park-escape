"""놀이기구 조작실(작은 부스) — 안에서 마이크로 방송하고 기계를 조작한다. 회전목마 · 범퍼카가 같은 부스를 쓴다.

  dorm_dress.py 의 도우미(_box · _cyl · _prop · _empty · _mat · _kids · _orient)를 쓴다. build 스크립트는 parts 를 차례로 exec 하므로 그대로 쓰인다.
  Blender 화면에서 따로 돌릴 때 : dorm_dress.py 를 먼저 exec 한 뒤 이 파일을 exec 하고 build_booth() · build_bumper_booth() · fix_carousel()
  부스는 '부스 좌표'(한쪽 모서리가 0, 크기 2.4 × 2.4)로 짓고 _Booth 가 놓을 자리 · 돌린 각도에 맞춰 게임 좌표로 바꾼다.
  부스 좌표 : 큰 창 = x 0 쪽 벽 · 문 = z 0 쪽 벽 · 점검 방법 = z 2.4 쪽 벽 안쪽 · 조작 책상 = 창 아래
  엔진이 읽는 이름 (tag = carousel / bumper) : IT_manual_<tag> · IT_console_<tag> · IT_mic_<tag> · LIGHT_booth_<tag> · SIGN_booth_<tag> · SPOT_booth_<tag>(문 앞)
"""
import bpy

BS, BH, BT = 2.4, 2.6, 0.12          # 부스 크기 · 높이 · 벽 두께
DOOR = (1.05, 2.1)                   # 문 구멍 (부스 좌표 x)


def _glass():
    """반투명 창유리 (안에서 놀이기구가 보이게)"""
    m = _mat("boothx_glass", "#a9c8d8", 0.05)
    next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Alpha"].default_value = 0.18
    return m


class _Booth:
    """부스 좌표 → 게임 좌표. (ox, oz) = 부스 좌표 원점이 놓일 자리, rot = 0 · 90 · 180 · 270 (위에서 볼 때 반시계)"""
    def __init__(self, tag, ox, oz, rot):
        self.tag, self.ox, self.oz, self.rot = tag, ox, oz, rot % 360
        self.p = f"bx{tag}_"

    def P(self, lx, lz):
        return {0: (self.ox + lx, self.oz + lz), 90: (self.ox - lz, self.oz + lx),
                180: (self.ox - lx, self.oz - lz), 270: (self.ox + lz, self.oz - lx)}[self.rot]

    def D(self, dx, dz):            # 부스 좌표 방향 → Blender 방향 벡터 (_orient 용)
        wx, wz = self.P(dx, dz)
        return (wx - self.ox, -(wz - self.oz), 0)

    def box(self, name, x1, x2, y1, y2, z1, z2, m, **k):
        (a, b), (c, d) = self.P(x1, z1), self.P(x2, z2)
        return _box(name, min(a, c), max(a, c), y1, y2, min(b, d), max(b, d), m, **k)

    def cyl(self, name, x, y, z, r, h, m, axis="y", verts=20):
        wx, wz = self.P(x, z)
        if axis != "y" and self.rot in (90, 270):
            axis = "z" if axis == "x" else "x"
        return _cyl(name, wx, y, wz, r, h, m, axis=axis, verts=verts)

    def emp(self, name, x, y, z, rot=0, **props):
        wx, wz = self.P(x, z)
        return _empty(name, wx, y, wz, rot - self.rot, **props)

    def prop(self, key, x, z, rot=0, **k):
        wx, wz = self.P(x, z)
        return _prop(key, wx, wz, rot - self.rot, child=self.p, **k)


def _keep(parent, *objs):
    """자식으로 붙이되 제자리에 둔다 — 부모(원기둥 · 빈 물체)에 위치가 있으면 _kids 만으로는 자식이 그만큼 밀려난다 (마이크 · 레버가 공중에 떠 있던 원인)"""
    for o in objs:
        o.parent = parent
        o.matrix_parent_inverse = parent.matrix_basis.inverted()
    return parent


def _booth_shell(b):
    """벽 · 지붕 · 책상 · 마이크 · 의자 · 점검 방법 · 등 · 간판 · 충돌. 조작반은 놀이기구마다 따로 붙인다."""
    M, p, tag = bpy.data.materials, b.p, b.tag
    wall, trim, glass, wood, iron, col = _mat("boothx_wall", "#efe3c8", 0.7), M["paint_red"], _glass(), M["darkwood"], M["iron"], M["collider"]
    roof, floor = M.get("stripe_red") or trim, _mat("boothx_floor", "#5a4636", 0.8)
    s, t = BS, BT
    b.box(p + "floor", 0, s, 0.0, 0.04, 0, s, floor)
    b.box(p + "w_low", 0, t, 0, 1.0, 0, s, wall)
    b.box(p + "w_top", 0, t, 2.05, BH, 0, s, wall)
    b.box(p + "w_glass", .04, .08, 1.0, 2.05, .1, s - .1, glass)
    for k, z in enumerate((.05, s / 2, s - .05)):
        b.box(f"{p}w_mull{k}", -.01, t + .01, 1.0, 2.05, z - .04, z + .04, trim)
    b.box(p + "s", 0, s, 0, BH, s - t, s, wall)
    b.box(p + "e_low", s - t, s, 0, 1.1, 0, s, wall)
    b.box(p + "e_top", s - t, s, 1.8, BH, 0, s, wall)
    b.box(p + "e_glass", s - .08, s - .04, 1.1, 1.8, .3, s - .3, glass)
    b.box(p + "n_a", 0, DOOR[0], 0, BH, 0, t, wall)
    b.box(p + "n_b", DOOR[1], s, 0, BH, 0, t, wall)
    b.box(p + "n_lintel", DOOR[0], DOOR[1], 2.15, BH, 0, t, wall)
    for k, (x1, x2) in enumerate(((DOOR[0] - .06, DOOR[0]), (DOOR[1], DOOR[1] + .06))):
        b.box(f"{p}door_frame{k}", x1, x2, 0, 2.15, -.02, t + .02, trim)
    b.box(p + "door_frame_t", DOOR[0] - .06, DOOR[1] + .06, 2.15, 2.22, -.02, t + .02, trim)
    b.box(p + "roof", -.25, s + .25, BH, BH + .14, -.25, s + .25, roof, uv=0.6)
    b.box(p + "band", -.01, s + .01, BH - .22, BH, -.01, s + .01, trim)
    b.box(p + "ceiling", t, s - t, BH - .25, BH - .22, t, s - t, M["paint_white"])
    # 책상 · 마이크 · 의자
    b.box(p + "desk", t, t + .55, 0.74, 0.8, t + .05, s - t - .05, wood)
    b.box(p + "desk_front", t + .5, t + .55, 0.04, 0.74, t + .05, s - t - .05, wood)
    mic = b.cyl(f"IT_mic_{tag}", t + .3, 0.815, 1.95, 0.05, 0.03, iron, verts=16)
    _keep(mic, b.cyl(p + "mic_neck", t + .3, 0.98, 1.95, 0.007, 0.32, iron, verts=6),
          b.cyl(p + "mic_head", t + .27, 1.15, 1.95, 0.022, 0.07, M["locker_dark"], axis="x", verts=12))
    b.prop("plastic_monobloc_chair_01", 1.05, 1.15, -90, height=0.8, decimate=0.4, name=p + "chair")
    # 점검 방법 (문으로 들어오면 정면 벽) · 종이 · 등 · 간판 · 문 앞 자리
    man = b.box(f"IT_manual_{tag}", .85, 1.55, 1.15, 1.85, s - t - .006, s - t, M["paper"])
    _kids(man, b.box(p + "manual_clip", 1.1, 1.3, 1.83, 1.88, s - t - .012, s - t, M["brass"]),
          b.box(p + "manual_head", .88, 1.52, 1.72, 1.8, s - t - .008, s - t - .006, M["paint_red"]))
    b.emp(f"SIGN_manual_{tag}", 1.2, 1.5, s - t - .03, 180, w=0.66, h=0.66)          # 점검 방법 종이의 제목 (글씨는 엔진)
    b.box(p + "paper2", 1.65, 2.05, 1.3, 1.6, s - t - .005, s - t, M["paper"])
    b.emp(f"LIGHT_booth_{tag}", 1.2, 2.25, 1.2, color="#ffd9a0", i=0.9, d=5.5)
    b.box(p + "lamp", 1.0, 1.4, BH - .26, BH - .25, 1.1, 1.3, M["bulb"])
    b.emp(f"SIGN_booth_{tag}", (DOOR[0] + DOOR[1]) / 2, 2.4, -.02, 180, w=1.3, h=0.3)
    b.emp(f"SPOT_booth_{tag}", (DOOR[0] + DOOR[1]) / 2, 0, -.7, 0)
    # 충돌 : 벽 · 책상 (문 구멍은 비워 둔다)
    b.box(f"COL_b{tag}_w", 0, t, 0, 2.5, 0, s, col)
    b.box(f"COL_b{tag}_e", s - t, s, 0, 2.5, 0, s, col)
    b.box(f"COL_b{tag}_s", 0, s, 0, 2.5, s - t, s, col)
    b.box(f"COL_b{tag}_na", 0, DOOR[0], 0, 2.5, 0, t, col)
    b.box(f"COL_b{tag}_nb", DOOR[1], s, 0, 2.5, 0, t, col)
    b.box(f"COL_b{tag}_desk", t, t + .55, 0, 1.0, t, s - t, col)


def _clear(prefixes):
    for o in [o for o in bpy.data.objects if o.name.startswith(prefixes)]:
        bpy.data.objects.remove(o, do_unlink=True)


def _lamp(b, name, x, y, z, key):
    """조작반 버튼 하나 : 엔진이 하나씩 불을 켜려고 버튼마다 재질을 따로 둔다"""
    return b.cyl(name, x, y, z, 0.024, 0.02, _mat(f"boothx_btn_{key}", "#2c312c", 0.35), verts=18)


def build_booth():
    """회전목마 조작실 : 입구(광장 쪽) 바로 옆. 조작반 = 조작하는 사람(창을 봄)의 왼쪽부터 전원(ON/OFF) · 레버 · 버튼 8개(가로 4 × 세로 2)"""
    _clear(("boothx_", "COL_booth_", "bxcarousel_", "COL_bcarousel_", "IT_manual_carousel", "IT_console_carousel", "IT_mic_carousel",
            "LIGHT_booth_carousel", "SIGN_booth_carousel", "SIGN_manual_carousel", "SPOT_booth_carousel", "IT_cpower", "IT_clever", "IT_cbtn_", "SIGN_cpower", "SIGN_cnum_"))
    b = _Booth("carousel", -20.6, 12.6, 0)
    _booth_shell(b)
    M, p, iron, top, up = bpy.data.materials, b.p, bpy.data.materials["iron"], 0.9, (0, 0, 1)
    con = b.box("IT_console_carousel", BT + .05, BT + .42, 0.8, top, .55, 1.75, M["locker_dark"])
    kids = [b.cyl("IT_cpower", .36, top + .012, 1.58, 0.034, 0.024, M["paint_red"], verts=20)]
    _orient(b.emp("SIGN_cpower", .45, top + .003, 1.58, w=0.1, h=0.04), up, b.D(-1, 0))
    # 레버 : 전원과 버튼 사이에 크게 (조작반 화면을 열지 않아도 보이게). 엔진이 IT_clever 를 돌려 내린다
    lever = b.emp("IT_clever", .36, top + .04, 1.37)
    _keep(lever, b.cyl(p + "lever_rod", .36, top + .2, 1.37, 0.016, 0.32, iron, verts=10),
          b.cyl(p + "lever_knob", .36, top + .38, 1.37, 0.045, 0.07, M["paint_red"], verts=16))
    kids += [lever, b.box(p + "lever_base", .27, .45, top, top + .045, 1.29, 1.45, iron)]
    for k in range(1, 9):
        bx, bz = (.29 if k <= 4 else .43), 1.18 - ((k - 1) % 4) * 0.15
        kids.append(_lamp(b, f"IT_cbtn_{k}", bx, top + .01, bz, k))
        _orient(b.emp(f"SIGN_cnum_{k}", bx + .045, top + .003, bz, w=0.05, h=0.03), up, b.D(-1, 0))
    _kids(con, *kids)
    print("BOOTH_OK")


def build_bumper_booth():
    """범퍼카 조작실 : 입구 옆, 큰 창이 범퍼카장 쪽. 조작반 = 전원(ON/OFF) · 범퍼카 전기 램프 6개(가로 3 × 세로 2)"""
    _clear(("bxbumper_", "COL_bbumper_", "IT_manual_bumper", "IT_console_bumper", "IT_mic_bumper", "LIGHT_booth_bumper", "SIGN_booth_bumper", "SIGN_manual_bumper",
            "SPOT_booth_bumper", "IT_bpower", "IT_bbtn_", "SIGN_bpower", "SIGN_bnum_"))
    b = _Booth("bumper", -40.6, 32.5, 270)
    _booth_shell(b)
    M, top, up = bpy.data.materials, 0.9, (0, 0, 1)
    con = b.box("IT_console_bumper", BT + .05, BT + .42, 0.8, top, .55, 1.75, M["locker_dark"])
    kids = [b.cyl("IT_bpower", .36, top + .012, 1.58, 0.034, 0.024, M["paint_red"], verts=20)]
    _orient(b.emp("SIGN_bpower", .45, top + .003, 1.58, w=0.1, h=0.04), up, b.D(-1, 0))
    for k in range(1, 7):
        bx, bz = (.29 if k <= 3 else .43), 1.25 - ((k - 1) % 3) * 0.18
        kids.append(_lamp(b, f"IT_bbtn_{k}", bx, top + .01, bz, f"b{k}"))
        _orient(b.emp(f"SIGN_bnum_{k}", bx + .045, top + .003, bz, w=0.05, h=0.03), up, b.D(-1, 0))
    _kids(con, *kids)
    print("BUMPER_BOOTH_OK")


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
