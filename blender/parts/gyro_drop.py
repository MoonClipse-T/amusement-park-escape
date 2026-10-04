"""자이로드롭 (방 5) — 탑 · 오르내리는 탑승 의자 · 자석 브레이크 구간 · 승강장 · 조작실

  v1 맵의 자이로드롭(가는 기둥 4개 + 고리, 물체 'tower')을 지우고 다시 짓는다. 탑 가운데 = 게임 좌표 (TX, TZ)
  - 탑 : 12각 기둥(높이 40 m) · 흰 띠 · 꼭대기 왕관 + 빨간 등 · 아래 15 m 는 자석 브레이크 구간 (구리 날개 4장 · 노란 띠 · 안내판)
  - 탑승 의자 : 탑을 감싼 고리 + 바깥을 보는 의자 12개 (무릎 안전바). ANIM_gyro 의 자식 → 엔진이 높이(position.y) · 회전(rotation.y)을 바꾼다
      IT_gyro_seat = 남쪽(광장 쪽) 의자 — 플레이어가 앉는 자리
  - 승강장 : 원형 단(FLOORC_gyro, 높이 0.25) · 울타리(남쪽이 입구) · 입구 문틀 + 간판(SIGN_tower)
  - 조작실 : 탑 서쪽, 큰 창이 탑(동쪽) · 문은 남쪽 (carousel_booth.py 의 _Booth · _booth_shell, tag = gyro)
      IT_console_gyro · IT_gbtn_1~3 · IT_manual_gyro · IT_mic_gyro · IT_gnote_gyro(책상 위 찢어진 근무 일지) · SPOT_booth_gyro
  - 불 : LIGHT_gyro_a · LIGHT_gyro_b(입구) · LIGHT_gyro_top(꼭대기 빨간 등) · LIGHT_booth_gyro — 정전 때도 켜져 있다 (비상 전원, 엔진 room5_gyro.js)
  dorm_dress.py · carousel_booth.py 의 도우미를 쓴다 (build 스크립트가 parts 를 차례로 exec).
  엔진 쪽 숫자(room5_gyro.js 의 TX · TZ · TOP · BRK)와 맞춘다.
"""
import bpy, bmesh, math, mathutils

TX, TZ = -20.0, -49.0            # 탑 가운데 (게임 좌표)
TOWER_H, BRAKE_H = 40.0, 15.0    # 탑 높이 · 자석 브레이크 구간 꼭대기
DECK_R, DECK_H, FENCE_R = 5.0, 0.25, 4.85
SEATS, SEAT_R = 12, 2.0          # 의자 수 · 등받이까지의 반지름


