# Groww Sense

Groww Sense tracks short-term price movement and flags statistically unusual changes using rolling z-scores.

## What it does

Groww Sense monitors selected stocks and evaluates price movement in real time. Instead of relying only on static percentage changes, it measures each price tick against that stock's recent volatility.

The application maintains a rolling 20-tick window for every monitored instrument to calculate its rolling mean and standard deviation. It then computes a z-score to determine how far the latest price has moved relative to recent behavior.

When a movement crosses predefined statistical thresholds, Groww Sense classifies the signal as Normal, Notable, or Meaningful and generates an alert. Flagged stocks are promoted to the top of the watchlist so users can quickly see what changed.

Users can open any stock to inspect the underlying calculations, view a volatility chart with a standard deviation band, replay the sequence of ticks that triggered the flag, and check what changed since their last visit. The dashboard also includes session history and sector-level volatility summaries.

## Why I built it

Short-term market movement produces a lot of noise. A 2% price swing in a volatile stock like Tata Motors is routine daily fluctuation, but the same 2% move in a defensive stock like Nestle India is an unusual event.

Standard watchlists treat both movements the same because they only display flat percentage changes. This creates constant noise and alert fatigue. I built Groww Sense to filter routine market noise, flag movements that are statistically unusual for that specific instrument, and clearly show why a stock was flagged.

## How it works

The data flows through this pipeline:

Market data
→ rolling window
→ mean
→ standard deviation
→ z-score
→ signal classification
→ alert

### Formula

z = (current price - rolling mean) / rolling standard deviation

For each instrument, the calculation uses a rolling window of the latest 20 ticks:
- rolling mean = sum of the last 20 prices / 20
- rolling standard deviation = sqrt(sum((price - mean)^2) / 20)

### Signal Thresholds

| Signal | Threshold | Behavior |
|---|---|---|
| Normal | < 1.5σ | Stays in the Quiet zone for routine monitoring. |
| Notable | 1.5σ–2.5σ | Promoted to the Flagged zone with an amber badge and accent border. |
| Meaningful | ≥ 2.5σ | Highlighted at the top of the Flagged zone with a plain-English explanation. |

### Edge cases handled:
- Cold start: If an instrument has fewer than 20 ticks, the system temporarily falls back to percentage thresholds (≥ 1.5% for notable, ≥ 3.0% for meaningful).
- Zero variance: If prices stay completely flat, division by zero is prevented using an epsilon check (1e-9) and percentage fallback.
- Stale or duplicate ticks: Incoming ticks must have a timestamp strictly greater than the last recorded tick, or they are dropped.
- Price floor: Prices are bounded at a minimum value of 1.0.

## Features

- Watchlist for monitored instruments with Flagged and Quiet zones
- Rolling z-score based signal detection
- Real-time price and signal updates over WebSockets
- Alert filtering by signal severity (Notable and Meaningful)
- Signal explanation with underlying calculations (mean, standard deviation, delta, z-score)
- Signal vs noise chart showing the price line, mean, and ±1σ volatility band
- Signal replay scrubber to step through the 20-tick sequence leading up to an alert
- Session history tracking regime changes (notable, meaningful, normalized)
- Portfolio and sector volatility breakdown
- Data health indicator showing socket status, latency, tick count, and a stream pause toggle to test stale-data behavior
- Add and remove instruments from a seeded catalog of 12 Indian stocks
- Since-last-checked baseline comparison showing price and volatility shifts between visits

## Demo / Data

The evaluation build includes a local demo feed so the application can run without API credentials. Prices and ticks are simulated locally and passed through the same signal calculation pipeline.

- The simulator uses a Geometric Brownian Motion model calibrated across 12 Indian stocks with realistic volatility profiles (e.g., higher volatility for Tata Motors and Reliance, lower volatility for Nestle India and Hindustan Unilever).
- New ticks are generated every 2 seconds and published over WebSockets.
- The UI status indicator reflects the actual WebSocket connection state ("Live" or "Offline") and does not claim a connection to a live exchange.

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- TanStack Query
- Zustand
- Recharts
- Vanilla CSS (tabular numbers, custom tokens)

