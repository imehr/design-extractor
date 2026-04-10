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
    return {
        "slug": slug,
        "name": meta.get("name", slug),
        "source_url": meta.get("source_url", ""),
        "extracted_at": meta.get("extracted_at", ""),
        "extractor_version": meta.get("extractor_version", ""),
        "overall_score": meta.get("scores", {}).get("overall"),
        "confidence": meta.get("confidence", "UNKNOWN"),
        "categories": meta.get("categories", meta.get("category", [])),
        "synthetic": meta.get("synthetic", False),
        "path": str(LIBRARY_ROOT / "brands" / slug),
    }


def cmd_add(args: argparse.Namespace) -> int:
    metadata_path = Path(args.metadata).expanduser().resolve()
    if not metadata_path.exists():
        print(f"error: metadata file not found: {metadata_path}", file=sys.stderr)
        return 1
    data = load_index()
    record = brand_record_from_metadata(args.add, metadata_path)
    data["brands"] = [b for b in data["brands"] if b["slug"] != args.add]
    data["brands"].append(record)
    data["brands"].sort(key=lambda b: b["slug"])
    save_index(data)
    print(f"registered {args.add} in {INDEX_PATH}")
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
    args = parser.parse_args(argv)

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
