"""子进程：探测 basic-pitch 是否可 import。"""
from __future__ import annotations

import json
import sys


def main() -> None:
    _ = json.loads(sys.stdin.read() or "{}")
    try:
        import basic_pitch  # noqa: F401
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        sys.exit(1)
    print(json.dumps({"ok": True}, ensure_ascii=False))


if __name__ == "__main__":
    main()