### Backend
- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy 2.0 (AsyncIO)
- SQLite with aiosqlite (zero-dependency local run)
- PostgreSQL with asyncpg (Docker setup)
- Alembic
- Pydantic v2
- In-memory Redis adapter (local mode) / Redis 7 (Docker)

## Project Structure

```
GrowwSense/
|-- package.json          # Root scripts (npm run dev, npm run build)
|-- run.sh                # Single-command local startup script
|-- Dockerfile            # Multi-stage build (builds frontend + backend)
|-- docker-compose.yml    # Postgres + Redis + Backend container setup
|-- README.md             # Project documentation
|-- backend/
|   |-- app/              # FastAPI routers, models, schemas, and simulator
|   |-- alembic/          # Database migrations
|   |-- scripts/          # Seed script and WebSocket test
|   \-- requirements.txt  # Python dependencies
\-- frontend/
    |-- package.json      # Frontend dependencies
    |-- vite.config.ts    # Vite proxy configuration
    |-- src/              # React components, stores, hooks, and styles
    \-- public/           # Static assets
```

## Running the project

The application requires both the FastAPI backend (which runs the statistical simulator, rolling calculations, and WebSocket feed) and the React frontend.

### Option 1: Docker (Single Command)

Runs PostgreSQL, Redis, and the application container. The container compiles the frontend and serves both the application and the API on port 8000.

```bash
docker compose up -d
```

Open:
- Application: http://localhost:8000
- API documentation (Swagger UI): http://localhost:8000/docs
- Service health check: http://localhost:8000/api/health

To stop:
```bash
docker compose down
```

### Option 2: Single-Command Local Script (No Docker)

A startup script is provided that runs the backend (using SQLite and an in-memory Redis broker) and frontend together without requiring Docker:

```bash
./run.sh
```

Open:
- Application: http://localhost:5173
- API documentation (Swagger UI): http://localhost:8000/docs

### Option 3: Manual Local Run (Two Terminals)

#### Terminal 1: Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python scripts/seed.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend starts on port 8000 with interactive API documentation available at `http://localhost:8000/docs`.

#### Terminal 2: Frontend

```bash
npm install
npm run dev
```

Open http://localhost:5173. The Vite development server automatically proxies API requests (`/api`) and WebSocket connections (`/ws`) to the backend on port 8000.

## Guide Steps

Follow this walkthrough to test the core features:

1. Open http://localhost:5173 (or http://localhost:8000 if running Docker). The dashboard loads with an active demo watchlist of 5 monitored stocks.
2. Check the Watchlist zones: stocks with ordinary fluctuation stay in the Quiet zone, while stocks with elevated variance are promoted to the Flagged zone.
3. Observe live updates: the Data Health bar shows socket status, tick counts, and latency. Prices update dynamically.
4. Click any stock (e.g. Tata Motors or Nestle India) to open the ExplainPanel.
5. Review the z-score and rolling statistics: the Volatility Chart plots the 20-tick price line, running mean, and +/- 1 sigma band.
6. Compare deviations: notice how a 2% change in Nestle India breaks past volatility thresholds, while larger moves in Tata Motors remain normal noise.
7. Click the Alerts tab to see recorded threshold-crossing events with timestamps and deviation percentages.
8. Read the signal explanation: see the plain-English breakdown of why the movement was flagged relative to its historical standard deviation.
9. Open Signal Replay: click "Replay Signal Sequence" in the ExplainPanel to launch the 20-tick step-by-step scrubber.
10. Step through the replay to see how the price moved leading up to the alert.
11. Click the History tab to review the complete log of session regime changes (Notable, Meaningful, Normalized).
12. Inspect the "Since You Last Checked" card to compare current price and z-score against your last visit.
13. Click the Insights tab to view portfolio volatility distribution and sector-level variance.
14. Test stale-data handling: click "Pause Stream" in the Data Health bar to see how the UI handles delayed data without crashing.
15. Reset demo state: click "Reset Demo" in the header to return to the default 5-stock watchlist.
