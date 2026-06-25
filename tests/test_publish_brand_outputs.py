"""End-to-end tests for the publish pipeline outputs (WS1).

Covers:
  - publish_brand.py writes all five artifacts to <repo>/brands/<slug>/
    and mirrors them to ~/.claude/design-library/brands/<slug>/
  - generated DESIGN.md passes validate_design_md with zero violations
  - graceful degradation when extraction evidence is sparse (LOW confidence,
    explicit warnings, no fabricated data) and when the cache is missing
  - eval_rubric reports always list all 9 dimensions (skipped, never absent)
  - update_library_index.py --rebuild regenerates both index.json files
    idempotently from brands/*/metadata.json
"""

import importlib.util
import json
import os
import re
import subprocess
import sys
import types
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


# -- Fixture builders ----------------------------------------------------------

def rich_measurements() -> dict:
    """Synthetic but realistic homepage measurements (enough for 5+ colors)."""
    return {
        "header": {"height": 96, "width": 1280, "backgroundColor": "rgb(255, 255, 255)"},
        "hero": {"height": 520, "width": 1280, "backgroundColor": "rgb(14, 13, 38)"},
        "h1": {
            "text": "Test Brand headline",
            "fontSize": "48px",
            "fontWeight": "600",
            "fontFamily": "TestSans",
            "lineHeight": "56px",
            "color": "rgb(25, 113, 237)",
        },
        "bodyText": {
            "fontSize": "16px",
            "fontWeight": "400",
            "fontFamily": "TestText",
            "lineHeight": "24px",
            "color": "rgb(32, 32, 32)",
        },
        "footer": {"backgroundColor": "rgb(14, 13, 38)", "color": "rgb(255, 255, 255)"},
        "colors": {
            "primary": "rgb(25, 113, 237)",
            "text": "rgb(32, 32, 32)",
            "white": "rgb(255, 255, 255)",
            "footerDark": "rgb(14, 13, 38)",
            "backgroundLight": "rgb(246, 247, 251)",
        },
        "uniqueTextColors": ["rgb(32, 32, 32)", "rgb(25, 113, 237)"],
        "uniqueBackgroundColors": ["rgb(255, 255, 255)", "rgb(14, 13, 38)"],
        "layout": {"contentMaxWidth": 1200, "contentPaddingLeft": 40},
    }


def sparse_measurements() -> dict:
    """Almost no evidence — must publish with explicit warnings + LOW confidence."""
    return {
        "h1": {
            "fontSize": "32px",
            "fontWeight": "700",
            "fontFamily": "OnlyFont",
            "lineHeight": "40px",
            "color": "rgb(0, 0, 0)",
        },
    }


def homepage_dom() -> dict:
    return {
        "header": {
            "logo": {"localFile": "assets/images/logo.svg"},
            "primaryNav": [
                {"text": "Products"},
                {"text": "Solutions"},
                {"text": "About"},
                {"text": "Contact"},
            ],
        },
        "footer": {
            "logo": {"localFile": "assets/images/logo-white.svg"},
            "aboutUs": {"text": "Test Brand builds synthetic fixtures."},
            "quickLinks": {
                "column1": [{"text": "Home"}, {"text": "Careers"}],
                "column2": [{"text": "Privacy policy"}],
            },
            "copyright": "All Rights Reserved.",
        },
        "sections": [
            {"tag": "header", "links": [{"text": "Products"}]},
            {"tag": "footer", "links": [{"text": "Privacy policy"}]},
        ],
    }


def seed_cache(home: Path, slug: str, measurements: dict | None = None, dom: dict | None = None) -> Path:
    cache = home / ".claude" / "design-library" / "cache" / slug
    dom_dir = cache / "dom-extraction"
    dom_dir.mkdir(parents=True)
    if measurements is not None:
        (dom_dir / "homepage-measurements.json").write_text(json.dumps(measurements))
    if dom is not None:
        (dom_dir / "homepage.json").write_text(json.dumps(dom))
    assets = cache / "assets" / "images"
    assets.mkdir(parents=True)
    (assets / "logo.svg").write_text("<svg xmlns='http://www.w3.org/2000/svg'/>")
    return cache