def _ring(name, r1, r2, y1, y2, m, n=32):
    """탑 둘레의 고리 (안 반지름 r1 · 바깥 r2 · 높이 y1~y2)"""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = []
    for i in range(n):
        c, s = math.cos(2 * math.pi * i / n), math.sin(2 * math.pi * i / n)
        vs.append([bm.verts.new(_T(TX + r * c, y, TZ + r * s)) for r, y in ((r1, y1), (r2, y1), (r2, y2), (r1, y2))])
    for i in range(n):
        a, b = vs[i], vs[(i + 1) % n]
        for k in range(4):
            bm.faces.new((a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def _spin(o, deg):
    """탑 축을 중심으로 돌린다. deg = 남쪽(+z)에서 동쪽(+x)으로 잰 각도 → 게임 좌표 (TX + r sin, TZ + r cos)"""
    c = mathutils.Vector(_T(TX, 0, TZ))
    o.matrix_basis = mathutils.Matrix.Translation(c) @ mathutils.Matrix.Rotation(math.radians(deg), 4, "Z") @ mathutils.Matrix.Translation(-c) @ o.matrix_basis
    return o


def _join(name, objs):
    bpy.context.view_layer.update()
    with bpy.context.temp_override(active_object=objs[0], object=objs[0], selected_objects=objs, selected_editable_objects=objs):
        bpy.ops.object.join()
    objs[0].name = name
    return objs[0]


def _seat(k, steel, dark, bar):
    """의자 하나 (남쪽에 만들고 k × 30° 돌린다) : 등받이 · 머리 받침 · 앉는 판 · 무릎 안전바"""
    z = TZ + SEAT_R
    parts = [_box(f"gyrox_s{k}_back", TX - .26, TX + .26, .85, 1.75, z - .02, z + .08, dark),
             _box(f"gyrox_s{k}_head", TX - .16, TX + .16, 1.72, 2.0, z - .01, z + .09, dark),
             _box(f"gyrox_s{k}_pan", TX - .26, TX + .26, .78, .88, z + .05, z + .52, dark),
             _box(f"gyrox_s{k}_side_l", TX - .31, TX - .26, .78, 1.12, z - .02, z + .52, steel),
             _box(f"gyrox_s{k}_side_r", TX + .26, TX + .31, .78, 1.12, z - .02, z + .52, steel),
             _box(f"gyrox_s{k}_lap", TX - .25, TX + .25, 1.12, 1.25, z + .37, z + .5, bar),
             _box(f"gyrox_s{k}_lap_l", TX - .25, TX - .2, .88, 1.14, z + .43, z + .49, bar),
             _box(f"gyrox_s{k}_lap_r", TX + .2, TX + .25, .88, 1.14, z + .43, z + .49, bar),
             _box(f"gyrox_s{k}_arm", TX - .08, TX + .08, .9, 1.02, z - .3, z + .02, steel)]      # 고리에 의자를 잇는 팔
    for o in parts:
        _spin(o, k * 360 / SEATS)
    return parts


def build_gyro():
    for n in ("tower", "SIGN_tower", "LIGHT_tower_top", "COL_tower", "COL_tower_booth"):
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)
    _clear(("gyrox_", "IT_gyro_", "COLC_gyro_", "FLOORC_gyro", "LIGHT_gyro_", "SIGN_gyro_", "ANIM_gyro", "bxgyro_", "COL_bgyro_", "IT_manual_gyro", "IT_console_gyro",
            "IT_mic_gyro", "LIGHT_booth_gyro", "SIGN_booth_gyro", "SIGN_manual_gyro", "SPOT_booth_gyro", "IT_gbtn_", "IT_gnote_gyro"))
    M = bpy.data.materials
    red, white, iron, col = M["paint_red"], M["paint_white"], M["iron"], M["collider"]
    conc = M.get("concrete") or _mat("concrete", "#8d8a84", 0.9)
    yellow = M.get("paint_yellow") or _mat("paint_yellow", "#e9b82a", 0.6)
    bulb, bulb_red = M["bulb"], M.get("bulb_red") or _mat("bulb_red", "#ff2a1a", 0.4)
    blue, steel = _mat("gyrox_blue", "#22406e", 0.5), _mat("gyrox_steel", "#aeb4bd", 0.4)
    copper, dark, black = _mat("gyrox_copper", "#b8713a", 0.35), _mat("gyrox_seat", "#1c1e23", 0.6), _mat("gyrox_black", "#141414", 0.7)

    # ---- 승강장 : 원형 단 · 노란 안전선 · 완충기
    _cyl("gyrox_deck", TX, DECK_H / 2, TZ, DECK_R, DECK_H, conc, verts=48)
    _cyl("FLOORC_gyro", TX, DECK_H / 2, TZ, DECK_R, DECK_H, col, verts=24)
    _ring("gyrox_safeline", 2.95, 3.1, DECK_H, DECK_H + .006, yellow, n=48)
    for k in range(4):
        _spin(_cyl(f"gyrox_buffer{k}", TX, DECK_H + .22, TZ + 1.5, .2, .44, black, verts=14), 45 + 90 * k)
    # ---- 탑 : 기둥 · 흰 띠 · 가이드 레일 · 자석 브레이크 날개(구리) · 노란 띠
    _cyl("gyrox_tower", TX, DECK_H + TOWER_H / 2, TZ, 1.0, TOWER_H, blue, verts=16)
    for k, y in enumerate((20, 26, 32, 38)):
        _cyl(f"gyrox_band{k}", TX, y, TZ, 1.02, 1.0, white, verts=16)
    for k in range(4):
        a = 45 + 90 * k
        _spin(_box(f"gyrox_fin{k}", TX - .03, TX + .03, DECK_H, BRAKE_H, TZ + .98, TZ + 1.2, copper), a)
        _spin(_box(f"gyrox_rail{k}", TX - .05, TX + .05, BRAKE_H, TOWER_H, TZ + .98, TZ + 1.1, steel), a)
    _ring("gyrox_brake_band", 1.0, 1.06, BRAKE_H - .25, BRAKE_H + .25, yellow, n=16)
    _ring("gyrox_brake_band_a", 1.0, 1.07, BRAKE_H + .25, BRAKE_H + .33, black, n=16)
    _ring("gyrox_brake_band_b", 1.0, 1.07, BRAKE_H - .33, BRAKE_H - .25, black, n=16)
    _box("gyrox_brake_plate", TX - .9, TX + .9, 3.2, 4.0, TZ + .95, TZ + 1.04, yellow)
    _empty("SIGN_gyro_brake", TX, 3.6, TZ + 1.05, 0, w=1.7, h=0.7)
    # ---- 꼭대기 : 왕관 · 전구 · 안테나 · 빨간 등
    top = DECK_H + TOWER_H
    _cyl("gyrox_crown_a", TX, top + .25, TZ, 2.6, .5, white, verts=24)
    _cyl("gyrox_crown_b", TX, top + 1.3, TZ, 2.0, 1.6, red, verts=24)
    _cyl("gyrox_crown_c", TX, top + 2.6, TZ, 1.2, 1.0, white, verts=24)
    _cyl("gyrox_mast", TX, top + 4.6, TZ, .06, 3.0, iron, verts=8)
    _cyl("gyrox_beacon", TX, top + 6.2, TZ, .22, .3, bulb_red, verts=12)
    for k in range(12):
        _spin(_cyl(f"gyrox_crownbulb{k}", TX, top + .02, TZ + 2.62, .09, .12, bulb, verts=8), 30 * k)
    _empty("LIGHT_gyro_top", TX, top + 6.2, TZ, color="#ff2a1a", i=2, d=40)
    # ---- 탑승 의자 : 고리 + 의자 12개 (ANIM_gyro 의 자식)
    anim = _empty("ANIM_gyro", TX, 0, TZ)
    ring = _join("gyrox_carriage", [_ring("gyrox_car_a", 1.25, 1.72, .75, 1.3, red),
                                    _ring("gyrox_car_b", 1.22, 1.75, 1.3, 1.38, steel),
                                    _ring("gyrox_car_c", 1.22, 1.75, .67, .75, steel)])
    seats = _join("gyrox_seats", [o for k in range(1, SEATS) for o in _seat(k, steel, dark, yellow)])
    mine = _join("IT_gyro_seat", _seat(0, steel, dark, yellow))
    for o in (ring, seats, mine):
        o.parent = anim
        o.matrix_parent_inverse = anim.matrix_basis.inverted()      # 막 만든 빈 물체는 matrix_world 가 아직 갱신 전
    _cyl("COLC_gyro_tower", TX, 1.5, TZ, 2.75, 3.0, col, verts=16)
    # ---- 울타리 (남쪽 ±22° 가 입구) · 입구 문틀 · 간판 · 등
    fence = []
    for a in range(-174, 181, 6):
        if abs(a) <= 22:
            continue
        r = math.radians(a)
        _cyl(f"COLC_gyro_f{a}", TX + FENCE_R * math.sin(r), 1.0, TZ + FENCE_R * math.cos(r), .33, 2.0, col, verts=8)
        if a % 12 == 0:
            fence.append(_cyl(f"gyrox_post{a}", TX + FENCE_R * math.sin(r), DECK_H + .5, TZ + FENCE_R * math.cos(r), .035, 1.0, iron, verts=8))
    half, mid = FENCE_R * math.sin(math.radians(6)), FENCE_R * math.cos(math.radians(6))
    for a in range(-168, 181, 12):                       # 기둥 a ~ a+12 사이 가로대 (입구 구간은 비운다)
        if abs(a) <= 22 or abs(a + 12) <= 22 or (a < 0 < a + 12):
            continue
        for y in (DECK_H + .55, DECK_H + .95):
            fence.append(_spin(_box(f"gyrox_rail_{a}_{int(y * 100)}", TX - half, TX + half, y, y + .05, TZ + mid - .015, TZ + mid + .015, iron), a + 6))
    _join("gyrox_fence", fence)
    for k, sx in enumerate((-1.7, 1.7)):
        _cyl(f"gyrox_gate_post{k}", TX + sx, 1.7, TZ + 5.3, .12, 3.4, red, verts=12)
        _cyl(f"COLC_gyro_gate{k}", TX + sx, 1.0, TZ + 5.3, .16, 2.0, col, verts=8)
        _box(f"gyrox_gate_lamp{k}", TX + sx - .12, TX + sx + .12, 3.4, 3.55, TZ + 5.18, TZ + 5.42, bulb)
        _empty(f"LIGHT_gyro_{'ab'[k]}", TX + sx, 3.3, TZ + 5.7, color="#ffd9a0", i=1.5, d=15)
    _box("gyrox_gate_beam", TX - 1.9, TX + 1.9, 2.95, 3.55, TZ + 5.2, TZ + 5.4, red)
    _empty("SIGN_tower", TX, 3.25, TZ + 5.41, 0, w=3.4, h=0.5)
    # ---- 조작실 : 탑 서쪽 · 큰 창이 탑 쪽(동) · 문은 남쪽
    b = _Booth("gyro", -26.4, -46.6, 180)
    _booth_shell(b)
    con = b.box("IT_console_gyro", BT + .05, BT + .42, 0.8, 0.9, .55, 1.75, M["locker_dark"])
    for k in range(1, 4):
        _kids(con, _lamp(b, f"IT_gbtn_{k}", .32, 0.91, .8 + k * .22, f"g{k}"))
    b.box("IT_gnote_gyro", BT + .1, BT + .42, 0.8, 0.806, .2, .46, _mat("gyrox_note", "#e6dcb8", 0.9))      # 찢어진 근무 일지 (글은 엔진)
    for me in [m for m in bpy.data.meshes if m.users == 0]:
        bpy.data.meshes.remove(me)
    print("GYRO_OK")
