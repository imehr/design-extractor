#!/usr/bin/env python3
"""
update_library_index.py — maintain ~/.claude/design-library/index.json

Phase 1 minimal implementation. Reads/writes the master library registry.
The full Phase 3 version will add dedupe-by-source-url, version bumping,
crash-safe append-only journaling via index.jsonl, and the ~/.claude/design-library/.lock mutex.

Schema:
    {
      "version": "0.1.0",
      "updated_at": "2026-04-10T00:00:00Z",
      "brands": [
        {
          "slug": "nimbus",
          "name": "Nimbus",
          "source_url": "https://nimbus.example.com",
          "extracted_at": "2026-04-10",
          "extractor_version": "0.1.0",
          "overall_score": 0.95,
          "confidence": "HIGH",
          "categories": ["dev-tools", "infrastructure"],
          "synthetic": true,
          "path": "/Users/mehran/.claude/design-library/brands/nimbus"
        }
      ]
    }
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

LIBRARY_ROOT = Path.home() / ".claude" / "design-library"
INDEX_PATH = LIBRARY_ROOT / "index.json"
SCHEMA_VERSION = "0.1.0"


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_index() -> dict:
    if not INDEX_PATH.exists():
        return {"version": SCHEMA_VERSION, "updated_at": now_iso(), "brands": []}
    with INDEX_PATH.open() as f:
        data = json.load(f)
    data.setdefault("version", SCHEMA_VERSION)
    data.setdefault("brands", [])
    return data


def save_index(data: dict) -> None:
    LIBRARY_ROOT.mkdir(parents=True, exist_ok=True)
    data["updated_at"] = now_iso()
    with INDEX_PATH.open("w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def brand_record_from_metadata(slug: str, metadata_path: Path) -> dict:
    with metadata_path.open() as f:
        meta = json.load(f)
    overall_score = meta.get("overall_score")
    if overall_score is None:
        overall_score = meta.get("scores", {}).get("overall")
    return {
        "slug": slug,
        "name": meta.get("name", slug),
        "source_url": meta.get("source_url", ""),
        "extracted_at": meta.get("extracted_at", ""),
        "extractor_version": meta.get("extractor_version", ""),
        "overall_score": overall_score,
        "confidence": meta.get("confidence", "UNKNOWN"),
        "categories": meta.get("categories", meta.get("category", [])),
        "synthetic": meta.get("synthetic", False),
        "path": str(LIBRARY_ROOT / "brands" / slug),
    }


def parse_extracted_at(value: object) -> float:
    if not isinstance(value, str) or not value.strip():
        return 0.0
    normalized = value.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized).timestamp()
    except ValueError:
        try:
            return datetime.strptime(value.strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp()
        except ValueError:
            return 0.0


def sort_brands(brands: list[dict]) -> list[dict]:
    return sorted(
        brands,
        key=lambda b: (
            -parse_extracted_at(b.get("extracted_at")),
            str(b.get("name") or b.get("slug") or "").lower(),
        ),
    )


def cmd_add(args: argparse.Namespace) -> int:
    metadata_path = Path(args.metadata).expanduser().resolve()
    if not metadata_path.exists():
        print(f"error: metadata file not found: {metadata_path}", file=sys.stderr)
        return 1
    data = load_index()
    record = brand_record_from_metadata(args.add, metadata_path)
    data["brands"] = [b for b in data["brands"] if b["slug"] != args.add]
    data["brands"].append(record)
    data["brands"] = sort_brands(data["brands"])
    save_index(data)
    print(f"registered {args.add} in {INDEX_PATH}")
    return 0


def collect_brand_records(brands_root: Path) -> dict[str, dict]:
    """Scan <brands_root>/*/metadata.json into {slug: record}. Missing or
    malformed metadata files are skipped with a warning, never fatal."""
    records: dict[str, dict] = {}
    if not brands_root.exists():
        return records
    for brand_dir in sorted(brands_root.iterdir()):
        if not brand_dir.is_dir():
            continue
        metadata_path = brand_dir / "metadata.json"
        if not metadata_path.exists():
            continue
        slug = brand_dir.name
        try:
            records[slug] = brand_record_from_metadata(slug, metadata_path)
        except (json.JSONDecodeError, OSError) as exc:
            print(f"warning: skipping {metadata_path}: {exc}", file=sys.stderr)
    return records


def cmd_rebuild(args: argparse.Namespace) -> int:
    """Rebuild the library index (and a repo-local brands/index.json) from
    brands/*/metadata.json. Idempotent: the result depends only on the
    metadata files on disk, never on the previous index contents."""
    library_brands = LIBRARY_ROOT / "brands"
    repo_brands = Path(args.repo_brands_dir).expanduser() if args.repo_brands_dir else None

    records = collect_brand_records(library_brands)
    if repo_brands is not None:
        for slug, record in collect_brand_records(repo_brands).items():
            # Library copy is canonical when both exist (publish mirrors them).
            records.setdefault(slug, record)

    brands = sort_brands(list(records.values()))
    data = {"version": SCHEMA_VERSION, "brands": brands}
    save_index(data)
    print(f"rebuilt {INDEX_PATH} with {len(brands)} brands")

    if repo_brands is not None:
        repo_brands.mkdir(parents=True, exist_ok=True)
        repo_index = repo_brands / "index.json"
        with repo_index.open("w") as f:
            json.dump({"version": SCHEMA_VERSION, "updated_at": now_iso(), "brands": brands}, f, indent=2)
            f.write("\n")
        print(f"rebuilt {repo_index} with {len(brands)} brands")
    return 0


def cmd_remove(args: argparse.Namespace) -> int:
    data = load_index()
    before = len(data["brands"])
    data["brands"] = [b for b in data["brands"] if b["slug"] != args.remove]
    if len(data["brands"]) == before:
        print(f"warning: {args.remove} was not in the index", file=sys.stderr)
        return 0
    save_index(data)
    print(f"removed {args.remove} from {INDEX_PATH}")
    return 0


def cmd_list(_args: argparse.Namespace) -> int:
    data = load_index()
    if not data["brands"]:
        print("(library is empty)")
        return 0
    for b in data["brands"]:
        score = b.get("overall_score")
        score_str = f"{score:.2f}" if isinstance(score, (int, float)) else "?"
        print(f"{b['slug']:<20} {b['source_url']:<35} score={score_str} {b.get('confidence', '?')}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Maintain the design library index")
    parser.add_argument("--add", help="register a brand by slug")
    parser.add_argument("--metadata", help="path to the brand's metadata.json (required with --add)")
    parser.add_argument("--remove", help="unregister a brand by slug")
    parser.add_argument("--list", action="store_true", help="print all registered brands")
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="rebuild index.json from brands/*/metadata.json (idempotent)",
    )
    parser.add_argument(
        "--repo-brands-dir",
        default=str(Path(__file__).resolve().parent.parent / "brands"),
        help="repo-local brands/ directory to scan and to write brands/index.json into",
    )
    args = parser.parse_args(argv)

    if args.rebuild:
        return cmd_rebuild(args)
    if args.add:
        if not args.metadata:
            parser.error("--add requires --metadata")
        return cmd_add(args)
    if args.remove:
        return cmd_remove(args)
    if args.list:
        return cmd_list(args)
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
