"""Subprocess helpers that do not deadlock on grandchild processes.

The standard library's ``subprocess.run(capture_output=True, timeout=T)`` is
unsafe for any command that spawns its own children. On timeout CPython kills
*only the direct child*, then calls ``communicate()`` a second time **with no
timeout** to drain the pipes. If a grandchild survived the kill — e.g. the
headless Chrome that ``agent-browser`` launches — it still holds the write end
of the capture pipe, so EOF never arrives and the parent blocks forever. This
is the root cause of extractions wedging in the validation phase: the
``agent-browser`` CLI is killed on timeout but its Chrome lingers, and the
unbounded drain hangs the whole pipeline.

``run_capture`` fixes this by:

1. Spawning the child in its own session/process group (``start_new_session``)
   so the child *and every descendant* share one process-group id.
2. Killing the whole group with ``SIGKILL`` on timeout — Chrome included.
3. Draining with a *bounded* second wait, so even a grandchild that escaped the
   group into its own session can never wedge the caller. Worst-case latency is
   ``timeout + drain_timeout``, never unbounded.
"""

from __future__ import annotations

import os
import signal
import subprocess
from pathlib import Path


def _decode(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", "replace")
    return value


def _kill_group(proc: "subprocess.Popen", sig: int) -> None:
    """Signal the child's entire process group, falling back to the child."""
    try:
        os.killpg(os.getpgid(proc.pid), sig)
    except (ProcessLookupError, PermissionError):
        # Group already gone, or we cannot signal it — try the child directly.
        try:
            proc.send_signal(sig)
        except (ProcessLookupError, ValueError):
            pass


def _force_close(proc: "subprocess.Popen") -> None:
    for stream in (proc.stdout, proc.stderr):
        try:
            if stream is not None:
                stream.close()
        except OSError:
            pass


def run_capture(
    cmd,
    *,
    timeout: float = 60.0,
    cwd: str | Path | None = None,
    text: bool = True,
    drain_timeout: float = 5.0,
) -> subprocess.CompletedProcess:
    """Run ``cmd`` capturing stdout/stderr, killing the whole process group on timeout.

    Returns a ``CompletedProcess``. On timeout the returncode is ``-1`` and
    stdout/stderr contain whatever was captured before the kill. This call never
    blocks longer than ``timeout + drain_timeout`` regardless of how the child's
    descendants behave — that bound is the entire point of this helper.
    """
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=text,
        cwd=str(cwd) if cwd is not None else None,
        start_new_session=True,  # child becomes its own process-group leader
    )
    try:
        out, err = proc.communicate(timeout=timeout)
        return subprocess.CompletedProcess(cmd, proc.returncode, out, err)
    except subprocess.TimeoutExpired:
        _kill_group(proc, signal.SIGKILL)
        try:
            out, err = proc.communicate(timeout=drain_timeout)
        except subprocess.TimeoutExpired:
            # A descendant escaped the process group and still holds the pipe.
            # Stop waiting and detach rather than hang the caller forever.
            _force_close(proc)
            out, err = "", ""
        return subprocess.CompletedProcess(cmd, -1, out or "", err or "")
    except FileNotFoundError:
        raise


def kill_process_group(pid: int, sig: int = signal.SIGKILL) -> None:
    """Best-effort kill of a process group by pid (used for orphan cleanup)."""
    try:
        os.killpg(os.getpgid(pid), sig)
    except (ProcessLookupError, PermissionError, OSError):
        pass
