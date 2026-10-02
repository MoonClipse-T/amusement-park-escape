"""범퍼카 6대 — 상자 모양이던 v1 범퍼카를 지우고, 둥근 차체 · 고무 범퍼 링 · 좌석 · 핸들 · 전기 기둥이 있는 범퍼카로 다시 만든다.

  CC0 범퍼카 모델을 Poly Pizza · Poly Haven 에서 찾지 못해(Sketchfab 은 API 키가 필요) Blender 로 직접 모델링했다.
  모서리는 Bevel · 둥근 부분은 Torus · Subdivision 으로 매끈하게.
  dorm_dress.py 의 도우미(_box · _cyl · _empty · _mat · _kids · _orient)를 쓴다.
  엔진이 읽는 이름 : IT_bcar_<n>(범퍼카, 조사 대상) · IT_bcarlamp_<n>(기둥 꼭대기 전기 램프) · SIGN_bcar_<n>(앞 번호판) · COLC_bcar_<n>
            IT_bplush(공포 연출 : 2번 범퍼카 좌석의 토끼 인형, 처음엔 숨김) · IT_bweight(추 : 엔진이 복제해 범퍼카에 올린다)
  Sketchfab (CC BY) : rabbit_plush_button_eye.glb — "Rabbit plush / Conejo Peluche" by afzmtm · kettlebell_old_iron.glb — "Old Iron Kettlebell" by tomarranskinner
  범퍼카장 : 난간 안쪽 x[-45,-27] z[33,47], 입구(광장 쪽) x[-37.7,-34.3]
"""
import bpy, bmesh, math, mathutils

CARS = [(-41.5, 37.0, 20), (-36.0, 38.8, -35), (-30.8, 36.6, 60),
        (-41.8, 43.6, 150), (-36.2, 44.3, 200), (-30.6, 42.6, 110)]      # 게임 (x, z, 방향°)
PAINT = ["#d8312a", "#2f6fd6", "#f2c230", "#2fa35a", "#f07a1e", "#8a4fd0"]


