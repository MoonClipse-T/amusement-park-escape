"""달토끼 봉제인형 (귀여운 버전)
build_lunaland_v2.py 안에서 exec 로 읽는다 (T, mat, M, COLL 등 공용 도우미 사용).

  build_rabbit(gx, gz, facing, s=1.0, prefix="rabbit", anim_head=True, base_y=0.0, with_mortar=True)
    gx, gz   : 게임 좌표 위치 (발밑)
    facing   : 바라보는 방향 (0=남, 90=동, 180=북, -90=서) — SIGN_ 과 같은 규칙
    s        : 크기 배율 (1.0 = 귀 끝까지 약 2.7m)
    anim_head: True 면 머리 부품을 ANIM_<prefix>head 아래에 묶는다 (엔진이 고개를 돌린다)

  만드는 방법 : 겹친 구(몸통 · 배 · 팔 · 발 · 꼬리 / 머리 · 볼 · 주둥이 · 귀)를 하나로 녹여(복셀 리메시)
               매끄럽게 다듬어서, 솜을 채운 봉제인형처럼 이음매 없이 둥근 모양을 만든다.

  나중에 공포 버전을 만들 때 바꿀 부품 이름 :
    <prefix>_mouth (입 실) · <prefix>_eye_L/R (단추 눈) · <prefix>_eyeglow_L/R (붉은 눈, 지금은 꺼짐)
    <prefix>_mortar_in (절구 속 떡) · <prefix>_pestle (공이)
"""
import bpy, bmesh, math, mathutils


def _fabric(name, color, rough=0.95, fuzz=True):
    """봉제 원단 : 잔털 느낌 노멀맵"""
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    c = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    b.inputs["Base Color"].default_value = (*[x ** 2.2 for x in c], 1)
    b.inputs["Roughness"].default_value = rough
    if fuzz:
        img = bpy.data.images.get("plush_fuzz_n")
        if img is None:
            import random
            N = 128
            rnd = random.Random(3)
            h = [[rnd.random() for _ in range(N)] for _ in range(N)]
            img = bpy.data.images.new("plush_fuzz_n", N, N)
            px = [0.0] * (N * N * 4)
            for y in range(N):
                for x in range(N):
                    dx = (h[y][(x + 1) % N] - h[y][x - 1]) * 0.5
                    dy = (h[(y + 1) % N][x] - h[y - 1][x]) * 0.5
                    n = mathutils.Vector((-dx, -dy, 1)).normalized()
                    i = (y * N + x) * 4
                    px[i:i + 4] = [n.x * .5 + .5, n.y * .5 + .5, n.z * .5 + .5, 1]
            img.pixels = px
            img.pack()
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = img
        img.colorspace_settings.name = "Non-Color"
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = 0.5
        nt.links.new(tex.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def _smooth(o, angle=60):
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.use_auto_smooth = True
    o.data.auto_smooth_angle = math.radians(angle)


def _ellipsoid(co, semi, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=1, location=co)
    o = bpy.context.object
    o.scale = semi
    o.rotation_euler = [math.radians(a) for a in rot]
    with bpy.context.temp_override(object=o, active_object=o, selected_editable_objects=[o]):
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return o


_LOD = 1.0


def _blob(name, shapes, voxel=0.022, smooth_it=12, keep=0.45):
    """겹친 타원체들을 하나로 녹여 매끄러운 덩어리로"""
    objs = [_ellipsoid(*sh) for sh in shapes]
    with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    o = objs[0]
    o.name = name
    for mname, typ, kw in (("rm", "REMESH", dict(mode="VOXEL", voxel_size=voxel)),
                           ("sm", "SMOOTH", dict(iterations=smooth_it, factor=0.5)),
                           ("dc", "DECIMATE", dict(ratio=keep * _LOD))):
        md = o.modifiers.new(mname, typ)
        for k, v in kw.items():
            setattr(md, k, v)
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.object.modifier_apply(modifier=mname)
    # 위치 원점을 그대로 두고, UV 는 구형 투영 (원단 노멀맵용)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    lay = bm.loops.layers.uv.new("UVMap")
    cen = sum((v.co for v in bm.verts), mathutils.Vector()) / max(1, len(bm.verts))
    for f in bm.faces:
        for l in f.loops:
            d = (l.vert.co - cen).normalized()
            l[lay].uv = (math.atan2(d.y, d.x) / math.tau + 0.5, math.asin(max(-1, min(1, d.z))) / math.pi + 0.5)
    bm.to_mesh(o.data)
    bm.free()
    _smooth(o, 80)
    return o


def _ball(name, co, r, mat_, scale=(1, 1, 1), rot=(0, 0, 0), seg=24, ring=16):
    if _LOD < 1:
        seg, ring = 12, 8
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=r, location=co)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    o.rotation_euler = [math.radians(a) for a in rot]
    o.data.materials.append(mat_)
    _smooth(o, 80)
    return o


