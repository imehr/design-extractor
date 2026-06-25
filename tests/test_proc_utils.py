"""Tests for proc_utils.run_capture — the deadlock-proof subprocess helper.

The regression these guard against: a child that spawns a grandchild which
inherits the capture pipe and outlives a timeout. The stdlib
subprocess.run(capture_output=True, timeout=T) deadlocks in that case because
its post-kill drain waits forever for the grandchild to close the pipe. Every
extraction hit this in the validation phase (agent-browser -> headless Chrome).
"""

import importlib.util
import sys
import time
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


def _load_proc_utils():
    spec = importlib.util.spec_from_file_location("proc_utils", SCRIPTS / "proc_utils.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_run_capture_returns_output_and_zero_returncode():
    mod = _load_proc_utils()
    result = mod.run_capture([sys.executable, "-c", "print('hello')"], timeout=10)
    assert result.returncode == 0
    assert "hello" in result.stdout


def test_run_capture_does_not_deadlock_on_pipe_holding_grandchild():
    """The core regression test.

    Child spawns a grandchild that inherits stdout and sleeps far past the
    timeout, then the child itself sleeps. With the stdlib this hangs forever;
    run_capture must kill the whole group and return within timeout + drain.
    """
    mod = _load_proc_utils()
    # Grandchild keeps the inherited stdout fd open for 60s; parent sleeps 60s too.
    program = (
        "import subprocess, sys, time;"
        "subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)']);"
        "time.sleep(60)"
    )
    start = time.monotonic()
    result = mod.run_capture([sys.executable, "-c", program], timeout=2, drain_timeout=3)
    elapsed = time.monotonic() - start

    assert result.returncode == -1, "timeout path should report returncode -1"
    # Must return well within timeout(2) + drain(3) + slack, never the 60s sleep.
    assert elapsed < 12, f"run_capture took {elapsed:.1f}s — it deadlocked on the grandchild"


def test_run_capture_kills_grandchild_process():
    """After a timeout, the grandchild must be dead (group SIGKILL), not orphaned."""
    mod = _load_proc_utils()
    marker = Path(__file__).resolve().parent / "_grandchild_alive.tmp"
    if marker.exists():
        marker.unlink()
    # Grandchild writes a marker, then would re-write it after a long sleep.
    # If group-kill worked, the second write never happens.
    grandchild = (
        "import time, pathlib;"
        f"p = pathlib.Path(r'{marker}');"
        "time.sleep(30);"
        "p.write_text('grandchild survived')"
    )
    program = (
        "import subprocess, sys, time;"
        f"subprocess.Popen([sys.executable, '-c', {grandchild!r}]);"
        "time.sleep(30)"
    )
    mod.run_capture([sys.executable, "-c", program], timeout=2, drain_timeout=3)
    # Give any surviving grandchild a moment to (wrongly) write its marker.
    time.sleep(4)
    survived = marker.exists()
    if marker.exists():
        marker.unlink()
    assert not survived, "grandchild outlived the group SIGKILL"
