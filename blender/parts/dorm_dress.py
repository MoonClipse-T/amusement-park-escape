"""직원 숙소(방 1) 꾸미기 — 벽 두 색 칠 · 체크무늬 바닥 · 휴게 구석 · 소품 (Poly Haven CC0, blender/source/polyhaven/)

  build_lunaland_v2.py 가 숙소 뼈대를 만든 뒤 dress_dorm() 을 부른다.
  Blender 화면에서 따로 돌려도 된다 (dormx_ 로 시작하는 것을 지우고 다시 만든다):
    exec(open(r"<저장소>/blender/parts/dorm_dress.py", encoding="utf-8").read()); dress_dorm()

  좌표는 게임 좌표 (x 동서, y 높이, z 남북). 숙소 안쪽 벽면 : 서 x=-56.79 · 동 x=-47.2 · 북 z=0.21 · 남 z=7.79
  rot : 0=남쪽을 봄, 90=동, 180=북, -90=서 (build 스크립트의 sign() 과 같다)
"""
import bpy, bmesh, math, os, mathutils

_B = os.path.dirname(os.path.abspath(__file__))     # parts/ 에서 돌려도, build 스크립트가 exec 해도 blender/ 를 찾는다
_B = os.path.dirname(_B) if os.path.basename(_B) == "parts" else _B
PH = os.path.join(_B, "source", "polyhaven")
WX1, WX2, WZ1, WZ2 = -56.79, -47.2, 0.21, 7.79


def _T(x, y, z):
    return (x, -z, y)


def _mat(name, color, rough=0.8, image=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    c = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    b.inputs["Base Color"].default_value = (*[x ** 2.2 for x in c], 1)
    b.inputs["Roughness"].default_value = rough
    if image:
        t = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None) or nt.nodes.new("ShaderNodeTexImage")
        t.image = image
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    return m


def _box(name, x1, x2, y1, y2, z1, z2, m, uv=1.0):
    """게임 좌표 상자, 월드 크기 기준 UV (1m = uv 타일)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = mathutils.Vector(_T(x1 if v.co.x < 0 else x2, y1 if v.co.z < 0 else y2, z1 if v.co.y > 0 else z2))
    lay = bm.loops.layers.uv.new()
    for f in bm.faces:
        n = f.normal
        for l in f.loops:
            p = l.vert.co
            u, v = (p.y, p.z) if abs(n.x) > .5 else (p.x, p.z) if abs(n.y) > .5 else (p.x, p.y)
            l[lay].uv = (u * uv, v * uv)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def _empty(name, x, y, z, rot=0, **props):
    e = bpy.data.objects.new(name, None)
    e.location = _T(x, y, z)
    e.rotation_euler[2] = math.radians(rot)
    for k, v in props.items():
        e[k] = v
    bpy.context.scene.collection.objects.link(e)
    return e


def _checker():
    """바닥 비닐 타일 (크림 · 회녹색 체크). 이미지는 .blend 에 담아 둔다."""
    im = bpy.data.images.get("dormx_checker")
    if im:
        return im
    n = 64
    im = bpy.data.images.new("dormx_checker", n, n)
    a, b = (0.80, 0.77, 0.68), (0.36, 0.42, 0.40)
    px = []
    for j in range(n):
        for i in range(n):
            c = a if ((i // 32) + (j // 32)) % 2 == 0 else b
            edge = 0.85 if (i % 32 in (0, 31) or j % 32 in (0, 31)) else 1.0
            px += [c[0] * edge, c[1] * edge, c[2] * edge, 1.0]
    im.pixels = px
    im.pack()
    return im


def _prop(key, x, z, rot=0, y=0.0, height=None, decimate=None, name=None, tilt=None):
    """소품 하나를 바닥 중심 기준으로 (x, y, z) 에 놓는다. height 를 주면 그 높이로 맞춘다.
       key : Poly Haven 이름 (source/polyhaven/<key>/) 또는 'polypizza/<이름>.glb' · name : 뿌리 이름 (IT_… 로 주면 엔진이 조사 대상으로 읽는다)
       tilt : (x, y) 도 단위로 눕히기 (Blender 축)"""
    before = set(bpy.data.objects)
    path = os.path.join(_B, "source", key) if key.endswith(".glb") else os.path.join(PH, key, key + ".gltf")
    bpy.ops.import_scene.gltf(filepath=path)
    key = os.path.basename(key).split(".")[0]
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    pts = [o.matrix_world @ mathutils.Vector(c) for o in meshes for c in o.bound_box]
    mn = mathutils.Vector([min(p[i] for p in pts) for i in range(3)])
    mx = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
    s = height / (mx.z - mn.z) if height else 1.0
    root = _empty(name or f"dormx_{key}", x, y, z, rot)
    root.scale = (s, s, s)
    if tilt:
        root.rotation_euler[0], root.rotation_euler[1] = math.radians(tilt[0]), math.radians(tilt[1])
    piv = mathutils.Matrix.Translation(-mathutils.Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z)))
    for o in new:
        if o.parent is None:
            o.matrix_world = piv @ o.matrix_world
            o.parent = root
    for o in meshes:
        o.name = f"dormx_{key}_{o.name}"
        if decimate:
            d = o.modifiers.new("dec", "DECIMATE")
            d.ratio = decimate
    return root


MINE = ("dormx_", "SIGN_dorm_safety", "SIGN_lname_", "SIGN_forcedev", "SIGN_uniform_name", "IT_lockernote_dorm", "IT_uniform_dorm", "IT_bag_dorm",
        "IT_key_dorm", "IT_toolbox_dorm", "IT_torch_dorm", "IT_note2_dorm", "IT_forcedev_dorm", "IT_keypad_dorm")


def _cyl(name, x, y, z, r, h, m, axis="y", verts=20):
    """게임 좌표 원기둥 : 중심 (x, y, z), 축 방향 axis ('x' 는 동서로 누운 원기둥)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r, depth=h)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.location = _T(x, y, z)
    if axis == "x":
        o.rotation_euler[1] = math.radians(90)
    elif axis == "z":
        o.rotation_euler[0] = math.radians(90)
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def _kids(parent, *objs):
    for o in objs:
        o.parent = parent
    return parent


