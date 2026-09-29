"""
test_helpers.py
Utility fixtures, runner helpers, and mock servers for Chef Specials AI E2E Tests.
Pure Python standard library implementation.
"""

import contextlib
import http.server
import json
import os
import socket
import subprocess
import sys
import threading
import time

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def is_strict_mode():
    """Returns True if strict mode is enabled via environment variable."""
    return os.environ.get("STRICT_E2E", "0") in ("1", "true", "True", "yes")

def skip_or_fail(test_case, feature_name, file_path):
    """
    Progressive Testability helper:
    In strict mode (Milestone 5 Acceptance), missing artifacts fail the test.
    In progressive mode (Milestone Development), pending artifacts trigger a skipTest.
    """
    if is_strict_mode():
        test_case.fail(f"Required artifact '{file_path}' for feature '{feature_name}' is missing.")
    else:
        test_case.skipTest(f"Feature '{feature_name}' pending implementation ({file_path} not found).")

def run_cmd(cmd, env=None, cwd=REPO_ROOT, timeout=20):
    """
    Executes a shell or CLI command with explicit timeout and environment.
    Returns (returncode, stdout, stderr).
    """
    run_env = os.environ.copy()
    if env:
        run_env.update(env)
    
    # Ensure stdout/stderr decoding doesn't throw UnicodeDecodeError
    proc = subprocess.Popen(
        cmd,
        shell=isinstance(cmd, str),
        cwd=cwd,
        env=run_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    try:
        stdout, stderr = proc.communicate(timeout=timeout)
        return proc.returncode, stdout, stderr
    except subprocess.TimeoutExpired:
        proc.kill()
        stdout, stderr = proc.communicate()
        return -1, stdout, stderr + f"\nCommand timed out after {timeout} seconds"

def invoke_node_serverless(body=None, method="POST", headers=None, env_vars=None):
    """
    Directly invokes api/generate-image.js in a hermetic Node.js runtime environment.
    Returns dict: {"status": int, "headers": dict, "body": dict|str, "error": str|None}
    """
    handler_path = os.path.join(REPO_ROOT, "api", "generate-image.js")
    if not os.path.exists(handler_path):
        return {"status": -1, "headers": {}, "body": None, "error": "api/generate-image.js not found"}

    default_headers = {"content-type": "application/json"}
    req_headers = headers if headers is not None else default_headers
    headers_json = json.dumps(req_headers)
    body_expr = "undefined" if body is None else json.dumps(body)

    inline_script = f"""
    const handler = require({json.dumps(handler_path)});
    const req = {{
      method: {json.dumps(method)},
      headers: {headers_json},
      body: {body_expr}
    }};
    const res = {{
      statusCode: 200,
      headers: {{}},
      body: null,
      status(c) {{ this.statusCode = c; return this; }},
      setHeader(k, v) {{ this.headers[k] = v; return this; }},
      json(d) {{ this.body = d; return this; }},
      end() {{ return this; }}
    }};
    handler(req, res).then(() => {{
      console.log(JSON.stringify({{
        status: res.statusCode,
        headers: res.headers,
        body: res.body
      }}));
    }}).catch(err => {{
      console.log(JSON.stringify({{
        status: 500,
        headers: {{}},
        body: null,
        error: String(err && err.message ? err.message : err)
      }}));
    }});
    """

    env = os.environ.copy()
    if env_vars:
        env.update(env_vars)

    proc = subprocess.run(
        ["node", "-e", inline_script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=10
    )
    if proc.returncode != 0:
        return {
            "status": 500,
            "headers": {},
            "body": None,
            "error": proc.stderr or proc.stdout
        }

    try:
        return json.loads(proc.stdout.strip())
    except Exception as e:
        return {
            "status": 500,
            "headers": {},
            "body": None,
            "error": f"JSON decode failed on output: {proc.stdout} ({e})"
        }

class MockServerlessApiHandler(http.server.BaseHTTPRequestHandler):
    """
    Mock HTTP Server simulating the live Vercel production endpoint:
    - GET /: 200 text/html with <title>Chef Specials AI</title>
    - GET /styles.css: 200 text/css
    - GET /app.js: 200 application/javascript
    - OPTIONS /api/generate-image: 200 with CORS headers
    - GET /api/generate-image: 405 Method Not Allowed
    - POST /api/generate-image (empty): 400 Bad Request
    - POST /api/generate-image (with prompt): 200 OK (with setupNeeded: true or imageUrl)
    """

    def log_message(self, format, *args):
        # Silence default stderr logging during test execution
        pass

    def do_OPTIONS(self):
        if self.path.startswith("/api/generate-image"):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Content-Length", "0")
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            content = b"<!DOCTYPE html><html><head><title>Chef Specials AI</title><link rel=\"stylesheet\" href=\"styles.css\"></head><body><div class='app-shell'></div><script src=\"app.js\"></script></body></html>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Server", "Vercel")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        elif self.path == "/styles.css":
            content = b"/* styles */ body { margin: 0; }"
            self.send_response(200)
            self.send_header("Content-Type", "text/css; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        elif self.path == "/app.js":
            content = b"/* app */ console.log('Chef Specials AI ready');"
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        elif self.path.startswith("/api/generate-image"):
            # GET on API is rejected with 405
            body = json.dumps({"error": "Method not allowed"}).encode("utf-8")
            self.send_response(405)
            self.send_header("Content-Type", "application/json")
            self.send_header("Allow", "POST, OPTIONS")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path.startswith("/api/generate-image"):
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b""
            try:
                parsed = json.loads(raw_body.decode("utf-8")) if raw_body else {}
            except Exception:
                parsed = {}

            prompt = parsed.get("prompt") or parsed.get("dishName")
            if not prompt or str(prompt).strip() == "":
                body = json.dumps({"error": "Prompt or dishName is required."}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                body = json.dumps({
                    "setupNeeded": True,
                    "message": "OpenAI image generation is ready, but the OpenAI key is not configured in this Vercel project."
                }).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()


class MockStaleProductionHandler(http.server.BaseHTTPRequestHandler):
    """
    Mock HTTP Server simulating the live Vercel production bug (stale deployment):
    - GET /: 200 text/html
    - GET /styles.css, /app.js: 200
    - ANY request to /api/*: 404 NOT_FOUND with header x-vercel-error: NOT_FOUND
    """

    def log_message(self, format, *args):
        pass

    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.send_response(404)
            self.send_header("x-vercel-error", "NOT_FOUND")
            self.end_headers()
            self.wfile.write(b"NOT_FOUND")
        else:
            self.send_response(200)
            self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            content = b"<!DOCTYPE html><html><head><title>Chef Specials AI</title></head><body></body></html>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        elif self.path in ("/styles.css", "/app.js"):
            self.send_response(200)
            self.send_header("Content-Type", "text/css" if "css" in self.path else "application/javascript")
            self.end_headers()
            self.wfile.write(b"/* content */")
        elif self.path.startswith("/api/"):
            self.send_response(404)
            self.send_header("x-vercel-error", "NOT_FOUND")
            self.end_headers()
            self.wfile.write(b"NOT_FOUND")
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path.startswith("/api/"):
            self.send_response(404)
            self.send_header("x-vercel-error", "NOT_FOUND")
            self.end_headers()
            self.wfile.write(b"NOT_FOUND")
        else:
            self.send_response(404)
            self.end_headers()


@contextlib.contextmanager
def run_mock_http_server(handler_cls=MockServerlessApiHandler):
    """
    Context manager that starts an HTTP server on a random free local port,
    yields the base URL (http://127.0.0.1:<port>), and terminates cleanly on exit.
    """
    server = http.server.HTTPServer(("127.0.0.1", 0), handler_cls)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{port}"
    try:
        yield base_url
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
