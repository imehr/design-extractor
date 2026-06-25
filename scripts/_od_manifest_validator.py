"""Faithful Python port of open-design's ``manifest.schema.ts``.

Mirrors ``validateDesignSystemProjectManifest`` from
``open-design/design-systems/_schema/manifest.schema.ts`` line-for-line so a
bundle emitted by this repo is guaranteed to satisfy the Open-Design v1
project contract (``od-design-system-project/v1``).

The public surface is :func:`validate`, which returns a
:class:`ValidationResult` (``ok``/``errors``/``manifest``). It is pure
Python with no I/O so it is fully unit-testable.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

DESIGN_SYSTEM_PROJECT_SCHEMA_VERSION = "od-design-system-project/v1"

ALLOWED_TOP_LEVEL_KEYS = frozenset({
    "schemaVersion", "id", "name", "category", "description",
    "source", "files", "assetsDir", "previewDir", "usage",
    "componentsManifest", "importMode", "craft", "fonts", "preview",
    "sourceFiles",
})

ALLOWED_SOURCE_KEYS = {
    "bundled": frozenset({"type", "origin"}),
    "local": frozenset({"type", "path", "importedAt"}),
    "github": frozenset({"type", "url", "branch", "commit", "importedAt"}),
    "shadcn": frozenset({"type", "reference", "registryUrl", "item", "homepage", "importedAt"}),
}

ALLOWED_FILES_KEYS = frozenset({"design", "tokens", "designTokens", "tailwind", "components"})
ALLOWED_CRAFT_KEYS = frozenset({"applies", "suggested", "exemptions"})
ALLOWED_FONT_KEYS = frozenset({"family", "file", "weight", "style"})
ALLOWED_PREVIEW_KEYS = frozenset({"dir", "pages"})
ALLOWED_PREVIEW_PAGE_KEYS = frozenset({"path", "role", "title"})
ALLOWED_SOURCE_FILES_KEYS = frozenset({"scanned", "evidence", "tokens", "report", "snippets"})

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_DRIVE_RE = re.compile(r"^[A-Za-z]:[\\/]")


@dataclass
class ValidationResult:
    ok: bool
    errors: list[str] = field(default_factory=list)
    manifest: Any = None


def validate(value: Any) -> ValidationResult:
    """Validate a parsed manifest object. Mirrors the TS validator exactly."""
    errors: list[str] = []

    if not _is_record(value):
        return ValidationResult(False, ["manifest must be a JSON object"])

    _reject_unknown_keys(errors, "$", value, ALLOWED_TOP_LEVEL_KEYS)

    _expect_literal(errors, "$.schemaVersion", value.get("schemaVersion"),
                    DESIGN_SYSTEM_PROJECT_SCHEMA_VERSION)
    _expect_slug(errors, "$.id", value.get("id"))
    _expect_non_empty_string(errors, "$.name", value.get("name"))
    _expect_non_empty_string(errors, "$.category", value.get("category"))
    if value.get("description") is not None:
        _expect_non_empty_string(errors, "$.description", value.get("description"))

    _validate_source(errors, value.get("source"))
    _validate_files(errors, value.get("files"))

    if value.get("assetsDir") is not None:
        _expect_literal(errors, "$.assetsDir", value.get("assetsDir"), "assets")
    if value.get("previewDir") is not None:
        _expect_literal(errors, "$.previewDir", value.get("previewDir"), "preview")
    if value.get("usage") is not None:
        _expect_safe_relative_path(errors, "$.usage", value.get("usage"))
    if value.get("componentsManifest") is not None:
        _expect_safe_relative_path(errors, "$.componentsManifest", value.get("componentsManifest"))
    if value.get("importMode") is not None:
        _validate_import_mode(errors, value.get("importMode"))
    if value.get("craft") is not None:
        _validate_craft(errors, value.get("craft"))
    if value.get("fonts") is not None:
        _validate_fonts(errors, value.get("fonts"))
    if value.get("preview") is not None:
        _validate_preview(errors, value.get("preview"))
    if value.get("sourceFiles") is not None:
        _validate_source_files(errors, value.get("sourceFiles"))

    if errors:
        return ValidationResult(False, errors)
    return ValidationResult(True, [], value)


# ── Sub-validators (mirror the TS helpers 1:1) ────────────────────────────────

def _validate_source(errors: list[str], value: Any) -> None:
    if not _is_record(value):
        errors.append("$.source must be an object")
        return

    stype = value.get("type")
    if stype not in ALLOWED_SOURCE_KEYS:
        errors.append("$.source.type must be one of bundled, local, github, shadcn")
        return

    _reject_unknown_keys(errors, "$.source", value, ALLOWED_SOURCE_KEYS[stype])

    if stype == "bundled":
        if value.get("origin") is not None:
            _expect_non_empty_string(errors, "$.source.origin", value.get("origin"))
        return

    if stype == "local":
        _expect_non_empty_string(errors, "$.source.path", value.get("path"))
        if value.get("importedAt") is not None:
            _expect_iso_datetime(errors, "$.source.importedAt", value.get("importedAt"))
        return

    if stype == "github":
        _expect_non_empty_string(errors, "$.source.url", value.get("url"))
        if value.get("branch") is not None:
            _expect_non_empty_string(errors, "$.source.branch", value.get("branch"))
        if value.get("commit") is not None:
            _expect_non_empty_string(errors, "$.source.commit", value.get("commit"))
        if value.get("importedAt") is not None:
            _expect_iso_datetime(errors, "$.source.importedAt", value.get("importedAt"))
        return

    # shadcn
    _expect_non_empty_string(errors, "$.source.reference", value.get("reference"))
    if value.get("registryUrl") is not None:
        _expect_non_empty_string(errors, "$.source.registryUrl", value.get("registryUrl"))
    if value.get("item") is not None:
        _expect_non_empty_string(errors, "$.source.item", value.get("item"))
    if value.get("homepage") is not None:
        _expect_non_empty_string(errors, "$.source.homepage", value.get("homepage"))
    if value.get("importedAt") is not None:
        _expect_iso_datetime(errors, "$.source.importedAt", value.get("importedAt"))


def _validate_files(errors: list[str], value: Any) -> None:
    if not _is_record(value):
        errors.append("$.files must be an object")
        return

    _reject_unknown_keys(errors, "$.files", value, ALLOWED_FILES_KEYS)
    _expect_literal(errors, "$.files.design", value.get("design"), "DESIGN.md")
    _expect_literal(errors, "$.files.tokens", value.get("tokens"), "tokens.css")
    if value.get("designTokens") is not None:
        _expect_literal(errors, "$.files.designTokens", value.get("designTokens"), "design-tokens.json")
    if value.get("tailwind") is not None:
        _expect_literal(errors, "$.files.tailwind", value.get("tailwind"), "tailwind-v4.css")
    if value.get("components") is not None:
        _expect_literal(errors, "$.files.components", value.get("components"), "components.html")


def _validate_import_mode(errors: list[str], value: Any) -> None:
    if value not in ("normalized", "hybrid", "verbatim"):
        errors.append("$.importMode must be one of normalized, hybrid, verbatim")


def _validate_craft(errors: list[str], value: Any) -> None:
    if not _is_record(value):
        errors.append("$.craft must be an object")
        return
    _reject_unknown_keys(errors, "$.craft", value, ALLOWED_CRAFT_KEYS)
    _expect_slug_array(errors, "$.craft.applies", value.get("applies"))
    _expect_slug_array(errors, "$.craft.suggested", value.get("suggested"))
    _expect_slug_array(errors, "$.craft.exemptions", value.get("exemptions"))


def _validate_fonts(errors: list[str], value: Any) -> None:
    if not isinstance(value, list):
        errors.append("$.fonts must be an array")
        return
    for index, font in enumerate(value):
        label = f"$.fonts[{index}]"
        if not _is_record(font):
            errors.append(f"{label} must be an object")
            continue
        _reject_unknown_keys(errors, label, font, ALLOWED_FONT_KEYS)
        _expect_non_empty_string(errors, f"{label}.family", font.get("family"))
        _expect_safe_relative_path(errors, f"{label}.file", font.get("file"))
        weight = font.get("weight")
        if weight is not None and not isinstance(weight, (int, str)) or isinstance(weight, bool):
            errors.append(f"{label}.weight must be a number or string")
        if font.get("style") is not None:
            _expect_non_empty_string(errors, f"{label}.style", font.get("style"))


def _validate_preview(errors: list[str], value: Any) -> None:
    if not _is_record(value):
        errors.append("$.preview must be an object")
        return
    _reject_unknown_keys(errors, "$.preview", value, ALLOWED_PREVIEW_KEYS)
    _expect_safe_relative_path(errors, "$.preview.dir", value.get("dir"))
    if not isinstance(value.get("pages"), list):
        errors.append("$.preview.pages must be an array")
        return
    for index, page in enumerate(value["pages"]):
        label = f"$.preview.pages[{index}]"
        if not _is_record(page):
            errors.append(f"{label} must be an object")
            continue
        _reject_unknown_keys(errors, label, page, ALLOWED_PREVIEW_PAGE_KEYS)
        _expect_safe_relative_path(errors, f"{label}.path", page.get("path"))
        if page.get("role") is not None:
            _expect_non_empty_string(errors, f"{label}.role", page.get("role"))
        if page.get("title") is not None:
            _expect_non_empty_string(errors, f"{label}.title", page.get("title"))


def _validate_source_files(errors: list[str], value: Any) -> None:
    if not _is_record(value):
        errors.append("$.sourceFiles must be an object")
        return
    _reject_unknown_keys(errors, "$.sourceFiles", value, ALLOWED_SOURCE_FILES_KEYS)
    for key in ALLOWED_SOURCE_FILES_KEYS:
        source_path = value.get(key)
        if source_path is not None:
            _expect_safe_relative_path(errors, f"$.sourceFiles.{key}", source_path)


# ── Primitive expectation helpers ─────────────────────────────────────────────

def _reject_unknown_keys(errors: list[str], path: str, value: dict, allowed) -> None:
    for key in value.keys():
        if key not in allowed:
            errors.append(f"{path}.{key} is not part of the v1 design-system project schema")


def _expect_literal(errors: list[str], path: str, value: Any, expected: str) -> None:
    import json as _json
    if value != expected:
        errors.append(f"{path} must be {_json.dumps(expected)}")


def _expect_non_empty_string(errors: list[str], path: str, value: Any) -> None:
    if not isinstance(value, str) or value.strip() == "":
        errors.append(f"{path} must be a non-empty string")


def _expect_slug_array(errors: list[str], path: str, value: Any) -> None:
    if not isinstance(value, list):
        errors.append(f"{path} must be an array of lowercase slugs")
        return
    for index, entry in enumerate(value):
        if not isinstance(entry, str) or not _SLUG_RE.match(entry):
            errors.append(
                f"{path}[{index}] must be a lowercase slug matching /^[a-z0-9]+(?:-[a-z0-9]+)*$/"
            )


def _expect_safe_relative_path(errors: list[str], path: str, value: Any) -> None:
    if not isinstance(value, str) or value.strip() == "":
        errors.append(f"{path} must be a non-empty relative path")
        return
    if value.startswith("/") or _DRIVE_RE.match(value) or "\\" in value:
        errors.append(f"{path} must be a safe relative path")
        return
    segments = value.split("/")
    if any(segment in ("", ".", "..") for segment in segments):
        errors.append(f'{path} must be a safe relative path without empty, "." or ".." segments')


def _expect_slug(errors: list[str], path: str, value: Any) -> None:
    if not isinstance(value, str) or not _SLUG_RE.match(value):
        errors.append(f"{path} must be a lowercase slug matching /^[a-z0-9]+(?:-[a-z0-9]+)*$/")


def _expect_iso_datetime(errors: list[str], path: str, value: Any) -> None:
    if not isinstance(value, str) or not _is_parseable_datetime(value):
        errors.append(f"{path} must be an ISO-like datetime string")


def _is_parseable_datetime(value: str) -> bool:
    from datetime import datetime
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def _is_record(value: Any) -> bool:
    return isinstance(value, dict)
