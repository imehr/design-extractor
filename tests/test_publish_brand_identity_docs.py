import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_publish_brand():
    spec = importlib.util.spec_from_file_location(
        "publish_brand", ROOT / "scripts/publish_brand.py"
    )
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def sample_tokens():
    return {
        "colours": {
            "palette": {
                "primary": "#1971ED",
                "footerDark": "#0E0D26",
                "text": "#202020",
            }
        },
        "typography": {
            "families": [{"value": "Montserrat"}, {"value": "Muli"}],
            "samples": {},
        },
        "layout": {"max_width": "1200px", "content_padding": "40px"},
    }


def sample_dom():
    return [
        {
            "header": {
                "logo": {"localFile": "assets/images/logo.svg"},
                "primaryNav": [{"text": "Who we are"}, {"text": "Investors"}],
            },
            "footer": {
                "logo": {"localFile": "assets/images/logo-white.svg"},
                "aboutUs": {"text": "Convenience, value and quality for customers."},
                "quickLinks": {
                    "column1": [{"text": "Home"}, {"text": "Careers"}],
                    "column2": [{"text": "Privacy policy"}],
                },
                "acknowledgementOfCountry": "Acknowledgement text from the live footer.",
                "copyright": "All Rights Reserved.",
            },
        }
    ]


def sample_section_dom():
    return [
        {
            "sections": [
                {
                    "tag": "header",
                    "links": [
                        {"text": "Alchain · 花叔", "href": "https://www.huasheng.ai/"},
                        {"text": "橙皮书", "href": "https://www.huasheng.ai/orange-books/"},
                        {"text": "洞察", "href": "https://www.huasheng.ai/insights/"},
                        {"text": "设计灵感", "href": "https://www.huasheng.ai/design-inspiration/"},
                        {"text": "签证地图", "href": "https://www.huasheng.ai/visa/"},
                    ],
                },
                {
                    "tag": "footer",
                    "text": [
                        "— Curated by huasheng.ai —",
                        "Last Verified · 2026.02 · All Links Active",
                    ],
                    "links": [{"text": "huasheng.ai", "href": "https://www.huasheng.ai/"}],
                },
            ]
        }
    ]


def sample_string_logo_dom():
    return [
        {
            "header": {
                "logo": "https://quantium.com/wp-content/themes/_quantium-sv/img/logo.svg",
                "primaryNav": [{"text": "Industries"}, {"text": "Solutions"}, {"text": "GenAI"}],
            },
            "footer": {
                "quickLinks": {
                    "column1": [{"text": "Industries"}, {"text": "Retail"}],
                    "column2": [{"text": "Privacy policy"}],
                },
            },
        }
    ]


def test_design_md_includes_extracted_identity_contract():
    module = load_publish_brand()

    design_md = module.generate_design_md(
        sample_tokens(), "Woolworths Group", "https://example.com", [], sample_dom()
    )

    assert "Mandatory identity rules" in design_md
    assert "assets/images/logo.svg" in design_md
    assert "assets/images/logo-white.svg" in design_md
    assert "Who we are" in design_md
    assert "Privacy policy" in design_md
    assert "Acknowledgement text from the live footer." in design_md


def test_design_md_includes_section_based_identity_contract():
    module = load_publish_brand()

    design_md = module.generate_design_md(
        sample_tokens(), "Huasheng Ai", "https://www.huasheng.ai/consulting", [], sample_section_dom()
    )

    assert "Alchain · 花叔" in design_md
    assert "橙皮书" in design_md
    assert "签证地图" in design_md
    assert "huasheng.ai" in design_md
    assert "Curated by huasheng.ai" in design_md
    assert "not captured" not in design_md.split("## Mandatory identity rules", 1)[1].split("##", 1)[0]


def test_design_md_accepts_string_shaped_header_logo():
    module = load_publish_brand()

    design_md = module.generate_design_md(
        sample_tokens(), "Quantium", "https://quantium.com", [], sample_string_logo_dom()
    )

    identity_rules = design_md.split("## Mandatory identity rules", 1)[1].split("##", 1)[0]
    assert "https://quantium.com/wp-content/themes/_quantium-sv/img/logo.svg" in identity_rules
    assert "Industries" in identity_rules
    assert "Privacy policy" in identity_rules
    assert "not captured" not in identity_rules


def test_token_synthesis_flattens_color_arrays_and_uses_page_fonts():
    module = load_publish_brand()

    tokens = module.synthesize_design_tokens(
        [
            {
                "colors": {
                    "backgrounds": ["rgb(255, 255, 255)", "rgb(0, 0, 0)"],
                    "text": [
                        "rgb(0, 0, 6)",
                        "rgb(51, 71, 91)",
                        "rgb(0, 145, 174)",
                    ],
                },
                "h1": {
                    "fontFamily": "quantium_promedium",
                    "fontSize": "48px",
                    "fontWeight": "500",
                    "lineHeight": "62px",
                    "color": "rgb(255, 255, 255)",
                },
                "bodyText": {
                    "fontFamily": "quantium_prolight",
                    "fontSize": "24px",
                    "fontWeight": "300",
                    "lineHeight": "28.8px",
                    "color": "rgb(255, 255, 255)",
                },
                "fontFamilies": [
                    "Times",
                    "Roboto, sans-serif",
                    "\"Font Awesome 5 Pro\"",
                ],
            }
        ],
        [],
        "Quantium",
    )

    palette = tokens["colours"]["palette"]
    assert palette["backgrounds"] == "#ffffff"
    assert palette["backgrounds_2"] == "#000000"
    assert palette["text_3"] == "#0091ae"
    assert all(not value.startswith("[") for value in palette.values())
    families = tokens["typography"]["families"]
    assert families[0]["role"] == "heading"
    assert families[0]["value"] == "quantium_promedium"
    assert families[1]["role"] == "body"
    assert families[1]["value"] == "quantium_prolight"


