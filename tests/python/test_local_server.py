"""Standard-library tests for the production-build preview helper."""

from contextlib import contextmanager, redirect_stderr
from functools import partial
import http.client
import http.server
import importlib.util
import io
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import threading
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPOSITORY_ROOT / "scripts" / "localServer.py"
SPEC = importlib.util.spec_from_file_location("local_server", SCRIPT_PATH)
assert SPEC is not None and SPEC.loader is not None
local_server = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(local_server)


class QuietHandler(local_server.NoCacheStaticHandler):
    def log_message(self, _format, *args):
        pass


@contextmanager
def running_server(directory: Path, base_path: str = "/"):
    handler = partial(QuietHandler, directory=directory, base_path=base_path)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_address[1]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def request(port: int, path: str, method: str = "GET"):
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
    try:
        connection.request(method, path)
        response = connection.getresponse()
        return response.status, response.headers, response.read()
    finally:
        connection.close()


class LocalServerTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.site = self.root / "site"
        self.assets = self.site / "assets"
        self.assets.mkdir(parents=True)
        (self.site / "index.html").write_text("<h1>Physics playground</h1>", encoding="utf-8")
        (self.assets / "game.js").write_text("export const ready = true;", encoding="utf-8")
        (self.assets / "turtle.svg").write_text("<svg></svg>", encoding="utf-8")
        (self.assets / "rapier.wasm").write_bytes(b"\x00asm\x01\x00\x00\x00")
        (self.root / "outside.txt").write_text("outside served directory", encoding="utf-8")

    def test_root_and_subpath_serve_browser_assets_and_query(self):
        for base_path in ("/", "/repository/", "/nested/repository/"):
            with self.subTest(base_path=base_path), running_server(self.site, base_path) as port:
                for suffix, expected_type, expected_body in (
                    ("?mode=physics&return=/elsewhere/", "text/html", b"Physics playground"),
                    ("assets/game.js?v=1", "text/javascript", b"export const ready"),
                    ("assets/turtle.svg", "image/svg+xml", b"<svg>"),
                    ("assets/rapier.wasm", "application/wasm", b"\x00asm"),
                ):
                    with self.subTest(asset=suffix):
                        status, headers, body = request(port, base_path + suffix)
                        self.assertEqual(status, 200)
                        self.assertEqual(headers["Content-Type"].split(";")[0], expected_type)
                        self.assertIn(expected_body, body)
                        self.assertIn("no-store", headers["Cache-Control"])

    def test_head_and_directory_redirect_preserve_subpath(self):
        with running_server(self.site, "/repository/") as port:
            status, headers, body = request(port, "/repository/?mode=physics", "HEAD")
            self.assertEqual(status, 200)
            self.assertGreater(int(headers["Content-Length"]), 0)
            self.assertEqual(body, b"")
            status, headers, _ = request(port, "/repository/assets?view=all")
            self.assertEqual(status, 301)
            self.assertEqual(headers["Location"], "/repository/assets/?view=all")

    def test_requests_outside_exact_mount_are_not_served(self):
        with running_server(self.site, "/repository/") as port:
            for path in (
                "/", "/assets/game.js", "/repository", "/repository-other/index.html",
                "/repository%2findex.html",
            ):
                with self.subTest(path=path):
                    status, headers, _ = request(port, path)
                    self.assertEqual(status, 404)
                    self.assertIn("no-store", headers["Cache-Control"])

    def test_missing_assets_do_not_fall_back_to_index(self):
        with running_server(self.site, "/repository/") as port:
            status, _, body = request(port, "/repository/assets/missing.js?mode=physics")
            self.assertEqual(status, 404)
            self.assertNotIn(b"Physics playground", body)

    def test_traversal_cannot_leave_served_directory(self):
        for base_path in ("/", "/repository/"):
            with self.subTest(base_path=base_path), running_server(self.site, base_path) as port:
                for suffix in (
                    "../outside.txt", "%2e%2e/outside.txt", "assets/../../outside.txt",
                    "assets/%2e%2e/%2e%2e/outside.txt", "..%5coutside.txt",
                    "%00outside.txt", "C:%5coutside.txt", "%ff",
                ):
                    with self.subTest(path=suffix):
                        status, _, body = request(port, base_path + suffix)
                        self.assertEqual(status, 404)
                        self.assertNotIn(b"outside served directory", body)

    def test_symlink_cannot_expose_file_outside_directory(self):
        try:
            (self.site / "escape.txt").symlink_to(self.root / "outside.txt")
        except (OSError, NotImplementedError):
            self.skipTest("Symlink creation is unavailable for this account/platform.")
        with running_server(self.site) as port:
            status, _, body = request(port, "/escape.txt")
            self.assertEqual(status, 404)
            self.assertNotIn(b"outside served directory", body)

    def test_default_directory_is_repo_relative_and_explicit_directory_uses_cwd(self):
        previous_cwd = Path.cwd()
        os.chdir(self.root)
        try:
            default_args = local_server.parse_args([])
            explicit_args = local_server.parse_args(["--directory", "site"])
            self.assertEqual(default_args.directory.resolve(), REPOSITORY_ROOT / "dist")
            self.assertEqual(explicit_args.directory.resolve(), self.site)
            self.assertEqual(default_args.host, "127.0.0.1")
            self.assertEqual(default_args.port, 4173)
            self.assertEqual(default_args.base_path, "/")
        finally:
            os.chdir(previous_cwd)

    def test_base_path_normalization_and_ephemeral_port(self):
        for value, normalized in (("/", "/"), ("", "/"), ("repository", "/repository/"),
                                  ("/repository", "/repository/"), ("/nested/repo/", "/nested/repo/")):
            with self.subTest(value=value):
                args = local_server.parse_args(["--base-path", value, "--port", "0"])
                self.assertEqual(args.base_path, normalized)
                self.assertEqual(args.port, 0)

    def test_invalid_ports_and_base_paths_are_parse_errors(self):
        for arguments in (
            ["--port", "-1"], ["--port", "65536"], ["--port", "words"],
            ["--base-path", "/../"], ["--base-path", "/repo?mode=physics"],
            ["--base-path", "/repo#fragment"], ["--base-path", "/repo//nested/"],
            ["--base-path", "/repo%2f/"], ["--base-path", "/repo\\nested/"],
        ):
            with self.subTest(arguments=arguments), redirect_stderr(io.StringIO()) as error_output:
                with self.assertRaises(SystemExit) as raised:
                    local_server.parse_args(arguments)
                self.assertEqual(raised.exception.code, 2)
                self.assertIn("error:", error_output.getvalue())

    def test_missing_directory_reports_build_instructions(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--directory", str(self.root / "missing")],
            capture_output=True, text=True, timeout=5,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Static directory does not exist", result.stderr)
        self.assertIn("npm run build", result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_bind_failure_is_descriptive(self):
        # Windows permits overlapping SO_REUSEADDR listeners; claim the port
        # exclusively so this exercises an actual bind failure on every OS.
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as occupied:
            if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                occupied.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            occupied.bind(("127.0.0.1", 0))
            occupied.listen()
            port = occupied.getsockname()[1]
            result = subprocess.run(
                [sys.executable, str(SCRIPT_PATH), "--directory", str(self.site), "--port", str(port)],
                capture_output=True, text=True, timeout=5,
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Cannot start the local server", result.stderr)
        self.assertIn("Choose another --port", result.stderr)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
