"""子进程：探测 Demucs / PyTorch 是否可加载。"""
from __future__ import annotations

import json
import sys


def main() -> None:
    _ = json.loads(sys.stdin.read() or "{}")
    from app.separate import _import_error

    err = _import_error()
    if err:
        print(json.dumps({"ok": False, "error": err}, ensure_ascii=False))
        sys.exit(1)
    print(json.dumps({"ok": True}, ensure_ascii=False))


if __name__ == "__main__":
    main()
