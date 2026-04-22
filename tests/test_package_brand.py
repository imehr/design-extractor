"""Integration test for scripts/package_brand.py end-to-end packager."""

import importlib.util
import shutil
import sys
from pathlib import Path


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


def test_package_brand_produces_install_kit(tmp_path, monkeypatch):
    # --- Synthesize a fake brand in a fake library under a fake $HOME ---
    brand_slug = "fake-brand"
    fake_home = tmp_path / "home"
    real_lib = fake_home / ".claude" / "design-library"
    brand_dir = real_lib / "brands" / brand_slug
    brand_dir.mkdir(parents=True)

    (brand_dir / "DESIGN.md").write_text("# Fake\n")
    (brand_dir / "design-tokens.json").write_text('{"tokens": {}}')
    (brand_dir / "design-tokens.css").write_text(":root {}")
    (brand_dir / "metadata.json").write_text(
        '{"name": "Fake Brand", "source_url": "https://fake.example", "overall_score": 0.9}'
    )
    skill_sub = brand_dir / "skill"
    skill_sub.mkdir()
    (skill_sub / "SKILL.md").write_text("---\nname: brand-fake\n---\n# skill\n")

    # Redirect Path.home() so package_brand looks up the fake library
    monkeypatch.setattr(Path, "home", lambda: fake_home)

    # Argv redirect
    out_dir = tmp_path / "out"
    monkeypatch.setattr(
        "sys.argv",
        [
            "package_brand.py",
            "--brand", brand_slug,
            "--output", str(out_dir),
        ],
    )

    package_brand = _load_module("package_brand", SCRIPTS / "package_brand.py")
    rc = package_brand.main()
    assert rc in (None, 0), f"main() returned {rc!r}"

    # Assertions
    install_sh = out_dir / "install.sh"
    assert install_sh.exists(), "install.sh not produced"
    assert install_sh.stat().st_mode & 0o111, "install.sh must be executable"

    assert (out_dir / "README.md").exists()
    assert (out_dir / "skill" / "SKILL.md").exists()
    assert (out_dir / "skill" / "DESIGN.md").exists()
