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


def _prop(key, x, z, rot=0, y=0.0, height=None, decimate=None):
    """Poly Haven 소품 하나를 바닥 중심 기준으로 (x, y, z) 에 놓는다. height 를 주면 그 높이로 맞춘다."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(PH, key, key + ".gltf"))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    pts = [o.matrix_world @ mathutils.Vector(c) for o in meshes for c in o.bound_box]
    mn = mathutils.Vector([min(p[i] for p in pts) for i in range(3)])
    mx = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
    s = height / (mx.z - mn.z) if height else 1.0
    root = _empty(f"dormx_{key}", x, y, z, rot)
    root.scale = (s, s, s)
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


def dress_dorm():
    for o in [o for o in bpy.data.objects if o.name.startswith(("dormx_", "SIGN_dorm_safety"))]:
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

    # 6) 문 옆 소화기 · 남동쪽 화분 · 책상 위 손전등
    _prop("korean_fire_extinguisher_01", -47.55, 2.95, -90, decimate=0.4)
    _prop("potted_plant_02", -47.75, 7.35, 0, height=0.9, decimate=0.15)
    _prop("signal_flashlight", -52.55, 7.25, 70, y=0.785, decimate=0.3)

    # 7) 안전 수칙 포스터 (남쪽 벽, 서쪽 창가) — 글씨는 엔진(SIGNS.dorm_safety)이 붙인다
    _empty("SIGN_dorm_safety", -55.0, 1.7, WZ2 - .02, 180, w=1.1, h=0.8)
    print("DORM_DRESS_OK", len([o for o in bpy.data.objects if o.name.startswith("dormx_")]))
