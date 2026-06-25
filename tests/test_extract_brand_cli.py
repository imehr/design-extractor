"""Unit tests for scripts/extract_brand.py CLI polish helpers."""

import argparse
import importlib.util
import sys
import types
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


# ── Phase 3 fault-tolerance (extract_all_dom) ──────────────────────────────


def _pages(*slugs):
    return {
        s: {"original_url": f"https://example.com/{s}", "replica_route": f"/r/{s}"}
        for s in slugs
    }


def _dom_dirs(tmp_path):
    dom = tmp_path / "dom"
    dom.mkdir(parents=True, exist_ok=True)
    return {"dom_extraction": dom}


def test_extract_all_dom_isolates_single_page_failure(extract_brand, monkeypatch, tmp_path):
    """One transient page failure must NOT abort the run; the page is pruned."""
    dirs = _dom_dirs(tmp_path)
    pages = _pages("homepage", "good-page", "bad-page")

    def fake_extract_dom(page_slug, page_url, slug, dirs, headed, skip_existing):
        if page_slug == "bad-page":
            raise RuntimeError("agent-browser open timed out after 30s")
        (dirs["dom_extraction"] / f"{page_slug}.json").write_text("{}")

    monkeypatch.setattr(extract_brand, "extract_dom", fake_extract_dom)

    result = extract_brand.extract_all_dom(pages, "example-com", dirs, False, False)

    assert set(result.keys()) == {"homepage", "good-page"}
    assert "bad-page" not in result


def test_extract_all_dom_prunes_pages_with_no_json(extract_brand, monkeypatch, tmp_path):
    """A page that returns without writing DOM JSON is treated as failed."""
    dirs = _dom_dirs(tmp_path)
    pages = _pages("homepage", "silent-fail")

    def fake_extract_dom(page_slug, page_url, slug, dirs, headed, skip_existing):
        if page_slug == "homepage":
            (dirs["dom_extraction"] / "homepage.json").write_text("{}")
        # silent-fail writes nothing and does not raise

    monkeypatch.setattr(extract_brand, "extract_dom", fake_extract_dom)

    result = extract_brand.extract_all_dom(pages, "example-com", dirs, False, False)
    assert set(result.keys()) == {"homepage"}


def test_extract_all_dom_fails_when_homepage_missing(extract_brand, monkeypatch, tmp_path):
    """Homepage is the anchor — if it never extracts, the run is unrecoverable."""
    dirs = _dom_dirs(tmp_path)
    pages = _pages("homepage", "good-page")

    def fake_extract_dom(page_slug, page_url, slug, dirs, headed, skip_existing):
        if page_slug == "homepage":
            raise RuntimeError("homepage failed")
        (dirs["dom_extraction"] / f"{page_slug}.json").write_text("{}")

    monkeypatch.setattr(extract_brand, "extract_dom", fake_extract_dom)

    with pytest.raises(SystemExit) as exc_info:
        extract_brand.extract_all_dom(pages, "example-com", dirs, False, False)
    assert exc_info.value.code != 0


# ── CLI parser (build_arg_parser) ──────────────────────────────────────────


def test_arg_parser_keeps_existing_flags(extract_brand):
    args = extract_brand.build_arg_parser().parse_args(
        [
            "--url", "https://example.com",
            "--headed",
            "--all-pages",
            "--page-limit", "7",
            "--replica-batch-size", "3",
            "--skip-existing",
            "--skip-validation",
            "--skip-replicas",
            "--skip-publish",
        ]
    )
    assert args.url == "https://example.com"
    assert args.headed is True
    assert args.all_pages is True
    assert args.page_limit == 7
    assert args.replica_batch_size == 3
    assert args.skip_existing is True
    assert args.skip_validation is True
    assert args.skip_replicas is True
    assert args.skip_publish is True


def test_arg_parser_new_artifact_skip_flags_default_off(extract_brand):
    args = extract_brand.build_arg_parser().parse_args(["--url", "https://example.com"])
    assert args.skip_mirror is False
    assert args.skip_html_replicas is False
    assert args.skip_open_design_export is False


def test_arg_parser_new_artifact_skip_flags_parse(extract_brand):
    args = extract_brand.build_arg_parser().parse_args(
        [
            "--url", "https://example.com",
            "--skip-mirror",
            "--skip-html-replicas",
            "--skip-open-design-export",
        ]
    )
    assert args.skip_mirror is True
    assert args.skip_html_replicas is True
    assert args.skip_open_design_export is True


