#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="design-extractor"
APP_URL="https://${APP_NAME}.localhost/"
NEXT_LOCK="${ROOT_DIR}/ui/.next/dev/lock"

if ! command -v portless >/dev/null 2>&1; then
  echo "Error: portless is not installed or is not on PATH." >&2
  echo "Install it with: npm install -g portless" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is not installed or is not on PATH." >&2
  exit 1
fi

stop_next_pid() {
  local pid="$1"
  local label="$2"

  if ! kill -0 "${pid}" >/dev/null 2>&1; then
    return
  fi

  echo "Stopping existing Next dev server ${label} (PID ${pid})..."
  kill "${pid}" >/dev/null 2>&1 || true
  for _ in {1..50}; do
    if ! kill -0 "${pid}" >/dev/null 2>&1; then
      return
    fi
    sleep 0.1
  done
  if kill -0 "${pid}" >/dev/null 2>&1; then
    echo "Existing Next dev server did not exit cleanly; forcing stop..."
    kill -9 "${pid}" >/dev/null 2>&1 || true
  fi
}

echo "Starting design-extractor at ${APP_URL}"
echo "Portless will choose the app port and proxy it to ${APP_URL}"

cd "${ROOT_DIR}"

if [[ -f "${NEXT_LOCK}" ]]; then
  NEXT_PID="$(sed -nE 's/.*"pid":([0-9]+).*/\1/p' "${NEXT_LOCK}" | head -n 1)"
  NEXT_PORT="$(sed -nE 's/.*"port":([0-9]+).*/\1/p' "${NEXT_LOCK}" | head -n 1)"

  if [[ -n "${NEXT_PID}" ]] && kill -0 "${NEXT_PID}" >/dev/null 2>&1; then
    NEXT_COMMAND="$(ps -p "${NEXT_PID}" -o command= 2>/dev/null || true)"
    if [[ "${NEXT_COMMAND}" == *"next-server"* || "${NEXT_COMMAND}" == *"next dev"* ]]; then
      stop_next_pid "${NEXT_PID}" "from ui/.next/dev/lock${NEXT_PORT:+, port ${NEXT_PORT}}"
    else
      echo "Error: ui/.next/dev/lock points at PID ${NEXT_PID}, but it does not look like a Next dev server." >&2
      echo "Command: ${NEXT_COMMAND:-unknown}" >&2
      exit 1
    fi
  fi

  rm -f "${NEXT_LOCK}" >/dev/null 2>&1 || true
fi

# The lock file can disappear after a crashed Fast Refresh loop. Stop any remaining
# Next process whose working directory is exactly this app's ui directory.
while IFS= read -r NEXT_PID; do
  [[ -z "${NEXT_PID}" ]] && continue
  NEXT_CWD="$(lsof -a -p "${NEXT_PID}" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"
  if [[ "${NEXT_CWD}" == "${ROOT_DIR}/ui" ]]; then
    stop_next_pid "${NEXT_PID}" "from ui working directory"
  fi
done < <(pgrep -f "next-server|next dev" 2>/dev/null || true)

# A stale static alias blocks Portless-managed dev servers and is reported as PID 0.
# Removing it is safe when no alias exists, and lets this script own the route.
portless alias --remove "${APP_NAME}" >/dev/null 2>&1 || true

# --- WebSocket extraction server (live agent progress for /extract) ---
WS_SCRIPT="${ROOT_DIR}/scripts/ws_extraction_server.py"
WS_PID_FILE="/tmp/ws_extraction_server.pid"
WS_LOG_DIR="${ROOT_DIR}/.logs"
WS_LOG_FILE="${WS_LOG_DIR}/ws-server.log"
WS_PORT=8765

