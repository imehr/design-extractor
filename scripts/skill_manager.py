#!/usr/bin/env python3
"""Skill registry and changelog manager for design-extractor."""

from __future__ import annotations
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

REGISTRY_PATH = (
    Path(__file__).resolve().parent.parent / "state" / "learning" / "registry.json"
)
CHANGELOG_PATH = (
    Path(__file__).resolve().parent.parent / "state" / "learning" / "changelog.json"
)


def load_registry() -> dict:
    try:
        with REGISTRY_PATH.open() as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"version": "1.0", "skills": []}


def save_registry(data: dict) -> None:
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REGISTRY_PATH.open("w") as f:
        json.dump(data, f, indent=2)


def load_changelog() -> list:
    try:
        with CHANGELOG_PATH.open() as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_changelog(entries: list) -> None:
    CHANGELOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CHANGELOG_PATH.open("w") as f:
        json.dump(entries, f, indent=2)


def cmd_list(args):
    registry = load_registry()
    for skill in registry.get("skills", []):
        freshness_badge = "ACTIVE" if skill["freshness"] == "active" else "CAND"
        score = (
            f"{skill['contract_score']:.2f}" if skill.get("contract_score") else "--"
        )
        print(
            f"  {freshness_badge}  {skill['name']:30s}  score={score}  wins={skill.get('success_count', 0)}"
        )


def cmd_promote(args):
    registry = load_registry()
    for skill in registry.get("skills", []):
        if skill["name"] == args.skill_id or skill["id"] == args.skill_id:
            skill["freshness"] = "active"
            skill["last_updated"] = datetime.now(timezone.utc).isoformat()[:10]
            save_registry(registry)
            print(f"Promoted {skill['name']} to active.")
            return
    print(f"Skill not found: {args.skill_id}")


def cmd_demote(args):
    registry = load_registry()
    for skill in registry.get("skills", []):
        if skill["name"] == args.skill_id or skill["id"] == args.skill_id:
            skill["freshness"] = "candidate"
            skill["last_updated"] = datetime.now(timezone.utc).isoformat()[:10]
            save_registry(registry)
            print(f"Demoted {skill['name']} to candidate.")
            return
    print(f"Skill not found: {args.skill_id}")


def cmd_log_change(args):
    changelog = load_changelog()
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "change_type": args.type,
        "description": args.description,
        "affected_files": args.files.split(",") if args.files else [],
        "brand": args.brand or "",
        "validation_before": float(args.before) if args.before else None,
        "validation_after": float(args.after) if args.after else None,
        "source": args.source or "manual",
    }
    changelog.append(entry)
    save_changelog(changelog)
    print(f"Logged {args.type}: {args.description[:60]}...")


def cmd_query(args):
    registry = load_registry()
    results = []
    for skill in registry.get("skills", []):
        if args.task_family and skill.get("task_family") != args.task_family:
            continue
        score = skill.get("contract_score", 0) or 0
        freshness_bonus = 0.1 if skill.get("freshness") == "active" else 0
        results.append((score * 15 + freshness_bonus, skill))
    results.sort(key=lambda x: x[0], reverse=True)
    for rank, (_, skill) in enumerate(results[: args.top], 1):
        print(
            f"  {rank}. {skill['name']} (score={skill.get('contract_score', 0):.2f}, {skill.get('freshness', '?')})"
        )


def main():
    parser = argparse.ArgumentParser(
        description="Skill registry and changelog manager."
    )
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("list", help="List all skills with scores")

    p = sub.add_parser("promote", help="Promote a skill to active")
    p.add_argument("skill_id", help="Skill name or ID")

    p = sub.add_parser("demote", help="Demote a skill to candidate")
    p.add_argument("skill_id", help="Skill name or ID")

    p = sub.add_parser("log-change", help="Append to changelog")
    p.add_argument(
        "--type",
        required=True,
        choices=["skill_patch", "agent_update", "harness_change", "blueprint_update"],
    )
    p.add_argument("--description", required=True)
    p.add_argument("--files", default="")
    p.add_argument("--brand", default="")
    p.add_argument("--before", default=None)
    p.add_argument("--after", default=None)
    p.add_argument("--source", default="manual")

    p = sub.add_parser("query", help="Query skills by task family")
    p.add_argument("--task-family", default=None)
    p.add_argument("--top", type=int, default=5)

    args = parser.parse_args()
    if args.command == "list":
        cmd_list(args)
    elif args.command == "promote":
        cmd_promote(args)
    elif args.command == "demote":
        cmd_demote(args)
    elif args.command == "log-change":
        cmd_log_change(args)
    elif args.command == "query":
        cmd_query(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
