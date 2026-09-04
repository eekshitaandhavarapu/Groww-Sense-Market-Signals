#!/usr/bin/env bash
set -e

echo "=== Starting Groww Sense (Local Zero-Dependency Mode) ==="

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required. Please install Python 3.11+."
    exit 1
fi

# 2. Check Node
if ! command -v npm &> /dev/null; then
    echo "npm is required. Please install Node.js 18+."
    exit 1
fi

# 3. Setup backend
echo "Setting up backend..."
cd backend
if [ ! -f "requirements.txt" ]; then
    echo "backend/requirements.txt not found."
    exit 1
fi

# Install dependencies if not already present
pip install -r requirements.txt -q || pip3 install -r requirements.txt -q

# Run Alembic migrations and seed
alembic upgrade head
python3 scripts/seed.py

# Start uvicorn in background
echo "Starting backend on http://localhost:8000..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Ensure backend stops when this script exits
cleanup() {
    echo "Shutting down backend (PID: $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 4. Setup frontend
echo "Setting up frontend..."
npm install

# 5. Start frontend
echo "Starting frontend on http://localhost:5173..."
npm run dev
