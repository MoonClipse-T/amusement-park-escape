"""개발용 서버 : web/ 을 http://localhost:8000 으로 연다. 캐시를 끄므로 파일을 고치고 새로고침하면 바로 반영된다.
   사용 : python tools/serve.py
"""
import functools, http.server, pathlib


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


web = pathlib.Path(__file__).resolve().parent.parent / "web"
http.server.ThreadingHTTPServer(("", 8000), functools.partial(NoCache, directory=str(web))).serve_forever()