def test_design_md_google_spec_compliant():
    """Validate the generated DESIGN.md against the Google DESIGN.md spec."""
    import importlib.util
    import re

    dmw_spec = importlib.util.spec_from_file_location(
        "design_md_writer", ROOT / "scripts/design_md_writer.py"
    )
    dmw = importlib.util.module_from_spec(dmw_spec)
    assert dmw_spec.loader is not None
    dmw_spec.loader.exec_module(dmw)

    module = load_publish_brand()
    md = module.generate_design_md(
        sample_tokens(), "Woolworths Group", "https://example.com", [], sample_dom()
    )

    violations = dmw.validate_design_md(md)
    assert violations == [], "DESIGN.md spec violations:\n" + "\n".join(violations)

    parts = md.split("---", 2)
    assert len(parts) >= 3, "frontmatter fences missing"
    body = parts[2]

    canonical = dmw.CANONICAL_SECTIONS
    h2_re = re.compile(r"^## (.+)$", re.MULTILINE)
    h2s = [h.strip() for h in h2_re.findall(body)]

    found_canonical = [h for h in h2s if h in set(canonical)]
    expected = [s for s in canonical if s in set(h2s)]
    assert found_canonical == expected, (
        f"Section order mismatch.\nFound:    {found_canonical}\nExpected: {expected}"
    )

    import yaml
    fm = yaml.safe_load(parts[1])
    assert fm.get("name") == "Woolworths Group"
    assert "colors" in fm and "primary" in fm["colors"]

    token_ref_re = re.compile(r"\{([^{}]+)\}")

    def resolve(ref: str, d: dict) -> bool:
        node = d
        for part in ref.strip().split("."):
            if not isinstance(node, dict) or part not in node:
                return False
            node = node[part]
        return True

    resolved_refs = [ref for ref in token_ref_re.findall(body) if resolve(ref, fm)]
    assert len(resolved_refs) >= 3, (
        f"Expected at least 3 resolving token refs, found {len(resolved_refs)}"
    )

    seen: set = set()
    dupes = []
    for h in h2s:
        if h in seen:
            dupes.append(h)
        seen.add(h)
    assert dupes == [], f"Duplicate h2 headings: {dupes}"


def test_design_md_preserves_distinctive_extracted_tokens():
    """Brand-specific palettes must not collapse to black/white generic defaults."""
    import importlib.util
    import yaml

    dmw_spec = importlib.util.spec_from_file_location(
        "design_md_writer", ROOT / "scripts/design_md_writer.py"
    )
    dmw = importlib.util.module_from_spec(dmw_spec)
    assert dmw_spec.loader is not None
    dmw_spec.loader.exec_module(dmw)

    tokens = {
        "colours": {
            "palette": {
                "surfaceDark": "#202124",
                "surfaceWhite": "#ffffff",
                "brandOrange": "#f58220",
                "purpleAccent": "#a78bfa",
                "mutedBorder": "#a7abb3",
            }
        },
        "typography": {
            "families": [{"value": "\"Google Sans Flex\", Roboto"}, {"value": "Roboto"}],
            "sizes": [{"value": "16px"}, {"value": "28px"}, {"value": "68px"}],
            "detected_base_unit": "8px",
        },
        "radii": {"values": [{"value": "16px"}, {"value": "32px"}, {"value": "9999px"}]},
    }

    md = dmw.build_design_md(
        "ailearninglab-live",
        ROOT,
        tokens,
        voice={
            "brand_name": "AI Learning Lab",
            "source_url": "https://ailearninglab.live",
        },
    )

    assert dmw.validate_design_md(md) == []
    fm = yaml.safe_load(md.split("---", 2)[1])
    assert fm["colors"]["primary"] == "#F58220"
    assert fm["colors"]["surface-dark"] == "#202124"
    assert fm["colors"]["purple-accent"] == "#A78BFA"
    assert fm["typography"]["display"]["fontSize"] == "68px"
    assert fm["spacing"]["xs"] == "8px"
    assert "32px" in fm["rounded"].values()


def test_design_md_validator_ignores_code_block_braces():
    """CSS/TSX examples contain braces that are not DESIGN.md token refs."""
    import importlib.util

    dmw_spec = importlib.util.spec_from_file_location(
        "design_md_writer", ROOT / "scripts/design_md_writer.py"
    )
    dmw = importlib.util.module_from_spec(dmw_spec)
    assert dmw_spec.loader is not None
    dmw_spec.loader.exec_module(dmw)

    md = """---
name: Acme
colors:
  primary: "#111111"
  surface: "#FFFFFF"
typography:
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: 8px
spacing:
  md: 16px
components:
  card:
    backgroundColor: "{colors.surface}"
---

## Overview
Use `{colors.primary}`.
```css
.card { color: #111111; padding: 16px; }
```
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
"""

    assert dmw.validate_design_md(md) == []


def test_skill_md_includes_extracted_identity_contract():
    module = load_publish_brand()

    skill_md = module.generate_skill_md(
        "Woolworths Group",
        "woolworthsgroup-com-au",
        "https://example.com",
        sample_tokens(),
        sample_dom(),
    )

    assert "Mandatory identity rules" in skill_md
    assert "Use the extracted logo asset" in skill_md
    assert "Who we are" in skill_md
    assert "Privacy policy" in skill_md
    assert "Acknowledgement text from the live footer." in skill_md
