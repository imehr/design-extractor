"""20-philosophy design DNA index.

Adapted from huashu-design's `references/design-styles.md` (v2.1, 2026-02-13).
Original Chinese text is paraphrased into concise English token-shaped DNA so the
classifier can compare it against an extracted `design-tokens.json` without
copying huashu's prose verbatim.

Each entry has the same shape so `classify_brand` can score uniformly:

    name                 English title (e.g. "Pentagram Information Architecture")
    family               One of: information-architecture | motion-poetics |
                          minimalism | experimental | eastern-philosophy
    palette_constraint   {max_accents, monochrome, high_contrast, vivid}
    whitespace_ratio     Float 0-1, target whitespace (huashu's stated number when given)
    display_font_class   serif | sans | geometric-sans | humanist-sans | mono |
                          display-serif
    hierarchy_strictness 0-1, high = strict modular type scale
    corner_language      sharp | soft | rounded | pill | mixed
    notes                One-line summary
"""
from __future__ import annotations


PHILOSOPHIES: list[dict] = [
    # --- Family 1: Information Architecture (01-04) -----------------------
    {
        "name": "Pentagram Information Architecture",
        "family": "information-architecture",
        "palette_constraint": {"max_accents": 1, "monochrome": False, "high_contrast": True, "vivid": False},
        "whitespace_ratio": 0.60,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.95,
        "corner_language": "sharp",
        "notes": "Helvetica/Univers Swiss-grid editorial; black/white plus one accent.",
    },
    {
        "name": "Stamen Data Cartography",
        "family": "information-architecture",
        "palette_constraint": {"max_accents": 4, "monochrome": False, "high_contrast": False, "vivid": False},
        "whitespace_ratio": 0.45,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.65,
        "corner_language": "soft",
        "notes": "Cartographic, organic palette (terracotta, sage, deep blue); layered like topo maps.",
    },
    {
        "name": "Information Architects Content-First",
        "family": "information-architecture",
        "palette_constraint": {"max_accents": 1, "monochrome": False, "high_contrast": True, "vivid": False},
        "whitespace_ratio": 0.35,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.85,
        "corner_language": "sharp",
        "notes": "System fonts only; classic blue hyperlinks; text-heavy reading-first.",
    },
    {
        "name": "Fathom Scientific Narrative",
        "family": "information-architecture",
        "palette_constraint": {"max_accents": 2, "monochrome": False, "high_contrast": False, "vivid": False},
        "whitespace_ratio": 0.40,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.90,
        "corner_language": "sharp",
        "notes": "Scientific-journal precision; grays + navy + one highlight; dense but uncluttered.",
    },

    # --- Family 2: Motion Poetics (05-08) ---------------------------------
    {
        "name": "Locomotive Scroll Narrative",
        "family": "motion-poetics",
        "palette_constraint": {"max_accents": 2, "monochrome": False, "high_contrast": True, "vivid": False},
        "whitespace_ratio": 0.55,
        "display_font_class": "geometric-sans",
        "hierarchy_strictness": 0.55,
        "corner_language": "sharp",
        "notes": "Cinematic dark-mode parallax; bold typography emerging from black; glowing accents.",
    },
    {
        "name": "Active Theory WebGL",
        "family": "motion-poetics",
        "palette_constraint": {"max_accents": 3, "monochrome": False, "high_contrast": True, "vivid": True},
        "whitespace_ratio": 0.30,
        "display_font_class": "geometric-sans",
        "hierarchy_strictness": 0.35,
        "corner_language": "rounded",
        "notes": "3D particle systems on dark; neon cyan/magenta/electric-blue; glassmorphism.",
    },
    {
        "name": "Field.io Generative",
        "family": "motion-poetics",
        "palette_constraint": {"max_accents": 1, "monochrome": True, "high_contrast": True, "vivid": True},
        "whitespace_ratio": 0.40,
        "display_font_class": "geometric-sans",
        "hierarchy_strictness": 0.50,
        "corner_language": "sharp",
        "notes": "Algorithmic geometry; monochromatic base + vivid accent; Voronoi/Delaunay vibe.",
    },
    {
        "name": "Resn Interactive Storytelling",
        "family": "motion-poetics",
        "palette_constraint": {"max_accents": 4, "monochrome": False, "high_contrast": False, "vivid": True},
        "whitespace_ratio": 0.35,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.30,
        "corner_language": "rounded",
        "notes": "Editorial illustration meets product UI; warm palette; gamified scroll narrative.",
    },

    # --- Family 3: Minimalism (09-12) -------------------------------------
    {
        "name": "Experimental Jetset Conceptual",
        "family": "minimalism",
        "palette_constraint": {"max_accents": 3, "monochrome": False, "high_contrast": True, "vivid": True},
        "whitespace_ratio": 0.55,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.80,
        "corner_language": "sharp",
        "notes": "Mondrian primaries (red/blue/yellow) + black/white; type as graphic; no photography.",
    },
    {
        "name": "Muller-Brockmann Swiss Grid",
        "family": "minimalism",
        "palette_constraint": {"max_accents": 1, "monochrome": False, "high_contrast": True, "vivid": False},
        "whitespace_ratio": 0.55,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 1.0,
        "corner_language": "sharp",
        "notes": "8pt baseline grid; strict alignment; Akzidenz-Grotesk; two-color maximum.",
    },
    {
        "name": "Build Studio Luxury Minimalism",
        "family": "minimalism",
        "palette_constraint": {"max_accents": 1, "monochrome": False, "high_contrast": False, "vivid": False},
        "whitespace_ratio": 0.70,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.70,
        "corner_language": "sharp",
        "notes": "70%+ whitespace; subtle weight shifts (200-600); single accent used sparingly.",
    },
    {
        "name": "Sagmeister Walsh Joyful",
        "family": "minimalism",
        "palette_constraint": {"max_accents": 5, "monochrome": False, "high_contrast": False, "vivid": True},
        "whitespace_ratio": 0.50,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.35,
        "corner_language": "mixed",
        "notes": "Unexpected color bursts on minimal base; handmade-digital mix; experimental but legible.",
    },

    # --- Family 4: Experimental (13-16) -----------------------------------
    {
        "name": "Zach Lieberman Code-as-Art",
        "family": "experimental",
        "palette_constraint": {"max_accents": 0, "monochrome": True, "high_contrast": True, "vivid": False},
        "whitespace_ratio": 0.50,
        "display_font_class": "mono",
        "hierarchy_strictness": 0.40,
        "corner_language": "sharp",
        "notes": "Hand-drawn aesthetic generated by code; black and white only; sketch line quality.",
    },
    {
        "name": "Raven Kwok Parametric",
        "family": "experimental",
        "palette_constraint": {"max_accents": 0, "monochrome": True, "high_contrast": True, "vivid": False},
        "whitespace_ratio": 0.30,
        "display_font_class": "mono",
        "hierarchy_strictness": 0.50,
        "corner_language": "sharp",
        "notes": "Fractal/recursive structures; high-contrast B&W; intricate detail rewards zooming.",
    },
    {
        "name": "Ash Thorp Cinematic Cyberpunk",
        "family": "experimental",
        "palette_constraint": {"max_accents": 2, "monochrome": False, "high_contrast": True, "vivid": True},
        "whitespace_ratio": 0.25,
        "display_font_class": "geometric-sans",
        "hierarchy_strictness": 0.40,
        "corner_language": "sharp",
        "notes": "Warm cyberpunk (orange/teal, not cold blue); volumetric lighting; industrial luxury.",
    },
    {
        "name": "Territory Studio FUI",
        "family": "experimental",
        "palette_constraint": {"max_accents": 2, "monochrome": False, "high_contrast": True, "vivid": True},
        "whitespace_ratio": 0.20,
        "display_font_class": "mono",
        "hierarchy_strictness": 0.55,
        "corner_language": "sharp",
        "notes": "Fantasy User Interface; amber or cyan monochrome; multilayer data readouts.",
    },

    # --- Family 5: Eastern Philosophy (17-20) -----------------------------
    {
        "name": "Takram Japanese Speculative",
        "family": "eastern-philosophy",
        "palette_constraint": {"max_accents": 2, "monochrome": False, "high_contrast": False, "vivid": False},
        "whitespace_ratio": 0.65,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.65,
        "corner_language": "soft",
        "notes": "Soft tech aesthetic; rounded corners + gentle shadows; muted naturals (beige/sage/gray).",
    },
    {
        "name": "Kenya Hara Emptiness",
        "family": "eastern-philosophy",
        "palette_constraint": {"max_accents": 0, "monochrome": True, "high_contrast": False, "vivid": False},
        "whitespace_ratio": 0.80,
        "display_font_class": "humanist-sans",
        "hierarchy_strictness": 0.70,
        "corner_language": "sharp",
        "notes": "80%+ whitespace; layered whites; paper-tactility; design by subtraction.",
    },
    {
        "name": "Irma Boom Book Architecture",
        "family": "eastern-philosophy",
        "palette_constraint": {"max_accents": 3, "monochrome": False, "high_contrast": False, "vivid": True},
        "whitespace_ratio": 0.30,
        "display_font_class": "display-serif",
        "hierarchy_strictness": 0.45,
        "corner_language": "sharp",
        "notes": "Non-linear info structure; unexpected color combos (pink+red, orange+brown); margin play.",
    },
    {
        "name": "Neo Shen Poetic Chinese",
        "family": "eastern-philosophy",
        "palette_constraint": {"max_accents": 3, "monochrome": False, "high_contrast": False, "vivid": False},
        "whitespace_ratio": 0.60,
        "display_font_class": "serif",
        "hierarchy_strictness": 0.45,
        "corner_language": "soft",
        "notes": "Digital ink-wash; soft glow; emotional palette (deep blue, warm gray, soft gold).",
    },
]


REQUIRED_KEYS: tuple[str, ...] = (
    "name",
    "family",
    "palette_constraint",
    "whitespace_ratio",
    "display_font_class",
    "hierarchy_strictness",
    "corner_language",
    "notes",
)
