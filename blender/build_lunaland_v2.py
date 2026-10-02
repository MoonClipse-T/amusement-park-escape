"""루나랜드 맵 v2 — v1 맵(blender/source/park_v1.glb)에 덧붙여 web/assets/park.glb 를 만든다.

  blender -b --python blender/build_lunaland_v2.py

  좌표는 전부 '게임 좌표(three.js)'로 적는다 : x 동(+)서(-), y 높이, z 남(+)북(-)
  Blender 좌표로 바꾸는 건 T() 가 한다  (Blender X = x, Y = -z, Z = y)

  추가하는 것
   - 직원 숙소 (방 1) : 긴 사물함 10개, 책상, 의자, 벤치, 게시판, 벽시계, 창문, 형광등, 문
   - 달토끼 아이스크림 판매대 (parts/icecream_kiosk.py)
   - 달토끼 봉제인형 (parts/rabbit_plush.py) : 광장 받침대 위 큰 인형 · 판매대 · 기념품 노점의 작은 인형
   - 나무 (parts/trees.py : Blender Sapling), 카탈로그 소품 (parts/catalog_props.py : Higgsfield 3D 카탈로그)
   - 메인 스트리트 전구 줄, 화단 · 풍선 수레 · 팝콘 수레
  모든 상자는 모서리를 깎고, 원기둥 · 구는 매끈한 음영으로 만든다
  치우는 것 (운영 중인 공원이므로)
   - 죽은 나무 → 살아 있는 나무, 쓰레기봉투 삭제, 셔터 낙서 → 깨끗한 셔터
"""
import bpy, bmesh, math, os, random

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "source", "park_v1.glb")
OUT_GLB = os.path.join(ROOT, "web", "assets", "park.glb")
OUT_BLEND = os.path.join(HERE, "lunaland_v2.blend")
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
SC = bpy.context.scene
COLL = SC.collection
# v1 맵의 관람차 곤돌라는 위치에 부모(ANIM_wheel) 위치가 한 번 더 더해져 있어 바퀴와 따로 하늘에 떠 있었다 → 부모 기준으로 되돌린다
_w = bpy.data.objects["ANIM_wheel"]
for _g in _w.children:
    if _g.name.startswith("GONDOLA_"):
        _g.location -= _w.location
DETAIL = []          # 나중에 재질별로 합칠 정적 소품


# ---------------------------------------------------------------- 도우미
def T(x, y, z):
    return (x, -z, y)


def mat(name, color=None, rough=0.8, metal=0.0, emit=None, glow=None, alpha=None):
    """있는 재질은 그대로 쓰고, 없으면 만든다. glow 는 엔진이 읽는 발광 세기(재질 extras)."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    if color:
        c = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
        b.inputs["Base Color"].default_value = (*[x ** 2.2 for x in c], 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        c = tuple(int(emit[i:i + 2], 16) / 255 for i in (1, 3, 5))
        b.inputs["Emission Color"].default_value = (*[x ** 2.2 for x in c], 1)
        b.inputs["Emission Strength"].default_value = 1.0
    if glow:
        m["glow"] = glow
    if alpha is not None:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    return m


def link(obj, detail=True):
    COLL.objects.link(obj)
    if detail:
        DETAIL.append(obj)
    return obj


def box(name, x1, x2, y1, y2, z1, z2, material, detail=True, uv=1.0, bevel=0.02):
    """게임 좌표 상자. 면마다 월드 크기 기준 UV(1m = uv 타일)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    xs, ys, zs = (x1, x2), (y1, y2), (z1, z2)
    v = {}
    for i in range(2):
        for j in range(2):
            for k in range(2):
                v[i, j, k] = bm.verts.new(T(xs[i], ys[j], zs[k]))
    faces = [
        [(0, 0, 0), (0, 0, 1), (0, 1, 1), (0, 1, 0)], [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)],
        [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)], [(0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)],
        [(0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)], [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)],
    ]
    import mathutils
    cen = mathutils.Vector(T((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2))
    for f in faces:
        vs = [v[c] for c in f]
        # 얇은 상자에서도 면이 항상 바깥을 보게 : 면 중심 → 상자 중심 방향과 법선을 비교해 순서를 정한다
        n = (vs[1].co - vs[0].co).cross(vs[2].co - vs[0].co)
        fc = sum((x.co for x in vs), mathutils.Vector()) / 4
        if n.dot(fc - cen) < 0:
            vs.reverse()
        try:
            bm.faces.new(vs)
        except ValueError:
            pass
    bm.normal_update()
    # 모서리 깎기 : 각진 상자 대신 빛을 받는 둥근 모서리 (아주 얇은 판은 건너뛴다)
    mind = min(abs(x2 - x1), abs(y2 - y1), abs(z2 - z1))
    if bevel and mind > 0.02:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, mind * 0.3), segments=1, profile=0.5, affect="EDGES", clamp_overlap=True)
        bm.normal_update()
    lay = bm.loops.layers.uv.new()
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda a: abs(n[a]))
        u_ax, v_ax = [(1, 2), (0, 2), (0, 1)][ax]
        for l in f.loops:
            co = l.vert.co
            l[lay].uv = (co[u_ax] * uv, co[v_ax] * uv)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material)
    return link(bpy.data.objects.new(name, me), detail)


