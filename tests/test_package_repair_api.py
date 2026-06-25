from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_repair_package_route_calls_repair_library():
    route = ROOT / "ui/app/api/brands/[slug]/repair-package/route.ts"
    source = route.read_text()

    assert "repairBrandPackage" in source
    assert "REPAIR_PACKAGE_ROUTE_TIMEOUT_MS" in source
    assert "docs" in source
    assert "tokens" in source
    assert "assets" in source
    assert "identity" in source
    assert "all" in source


def test_repair_package_library_runs_publish_and_extraction_scripts():
    source = (ROOT / "ui/lib/package-repair.ts").read_text()

    assert "export type RepairPackageMode" in source
    assert "repairBrandPackage" in source
    assert "scripts/publish_brand.py" in source
    assert "--docs-only" in source
    assert "--tokens-only" in source
    assert "scripts/extract_brand.py" in source
    assert "--skip-replicas" in source
    assert "--skip-validation" in source
    assert "--skip-publish" in source
    assert "--skip-existing" not in source
    assert 'normalizedMode === "all"' in source
    assert "Repair order:" in source
    assert "cleanupAgentBrowserSessions" in source
    assert "agent-browser" in source
    assert "cv-o-" in source
    assert "orig-" in source


def test_publish_brand_supports_repair_modes():
    source = (ROOT / "scripts/publish_brand.py").read_text()

    assert "--docs-only" in source
    assert "--tokens-only" in source
    assert "--enforce-readiness" in source
    assert "args.docs_only" in source
    assert "args.tokens_only" in source
    assert "args.enforce_readiness" in source
    assert "mode_actions" in source


def test_initial_pipeline_enforces_package_readiness_before_registering():
    extract_source = (ROOT / "scripts/extract_brand.py").read_text()
    ws_source = (ROOT / "scripts/ws_extraction_server.py").read_text()

    assert "--skip-publish" in extract_source
    assert "args.skip_publish" in extract_source
    assert "close_agent_browser_session" in extract_source
    assert "finally:" in extract_source
    assert '"--enforce-readiness"' in extract_source
    assert "fail(" in extract_source
    assert '"--enforce-readiness"' in ws_source


def test_validation_harness_closes_agent_browser_sessions():
    validation_source = (ROOT / "scripts/run_validation_loop.py").read_text()
    component_source = (ROOT / "scripts/component_validator.py").read_text()

    assert "close_agent_browser_session" in validation_source
    assert '["agent-browser", "close", "--session", session]' in validation_source
    assert "finally:" in validation_source
    assert "close_browser_session" in component_source
    assert "close_component_sessions_after" in component_source
    assert "cv-r-" in component_source
    assert "cv-o-" in component_source
