#!/usr/bin/env bash
# Seed tests/fixtures/baseline/linear-app/ from a real extracted brand in the
# local design library cache. The fixture directory is named "linear-app" for
# historical reasons — tests assert on schema shape, not brand identity.
#
# Usage:
#   bash scripts/seed_test_baseline.sh                       # default: nineforbrands
#   bash scripts/seed_test_baseline.sh quantium-com-au       # override

set -euo pipefail

BRAND="${1:-nineforbrands}"
SRC="${HOME}/.claude/design-library/cache/${BRAND}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DST="${REPO_ROOT}/tests/fixtures/baseline/linear-app"

if [[ ! -d "${SRC}" ]]; then
  echo "ERROR: source brand cache not found: ${SRC}" >&2
  echo "Available brands:" >&2
  ls "${HOME}/.claude/design-library/cache/" >&2 || true
  exit 1
fi

for required in tokens-output.json recon-output.json; do
  if [[ ! -f "${SRC}/${required}" ]]; then
    echo "ERROR: ${SRC}/${required} missing — pick a brand with complete artifacts" >&2
    exit 1
  fi
done

mkdir -p "${DST}"
cp "${SRC}/tokens-output.json" "${DST}/tokens-output.json"
cp "${SRC}/recon-output.json"  "${DST}/recon-output.json"
echo "copied: ${DST}/tokens-output.json"
echo "copied: ${DST}/recon-output.json"

# Optional screenshot — only copy if present AND under 500KB (fixtures go to git).
REF_SCREENSHOT="${SRC}/screenshots/reference/desktop-full.png"
if [[ -f "${REF_SCREENSHOT}" ]]; then
  size_kb=$(du -k "${REF_SCREENSHOT}" | awk '{print $1}')
  if (( size_kb < 500 )); then
    mkdir -p "${DST}/screenshots/reference"
    cp "${REF_SCREENSHOT}" "${DST}/screenshots/reference/desktop-full.png"
    echo "copied: ${DST}/screenshots/reference/desktop-full.png (${size_kb}KB)"
  else
    echo "skipped screenshot (${size_kb}KB exceeds 500KB git-friendly threshold)"
  fi
fi

# Keep the seeder executable for future runs.
chmod +x "${BASH_SOURCE[0]}"

echo "seeded baseline from brand: ${BRAND}"
