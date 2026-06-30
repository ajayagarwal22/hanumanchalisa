#!/usr/bin/env bash
# Build the frontend and run the backend (which serves the built app).
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Installing backend deps"
pip install -r backend/requirements.txt

echo "==> Building frontend"
( cd frontend && npm install && npm run build )

echo "==> Starting AutoApply on http://127.0.0.1:8000"
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
