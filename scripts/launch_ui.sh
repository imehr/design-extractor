#!/bin/bash
# Launch the design-extractor library browser UI
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$SCRIPT_DIR/../ui"

cd "$UI_DIR"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (first run)..."
  pnpm install --silent
fi

echo "Starting library browser at http://localhost:5173"
pnpm dev --port 5173 &
UI_PID=$!

sleep 3
open http://localhost:5173

wait $UI_PID
