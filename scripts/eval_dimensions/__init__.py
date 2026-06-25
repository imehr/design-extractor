"""EVAL dimensions — each module registers a Dimension with eval_rubric.

Import order = registry order = stable schema order for rubric-report.json.
"""

# Real (Phase-1) dimensions
from . import pixel_desktop          # noqa: F401
from . import component_completeness # noqa: F401
from . import pattern_fidelity       # noqa: F401
from . import asset_fidelity         # noqa: F401
from . import anti_slop              # noqa: F401  (stub — Phase 2.3)

# Phase-2 stubs (registered so the report schema is stable)
from . import pixel_mobile           # noqa: F401
from . import pixel_tablet           # noqa: F401
from . import interactive_state      # noqa: F401
from . import font_rendering         # noqa: F401