def _tube(name, pts, r, mat_):
    """곡선을 따라 가는 실 (입 · 바느질선)"""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    ob = bpy.data.objects.new(name, cu)
    COLL.objects.link(ob)
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target="MESH")
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.append(mat_)
    _smooth(ob, 80)
    return ob


def _rod(name, a, b, r, mat_, verts=16, bevel=0.0):
    """a → b 를 잇는 원기둥"""
    a, b = mathutils.Vector(a), mathutils.Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.object
    o.name = name
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = mathutils.Vector((0, 0, 1)).rotation_difference(d.normalized())
    o.data.materials.append(mat_)
    if bevel:
        md = o.modifiers.new("bv", "BEVEL")
        md.width = bevel
        md.segments = 3
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.object.modifier_apply(modifier="bv")
    _smooth(o, 50)
    return o


def build_rabbit(gx, gz, facing, s=1.0, prefix="rabbit", anim_head=True, base_y=0.0, with_mortar=True):
    global _LOD
    _LOD = 1.0 if s >= 0.5 else 0.3          # 작은 인형은 면 수를 줄인다
    fur = _fabric("plush_fur", "#f7f1e7")
    pink = _fabric("plush_pink", "#f3aebd")
    ribbon = _fabric("plush_ribbon", "#d33a52", 0.6)
    eye = mat("plush_eye", "#0b090e", 0.08)
    shine = mat("plush_shine", "#ffffff", 0.2, emit="#ffffff", glow=0.5)
    thread = mat("plush_thread", "#5a2630", 0.8)
    seam = mat("plush_seam", "#d9cfc0", 0.9)
    wood = mat("plush_wood", "#9a6a40", 0.6)
    wood_dark = mat("plush_wood_dark", "#5a3820", 0.7)
    ricecake = mat("plush_ricecake", "#fbf8f0", 0.5)
    red_eye = M.get("rabbit_eye") or mat("rabbit_eye", "#2a0000", 0.3, emit="#ff1a10", glow=0.0)

    # ---- 몸 (Blender 좌표 : 원점 = 발밑, 앞 = -Y, 위 = +Z)
    body = _blob(prefix + "_body", [
        ((0, 0, 0.74), (0.43, 0.39, 0.52)),                 # 몸통 (아래가 넓은 서양배 모양)
        ((0, 0.02, 0.5), (0.47, 0.43, 0.34)),
        ((0, -0.12, 0.62), (0.34, 0.33, 0.36)),             # 볼록한 배
        ((0.22, -0.12, 0.13), (0.17, 0.25, 0.14)),          # 발
        ((-0.22, -0.12, 0.13), (0.17, 0.25, 0.14)),
        ((0.38, -0.2, 0.86), (0.13, 0.13, 0.28), (40, 28, 0)),   # 팔 : 앞으로 모아 공이를 쥔다
        ((-0.38, -0.2, 0.86), (0.13, 0.13, 0.28), (40, -28, 0)),
        ((0, 0.4, 0.42), (0.15, 0.15, 0.15)),               # 꼬리
    ])
    body.data.materials.append(fur)
    parts_body = [body]
    parts_body.append(_tube(prefix + "_seam", [(0, -0.45, 0.98), (0, -0.465, 0.78), (0, -0.45, 0.52), (0, -0.37, 0.3)], 0.004, seam))
    for sx in (0.22, -0.22):
        parts_body.append(_ball(f"{prefix}_pad{'R' if sx > 0 else 'L'}", (sx, -0.36, 0.12), 0.1, pink, (1, 0.25, 0.8)))
    # 리본 (목)
    parts_body.append(_ball(prefix + "_ribbon_knot", (0, -0.37, 1.2), 0.065, ribbon, (1.1, 0.8, 0.9)))
    for sx in (1, -1):
        parts_body.append(_ball(f"{prefix}_ribbon_{'R' if sx > 0 else 'L'}", (sx * 0.15, -0.35, 1.2), 0.12, ribbon, (1.25, 0.45, 0.75), (0, sx * 14, 0)))

    # ---- 머리 (크고 둥근 머리 + 볼 + 주둥이 + 귀를 한 덩어리로)
    head = _blob(prefix + "_head", [
        ((0, 0, 1.62), (0.5, 0.45, 0.43)),
        ((0.22, -0.25, 1.5), (0.2, 0.2, 0.18)),            # 볼
        ((-0.22, -0.25, 1.5), (0.2, 0.2, 0.18)),
        ((0, -0.33, 1.52), (0.15, 0.13, 0.12)),             # 주둥이
        ((0.17, 0.03, 2.22), (0.14, 0.075, 0.44), (0, 10, 0)),        # 오른귀 (곧게)
        ((-0.21, 0.06, 2.13), (0.14, 0.075, 0.42), (-18, -26, 0)),    # 왼귀 (살짝 접힘)
    ], voxel=0.02)
    head.data.materials.append(fur)
    parts_head = [head]
    parts_head.append(_ball(prefix + "_earin_R", (0.17, -0.035, 2.24), 1, pink, (0.08, 0.02, 0.32), (0, 10, 0)))
    parts_head.append(_ball(prefix + "_earin_L", (-0.21, -0.01, 2.15), 1, pink, (0.08, 0.02, 0.3), (-18, -26, 0)))
    for sx, side in ((0.19, "R"), (-0.19, "L")):
        parts_head.append(_ball(f"{prefix}_eye_{side}", (sx, -0.405, 1.7), 0.085, eye, (1, 0.5, 1.15)))
        parts_head.append(_ball(f"{prefix}_eyeshine_{side}", (sx + 0.03, -0.445, 1.745), 0.022, shine, (1, 0.5, 1)))
        parts_head.append(_ball(f"{prefix}_eyeglow_{side}", (sx, -0.42, 1.7), 0.05, red_eye, (1, 0.5, 1.1)))
        parts_head.append(_ball(f"{prefix}_blush_{side}", (sx * 1.6, -0.39, 1.5), 0.075, pink, (1.2, 0.3, 0.75)))
    parts_head.append(_ball(prefix + "_nose", (0, -0.47, 1.57), 0.045, pink, (1.35, 0.7, 0.9)))
    parts_head.append(_tube(prefix + "_mouth", [(-0.08, -0.455, 1.5), (-0.04, -0.47, 1.47), (0, -0.47, 1.505), (0.04, -0.47, 1.47), (0.08, -0.455, 1.5)], 0.008, thread))

    # ---- 절구 · 떡 · 공이
    extra = []
    if with_mortar:
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.34, depth=0.5, location=(0.66, -0.66, 0.25))
        mo = bpy.context.object
        mo.name = prefix + "_mortar"
        bm = bmesh.new()
        bm.from_mesh(mo.data)
        top = [f for f in bm.faces if f.normal.z > 0.9]
        bmesh.ops.inset_region(bm, faces=top, thickness=0.06)
        bmesh.ops.translate(bm, vec=(0, 0, -0.3), verts=list({v for f in top for v in f.verts}))
        for v in bm.verts:
            if v.co.z < -0.1:
                v.co.x *= 0.8
                v.co.y *= 0.8
        bm.to_mesh(mo.data)
        bm.free()
        mo.data.materials.append(wood)
        md = mo.modifiers.new("bv", "BEVEL")
        md.width = 0.025
        md.segments = 3
        with bpy.context.temp_override(object=mo, active_object=mo):
            bpy.ops.object.modifier_apply(modifier="bv")
        _smooth(mo, 50)
        extra.append(mo)
        cake = _blob(prefix + "_mortar_in", [((0.6, -0.62, 0.42), (0.15, 0.15, 0.1)), ((0.73, -0.68, 0.41), (0.13, 0.13, 0.09)),
                                              ((0.64, -0.76, 0.44), (0.11, 0.11, 0.08))], voxel=0.015, smooth_it=6, keep=0.6)
        cake.data.materials.append(ricecake)
        extra.append(cake)
        # 공이 : 왼손 위에서 오른쪽 아래 절구로
        extra.append(_rod(prefix + "_pestle", (-0.32, -0.5, 1.12), (0.52, -0.62, 0.62), 0.045, wood_dark))
        extra.append(_rod(prefix + "_pestle_head", (0.47, -0.61, 0.66), (0.66, -0.64, 0.5), 0.1, wood_dark, verts=20, bevel=0.03))

    # ---- 크기 · 방향 · 위치
    allp = parts_body + parts_head + extra
    root = bpy.data.objects.new(prefix + "_root", None)
    COLL.objects.link(root)
    for o in allp:
        o.parent = root
    root.scale = (s, s, s)
    root.rotation_euler[2] = math.radians(facing)
    root.location = T(gx, base_y, gz)
    bpy.context.view_layer.update()
    for o in allp:
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
    bpy.data.objects.remove(root, do_unlink=True)
    for o in allp:
        o.rotation_mode = "XYZ"
        with bpy.context.temp_override(object=o, active_object=o, selected_editable_objects=[o]):
            bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if anim_head:
        hd = bpy.data.objects.new("ANIM_" + prefix + "head", None)
        hd.location = T(gx, base_y + 1.25 * s, gz)
        hd.rotation_euler[2] = math.radians(facing)
        COLL.objects.link(hd)
        bpy.context.view_layer.update()
        for p in parts_head:
            mw = p.matrix_world.copy()
            p.parent = hd
            p.matrix_world = mw
    return allp
