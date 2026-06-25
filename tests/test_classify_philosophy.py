"""Tests for the 20-philosophy classifier."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

_SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(_SCRIPTS))

from philosophy_index import PHILOSOPHIES, REQUIRED_KEYS  # noqa: E402
from classify_philosophy import classify_brand  # noqa: E402


# ---------------------------------------------------------------------------
# Index sanity
# ---------------------------------------------------------------------------

def test_philosophies_has_exactly_20_entries() -> None:
    assert len(PHILOSOPHIES) == 20


def test_each_entry_has_required_keys() -> None:
    for entry in PHILOSOPHIES:
        for key in REQUIRED_KEYS:
            assert key in entry, f"missing key '{key}' in entry {entry.get('name', '<unnamed>')}"
        pal = entry["palette_constraint"]
        for sub in ("max_accents", "monochrome", "high_contrast", "vivid"):
            assert sub in pal, f"palette_constraint missing '{sub}' in {entry['name']}"
        assert isinstance(entry["whitespace_ratio"], (int, float))
        assert 0.0 <= float(entry["whitespace_ratio"]) <= 1.0
        assert entry["display_font_class"] in {
            "serif", "sans", "geometric-sans", "humanist-sans", "mono", "display-serif",
        }
        assert 0.0 <= float(entry["hierarchy_strictness"]) <= 1.0
        assert entry["corner_language"] in {"sharp", "soft", "rounded", "pill", "mixed"}
        assert entry["family"] in {
            "information-architecture", "motion-poetics", "minimalism",
            "experimental", "eastern-philosophy",
        }


def test_philosophy_names_are_unique() -> None:
    names = [p["name"] for p in PHILOSOPHIES]
    assert len(set(names)) == len(names)


# ---------------------------------------------------------------------------
# Classifier behaviour
# ---------------------------------------------------------------------------

def _minimal_tokens() -> dict:
    """Minimal but realistic tokens shaped like the live extractor output."""
    return {
        "colours": {
            "palette": {
                "primary": "rgb(0, 145, 174)",
                "dark": "rgb(0, 0, 6)",
                "backgroundLight": "rgb(255, 255, 255)",
                "footerDark": "rgb(0, 0, 0)",
                "text_rgb(255, 255, 255)": "rgb(255, 255, 255)",  # noise key — must be filtered
            }
        },
        "typography": {
            "families": [
                {"role": "heading", "value": "Helvetica", "count": 50},
                {"role": "body", "value": "Helvetica", "count": 100},
            ]
        },
        "borders": {
            "radii": [
                {"value": "0px", "count": 5},
                {"value": "4px", "count": 5},
                {"value": "9999px", "count": 5},
            ]
        },
        "layout": {
            "max_width": "1200px",
            "content_padding": "40px",
        },
    }


def test_classify_returns_three_rows_sorted_desc() -> None:
    rows = classify_brand(_minimal_tokens())
    assert len(rows) == 3
    # Similarity in [0, 1].
    for r in rows:
        assert 0.0 <= r["similarity"] <= 1.0
        assert "name" in r and "family" in r and "rationale" in r
    # Sorted descending.
    sims = [r["similarity"] for r in rows]
    assert sims == sorted(sims, reverse=True)


def test_classify_is_deterministic() -> None:
    tokens = _minimal_tokens()
    a = classify_brand(tokens)
    b = classify_brand(tokens)
    assert a == b


def test_classify_handles_missing_layout_padding() -> None:
    """0px content_padding (extractor noise) must not crash or produce NaN scores."""
    tokens = _minimal_tokens()
    tokens["layout"]["content_padding"] = "0px"
    rows = classify_brand(tokens)
    assert len(rows) == 3
    for r in rows:
        assert 0.0 <= r["similarity"] <= 1.0


def test_classify_with_patterns_argument() -> None:
    tokens = _minimal_tokens()
    rows = classify_brand(tokens, patterns={"type_scale_ratio": 1.25})
    assert len(rows) == 3


if __name__ == "__main__":  # pragma: no cover
    sys.exit(pytest.main([__file__, "-xvs"]))