def cyl(name, x, y1, y2, z, r, material, verts=24, detail=True, r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r if r2 is None else r2, depth=y2 - y1,
                                    location=T(x, (y1 + y2) / 2, z))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    smooth(o, 40)
    if detail:
        DETAIL.append(o)
    return o


def smooth(o, angle=40):
    """매끈하게 (각진 면 대신 부드러운 음영). 각이 큰 모서리는 그대로 둔다"""
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.use_auto_smooth = True
    o.data.auto_smooth_angle = math.radians(angle)


def sphere(name, x, y, z, r, material, sx=1, sy=1, sz=1, seg=20, ring=14, detail=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=r, location=T(x, y, z))
    o = bpy.context.object
    o.name = name
    o.scale = (sx, sz, sy)          # 게임 (x,y,z) 배율 → Blender (x, z, y)
    o.data.materials.append(material)
    smooth(o, 80)
    if detail:
        DETAIL.append(o)
    return o


def rot_y(o, deg):
    """게임 좌표 y축 회전 (위에서 볼 때 반시계)."""
    o.rotation_euler[2] += math.radians(deg)


def empty(name, x, y, z, rot=0, **props):
    e = bpy.data.objects.new(name, None)
    e.location = T(x, y, z)
    e.rotation_euler[2] = math.radians(rot)
    for k, val in props.items():
        e[k] = val
    COLL.objects.link(e)
    return e


def col(name, x1, x2, z1, z2, h=2.5):
    """충돌 상자 (엔진이 읽고 화면에서는 지운다)."""
    return box("COL_" + name, x1, x2, 0, h, z1, z2, M["collider"], detail=False)


def colc(name, x, z, r):
    return cyl("COLC_" + name, x, 0, 2, z, r, M["collider"], verts=8, detail=False)


def sign(key, x, y, z, rot, w, h):
    """SIGN_<key> : 엔진이 SIGNS[key] 글씨로 판을 붙인다. rot 0=남, 90=동, 180=북, -90=서 를 바라봄."""
    return empty("SIGN_" + key, x, y, z, rot, w=w, h=h)


def light(name, x, y, z, color, i, d):
    return empty("LIGHT_" + name, x, y, z, color=color, i=i, d=d)


def zone(zid, x, z, title, r):
    return empty("ZONE_" + zid, x, 0, z, title=title, r=r)


# ---------------------------------------------------------------- 재질
M = {n: bpy.data.materials[n] for n in [
    "collider", "planks", "paint_red", "paint_white", "paint_yellow", "paint_blue", "paint_green", "stripe_red",
    "stripe_blue", "iron", "brass", "glass", "bulb", "bulb_red", "concrete", "darkwood", "paving", "slate",
    "plaster_cream", "plaster_sky", "plaster_mint", "plaster_pink", "rubber", "water", "wall"]}
