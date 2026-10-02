"""달토끼 아이스크림 판매대 (인트로 근무지)
build_lunaland_v2.py 안에서 exec 로 읽는다 (box · cyl · sphere · sign · col · light · zone · empty · _blob · build_rabbit 사용).
바닥 x[9,13.5] z[17,20], 북쪽(광장)을 보고 판다.
엔진이 쓰는 이름 : IT_tub_vanilla / IT_tub_strawberry / IT_tub_choco, SPAWN_kiosk, SPOT_customer, SIGN_icecream, SIGN_icecream_menu
"""
import bpy, math, random

KX1, KX2, KZ1, KZ2 = 9.0, 13.5, 17.0, 20.0


def _waffle_mat():
    m = bpy.data.materials.get("waffle")
    if m:
        return m
    N = 64
    img = bpy.data.images.new("waffle_tex", N, N)
    px = [0.0] * (N * N * 4)
    for y in range(N):
        for x in range(N):
            a = ((x + y) % 16 < 2) or ((x - y) % 16 < 2)
            c = (0.55, 0.32, 0.12) if a else (0.85, 0.58, 0.28)
            i = (y * N + x) * 4
            px[i:i + 4] = [c[0], c[1], c[2], 1]
    img.pixels = px
    img.pack()
    m = bpy.data.materials.new("waffle")
    m.use_nodes = True
    nt = m.node_tree
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = img
    nt.links.new(t.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
    nt.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.7
    return m


def _tilt_x(o, deg, pivot):
    """게임 x축을 축으로 메시를 기울인다. pivot = (게임 z, 게임 y)"""
    import mathutils
    pz, py = pivot
    pv = mathutils.Vector(T(0, py, pz))
    o.data.transform(mathutils.Matrix.Translation(pv) @ mathutils.Matrix.Rotation(math.radians(deg), 4, "X") @ mathutils.Matrix.Translation(-pv))


def _scallop(name, x, y, z, r, material):
    """차양 끝 물결 장식 : 아래로 볼록한 반원 판 (두께 4cm)"""
    import bmesh as _bm
    me = bpy.data.meshes.new(name)
    bm = _bm.new()
    n = 16
    front, back = [], []
    for k in range(n + 1):
        a = math.pi + k / n * math.pi          # 반원 (아래쪽)
        px, py = x + math.cos(a) * r, y + math.sin(a) * r
        front.append(bm.verts.new(T(px, py, z - 0.02)))
        back.append(bm.verts.new(T(px, py, z + 0.02)))
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    for k in range(n):
        bm.faces.new([front[k + 1], front[k], back[k], back[k + 1]])
    bm.faces.new([front[0], front[n], back[n], back[0]])
    _bm.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material)
    o = bpy.data.objects.new(name, me)
    COLL.objects.link(o)
    DETAIL.append(o)
    return o


def _scoop_blob(name, x, y, z, r, material, drips=4, seed=0):
    """아이스크림 한 덩이 : 둥근 덩어리 + 가장자리로 흘러내리는 방울 (Blender 좌표로 변환)"""
    rnd = random.Random(seed)
    sh = [(T(x, y, z), (r, r, r * 0.85)), (T(x, y - r * 0.45, z), (r * 1.1, r * 1.1, r * 0.4))]
    for k in range(drips):
        a = k / drips * math.tau + rnd.random() * 0.6
        L = r * rnd.uniform(0.35, 0.7)
        dx, dz = math.cos(a) * r * 0.95, math.sin(a) * r * 0.95
        sh.append((T(x + dx, y - r * 0.55 - L * 0.5, z + dz), (r * 0.16, r * 0.16, L * 0.6)))
    o = _blob(name, sh, voxel=max(0.006, r * 0.07), smooth_it=8, keep=0.5)
    o.data.materials.append(material)
    DETAIL.append(o)
    return o


