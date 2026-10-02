"""GLB 줄이기 (glTF-Transform) : 중복 제거 → 정점 양자화(KHR_mesh_quantization) → 텍스처 최대 1024px → WebP
   ※ prune 은 쓰지 않는다 — 엔진이 읽는 빈 표식 노드(SIGN_ · ZONE_ · LAMP_ · SPAWN_ …)까지 지워 버린다.
   사용 : python tools/optimize_glb.py web/assets/park.glb [다른 파일 …]   (Node.js 의 npx 필요)
"""
import subprocess, sys, os, shutil, tempfile

CLI = [shutil.which("npx") or "npx", "--yes", "@gltf-transform/cli@4"]


def run(*args):
    subprocess.run(CLI + list(args), check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def optimize(path, tex=1024):
    before = os.path.getsize(path)
    with tempfile.TemporaryDirectory() as d:
        a, b, c, e = (os.path.join(d, n) for n in ("a.glb", "b.glb", "c.glb", "e.glb"))
        run("dedup", path, a)
        run("quantize", a, b)
        run("resize", b, c, "--width", str(tex), "--height", str(tex))
        run("webp", c, e)
        shutil.copy(e, path)
    print(f"{path}: {before // 1024} KB → {os.path.getsize(path) // 1024} KB")


if __name__ == "__main__":
    if shutil.which("npx") is None:
        sys.exit("npx(Node.js)가 없어서 건너뜀 — 압축 없이도 게임은 동작한다")
    for p in sys.argv[1:]:
        optimize(p)