M["leaf"] = mat("leaf", "#3f6b34", 0.9)
M["leaf2"] = mat("leaf2", "#5a7d36", 0.9)
M["bark"] = mat("bark", "#4a3626", 0.95)
M["hedge"] = mat("hedge", "#2f5a2c", 0.95)
M["soil"] = mat("soil", "#3a2a1e", 1.0)
M["locker"] = mat("locker", "#7d8a93", 0.45, 0.6)
M["locker_dark"] = mat("locker_dark", "#20262b", 0.6, 0.4)
M["floor_tile"] = mat("floor_tile", "#a9a294", 0.7)
M["inner_wall"] = mat("inner_wall", "#d9d6cc", 0.9)
M["cork"] = mat("cork", "#a27a4e", 1.0)
M["paper"] = mat("paper", "#f2eee2", 0.9)
M["fluor"] = mat("fluor", "#ffffff", 0.3, emit="#e8f2ff", glow=2.0)
M["rabbit"] = mat("rabbit_fur", "#efeae2", 0.85)
M["rabbit_pink"] = mat("rabbit_pink", "#e3a0a8", 0.8)
M["rabbit_eye"] = mat("rabbit_eye", "#2a0000", 0.3, emit="#ff1a10", glow=0.0)   # 자정에 엔진이 켠다
M["mortar"] = mat("mortar_stone", "#8a8478", 0.9)
M["cream_v"] = mat("icecream_vanilla", "#f3e6c4", 0.6)
M["cream_s"] = mat("icecream_strawberry", "#f2a2b2", 0.6)
M["cream_c"] = mat("icecream_choco", "#6b4128", 0.6)
M["cone"] = mat("waffle_cone", "#d39a52", 0.8)
M["neon_pink"] = mat("neon_pink", "#ff8fc0", 0.4, emit="#ff6fae", glow=1.6)
M["balloon"] = [mat("balloon_" + c, c, 0.35) for c in ("#e8453c", "#f2c230", "#3b8fd9", "#8fd14f", "#e86fb5", "#ffffff")]
M["wire"] = mat("wire", "#111111", 0.6)
M["k_white"] = mat("kiosk_white", "#f4efe6", 0.6)
M["k_pink"] = mat("kiosk_pink", "#f2b3c4", 0.7)
M["k_mint"] = mat("kiosk_mint", "#a8dcc8", 0.7)

# ---------------------------------------------------------------- 부품 파일 (blender/parts/*.py)
for part in ("rabbit_plush", "trees", "icecream_kiosk", "catalog_props", "dorm_dress", "carousel_booth", "bumper_cars"):
    exec(open(os.path.join(HERE, "parts", part + ".py"), encoding="utf-8").read())

# ---------------------------------------------------------------- 1. 폐허 소품 정리
for o in list(bpy.data.objects):
    if o.name.startswith(("trashbag", "Barrel_01", "WetFloorSign")):   # 쓰레기봉투 · 드럼통 · 바닥 미끄럼 표지판
        bpy.data.objects.remove(o, do_unlink=True)
for o in bpy.data.objects:
    if o.type == "MESH":
        for s in o.material_slots:
            if s.material and s.material.name == "rollershutter_door_graffiti":
                s.material = bpy.data.materials["rollershutter_door"]
dead = [o for o in bpy.data.objects if o.name.startswith("dead_tree")]
dead_pos = []
for o in dead:
    p = o.matrix_world.translation
    dead_pos.append((p.x, -p.y))
    bpy.data.objects.remove(o, do_unlink=True)


# ---------------------------------------------------------------- 2. 나무 · 화단
TREES = [(-44, -3), (-52, -40), (46, 2), (-8, -52), (25, -46), (-50, 22), (20, 52),
         (-54, 34), (-46, 44), (-54, 50), (-40, 48), (-55, -10), (-55, -24), (-48, -52), (-36, -52),
         (52, 24), (54, 6), (54, -12), (54, -28), (30, 48), (38, 52), (28, 30), (-22, 50), (-26, 40),
         (14, -50), (-30, -40), (-46, -32)]
plant_trees(make_tree_templates(), [(x, z, 0.85 + random.random() * 0.35) for x, z in TREES])


def flowerbed(x1, x2, z1, z2):
    box(f"bed_{x1:.0f}_{z1:.0f}", x1, x2, 0, 0.35, z1, z2, M["concrete"])
    box(f"bed_{x1:.0f}_{z1:.0f}_soil", x1 + .1, x2 - .1, 0, 0.38, z1 + .1, z2 - .1, M["soil"])
    box(f"bed_{x1:.0f}_{z1:.0f}_hedge", x1 + .15, x2 - .15, 0.38, 0.85, z1 + .15, z2 - .15, M["hedge"])
    cols = [M["balloon"][0], M["balloon"][1], M["balloon"][4], M["balloon"][5]]
    n = int((x2 - x1) * (z2 - z1) * 1.2)
    for k in range(n):
        fx, fz = random.uniform(x1 + .3, x2 - .3), random.uniform(z1 + .3, z2 - .3)
        sphere(f"flower_{x1:.0f}_{z1:.0f}_{k}", fx, 0.9, fz, 0.09, random.choice(cols), seg=10, ring=7)
    col(f"bed_{x1:.0f}_{z1:.0f}", x1, x2, z1, z2, 0.9)


# 정문 안쪽 화단
flowerbed(-14, -9, 52.5, 54.5)
flowerbed(9, 14, 52.5, 54.5)
# 광장 가장자리 화단
flowerbed(-17, -15.5, 2, 6)
flowerbed(15.5, 17, 2, 6)

