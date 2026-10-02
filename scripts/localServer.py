#!/usr/bin/env python3
"""
scripts/localServer.py — Mudanzas Tortuga, S.L.

A tiny static HTTP server for testing a built Vite site (normally ./dist)
without adding another runtime dependency. The default directory is the
repository's dist folder, even when launched from another working directory.
An explicit --directory is resolved relative to the current working directory.

Preferred normal workflow:
    npm run dev       # active development
    npm run preview   # preview Vite production build

Fallback/helper workflow:
    npm run build
    python scripts/localServer.py --directory dist --port 4173
    python scripts/localServer.py --base-path /repository/ --port 4173

--base-path mounts the built files below a URL prefix for project Pages checks.
Use --port 0 to ask the operating system to select an available port.

This script is NOT a production server.
"""

from __future__ import annotations

import argparse
import functools
import http.server
from pathlib import Path
import re
from typing import Sequence
from urllib.parse import unquote, urlsplit


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent


def normalize_base_path(value: str) -> str:
    """Accept a root or simple URL prefix and normalize its surrounding slashes."""
    prefix = value.strip().strip("/")
    if not prefix:
        return "/"

    segments = prefix.split("/")
    if any(
        segment in {".", ".."}
        or re.fullmatch(r"[A-Za-z0-9._~-]+", segment) is None
        for segment in segments
    ):
        raise argparse.ArgumentTypeError(
            "Base path must contain URL path segments such as /repository/; "
            "queries, fragments, traversal, and encoded characters are not allowed."
        )
    return f"/{prefix}/"


def parse_port(value: str) -> int:
    try:
        port = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("Port must be an integer.") from error
    if not 0 <= port <= 65535:
        raise argparse.ArgumentTypeError(
            "Port must be between 1 and 65535, or 0 for an available port."
        )
    return port


class NoCacheStaticHandler(http.server.SimpleHTTPRequestHandler):
    """Serve a directory at one URL mount with predictable browser asset types."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".svg": "image/svg+xml",
        ".wasm": "application/wasm",
    }

    def __init__(self, *args, directory=None, base_path="/", **kwargs):
        self.base_path = normalize_base_path(base_path)
        self.serve_root = Path(directory or Path.cwd()).resolve()
        super().__init__(*args, directory=str(self.serve_root), **kwargs)

    def mounted_path(self, request_path: str) -> str | None:
        """Strip only the configured prefix; preserve the public URL elsewhere."""
        url_path = urlsplit(request_path).path
        if not url_path.startswith(self.base_path):
            return None
        return "/" + url_path[len(self.base_path):]

    def translate_path(self, path: str) -> str:
        mounted = self.mounted_path(path)
        # send_head rejects outside requests before file access can happen.
        if mounted is None:
            return str(self.serve_root)
        return super().translate_path(mounted)

    def send_head(self):
        try:
            mounted = self.mounted_path(self.path)
            if mounted is None:
                self.send_error(404, "Request is outside the configured base path.")
                return None

            decoded = unquote(mounted, errors="strict")
            if (
                any(segment in {".", ".."} for segment in decoded.split("/"))
                or any(character in decoded for character in ("\\", "\x00", ":"))
            ):
                self.send_error(404, "Invalid static path.")
                return None

            resolved = Path(self.translate_path(self.path)).resolve()
            if not resolved.is_relative_to(self.serve_root):
                self.send_error(404, "Static path is outside the served directory.")
                return None
        except (OSError, ValueError, UnicodeError):
            self.send_error(404, "Invalid static path.")
            return None

        # Keep self.path intact so directory redirects retain the URL mount.
        return super().send_head()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve a static directory for local Mudanzas Tortuga testing."
    )
    parser.add_argument(
        "--directory",
        "-d",
        type=Path,
        default=REPOSITORY_ROOT / "dist",
        help="Directory to serve (default: repository dist; explicit paths use cwd).",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host/interface to bind (default: 127.0.0.1).",
    )
    parser.add_argument(
        "--port",
        "-p",
        type=parse_port,
        default=4173,
        help="TCP port (default: 4173; 0 selects an available port).",
    )
    parser.add_argument(
        "--base-path",
        type=normalize_base_path,
        default="/",
        help="URL mount, such as /repository/ (default: /).",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> None:
    args = parse_args(argv)
    directory = args.directory.resolve()

    if not directory.is_dir():
        raise SystemExit(
            f"Static directory does not exist: {directory}\n"
            "Build the project first (normally `npm run build`) or pass "
            "`--directory <path>`."
        )

    handler = functools.partial(
        NoCacheStaticHandler,
        directory=str(directory),
        base_path=args.base_path,
    )

    try:
        server = http.server.ThreadingHTTPServer((args.host, args.port), handler)
    except OSError as error:
        raise SystemExit(
            f"Cannot start the local server at {args.host}:{args.port}: {error}\n"
            "Choose another --port or check the --host interface."
        ) from error
    url_host = "localhost" if args.host in {"127.0.0.1", "0.0.0.0"} else args.host
    port = server.server_address[1]
    base_url = f"http://{url_host}:{port}{args.base_path}"

    print("Mudanzas Tortuga local static server")
    print(f"Serving: {directory}")
    print(f"URL:     {base_url}")
    print(f"Physics: {base_url}?mode=physics")
    print("Press Ctrl+C to stop.", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
