"""달토끼 캐릭터 — 걷고 뛰며 쫓아올 수 있게 뼈대를 넣은 모델 → web/assets/moonrabbit.glb

  원본 : Sketchfab "Cute Bunny" by minimoku (CC BY) 의 하얀 토끼 → blender/source/sketchfab/cute_bunny.glb
  부품(머리 · 귀 · 눈 · 눈썹 · 코 · 몸 · 스카프 · 꼬리 · 팔 L/R · 다리 L/R)을 뼈에 그대로 붙인다 (리지드 리깅 : 관절에서 꺾인다)
    뼈 : root · hips · head · arm_L · arm_R · leg_L · leg_R      (L = 캐릭터 왼쪽 = +X)
    동작 : Idle (숨쉬기 · 고개 갸웃) · Walk · Run                (24 fps, 반복)
  공포 표정 : 입 rabbit_hmouth (볼까지 올라간 웃는 입 · 크고 날카로운 맞물린 이빨 · 피 묻은 잇몸 · 찢어진 천 · 흐르는 피) + 성난 눈썹 mrab_hbrow_L/R
    머리뼈에 붙어 같이 움직인다. 엔진(story.js MOONRABBIT.face)이 평소엔 숨기고, 공포 얼굴일 때 코 · 원래 눈썹과 바꿔 낀다.
  앞 = Blender -Y (glTF / three.js +Z) · 발밑 가운데 = 원점 · 키 H
  실행 (Blender) : dorm_dress.py 를 exec(_mat · _B) → 이 파일 exec → build_rabbit_character()
  만든 물체는 내보낸 뒤 장면에서 지운다 (park.glb 에 섞이지 않게)
"""
import bpy, bmesh, math, os, mathutils
from mathutils import Matrix, Vector, Quaternion

H = 2.4                                      # 키 (귀 끝까지)
FPS = 24


def _bounds(objs):
    P = [o.matrix_world @ v.co for o in objs for v in o.data.vertices]
    return Vector([min(p[i] for p in P) for i in range(3)]), Vector([max(p[i] for p in P) for i in range(3)])


def _split_x(o, cx):
    """양쪽 팔(다리)이 한 메시인 것을 가운데 x 로 둘로 나눈다 → (+X 쪽 = L, -X 쪽 = R)"""
    out = []
    for side, keep in (("L", lambda x: x >= cx), ("R", lambda x: x < cx)):
        me = o.data.copy()
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep(v.co.x)], context="VERTS")
        bm.to_mesh(me)
        bm.free()
        n = bpy.data.objects.new(f"{o.name}_{side}", me)
        bpy.context.scene.collection.objects.link(n)
        out.append(n)
    bpy.data.objects.remove(o, do_unlink=True)
    return out


def _lin(h):
    """'#rrggbb' → 선형 RGB (꼭짓점 색은 선형으로 넣는다)"""
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return Vector([x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c])


