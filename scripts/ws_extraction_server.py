#!/usr/bin/env python3
"""WebSocket server for real-time design system extraction."""

from __future__ import annotations

import asyncio
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import websockets

REPO_ROOT = Path(__file__).resolve().parent.parent
PORT = 8765

_active_job: ExtractionJob | None = None
_connected_clients: set = set()


def url_to_slug(url: str) -> str:
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    domain = re.sub(r"^www\.", "", domain)
    return re.sub(r"[^a-z0-9]+", "-", domain.lower()).strip("-")


class ExtractionJob:
    def __init__(
        self,
        url: str,
        brand_name: str,
        max_pages: int,
        ws,
        start_from: str = "A",
    ):
        self.url = url
        self.brand_name = brand_name
        self.slug = url_to_slug(url) if url else ""
        self.max_pages = max_pages
        self.ws = ws
        self.cancelled = False
        self.current_phase: str | None = None
        self.current_agent: str | None = None
        self.current_proc: asyncio.subprocess.Process | None = None
        self.completed_agents: list[str] = []
        self.feedback_messages: list[str] = []
        self.start_time = time.time()
        self.failed_phases: list[str] = []
        self.completed_phases: list[str] = []
        self.start_from = start_from

    def _job_state_dir(self) -> Path:
        return Path.home() / ".claude" / "design-library" / "cache" / self.slug / "jobs"

    def _save_job_state(self, phase: str, status: str):
        state = {
            "url": self.url,
            "brand_name": self.brand_name,
            "slug": self.slug,
            "max_pages": self.max_pages,
            "current_phase": phase,
            "status": status,
            "failed_phases": self.failed_phases,
            "completed_phases": self.completed_phases,
            "timestamp": time.time(),
        }
        job_dir = self._job_state_dir()
        job_dir.mkdir(parents=True, exist_ok=True)
        (job_dir / f"{int(time.time())}.json").write_text(json.dumps(state, indent=2))

    async def _emit(self, event: dict):
        payload = json.dumps(event)
        targets = set(_connected_clients)
        if self.ws:
            targets.add(self.ws)
        closed = set()
        for ws in targets:
            try:
                if ws.open:
                    await ws.send(payload)
            except Exception:
                closed.add(ws)
        _connected_clients -= closed

    async def stream_subprocess(
        self, cmd: list[str], agent: str, cwd: Path | None = None
    ) -> tuple[bool, str]:
        self.current_agent = agent
        await self._emit(
            {"type": "agent_started", "agent": agent, "phase": self.current_phase}
        )

        start = time.time()
        try:
            self.current_proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=cwd or REPO_ROOT,
            )

            output_lines: list[str] = []
            is_claude = "claude" in cmd[0] if cmd else False

            while True:
                if self.cancelled:
                    try:
                        self.current_proc.kill()
                    except ProcessLookupError:
                        pass
                    break
                try:
                    line = await asyncio.wait_for(
                        self.current_proc.stdout.readline(), timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue
                if not line:
                    break
                text = line.decode("utf-8", errors="replace").rstrip()

                if is_claude and not text.strip():
                    output_lines.append(text)
                    continue

                output_lines.append(text)

                event_type = "claude_output" if is_claude else "agent_log"
                payload: dict = {"type": event_type, "agent": agent}
                if event_type == "claude_output":
                    payload["text"] = text
                else:
                    payload["level"] = "info"
                    payload["message"] = text
                await self._emit(payload)

            await self.current_proc.wait()
            duration = time.time() - start
            self.completed_agents.append(agent)
            await self._emit(
                {
                    "type": "agent_completed",
                    "agent": agent,
                    "duration_s": round(duration, 1),
                    "exit_code": self.current_proc.returncode,
                    "outputs": [],
                }
            )
            return self.current_proc.returncode == 0, "\n".join(output_lines)
        except FileNotFoundError:
            msg = (
                f"Command not found: {cmd[0] if cmd else '?'}. "
                "Is it installed and on PATH?"
            )
            await self._emit({"type": "error", "agent": agent, "message": msg})
            return False, msg
        except Exception as e:
            await self._emit({"type": "error", "agent": agent, "message": str(e)})
            return False, str(e)
        finally:
            self.current_proc = None
            self.current_agent = None

    async def _ensure_pages_json(self):
        """Create pages.json from cache screenshots if it does not exist."""
        cache_dir = Path.home() / ".claude" / "design-library" / "cache" / self.slug
        pages_path = cache_dir / "pages.json"
        if pages_path.exists():
            return

        screenshots_dir = cache_dir / "screenshots"
        pages: list[dict] = []
        if screenshots_dir.exists():
            for img in sorted(screenshots_dir.glob("*.png")):
                pages.append(
                    {
                        "url": img.stem,
                        "path": str(img),
                        "name": img.stem.replace("-", " ").title(),
                    }
                )

        if not pages:
            pages.append({"url": self.url, "path": "", "name": "Home"})

        cache_dir.mkdir(parents=True, exist_ok=True)
        pages_path.write_text(json.dumps(pages, indent=2))
        await self._emit(
            {
                "type": "warning",
                "phase": "C",
                "message": f"pages.json missing; created minimal file with {len(pages)} page(s)",
            }
        )

    async def run_phase_a(self) -> bool:
        self.current_phase = "A"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "A",
                "label": "Extract",
                "agents": ["recon-agent", "dom-extractor", "asset-extractor"],
            }
        )

        ok, output = await self.stream_subprocess(
            ["agent-browser", "open", self.url, "--headed"],
            agent="recon-agent",
        )

        if not ok or self.cancelled:
            if output and (
                "access denied" in output.lower() or "akamai" in output.lower()
            ):
                await self._emit(
                    {
                        "type": "blocked_site",
                        "url": self.url,
                        "reason": "Anti-bot protection detected",
                        "fallback": "assisted_capture",
                    }
                )
            await self._emit({"type": "phase_completed", "phase": "A", "score": None})
            return ok

        if self.cancelled:
            await self._emit({"type": "phase_completed", "phase": "A", "score": None})
            return False

        dom_prompt = (
            f"Extract DOM measurements from {self.url}. "
            f"Brand slug: {self.slug}. "
            f"Read agents/dom-extractor.md for instructions."
        )
        ok, _ = await self.stream_subprocess(
            [
                "claude",
                "--print",
                "-p",
                dom_prompt,
                "--allowedTools",
                "Bash",
                "Read",
                "Write",
                "Glob",
                "--output-format",
                "text",
            ],
            agent="dom-extractor",
        )

        if self.cancelled:
            await self._emit({"type": "phase_completed", "phase": "A", "score": None})
            return False

        asset_prompt = (
            f"Download assets for {self.slug} from {self.url}. "
            f"Read agents/asset-extractor.md for instructions."
        )
        await self.stream_subprocess(
            [
                "claude",
                "--print",
                "-p",
                asset_prompt,
                "--allowedTools",
                "Bash",
                "Read",
                "Write",
                "WebFetch",
                "Glob",
                "--output-format",
                "text",
            ],
            agent="asset-extractor",
        )

        await self._emit({"type": "phase_completed", "phase": "A", "score": None})
        return True

    async def run_phase_b(self) -> bool:
        self.current_phase = "B"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "B",
                "label": "Build",
                "agents": ["replica-builder"],
            }
        )

        prompt = (
            f"Build React/shadcn replicas for brand {self.slug}. "
            f"Read agents/replica-builder.md for instructions."
        )
        ok, _ = await self.stream_subprocess(
            [
                "claude",
                "--print",
                "-p",
                prompt,
                "--allowedTools",
                "Read",
                "Write",
                "Edit",
                "Bash",
                "Glob",
                "Grep",
                "--output-format",
                "text",
            ],
            agent="replica-builder",
        )
        await self._emit({"type": "phase_completed", "phase": "B", "score": None})
        return ok

    async def run_phase_c(self) -> bool:
        self.current_phase = "C"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "C",
                "label": "Validate",
                "agents": ["visual-critic"],
            }
        )

        await self._ensure_pages_json()

        ok, output = await self.stream_subprocess(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "run_validation_loop.py"),
                "--brand",
                self.slug,
                "--base-url",
                "http://localhost:5173",
            ],
            agent="visual-critic",
        )

        score = None
        report_path = (
            Path.home()
            / ".claude"
            / "design-library"
            / "brands"
            / self.slug
            / "validation"
            / "report.json"
        )
        if report_path.exists():
            try:
                report = json.loads(report_path.read_text())
                raw = report.get("desktop_avg") or report.get("viewport_avg")
                if isinstance(raw, (int, float)):
                    score = round(raw / 100, 3)
                await self._emit(
                    {"type": "validation_score", "iteration": 1, "score": score}
                )
            except Exception:
                pass

        await self._emit({"type": "phase_completed", "phase": "C", "score": score})
        return ok

    async def run_phase_d(self) -> bool:
        self.current_phase = "D"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "D",
                "label": "Improve",
                "agents": ["refinement-agent", "validation-monitor"],
            }
        )

        ok, _ = await self.stream_subprocess(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "run_improvement_job.py"),
                "--brand",
                self.slug,
                "--base-url",
                "http://localhost:5173",
                "--target",
                "80",
                "--max-iterations",
                "5",
            ],
            agent="validation-monitor",
        )

        await self._emit({"type": "phase_completed", "phase": "D", "score": None})
        return ok

    async def run_phase_e(self) -> bool:
        self.current_phase = "E"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "E",
                "label": "Publish",
                "agents": ["documentarian", "skill-packager", "librarian"],
            }
        )

        ok, _ = await self.stream_subprocess(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "publish_brand.py"),
                "--brand",
                self.slug,
            ],
            agent="documentarian",
        )

        if ok:
            await self.stream_subprocess(
                [
                    sys.executable,
                    str(REPO_ROOT / "scripts" / "update_library_index.py"),
                    "--add",
                    self.slug,
                ],
                agent="librarian",
            )

        await self._emit({"type": "phase_completed", "phase": "E", "score": None})
        return ok

    async def run(self):
        global _active_job
        _active_job = self

        await self._emit(
            {"type": "extraction_started", "url": self.url, "brand": self.slug}
        )

        early_phases = [
            ("A", self.run_phase_a),
            ("B", self.run_phase_b),
            ("C", self.run_phase_c),
            ("D", self.run_phase_d),
        ]

        active = False
        for phase_id, phase_fn in early_phases:
            if phase_id == self.start_from:
                active = True
            if not active:
                continue
            if self.cancelled:
                await self._emit({"type": "extraction_cancelled", "phase": phase_id})
                _active_job = None
                return
            self._save_job_state(phase_id, "running")
            ok = await phase_fn()
            if not ok:
                self.failed_phases.append(phase_id)
                self._save_job_state(phase_id, "failed")
                if phase_id in ("A", "B"):
                    break
            else:
                self.completed_phases.append(phase_id)
                self._save_job_state(phase_id, "completed")

        if not self.cancelled:
            self._save_job_state("E", "running")
            await self.run_phase_e()
            self.completed_phases.append("E")
            self._save_job_state("E", "completed")

        metadata_path = (
            Path.home()
            / ".claude"
            / "design-library"
            / "brands"
            / self.slug
            / "metadata.json"
        )
        final_score = None
        if metadata_path.exists():
            try:
                meta = json.loads(metadata_path.read_text())
                final_score = meta.get("overall_score")
            except Exception:
                pass

        elapsed = time.time() - self.start_time
        await self._emit(
            {
                "type": "extraction_complete",
                "brand": self.slug,
                "final_score": final_score,
                "elapsed_s": round(elapsed, 1),
                "agents_completed": len(self.completed_agents),
                "failed_phases": self.failed_phases,
            }
        )
        _active_job = None


