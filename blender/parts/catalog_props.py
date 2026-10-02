"""Higgsfield 3D 카탈로그 소품 (blender/source/catalog_props.glb) 을 공원에 배치한다
build_lunaland_v2.py 안에서 exec 로 읽는다.

  카탈로그 파일에 든 것 : FoodCart · MarketStall · CafeTable · BeachUmbrella · PlazaBench · RecyclingBin · FlowerCart
                          (SteelLocker · FieldDesk · WoodenChair · ParkTree 등도 들어 있지만 지금은 쓰지 않는다)
"""
import bpy, math, mathutils, os

CATALOG = os.path.join(HERE, "source", "catalog_props.glb")


def load_catalog():
    """카탈로그 GLB 를 읽어 이름별로 한 덩어리 메시 견본을 만든다 (원점 = 바닥 가운데)"""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=CATALOG)
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None]
    tpl = {}
    for r in roots:
        r.location = (0, 0, 0)
        bpy.context.view_layer.update()
        meshes = [o for o in ([r] + list(r.children_recursive)) if o.type == "MESH"]
        for o in meshes:
            mw = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = mw
            with bpy.context.temp_override(object=o, active_object=o, selected_editable_objects=[o]):
                bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        if len(meshes) > 1:
            with bpy.context.temp_override(active_object=meshes[0], selected_editable_objects=meshes, selected_objects=meshes):
                bpy.ops.object.join()
        m = meshes[0]
        # 바닥 가운데를 원점으로
        bb = [mathutils.Vector(c) for c in m.bound_box]
        mn = mathutils.Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
        mx = mathutils.Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
        off = mathutils.Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
        m.data.transform(mathutils.Matrix.Translation(-off))
        m.name = "cattpl_" + r.name
        tpl[r.name] = (m, mx - mn)
        print("CATALOG", r.name, [round(v, 2) for v in (mx - mn)])
        for c in m.users_collection:
            c.objects.unlink(m)              # 견본은 내보내지 않는다 (복제본만 남김)
    for o in new:
        try:
            if o.type != "MESH":
                bpy.data.objects.remove(o, do_unlink=True)
        except ReferenceError:
            pass
    return tpl


def place(tpl, key, x, z, rot=0, s=1.0, collide="box", name=None):
    """견본을 복제해서 놓는다 (메시 공유). rot : 0=남쪽을 봄, 90=동 … collide : 'box' | 'circle' | None"""
    m, size = tpl[key]
    o = m.copy()
    o.name = name or f"prop_{key}_{x:.0f}_{z:.0f}"
    COLL.objects.link(o)
    o.location = T(x, 0, z)
    o.rotation_euler = (0, 0, math.radians(rot))
    o.scale = (s, s, s)
    sx, sy = size.x * s / 2, size.y * s / 2          # Blender X·Y 반폭 (회전 전)
    if collide == "box":
        r = math.radians(rot)
        hx = abs(math.cos(r)) * sx + abs(math.sin(r)) * sy
        hz = abs(math.sin(r)) * sx + abs(math.cos(r)) * sy
        col(o.name, x - hx, x + hx, z - hz, z + hz, size.z * s)
    elif collide == "circle":
        colc(o.name, x, z, max(sx, sy) * 0.8)
    return o


def place_catalog_props():
    tpl = load_catalog()
    # 핫도그 푸드카트 (푸드코트 앞)
    place(tpl, "FoodCart", 7.5, -15.5, 0)
    # 기념품 노점 + 작은 달토끼 인형들 (광장 서남쪽)
    place(tpl, "MarketStall", -12.6, 4.6, 90)
    for k, dz in enumerate((-0.42, 0.0, 0.42)):
        build_rabbit(-12.35, 4.6 + dz, 90, s=0.2, prefix=f"souvenir_plush_{k}", anim_head=False, base_y=0.92, with_mortar=False)
    # 카페 테이블 · 파라솔 (판매대 앞)
    for k, (x, z) in enumerate(((5.2, 14.2), (15.4, 13.4), (5.6, 20.2))):
        place(tpl, "CafeTable", x, z, k * 40, collide="circle")
        if k < 2:
            place(tpl, "BeachUmbrella", x, z, k * 70, collide=None)
    # 광장 벤치
    for x, z, r in ((-40.0, 1.6, 0), (-24.5, 19.5, 90), (27.0, 16.5, 180), (-10.5, -6.0, 0), (10.5, -6.0, 0)):
        place(tpl, "PlazaBench", x, z, r)
    # 분리수거함
    for x, z, r in ((-6.8, 32.5, 90), (6.8, 42.5, -90), (13.8, 22.0, 0), (-20.0, 0.5, 0), (20.5, 0.5, 0), (-36.0, 22.0, 90)):
        place(tpl, "RecyclingBin", x, z, r)
    # 꽃수레 (정문 안쪽)
    place(tpl, "FlowerCart", 9.2, 50.5, -90)