def _horror_mouth(head, cz, width, gap, grin=.09, n_teeth=9):
    """머리 앞 곡면에 붙인 3D 공포 입 (원점 = 입 가운데, 높이 cz). 앞 = -Y
       볼까지 치켜 올라간 웃는 입 — 도톰하게 말린 찢어진 입술 · 이 사이로 내려온 잇몸 · 두께가 있는 송곳니가 위아래로 맞물린다
       색은 꼭짓점 색으로 (뿌리는 누렇게 · 끝은 희게 · 잇몸에서 피가 타고 내린다) → glTF COLOR_0
       머리 텍스처에 그려진 원래 입('ㅅ')이 비치지 않게 입속 면을 촘촘한 그물로 곡면 위에 띄운다"""
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromObject(head, bpy.context.evaluated_depsgraph_get())    # head 는 변환이 단위 행렬 (꼭짓점이 월드 좌표)
    P = [v.co for v in head.data.vertices]
    b0, b1 = Vector([min(p[i] for p in P) for i in range(3)]), Vector([max(p[i] for p in P) for i in range(3)])
    hc, hr = (b0 + b1) / 2, (b1 - b0) / 2
    c = Vector((0, 0, cz))
    nrm = lambda p: Vector(((p.x - hc.x) / hr.x ** 2, (p.y - hc.y) / hr.y ** 2, (p.z - hc.z) / hr.z ** 2)).normalized()   # 머리를 타원체로 본 매끈한 법선

    def surf(x, z, h):                                      # 얼굴 곡면 위 (x, z) 에서 바깥으로 h
        hit = bvh.ray_cast(Vector((x, -3, z)), Vector((0, 1, 0)))[0]
        if hit is None:
            hit = Vector((x, b0.y, z))
        return hit + nrm(hit) * h

    mid = lambda u: cz + grin * u * u                       # 입꼬리가 올라간다
    g = lambda u: gap * max(0, 1 - u * u) ** .4 + .004
    up = lambda u: mid(u) + g(u) / 2
    lo = lambda u: mid(u) - g(u) / 2
    X = lambda u: u * width / 2
    lerp = lambda a, b, t: a + (b - a) * t
    clamp = lambda x: max(0, min(1, x))
    rnd = lambda i, k: (math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1
    DARK, DARK2 = _lin("#070001"), _lin("#2a0305")
    GUM, GUM_D = _lin("#a01a24"), _lin("#45050a")
    IVORY, STAIN, TIP, BLOOD, CLOTH = _lin("#ece4d0"), _lin("#9a7646"), _lin("#fbf8ee"), _lin("#7c0409"), _lin("#e6e3de")
    verts, cols, faces, mats = [], [], [], []

    def add(vs, cs, fs, m):
        b = len(verts)
        verts.extend(vs)
        cols.extend(cs)
        for fc in fs:
            faces.append(tuple(b + i for i in fc))
            mats.append(m)

    def grid(rows, m):                                      # rows : [(점, 색)] 의 줄들 → 사각형 그물
        n = len(rows[0])
        add([p for r in rows for p, _ in r], [q for r in rows for _, q in r],
            [(r * n + i, r * n + i + 1, (r + 1) * n + i + 1, (r + 1) * n + i) for r in range(len(rows) - 1) for i in range(n - 1)], m)
    N, du = 72, 2 / n_teeth
    us = [-1 + 2 * i / N for i in range(N + 1)]
    # ---- 입속 (어둠)
    grid([[(surf(X(u), lerp(lo(u), up(u), r / 8), .005), DARK2.lerp(DARK, math.sin(math.pi * r / 8))) for u in us] for r in range(9)], 0)
    # ---- 송곳니 : 반원통 고리를 뿌리에서 끝까지 좁혀 간다 (앞으로 볼록 · 뿌리는 잇몸 속)
    K, J = 8, 6

    def tooth(i, uc, hw, base, far, sgn, h0):
        hw *= .78 + .14 * rnd(i, 1)
        zr = base(uc) - sgn * .012
        zt = lerp(zr, far, .84 + .13 * rnd(i, 2))
        bend, bloody, L = (rnd(i, 3) - .5) * .22 * du, rnd(i, 4) < .7, .45 + .5 * rnd(i, 5)
        vs, cs = [], []
        for k in range(K):
            t = k / K
            a = hw * (1 - t) ** .85
            bb = hw * .55 * (1 - t) ** .7 * min(1, .4 + t * 4)
            x0, z = X(uc + bend * t * t), lerp(zr, zt, t)
            col = STAIN.lerp(IVORY, clamp(t / .45)).lerp(TIP, clamp((t - .75) / .25))
            for j in range(J + 1):
                th = math.pi * j / J
                vs.append(surf(x0 - a * math.cos(th), z, h0 + .006 * math.sin(math.pi * t) + bb * math.sin(th)))
                q = col * ((.45 + .55 * math.sin(th) ** .7) * (.55 + .45 * clamp(t * 5)))
                if bloody:                                  # 잇몸에서 흘러내린 피
                    q = q.lerp(BLOOD, clamp(1 - t / L) ** .8 * (1 if abs(j - J / 2 - (rnd(i, 6) - .5) * 2) < 1.2 else .35))
                cs.append(q)
        vs.append(surf(X(uc + bend), zt, h0 + .004))
        cs.append(TIP)
        fs = [(k * (J + 1) + j, k * (J + 1) + j + 1, (k + 1) * (J + 1) + j + 1, (k + 1) * (J + 1) + j) for k in range(K - 1) for j in range(J)]
        add(vs, cs, fs + [((K - 1) * (J + 1) + j, (K - 1) * (J + 1) + j + 1, K * (J + 1)) for j in range(J)], 1)
    for i in range(n_teeth):                                # 윗니 (앞쪽) — 끝이 아랫니 사이로
        uc = -1 + (i + .5) * du
        tooth(i, uc, X(du) / 2, up, lo(uc), 1, .012)
    for i in range(n_teeth + 1):                            # 아랫니 — 윗니 사이로
        u0, u1 = max(-1, -1 + (i - .5) * du), min(1, -1 + (i + .5) * du)
        tooth(i + 50, (u0 + u1) / 2, X(u1 - u0) / 2, lo, up((u0 + u1) / 2), -1, .007)
    # ---- 잇몸 (이 사이로 내려온 도톰한 띠) · 입술 (도톰하게 말린 찢어진 천, 안쪽은 피에 젖었다)
    for edge, sgn, ph0 in ((up, 1, 0), (lo, -1, .5)):
        thin = lambda u: clamp(g(u) / (gap * .5))
        gh = lambda u: (.02 + .02 * abs(math.cos(math.pi * ((u + 1) / du + ph0))) ** 1.5) * thin(u)
        grid([[(surf(X(u), edge(u) + sgn * .008 - sgn * (gh(u) + .008) * k / 5, .004 + .021 * thin(u) * math.sin(math.pi * k / 5) ** .8),
                GUM_D.lerp(GUM, math.sin(math.pi * k / 5) * (.75 + .25 * rnd(i, 7)))) for i, u in enumerate(us)] for k in range(6)], 1)
        prof = ((.036, .0006, 0), (.026, .008, 0), (.014, .013, .3), (.004, .009, .75), (-.004, .003, 1))     # (가장자리 밖으로, 높이, 피)
        grid([[(surf(X(u), edge(u) + sgn * d * (1 + (.35 * rnd(i, 8) if d > .02 else 0)), hh), CLOTH.lerp(BLOOD, bl)) for i, u in enumerate(us)]
              for d, hh, bl in prof], 1)
    # ---- 아랫입술 밑으로 흐른 피
    for n, (u, L) in enumerate(((-.66, .09), (-.4, .05), (-.22, .13), (.1, .08), (.36, .14), (.6, .06), (.78, .1))):
        x, z = X(u), lo(u) - .03
        L = min(L, z - b0.z - .04)
        if L > .015:
            grid([[(surf(x + dx * (1 - .6 * k / 5), z - L * k / 5, hh), BLOOD) for dx, hh in ((-.011, .001), (0, .006), (.011, .001))] for k in range(6)], 1)
    m = bpy.data.meshes.new("rabbit_hmouth")
    m.from_pydata([v - c for v in verts], [], faces)
    for poly, mi in zip(m.polygons, mats):
        poly.material_index = mi
        poly.use_smooth = True
    for name, col, rough, emit in (("hmouth_dark", "#ffffff", .9, None), ("hmouth", "#ffffff", .3, "#4a3a30")):
        mt = _mat(name, col, rough)
        if emit:                                            # 밤에도 보이게 살짝 빛낸다
            b = next(n for n in mt.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
            b.inputs["Emission Color"].default_value = (*_lin(emit), 1)
            b.inputs["Emission Strength"].default_value = 1
        m.materials.append(mt)
    bm = bmesh.new()
    bm.from_mesh(m)
    for fc in bm.faces:                                  # 모두 얼굴 바깥을 보게
        if fc.normal.dot(nrm(fc.calc_center_median() + c)) < 0:
            fc.normal_flip()
    bm.to_mesh(m)
    bm.free()
    ca = m.color_attributes.new("Color", "FLOAT_COLOR", "POINT")
    for i, q in enumerate(cols):
        ca.data[i].color = (q.x, q.y, q.z, 1)
    o = bpy.data.objects.new("rabbit_hmouth", m)
    bpy.context.scene.collection.objects.link(o)
    o.location = c
    return o


def _key_pose(rig, frame, spec, order, parents):
    """spec : 뼈 이름 → (아마추어 공간 회전 Quaternion, 위치 이동 Vector). 부모 움직임을 따라 자식 자세를 계산해 키를 넣는다"""
    posed = {}
    for name in order:
        pb = rig.pose.bones[name]
        rest = pb.bone.matrix_local.copy()
        R, T = spec.get(name, (Quaternion(), Vector()))
        hd = rest.to_translation()
        local = Matrix.Translation(hd + T) @ R.to_matrix().to_4x4() @ Matrix.Translation(-hd) @ rest
        par = parents.get(name)
        posed[name] = (posed[par] @ rig.pose.bones[par].bone.matrix_local.inverted() @ local) if par else local
        pb.matrix = posed[name]
        bpy.context.view_layer.update()
        pb.keyframe_insert("rotation_quaternion", frame=frame)
        pb.keyframe_insert("location", frame=frame)


def build_rabbit_character(out_path):
    for o in [o for o in bpy.data.objects if o.name.startswith(("mrab_", "rabbit_hmouth"))]:
        bpy.data.objects.remove(o, do_unlink=True)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(_B, "source", "sketchfab", "cute_bunny.glb"))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    bpy.context.view_layer.update()
    lo_, hi_ = _bounds(meshes)
    legs = next(o for o in meshes if "legs" in o.name)
    l0, l1 = _bounds([legs])
    cx, cy = (l0.x + l1.x) / 2, (lo_.y + hi_.y) / 2
    s = H / (hi_.z - lo_.z)
    T = Matrix.Scale(s, 4) @ Matrix.Translation((-cx, -cy, -lo_.z))
    parts = {}
    for o in meshes:                                      # 월드 변환을 메시에 굳히고 이름 정리 (mrab_<부품>)
        me = o.data.copy()
        me.transform(T @ o.matrix_world)
        key = o.name.split("_")[1] + ("_pink" if "pink" in o.name else "")         # bunny2_<부품>_... → 부품 이름
        n = bpy.data.objects.new("mrab_" + key, me)
        bpy.context.scene.collection.objects.link(n)
        parts.setdefault(key, []).append(n)
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    arms = _split_x(parts.pop("arms")[0], 0)
    legs = _split_x(parts.pop("legs")[0], 0)
    allp = [o for v in parts.values() for o in v] + arms + legs
    bpy.context.view_layer.update()
    b = {k: _bounds(v) for k, v in parts.items()}
    aL, lL = _bounds([arms[0]]), _bounds([legs[0]])
    body0, body1 = b["body"]
    head0, head1 = b["head"]
    nose0, nose1 = b["nose"]
    # ---- 뼈대
    arm = bpy.data.armatures.new("mrab_rig")
    rig = bpy.data.objects.new("mrab_rig", arm)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    with bpy.context.temp_override(active_object=rig, object=rig, selected_objects=[rig], selected_editable_objects=[rig]):
        bpy.ops.object.mode_set(mode="EDIT")
        eb = arm.edit_bones
        def bone(name, h, t, parent=None):
            x = eb.new(name)
            x.head, x.tail = Vector(h), Vector(t)
            if parent:
                x.parent = eb[parent]
            return x
        bone("root", (0, 0, 0), (0, .25, 0))
        hz = lL[1].z
        bone("hips", (0, 0, hz), (0, 0, body1.z), "root")
        bone("head", (0, 0, body1.z - .03), (0, 0, head1.z), "hips")
        az = (aL[0].z + aL[1].z) / 2
        bone("arm_L", (aL[0].x + .02, 0, az), (aL[1].x, 0, az), "hips")
        bone("arm_R", (-aL[0].x - .02, 0, az), (-aL[1].x, 0, az), "hips")
        lx = (lL[0].x + lL[1].x) / 2
        bone("leg_L", (lx, 0, hz), (lx, 0, .02), "hips")
        bone("leg_R", (-lx, 0, hz), (-lx, 0, .02), "hips")
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.context.view_layer.update()
    # ---- 공포 표정 (엔진 MOONRABBIT.face 가 평소 얼굴과 바꿔 낀다)
    #      입 rabbit_hmouth : 얼굴 아래쪽은 턱 밑으로 말려 들어가니 코 자리까지 덮는다 (공포 얼굴에선 코 mrab_nose · 눈썹 mrab_eyebrow 를 숨긴다)
    mouth = _horror_mouth(parts["head"][0], cz=nose0.z - .05, width=(head1.x - head0.x) * .8, gap=(head1.z - head0.z) * .21)
    #      눈썹 mrab_hbrow_L/R : 안쪽 끝이 눈 위로 내리꽂힌 성난 눈썹
    hb = parts["eyebrow"][0].copy()
    hb.data = hb.data.copy()
    bpy.context.scene.collection.objects.link(hb)
    hbrows = _split_x(hb, 0)
    for o, side in zip(hbrows, "LR"):
        xs = [abs(v.co.x) for v in o.data.vertices]
        bx = (min(xs) + max(xs)) / 2
        for v in o.data.vertices:
            v.co.z += .62 * (abs(v.co.x) - bx) - .02
        o.name = "mrab_hbrow_" + side
    # ---- 부품을 뼈에 붙인다 (메시는 월드 좌표 그대로)
    where = {"head": "head", "ears": "head", "ears_pink": "head", "eyebrow": "head", "eyes": "head", "nose": "head",
             "body": "hips", "scraf": "hips", "tail": "hips"}
    pairs = [(o, where[k]) for k, v in parts.items() for o in v] + [(arms[0], "arm_L"), (arms[1], "arm_R"), (legs[0], "leg_L"), (legs[1], "leg_R"), (mouth, "head"), (hbrows[0], "head"), (hbrows[1], "head")]
    for o, bn in pairs:
        mw = o.matrix_world.copy()
        o.parent, o.parent_type, o.parent_bone = rig, "BONE", bn
        bpy.context.view_layer.update()
        o.matrix_world = mw
    mouth.name = "rabbit_hmouth"
    # ---- 동작
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
    order = ["root", "hips", "head", "arm_L", "arm_R", "leg_L", "leg_R"]
    parents = {"hips": "root", "head": "hips", "arm_L": "hips", "arm_R": "hips", "leg_L": "hips", "leg_R": "hips"}
    Q = lambda axis, deg: Quaternion(axis, math.radians(deg))
    X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
    down_L, down_R = Q(Y, 72), Q(Y, -72)                   # 옆으로 뻗은 팔을 아래로 내린다
    rig.animation_data_create()
    def clip(name, frames, fn):
        rig.animation_data.action = None
        for f in range(frames + 1):
            _key_pose(rig, f + 1, fn(2 * math.pi * f / frames), order, parents)
        act = rig.animation_data.action
        act.name = name
        act.use_fake_user = True
        tr = rig.animation_data.nla_tracks.new()
        tr.name = name
        tr.strips.new(name, 1, act)
        rig.animation_data.action = None
    clip("Idle", 48, lambda p: {"hips": (Quaternion(), Vector((0, 0, .012 * math.sin(p)))),
                                "head": (Q(Y, 3 * math.sin(p)), Vector()),
                                "arm_L": (Q(X, 4 * math.sin(p)) @ down_L, Vector()), "arm_R": (Q(X, -4 * math.sin(p)) @ down_R, Vector())})
    clip("Walk", 24, lambda p: {"hips": (Q(Y, 3 * math.sin(p)), Vector((0, 0, .035 * (1 - math.cos(2 * p)) / 2))),
                                "head": (Q(Y, -2 * math.sin(p)), Vector()),
                                "arm_L": (Q(X, -18 * math.sin(p)) @ down_L, Vector()), "arm_R": (Q(X, 18 * math.sin(p)) @ down_R, Vector()),
                                "leg_L": (Q(X, 26 * math.sin(p)), Vector()), "leg_R": (Q(X, -26 * math.sin(p)), Vector())})
    clip("Run", 16, lambda p: {"hips": (Q(X, 10) @ Q(Y, 4 * math.sin(p)), Vector((0, 0, .07 * (1 - math.cos(2 * p)) / 2))),
                               "head": (Q(X, -6), Vector()),
                               "arm_L": (Q(X, -38 * math.sin(p)) @ down_L, Vector()), "arm_R": (Q(X, 38 * math.sin(p)) @ down_R, Vector()),
                               "leg_L": (Q(X, 40 * math.sin(p)), Vector()), "leg_R": (Q(X, -40 * math.sin(p)), Vector())})
    # ---- 내보내기 (뼈대 + 부품 + 공포 입) → 장면에서 지운다
    objs = [rig] + [o for o, _ in pairs]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.scene.render.fps = FPS
    bpy.ops.export_scene.gltf(filepath=out_path, use_selection=True, export_format="GLB", export_animations=True,
                              export_animation_mode="NLA_TRACKS", export_apply=True, export_extras=False, export_vertex_color="ACTIVE")
    print("moon rabbit character :", os.path.getsize(out_path) // 1024, "KB", [t.name for t in rig.animation_data.nla_tracks])
    for o in objs:
        bpy.data.objects.remove(o, do_unlink=True)
