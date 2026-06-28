#!/usr/bin/env python3
"""Run a CLI command under a real PTY.

Agentic CLIs (opencode/kimi/claude/codex) block when spawned from Node without
a controlling terminal — they only converge interactively. This helper forks
the command under a pseudo-terminal (Python's stdlib ``pty``), so the child
behaves as if attached to a real terminal, while the Node parent reads the
output as plain stdout. No third-party dependencies.

Usage:
    run_cli_with_pty.py [--cwd DIR] [--timeout SECS] -- <command> [args...]

Prints the child's combined output to stdout and exits with the child's code
(or 1 on timeout).
"""
from __future__ import annotations

import argparse
import os
import select
import signal
import sys
import time


def run(command: str, argv: list[str], cwd: str | None, timeout: float) -> int:
    pid, fd = pty_fork(cwd)
    if pid == 0:
        # child
        os.environ.setdefault("TERM", "xterm-256color")
        try:
            os.execvp(command, argv)
        except Exception as exc:  # noqa: BLE001
            sys.stderr.write(f"[pty-runner] exec failed: {exc}\n")
            os._exit(127)

    deadline = time.time() + timeout
    status_code = 1
    while True:
        if time.time() > deadline:
            try:
                os.kill(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            sys.stdout.write("\n[pty-runner] timed out\n")
            break
        try:
            readable, _, _ = select.select([fd], [], [], 1.0)
        except (OSError, ValueError):
            break
        if readable:
            try:
                data = os.read(fd, 4096)
            except OSError:
                break
            if not data:
                break
            sys.stdout.buffer.write(data)
            sys.stdout.buffer.flush()
        # reap if the child has exited, then drain remaining output
        try:
            waited, status = os.waitpid(pid, os.WNOHANG)
        except ChildProcessError:
            break
        if waited == pid:
            while True:
                try:
                    more, _, _ = select.select([fd], [], [], 0.3)
                except (OSError, ValueError):
                    break
                if not more:
                    break
                try:
                    data = os.read(fd, 4096)
                except OSError:
                    break
                if not data:
                    break
                sys.stdout.buffer.write(data)
                sys.stdout.buffer.flush()
            if os.WIFEXITED(status):
                status_code = os.WEXITSTATUS(status)
            elif os.WIFSIGNALED(status):
                status_code = 128 + os.WTERMSIG(status)
            break
    try:
        os.close(fd)
    except OSError:
        pass
    try:
        os.waitpid(pid, 0)
    except ChildProcessError:
        pass
    return status_code


def pty_fork(cwd: str | None):
    import pty

    if cwd:
        return pty.fork() if _chdir_ok(cwd) else _fork_nochdir(cwd)
    return pty.fork()


def _chdir_ok(cwd: str) -> bool:
    try:
        os.chdir(cwd)
        return True
    except OSError:
        return False


def _fork_nochdir(_cwd: str):
    # cwd was unusable; let the child fail loudly instead of hanging
    import pty

    return pty.fork()


def main() -> int:
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument("--cwd", default=None)
    ap.add_argument("--timeout", type=float, default=180.0)
    parsed, rest = ap.parse_known_args()
    if "--" in rest:
        rest = rest[rest.index("--") + 1:]
    if not rest:
        sys.stderr.write("[pty-runner] no command provided\n")
        return 2
    return run(rest[0], rest, parsed.cwd, parsed.timeout)


if __name__ == "__main__":
    raise SystemExit(main())