def test_arg_parser_requires_url(extract_brand):
    with pytest.raises(SystemExit):
        extract_brand.build_arg_parser().parse_args(["--skip-mirror"])


# ── Publish-side artifact steps (mirror / HTML replicas / open-design) ─────


@pytest.mark.parametrize(
    ("step_fn", "script_name", "expected_args"),
    [
        ("mirror_originals", "mirror_original_pages.py", ["--slug", "example-com"]),
        ("generate_html_replicas", "generate_html_replicas.py", ["--slug", "example-com", "--verify"]),
        ("export_open_design", "export_open_design.py", ["--slug", "example-com", "--check"]),
    ],
)
def test_artifact_steps_invoke_script_with_expected_args(
    extract_brand, monkeypatch, step_fn, script_name, expected_args
):
    import subprocess

    calls = []

    def fake_run_cmd(cmd, **kwargs):
        calls.append((cmd, kwargs))
        return subprocess.CompletedProcess(cmd, returncode=0, stdout="done", stderr="")

    monkeypatch.setattr(extract_brand, "run_cmd", fake_run_cmd)
    getattr(extract_brand, step_fn)("example-com")

    assert len(calls) == 1
    cmd, kwargs = calls[0]
    assert cmd[1].endswith(script_name)
    assert cmd[2:] == expected_args
    # Best-effort: a non-zero exit must be observable but never fatal.
    assert kwargs.get("check") is False
    assert kwargs.get("timeout_ok") is True
    assert isinstance(kwargs.get("timeout"), int)


@pytest.mark.parametrize(
    "step_fn", ["mirror_originals", "generate_html_replicas", "export_open_design"]
)
def test_artifact_steps_warn_and_continue_on_nonzero_exit(
    extract_brand, monkeypatch, capsys, step_fn
):
    """Publish-side artifacts must never abort an otherwise good extraction."""
    import subprocess

    monkeypatch.setattr(extract_brand, "_RICH", False)

    def fake_run_cmd(cmd, **kwargs):
        return subprocess.CompletedProcess(cmd, returncode=2, stdout="", stderr="boom")

    monkeypatch.setattr(extract_brand, "run_cmd", fake_run_cmd)
    getattr(extract_brand, step_fn)("example-com")  # must not raise / sys.exit

    combined = capsys.readouterr().out
    assert "exited with code 2" in combined
    assert "non-fatal" in combined


@pytest.mark.parametrize(
    "step_fn", ["mirror_originals", "generate_html_replicas", "export_open_design"]
)
def test_artifact_steps_warn_and_continue_on_timeout(
    extract_brand, monkeypatch, capsys, step_fn
):
    import subprocess

    monkeypatch.setattr(extract_brand, "_RICH", False)

    def fake_run_cmd(cmd, **kwargs):
        # run_cmd(timeout_ok=True) signals a timeout with returncode -1
        return subprocess.CompletedProcess(cmd, returncode=-1, stdout="partial", stderr="")

    monkeypatch.setattr(extract_brand, "run_cmd", fake_run_cmd)
    getattr(extract_brand, step_fn)("example-com")  # must not raise / sys.exit

    combined = capsys.readouterr().out
    assert "exceeded" in combined
    assert "continuing" in combined


def test_artifact_steps_skip_when_script_missing(extract_brand, monkeypatch, capsys, tmp_path):
    monkeypatch.setattr(extract_brand, "_RICH", False)
    monkeypatch.setattr(extract_brand, "SCRIPTS_DIR", tmp_path)  # empty dir: no scripts

    def must_not_run(cmd, **kwargs):  # pragma: no cover — guard
        raise AssertionError("run_cmd must not be called when the script is missing")

    monkeypatch.setattr(extract_brand, "run_cmd", must_not_run)
    extract_brand.mirror_originals("example-com")

    combined = capsys.readouterr().out
    assert "mirror_original_pages.py not found" in combined


# ── run_cmd timeout handling ───────────────────────────────────────────────


def test_run_cmd_timeout_raises_by_default(extract_brand):
    import sys

    # Real child that sleeps past the timeout; run_cmd must kill it and raise.
    with pytest.raises(RuntimeError, match="timed out"):
        extract_brand.run_cmd([sys.executable, "-c", "import time; time.sleep(999)"], timeout=1)


