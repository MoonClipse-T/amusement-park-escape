"""달토끼 캐릭터 — 걷고 뛰며 쫓아올 수 있게 뼈대를 넣은 모델 → web/assets/moonrabbit.glb

  원본 : Sketchfab "Cute Bunny" by minimoku (CC BY) 의 하얀 토끼 → blender/source/sketchfab/cute_bunny.glb
  부품(머리 · 귀 · 눈 · 눈썹 · 코 · 몸 · 스카프 · 꼬리 · 팔 L/R · 다리 L/R)을 뼈에 그대로 붙인다 (리지드 리깅 : 관절에서 꺾인다)
    뼈 : root · hips · head · arm_L · arm_R · leg_L · leg_R      (L = 캐릭터 왼쪽 = +X)
    동작 : Idle (숨쉬기 · 고개 갸웃) · Walk · Run                (24 fps, 반복)
  공포 표정 : 입 rabbit_hmouth (얼굴 가운데부터 턱까지 덮는 웃는 입 · 크고 날카로운 맞물린 송곳니 · 피가 흐르는 잇몸과 이빨 · 피에 젖은 찢어진 입술)
    머리뼈에 붙어 같이 움직인다. 엔진(story.js MOONRABBIT.face)이 평소엔 숨기고, 공포 얼굴일 때 코 · 눈썹을 숨기고 눈(mrab_eye_L/R)을 mrab_eyeT_L/R 자리로 올린다.
  앞 = Blender -Y (glTF / three.js +Z) · 발밑 가운데 = 원점 · 키 H
  실행 (Blender) : dorm_dress.py 를 exec(_mat · _B) → 이 파일 exec → build_rabbit_character()
  만든 물체는 내보낸 뒤 장면에서 지운다 (park.glb 에 섞이지 않게)
"""
import bpy, bmesh, math, os, mathutils
from mathutils import Matrix, Vector, Quaternion

H = 2.4                                      # 키 (귀 끝까지)
FPS = 24
ARM = 34                                     # 팔을 내리는 각도
LIFT = .23                                   # 공포 얼굴 : 눈이 위로 올라가는 높이
JAW = (30, .2, .07)                          # 입을 크게 벌린 모양 : 아래턱이 도는 각(도) · 앞으로 · 아래로 (m)


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


