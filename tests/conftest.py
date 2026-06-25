"""Shared pytest fixtures / path setup.

Several scripts import sibling modules from scripts/ (e.g. proc_utils,
improvement_job). When a test loads one of those scripts by file path via
importlib, the script's directory is not automatically on sys.path, so the
sibling import fails. Putting scripts/ on sys.path here mirrors how the scripts
run in production (invoked as `python scripts/<name>.py`, where sys.path[0] is
the script directory).
"""

import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