async def handle_connection(websocket):
    global _active_job

    if _active_job and not _active_job.cancelled:
        _active_job.ws = websocket
        await websocket.send(
            json.dumps(
                {
                    "type": "job_reconnected",
                    "phase": _active_job.current_phase,
                    "agent": _active_job.current_agent,
                    "failed_phases": _active_job.failed_phases,
                }
            )
        )

    async for message in websocket:
        try:
            data = json.loads(message)
        except json.JSONDecodeError:
            continue

        msg_type = data.get("type")

        if msg_type == "start_extraction":
            if _active_job and not _active_job.cancelled:
                await websocket.send(
                    json.dumps(
                        {"type": "error", "message": "Extraction already running"}
                    )
                )
                continue
            job = ExtractionJob(
                url=data["url"],
                brand_name=data.get("brand_name", ""),
                max_pages=data.get("max_pages", 5),
                ws=websocket,
            )
            asyncio.create_task(job.run())

        elif msg_type == "resume_extraction":
            slug = data.get("slug", "")
            job_dir = (
                Path.home() / ".claude" / "design-library" / "cache" / slug / "jobs"
            )
            if not job_dir.exists():
                await websocket.send(
                    json.dumps(
                        {"type": "error", "message": f"No jobs found for {slug}"}
                    )
                )
                continue

            jobs = sorted(
                job_dir.glob("*.json"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            if not jobs:
                await websocket.send(
                    json.dumps({"type": "error", "message": f"No job state for {slug}"})
                )
                continue

            last_state = json.loads(jobs[0].read_text())
            all_phases = ["A", "B", "C", "D", "E"]
            completed = set(last_state.get("completed_phases", []))
            resume_from = None
            for p in all_phases:
                if p not in completed:
                    resume_from = p
                    break

            if resume_from is None:
                await websocket.send(
                    json.dumps(
                        {
                            "type": "status",
                            "message": f"All phases already completed for {slug}",
                        }
                    )
                )
                continue

            job = ExtractionJob(
                url=last_state.get("url", ""),
                brand_name=last_state.get("brand_name", ""),
                max_pages=last_state.get("max_pages", 5),
                ws=websocket,
                start_from=resume_from,
            )
            job.slug = slug
            await websocket.send(
                json.dumps(
                    {"type": "resuming", "slug": slug, "from_phase": resume_from}
                )
            )
            asyncio.create_task(job.run())

        elif msg_type == "cancel":
            if _active_job:
                _active_job.cancelled = True
                if _active_job.current_proc:
                    try:
                        _active_job.current_proc.kill()
                    except ProcessLookupError:
                        pass
                await websocket.send(
                    json.dumps({"type": "status", "message": "Cancellation requested"})
                )

        elif msg_type == "get_status":
            if _active_job:
                await websocket.send(
                    json.dumps(
                        {
                            "type": "job_status",
                            "phase": _active_job.current_phase,
                            "agent": _active_job.current_agent,
                            "cancelled": _active_job.cancelled,
                            "completed_agents": _active_job.completed_agents,
                            "failed_phases": _active_job.failed_phases,
                        }
                    )
                )
            else:
                await websocket.send(json.dumps({"type": "job_status", "idle": True}))

        elif msg_type == "feedback":
            if _active_job:
                _active_job.feedback_messages.append(data.get("message", ""))
                await websocket.send(
                    json.dumps({"type": "status", "message": "Feedback recorded"})
                )

        elif msg_type == "approve_continue":
            if _active_job:
                await websocket.send(
                    json.dumps({"type": "status", "message": "Approved, continuing"})
                )


async def heartbeat_broadcaster():
    while True:
        await asyncio.sleep(15)
        closed = set()
        for ws in _connected_clients:
            try:
                await ws.send(json.dumps({"type": "heartbeat"}))
            except Exception:
                closed.add(ws)
        _connected_clients -= closed


async def handle_connection_wrapper(websocket):
    _connected_clients.add(websocket)
    try:
        await handle_connection(websocket)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        _connected_clients.discard(websocket)


async def main():
    print(f"design-extractor WebSocket server starting on ws://localhost:{PORT}")
    async with websockets.serve(handle_connection_wrapper, "localhost", PORT):
        asyncio.create_task(heartbeat_broadcaster())
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