def run_publish(home: Path, repo: Path, slug: str, extra: list[str] | None = None) -> subprocess.CompletedProcess:
    env = {
        "HOME": str(home),
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "DESIGN_EXTRACTOR_SKIP_DOTENV": "1",
    }
    return subprocess.run(
        [sys.executable, str(SCRIPTS / "publish_brand.py"), "--slug", slug,
         "--repo-root", str(repo)] + (extra or []),
        capture_output=True, text=True, timeout=120, env=env, cwd=str(repo),
    )


# -- All artifacts written (repo + library mirror) ------------------------------

ARTIFACTS = ["DESIGN.md", "design-tokens.json", "design-tokens.css", "skill/SKILL.md", "metadata.json"]


def test_publish_writes_all_artifacts_to_repo_and_library(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    seed_cache(home, "test-brand", rich_measurements(), homepage_dom())

    result = run_publish(home, repo, "test-brand")
    assert result.returncode == 0, f"publish failed:\n{result.stdout}\n{result.stderr}"

    repo_brand = repo / "brands" / "test-brand"
    lib_brand = home / ".claude" / "design-library" / "brands" / "test-brand"
    for rel in ARTIFACTS:
        assert (repo_brand / rel).exists(), f"missing repo artifact: {rel}"
        assert (lib_brand / rel).exists(), f"missing library artifact: {rel}"
        assert (repo_brand / rel).read_text() == (lib_brand / rel).read_text(), (
            f"mirror drift for {rel}"
        )


def test_publish_design_md_zero_violations(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    seed_cache(home, "test-brand", rich_measurements(), homepage_dom())

    result = run_publish(home, repo, "test-brand")
    assert result.returncode == 0, result.stdout + result.stderr

    dmw = load_module("design_md_writer")
    md = (repo / "brands" / "test-brand" / "DESIGN.md").read_text()
    violations = dmw.validate_design_md(md)
    assert violations == [], "DESIGN.md violations:\n" + "\n".join(violations)
    assert "DESIGN.md validation: 0 violations" in result.stdout


def test_publish_metadata_fields(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    seed_cache(home, "test-brand", rich_measurements(), homepage_dom())

    result = run_publish(home, repo, "test-brand")
    assert result.returncode == 0, result.stdout + result.stderr

    meta = json.loads((repo / "brands" / "test-brand" / "metadata.json").read_text())
    for key in ("name", "slug", "source_url", "extracted_at", "version",
                "confidence", "categories", "extraction_method"):
        assert key in meta, f"metadata.json missing {key}"
    assert meta["slug"] == "test-brand"
    assert meta["extraction_method"] == "dom-extraction"
    assert meta["confidence"] in ("LOW", "MEDIUM", "HIGH")


def test_publish_tokens_include_dtcg_groups(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    seed_cache(home, "test-brand", rich_measurements(), homepage_dom())

    result = run_publish(home, repo, "test-brand")
    assert result.returncode == 0, result.stdout + result.stderr

    tokens = json.loads((repo / "brands" / "test-brand" / "design-tokens.json").read_text())
    # Legacy structure preserved for existing consumers (UI, design_md_writer).
    assert "colours" in tokens and "palette" in tokens["colours"]
    # W3C DTCG groups present for token tooling.
    assert tokens["color"]["$type"] == "color"
    dtcg_colors = {k: v for k, v in tokens["color"].items() if not k.startswith("$")}
    assert dtcg_colors, "DTCG color group has no tokens"
    for name, tok in dtcg_colors.items():
        assert tok["$value"].startswith("#"), f"color.{name} $value not hex: {tok}"
    assert tokens["fontFamily"]["$type"] == "fontFamily"
    assert tokens["dimension"]["$type"] == "dimension"


def test_publish_css_variable_names_are_valid(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    measurements = rich_measurements()
    # These produce palette keys like "text_rgb(51, 71, 91)" which previously
    # leaked parens/spaces into CSS custom property names.
    measurements["uniqueTextColors"].append("rgb(51, 71, 91)")
    seed_cache(home, "test-brand", measurements, homepage_dom())

    result = run_publish(home, repo, "test-brand")
    assert result.returncode == 0, result.stdout + result.stderr

    css = (repo / "brands" / "test-brand" / "design-tokens.css").read_text()
    for line in css.splitlines():
        line = line.strip()
        if not line.startswith("--"):
            continue
        var_name = line.split(":", 1)[0]
        assert "(" not in var_name and " " not in var_name and "," not in var_name, (
            f"invalid CSS custom property name: {var_name}"
        )


# -- Graceful degradation --------------------------------------------------------

def test_publish_sparse_evidence_degrades_to_low_confidence(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    seed_cache(home, "sparse-brand", sparse_measurements(), None)

    result = run_publish(home, repo, "sparse-brand")
    assert result.returncode == 0, result.stdout + result.stderr

    meta = json.loads((repo / "brands" / "sparse-brand" / "metadata.json").read_text())
    assert meta["confidence"] == "LOW"
    # Explicit warnings, never silent.
    assert "WARN" in result.stdout or "LOW" in result.stdout
    # Artifacts still written.
    for rel in ARTIFACTS:
        assert (repo / "brands" / "sparse-brand" / rel).exists(), f"missing {rel}"


def test_publish_missing_cache_fails_loudly(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    (home / ".claude" / "design-library").mkdir(parents=True)

    result = run_publish(home, repo, "ghost-brand")
    assert result.returncode != 0
    combined = result.stdout + result.stderr
    assert "ghost-brand" in combined and ("Error" in combined or "error" in combined)


def test_publish_accepts_legacy_brand_flag(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    seed_cache(home, "legacy-brand", rich_measurements(), homepage_dom())

    env = {
        "HOME": str(home),
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "DESIGN_EXTRACTOR_SKIP_DOTENV": "1",
    }
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "publish_brand.py"), "--brand", "legacy-brand",
         "--repo-root", str(repo)],
        capture_output=True, text=True, timeout=120, env=env, cwd=str(repo),
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert (repo / "brands" / "legacy-brand" / "DESIGN.md").exists()


def test_publish_supports_shared_repo_cache_layout(tmp_path):
    """dom-extraction data may live in <repo>/cache/dom-extraction/<slug>-*.json."""
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    (home / ".claude" / "design-library").mkdir(parents=True)
    shared_dom = repo / "cache" / "dom-extraction"
    shared_dom.mkdir(parents=True)
    (shared_dom / "shared-brand-measurements.json").write_text(json.dumps(rich_measurements()))
    (shared_dom / "shared-brand.json").write_text(json.dumps(homepage_dom()))
    # A different brand's files in the same directory must be ignored.
    (shared_dom / "other-brand-measurements.json").write_text(json.dumps({"h1": {"color": "rgb(9, 9, 9)"}}))

    result = run_publish(home, repo, "shared-brand")
    assert result.returncode == 0, result.stdout + result.stderr
    assert "Measurements: 1 files" in result.stdout
    assert (repo / "brands" / "shared-brand" / "DESIGN.md").exists()


# -- Eval rubric: 9 dimensions, always ------------------------------------------

def test_rubric_report_always_lists_nine_dimensions(tmp_path, monkeypatch):
    er = load_module("eval_rubric")

    # Block the side-effect import so the real (slow, browser-driven) dimension
    # runners never register inside this test process.
    monkeypatch.setitem(sys.modules, "eval_dimensions", types.ModuleType("eval_dimensions"))

    er.reset_registry()
    er.register(er.Dimension(
        name="pixel_desktop", weight=0.25, threshold=0.85, critical_fail_at=0.40,
        runner=lambda ctx: er.DimensionResult(
            name="pixel_desktop", score=0.9, threshold=0.85, weight=0.25,
            status="pass", details={},
        ),
    ))

    ctx = er.BrandContext(
        slug="test-brand",
        brand_dir=tmp_path,
        cache_dir=tmp_path,
        design_tokens={},
    )
    report = er.run_rubric(ctx)
    payload = report.to_dict()

    names = [d["name"] for d in payload["dimensions"]]
    assert sorted(names) == sorted(er.DEFAULT_DIMENSION_NAMES)
    assert len(names) == 9

    by_name = {d["name"]: d for d in payload["dimensions"]}
    assert by_name["pixel_desktop"]["status"] == "pass"
    for name in er.DEFAULT_DIMENSION_NAMES:
        if name == "pixel_desktop":
            continue
        assert by_name[name]["status"] == "skipped", f"{name} not skipped"
        assert by_name[name]["details"].get("reason"), f"{name} skipped without reason"

    er.reset_registry()


def test_rubric_default_dimension_names_complete():
    er = load_module("eval_rubric")
    assert er.DEFAULT_DIMENSION_NAMES == [
        "pixel_desktop",
        "component_completeness",
        "pattern_fidelity",
        "asset_fidelity",
        "anti_slop",
        "pixel_mobile",
        "pixel_tablet",
        "interactive_state",
        "font_rendering",
    ]


# -- Library index rebuild --------------------------------------------------------

def _write_metadata(brand_dir: Path, slug: str, extracted_at: str = "2026-06-01") -> None:
    brand_dir.mkdir(parents=True, exist_ok=True)
    (brand_dir / "metadata.json").write_text(json.dumps({
        "name": slug.replace("-", " ").title(),
        "slug": slug,
        "source_url": f"https://{slug}.example.com",
        "extracted_at": extracted_at,
        "version": "1.0.0",
        "confidence": "MEDIUM",
        "categories": ["test"],
        "extraction_method": "dom-extraction",
    }))


def _run_index(args: list[str], home: Path) -> subprocess.CompletedProcess:
    env = {"HOME": str(home), "PATH": os.environ.get("PATH", "/usr/bin:/bin")}
    return subprocess.run(
        [sys.executable, str(SCRIPTS / "update_library_index.py")] + args,
        capture_output=True, text=True, timeout=30, env=env,
    )


def test_index_rebuild_from_metadata(tmp_path):
    home = tmp_path / "home"
    repo_brands = tmp_path / "repo" / "brands"
    _write_metadata(home / ".claude" / "design-library" / "brands" / "lib-brand", "lib-brand")
    _write_metadata(repo_brands / "repo-brand", "repo-brand")

    result = _run_index(["--rebuild", "--repo-brands-dir", str(repo_brands)], home=home)
    assert result.returncode == 0, result.stdout + result.stderr

    lib_index = json.loads((home / ".claude" / "design-library" / "index.json").read_text())
    slugs = {b["slug"] for b in lib_index["brands"]}
    assert slugs == {"lib-brand", "repo-brand"}

    repo_index = json.loads((repo_brands / "index.json").read_text())
    assert {b["slug"] for b in repo_index["brands"]} == {"lib-brand", "repo-brand"}


def test_index_rebuild_idempotent(tmp_path):
    home = tmp_path / "home"
    repo_brands = tmp_path / "repo" / "brands"
    _write_metadata(home / ".claude" / "design-library" / "brands" / "brand-a", "brand-a")
    _write_metadata(repo_brands / "brand-b", "brand-b")

    first = _run_index(["--rebuild", "--repo-brands-dir", str(repo_brands)], home=home)
    assert first.returncode == 0, first.stdout + first.stderr
    index_1 = json.loads((home / ".claude" / "design-library" / "index.json").read_text())

    second = _run_index(["--rebuild", "--repo-brands-dir", str(repo_brands)], home=home)
    assert second.returncode == 0, second.stdout + second.stderr
    index_2 = json.loads((home / ".claude" / "design-library" / "index.json").read_text())

    assert index_1["brands"] == index_2["brands"]


def test_index_rebuild_drops_stale_entries(tmp_path):
    home = tmp_path / "home"
    repo_brands = tmp_path / "repo" / "brands"
    repo_brands.mkdir(parents=True)
    lib_root = home / ".claude" / "design-library"
    _write_metadata(lib_root / "brands" / "kept-brand", "kept-brand")
    lib_root.mkdir(parents=True, exist_ok=True)
    (lib_root / "index.json").write_text(json.dumps({
        "version": "0.1.0",
        "updated_at": "2026-01-01T00:00:00Z",
        "brands": [{"slug": "deleted-brand", "name": "Deleted"}],
    }))

    result = _run_index(["--rebuild", "--repo-brands-dir", str(repo_brands)], home=home)
    assert result.returncode == 0, result.stdout + result.stderr

    index = json.loads((lib_root / "index.json").read_text())
    slugs = {b["slug"] for b in index["brands"]}
    assert slugs == {"kept-brand"}


# -- WS2: measured spacing/radius/shadow + clean token naming -------------------

def measured_tokens_fixture() -> dict:
    """A MeasuredTokens artifact (serialized) with measured radii/shadows/space/motion."""
    def prov(value, count=5):
        return {"value": value, "sources": [":root"], "confidence": "HIGH" if count >= 5 else "MED", "count": count}
    return {
        "--radius-sm": prov("6px", 9),
        "--radius-md": prov("10px", 6),
        "--radius-lg": prov("18px", 4),
        "--radius-pill": prov("9999px", 3),
        "--space-1": prov("4px", 12), "--space-2": prov("8px", 14),
        "--space-3": prov("12px", 7), "--space-4": prov("16px", 9),
        "--space-5": prov("20px", 3), "--space-6": prov("24px", 8),
        "--space-8": prov("32px", 5), "--space-12": prov("48px", 4),
        "--elev-flat": prov("none", 2),
        "--elev-ring": prov("0 0 0 1px #e2e8f0", 3),
        "--elev-raised": prov("0 2px 8px rgba(0,0,0,0.12)", 6),
        "--motion-fast": prov("120ms", 4),
        "--motion-base": prov("200ms", 5),
        "--ease-standard": prov("cubic-bezier(0.2,0,0,1)", 5),
    }


def test_publish_uses_measured_radii_shadows_spacing(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    cache = seed_cache(home, "meas-brand", rich_measurements(), homepage_dom())
    (cache / "dom-extraction" / "measured-tokens.json").write_text(json.dumps(measured_tokens_fixture()))

    result = run_publish(home, repo, "meas-brand")
    assert result.returncode == 0, result.stdout + result.stderr

    tokens = json.loads((repo / "brands" / "meas-brand" / "design-tokens.json").read_text())

    # Radii come from measured tokens, not the hardcoded ["0px","4px","8px","16px","9999px"].
    radii_vals = [r["value"] for r in tokens["borders"]["radii"]]
    assert radii_vals == ["6px", "10px", "18px", "9999px"], radii_vals
    assert "0px" not in radii_vals  # the fabricated 0px is gone

    # Shadows non-empty (raised + ring measured; flat "none" excluded).
    assert tokens["shadows"], "shadows should be non-empty when measured"
    shadow_vals = " ".join(s.get("value", "") for s in tokens["shadows"])
    assert "0 2px 8px" in shadow_vals

    # Spacing scale comes from measured space tokens.
    scale_vals = [s["value"] if isinstance(s, dict) else s for s in tokens["spacing"]["scale"]]
    assert "8px" in scale_vals and "24px" in scale_vals

    # Transitions come from measured motion tokens.
    transition_vals = " ".join(t.get("value", "") for t in tokens["transitions"])
    assert "120ms" in transition_vals or "200ms" in transition_vals


def test_publish_falls_back_to_defaults_without_measured_tokens(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    seed_cache(home, "nofrill-brand", rich_measurements(), homepage_dom())

    result = run_publish(home, repo, "nofrill-brand")
    assert result.returncode == 0, result.stdout + result.stderr

    tokens = json.loads((repo / "brands" / "nofrill-brand" / "design-tokens.json").read_text())
    radii_vals = [r["value"] for r in tokens["borders"]["radii"]]
    # Hardcoded defaults survive when no measured artifact is present.
    assert radii_vals == ["0px", "4px", "8px", "16px", "9999px"]


def test_publish_no_token_name_matches_text_or_bg_prefix(tmp_path):
    home = tmp_path / "home"
    repo = tmp_path / "repo"
    repo.mkdir(parents=True)
    measurements = rich_measurements()
    measurements["uniqueTextColors"] = ["rgb(32, 32, 32)", "rgb(25, 113, 237)", "rgb(120, 130, 145)"]
    measurements["uniqueBackgroundColors"] = ["rgb(255, 255, 255)", "rgb(14, 13, 38)", "rgb(246, 247, 251)"]
    seed_cache(home, "clean-brand", measurements, homepage_dom())

    result = run_publish(home, repo, "clean-brand")
    assert result.returncode == 0, result.stdout + result.stderr

    tokens = json.loads((repo / "brands" / "clean-brand" / "design-tokens.json").read_text())
    for c in tokens["colours"]["computed"]:
        assert not re.match(r"^(text|bg)_", c["role"]), f"noisy role: {c['role']}"
    for name in tokens["colours"]["palette"]:
        assert not re.match(r"^(text|bg)_", name), f"noisy palette key: {name}"


def test_color_distance_zero_for_identical_and_small_for_close():
    pb = load_module("publish_brand")
    assert pb.color_distance("#1971ed", "#1971ed") == 0.0
    # Near-identical blues should be a small perceptual distance.
    assert pb.color_distance("#1971ed", "#1971ee") < 2.0
    # Clearly different colors are far apart.
    assert pb.color_distance("#ffffff", "#000000") > 50.0
