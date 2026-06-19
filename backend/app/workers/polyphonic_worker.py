"""子进程：basic-pitch 多声部识别。"""
from __future__ import annotations

import json
import sys


def main() -> None:
    payload = json.loads(sys.stdin.read() or "{}")
    input_path = payload.get("input_path")
    if not input_path:
        print(
            json.dumps(
                {"ok": False, "error": "缺少 input_path"},
                ensure_ascii=False,
            )
        )
        sys.exit(1)

    from app.transcribe import _detect_polyphonic_impl

    notes = _detect_polyphonic_impl(input_path)
    if notes is None:
        print(
            json.dumps(
                {"ok": False, "error": "basic-pitch 识别失败"},
                ensure_ascii=False,
            )
        )
        sys.exit(1)

    serialized = [
        {
            "midi": n.midi,
            "start": n.start,
            "end": n.end,
            "velocity": n.velocity,
        }
        for n in notes
    ]
    print(json.dumps({"ok": True, "notes": serialized}, ensure_ascii=False))


if __name__ == "__main__":
    main()