# ---------------------------------------------------------------- 3. 직원 숙소 (방 1)
# 바깥 x[-57,-47] z[0,8], 벽 두께 0.2, 높이 3.0 · 문 : 동쪽 벽 z[3.4,4.6] · 창 : 남쪽 벽 x[-53,-51]
DX1, DX2, DZ1, DZ2, H = -57.0, -47.0, 0.0, 8.0, 3.0
W = 0.2
ext = M["plaster_sky"]
box("dorm_floor", DX1, DX2, 0, 0.03, DZ1, DZ2, M["floor_tile"], uv=1.2)
# 벽 (바깥 재질) — 안쪽 면은 같은 상자에 안쪽 재질 판을 덧댄다
box("dorm_wall_n", DX1, DX2, 0, H, DZ1, DZ1 + W, ext)
box("dorm_wall_w", DX1, DX1 + W, 0, H, DZ1, DZ2, ext)
box("dorm_wall_s_a", DX1, -53, 0, H, DZ2 - W, DZ2, ext)
box("dorm_wall_s_b", -51, DX2, 0, H, DZ2 - W, DZ2, ext)
box("dorm_wall_s_low", -53, -51, 0, 1.1, DZ2 - W, DZ2, ext)
box("dorm_wall_s_top", -53, -51, 2.1, H, DZ2 - W, DZ2, ext)
box("dorm_window_glass", -53, -51, 1.1, 2.1, DZ2 - W / 2 - .02, DZ2 - W / 2 + .02, M["glass"], detail=False)
box("dorm_window_frame_h", -53.05, -50.95, 1.55, 1.65, DZ2 - W - .02, DZ2 + .02, M["paint_white"])
box("dorm_window_frame_v", -52.05, -51.95, 1.1, 2.1, DZ2 - W - .02, DZ2 + .02, M["paint_white"])
box("dorm_wall_e_a", DX2 - W, DX2, 0, H, DZ1, 3.4, ext)
box("dorm_wall_e_b", DX2 - W, DX2, 0, H, 4.6, DZ2, ext)
box("dorm_wall_e_top", DX2 - W, DX2, 2.2, H, 3.4, 4.6, ext)
# 안쪽 벽면
I = 0.01
box("dorm_in_n", DX1 + W, DX2 - W, 0.03, H, DZ1 + W, DZ1 + W + I, M["inner_wall"])
box("dorm_in_w", DX1 + W, DX1 + W + I, 0.03, H, DZ1 + W, DZ2 - W, M["inner_wall"])
box("dorm_in_s_a", DX1 + W, -53, 0.03, H, DZ2 - W - I, DZ2 - W, M["inner_wall"])
box("dorm_in_s_b", -51, DX2 - W, 0.03, H, DZ2 - W - I, DZ2 - W, M["inner_wall"])
box("dorm_in_s_low", -53, -51, 0.03, 1.1, DZ2 - W - I, DZ2 - W, M["inner_wall"])
box("dorm_in_s_top", -53, -51, 2.1, H, DZ2 - W - I, DZ2 - W, M["inner_wall"])
box("dorm_in_e_a", DX2 - W - I, DX2 - W, 0.03, H, DZ1 + W, 3.4, M["inner_wall"])
box("dorm_in_e_b", DX2 - W - I, DX2 - W, 0.03, H, 4.6, DZ2 - W, M["inner_wall"])
# 걸레받이
box("dorm_skirt", DX1 + W, DX2 - W, 0.03, 0.12, DZ1 + W, DZ1 + W + .03, M["locker_dark"])
# 천장 · 지붕
box("dorm_ceiling", DX1, DX2, H - 0.05, H, DZ1, DZ2, M["inner_wall"])
box("dorm_roof", DX1 - .35, DX2 + .35, H, H + 0.25, DZ1 - .35, DZ2 + .35, M["slate"])
box("dorm_roof_trim", DX1 - .38, DX2 + .38, H - 0.05, H + 0.02, DZ1 - .38, DZ2 + .38, M["paint_white"])
# 형광등
for k, cz in enumerate((2.6, 5.4)):
    box(f"dorm_fluor_{k}", -53.4, -50.6, H - 0.12, H - 0.06, cz - .12, cz + .12, M["fluor"])
    box(f"dorm_fluor_{k}_case", -53.5, -50.5, H - 0.08, H - 0.05, cz - .16, cz + .16, M["iron"])