def test_run_cmd_timeout_ok_returns_partial(extract_brand):
    import sys

    # Child prints, then sleeps past the timeout. run_cmd should SIGKILL the
    # group, drain the buffered output, and return returncode -1 with the
    # partial stdout rather than hanging or losing it.
    result = extract_brand.run_cmd(
        [sys.executable, "-c", "import time; print('partial-out', flush=True); time.sleep(999)"],
        timeout=1,
        timeout_ok=True,
    )
    assert result.returncode == -1
    assert "partial-out" in result.stdout


def test_run_cmd_timeout_does_not_deadlock_on_grandchild(extract_brand):
    """Regression: a grandchild holding the capture pipe must not hang run_cmd."""
    import sys
    import time

    program = (
        "import subprocess, sys, time;"
        "subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)']);"
        "time.sleep(60)"
    )
    start = time.monotonic()
    result = extract_brand.run_cmd(
        [sys.executable, "-c", program], timeout=2, timeout_ok=True
    )
    elapsed = time.monotonic() - start
    assert result.returncode == -1
    assert elapsed < 15, f"run_cmd took {elapsed:.1f}s — deadlocked on the grandchild"


# ── Phase 7.6 / 7.7: OD artifact + design-system bundle orchestration ──────


def _bundle_args(**overrides) -> argparse.Namespace:
    """Build a minimal argparse Namespace carrying only the bundle-phase flags."""
    ns = argparse.Namespace(
        skip_artifact_bundle=False,
        skip_mirror=False,
        skip_design_system_bundle=False,
        skip_publish=False,
    )
    ns.__dict__.update(overrides)
    return ns


def _install_fake_emitters(extract_brand, monkeypatch, *, artifact_ret=None,
                           build_ret=None, artifact_raises=False, build_raises=False):
    """Monkeypatch the lazy sibling-module seams with fakes that record calls.

    Returns a dict with 'package_artifacts' and 'build' call lists so each test
    can assert exactly which emitter fired.
    """
    calls = {"package_artifacts": [], "build": []}

    def fake_package_artifacts(slug, brands_dir, out_dir, mirror_root):
        calls["package_artifacts"].append(
            {"slug": slug, "brands_dir": brands_dir, "out_dir": out_dir,
             "mirror_root": mirror_root}
        )
        if artifact_raises:
            raise RuntimeError("artifact boom")
        return artifact_ret if artifact_ret is not None else ["fake-page"]

    def fake_build(brand_dir_or_slug, **kwargs):
        calls["build"].append({"slug": brand_dir_or_slug, "kwargs": kwargs})
        if build_raises:
            raise RuntimeError("build boom")
        return build_ret if build_ret is not None else Path("fake/bundle")

    fake_eod = types.SimpleNamespace(package_artifacts=fake_package_artifacts)
    fake_bds = types.SimpleNamespace(build=fake_build)
    monkeypatch.setattr(extract_brand, "_get_export_open_design_module", lambda: fake_eod)
    monkeypatch.setattr(extract_brand, "_get_build_design_system_bundle_module", lambda: fake_bds)
    return calls


def _make_mirror_root(tmp_path, slug="example-com", page="homepage"):
    mirror = tmp_path / "brands" / slug / "original" / page
    mirror.mkdir(parents=True, exist_ok=True)
    (mirror / "index.html").write_text("<!doctype html><title>orig</title>")
    return tmp_path / "brands"


def test_arg_parser_od_bundle_skip_flags_default_off(extract_brand):
    args = extract_brand.build_arg_parser().parse_args(["--url", "https://example.com"])
    assert args.skip_artifact_bundle is False
    assert args.skip_design_system_bundle is False


def test_arg_parser_od_bundle_skip_flags_parse(extract_brand):
    args = extract_brand.build_arg_parser().parse_args(
        ["--url", "https://example.com", "--skip-artifact-bundle", "--skip-design-system-bundle"]
    )
    assert args.skip_artifact_bundle is True
    assert args.skip_design_system_bundle is True


