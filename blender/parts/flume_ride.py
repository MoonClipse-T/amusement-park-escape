"""롤러코스터 → 후룸라이드 (통나무 보트가 마지막에 물로 떨어지는 놀이기구) · 방 4 무대

  마지막 낙하 구간 (트랙 x 45 → 27, z ≈ -1, 높이 6.7 → 1.4) 아래에 물길(물이 흐르는 홈통)을 깔고,
  바닥에는 물이 고인 스플래시 풀 (높인 물탱크, 수면 1.0 m) — 통나무 보트 하나가 떠 있다. (부력 점검 무대)
  역 남쪽에 조작실 (carousel_booth.py 의 _Booth · _booth_shell) — 문이 잠겨 있고, 문 옆 키패드 + 쪽지.
  dorm_dress.py · carousel_booth.py 의 도우미를 쓴다 (build 스크립트가 parts 를 차례로 exec).
  Sketchfab (CC BY) : log_ride_boat.glb · log_ride_trough.glb · log_ride_support.glb — "FNAF SB | Foxy Logride Assets" by KPMisParrot (보트 · 물길만, 캐릭터 판넬은 지움)
                      keypad_door_lock.glb — "CC0 - Keypad Door Lock" by plaggy
  엔진이 읽는 이름 : IT_flume_pool(스플래시 풀) · IT_flume_boat(역에 선 점검용 보트, 엔진이 트랙을 따라 움직인다) · IT_fsand_1~9(보트의 모래주머니)
            IT_flume_crane(크레인 조작 기둥 · 힘 센서) · COL_flume_pool · COL_flume_gantry_ · LIGHT_flume · SIGN_flume_pool · SIGN_flume_crane
  Sketchfab (CC BY) : gantry_crane.glb — "Gantry Portica" by speedtwo · sandbag.glb — "Sandbag [Low Poly Realist]" by Islide
            조작실 (tag = coaster) : IT_manual_coaster · IT_console_coaster · IT_mic_coaster · SPOT_booth_coaster · SIGN_booth_coaster
            COL_GATE_cbooth(잠긴 문) · ANIM_cbdoor(문 경첩) · IT_keypad_coaster(키패드) · IT_keynote_coaster(옆에 붙은 쪽지 — 코스 그림)
"""
import bpy, bmesh, math, os, mathutils

POOL = (26.6, 34.0, -3.6, 1.8)        # 스플래시 풀 바깥 x1 x2 z1 z2 (게임 좌표)
POOL_H, WATER_H = 1.15, 1.0           # 물탱크 벽 높이 · 수면 높이
BOAT_H = 0.9                          # 보트 높이 (등받이 꼭대기까지) — 테두리(보트 깊이 D)는 아래에서 0.68 m
LINE_LOCAL = 0.6 * 0.553              # 초록 선(알맞게 잠기는 깊이 = D 의 60 %) · 보트 뿌리 좌표 (크기 1.233 배 전)
SAND_N = 9                            # 모래주머니 (손님 무게 대신) — 엔진 room4 의 ROOM4.bags 와 같게
CRANE = (32.3, -0.7)                  # 크레인 가운데 (다리는 풀 남북 바깥)


def _track_line(x1=27, x2=45):
    """롤러코스터 마지막 낙하 구간의 중심선 [(x, 높이, z)] — 트랙 메시 꼭짓점을 x 1 m 씩 모아 레일 꼭대기를 잡는다"""
    o = bpy.data.objects["coaster"]
    mw, bins = o.matrix_world, {}
    for v in o.data.vertices:
        p = mw @ v.co
        zref = -0.7 - max(0, p.x - 37) * 0.29          # 이 구간 트랙이 지나는 z (위를 지나가는 다른 트랙 · 기둥은 뺀다)
        if x1 - .5 <= p.x <= x2 + .5 and abs(-p.y - zref) < 1.0:
            bins.setdefault(round(p.x), []).append((p.z, -p.y))
    line = []
    for x in range(x1, x2 + 1):
        pts = bins.get(x)
        if not pts:
            continue
        top = max(h for h, _ in pts)
        zs = [z for h, z in pts if h > top - .45]
        line.append((x, top, sum(zs) / len(zs)))
    return line