def build_kiosk():
    pink, white, mint = M["k_pink"], M["k_white"], M["k_mint"]
    waffle = _waffle_mat()
    cream = {"vanilla": M["cream_v"], "strawberry": M["cream_s"], "choco": M["cream_c"]}
    box("kiosk_floor", KX1, KX2, 0, 0.08, KZ1, KZ2, M["floor_tile"], bevel=0)
    # 벽 : 아랫단 민트 띠 + 분홍 벽 + 흰 몰딩
    box("kiosk_back", KX1, KX2, 0, 2.6, KZ2 - .15, KZ2, pink)
    box("kiosk_back_band", KX1 + .15, KX2 - .15, 0.08, 0.5, KZ2 - .17, KZ2 - .15, mint, bevel=0)
    box("kiosk_west_low", KX1, KX1 + .15, 0, 1.05, KZ1, KZ2, pink)
    box("kiosk_west_top", KX1, KX1 + .15, 2.15, 2.6, KZ1, KZ2, pink)
    box("kiosk_west_post_a", KX1, KX1 + .15, 1.05, 2.15, KZ1, KZ1 + .35, pink)
    box("kiosk_west_post_b", KX1, KX1 + .15, 1.05, 2.15, KZ2 - .45, KZ2, pink)
    box("kiosk_west_sill", KX1 - .08, KX1 + .3, 1.05, 1.1, KZ1 + .35, KZ2 - .45, mint)
    box("kiosk_east", KX2 - .15, KX2, 0, 2.6, KZ1, 17.9, pink)
    for y in (0.5, 2.55):
        box(f"kiosk_mold_{y}", KX1 - .03, KX2 + .03, y, y + 0.06, KZ2 - .03, KZ2 + .03, white)
    # 모서리 기둥 (둥근 흰 기둥 + 공 장식)
    for px, pz in ((KX1 - .05, KZ1 - .05), (KX2 + .05, KZ1 - .05), (KX1 - .05, KZ2 + .05), (KX2 + .05, KZ2 + .05)):
        cyl(f"kiosk_pillar_{px:.0f}_{pz:.0f}", px, 0, 2.62, pz, 0.11, white)
        sphere(f"kiosk_pillar_ball_{px:.0f}_{pz:.0f}", px, 2.95, pz, 0.12, M["cream_s"])
    # 카운터 : 흰 몸체 + 분홍 패널 3장 + 민트 상판(둥근 앞날)
    box("kiosk_counter", KX1 + .15, KX2 - .15, 0, 1.0, KZ1, KZ1 + .6, white)
    for k in range(3):
        cx = KX1 + .55 + k * 1.4
        box(f"kiosk_counter_panel{k}", cx - .5, cx + .5, 0.2, 0.85, KZ1 - .02, KZ1, pink, bevel=0.01)
    box("kiosk_counter_top", KX1 + .1, KX2 - .1, 1.0, 1.06, KZ1 - .08, KZ1 + .65, mint, bevel=0.025)
    # 냉동고 (카운터에 묻힘) + 낮은 유리 가림막 + 아이스크림 통 3개
    box("kiosk_freezer", 9.6, 12.2, 1.05, 1.08, 17.15, 17.55, white, bevel=0.01)
    box("kiosk_freezer_glass", 9.6, 12.2, 1.08, 1.26, 17.1, 17.13, M["glass"], detail=False, bevel=0)
    for k, fl in enumerate(("vanilla", "strawberry", "choco")):
        cx = 10.0 + k * 0.85
        box(f"IT_tub_{fl}", cx - .3, cx + .3, 1.0, 1.08, 17.2, 17.52, M["iron"], detail=False, bevel=0.01)
        _scoop_blob(f"tub_{fl}_mound", cx, 1.1, 17.36, 0.2, cream[fl], drips=0, seed=k)
        for s in range(2):
            sphere(f"tub_{fl}_ball{s}", cx - .12 + s * .24, 1.17, 17.33 + s * .04, 0.075, cream[fl])
    # 콘 꽂이 (와플 콘)
    box("kiosk_cone_rack", 12.4, 13.1, 1.05, 1.18, 17.2, 17.5, M["iron"], bevel=0.01)
    for s in range(4):
        c = cyl(f"rack_cone{s}", 12.5 + s * .16, 1.16, 1.38, 17.35, 0.045, waffle, verts=16, r2=0.0)
        c.rotation_euler[0] = math.radians(180)
    # 줄무늬 차양 : 분홍 · 흰 줄을 번갈아 경사지게 + 물결(반원) 장식 끝단
    n = 9
    w = (KX2 - KX1 + .4) / n
    for k in range(n):
        x1 = KX1 - .2 + k * w
        a = box(f"kiosk_awning_{k}", x1, x1 + w, 2.28, 2.36, KZ1 - 1.25, KZ1 + .02, pink if k % 2 == 0 else white, bevel=0.01)
        _tilt_x(a, -14, (KZ1 + .02, 2.36))
        _scallop(f"kiosk_scallop_{k}", x1 + w / 2, 2.07, KZ1 - 1.27, w / 2, pink if k % 2 == 0 else white)
    for px in (KX1 - .1, KX2 + .1):
        cyl(f"kiosk_post_{px:.0f}", px, 0, 2.05, KZ1 - 1.2, 0.05, white, verts=16)
    # 차양 끝 전구 줄
    for k in range(14):
        sphere(f"kiosk_bulb_{k}", KX1 - .1 + k * (KX2 - KX1 + .2) / 13, 1.95, KZ1 - 1.32, 0.045, M["bulb"])
    # 지붕 · 간판 · 큰 아이스크림
    box("kiosk_roof", KX1 - .2, KX2 + .2, 2.6, 2.75, KZ1 - .2, KZ2 + .1, white)
    box("kiosk_roof_trim", KX1 - .25, KX2 + .25, 2.75, 2.85, KZ1 - .25, KZ2 + .15, pink)
    box("kiosk_sign_board", KX1 + .2, KX2 - .2, 2.85, 3.6, KZ1 - .1, KZ1 + .02, white)
    sign("icecream", (KX1 + KX2) / 2, 3.22, KZ1 - .11, 180, 3.7, 0.7)
    # 지붕 위 큰 아이스크림 콘 (와플 콘 + 흘러내리는 세 덩이 + 체리 + 토끼 귀)
    gx, gz = 12.7, 18.9
    cone = cyl("kiosk_bigcone", gx, 2.85, 4.0, gz, 0.4, waffle, verts=32, r2=0.03)
    cone.rotation_euler[0] = math.radians(180)
    _scoop_blob("kiosk_scoop_s", gx, 4.2, gz, 0.46, M["cream_s"], drips=6, seed=1)
    _scoop_blob("kiosk_scoop_v", gx, 4.75, gz, 0.4, M["cream_v"], drips=5, seed=2)
    _scoop_blob("kiosk_scoop_c", gx, 5.22, gz, 0.33, M["cream_c"], drips=4, seed=3)
    sphere("kiosk_cherry", gx, 5.6, gz, 0.12, M["paint_red"])
    for side in (-1, 1):
        e = sphere(f"kiosk_bunny_ear{side}", gx + side * 0.17, 5.75, gz + 0.05, 0.1, M["rabbit"], sy=3.2, sx=0.9, sz=0.5)
        e.rotation_euler[1] = math.radians(side * 12)
        ei = sphere(f"kiosk_bunny_earin{side}", gx + side * 0.17, 5.75, gz - 0.0, 0.055, M["rabbit_pink"], sy=4.4, sx=0.8, sz=0.3)
        ei.rotation_euler[1] = math.radians(side * 12)
    # 메뉴판 · 네온 · 조명
    sign("icecream_menu", 11.2, 1.9, KZ2 - .16, 180, 2.4, 0.9)
    box("kiosk_neon_strip", KX1 + .2, KX2 - .2, 2.55, 2.6, KZ1 + .62, KZ1 + .66, M["neon_pink"], bevel=0)
    light("icecream", 11.2, 2.4, 18.3, "#ffd1e0", 1.0, 8)
    # 카운터 위 작은 달토끼 인형 (판매대 마스코트)
    build_rabbit(13.0, 17.3, 180, s=0.17, prefix="kiosk_plush", anim_head=False, base_y=1.06, with_mortar=False)
    # 충돌 · 위치
    col("kiosk_counter", KX1, KX2, KZ1 - .1, KZ1 + .65, 1.1)
    col("kiosk_back", KX1, KX2, KZ2 - .15, KZ2, 2.6)
    col("kiosk_west", KX1, KX1 + .15, KZ1, KZ2, 2.6)
    col("kiosk_east", KX2 - .15, KX2, KZ1, 17.9, 2.6)
    zone("icecream", 11.2, 16.0, "달토끼 아이스크림", 4)
    empty("SPAWN_kiosk", 11.2, 0, 19.55, 180)            # 북쪽(손님 쪽)을 본다
    empty("SPOT_customer", 11.2, 0, 16.1, 0)             # 손님이 서는 자리
