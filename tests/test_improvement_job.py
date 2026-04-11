"""Unit tests for the improvement job helpers."""

import importlib.util
import json
from pathlib import Path


SCRIPTS = Path("/Users/mehran/Documents/github/design-extractor/scripts")


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
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
                "viewport_avg": 67.8,
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


def test_build_assisted_capture_steps_include_working_fallback():
    module = _load_module("improvement_job", SCRIPTS / "improvement_job.py")

    steps = module.build_assisted_capture_steps("woolworthsgroup-com-au")

    assert any("headed browser" in step.lower() for step in steps)
    assert any("normal browser" in step.lower() or "manual browser" in step.lower() for step in steps)
