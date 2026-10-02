#!/usr/bin/env python3
"""
scripts/localServer.py — Mudanzas Tortuga, S.L.

PLACEHOLDER / bootstrap helper.

A tiny static HTTP server for testing a built Vite site (normally ./dist)
without adding another runtime dependency. It is intentionally simple and may
be replaced or expanded later if the project needs special headers, route
fallbacks, cross-origin isolation, caching controls, or other behavior.

Preferred normal workflow:
    npm run dev       # active development
    npm run preview   # preview Vite production build

Fallback/helper workflow:
    npm run build
    python scripts/localServer.py --directory dist --port 4173

This script is NOT a production server.
"""

from __future__ import annotations

import argparse
import functools
import http.server
import mimetypes
from pathlib import Path


class NoCacheStaticHandler(http.server.SimpleHTTPRequestHandler):
    """Static handler with development-friendly no-cache headers."""

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve a static directory for local Mudanzas Tortuga testing."
    )
    parser.add_argument(
        "--directory",
        "-d",
        default="dist",
        help="Directory to serve (default: dist).",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host/interface to bind (default: 127.0.0.1).",
    )
    parser.add_argument(
        "--port",
        "-p",
        type=int,
        default=4173,
        help="TCP port (default: 4173).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    directory = Path(args.directory).resolve()

    if not directory.is_dir():
        raise SystemExit(
            f"Static directory does not exist: {directory}\n"
            "Build the project first (normally `npm run build`) or pass "
            "`--directory <path>`."
        )

    # Modern Python normally knows application/wasm, but make the intended
    # behavior explicit for environments whose MIME database is incomplete.
    mimetypes.add_type("application/wasm", ".wasm")

    handler = functools.partial(
        NoCacheStaticHandler,
        directory=str(directory),
    )

    server = http.server.ThreadingHTTPServer((args.host, args.port), handler)
    url_host = "localhost" if args.host in {"127.0.0.1", "0.0.0.0"} else args.host

    print("Mudanzas Tortuga local static server (PLACEHOLDER)")
    print(f"Serving: {directory}")
    print(f"URL:     http://{url_host}:{args.port}/")
    print(f"Physics: http://{url_host}:{args.port}/?mode=physics")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
