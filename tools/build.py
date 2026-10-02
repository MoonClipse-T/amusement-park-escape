"""web/ 폴더를 하나의 HTML 파일(dist/lunaland.html)로 묶는다.
   - style.css, vendor/*.js, game.js 를 문서 안에 넣고
   - assets/ 의 park.glb · sky.jpg 를 base64 로 넣어서 서버 없이 더블클릭으로 열 수 있게 한다.
   사용 : python tools/build.py
"""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB, DIST = ROOT / "web", ROOT / "dist"
ASSETS = {"park": "park.glb", "sky": "sky.jpg", "people_michelle": "people_michelle.glb", "people_rpm": "people_rpm.glb", "people_anims": "people_anims.glb"}

def read(p): return (WEB / p).read_text(encoding="utf-8")

html = read("index.html")
html = html.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + read("style.css") + "</style>")
for src in re.findall(r'<script src="([^"]+)"></script>', html):
    body = read(src).replace("</script", "<\\/script")
    html = html.replace(f'<script src="{src}"></script>', "<script>" + body + "</script>")
parts = ",".join(f'{k}:"{base64.b64encode((WEB / "assets" / f).read_bytes()).decode()}"' for k, f in ASSETS.items())
html = html.replace("<!--ASSETS-->", "<script>const ASSETS={" + parts + "};</script>")

DIST.mkdir(exist_ok=True)
out = DIST / "lunaland.html"
out.write_text(html, encoding="utf-8")
print(f"{out.relative_to(ROOT)}  {out.stat().st_size/1e6:.1f} MB")
