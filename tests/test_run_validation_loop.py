"""Tests for multi-viewport capture + validation (WS2, Task 2.4).

The validation harness must screenshot original + replica at desktop / tablet /
mobile viewports and record a per-viewport average in report.json. The browser
is mocked (run_agent_browser writes identical tiny PNGs) so the test never
needs a real browser.
"""

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def _png_bytes() -> bytes:
    from PIL import Image
    import io
    img = Image.new("RGBA", (12, 12), (200, 50, 50, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _setup_globals(vl, tmp_path: Path, brand: str = "vp-brand"):
    home = tmp_path / "home"
    cache = home / ".claude" / "design-library" / "cache" / brand
    brands = home / ".claude" / "design-library" / "brands" / brand
    shot = cache / "screenshots" / "harness"
    shot.mkdir(parents=True, exist_ok=True)
    (brands / "validation").mkdir(parents=True, exist_ok=True)
    vl.CACHE_DIR = cache
    vl.BRANDS_DIR = brands
    vl.SCREENSHOT_DIR = shot
    vl.REPORT_PATH = brands / "validation" / "report.json"
    vl.MANIFEST_PATH = cache / "validation" / "improvement-manifest.json"
    return brands


def test_viewports_constant_is_three_viewports():
    vl = load_module("run_validation_loop")
    names = [v["name"] for v in vl.VIEWPORTS]
    assert names == ["desktop", "tablet", "mobile"]
    for v in vl.VIEWPORTS:
        assert {"name", "width", "height"} <= set(v.keys())


def test_report_records_three_viewport_averages(tmp_path, monkeypatch):
    vl = load_module("run_validation_loop")
    _setup_globals(vl, tmp_path)

    png = _png_bytes()

    def fake_run_agent_browser(url, output_path, **kw):
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        Path(output_path).write_bytes(png)
        return True

    monkeypatch.setattr(vl, "run_agent_browser", fake_run_agent_browser)

    pages = {
        "homepage": {"original_url": "https://example.com/", "replica_route": "/brands/vp-brand/replica"},
    }

    avgs: dict[str, float] = {}
    for viewport in vl.VIEWPORTS:
        scores = vl.run_viewport_validation(
            "http://dev.test", pages, viewport, skip_originals=False
        )
        avgs[viewport["name"]] = vl.average_score(scores)

    vl.update_validation_report(avgs)

    report = json.loads(vl.REPORT_PATH.read_text())
    assert "desktop_avg" in report, f"missing desktop_avg: {report.keys()}"
    assert "tablet_avg" in report, f"missing tablet_avg: {report.keys()}"
    assert "mobile_avg" in report, f"missing mobile_avg: {report.keys()}"
    # Identical dummy PNGs → 100% match in every viewport.
    for key in ("desktop_avg", "tablet_avg", "mobile_avg"):
        assert report[key] == 100.0, f"{key}={report[key]}"


def test_viewport_list_is_overridable(tmp_path, monkeypatch):
    vl = load_module("run_validation_loop")
    _setup_globals(vl, tmp_path)

    png = _png_bytes()
    monkeypatch.setattr(vl, "run_agent_browser", lambda url, out, **kw: (Path(out).parent.mkdir(parents=True, exist_ok=True) or Path(out).write_bytes(png) or True))

    # Override the constant to a single custom viewport and confirm it is honoured.
    custom = [{"name": "wide", "width": 1600, "height": 900}]
    pages = {"homepage": {"original_url": "https://x/", "replica_route": "/r"}}

    avgs = {}
    for viewport in custom:
        scores = vl.run_viewport_validation("http://dev.test", pages, viewport)
        avgs[viewport["name"]] = vl.average_score(scores)
    vl.update_validation_report(avgs)

    report = json.loads(vl.REPORT_PATH.read_text())
    assert "wide_avg" in report