def _shape(name, verts_fn, m, bevel=0.0, subd=0, smooth=True):
    """bmesh 로 만든 모양 + (선택) 모서리 깎기 · 매끈하게. 원점 기준 Blender 좌표."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    verts_fn(bm)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(m)
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width, mod.segments = bevel, 3
    if subd:
        mod = o.modifiers.new("subd", "SUBSURF")
        mod.levels = mod.render_levels = subd
    for p in me.polygons:
        p.use_smooth = smooth
    return o


def _cube(sx, sy, sz, oz=0.0, oy=0.0):
    """반쪽 크기(sx, sy, sz)의 상자, 가운데 높이 oz · 앞뒤 위치 oy"""
    def f(bm):
        bmesh.ops.create_cube(bm, size=1)
        for v in bm.verts:
            v.co = mathutils.Vector((v.co.x * 2 * sx, v.co.y * 2 * sy + oy, v.co.z * 2 * sz + oz))
    return f


def _torus(R, r, sx=1.0, sy=1.0, oz=0.0, seg=36, ring=10):
    def f(bm):
        for i in range(seg):
            for j in range(ring):
                a, b = 2 * math.pi * i / seg, 2 * math.pi * j / ring
                bm.verts.new(((R + r * math.cos(b)) * math.cos(a) * sx, (R + r * math.cos(b)) * math.sin(a) * sy, r * math.sin(b) + oz))
        bm.verts.ensure_lookup_table()
        for i in range(seg):
            for j in range(ring):
                q = [bm.verts[(i * ring + j)], bm.verts[((i + 1) % seg) * ring + j], bm.verts[((i + 1) % seg) * ring + (j + 1) % ring], bm.verts[i * ring + (j + 1) % ring]]
                bm.faces.new(q)
    return f


OLD = [(-37, 38), (-41, 43), (-42, 36.5), (-32, 42), (-30, 36)]          # v1 범퍼카 자리 (게임 x, z)


def _remove_old_cars():
    """v1 범퍼카 : 'bumper' 메시에서 옛 차 자리 반경 2.3 m 안에 꼭짓점이 모두 들어가는 면(바닥판 · 차체 · 기둥)과 충돌 상자를 지운다.
       바닥 · 난간 · 지붕은 그보다 훨씬 넓어서 남는다."""
    for o in [o for o in bpy.data.objects if o.name.startswith("COL_car_")]:
        bpy.data.objects.remove(o, do_unlink=True)
    o = bpy.data.objects.get("bumper")
    if not o:
        return 0
    bm = bmesh.new()
    bm.from_mesh(o.data)
    near = lambda p, c: p.z < 4.5 and (p.x - c[0]) ** 2 + (-p.y - c[1]) ** 2 < 2.3 ** 2
    kill = [f for f in bm.faces if any(all(near(o.matrix_world @ v.co, c) for v in f.verts) for c in OLD)]
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bm.to_mesh(o.data)
    bm.free()
    return len(kill)


def build_bumper_cars():
    for o in [o for o in bpy.data.objects if o.name.startswith(("IT_bcar", "bcarx_", "SIGN_bcar_", "COLC_bcar_", "IT_bplush", "IT_bweight"))]:
        bpy.data.objects.remove(o, do_unlink=True)
    removed = _remove_old_cars()
    M = bpy.data.materials
    rubber, chrome, seat = _mat("bcarx_rubber", "#151517", 0.6), M["iron"], _mat("bcarx_seat", "#2a2a30", 0.5)
    for n, (x, z, rot) in enumerate(CARS, 1):
        paint = _mat(f"bcarx_paint_{n}", PAINT[n - 1], 0.32)
        parts = [
            _shape(f"bcarx_{n}_base", _cube(0.62, 0.95, 0.09, oz=0.13), M["locker_dark"], bevel=0.08),            # 바닥판
            _shape(f"bcarx_{n}_bumper", _torus(1, 0.13, sx=0.66, sy=0.98, oz=0.24), rubber),                   # 고무 범퍼 링
            _shape(f"bcarx_{n}_body", _cube(0.55, 0.85, 0.2, oz=0.45), paint, bevel=0.17),                     # 둥근 차체
            _shape(f"bcarx_{n}_hood", _cube(0.5, 0.32, 0.17, oz=0.66, oy=-0.5), paint, bevel=0.15),            # 앞쪽 볼록한 보닛
            _shape(f"bcarx_{n}_back", _cube(0.52, 0.12, 0.32, oz=0.78, oy=0.62), paint, bevel=0.1),            # 등받이 뒤판
            _shape(f"bcarx_{n}_seat", _cube(0.38, 0.22, 0.06, oz=0.66, oy=0.36), seat, bevel=0.05),            # 좌석
            _shape(f"bcarx_{n}_seatback", _cube(0.38, 0.06, 0.24, oz=0.86, oy=0.52), seat, bevel=0.04),
            _shape(f"bcarx_{n}_trim", _torus(1, 0.025, sx=0.56, sy=0.86, oz=0.66, ring=6), chrome),            # 차체 테두리 은색 띠
            _shape(f"bcarx_{n}_wheel", _torus(0.15, 0.02, oz=0.0, ring=6), seat),                              # 핸들 (아래서 기울임)
            _shape(f"bcarx_{n}_column", _cube(0.02, 0.02, 0.17, oz=0.0), chrome),
            _shape(f"bcarx_{n}_pole", _cube(0.025, 0.025, 1.0, oz=1.0), chrome),                      # 뒤의 전기 기둥 (높이 2 m)
        ]
        w, c, pole = parts[8], parts[9], parts[10]
        w.location, w.rotation_euler = (0, -0.12, 0.98), (math.radians(-50), 0, 0)
        c.location, c.rotation_euler = (0, -0.2, 0.84), (math.radians(-50), 0, 0)
        pole.location = (0, 0.72, 0.5)
        lamp = _shape(f"IT_bcarlamp_{n}", lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=10, radius=0.07), _mat(f"bcarx_lamp_{n}", "#3a3a32", 0.3))
        lamp.location = (0, 0.72, 2.55)
        spark = _shape(f"bcarx_{n}_spark", _cube(0.12, 0.12, 0.015, oz=0.0), chrome, bevel=0.01)
        spark.location = (0, 0.72, 2.66)
        root = bpy.data.objects.new(f"IT_bcar_{n}", None)
        bpy.context.scene.collection.objects.link(root)
        root.location = (x, -z, 0)
        root.rotation_euler[2] = math.radians(rot)
        for o in parts + [lamp, spark]:
            o.parent = root
        # 앞 번호판 (보닛 앞면, 차와 함께 돈다) · 충돌
        s = _empty(f"SIGN_bcar_{n}", 0, 0, 0, w=0.36, h=0.26)
        s.parent = root
        s.location = (0, -0.84, 0.66)                          # 판의 앞(Blender -Y) = 차 앞
        _cyl(f"COLC_bcar_{n}", x, 1.0, z, 0.95, 2.0, M["collider"], verts=12)
    # 공포 연출용 토끼 인형 : 2번 범퍼카 좌석에 앉혀 둔다 (엔진이 마지막에 보여 준다)
    car2 = bpy.data.objects["IT_bcar_2"]
    plush = _prop("sketchfab/rabbit_plush_button_eye.glb", 0, 0, 0, height=0.55, decimate=0.35, name="IT_bplush", child="bcarx_")
    plush.parent = car2
    plush.location, plush.rotation_euler = (0, 0.3, 0.69), (0, 0, 0)
    # 추 (엔진이 복제해서 범퍼카 좌석에 올린다) : 조작실 바닥 구석에 하나
    _prop("sketchfab/kettlebell_old_iron.glb", -38.55, 30.45, 0, y=0.04, height=0.28, name="IT_bweight", child="bcarx_")
    print("BUMPER_CARS_OK removed_faces", removed)