light("dorm", -52, 2.6, 4, "#e8f0ff", 1.15, 10)
# 문 : 경첩(z=3.4) 기준으로 도는 ANIM_dormdoor (닫힌 상태로 만든다, 엔진이 연다)
hinge = empty("ANIM_dormdoor", DX2 - W / 2, 0, 3.4)
door = box("dorm_door", -0.03, 0.03, 0.02, 2.18, 0.02, 1.18, M["paint_green"], detail=False)
door.parent = hinge
door.location = (0, 0, 0)
knob = box("dorm_door_knob", 0.03, 0.09, 1.0, 1.06, 1.0, 1.06, M["brass"], detail=False)
knob.parent = hinge
knob2 = box("dorm_door_knob_in", -0.09, -0.03, 1.0, 1.06, 1.0, 1.06, M["brass"], detail=False)
knob2.parent = hinge
box("dorm_door_frame_l", DX2 - W - .02, DX2 + .04, 0, 2.25, 3.32, 3.4, M["paint_white"])
box("dorm_door_frame_r", DX2 - W - .02, DX2 + .04, 0, 2.25, 4.6, 4.68, M["paint_white"])
box("dorm_door_frame_t", DX2 - W - .02, DX2 + .04, 2.18, 2.25, 3.32, 4.68, M["paint_white"])
# 번호 자물쇠 (문 안쪽 옆 벽)
box("IT_keypad_dorm", DX2 - W - .06, DX2 - W, 1.2, 1.5, 4.75, 4.97, M["locker_dark"], detail=False)
box("dorm_keypad_screen", DX2 - W - .065, DX2 - W - .055, 1.4, 1.46, 4.79, 4.93, M["neon_pink"], detail=False)
col("dorm_n", DX1, DX2, DZ1, DZ1 + W, H)
col("dorm_s", DX1, DX2, DZ2 - W, DZ2, H)
col("dorm_w", DX1, DX1 + W, DZ1, DZ2, H)
col("dorm_e_a", DX2 - W, DX2, DZ1, 3.4, H)
col("dorm_e_b", DX2 - W, DX2, 4.6, DZ2, H)
box("COL_GATE_dorm", DX2 - W, DX2, 0, 2.2, 3.4, 4.6, M["collider"], detail=False)

# 긴 사물함 : 서쪽 벽 6개(동쪽을 봄) + 북쪽 벽 4개(남쪽을 봄). 문짝은 IT_locker_N (엔진이 연다)
LW, LD, LH = 0.6, 0.55, 2.05


def locker(n, x, z, face):
    if face == "e":
        bx1, bx2, bz1, bz2 = x, x + LD, z, z + LW
        box(f"locker_{n}_body", bx1, bx2, 0.03, LH, bz1, bz2, M["locker"])
        box(f"locker_{n}_top", bx1 - .01, bx2 + .01, LH, LH + .04, bz1 - .01, bz2 + .01, M["locker_dark"])
        d = box(f"IT_locker_{n}", bx2, bx2 + .03, 0.12, LH - .05, bz1 + .03, bz2 - .03, M["locker"], detail=False)
        for k in range(4):
            box(f"locker_{n}_vent{k}", bx2 + .03, bx2 + .035, LH - .35 + k * .05, LH - .33 + k * .05, bz1 + .15, bz2 - .15, M["locker_dark"])
        box(f"locker_{n}_handle", bx2 + .03, bx2 + .07, 1.0, 1.2, bz2 - .12, bz2 - .08, M["iron"])
        sign(f"locker_{n}", bx2 + .04, 1.62, (bz1 + bz2) / 2, 90, 0.16, 0.11)
        col(f"locker_{n}", bx1, bx2 + .05, bz1, bz2)
    else:  # 남쪽을 봄
        bx1, bx2, bz1, bz2 = x, x + LW, z, z + LD
        box(f"locker_{n}_body", bx1, bx2, 0.03, LH, bz1, bz2, M["locker"])
        box(f"locker_{n}_top", bx1 - .01, bx2 + .01, LH, LH + .04, bz1 - .01, bz2 + .01, M["locker_dark"])
        box(f"IT_locker_{n}", bx1 + .03, bx2 - .03, 0.12, LH - .05, bz2, bz2 + .03, M["locker"], detail=False)
        for k in range(4):
            box(f"locker_{n}_vent{k}", bx1 + .15, bx2 - .15, LH - .35 + k * .05, LH - .33 + k * .05, bz2 + .03, bz2 + .035, M["locker_dark"])
        box(f"locker_{n}_handle", bx2 - .12, bx2 - .08, 1.0, 1.2, bz2 + .03, bz2 + .07, M["iron"])
        sign(f"locker_{n}", (bx1 + bx2) / 2, 1.62, bz2 + .04, 0, 0.16, 0.11)
        col(f"locker_{n}", bx1, bx2, bz1, bz2 + .05)