def _water():
    m = _mat("flumex_water", "#2c7f93", 0.06)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Metallic"].default_value = 0.15
    b.inputs["Emission Color"].default_value = (0.02, 0.09, 0.11, 1)
    b.inputs["Emission Strength"].default_value = 0.6          # 밤에도 물빛이 보이게
    return m


def _import_glb(key, name):
    """GLB 하나를 메시 하나로 합쳐 원점(가로 가운데 · 바닥)으로 옮긴다 — 물길 조각을 여러 번 복제하려고"""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(_B, "source", key))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    bm = bmesh.new()
    for o in meshes:
        t = bmesh.new()
        t.from_mesh(o.data)
        t.transform(o.matrix_world)
        tm = bpy.data.meshes.new("t")
        t.to_mesh(tm)
        t.free()
        bm.from_mesh(tm)
        bpy.data.meshes.remove(tm)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(meshes[0].data.materials[0])
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    xs, ys, zs = zip(*[v.co[:] for v in me.vertices])
    me.transform(mathutils.Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -max(zs))))   # 윗면 = 0
    return me, max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)


def _flume():
    """낙하 구간 물길 : 홈통 조각을 트랙 아래로 이어 붙이고, 안에 물 띠"""
    line = _track_line()
    me, w, L, h = _import_glb("sketchfab/log_ride_trough.glb", "flumex_trough")
    sup, sw, sl, sh = _import_glb("sketchfab/log_ride_support.glb", "flumex_support")
    s = 1.6 / w                                       # 홈통 폭 1.6 m
    water, rib = _water(), []
    for i, ((xa, ha, za), (xb, hb, zb)) in enumerate(zip(line, line[1:])):
        a, b = mathutils.Vector((xa, -za, ha - .12)), mathutils.Vector((xb, -zb, hb - .12))    # Blender 좌표, 레일보다 조금 아래가 홈통 윗면
        d = b - a
        o = bpy.data.objects.new(f"flumex_trough_{i}", me)
        bpy.context.scene.collection.objects.link(o)
        o.location = (a + b) / 2
        o.rotation_mode = "XZY"
        o.rotation_euler = (math.atan2(d.z, d.xy.length), 0, math.atan2(-d.x, d.y))
        o.scale = (s, d.length / L * 1.04, s)
        if i % 3 == 0 and (a.z + b.z) / 2 > POOL_H + 1.2:       # 받침 기둥
            k = bpy.data.objects.new(f"flumex_support_{i}", sup)
            bpy.context.scene.collection.objects.link(k)
            hh = (a.z + b.z) / 2 - h * s
            k.location = ((a.x + b.x) / 2, (a.y + b.y) / 2, hh)
            k.scale = (1.2, 1.2, hh / sh)
        rib.append((a, d))
    rib.append((mathutils.Vector((line[-1][0], -line[-1][2], line[-1][1] - .12)), rib[-1][1]))
    # 물 띠 : 홈통 바닥보다 조금 위
    bm = bmesh.new()
    rows = []
    for p, d in rib:
        n = mathutils.Vector((-d.y, d.x, 0)).normalized() * .55
        q = p + mathutils.Vector((0, 0, -h * s * .55))
        rows.append((bm.verts.new(q - n), bm.verts.new(q + n)))
    for (a1, a2), (b1, b2) in zip(rows, rows[1:]):
        bm.faces.new((a1, a2, b2, b1))
    wm = bpy.data.meshes.new("flumex_water_rib")
    bm.to_mesh(wm)
    bm.free()
    wm.materials.append(water)
    o = bpy.data.objects.new("flumex_water_rib", wm)
    bpy.context.scene.collection.objects.link(o)


