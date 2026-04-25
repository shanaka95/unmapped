#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    wait 2>/dev/null
    echo "Done."
}
trap cleanup EXIT INT TERM

echo "========================================="
echo "  Unmapped — Local Development"
echo "========================================="
echo ""

# --- Backend ---
echo "Starting backend..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements.txt
fi
.venv/bin/python run.py &
BACKEND_PID=$!
echo "  Backend  → http://localhost:8000"
echo "  API Docs → http://localhost:8000/docs"

# --- Frontend ---
echo ""
echo "Starting frontend..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install --silent
fi
npx vite --host &
FRONTEND_PID=$!
echo "  Frontend → http://localhost:5173"

echo ""
echo "========================================="
echo "  Backend  : http://localhost:8000"
echo "  API Docs : http://localhost:8000/docs"
echo "  Frontend : http://localhost:5173"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop all servers."
echo ""

wait