# Kill any prior ws_extraction_server.py process (PID file first, then pgrep fallback).
if [[ -f "${WS_PID_FILE}" ]]; then
  OLD_WS_PID="$(cat "${WS_PID_FILE}" 2>/dev/null || true)"
  if [[ -n "${OLD_WS_PID}" ]] && kill -0 "${OLD_WS_PID}" >/dev/null 2>&1; then
    echo "Stopping existing ws_extraction_server (PID ${OLD_WS_PID})..."
    kill "${OLD_WS_PID}" >/dev/null 2>&1 || true
    sleep 0.5
    kill -9 "${OLD_WS_PID}" >/dev/null 2>&1 || true
  fi
  rm -f "${WS_PID_FILE}" >/dev/null 2>&1 || true
fi
while IFS= read -r WS_OLD; do
  [[ -z "${WS_OLD}" ]] && continue
  echo "Stopping stray ws_extraction_server (PID ${WS_OLD})..."
  kill "${WS_OLD}" >/dev/null 2>&1 || true
done < <(pgrep -f "ws_extraction_server.py" 2>/dev/null || true)

# Kill anything else still listening on the WS port (a renamed/orphaned process
# would otherwise block the bind and the new server would die silently).
while IFS= read -r WS_PORT_PID; do
  [[ -z "${WS_PORT_PID}" ]] && continue
  echo "Stopping process listening on :${WS_PORT} (PID ${WS_PORT_PID})..."
  kill "${WS_PORT_PID}" >/dev/null 2>&1 || true
  sleep 0.3
  kill -9 "${WS_PORT_PID}" >/dev/null 2>&1 || true
done < <(lsof -ti tcp:"${WS_PORT}" -sTCP:LISTEN 2>/dev/null || true)

# Precheck: python3 + required dep. Best-effort — warn, do not exit.
if ! command -v python3 >/dev/null 2>&1; then
  echo "Warning: python3 not found on PATH. Live extraction progress will be unavailable." >&2
  WS_SKIP=1
elif ! python3 -c "import websockets" >/dev/null 2>&1; then
  echo "Warning: Python 'websockets' module not found. Live extraction progress will be unavailable." >&2
  echo "         Install with: pip3 install websockets" >&2
  WS_SKIP=1
else
  WS_SKIP=0
fi

if [[ "${WS_SKIP}" -eq 0 && -f "${WS_SCRIPT}" ]]; then
  echo "Starting ws_extraction_server on ws://localhost:${WS_PORT} (log: ${WS_LOG_FILE})"
  mkdir -p "${WS_LOG_DIR}"
  : > "${WS_LOG_FILE}"
  DESIGN_EXTRACTOR_BASE_URL="${APP_URL%/}" nohup python3 "${WS_SCRIPT}" >> "${WS_LOG_FILE}" 2>&1 &
  WS_PID=$!
  echo "${WS_PID}" > "${WS_PID_FILE}"

  # Wait up to 5s for the port to be listening. Best-effort; never fail.
  WS_READY=0
  for _ in {1..25}; do
    if nc -z localhost "${WS_PORT}" >/dev/null 2>&1; then
      WS_READY=1
      break
    fi
    sleep 0.2
  done
  if [[ "${WS_READY}" -eq 1 ]]; then
    echo "ws_extraction_server listening on :${WS_PORT} (PID ${WS_PID})"
  else
    echo "Warning: ws_extraction_server did not start within 5s; see ${WS_LOG_FILE}" >&2
  fi

  # Make sure the WS server stops when this script exits (Ctrl-C, normal exit).
  cleanup_ws() {
    if [[ -f "${WS_PID_FILE}" ]]; then
      local pid
      pid="$(cat "${WS_PID_FILE}" 2>/dev/null || true)"
      if [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1; then
        kill "${pid}" >/dev/null 2>&1 || true
      fi
      rm -f "${WS_PID_FILE}" >/dev/null 2>&1 || true
    fi
  }
  trap cleanup_ws EXIT INT TERM
fi

exec portless run --name "${APP_NAME}" --force "$@" -- env WATCHPACK_POLLING=true pnpm --dir ui dev
