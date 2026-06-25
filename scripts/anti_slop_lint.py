#!/usr/bin/env python3
"""
Anti-slop lint for generated brand replicas.

Phase 2.3 of docs/plans/2026-05-14-extraction-quality-and-design-md-overhaul.md.

Scans generated *.tsx files under a brand's replica directory for banned
patterns derived from the huashu-design §6 anti-slop checklist:

  - cyber-neon-gradient      (high)     loud neon/saturated linear gradients
  - github-dark-hero         (medium)   GitHub-dark-mode hero hex colours
  - emoji-as-icon            (high)     emoji codepoints used as icons in JSX
  - inter-display-font       (low)      Inter as a display/heading font
  - border-l-accent          (medium)   classic 2020-era left-border accent card

Patterns that ALSO appear in the source DOM extraction are whitelisted for
that brand (the original site uses them, so the replica isn't slopping —
it's faithful).

CLI:
  python3 scripts/anti_slop_lint.py --slug <brand-slug>
  python3 scripts/anti_slop_lint.py --file path/to/file.tsx    # ad-hoc lint

Library API:
  lint_brand(slug, brand_dir, replica_dir, source_dom_dir) -> dict
  lint_file(path, whitelist) -> list[Violation]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable


# ---------------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------------

# Emoji codepoint ranges per the spec (Misc Symbols, Dingbats, Misc Symbols &
# Pictographs, Emoticons, Transport, Supplemental Symbols, Symbols & Pictographs
# Extended-A).
_EMOJI_RANGES = [
    (0x1F300, 0x1F9FF),
    (0x2600, 0x27BF),
]
_EMOJI_CHAR_CLASS = "[" + "".join(
    f"\\U{lo:08X}-\\U{hi:08X}" for lo, hi in _EMOJI_RANGES
) + "]"
_EMOJI_RE = re.compile(_EMOJI_CHAR_CLASS)

# Cyber-neon gradients: linear-gradient containing a dark/neon hex, OR the
# common Tailwind purple→blue / pink→purple combos.
_NEON_HEX_RE = re.compile(
    r"linear-gradient[^;{}\n]*#0[D-F][0-9A-Fa-f]{4}",
    re.IGNORECASE,
)
_NEON_TW_RE = re.compile(
    r"\b(?:from|via|to)-(?:purple|fuchsia|pink|violet|indigo)-\d{3}"
    r"[\s\"']?[^\"'>]{0,80}?\b(?:from|via|to)-(?:blue|cyan|teal|sky|pink|fuchsia)-\d{3}",
    re.IGNORECASE,
)

# GitHub-dark hero hexes (background contexts only).
_GH_HEXES = ("#0D1117", "#1A1F2E", "#0F1419")
_GH_RE = re.compile(
    r"(?:bg-\[#(?:0D1117|1A1F2E|0F1419)\]"
    r"|backgroundColor\s*:\s*['\"]#(?:0D1117|1A1F2E|0F1419)['\"]"
    r"|background\s*:\s*['\"][^'\"]*#(?:0D1117|1A1F2E|0F1419))",
    re.IGNORECASE,
)

# Inter for display: font-display Tailwind utility (when Inter is the configured
# display family) is hard to detect statically — we flag explicit fontFamily
# 'Inter' on h1/h2/h3 and Tailwind `font-display` class adjacent to a heading.
# Coarse heuristic: a heading tag whose props contain Inter, OR Inter listed
# as the family for a "display"/"heading" CSS rule on the same line.
_INTER_HEADING_RE = re.compile(
    r"<h[1-3][^>]*(?:fontFamily\s*:\s*['\"]Inter|font-(?:display|heading)[^\"]*['\"])",
    re.IGNORECASE,
)
_INTER_DISPLAY_RE = re.compile(
    r"(?:display|heading|h[1-3])[^{};\n]*fontFamily\s*:\s*['\"]Inter",
    re.IGNORECASE,
)

# Tailwind border-l-N + border-COLOR-N on a card-ish element.
_BORDER_ACCENT_RE = re.compile(
    r"className\s*=\s*['\"][^'\"]*"
    r"(?=[^'\"]*\bborder-l-\d+\b)"
    r"(?=[^'\"]*\bborder-(?:red|blue|green|amber|orange|yellow|indigo|violet|"
    r"purple|pink|fuchsia|cyan|teal|sky|emerald|lime|rose)-\d{3}\b)"
    r"(?=[^'\"]*\b(?:card|rounded)[^'\"]*)"
    r"[^'\"]*['\"]",
    re.IGNORECASE,
)


@dataclass
class Violation:
    file: str
    line: int
    rule: str
    snippet: str
    severity: str  # "high" | "medium" | "low"

    def to_dict(self) -> dict:
        return asdict(self)


RULE_SEVERITY = {
    "cyber-neon-gradient": "high",
    "github-dark-hero": "medium",
    "emoji-as-icon": "high",
    "inter-display-font": "low",
    "border-l-accent": "medium",
}


# ---------------------------------------------------------------------------
# Whitelist (from source DOM extraction)
# ---------------------------------------------------------------------------

# Substrings whose presence in the SOURCE DOM whitelists the rule for the brand.
_WHITELIST_PROBES: dict[str, tuple[str, ...]] = {
    "cyber-neon-gradient": ("linear-gradient",),  # only meaningful with hex below
    "github-dark-hero": ("#0d1117", "#1a1f2e", "#0f1419"),
    "emoji-as-icon": (),  # checked dynamically per-emoji char
    "inter-display-font": ("Inter",),
    "border-l-accent": ("border-left",),
}


def build_whitelist(source_dom_dir: Path) -> set[str]:
    """Inspect source DOM JSON dumps; return the set of rule names to skip.

    Coarse substring matching is intentional — we want false-negatives on
    whitelisting (i.e., we'd rather flag a real slop than miss one) but every
    failure mode is "the user gets one extra warning to dismiss".
    """
    whitelisted: set[str] = set()
    if not source_dom_dir or not source_dom_dir.exists():
        return whitelisted

    # Concatenate up to N json files to bound IO.
    blob_parts: list[str] = []
    count = 0
    for f in sorted(source_dom_dir.iterdir()):
        if count >= 50:
            break
        if f.suffix.lower() != ".json":
            continue
        try:
            blob_parts.append(f.read_text(errors="ignore"))
            count += 1
        except OSError:
            continue
    blob = "\n".join(blob_parts)
    blob_lower = blob.lower()

    # cyber-neon-gradient: only whitelist if source has a linear-gradient that
    # also references one of the neon hex prefixes.
    if "linear-gradient" in blob_lower and _NEON_HEX_RE.search(blob):
        whitelisted.add("cyber-neon-gradient")

    # github-dark-hero
    for probe in _WHITELIST_PROBES["github-dark-hero"]:
        if probe in blob_lower:
            whitelisted.add("github-dark-hero")
            break

    # emoji-as-icon: whitelist if source contains ANY emoji codepoint.
    if _EMOJI_RE.search(blob):
        whitelisted.add("emoji-as-icon")

    # inter-display-font: whitelist if Inter appears in the source as a font.
    if "inter" in blob_lower and (
        '"inter"' in blob_lower
        or "'inter'" in blob_lower
        or "font-family" in blob_lower and "inter" in blob_lower
    ):
        whitelisted.add("inter-display-font")

    # border-l-accent: only whitelist when source has border-left with a
    # noticeable width (3px+ — anything thinner is a divider, not an accent).
    if re.search(r"border-left\s*:\s*\d{1,2}px\s+solid", blob, re.IGNORECASE):
        # require width >= 3px
        widths = [int(m) for m in re.findall(r"border-left\s*:\s*(\d{1,2})px", blob, re.IGNORECASE)]
        if any(w >= 3 for w in widths):
            whitelisted.add("border-l-accent")

    return whitelisted


# ---------------------------------------------------------------------------
# File scanning
# ---------------------------------------------------------------------------

def _scan_line(line: str) -> Iterable[tuple[str, str]]:
    """Yield (rule, snippet) tuples for a single line of TSX source."""
    # cyber-neon-gradient
    m = _NEON_HEX_RE.search(line)
    if m:
        yield "cyber-neon-gradient", line.strip()[:200]
    m2 = _NEON_TW_RE.search(line)
    if m2:
        yield "cyber-neon-gradient", line.strip()[:200]

    # github-dark-hero
    if _GH_RE.search(line):
        yield "github-dark-hero", line.strip()[:200]

    # emoji-as-icon — only flag emoji used as the *child* of an icon-ish JSX
    # element to keep false-positives manageable.
    if _EMOJI_RE.search(line):
        # Pattern: >EMOJI< (i.e., direct text child between JSX tags) is the
        # canonical "emoji-as-icon" shape.
        if re.search(rf">\s*{_EMOJI_CHAR_CLASS}\s*<", line):
            yield "emoji-as-icon", line.strip()[:200]
        # className="icon"-style wrappers
        elif re.search(
            rf"<(?:i|span)[^>]*(?:icon|emoji)[^>]*>\s*{_EMOJI_CHAR_CLASS}",
            line,
            re.IGNORECASE,
        ):
            yield "emoji-as-icon", line.strip()[:200]

    # inter-display-font
    if _INTER_HEADING_RE.search(line) or _INTER_DISPLAY_RE.search(line):
        yield "inter-display-font", line.strip()[:200]

    # border-l-accent
    if _BORDER_ACCENT_RE.search(line):
        yield "border-l-accent", line.strip()[:200]


def lint_file(path: Path, whitelist: set[str] | None = None) -> list[Violation]:
    """Lint a single TSX/JSX file. Returns a list of Violation."""
    whitelist = whitelist or set()
    try:
        text = path.read_text(errors="ignore")
    except OSError:
        return []

    out: list[Violation] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for rule, snippet in _scan_line(line):
            if rule in whitelist:
                continue
            out.append(Violation(
                file=str(path),
                line=lineno,
                rule=rule,
                snippet=snippet,
                severity=RULE_SEVERITY.get(rule, "medium"),
            ))
    return out


def _iter_tsx_files(root: Path) -> Iterable[Path]:
    if not root.exists():
        return
    for f in root.rglob("*.tsx"):
        # Skip node_modules / .next just in case.
        if any(part in {"node_modules", ".next", "dist", "build"} for part in f.parts):
            continue
        yield f


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def lint_brand(
    slug: str,
    brand_dir: Path,
    replica_dir: Path,
    source_dom_dir: Path,
) -> dict:
    """Lint every TSX file under replica_dir, whitelisting against source DOM.

    Returns:
      {
        "slug": "...",
        "violations": [Violation.to_dict(), ...],
        "violation_count": int,
        "files_scanned": int,
        "whitelist_applied": [rule, ...],
      }
    """
    whitelist = build_whitelist(source_dom_dir)
    violations: list[Violation] = []
    scanned = 0
    for tsx in _iter_tsx_files(replica_dir):
        scanned += 1
        violations.extend(lint_file(tsx, whitelist=whitelist))

    # Rebase file paths to repo-relative when possible for nicer reporting.
    repo_root = _guess_repo_root(replica_dir)
    if repo_root:
        for v in violations:
            try:
                v.file = str(Path(v.file).relative_to(repo_root))
            except ValueError:
                pass

    return {
        "slug": slug,
        "violations": [v.to_dict() for v in violations],
        "violation_count": len(violations),
        "files_scanned": scanned,
        "whitelist_applied": sorted(whitelist),
    }


def _guess_repo_root(start: Path) -> Path | None:
    cur = start.resolve()
    for _ in range(8):
        if (cur / ".git").exists():
            return cur
        if cur.parent == cur:
            return None
        cur = cur.parent
    return None


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

_REPO_ROOT = Path(__file__).resolve().parent.parent


def _resolve_paths(slug: str) -> tuple[Path, Path, Path, Path]:
    brand_dir = _REPO_ROOT / "brands" / slug
    replica_dir = _REPO_ROOT / "ui" / "app" / "brands" / slug / "replica"
    source_dom_dir = Path.home() / ".claude" / "design-library" / "cache" / slug / "dom-extraction"
    out_path = brand_dir / "validation" / "anti-slop-report.json"
    return brand_dir, replica_dir, source_dom_dir, out_path


def _print_table(report: dict) -> None:
    by_rule: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for v in report["violations"]:
        by_rule[v["rule"]] = by_rule.get(v["rule"], 0) + 1
        by_severity[v["severity"]] = by_severity.get(v["severity"], 0) + 1

    print("=" * 64)
    print(f"  anti-slop lint -- slug: {report['slug']}")
    print("=" * 64)
    print(f"  files scanned     : {report['files_scanned']}")
    print(f"  total violations  : {report['violation_count']}")
    if report["whitelist_applied"]:
        print(f"  whitelisted rules : {', '.join(report['whitelist_applied'])}")
    else:
        print("  whitelisted rules : (none -- source DOM had no matching patterns)")
    print("-" * 64)
    if by_rule:
        print("  by rule:")
        for rule, n in sorted(by_rule.items(), key=lambda kv: -kv[1]):
            sev = RULE_SEVERITY.get(rule, "?")
            print(f"    {rule:<22s} {n:>4d}   [{sev}]")
    if by_severity:
        print("  by severity:")
        for sev, n in sorted(by_severity.items(), key=lambda kv: -kv[1]):
            print(f"    {sev:<22s} {n:>4d}")
    print("=" * 64)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Lint generated replicas for AI-slop patterns.")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--slug", help="Brand slug (looks under ui/app/brands/<slug>/replica)")
    g.add_argument("--file", help="Lint a single TSX file (no whitelist)")
    ap.add_argument("--output", help="Override the report JSON output path")
    args = ap.parse_args(argv)

    if args.file:
        viols = lint_file(Path(args.file))
        report = {
            "slug": "<file>",
            "violations": [v.to_dict() for v in viols],
            "violation_count": len(viols),
            "files_scanned": 1,
            "whitelist_applied": [],
        }
        _print_table(report)
        if args.output:
            out = Path(args.output)
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(json.dumps(report, indent=2))
            print(f"\nreport -> {out}")
        return 0 if report["violation_count"] == 0 else 1

    slug = args.slug
    brand_dir, replica_dir, source_dom_dir, default_out = _resolve_paths(slug)
    if not replica_dir.exists():
        print(f"Error: replica directory not found: {replica_dir}", file=sys.stderr)
        return 2

    report = lint_brand(slug, brand_dir, replica_dir, source_dom_dir)
    _print_table(report)

    out_path = Path(args.output) if args.output else default_out
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2))
    print(f"\nreport -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
