"""Unit tests for the improvement job helpers."""

import importlib.util
import json
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


def test_sync_metadata_with_report_uses_live_validation_score(tmp_path):
    module = _load_module("improvement_job", SCRIPTS / "improvement_job.py")

    brand_dir = tmp_path / "brand"
    validation_dir = brand_dir / "validation"
    validation_dir.mkdir(parents=True)

    metadata_path = brand_dir / "metadata.json"
    metadata_path.write_text(
        json.dumps(
            {
                "name": "Woolworths Group",
                "slug": "woolworthsgroup-com-au",
                "overall_score": 0.12,
                "validation_status": "0/1 GATES PASS",
            }
        )
    )

    report_path = validation_dir / "report.json"
    report_path.write_text(
        json.dumps(
            {
                "desktop_avg": 67.8,
                "overall_status": "7/8 GATES PASS",
            }
        )
    )

    synced = module.sync_metadata_with_report(metadata_path, report_path)

    assert synced["overall_score"] == 0.678
    assert synced["validation_status"] == "7/8 GATES PASS"


def test_detect_block_reason_flags_akamai_access_denied():
    module = _load_module("improvement_job", SCRIPTS / "improvement_job.py")

    blocked = module.detect_block_reason(
        """
        agent-browser open error: Access Denied
        Reference #18.8f6d3e17.1712900000.abcdef
        Powered by Akamai EdgeSuite
        """
    )

    assert blocked is not None
    assert blocked["code"] == "anti_bot_block"
    assert "Akamai" in blocked["detail"]


def test_detect_validation_failure_flags_connection_refused():
    module = _load_module("improvement_job", SCRIPTS / "improvement_job.py")

    failure = module.detect_validation_failure(
        """
        agent-browser open error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173
        Validation aborted: missing screenshots for homepage
        """
    )

    assert failure is not None
    assert failure["code"] == "local_ui_unreachable"


def test_build_assisted_capture_steps_include_working_fallback():
    module = _load_module("improvement_job", SCRIPTS / "improvement_job.py")

    steps = module.build_assisted_capture_steps("woolworthsgroup-com-au")

    assert any("headed browser" in step.lower() for step in steps)
    assert any("normal browser" in step.lower() or "manual browser" in step.lower() for step in steps)


def test_read_recent_feedback_entries_filters_by_brand(tmp_path):
    module = _load_module("improvement_job", SCRIPTS / "improvement_job.py")

    log_path = tmp_path / "feedback-log.jsonl"
    log_path.write_text(
        "\n".join(
            [
                json.dumps({"brand": "westpac-com-au", "feedback": {"notes": "Old"}}),
                json.dumps({"brand": "woolworthsgroup-com-au", "feedback": {"notes": "Tighten header and hero alignment"}}),
                json.dumps({"brand": "woolworthsgroup-com-au", "feedback": {"notes": "Improve footer spacing"}}),
            ]
        )
        + "\n"
    )

    entries = module.read_recent_feedback_entries(log_path, "woolworthsgroup-com-au", limit=2)

    assert len(entries) == 2
    assert entries[0]["feedback"]["notes"] == "Tighten header and hero alignment"
    assert entries[1]["feedback"]["notes"] == "Improve footer spacing"


def test_build_claude_improvement_prompt_includes_pages_and_feedback():
    module = _load_module("improvement_job", SCRIPTS / "improvement_job.py")

    prompt = module.build_claude_improvement_prompt(
        brand="woolworthsgroup-com-au",
        target_score=80.0,
        current_score=0.678,
        report_path=Path("/tmp/report.json"),
        manifest_path=Path("/tmp/improvement-manifest.json"),
        pages=[
            {
                "slug": "our-brands",
                "current_score": 64.1,
                "gap": 15.9,
                "replica_tsx": "ui/app/brands/woolworthsgroup-com-au/replica/our-brands/page.tsx",
            }
        ],
        inline_feedback={"operator_notes": "Focus on layout fidelity, not just colors."},
        recent_feedback=[
            {"feedback": {"notes": "Improve header/search alignment first."}},
        ],
    )

    assert "woolworthsgroup-com-au" in prompt
    assert "80.0%" in prompt
    assert "67.8%" in prompt
    assert "our-brands" in prompt
    assert "ui/app/brands/woolworthsgroup-com-au/replica/our-brands/page.tsx" in prompt
    assert "layout fidelity" in prompt
    assert "header/search alignment" in prompt


def test_build_claude_command_uses_print_prompt_and_tools():
    module = _load_module("improvement_job", SCRIPTS / "improvement_job.py")

    command = module.build_claude_command("Improve the failing pages.")

    assert command[:3] == ["claude", "--print", "-p"]
    assert "--permission-mode" in command
    assert "bypassPermissions" in command
    assert "--allowedTools" in command
    assert "--tools" in command


def test_missing_capture_pages_reports_pages_without_required_images():
    module = _load_module("run_validation_loop", SCRIPTS / "run_validation_loop.py")

    missing = module.missing_capture_pages(
        {
            "homepage": {"original": "/tmp/orig-homepage.png", "replica": None},
            "credit-cards": {"original": None, "replica": "/tmp/repl-credit-cards.png"},
            "contact-us": {"original": "/tmp/orig-contact-us.png", "replica": "/tmp/repl-contact-us.png"},
        }
    )

    assert missing == ["homepage", "credit-cards"]
