import http.server, os, socketserver, functools

ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/':
            super().do_GET()
            return
        local = os.path.normpath(os.path.join(ROOT, path.lstrip('/')))
        if os.path.isfile(local):
            super().do_GET()
            return
        last = path.rstrip('/').rsplit('/', 1)[-1]
        if '.' in last:
            self.send_error(404)
            return
        self.path = '/index.html'
        super().do_GET()

with socketserver.ThreadingTCPServer(('', 3456), Handler) as httpd:
    print('SPA server on :3456')
    httpd.serve_forever()