def _pool():
    """스플래시 풀 : 콘크리트 물탱크 (모서리 깎기) + 수면 + 떠 있는 통나무 보트"""
    M = bpy.data.materials
    x1, x2, z1, z2 = POOL
    t, conc, water = 0.3, M.get("concrete") or _mat("flumex_conc", "#8d8a84", 0.9), _water()
    trim = M["paint_red"]
    for n, (a, b, c, d) in {"w": (x1, x1 + t, z1, z2), "e": (x2 - t, x2, z1, z2), "n": (x1, x2, z1, z1 + t), "s": (x1, x2, z2 - t, z2)}.items():
        w = _box(f"flumex_pool_{n}", a, b, 0, POOL_H, c, d, conc, uv=0.5)
        bev = w.modifiers.new("bevel", "BEVEL")
        bev.width, bev.segments = 0.06, 2
        _box(f"flumex_pool_cap_{n}", a - .03, b + .03, POOL_H, POOL_H + .06, c - .03, d + .03, trim)
    _box("IT_flume_pool", x1 + t, x2 - t, WATER_H - .02, WATER_H, z1 + t, z2 - t, water)          # 수면 (조사 대상)
    _box("flumex_pool_floor", x1 + t, x2 - t, 0.05, 0.1, z1 + t, z2 - t, _mat("flumex_pool_floor", "#1d3c44", 0.9))
    _box("COL_flume_pool", x1, x2, 0, 2.5, z1, z2, M["collider"])
    _empty("LIGHT_flume", 30.4, 3.2, -0.8, color="#7fd6ff", i=1.1, d=10)
    # 안내판 (풀 남쪽, 광장 쪽을 봄)
    _box("flumex_board", 27.0, 29.0, 1.25, 2.15, 2.24, 2.30, M["paint_white"])
    _box("flumex_board_rim", 26.95, 29.05, 1.2, 2.2, 2.20, 2.26, trim)
    for k, x in enumerate((27.2, 28.8)):
        _cyl(f"flumex_board_post{k}", x, 1.0, 2.16, 0.04, 2.0, M["iron"], verts=10)
    _empty("SIGN_flume_pool", 28.0, 1.7, 2.305, 0, w=1.9, h=0.85)
    # 크레인 (풀을 가로지르는 문형 크레인) + 남쪽 조작 기둥 (힘 센서 화면)
    cx, cz = CRANE
    gan = _prop("sketchfab/gantry_crane.glb", cx, cz, rot=90, height=4.6, name="flumex_gantry")
    gan.scale.z *= 1.35                                  # 키만 6.2 m 로 — 낙하 직전 탄 사람 머리 위로 들보가 지나가게
    for n, (z1, z2) in {"n": (cz - 3.75, cz - 3.25), "s": (cz + 3.25, cz + 3.75)}.items():
        _box(f"COL_flume_gantry_{n}", cx - 1.1, cx + 1.1, 0, 2.5, z1, z2, M["collider"])
    _cyl("flumex_panel_post", 29.5, 0.55, 2.55, 0.06, 1.1, M["iron"], verts=12)
    pan = _box("IT_flume_crane", 29.2, 29.8, 1.05, 1.45, 2.4, 2.6, _mat("flumex_panel", "#d8a21c", 0.5))
    _kids(pan, _box("flumex_panel_scr", 29.3, 29.7, 1.18, 1.38, 2.6, 2.63, _mat("flumex_panel_scr", "#10241c", 0.3)))
    _empty("SIGN_flume_crane", 29.5, 1.28, 2.635, 0, w=0.4, h=0.2)


