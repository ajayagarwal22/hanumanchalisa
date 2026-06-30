#!/usr/bin/env bash
# One-command local install + run for AutoApply (no Docker needed).
# Creates a Python virtualenv, installs deps, builds the frontend, and starts
# the app. Requires: python3 (3.10+) and node/npm (18+).
set -euo pipefail
cd "$(dirname "$0")"

# Port chosen to avoid the commonly-used 3000/5000/6000/8000/9000 ranges.
PORT="${PORT:-7700}"

# --- checks ---
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 not found. Install Python 3.10+"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm not found. Install Node.js 18+"; exit 1; }

echo "==> Setting up Python environment (.venv)"
if [ ! -d .venv ]; then
  python3 -m venv .venv 2>/dev/null || {
    echo "    (python venv module missing — install e.g. 'sudo apt install python3-venv')"
    echo "    Falling back to a user install."
    PIP_FALLBACK=1
  }
fi

if [ -d .venv ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
  PY="python"
else
  PY="python3"
fi

echo "==> Installing backend dependencies"
if [ -n "${PIP_FALLBACK:-}" ]; then
  $PY -m pip install --user --break-system-packages -r backend/requirements.txt
else
  $PY -m pip install --upgrade pip >/dev/null
  $PY -m pip install -r backend/requirements.txt
fi

echo "==> Building frontend"
( cd frontend && npm install && npm run build )

echo ""
echo "==> AutoApply is starting on http://127.0.0.1:${PORT}"
echo "    Open that URL in your browser. Press Ctrl+C to stop."
echo ""
cd backend && exec $PY -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
