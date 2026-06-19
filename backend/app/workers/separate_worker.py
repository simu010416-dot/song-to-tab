"""子进程：Demucs 音源分离。"""
from __future__ import annotations

import json
import sys


def main() -> None:
    payload = json.loads(sys.stdin.read() or "{}")
    input_path = payload.get("input_path")
    mode = payload.get("mode")
    if not input_path or not mode:
        print(
            json.dumps(
                {"ok": False, "error": "缺少 input_path 或 mode"},
                ensure_ascii=False,
            )
        )
        sys.exit(1)

    from app.separate import _run_separation_impl

    out_path, warning = _run_separation_impl(input_path, mode)
    if warning or not out_path:
        print(
            json.dumps(
                {"ok": False, "error": warning or "分离失败"},
                ensure_ascii=False,
            )
        )
        sys.exit(1)
    print(
        json.dumps(
            {"ok": True, "output_path": out_path},
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