for k in range(6):
    locker(k + 1, DX1 + W + .01, 1.6 + k * LW, "e")
for k in range(4):
    locker(k + 7, -54.6 + k * LW, DZ1 + W + .01, "s")
# 탈의실 벤치
box("dorm_bench_top", -54.9, -54.5, 0.42, 0.47, 2.0, 5.4, M["darkwood"])
for k, bz in enumerate((2.2, 5.2)):
    box(f"dorm_bench_leg{k}", -54.85, -54.55, 0.03, 0.42, bz - .05, bz + .05, M["iron"])
col("dorm_bench", -54.9, -54.5, 2.0, 5.4, 0.5)
# 책상 · 의자 · 스탠드 (남쪽 창 아래)
box("dorm_desk_top", -53.3, -50.7, 0.74, 0.78, 6.95, 7.75, M["darkwood"])
for k, (lx, lz) in enumerate(((-53.2, 7.0), (-50.85, 7.0), (-53.2, 7.65), (-50.85, 7.65))):
    box(f"dorm_desk_leg{k}", lx, lx + .06, 0.03, 0.74, lz, lz + .06, M["iron"])
box("dorm_desk_drawer", -51.6, -50.75, 0.55, 0.74, 6.95, 7.7, M["darkwood"])
box("IT_drawer_dorm", -51.55, -50.8, 0.57, 0.72, 6.92, 6.95, M["planks"], detail=False)
col("dorm_desk", -53.3, -50.7, 6.95, 7.8, 0.8)
box("dorm_chair_seat", -52.3, -51.8, 0.44, 0.48, 6.2, 6.7, M["paint_blue"])
box("dorm_chair_back", -52.3, -51.8, 0.48, 0.95, 6.15, 6.2, M["paint_blue"])
for k, (lx, lz) in enumerate(((-52.28, 6.2), (-51.84, 6.2), (-52.28, 6.64), (-51.84, 6.64))):
    box(f"dorm_chair_leg{k}", lx, lx + .03, 0.03, 0.44, lz, lz + .03, M["iron"])
cyl("dorm_lamp_base", -53.0, 0.78, 0.81, 7.5, 0.09, M["iron"], verts=12)
cyl("dorm_lamp_arm", -53.0, 0.81, 1.15, 7.5, 0.012, M["iron"], verts=6)
cyl("dorm_lamp_head", -52.85, 1.08, 1.18, 7.45, 0.07, M["paint_yellow"], verts=12, r2=0.04)
light("dorm_desk", -52.8, 1.0, 7.4, "#ffc98a", 0.45, 3.5)
# 퀘스트 쪽지 (책상 위)
box("IT_note_dorm", -52.2, -51.9, 0.781, 0.785, 7.15, 7.55, M["paper"], detail=False)
box("dorm_pen", -51.8, -51.4, 0.78, 0.8, 7.3, 7.32, M["paint_red"])
# 게시판 (동쪽 벽 안쪽, 문 남쪽)
box("IT_board_dorm", DX2 - W - .05, DX2 - W, 1.1, 2.1, 5.2, 7.2, M["cork"], detail=False)
for k, (py, pz) in enumerate(((1.75, 5.5), (1.4, 6.1), (1.8, 6.6), (1.35, 6.9))):
    box(f"dorm_board_paper{k}", DX2 - W - .06, DX2 - W - .05, py - .14, py + .14, pz - .1, pz + .1, M["paper"])
