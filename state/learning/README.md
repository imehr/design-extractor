# Learning State

This directory holds durable learning inputs for the `design-extractor` harness.

## Files

- `feedback-log.jsonl` — user feedback, review findings, and operator notes captured during improvement runs
- future registry files — promoted or candidate skill records aligned with the MASFactory harness blueprint

## Promotion Rule

Learned skills should only auto-promote after harness validation passes.

## Why This Exists

The extraction and validation pipeline needs a stable, repo-local place to store:
- feedback that should influence future runs
- evidence for skill promotion
- learning notes that map user feedback to harness changes