def test_bundle_phases_call_both_emitters_when_enabled(extract_brand, monkeypatch, tmp_path):
    """Neither skip flag set + a mirror root exists → both emitters fire once."""
    brands_dir = _make_mirror_root(tmp_path)
    calls = _install_fake_emitters(extract_brand, monkeypatch)

    extract_brand.run_open_design_bundle_phases(
        _bundle_args(), "example-com", brands_dir, tmp_path / "lib", tmp_path / "cache"
    )

    assert len(calls["package_artifacts"]) == 1
    assert calls["package_artifacts"][0]["slug"] == "example-com"
    assert len(calls["build"]) == 1
    assert calls["build"][0]["slug"] == "example-com"


def test_bundle_phases_skip_artifact_flag_suppresses_artifact_call(extract_brand, monkeypatch, tmp_path):
    brands_dir = _make_mirror_root(tmp_path)
    calls = _install_fake_emitters(extract_brand, monkeypatch)

    extract_brand.run_open_design_bundle_phases(
        _bundle_args(skip_artifact_bundle=True), "example-com",
        brands_dir, tmp_path / "lib", tmp_path / "cache",
    )

    assert calls["package_artifacts"] == []          # 7.6 suppressed
    assert len(calls["build"]) == 1                  # 7.7 still runs


def test_bundle_phases_skip_design_system_flag_suppresses_design_system_call(
    extract_brand, monkeypatch, tmp_path
):
    brands_dir = _make_mirror_root(tmp_path)
    calls = _install_fake_emitters(extract_brand, monkeypatch)

    extract_brand.run_open_design_bundle_phases(
        _bundle_args(skip_design_system_bundle=True), "example-com",
        brands_dir, tmp_path / "lib", tmp_path / "cache",
    )

    assert len(calls["package_artifacts"]) == 1      # 7.6 still runs
    assert calls["build"] == []                       # 7.7 suppressed


def test_bundle_phases_skip_mirror_suppresses_artifact_call(extract_brand, monkeypatch, tmp_path):
    """--skip-mirror means there is nothing to package → 7.6 must not call the emitter."""
    brands_dir = _make_mirror_root(tmp_path)
    calls = _install_fake_emitters(extract_brand, monkeypatch)

    extract_brand.run_open_design_bundle_phases(
        _bundle_args(skip_mirror=True), "example-com",
        brands_dir, tmp_path / "lib", tmp_path / "cache",
    )

    assert calls["package_artifacts"] == []
    assert len(calls["build"]) == 1                  # 7.7 unaffected by --skip-mirror


def test_bundle_phases_skip_publish_suppresses_design_system_call(extract_brand, monkeypatch, tmp_path):
    """--skip-publish means no measured-tokens → 7.7 must not run; 7.6 still can."""
    brands_dir = _make_mirror_root(tmp_path)
    calls = _install_fake_emitters(extract_brand, monkeypatch)

    extract_brand.run_open_design_bundle_phases(
        _bundle_args(skip_publish=True), "example-com",
        brands_dir, tmp_path / "lib", tmp_path / "cache",
    )

    assert len(calls["package_artifacts"]) == 1      # 7.6 only needs the mirror
    assert calls["build"] == []                       # 7.7 needs publish output


def test_bundle_phases_skip_artifact_when_no_mirror_dir(extract_brand, monkeypatch, tmp_path):
    """No mirror root on disk → 7.6 must short-circuit before calling the emitter."""
    calls = _install_fake_emitters(extract_brand, monkeypatch)
    # tmp_path/brands exists but has no <slug>/original/ tree.
    brands_dir = tmp_path / "brands"
    brands_dir.mkdir(parents=True, exist_ok=True)

    extract_brand.run_open_design_bundle_phases(
        _bundle_args(), "example-com", brands_dir, tmp_path / "lib", tmp_path / "cache"
    )

    assert calls["package_artifacts"] == []          # no mirror → nothing packaged
    assert len(calls["build"]) == 1                  # 7.7 is independent of mirror


def test_bundle_phases_do_not_propagate_emitter_exceptions(extract_brand, monkeypatch, tmp_path):
    """An emitter raising must NEVER abort the extraction — both phases are leaf artifacts."""
    brands_dir = _make_mirror_root(tmp_path)
    _install_fake_emitters(extract_brand, monkeypatch, artifact_raises=True, build_raises=True)

    # Must not raise.
    extract_brand.run_open_design_bundle_phases(
        _bundle_args(), "example-com", brands_dir, tmp_path / "lib", tmp_path / "cache"
    )
