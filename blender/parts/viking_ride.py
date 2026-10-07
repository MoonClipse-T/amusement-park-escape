"""바이킹 (방 7) — 유령의 집 자리에 세운다

  v1 맵의 유령의 집(haunted · 탑 · 울타리 · 현관 · 문)을 지우고 그 자리에 바이킹을 짓는다. 배 가운데 = 게임 좌표 (VX, VZ), 긴 축은 동서(x)
  - 배 : Sketchfab "Viking Longship" by FoxxAssets (CC BY) — 돛 · 돛대를 떼어 낸 용머리 배 (source/sketchfab/viking_longship.glb)
  - ANIM_viking : 축(높이 VPIV)에 매달린 배 + 팔 4개 → 엔진이 rotation.z 로 흔든다
  - A 자 기둥 2쌍 · 축 · 승강대 · 입구 문틀 + 간판(SIGN_viking) · 구역 ZONE_viking · COL_viking(배가 흔들리는 자리 전체)
  - 조작실 : 배 서쪽, 큰 창이 배(동) · 문은 남쪽 (tag = viking). 조작반은 gyro_drop.py 의 _console : IT_vpower · IT_vlamp · IT_vforce(밀기 장치) · IT_vscreen
  dorm_dress.py · carousel_booth.py 의 도우미를 쓴다.
"""
import bpy, bmesh, math, mathutils

VX, VZ, VPIV = 0.0, -43.0, 13.0
BENCH_X = (-4.5, -3.0, -1.5, 0.0, 1.5, 3.0, 4.5)        # 배 안 좌석 줄 (배 가운데에서 x) — 엔진 room7 ROOM7.rows 와 맞춘다


def _beam(name, p1, p2, w, m):
    """게임 좌표 두 점을 잇는 각재"""
    a, b = mathutils.Vector(_T(*p1)), mathutils.Vector(_T(*p2))
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bm.transform(mathutils.Matrix.Translation((a + b) / 2) @ (b - a).to_track_quat("Z", "Y").to_matrix().to_4x4() @ mathutils.Matrix.Diagonal((w, w, (b - a).length, 1)))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def build_viking():
    for o in list(bpy.data.objects):                     # 유령의 집 지우기
        if o.name == "haunted" or o.name.startswith(("COL_haunted", "COLC_haunted", "COL_GATE_haunted", "LIGHT_haunted", "SIGN_haunted", "ZONE_haunted", "COL_porch_post", "FLOOR_porch")):
            bpy.data.objects.remove(o, do_unlink=True)
    _clear(("vikingx_", "ANIM_viking", "COL_viking", "COLC_viking", "LIGHT_viking", "SIGN_viking", "ZONE_viking", "bxviking_", "COL_bviking_", "IT_manual_viking", "IT_console_viking",
            "IT_mic_viking", "LIGHT_booth_viking", "SIGN_booth_viking", "SIGN_manual_viking", "SPOT_booth_viking", "IT_vpower", "IT_vlamp", "IT_vforce", "IT_vscreen", "SIGN_vpower", "SIGN_vforce"))
    M = bpy.data.materials
    red, iron, col, wood, bulb = M["paint_red"], M["iron"], M["collider"], M["darkwood"], M["bulb"]
    conc = M.get("concrete") or _mat("concrete", "#8d8a84", 0.9)
    yellow = M.get("paint_yellow") or _mat("paint_yellow", "#e9b82a", 0.6)
    _box("vikingx_pad", VX - 9, VX + 9, 0, .1, VZ - 4.2, VZ + 5.4, conc, uv=0.5)
    # A 자 기둥 2쌍 (배 앞뒤) · 가로대 · 축
    for k, dz in enumerate((-2.9, 2.9)):
        for s in (-1, 1):
            _beam(f"vikingx_leg{k}{s}", (VX + s * 6.2, 0, VZ + dz), (VX, VPIV + .35, VZ + dz), .36, red)
            _cyl(f"vikingx_foot{k}{s}", VX + s * 6.2, .18, VZ + dz, .5, .36, iron, verts=14)
            _cyl(f"COLC_viking_leg{k}{s}", VX + s * 6.2, 1.0, VZ + dz, .55, 2.0, col, verts=8)
        _beam(f"vikingx_brace{k}", (VX - 3.5, 5.8, VZ + dz), (VX + 3.5, 5.8, VZ + dz), .2, red)
        _cyl(f"vikingx_hub{k}", VX, VPIV, VZ + dz, .6, .3, yellow, axis="z", verts=20)
    _cyl("vikingx_axle", VX, VPIV, VZ, .2, 6.6, iron, axis="z", verts=14)
    # 흔들리는 배
    anim = _empty("ANIM_viking", VX, VPIV, VZ)
    hull = _prop("sketchfab/viking_longship.glb", VX, VZ, rot=90, y=1.35, height=3.02, name="vikingx_hull", child="vikingx_")
    swing = [hull]
    for k, dz in enumerate((-1.5, 1.5)):
        for s in (-1, 1):
            swing.append(_beam(f"vikingx_arm{k}{s}", (VX, VPIV, VZ + dz), (VX + s * 3.7, 3.6, VZ + dz), .16, iron))
    for o in swing:
        o.parent = anim
        o.matrix_parent_inverse = anim.matrix_basis.inverted()
    # 승강대 (남쪽) · 계단 · 난간
    _box("vikingx_platform", VX - 5.5, VX + 5.5, 0, 1.3, VZ + 2.35, VZ + 4.3, wood, uv=0.5)
    for k in range(4):
        _box(f"vikingx_step{k}", VX + 5.5 + k * .35, VX + 5.85 + k * .35, 0, 1.3 - (k + 1) * .26, VZ + 2.9, VZ + 4.3, wood, uv=0.5)
    _box("vikingx_rail", VX - 5.5, VX + 5.5, 2.2, 2.26, VZ + 4.24, VZ + 4.3, iron)
    for k in range(6):
        _box(f"vikingx_railpost{k}", VX - 5.5 + k * 2.19, VX - 5.44 + k * 2.19, 1.3, 2.2, VZ + 4.24, VZ + 4.3, iron)
    _box("COL_viking", VX - 7.2, VX + 7.2, 0, 3.0, VZ - 3.5, VZ + 4.4, col)
    # 입구 문틀 · 간판 · 등 · 울타리
    for k, sx in enumerate((-2.2, 2.2)):
        _cyl(f"vikingx_gate_post{k}", VX + sx, 1.7, VZ + 7.2, .12, 3.4, red, verts=12)
        _cyl(f"COLC_viking_gate{k}", VX + sx, 1.0, VZ + 7.2, .16, 2.0, col, verts=8)
        _box(f"vikingx_gate_lamp{k}", VX + sx - .12, VX + sx + .12, 3.4, 3.55, VZ + 7.08, VZ + 7.32, bulb)
        _empty("LIGHT_viking_" + "ab"[k], VX + sx, 3.3, VZ + 7.6, color="#ffd9a0", i=1.4, d=15)
        x1, x2 = (VX - 9, VX + sx) if sx < 0 else (VX + sx, VX + 9)
        for y in (.55, .95):
            _box(f"vikingx_fence{k}_{int(y * 100)}", x1, x2, y, y + .05, VZ + 7.17, VZ + 7.23, iron)
        _box(f"COL_viking_fence{k}", x1, x2, 0, 2.0, VZ + 7.05, VZ + 7.35, col)
    _box("vikingx_gate_beam", VX - 2.4, VX + 2.4, 2.95, 3.6, VZ + 7.1, VZ + 7.3, red)
    _empty("SIGN_viking", VX, 3.27, VZ + 7.31, 0, w=4.2, h=0.55)
    _empty("ZONE_viking", VX, 0, VZ + 10, title="바이킹", r=9)
    # 조작실 : 배 서쪽 · 큰 창이 배 쪽(동) · 문은 남쪽
    b = _Booth("viking", -9.6, -38.0, 180)
    _booth_shell(b)
    _console(b, "viking", "v")
    for me in [m for m in bpy.data.meshes if m.users == 0]:
        bpy.data.meshes.remove(me)
    print("VIKING_OK")


