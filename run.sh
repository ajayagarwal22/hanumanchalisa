#!/usr/bin/env bash
# Build the frontend and run the backend (which serves the built app).
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Installing backend deps"
pip install -r backend/requirements.txt

echo "==> Building frontend"
( cd frontend && npm install && npm run build )

# Port chosen to avoid the commonly-used 3000/5000/6000/8000/9000 ranges.
PORT="${PORT:-7700}"
echo "==> Starting AutoApply on http://127.0.0.1:${PORT}"
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
