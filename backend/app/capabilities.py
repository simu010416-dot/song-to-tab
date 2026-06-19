"""可选能力探测：Demucs 与 basic-pitch 完全独立，带 TTL 缓存。"""
from __future__ import annotations

import importlib.util
import time
from typing import Optional, Tuple

from . import isolated

_separate_cache: Optional[Tuple[bool, Optional[str], float]] = None
_advanced_cache: Optional[Tuple[bool, Optional[str], float]] = None


def _cache_ttl() -> int:
    return isolated.env_int("SONG_TO_TAB_CAPABILITY_CACHE_TTL", 300)


def _probe_timeout() -> int:
    return isolated.env_int("SONG_TO_TAB_WORKER_TIMEOUT_PROBE", 120)


def clear_capability_cache() -> None:
    global _separate_cache, _advanced_cache
    _separate_cache = None
    _advanced_cache = None


def _package_installed(name: str) -> bool:
    try:
        return importlib.util.find_spec(name) is not None
    except Exception:
        return False


def _read_cache(
    entry: Optional[Tuple[bool, Optional[str], float]],
) -> Optional[Tuple[bool, Optional[str]]]:
    if entry is None:
        return None
    ok, reason, ts = entry
    if time.time() - ts > _cache_ttl():
        return None
    return ok, reason


def _probe_separate_isolated() -> Tuple[bool, Optional[str]]:
    if not _package_installed("demucs"):
        return False, "未安装 demucs"

    if isolated.should_isolate():
        result = isolated.run_worker("probe_separate", {}, timeout=_probe_timeout())
        if result.get("ok"):
            return True, None
        return False, result.get("error") or "Demucs 依赖不可用"

    from .separate import _import_error

    err = _import_error()
    if err:
        return False, err
    return True, None


def _probe_advanced_isolated() -> Tuple[bool, Optional[str]]:
    if not _package_installed("basic_pitch"):
        return False, "未安装 basic-pitch"

    if isolated.should_isolate():
        result = isolated.run_worker("probe_advanced", {}, timeout=_probe_timeout())
        if result.get("ok"):
            return True, None
        return False, result.get("error") or "basic-pitch 不可用"

    try:
        import basic_pitch  # noqa: F401

        return True, None
    except Exception as exc:
        return False, str(exc)


def separate_available() -> bool:
    global _separate_cache
    cached = _read_cache(_separate_cache)
    if cached is not None:
        return cached[0]

    ok, reason = _probe_separate_isolated()
    _separate_cache = (ok, reason, time.time())
    return ok


def separate_unavailable_reason() -> Optional[str]:
    if separate_available():
        return None
    cached = _read_cache(_separate_cache)
    if cached and cached[1]:
        return f"人声分离不可用：{cached[1]}"
    return "人声分离不可用"


def advanced_available() -> bool:
    global _advanced_cache
    cached = _read_cache(_advanced_cache)
    if cached is not None:
        return cached[0]

    ok, reason = _probe_advanced_isolated()
    _advanced_cache = (ok, reason, time.time())
    return ok


def advanced_unavailable_reason() -> Optional[str]:
    if advanced_available():
        return None
    cached = _read_cache(_advanced_cache)
    if cached and cached[1]:
        return f"进阶引擎不可用：{cached[1]}"
    return "进阶引擎不可用"