# 벽시계 (북쪽 벽 안쪽 높이 2.4)
cyl("IT_clock_dorm", -50.5, 2.38, 2.42, DZ1 + W + .03, 0.22, M["paint_white"], verts=20, detail=False).rotation_euler[0] = math.radians(90)
bpy.data.objects["IT_clock_dorm"].location = T(-50.5, 2.4, DZ1 + W + .03)
# 바깥 : 간판 · 등 · 길
sign("dorm", DX2 + .02, 2.6, 4.0, 90, 2.4, 0.5)
light("dorm_out", DX2 + 0.6, 2.7, 4.0, "#ffd9a0", 0.8, 9)
box("dorm_out_lamp", DX2, DX2 + .25, 2.5, 2.6, 3.9, 4.1, M["bulb"])
box("dorm_step", DX2, DX2 + 1.0, 0, 0.06, 3.2, 4.8, M["concrete"])
box("dorm_path", DX2 + 1.0, -38.6, 0, 0.02, 3.3, 4.7, M["paving"], uv=0.5)
sign("dorm_rule", DX2 + .02, 1.5, 6.2, 90, 0.9, 1.2)
zone("dorm", -52, 4, "직원 숙소", 5)
empty("SPAWN_dorm_door", -44.5, 0, 4.0, -90)
dress_dorm()       # blender/parts/dorm_dress.py : 두 색 벽 · 체크 바닥 · 휴게 구석 · Poly Haven 소품 · 방 1 퍼즐 소품
build_booth()      # blender/parts/carousel_booth.py : 회전목마 조작실
fix_carousel()     # 같은 파일 : 울타리 · 무대 충돌, 구역 번호 1~8, 쓰러진 말
build_bumper_booth()   # 같은 파일 : 범퍼카 조작실
build_bumper_cars()    # blender/parts/bumper_cars.py : 범퍼카 6대

# ---------------------------------------------------------------- 4. 달토끼 아이스크림 판매대 (근무지)
build_kiosk()      # blender/parts/icecream_kiosk.py

# ---------------------------------------------------------------- 5. 달토끼 동상 (광장 남서쪽, 동쪽 = 메인 스트리트 쪽을 봄)
# 받침대 위에 큰 봉제인형 (blender/parts/rabbit_plush.py). 머리는 ANIM_rabbithead
RX, RZ = -11.0, 17.5
cyl("rabbit_pedestal", RX, 0, 0.8, RZ, 1.3, M["concrete"], verts=48)
cyl("rabbit_pedestal_rim", RX, 0.8, 0.9, RZ, 1.4, M["brass"], verts=48)
build_rabbit(RX, RZ, 90, s=1.35, prefix="rabbit", anim_head=True, base_y=0.9)
sign("rabbit_plate", RX + 1.31, 0.5, RZ, 90, 1.6, 0.35)
colc("rabbit", RX, RZ, 1.45)

# ---------------------------------------------------------------- 6. 메인 스트리트 전구 줄
BULBS, WIRES = [], []


def string_lights(x1, z1, x2, z2, y1, y2, sag=0.6, n=18):
    for k in range(n + 1):
        t = k / n
        x, z = x1 + (x2 - x1) * t, z1 + (z2 - z1) * t
        y = y1 + (y2 - y1) * t - sag * 4 * t * (1 - t)
        b = sphere(f"bulbstr_{x1:.0f}_{z1:.0f}_{k}", x, y - .08, z, 0.06, M["bulb"], seg=10, ring=7, detail=False)
        BULBS.append(b)
        if k < n:
            t2 = (k + 1) / n
            xx, zz = x1 + (x2 - x1) * t2, z1 + (z2 - z1) * t2
            yy = y1 + (y2 - y1) * t2 - sag * 4 * t2 * (1 - t2)
            mx, my, mz = (x + xx) / 2, (y + yy) / 2, (z + zz) / 2
            L = math.dist((x, y, z), (xx, yy, zz))
            w = cyl(f"wire_{x1:.0f}_{z1:.0f}_{k}", mx, my - L / 2, my + L / 2, mz, 0.008, M["wire"], verts=4, detail=False)
            dx, dy, dz = xx - x, yy - y, zz - z
            # 원기둥(세로)을 선분 방향으로 돌린다
            w.rotation_mode = "QUATERNION"
            import mathutils
            w.rotation_quaternion = mathutils.Vector((0, 0, 1)).rotation_difference(mathutils.Vector(T(dx, dy, dz)).normalized())
            WIRES.append(w)


for k, z in enumerate((25, 30, 35, 40, 45, 50)):
    z2 = z + 5 if k % 2 == 0 else z - 5 + 5
    string_lights(-6.3, z, 6.3, z + (2.5 if k % 2 == 0 else -2.5), 4.4, 4.4)
string_lights(-9.5, 57.5, 9.5, 57.5, 4.6, 4.6, sag=0.9, n=24)
# 광장 둘레
plaza_lamps = [(15.2, 10), (7.6, -3.2), (-7.6, -3.2), (-15.2, 10), (-7.6, 23.2), (7.6, 23.2)]
for i in range(len(plaza_lamps)):
    (ax, az), (bx, bz) = plaza_lamps[i], plaza_lamps[(i + 1) % len(plaza_lamps)]
    string_lights(ax, az, bx, bz, 3.9, 3.9, sag=0.8, n=16)