def _boat():
    """역(빨간 열차가 서 있던 자리)에 점검용 통나무 보트 — 모래주머니 9개 · 옆면 초록 선(알맞게 잠기는 깊이)"""
    boat = _prop("sketchfab/log_ride_boat.glb", 26.0, -9.0, rot=0, y=1.4, height=BOAT_H, name="IT_flume_boat", child="flumex_")
    bpy.context.view_layer.update()
    s = boat.scale.x
    # 모래주머니 : 좌석 사이 바닥에 아래 5개 · 위 4개 (보트 뿌리 좌표)
    spots = [(y, .18) for y in (-.5, -.25, 0, .25, .5)] + [(y, .32) for y in (-.375, -.125, .125, .375)]
    first = None
    for k, (y, z) in enumerate(spots[:SAND_N], 1):
        if first is None:
            bag = first = _prop("sketchfab/sandbag.glb", 0, 0, height=0.15, name=f"IT_fsand_{k}", child="flumex_")
        else:                                           # 같은 메시 · 텍스처를 나눠 쓰는 복제
            def dup(o, parent):
                c = o.copy()
                bpy.context.scene.collection.objects.link(c)
                c.parent = parent
                for k2 in o.children:
                    dup(k2, c)
                return c
            bag = dup(first, boat)
            bag.name = f"IT_fsand_{k}"
        bag.parent = boat
        bag.matrix_parent_inverse.identity()
        bag.location = (0, y, z)
        bag.rotation_euler = (0, 0, 1.5708)
        if bag is first:
            bag.scale = [v / s for v in bag.scale]
    # 초록 선 : 보트 겉면을 선 높이에서 얇게 잘라 낸 띠 (바깥을 보는 면만)
    bpy.context.view_layer.update()
    hull = next(c for c in boat.children_recursive if c.type == "MESH" and "log_ride_boat" in c.name)
    bm = bmesh.new()
    bm.from_mesh(hull.data)
    bm.transform(boat.matrix_world.inverted() @ hull.matrix_world)
    h0, h1 = LINE_LOCAL - .012, LINE_LOCAL + .012
    g = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=g, plane_co=(0, 0, h1), plane_no=(0, 0, 1), clear_outer=True)
    g = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=g, plane_co=(0, 0, h0), plane_no=(0, 0, -1), clear_outer=True)
    inner = [f for f in bm.faces if f.normal.x * f.calc_center_median().x + f.normal.y * f.calc_center_median().y <= 0 or abs(f.normal.z) > .7]
    bmesh.ops.delete(bm, geom=inner, context="FACES")
    for v in bm.verts:
        v.co.x *= 1.025
        v.co.y *= 1.01
    me = bpy.data.meshes.new("flumex_waterline")
    bm.to_mesh(me)
    bm.free()
    gm = _mat("flumex_waterline", "#2fe07a", 0.5)
    b = next(n for n in gm.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Emission Color"].default_value = (0.1, 0.9, 0.35, 1)
    b.inputs["Emission Strength"].default_value = 1.5
    me.materials.append(gm)
    line = bpy.data.objects.new("flumex_waterline", me)
    bpy.context.scene.collection.objects.link(line)
    line.parent = boat


def _strip_trains():
    """롤러코스터 역에 서 있던 빨간 열차 3량(따로 떨어진 상자 덩어리)만 지운다 — 레일 · 침목은 길게 이어져 있어 남는다"""
    o = bpy.data.objects["coaster"]
    mw = o.matrix_world
    bm = bmesh.new()
    bm.from_mesh(o.data)
    seen, kill = set(), []
    for v in bm.verts:
        if v in seen:
            continue
        isl, stack = [], [v]
        seen.add(v)
        while stack:
            a = stack.pop()
            isl.append(a)
            for e in a.link_edges:
                w = e.other_vert(a)
                if w not in seen:
                    seen.add(w)
                    stack.append(w)
        P = [mw @ p.co for p in isl]
        if min(p.x for p in P) > 25.2 and max(p.x for p in P) < 26.8 and min(p.y for p in P) > 4.8 and max(p.y for p in P) < 12.6 and min(p.z for p in P) > 1.3:
            kill += isl
    bmesh.ops.delete(bm, geom=kill, context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    return len(kill)


def build_flume():
    _clear(("flumex_", "IT_flume_", "COL_flume_", "LIGHT_flume", "SIGN_flume_",
            "bxcoaster_", "COL_bcoaster_", "IT_manual_coaster", "IT_console_coaster", "IT_mic_coaster", "LIGHT_booth_coaster", "SIGN_booth_coaster",
            "SIGN_manual_coaster", "SPOT_booth_coaster", "COL_GATE_cbooth", "ANIM_cbdoor", "IT_keypad_coaster", "IT_keynote_coaster", "IT_keynote2_coaster", "IT_cbtn_",
            "IT_fsand_", "IT_flume_crane"))
    for me in [m for m in bpy.data.meshes if m.users == 0]:
        bpy.data.meshes.remove(me)
    _strip_trains()
    _flume()
    _pool()
    _boat()
    # ---- 조작실 : 역 남쪽, 큰 창이 스플래시 풀(동쪽), 문은 남쪽 (광장에서 걸어오는 쪽)
    M = bpy.data.materials
    b = _Booth("coaster", 24.2, 3.4, 180)
    _booth_shell(b)
    p, top = b.p, 0.9
    con = b.box("IT_console_coaster", BT + .05, BT + .42, 0.8, top, .55, 1.75, M["locker_dark"])
    for k in range(1, 4):                              # 조작반 버튼 3개 (퍼즐 내용이 정해지면 엔진이 쓴다)
        _kids(con, _lamp(b, f"IT_cbtn_{k}", .32, top + .01, .8 + k * .22, f"c{k}"))
    # 잠긴 문 : 경첩(ANIM_cbdoor) 에 문짝을 매단다 — 엔진이 rotation.y 로 연다
    hinge = b.emp("ANIM_cbdoor", DOOR[0], 0, BT / 2)
    slab = [b.box(p + "door", DOOR[0] + .02, DOOR[1] - .02, 0.02, 2.13, .03, .09, M["paint_red"]),
            b.box(p + "door_win", DOOR[0] + .25, DOOR[1] - .25, 1.35, 1.85, .02, .1, _glass()),
            b.cyl(p + "door_knob", DOOR[1] - .14, 1.0, -.0, 0.035, 0.22, M["brass"], axis="z", verts=12)]
    for o in slab:
        o.parent = hinge
        o.matrix_parent_inverse = hinge.matrix_basis.inverted()      # 막 만든 빈 물체는 matrix_world 가 아직 갱신 전
    b.box("COL_GATE_cbooth", DOOR[0], DOOR[1], 0, 2.5, -.05, BT + .05, M["collider"])
    # 문 옆 키패드 + 그 옆에 붙은 쪽지 (바깥 벽, 문 왼쪽)
    b.prop("sketchfab/keypad_door_lock.glb", .8, -.035, rot=180, y=1.22, height=0.22, name="IT_keypad_coaster")
    sticky = _mat("flumex_sticky", "#f1e38a", 0.9)
    note = b.box("IT_keynote_coaster", .26, .58, 1.12, 1.5, -.012, -.002, sticky)                 # 코스 그림이 그려진 쪽지 (그림은 엔진 화면)
    _kids(note, b.box(p + "note_tape", .36, .48, 1.47, 1.53, -.016, -.011, _mat("flumex_tape", "#d9d4c4", 0.6)))
    z = bpy.data.objects.get("ZONE_coaster")         # 구역 이름 → 후룸라이드. 속성만 바꾸면 glTF 내보내기가 옛 값을 쓴다 → 빈 물체를 새로 만든다
    if z and z.get("title") != "후룸라이드":
        loc, cols, r = z.location.copy(), list(z.users_collection), z.get("r", 9)
        bpy.data.objects.remove(z, do_unlink=True)
        n = bpy.data.objects.new("ZONE_coaster", None)
        n.location, n["title"], n["r"] = loc, "후룸라이드", r
        for c in cols:
            c.objects.link(n)