def build_viking_ride_extras():
    """배 안 나무 좌석 7줄 (ANIM_viking 에 붙어 같이 흔들린다 — 달토끼가 한 줄씩 넘어 온다) · 조작실 책상 위 무선 조종기 IT_vremote"""
    _clear(("vikingx_bench", "IT_vremote", "vremotex_"))
    M = bpy.data.materials
    wood, iron, red, dark = M["darkwood"], M["iron"], M["paint_red"], M["locker_dark"]
    yellow = M.get("vremote_yellow") or _mat("vremote_yellow", "#f0c020", 0.45)
    green = M.get("vremote_green") or _mat("vremote_green", "#2fbf5a", 0.4)
    anim = bpy.data.objects["ANIM_viking"]
    def bevel(o, w=.025):
        m = o.modifiers.new("bev", "BEVEL"); m.width = w; m.segments = 2; m.limit_method = "ANGLE"
        return o
    for k, x in enumerate(BENCH_X):
        parts = [bevel(_box(f"vikingx_bench{k}_seat", VX + x - .2, VX + x + .2, 2.5, 2.62, VZ - 1.15, VZ + 1.15, wood)),
                 bevel(_box(f"vikingx_bench{k}_back", VX + x + .17, VX + x + .24, 2.62, 3.05, VZ - 1.1, VZ + 1.1, wood), .015),
                 bevel(_box(f"vikingx_bench{k}_leg", VX + x - .1, VX + x + .1, 2.15, 2.5, VZ - .9, VZ + .9, wood), .015),
                 bevel(_box(f"vikingx_bench{k}_bar", VX + x - .26, VX + x - .22, 2.95, 3.0, VZ - 1.0, VZ + 1.0, iron), .01)]
        for o in parts:
            o.parent = anim
            o.matrix_parent_inverse = anim.matrix_basis.inverted()
    # 무선 조종기 : 노란 몸통 · 큰 초록 밀기 버튼 · 빨간 비상 정지 · 검은 손잡이 · 안테나 (조작실 책상 위)
    x, z, y = -9.95, -38.3, .8
    body = bevel(_box("vremotex_body", x - .045, x + .045, y, y + .045, z - .1, z + .1, yellow), .012)
    grip = bevel(_box("vremotex_grip", x - .04, x + .04, y + .002, y + .05, z + .06, z + .12, dark), .01)
    push = _cyl("vremotex_push", x, y + .052, z - .03, .026, .014, green, verts=20)
    ring = _cyl("vremotex_ring", x, y + .047, z - .03, .032, .006, dark, verts=20)
    stop = _cyl("vremotex_stop", x, y + .056, z + .035, .016, .02, red, verts=16)
    ant = _cyl("vremotex_ant", x + .03, y + .03, z - .12, .005, .07, dark, axis="z", verts=8)
    objs = [body, grip, push, ring, stop, ant]
    for o in objs:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)
    with bpy.context.temp_override(active_object=body, selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    body.name = "IT_vremote"
    print("VIKING_EXTRAS_OK")