# ---------------------------------------------------------------- 7. 거리 소품
place_catalog_props()      # blender/parts/catalog_props.py : 푸드카트 · 노점 · 카페 테이블 · 벤치 · 분리수거함 · 꽃수레


# 풍선 수레 (정문 안쪽)
def balloon_cart(x, z):
    box(f"bcart_{x:.0f}", x - .6, x + .6, 0.3, 1.0, z - .4, z + .4, M["paint_blue"])
    for s in (-1, 1):
        cyl(f"bcart_{x:.0f}_wheel{s}", x + s * .45, 0, 0.6, z + .45, 0.3, M["rubber"], verts=12).rotation_euler[1] = math.radians(90)
    for k in range(9):
        bx, bz = x + random.uniform(-.5, .5), z + random.uniform(-.35, .35)
        by = 2.2 + random.uniform(0, .8)
        cyl(f"bcart_{x:.0f}_str{k}", bx, 1.0, by - .25, bz, 0.005, M["wire"], verts=3)
        sphere(f"bcart_{x:.0f}_bal{k}", bx, by, bz, 0.25, random.choice(M["balloon"]), sy=1.2, seg=10, ring=7)
    col(f"bcart_{x:.0f}", x - .7, x + .7, z - .55, z + .55, 1.0)


balloon_cart(-4.5, 51.5)


# 팝콘 수레 (광장 동쪽)
def popcorn(x, z):
    box(f"pop_{x:.0f}_base", x - .5, x + .5, 0.3, 1.0, z - .4, z + .4, M["paint_red"])
    box(f"pop_{x:.0f}_glass", x - .45, x + .45, 1.0, 1.7, z - .35, z + .35, M["glass"], detail=False)
    box(f"pop_{x:.0f}_corn", x - .4, x + .4, 1.0, 1.25, z - .3, z + .3, M["paint_yellow"])
    box(f"pop_{x:.0f}_roof", x - .55, x + .55, 1.7, 1.85, z - .45, z + .45, M["stripe_red"], uv=2)
    for s in (-1, 1):
        cyl(f"pop_{x:.0f}_wheel{s}", x + s * .4, 0, 0.5, z + .45, 0.25, M["rubber"], verts=12).rotation_euler[1] = math.radians(90)
    col(f"pop_{x:.0f}", x - .6, x + .6, z - .55, z + .55, 1.8)


popcorn(16.5, 7.0)
popcorn(-4.0, -9.5)

# 안내 표지판 (광장 중앙 북쪽)
cyl("dirpost", 3.5, 0, 3.0, 3.0, 0.06, M["iron"], verts=16)
sign("dir_0", 3.5, 2.6, 3.0, -90, 1.4, 0.32)
sign("dir_1", 3.5, 2.2, 3.0, 90, 1.4, 0.32)
sign("dir_2", 3.5, 1.8, 3.0, 180, 1.4, 0.32)
colc("dirpost", 3.5, 3.0, 0.15)

# 달토끼 포스터 판 (메인 스트리트 양쪽)
for k, (x, z, r) in enumerate(((-7.0, 33.0, 90), (7.0, 43.0, -90))):
    box(f"poster_{k}_frame", x - .08, x + .08, 0, 2.4, z - .7, z + .7, M["iron"])
    sign(f"poster_{k}", x + (0.09 if r == 90 else -0.09), 1.6, z, r, 1.2, 1.4)
    col(f"poster_{k}", x - .1, x + .1, z - .7, z + .7, 2.4)

# ---------------------------------------------------------------- 8. 정적 소품 합치기 (재질별)
bpy.ops.object.select_all(action="DESELECT")
by_mat = {}
for o in DETAIL:
    if o.name not in bpy.data.objects or o.type != "MESH" or o.parent is not None:
        continue
    m = o.data.materials[0].name if o.data.materials else "_"
    by_mat.setdefault(m, []).append(o)
for m, objs in by_mat.items():
    if len(objs) < 2:
        objs[0].name = f"v2_{m}"
        continue
    with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    objs[0].name = f"v2_{m}"
for group, name in ((BULBS, "v2_stringbulbs"), (WIRES, "v2_stringwires")):
    with bpy.context.temp_override(active_object=group[0], selected_editable_objects=group, selected_objects=group):
        bpy.ops.object.join()
    group[0].name = name

# ---------------------------------------------------------------- 저장 · 내보내기
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, compress=True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_extras=True, export_apply=True, export_cameras=False, export_lights=False)
print("BUILD_OK", OUT_GLB, os.path.getsize(OUT_GLB) // 1024, "KB")
