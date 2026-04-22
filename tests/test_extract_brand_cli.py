"""Unit tests for scripts/extract_brand.py CLI polish helpers."""

import importlib.util
import sys
from pathlib import Path

import pytest


SCRIPTS = Path("/Users/mehran/Documents/github/design-extractor/scripts")


def _load_module(name: str, path: Path):
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    try:
        spec.loader.exec_module(module)
    finally:
        try:
            sys.path.remove(str(path.parent))
        except ValueError:
            pass
    return module


@pytest.fixture(scope="module")
def extract_brand():
    # Importing is safe because argparse + main() live under `if __name__ == "__main__":`
    return _load_module("extract_brand", SCRIPTS / "extract_brand.py")


def test_helpers_importable(extract_brand):
    for attr in ("phase_banner", "step", "ok", "warn", "fail", "_RICH"):
        assert hasattr(extract_brand, attr), f"missing attribute: {attr}"


def test_helpers_no_rich_fallback(extract_brand, monkeypatch, capsys):
    monkeypatch.setattr(extract_brand, "_RICH", False)

    extract_brand.step("step-msg-sentinel")
    extract_brand.ok("ok-msg-sentinel")
    extract_brand.warn("warn-msg-sentinel")

    captured = capsys.readouterr()
    combined = captured.out + captured.err
    assert "step-msg-sentinel" in combined
    assert "ok-msg-sentinel" in combined
    assert "warn-msg-sentinel" in combined
    # fail() calls sys.exit — verify it exits non-zero and emits the message
    with pytest.raises(SystemExit) as exc_info:
        extract_brand.fail("fail-msg-sentinel")
    assert exc_info.value.code != 0
    captured = capsys.readouterr()
    combined = captured.out + captured.err
    assert "fail-msg-sentinel" in combined


def test_phase_banner_plain_text_includes_phase_number_and_title(
    extract_brand, monkeypatch, capsys
):
    monkeypatch.setattr(extract_brand, "_RICH", False)
    extract_brand.phase_banner(3, "Test phase")
    captured = capsys.readouterr()
    combined = captured.out + captured.err
    assert "Phase 3" in combined
    assert "Test phase" in combined
