"""공원 나무 : Blender 내장 Sapling 나무 생성기로 가지 · 잎이 있는 나무를 만든다
build_lunaland_v2.py 안에서 exec 로 읽는다.

  make_tree_templates() → [(줄기, 잎), …]  (나무 모양 2종)
  plant_trees(templates, spots)           → 같은 메시를 공유하는 복제본을 심는다 (파일 크기 절약)
"""
import bpy, math, random, addon_utils


def _leaf_image():
    """잎 텍스처 : 투명 배경 위 잎 한 장 (가운데 잎맥, 위로 갈수록 밝은 초록)"""
    img = bpy.data.images.get("leaf_tex")
    if img:
        return img
    N = 128
    img = bpy.data.images.new("leaf_tex", N, N, alpha=True)
    rnd = random.Random(1)
    px = [0.0] * (N * N * 4)
    for y in range(N):
        for x in range(N):
            u, v = (x + .5) / N, (y + .5) / N
            w = 0.44 * math.sin(math.pi * min(1, max(0, v))) ** 0.8
            inside = abs(u - 0.5) < w * (1 - 0.15 * v)
            vein = abs(u - 0.5) < 0.014
            g = 0.30 + 0.22 * v + 0.06 * rnd.random()
            r, b = 0.16 + 0.08 * v, 0.08
            if vein:
                r, g, b = r * 1.35, g * 1.2, b * 1.3
            i = (y * N + x) * 4
            px[i:i + 4] = [r, g, b, 1.0 if inside else 0.0]
    img.pixels = px
    img.pack()
    return img


def _materials():
    bark = bpy.data.materials.get("tree_bark") or bpy.data.materials.new("tree_bark")
    bark.use_nodes = True
    bark.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.11, 0.075, 0.05, 1)
    bark.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    leaf = bpy.data.materials.get("tree_leaf")
    if leaf is None:
        leaf = bpy.data.materials.new("tree_leaf")
        leaf.use_nodes = True
        nt = leaf.node_tree
        b = nt.nodes["Principled BSDF"]
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = _leaf_image()
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
        b.inputs["Roughness"].default_value = 0.75
        leaf.blend_method = "CLIP"
        leaf.alpha_threshold = 0.5
        leaf.use_backface_culling = False      # 잎은 양면
    return bark, leaf


def make_tree_templates():
    addon_utils.enable("add_curve_sapling", default_set=True)
    bark, leaf = _materials()
    out = []
    for k, (seed, scale, leaves) in enumerate(((11, 6.5, 60), (23, 5.6, 55))):
        bpy.ops.curve.tree_add(do_update=True, bevel=True, prune=False, showLeaves=True, useArm=False,
            seed=seed, handleType="0", levels=3, length=(1, 0.55, 0.45, 0.4), lengthV=(0, 0.15, 0.15, 0.1),
            branches=(0, 28, 10, 8), curveRes=(4, 3, 2, 1), curve=(0, -30, -20, 0), curveV=(20, 50, 70, 0),
            downAngle=(90, 62, 45, 45), downAngleV=(0, -30, 20, 10), rotate=(99.5, 137.5, 137.5, 137.5), rotateV=(15, 15, 15, 0),
            scale=scale, scaleV=0.8, ratio=0.03, taper=(1, 1, 1, 1), baseSize=0.32, baseSplits=2, splitAngle=(25, 20, 0, 0),
            splitAngleV=(5, 5, 0, 0), shape="1", leaves=leaves, leafScale=0.34, leafScaleX=0.7, leafDist="6", leafShape="rect",
            bevelRes=0, resU=1, attractUp=(0, 0.2, 0.3, 0.4))
        tr = bpy.data.objects["tree"]
        lv = bpy.data.objects["leaves"]
        for o in bpy.context.view_layer.objects:
            o.select_set(False)
        tr.select_set(True)
        bpy.context.view_layer.objects.active = tr
        bpy.ops.object.convert(target="MESH")
        tr = bpy.context.view_layer.objects.active
        tr.name = f"treetpl_{k}_trunk"
        lv.name = f"treetpl_{k}_leaves"
        lmw = lv.matrix_world.copy()
        lv.parent = None
        lv.matrix_world = lmw
        tr.data.materials.clear()
        tr.data.materials.append(bark)
        for p in tr.data.polygons:
            p.use_smooth = True
        lv.data.materials.clear()
        lv.data.materials.append(leaf)
        out.append((tr, lv))
    return out


def plant_trees(templates, spots):
    """spots : [(x, z, 크기), …] 게임 좌표. 줄기 둘레에 원기둥 충돌(COLC_)"""
    rnd = random.Random(5)
    for i, (x, z, s) in enumerate(spots):
        tr, lv = templates[i % len(templates)]
        rot = rnd.uniform(0, math.tau)
        for src, tag in ((tr, "trunk"), (lv, "leaves")):
            o = src.copy()              # 메시는 공유 (linked duplicate)
            o.name = f"tree_{i}_{tag}"
            COLL.objects.link(o)
            o.location = T(x, 0, z)
            o.rotation_euler = (0, 0, rot)
            o.scale = (s, s, s)
        colc(f"tree_{i}", x, z, 0.3 * s)
    for tr, lv in templates:
        tr.hide_render = True
        lv.hide_render = True
        COLL.objects.unlink(tr)
        COLL.objects.unlink(lv)
