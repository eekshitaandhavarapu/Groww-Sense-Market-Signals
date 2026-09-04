#!/bin/sh
set -e

echo "=== Smart Market Watchlist Backend Startup ==="

# Run database migrations against deployed database
echo "Running database migrations (alembic upgrade head)..."
alembic upgrade head

# Seed initial instruments catalog
echo "Ensuring instrument catalog is seeded..."
python scripts/seed.py || python seed.py

# Start Uvicorn ASGI server with dynamic port
PORT="${PORT:-8000}"
echo "Starting server on port ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