def _horror_mouth(head, cz, width, gap, oz, grin=.09, n_teeth=7):
    """머리 앞 곡면에 붙인 3D 공포 입 (입 가운데 높이 cz · 원점 높이 oz = 원래 입 자리 — 엔진이 여기서부터 scale.y 로 벌린다). 앞 = -Y
       볼까지 치켜 올라간 웃는 입 — 도톰하게 말린 찢어진 입술 · 이 사이로 내려온 잇몸 · 두께가 있는 송곳니가 위아래로 맞물린다
       색은 꼭짓점 색으로 (뿌리는 누렇게 · 끝은 희게 · 잇몸에서 피가 타고 내린다) → glTF COLOR_0
       머리 텍스처에 그려진 원래 입('ㅅ')이 비치지 않게 입속 면을 촘촘한 그물로 곡면 위에 띄운다
       shape key 'open' (glTF morph target 0) : 입을 크게 벌린 모양 — 아래턱(아랫니 · 아랫잇몸 · 아랫입술 · 입술 밑 피)이 머리 속 경첩을 중심으로 내려가며
       앞으로 나오고(입꼬리는 그대로), 입속이 목구멍처럼 어둡게 펼쳐지고, 혀가 드러나고, 침이 위아래로 늘어진다. 엔진이 0 ~ 1 로 벌린다"""
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromObject(head, bpy.context.evaluated_depsgraph_get())    # head 는 변환이 단위 행렬 (꼭짓점이 월드 좌표)
    P = [v.co for v in head.data.vertices]
    b0, b1 = Vector([min(p[i] for p in P) for i in range(3)]), Vector([max(p[i] for p in P) for i in range(3)])
    hc, hr = (b0 + b1) / 2, (b1 - b0) / 2
    c = Vector((0, 0, oz))
    nrm = lambda p: Vector(((p.x - hc.x) / hr.x ** 2, (p.y - hc.y) / hr.y ** 2, (p.z - hc.z) / hr.z ** 2)).normalized()   # 머리를 타원체로 본 매끈한 법선

    cast = lambda x, z: bvh.ray_cast(Vector((x, -3, z)), Vector((0, 1, 0)))[0]

    def surf(x, z, h):                                      # 얼굴 곡면 위 (x, z) 에서 바깥으로 h
        hit, n = cast(x, z), 0
        while hit is None and n < 40:                       # 턱 밑 · 얼굴 옆으로 벗어나면 가장 가까운 얼굴 위로 당긴다
            n, z, x = n + 1, z + .01, x * .98
            hit = cast(x, z)
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
    JAW_A, JAW_F, JAW_D = math.radians(JAW[0]), JAW[1], JAW[2]  # 입을 벌릴 때 아래턱이 도는 각 · 앞으로 · 아래로
    hy, hz = hc.y + hr.y * .05, cz + gap * .2               # 턱 경첩 (입 뒤 머리 속)

    def jaw(p):                                             # 벌린 모양에서의 아래턱 점 — 가운데가 가장 많이, 입꼬리는 그대로
        f = (1 - min(1, abs(p.x) / (width / 2)) ** 2) ** .45
        a = JAW_A * f
        y, z = p.y - hy, p.z - hz
        y, z = y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a)
        return Vector((p.x, hy + y - JAW_F * f, hz + z - JAW_D * f))

    def front(q, h=.012):                                   # 머리 곡면보다 앞에 (곡면 속으로 묻히지 않게)
        hit = cast(q.x, q.z)
        return Vector((q.x, hit.y - h, q.z)) if hit is not None and hit.y - h < q.y else q

    iopen = lambda u, s: front(jaw(surf(X(u), lo(u), .005)).lerp(surf(X(u), up(u), .005), s ** .8))      # 벌린 입속 (s 0 아래 · 1 위)
    DARK, DARK2 = _lin("#070001"), _lin("#2a0305")
    GUM, GUM_D = _lin("#a01a24"), _lin("#45050a")
    IVORY, STAIN, TIP, CLOTH = _lin("#ece4d0"), _lin("#9a7646"), _lin("#fbf8ee"), _lin("#e6e3de")
    BLOOD, FRESH = _lin("#4a0206"), _lin("#b00a10")          # 굳은 피 · 갓 흐른 피
    axis = {}                                               # 핏방울 면 번호 → 그 축 위의 점 (면 방향을 축 바깥으로)
    verts, cols, faces, mats, opens = [], [], [], [], []

    def add(vs, cs, fs, m, os_=None):
        b = len(verts)
        verts.extend(vs)
        cols.extend(cs)
        opens.extend(os_ if os_ is not None else vs)
        for fc in fs:
            faces.append(tuple(b + i for i in fc))
            mats.append(m)

    def grid(rows, m, low=False, orows=None):               # rows : [(점, 색)] 의 줄들 → 사각형 그물 · low : 아래턱을 따라 벌어진다
        n = len(rows[0])
        os_ = [p for r in orows for p in r] if orows else ([jaw(p) for r in rows for p, _ in r] if low else None)
        add([p for r in rows for p, _ in r], [q for r in rows for _, q in r],
            [(r * n + i, r * n + i + 1, (r + 1) * n + i + 1, (r + 1) * n + i) for r in range(len(rows) - 1) for i in range(n - 1)], m, os_)
    N, du = 72, 2 / n_teeth
    us = [-1 + 2 * i / N for i in range(N + 1)]
    # ---- 입속 (어둠)
    grid([[(surf(X(u), lerp(lo(u), up(u), r / 24), .005), DARK2.lerp(DARK, math.sin(math.pi * r / 24))) for u in us] for r in range(25)], 0,
         orows=[[iopen(u, r / 24) for u in us] for r in range(25)])         # 벌리면 목구멍처럼 — 가장자리는 검붉고 가운데는 깜깜하다
    # ---- 송곳니 : 반원통 고리를 뿌리에서 끝까지 좁혀 간다 (앞으로 볼록 · 뿌리는 잇몸 속)
    K, J = 10, 10

    def drop(x, z, h, L):                                   # 이 끝에 맺혀 길게 늘어진 핏방울
        if cast(x, z - L * 1.1) is None:
            return
        prof = ((0, .008), (.35, .0055), (.7, .008), (.9, .014), (1, .009))
        vs = [surf(x + r * math.cos(math.tau * n / 6), z - L * t, h + r * math.sin(math.tau * n / 6)) for t, r in prof for n in range(6)]
        vs.append(surf(x, z - L * 1.08, h))
        R = len(prof) - 1
        fs = [(k * 6 + n, k * 6 + (n + 1) % 6, (k + 1) * 6 + (n + 1) % 6, (k + 1) * 6 + n) for k in range(R) for n in range(6)]
        fs += [(R * 6 + n, R * 6 + (n + 1) % 6, R * 6 + 6) for n in range(6)]
        for n, fc in enumerate(fs):
            axis[len(faces) + n] = surf(x, z - L * prof[min(R, n // 6)][0], h)
        add(vs, [FRESH] * len(vs), fs, 1)

    def tooth(i, uc, hw, base, far, sgn, h0):
        hw *= .78 + .14 * rnd(i, 1)
        zr = base(uc) - sgn * .012
        zt = lerp(zr, far, .84 + .13 * rnd(i, 2))
        bend = (rnd(i, 3) - .5) * .22 * du
        streaks = [(J * (.2 + .6 * rnd(i, 4 + n)), .45 + .55 * rnd(i, 7 + n)) for n in range(2)]      # 잇몸에서 흘러내린 핏줄기 (자리, 길이)
        wet = max(L for _, L in streaks) > .8
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
                bl = max([clamp(1 - t / .22) ** 1.5] + [clamp(1 - t / L) ** .4 * clamp(1.6 - abs(j - js) / 1.1) for js, L in streaks])
                q = q.lerp(BLOOD.lerp(FRESH, clamp(bl * 1.4 - .3)), clamp(bl))
                cs.append(q)
        vs.append(surf(X(uc + bend), zt, h0 + .004))
        cs.append(FRESH if wet else TIP)
        fs = [(k * (J + 1) + j, k * (J + 1) + j + 1, (k + 1) * (J + 1) + j + 1, (k + 1) * (J + 1) + j) for k in range(K - 1) for j in range(J)]
        add(vs, cs, fs + [((K - 1) * (J + 1) + j, (K - 1) * (J + 1) + j + 1, K * (J + 1)) for j in range(J)], 1, [jaw(v) for v in vs] if sgn < 0 else None)
        if wet and sgn > 0:
            drop(X(uc + bend), zt, h0 + .004, .05 + .06 * rnd(i, 9))
    for i in range(n_teeth):                                # 윗니 (앞쪽) — 끝이 아랫니 사이로
        uc = -1 + (i + .5) * du
        tooth(i, uc, X(du) / 2, up, lo(uc), 1, .012)
    for i in range(n_teeth + 1):                            # 아랫니 — 윗니 사이로
        u0, u1 = max(-1, -1 + (i - .5) * du), min(1, -1 + (i + .5) * du)
        tooth(i + 50, (u0 + u1) / 2, X(u1 - u0) / 2, lo, up((u0 + u1) / 2), -1, .007)
    # ---- 잇몸 (이 사이로 내려온 도톰한 띠) · 입술 (도톰하게 말린 찢어진 천, 안쪽은 피에 젖었다)
    for edge, sgn, ph0 in ((up, 1, 0), (lo, -1, .5)):
        thin = lambda u: clamp(g(u) / (gap * .5))
        gh = lambda u: gap * (.09 + .1 * abs(math.cos(math.pi * ((u + 1) / du + ph0))) ** 1.5) * thin(u)
        grid([[(surf(X(u), edge(u) + sgn * .008 - sgn * (gh(u) + .008) * k / 5, .004 + .026 * thin(u) * math.sin(math.pi * k / 5) ** .8),
                GUM_D.lerp(GUM, math.sin(math.pi * k / 5) * (.75 + .25 * rnd(i, 7)))) for i, u in enumerate(us)] for k in range(6)], 1, sgn < 0)
        prof = ((.085, .0004, 0), (.04, .0008, .2), (.026, .008, .5), (.014, .013, .85), (.004, .009, 1), (-.004, .003, 1))     # (가장자리 밖으로, 높이, 피) — 피가 천에 번져 있다
        grid([[(surf(X(u), edge(u) + sgn * d * (1 + (.35 * rnd(i, 8) if .02 < d < .05 else 0)), hh), CLOTH.lerp(BLOOD.lerp(FRESH, .45), clamp(bl * (.45 + 1.2 * (.5 + .5 * math.sin(i * .9 + sgn) * math.sin(i * .37)))))) for i, u in enumerate(us)]
              for d, hh, bl in prof], 1, sgn < 0)
    # ---- 아랫입술 밑으로 흐른 피
    for n, (u, L) in enumerate(((-.66, .09), (-.4, .05), (-.22, .13), (.1, .08), (.36, .14), (.6, .06), (.78, .1))):
        x, z = X(u), lo(u) - .03
        L = min(L * 1.5, z - b0.z - .015)
        while L > 0 and cast(x, z - L) is None:
            L -= .01
        if L > .015:
            grid([[(surf(x + dx * (1 - .6 * k / 5), z - L * k / 5, hh), FRESH.lerp(BLOOD, .35)) for dx, hh in ((-.011, .001), (0, .006), (.011, .001))] for k in range(6)], 1, True)
    # ---- 혀 : 다물면 입속 면 뒤에 숨어 있다가, 벌리면 아래턱을 따라 드러난다 (가운데 골이 진 검붉은 혀)
    TONGUE, TONGUE_D = _lin("#8a1420"), _lin("#300306")
    rows, orows = [], []
    for k in range(8):
        b_ = k / 7
        row, orow = [], []
        for i in range(15):
            a_ = -1 + 2 * i / 14
            bulge = .034 * (1 - a_ * a_) ** .5 * math.sin(math.pi * (.12 + .88 * b_)) * (1 - .25 * math.exp(-(a_ / .18) ** 2))
            row.append((surf(X(.5 * a_), lerp(lo(.5 * a_), up(.5 * a_), .1 + .3 * b_), .001),
                        TONGUE_D.lerp(TONGUE, (1 - a_ * a_) ** .6 * (1 - .45 * math.exp(-(a_ / .14) ** 2)))))
            orow.append(iopen(.5 * a_, .05 + .33 * b_) + Vector((0, -bulge, bulge * .25)))
        rows.append(row)
        orows.append(orow)
    grid(rows, 1, orows=orows)
    # ---- 침 : 위아래 잇몸 사이로 늘어지는 가는 줄 (벌리면 길게 늘어나며 처진다)
    SPIT = _lin("#9a5e5a")
    for u0 in (-.58, -.26, .12, .44):
        rows, orows = [], []
        for t_ in range(10):
            t = t_ / 9
            pc = surf(X(u0), lerp(up(u0) - g(u0) * .12, lo(u0) + g(u0) * .12, t), .0075)
            po = iopen(u0, 1 - t) + Vector((0, -.006 - .014 * math.sin(math.pi * t), -.035 * math.sin(math.pi * t)))
            w = .0032 * (1 - .6 * math.sin(math.pi * t))
            rows.append([(pc + Vector((-w, 0, 0)), SPIT), (pc + Vector((w, 0, 0)), SPIT)])
            orows.append([po + Vector((-w, 0, 0)), po + Vector((w, 0, 0))])
        grid(rows, 1, orows=orows)
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
        ctr = fc.calc_center_median() + c
        if fc.normal.dot(ctr - axis[fc.index] if fc.index in axis else nrm(ctr)) < 0:
            fc.normal_flip()
    bm.to_mesh(m)
    bm.free()
    ca = m.color_attributes.new("Color", "FLOAT_COLOR", "POINT")
    for i, q in enumerate(cols):
        ca.data[i].color = (q.x, q.y, q.z, 1)
    o = bpy.data.objects.new("rabbit_hmouth", m)
    bpy.context.scene.collection.objects.link(o)
    o.location = c
    o.shape_key_add(name="Basis")                          # 입 벌리기 (glTF morph target 0 — 엔진 morphTargetInfluences[0])
    sk = o.shape_key_add(name="open", from_mix=False)
    for i, p in enumerate(opens):
        sk.data[i].co = p - c
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
    # ---- 공포 표정 (엔진 MOONRABBIT.face 가 평소 얼굴에서 바꿔 간다)
    #      입 rabbit_hmouth : 얼굴 가운데부터 턱까지 덮는 큰 입 (코 mrab_nose · 눈썹 mrab_eyebrow 는 숨긴다 — 눈썹이 없어야 더 섬뜩하다)
    hc = (head0 + head1) / 2
    top, bot = hc.z, head0.z + .1
    mouth = _horror_mouth(parts["head"][0], cz=(top + bot) / 2, width=(head1.x - head0.x) * .84, gap=top - bot, oz=nose0.z - .03)
    #      눈 mrab_eye_L/R : 큰 입에 밀려 얼굴 곡면을 따라 위로 올라간다 — 올라간 자리를 빈 물체 mrab_eyeT_L/R 로 내보내고, 엔진이 그 사이를 잇는다
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromObject(parts["head"][0], bpy.context.evaluated_depsgraph_get())

    def on_face(x, z):                                    # 얼굴 곡면 위의 점 · 매끈한 법선 (둘레 평균)
        hits = [bvh.ray_cast(Vector((x + dx, -3, z + dz)), Vector((0, 1, 0))) for dx in (-.05, 0, .05) for dz in (-.05, 0, .05)]
        return hits[4][0], sum((h[1] for h in hits if h[0] is not None), Vector()).normalized()

    def lifted(ctr):                                      # ctr 에 있는 부품을 곡면을 따라 LIFT 만큼 올리는 변환
        p0, n0 = on_face(ctr.x, ctr.z)
        p1, n1 = on_face(ctr.x, ctr.z + LIFT)
        return Matrix.Translation(p1) @ n0.rotation_difference(n1).to_matrix().to_4x4() @ Matrix.Translation(-p0)
    eyes = _split_x(parts.pop("eyes")[0], 0)
    targets = []
    for o, side in zip(eyes, "LR"):
        e0, e1 = _bounds([o])
        ctr = (e0 + e1) / 2
        o.data.transform(Matrix.Translation(-ctr))
        o.location = ctr
        o.name = "mrab_eye_" + side
        t = bpy.data.objects.new("mrab_eyeT_" + side, None)
        bpy.context.scene.collection.objects.link(t)
        t.matrix_world = lifted(ctr) @ Matrix.Translation(ctr)
        targets.append(t)
    bpy.context.view_layer.update()
    # ---- 부품을 뼈에 붙인다 (메시는 월드 좌표 그대로)
    where = {"head": "head", "ears": "head", "ears_pink": "head", "eyebrow": "head", "eyes": "head", "nose": "head",
             "body": "hips", "scraf": "hips", "tail": "hips"}
    pairs = [(o, where[k]) for k, v in parts.items() for o in v] + [(arms[0], "arm_L"), (arms[1], "arm_R"), (legs[0], "leg_L"), (legs[1], "leg_R"), (mouth, "head")] + [(o, "head") for o in eyes + targets]
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
    down_L, down_R = Q(Y, ARM), Q(Y, -ARM)                 # 옆으로 뻗은 팔을 아래로 내린다 (너무 내리면 몸통 · 다리에 파묻혀 팔처럼 안 보인다)
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
