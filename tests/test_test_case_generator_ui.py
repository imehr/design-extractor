from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_test_case_actions_abort_instead_of_spinning_forever():
    page = (ROOT / "ui/app/brands/[slug]/page.tsx").read_text()

    assert "TEST_CASE_REQUEST_TIMEOUT_MS" in page
    assert "AbortController" in page
    assert "window.setTimeout" in page
    assert "signal: controller.signal" in page
    assert "Timed out while loading test cases" in page


def test_test_case_manifest_declares_model_backed_generator():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "generator:" in source
    assert "resolveTaskModelSelection" in source
    assert "provider_label" in source
    assert "provider_type" in source
    assert "project_override" in source
    assert "uses_model: true" in source
    assert "GENERATOR_VERSION" in source
    assert "resolveTestCaseGeneratorSettings" in source
    assert "model_control" in source


def test_test_case_generator_stales_old_local_outputs():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "generatorChanged" in source
    assert "manifest?.generator?.version !== generator.version" in source
    assert "manifest?.generator?.provider !== generator.provider" in source
    assert "manifest?.generator?.model !== generator.model" in source
    assert 'sourceChanged || generatorChanged ? "stale"' in source


def test_test_case_generator_requires_brand_identity_quality_gates():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "package_quality" in source
    assert "buildPackageQuality" in source
    assert "logo-asset" in source
    assert "header-navigation" in source
    assert "footer-system" in source
    assert "skill-logo-header-footer" in source


def test_test_case_source_hash_includes_skill_file():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()
    hash_section = source.split("async function computeSourceHash", 1)[1].split(
        "async function addDirToHash", 1
    )[0]

    assert 'path.join(brandDir, "skill", "SKILL.md")' in hash_section


def test_test_case_html_prevents_logo_from_collapsing():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "brand-logo" in source
    assert "flex: 0 0 auto" in source
    assert "width: clamp(150px, 18vw, 230px)" in source
    assert "height: auto" in source


def test_test_case_route_allows_model_generation_time():
    route = (ROOT / "ui/app/api/brands/[slug]/test-cases/route.ts").read_text()
    page = (ROOT / "ui/app/brands/[slug]/page.tsx").read_text()

    assert "const TEST_CASE_ROUTE_TIMEOUT_MS = 180000" in route
    assert "const TEST_CASE_REQUEST_TIMEOUT_MS = 180000" in page


def test_test_case_generator_consumes_model_brief_in_rendering():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "GeneratedTestCaseBrief" in source
    assert "parseClaudeTestCaseBrief" in source
    assert "briefsByCase" in source
    assert "renderTestCase(context, item.id, briefsByCase.get(item.id))" in source


def test_test_case_showcase_renders_full_token_catalog():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "renderTokenMatrix" in source
    assert "Typography tokens" in source
    assert "Spacing tokens" in source
    assert "Radius tokens" in source
    assert "Shadow tokens" in source
    assert "Breakpoint tokens" in source


def test_test_case_deck_embeds_logo_inside_slides():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "renderSlideLogo" in source
    assert "brand-slide-logo" in source
    assert "Generated six-slide-deck is missing slide logo treatment" in source


def test_test_case_footer_uses_extracted_footer_anatomy():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "renderBrandFooter" in source
    assert "footerColumns" in source
    assert "footerAcknowledgement" in source
    assert "brand-footer-link-grid" in source


def test_package_quality_requires_extracted_or_component_evidence_not_doc_mentions():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()
    quality_section = source.split("function buildPackageQuality", 1)[1].split(
        "async function readJson", 1
    )[0]

    assert "context.logoSrc || context.brandMarkLabel" in quality_section
    assert "context.navLabels.length >= 3 || context.componentEvidence.navigation" in quality_section
    assert "hasFooterEvidence" in quality_section
    assert "white-logo-asset" in quality_section
    assert "brand-imagery" in quality_section
    assert "required: true" in quality_section
    assert "|| /header|navigation|nav/.test(designMd)" not in quality_section
    assert "|| /footer/.test(designMd)" not in quality_section


def test_test_case_context_reads_section_identity_evidence():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "collectIdentitySections" in source
    assert "collectBrandMarkLabel" in source
    assert "extractComponentEvidence" in source
    assert "brandMarkLabel" in source


def test_test_case_logo_picker_uses_source_evidence_before_client_logos():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "collectLogoEvidence" in source
    assert "scoreLogoCandidate" in source
    assert "matchedEvidence" in source
    assert "looksLikeClientLogo" in source
    assert "name === \"logo.svg\"" in source


def test_test_case_palette_and_fonts_handle_brand_specific_tokens():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "colorValuesFromUnknown" in source
    assert "isChromaticColor" in source
    assert "role: stringValue(entry.role).toLowerCase()" in source
    assert "font awesome|material icons" in source
    assert "listBrandFontFaces" in source
    assert "@font-face" in source
    assert "font-display: swap" in source


def test_test_cases_ui_has_repair_before_generate_workflow():
    page = (ROOT / "ui/app/brands/[slug]/page.tsx").read_text()

    assert "repairingPackage" in page
    assert "handleRepairPackage" in page
    assert "/repair-package" in page
    assert "Repair docs" in page
    assert "Repair tokens" in page
    assert "Repair assets" in page
    assert "Repair all" in page
    assert 'onRepairPackage("all")' in page
    assert "Fix package first" in page
    assert "repairStatusMessage" in page
    assert "REPAIR_PACKAGE_REQUEST_TIMEOUT_MS" in page
    assert "Repair running" in page
