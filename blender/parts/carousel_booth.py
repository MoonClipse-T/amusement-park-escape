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
    mine = ("boothx_", "COL_booth_", "IT_manual_carousel", "IT_console_carousel", "IT_mic_carousel", "LIGHT_booth_carousel", "SIGN_booth_carousel")
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
    con = _box("IT_console_carousel", x1 + t + .05, x1 + t + .4, 0.8, 0.9, 13.2, 14.3, M["locker_dark"])
    btn = [("paint_red", 13.35), ("paint_yellow", 13.5), ("paint_green", 13.65)]
    kids = [_cyl(f"boothx_btn{k}", x1 + t + .3, 0.915, z, 0.025, 0.03, M[m], verts=14) for k, (m, z) in enumerate(btn)]
    kids += [_box("boothx_lever_base", x1 + t + .2, x1 + t + .32, 0.9, 0.93, 13.85, 13.95, iron),
             _cyl("boothx_lever", x1 + t + .26, 1.0, 13.9, 0.01, 0.16, iron, verts=8),
             _cyl("boothx_lever_knob", x1 + t + .26, 1.09, 13.9, 0.025, 0.04, M["paint_red"], verts=12),
             _box("boothx_screen", x1 + t + .06, x1 + t + .1, 0.92, 1.1, 14.0, 14.28, M["neon_pink"] if "neon_pink" in M else glass)]
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