def _orient(e, normal, up):
    """표식 e(판 · 간판 자리)를 앞면이 normal, 글씨 위쪽이 up 방향(둘 다 Blender 좌표)이 되게 돌린다.
       glTF 로 나가면 Blender 의 -Y 가 판의 앞, +Z 가 글씨 위쪽이 된다."""
    y = -mathutils.Vector(normal).normalized()
    z = mathutils.Vector(up).normalized()
    e.rotation_euler = mathutils.Matrix((y.cross(z), y, z)).transposed().to_euler()
    return e


def _drape_jacket(name, cx, cz, top):
    """Poly Pizza 점퍼(CC0)를 등이 위로 오게 벤치에 걸친다. 깃은 -x(사물함 쪽), 몸판은 벤치 폭을 넘어 양옆으로 늘어진다.
       원래 모델 : 등 -X · 깃 +Z · 소매 ±Y. (cx, cz) 는 게임 좌표 중심, top 은 벤치 윗면 높이. 등 위 중심 높이를 돌려준다."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(_B, "source", "polypizza", "jacket.glb"))
    new = [o for o in bpy.data.objects if o not in before]
    o = next(x for x in new if x.type == "MESH")
    o.data.transform(o.matrix_world)
    for x in new:
        if x is not o:
            bpy.data.objects.remove(x, do_unlink=True)
    o.parent, o.matrix_world, o.name = None, mathutils.Matrix.Identity(4), name
    bm = bmesh.new()
    bm.from_mesh(o.data)
    c = sum((v.co for v in bm.verts), mathutils.Vector()) / len(bm.verts)
    s, half = 0.78, 0.2                                              # 크기 · 벤치 폭의 절반
    for v in bm.verts:
        p = v.co - c
        v.co = mathutils.Vector((-p.z * s, -p.y * s, -p.x * s * 0.28))   # 등이 위, 깃이 -x, 두께는 납작하게
    low = min(v.co.z for v in bm.verts)
    for v in bm.verts:
        v.co.z += top + 0.01 - low
        d = abs(v.co.x) - half
        if d > 0:                                                   # 벤치 밖으로 나간 부분은 아래로 처진다
            v.co.z = max(0.06, v.co.z - d * 1.7)
            v.co.x -= (1 if v.co.x > 0 else -1) * d * 0.45
        v.co.x += cx
        v.co.y += -cz
    hi = max(v.co.z for v in bm.verts if abs(v.co.x - cx) < 0.1 and abs(v.co.y + cz) < 0.1)
    bm.to_mesh(o.data)
    bm.free()
    for p in o.data.polygons:
        p.use_smooth = True
    return o, hi


def _hollow_locker(n, dark, steel):
    """서쪽 벽 사물함 n (1~6) 을 속이 빈 함으로 : 몸통 상자를 지우고 얇은 판 6장으로 다시 짓는다.
       build 스크립트 안에서는 locker_n_body 가 따로 있고, 이미 재질별로 합쳐진 .blend 에서는 v2_locker 에서 그 면만 지운다."""
    x1, x2, z1 = -56.79, -56.24, 1.6 + (n - 1) * 0.6
    z2, e = z1 + 0.6, 0.005
    body = bpy.data.objects.get(f"locker_{n}_body")
    if body:
        bpy.data.objects.remove(body, do_unlink=True)
    elif "v2_locker" in bpy.data.objects:
        o = bpy.data.objects["v2_locker"]
        bm = bmesh.new()
        bm.from_mesh(o.data)
        inside = lambda v: x1 - e <= v.x <= x2 + e and z1 - e <= -v.y <= z2 + e and v.z <= 2.06   # Blender 좌표 (y = -z)
        kill = [f for f in bm.faces if all(inside(o.matrix_world @ v.co) for v in f.verts)]
        bmesh.ops.delete(bm, geom=kill, context="FACES")
        bm.to_mesh(o.data)
        bm.free()
    # 문짝의 통풍구 · 손잡이는 따로 붙어 있어서 문이 열려도 제자리에 남는다 → 문짝(IT_locker_n)의 자식으로 다시 단다
    door = bpy.data.objects.get(f"IT_locker_{n}")
    parts = [o for o in bpy.data.objects if o.name.startswith((f"locker_{n}_vent", f"locker_{n}_handle"))]
    if parts:
        _kids(door, *parts)
    else:
        for name in ("v2_locker_dark", "v2_iron"):
            o = bpy.data.objects.get(name)
            if not o:
                continue
            bm = bmesh.new()
            bm.from_mesh(o.data)
            on_door = lambda v: x2 + .02 <= v.x <= x2 + .08 and z1 <= -v.y <= z2 and 0.95 <= v.z <= 1.95
            bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(on_door(o.matrix_world @ v.co) for v in f.verts)], context="FACES")
            bm.to_mesh(o.data)
            bm.free()
        LH = 2.05
        _kids(door, *[_box(f"dormx_l{n}_vent{k}", x2 + .03, x2 + .035, LH - .35 + k * .05, LH - .33 + k * .05, z1 + .15, z2 - .15, dark) for k in range(4)],
              _box(f"dormx_l{n}_handle", x2 + .03, x2 + .07, 1.0, 1.2, z2 - .12, z2 - .08, bpy.data.materials["iron"]))
    t = 0.02
    _box(f"dormx_l{n}_back", x1, x1 + t, 0.03, 2.05, z1, z2, dark)
    _box(f"dormx_l{n}_sa", x1, x2, 0.03, 2.05, z1, z1 + t, steel)
    _box(f"dormx_l{n}_sb", x1, x2, 0.03, 2.05, z2 - t, z2, steel)
    _box(f"dormx_l{n}_top", x1, x2, 2.03, 2.05, z1, z2, steel)
    _box(f"dormx_l{n}_bot", x1, x2, 0.03, 0.12, z1, z2, steel)
    _box(f"dormx_l{n}_shelf", x1 + t, x2 - .03, 1.64, 1.66, z1 + t, z2 - t, steel)
    _box(f"dormx_l{n}_inside", x1 + t, x1 + t + .002, 0.12, 2.03, z1 + t, z2 - t, dark)


def dress_dorm():
    for o in [o for o in bpy.data.objects if o.name.startswith(MINE)]:
        bpy.data.objects.remove(o, do_unlink=True)

    # 1) 벽 : 아래 1m 는 회녹색 페인트, 그 위에 나무 띠 (오래된 직원 건물 느낌)
    paint = _mat("dormx_wainscot", "#4f6a66", 0.75)
    rail = bpy.data.materials.get("darkwood") or _mat("dormx_rail", "#3a2a1e", 0.6)
    t, y1, y2 = 0.015, 0.03, 1.02
    walls = [(WX1, WX1 + t, WZ1, WZ2), (WX1, WX2, WZ1, WZ1 + t), (WX1, WX2, WZ2 - t, WZ2),
             (WX2 - t, WX2, WZ1, 3.32), (WX2 - t, WX2, 4.68, WZ2)]
    for k, (a, b, c, d) in enumerate(walls):
        _box(f"dormx_wainscot_{k}", a, b, y1, y2, c, d, paint)
        ox = t if a == WX1 and b == WX1 + t else -t if b == WX2 and a == WX2 - t else 0
        oz = t if c == WZ1 and d == WZ1 + t else -t if d == WZ2 and c == WZ2 - t else 0
        _box(f"dormx_rail_{k}", min(a, a + ox), max(b, b + ox), y2, y2 + .06, min(c, c + oz), max(d, d + oz), rail)

    # 2) 바닥 : 체크무늬 비닐 타일 (한 칸 0.4m)
    floor = _mat("dormx_floor", "#ffffff", 0.55, _checker())
    _box("dormx_floor", WX1, WX2, 0.03, 0.035, WZ1, WZ2, floor, uv=1 / 0.8)

    # 3) 휴게 구석 (북동쪽) : 낡은 소파 · 낮은 탁자 · 전기 주전자 · 무전기
    _prop("sofa_02", -49.7, WZ1 + 0.45, 0)
    _prop("small_wooden_table_01", -49.7, 1.75, 0)
    _prop("vintage_electric_kettle", -50.0, 1.75, 30, y=0.53, decimate=0.3)
    _prop("vintage_radio_transceiver", -49.35, 1.7, -20, y=0.53, height=0.24, decimate=0.25)

    # 4) 북서쪽 구석 : 철제 선반 + 상자
    _prop("steel_frame_shelves_01", -55.7, 0.62, 0, height=1.8)
    for k, (x, y, z, r) in enumerate(((-55.7, 0.04, 0.6, 0), (-55.6, 0.66, 0.62, 8), (-55.75, 1.25, 0.6, -6))):
        _prop("cardboard_box_01", x, z, r, y=y, height=0.3, decimate=0.08)

    # 5) 남서쪽 구석 : 쌓인 상자 · 빗자루
    for k, (x, y, z, r) in enumerate(((-55.9, 0.03, 7.3, 0), (-55.3, 0.03, 7.35, 12), (-55.7, 0.37, 7.3, -8))):
        _prop("cardboard_box_01", x, z, r, y=y, height=0.34, decimate=0.08)
    _prop("plastic_broom", -54.7, 7.55, 180, decimate=0.2)

    # 6) 문 옆 소화기 · 남동쪽 화분
    _prop("korean_fire_extinguisher_01", -47.55, 2.95, -90, decimate=0.4)
    _prop("potted_plant_02", -47.75, 7.35, 0, height=0.9, decimate=0.15)

    # 7) 안전 수칙 포스터 (남쪽 벽, 서쪽 창가) — 글씨는 엔진(SIGNS.dorm_safety)이 붙인다
    _empty("SIGN_dorm_safety", -55.0, 1.7, WZ2 - .02, 180, w=1.1, h=0.8)

    # ---------------- 방 1 퍼즐 소품 (rooms/room1_dorm.js 가 IT_ 이름으로 읽는다) ----------------
    M = bpy.data.materials
    paper, dark = M["paper"], M["locker_dark"]
    # 8) 사물함 이름표 : 번호판 바로 아래 (글씨는 엔진이 ROOM1.names 로 붙인다)
    for n in range(1, 11):
        if n <= 6:
            _empty(f"SIGN_lname_{n}", -56.195, 1.46, 1.6 + (n - 1) * 0.6 + 0.3, 90, w=0.32, h=0.075)
        else:
            _empty(f"SIGN_lname_{n}", -54.6 + (n - 7) * 0.6 + 0.3, 1.46, 0.805, 0, w=0.32, h=0.075)
    # 9) 3번 사물함 문에 붙은 쪽지
    _box("IT_lockernote_dorm", -56.205, -56.198, 1.02, 1.26, 2.98, 3.2, paper)
    # 10) 벤치 위 이전 근무자의 근무복 : 점퍼를 등이 위로 오게 걸쳐 두고, 등판에 이름을 찍는다 (글씨는 엔진의 SIGNS.uniform_name)
    _, back = _drape_jacket("IT_uniform_dorm", -54.7, 3.2, 0.47)
    _orient(_empty("SIGN_uniform_name", -54.63, back + 0.006, 3.2, w=0.44, h=0.15), (0, 0, 1), (-1, 0, 0))
    # 11) 사물함 속 (3번 · 6번) : 통짜 몸통을 지우고 속이 빈 철제 함(뒤 · 옆 · 위 · 바닥 · 선반)으로 바꾼다
    for n in (3, 6):
        _hollow_locker(n, dark, M["locker"])
    #   6번 (김근수) : 가방 · 고리에 걸린 열쇠
    _prop("polypizza/backpack.glb", -56.52, 4.9, 90, y=0.12, height=0.46, name="IT_bag_dorm")
    _cyl("dormx_l6_hook", -56.62, 1.5, 4.9, 0.006, 0.3, M["iron"], axis="x", verts=8)
    _prop("polypizza/key.glb", -56.5, 4.9, 90, y=1.36, height=0.11, name="IT_key_dorm")
    #   3번 (이해권 · 나) : 공구함 · 선반 위 손전등 · 뒷벽에 붙은 지시서 #2
    _prop("metal_toolbox", -56.5, 3.1, 90, y=0.12, height=0.22, decimate=0.3, name="IT_toolbox_dorm")
    _prop("signal_flashlight", -56.5, 3.1, 90, y=1.68, decimate=0.3, name="IT_torch_dorm")
    _box("IT_note2_dorm", -56.765, -56.76, 1.12, 1.44, 2.98, 3.22, paper)
    # 12) 문 옆 '장력 평형 잠금장치' (번호 자물쇠 자리를 대신한다) : 패널 · 눈금판 · 바늘 · 손잡이 바퀴 · 줄
    dev = _box("IT_forcedev_dorm", -47.29, -47.2, 0.98, 1.62, 4.76, 5.2, M["locker_dark"])
    _kids(dev,
          _cyl("dormx_fd_dial", -47.3, 1.44, 4.98, 0.11, 0.02, M["paint_white"], axis="x", verts=28),
          _cyl("dormx_fd_rim", -47.295, 1.44, 4.98, 0.122, 0.015, M["brass"], axis="x", verts=28),
          _box("dormx_fd_needle", -47.315, -47.31, 1.44, 1.53, 4.975, 4.985, M["paint_red"]),
          _cyl("dormx_fd_wheel", -47.31, 1.12, 4.98, 0.075, 0.025, M["iron"], axis="x", verts=20),
          _cyl("dormx_fd_knob", -47.34, 1.17, 5.02, 0.012, 0.06, M["paint_red"], axis="x", verts=10),
          _cyl("dormx_fd_cable_v", -47.24, 2.0, 4.98, 0.006, 0.76, M["iron"], verts=6),
          _cyl("dormx_fd_cable_h", -47.24, 2.38, 4.18, 0.006, 1.6, M["iron"], axis="z", verts=6),
          _cyl("dormx_fd_pulley", -47.24, 2.38, 4.98, 0.04, 0.02, M["brass"], axis="x", verts=16))
    _empty("SIGN_forcedev", -47.198, 1.73, 4.98, -90, w=0.5, h=0.13)
    print("DORM_DRESS_OK", len([o for o in bpy.data.objects if o.name.startswith(MINE)]))
