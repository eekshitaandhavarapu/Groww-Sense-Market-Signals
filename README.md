# Groww Sense

A real-time equity market monitoring system that surfaces statistically significant price anomalies using rolling volatility baselines instead of fixed percentage thresholds.

## Live Demo

https://groww-sense-market-signals.onrender.com

---

## Overview

Groww Sense is a real-time market surveillance interface designed to filter market noise and isolate genuine price anomalies across tracked equities.

Standard market watchlists typically rely on uniform percentage change thresholds to trigger alerts. This approach fails to account for the inherent volatility differences between individual stocks. A 2% price movement in a high-beta stock can be routine intraday variance, while the same 2% shift in a low-beta defensive stock represents a severe statistical outlier.

Groww Sense addresses this by establishing an in-memory, rolling statistical baseline for every tracked instrument. Each incoming price tick is evaluated against the stock's recent variance profile using rolling standard scores (z-scores), dynamically separating routine market fluctuations from meaningful structural breaks.

---

## Problem

Fixed percentage-based alerts introduce two critical operational failure modes in market monitoring:

1. **Alert Fatigue on High-Volatility Equities:** Instruments with wide intraday trading ranges generate continuous false positives when evaluated against static percentage hurdles.
2. **Missed Signals on Low-Volatility Equities:** Highly stable instruments rarely trigger static percentage thresholds, allowing significant abnormal regime shifts to go unnoticed.

Treating all instruments with uniform thresholds ignores the statistical distribution of individual asset price series.

---

## Solution

Groww Sense computes a localized, per-instrument rolling statistical baseline across recent price ticks:

- **Rolling Mean ($\mu$):** Tracks short-term equilibrium price across a rolling window of $N=20$ ticks.
- **Rolling Standard Deviation ($\sigma$):** Quantifies localized price dispersion and volatility.
- **Standard Score ($z$):** Measures the standard deviations by which the latest price deviates from the rolling mean:
  $$z = \frac{p_{\text{current}} - \mu}{\sigma}$$
- **Dynamic Zone Allocation:** Instruments with $|z| \ge 1.5\sigma$ are promoted to the Flagged Zone, while routine price movements ($|z| < 1.5\sigma$) remain in the Quiet Zone.
- **Deterministic Explainability:** Mathematical parameters ($\mu$, $\sigma$, $z$) are surfaced alongside an interactive 20-tick visual replay, ensuring full auditability without black-box predictive models.

---

## Key Features

- **Rolling Z-Score Anomaly Detection:** Continuous computation of standardized price deviation per instrument.
- **20-Tick Rolling Window:** In-memory sliding buffer maintained via Redis list primitives.
- **Dual-Zone Watchlist Hierarchy:** Automatic separation into Flagged ($|z| \ge 1.5\sigma$) and Quiet ($|z| < 1.5\sigma$) zones.
- **Statistical Explainability Panel:** Detailed inspection view displaying rolling mean, standard deviation, deviation delta, and volatility envelopes.
- **20-Tick Signal Replay:** Step-by-step scrubber to replay the historical tick trajectory leading up to an anomaly.
- **Data Health & Stale-Tick Protection:** Visual latency, socket status monitoring, monotonic timestamp validation, and out-of-order tick rejection.
- **Session History & Baseline Diffing:** Audit log comparing current prices against the user's recorded last-seen baseline.
- **Sector & Volatility Insights:** Portfolio-level variance breakdown and sector dispersion analytics.
- **Simulated Market Feed:** 12-instrument Brownian motion price generator with pre-calibrated volatility tiers and deliberate edge-case injection.

---

## Statistical Method

### Formulation

For each instrument, the rolling window contains the $N=20$ most recent price observations $P = [p_1, p_2, \dots, p_N]$:

$$\mu = \frac{1}{N} \sum_{i=1}^{N} p_i$$

$$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (p_i - \mu)^2}$$

$$z = \frac{p_{\text{current}} - \mu}{\sigma}$$

Where:
- $\mu$: Rolling window arithmetic mean.
- $\sigma$: Rolling window population standard deviation.
- $z$: Standard score quantifying the magnitude and direction of current price deviation.

### Classification Matrix

| Signal | Statistical Condition | Watchlist Action | UI Representation |
|---|---|---|---|
| Noise | $|z| < 1.5\sigma$ | Retained in Quiet Zone | Neutral gray indicator |
| Notable | $1.5\sigma \le |z| < 2.5\sigma$ | Promoted to Flagged Zone | Amber badge with signed $\sigma$ value |
| Meaningful | $|z| \ge 2.5\sigma$ | Highlighted at top of Flagged Zone | Red badge with full parameter breakdown |

### Edge-Case Handling

- **Cold Start ($len < 20$ ticks):** Falls back to fixed percentage thresholds ($\ge 1.5\%$ for Notable, $\ge 3.0\%$ for Meaningful) until a complete 20-tick buffer is accumulated.
- **Zero Variance ($\sigma < 10^{-9}$):** Protects against division-by-zero during flat price periods by defaulting to fixed percentage checks.
- **Stale and Duplicate Ticks:** Ticks with timestamps less than or equal to the instrument's last accepted tick timestamp are rejected.
- **Price Floor:** Random walk values are bounded to prevent negative or zero prices.

---

## How It Works

```
Market Tick
     │
     ▼
Timestamp Validation (Monotonic check; discard if <= last_seen)
     │
     ▼
Sliding Window Ingestion (LPUSH to Redis list, trim to N=20)
     │
     ▼
Rolling Statistics Computation (Mean μ, StdDev σ)
     │
     ▼
Z-Score Calculation (z = (price - μ) / σ)
     │
     ▼
Signal Classification (Noise: < 1.5σ | Notable: 1.5σ–2.5σ | Meaningful: >= 2.5σ)
     │
     ▼
WebSocket Broadcast (Stream updated JSON payload to connected clients)
     │
     ▼
UI Zone Re-ordering & Signal Explainability Visualization
```

1. **Market Tick:** Price tick generated or received with timestamp and instrument identifier.
2. **Validation:** Ingestion layer enforces strict monotonic ordering against the instrument's last recorded timestamp.
3. **Rolling Statistics:** Computes running $\mu$ and $\sigma$ over the 20-element price buffer.
4. **Z-Score:** Calculates standardized score relative to the current stock baseline.
5. **Signal Classification:** Categorizes the tick into Noise, Notable, or Meaningful tiers.
6. **Alert & Distribution:** Publishes classified frame via Redis Pub/Sub to FastAPI WebSocket endpoints.
7. **Explanation & Visualization:** React client dynamically renders the dual-zone layout, $\pm 1\sigma$ volatility bands, and replay scrubber.

---

## Architecture

```
+───────────────────────────────────────────────────────────+
|                 Market Price Feed                         |
|  - In-process Asyncio Generator (12 Indian Equities)      |
|  - Calibrated Volatilities (High / Medium / Defensive)    |
+─────────────────────────────┬─────────────────────────────+
                              │
                              ▼
+───────────────────────────────────────────────────────────+
|                 Backend Service (FastAPI)                 |
|  - Change Detection Engine (Rolling z-score computation)   |
|  - Monotonic Timestamp & Edge-Case Validator              |
|  - REST Endpoints (/api/watchlists, /api/instruments)     |
|  - WebSocket Endpoint (/ws/watchlist/{id})                |
+─────────────────────────────┬─────────────────────────────+
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
+───────────────────────────+   +───────────────────────────+
|    Database Layer         |   |    Cache & Pub/Sub        |
|  - SQLite (Local/Render)  |   |  - In-Memory Redis Adapter|
|  - PostgreSQL (Compose)   |   |  - Redis 7 (Multi-node)   |
|  - SQLAlchemy 2.0 Async   |   |  - Sliding Window (N=20)  |
+───────────────────────────+   +───────────────────────────+
                              │
                              ▼
+───────────────────────────────────────────────────────────+
|                 Frontend Client (React 19)                |
|  - Zustand Store (Real-time tick state & latency gauge)   |
|  - TanStack Query v5 (REST cache & optimistic sync)       |
|  - Recharts (Volatility envelopes & sigma bands)          |
|  - Two-Zone Dual Layout (Flagged vs Quiet)                |
+───────────────────────────────────────────────────────────+
```

### Components

- **Frontend:** Single-page application built with React 19 and TypeScript, using custom CSS for low-overhead rendering.
- **Backend:** FastAPI application running on Python 3.12 with asynchronous endpoints and background task workers.
- **Market Feed:** Asyncio background generator emitting 2-second tick intervals across 12 instruments.
- **Data Layer:** SQLAlchemy 2.0 async engine supporting SQLite for single-container cloud deployment and PostgreSQL for production cluster setups.
- **WebSocket / API:** Real-time bi-directional channel for tick streaming, stream pause/resume commands, and REST endpoints for watchlist CRUD operations.
- **State Management:** Zustand store for real-time WebSocket tick ingestion and TanStack Query v5 for REST resource caching.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | React 19, TypeScript | User interface and reactive state rendering |
| Bundler | Vite | Build tooling and local development server |
| State Management | Zustand | In-memory real-time tick caching and socket state |
| Data Fetching | TanStack Query v5 | REST API query caching and server-state sync |
| Charts | Recharts | Volatility envelope curve and $\pm 1\sigma$ band plotting |
| Styling | Vanilla CSS | Custom design tokens and tabular numerical layouts |
| Backend Framework | Python 3.12, FastAPI, Uvicorn | High-throughput async REST and WebSocket API |
| Database & ORM | SQLite (`aiosqlite`) / PostgreSQL (`asyncpg`), SQLAlchemy 2.0 | Relational data persistence and schema management |
| Migrations | Alembic | Database migration management |
| Cache & Pub/Sub | In-Memory Redis Adapter / Redis 7 (`redis-py`) | Sliding window storage and real-time event routing |
| Validation | Pydantic v2, `pydantic-settings` | Request/response data validation and configuration |
| Deployment | Docker, Render | Containerization and cloud hosting |

---

## Market Data

Groww Sense currently uses a simulated market feed for demonstration purposes.

The simulated price feed models 12 Indian equity instruments across three calibrated volatility profiles using Geometric Brownian Motion:

- **High Volatility ($\sigma = 0.025 - 0.030$):** Tata Motors (`TATAMOTORS`), Adani Enterprises (`ADANIENT`), Reliance Industries (`RELIANCE`).
- **Medium Volatility ($\sigma = 0.010 - 0.014$):** Infosys (`INFY`), TCS (`TCS`), HDFC Bank (`HDFCBANK`), Wipro (`WIPRO`), ICICI Bank (`ICICIBANK`), State Bank of India (`SBIN`).
- **Low Volatility / Defensive ($\sigma = 0.004 - 0.005$):** Nestlé India (`NESTLEIND`), Hindustan Unilever (`HINDUNILVR`), Pidilite Industries (`PIDILITIND`).

The generator emits tick updates every 2.0 seconds and intentionally introduces a 5% probability of stale or duplicate ticks to validate the backend ingestion guardrails.

---

## Screenshots

### Landing Page

![Groww Sense Starting Page](docs/screenshots/landing_page.png)

Overview screen presenting the core architecture pillars and access to the live monitoring dashboard.

### Watchlist Dashboard

![Watchlist Dashboard](docs/screenshots/watchlist_dashboard.png)

Live monitoring view showing real-time market pulse metrics, feed health, and dynamic segregation into Flagged and Quiet zones.

### Signal Explanation

![Signal Explanation & Volatility Band](docs/screenshots/signal_explanation.png)

Detailed explainability panel displaying rolling mean, standard deviation, current z-score, the 20-tick volatility curve, and signal replay controls.

---

## Project Structure

```
GrowwSense/
|-- Dockerfile                  # Multi-stage container build (Node frontend + Python backend)
|-- docker-compose.yml          # Multi-container configuration (PostgreSQL + Redis + App)
|-- render.yaml                 # Render Infrastructure-as-Code specification
|-- run.sh                      # Zero-dependency local startup script
|-- package.json                # Root project configuration
|-- docs/
|   \-- screenshots/            # Documentation images
|-- backend/
|   |-- alembic/                # Database migrations
|   |-- requirements.txt        # Python dependency specifications
|   |-- scripts/
|   |   \-- seed.py             # Database seed script for default demo user and instruments
|   \-- app/
|       |-- main.py             # FastAPI entrypoint and static asset mount
|       |-- config.py           # Configuration schema and environment parsing
|       |-- database.py         # SQLAlchemy async engine configuration
|       |-- memory_redis.py     # Fallback in-memory Redis implementation
|       |-- redis_client.py     # Redis connection factory
|       |-- models/             # SQLAlchemy ORM models (User, Watchlist, Instrument, LastSeen)
|       |-- routers/            # API endpoints (watchlists, instruments, websocket)
|       |-- services/           # Change detection and baseline diffing engines
|       \-- simulator/          # Price feed simulation worker
\-- frontend/
    |-- package.json            # Node dependency specifications
    |-- vite.config.ts          # Vite build configuration
    \-- src/
        |-- App.tsx             # Root application component and view routing
        |-- index.css           # Design tokens and global CSS styles
        |-- api/                # API client and TanStack query hooks
        |-- hooks/              # Custom React hooks (useWatchlistSocket)
        |-- store/              # Zustand state store
        \-- components/         # Modular UI components (Watchlist, ExplainPanel, etc.)
```

---

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher (with npm)

### Run Locally

Clone the repository and run the single zero-dependency setup script:

```bash
git clone https://github.com/eekshitaandhavarapu/Groww-Sense-Market-Signals.git
cd Groww-Sense-Market-Signals
chmod +x run.sh
./run.sh
```

This script installs dependencies, runs database migrations, seeds default instruments, and launches both the backend and frontend services.

### Application URLs

- **Frontend Application:** http://localhost:5173
- **Interactive Swagger Documentation:** http://localhost:8000/docs
- **API Health Check:** http://localhost:8000/api/health

---

## Docker

To run the application with PostgreSQL and Redis 7 using Docker:

```bash
docker compose up -d
```

Access the containerized application at:
- **Application & API:** http://localhost:8000
- **Interactive API Docs:** http://localhost:8000/docs

---

## Deployment

Groww Sense is configured for automated cloud deployment on Render via `render.yaml`.

The deployment architecture utilizes a multi-stage Docker build:
1. **Frontend Stage:** Compiles React 19 TypeScript source code into static assets (`/dist`).
2. **Backend Stage:** Installs Python dependencies, packages the FastAPI server, mounts the static frontend bundle, and runs database migrations on container start.

Production environment variables:
- `DATABASE_URL`: Managed PostgreSQL or SQLite connection string.
- `REDIS_URL`: Managed Redis or in-memory fallback connection string.
- `CORS_ORIGINS`: Comma-delimited list of authorized production origins.

---

## Demo / Evaluation Flow

1. **Access the Application:** Open the live deployment at [https://groww-sense-market-signals.onrender.com](https://groww-sense-market-signals.onrender.com) and click **Get Started**.
2. **Observe Watchlist Zones:** Review the live feed. Instruments exhibiting routine movement remain in the Quiet Zone, while instruments experiencing price anomalies are automatically promoted to the Flagged Zone.
3. **Inspect Real-Time Data Health:** Check the Data Health header to verify active WebSocket connection status, tick processing rate, and round-trip latency.
4. **Open Explainability Panel:** Click on any instrument card (such as *Tata Motors* or *Nestlé India*) to view its rolling parameters ($\mu$, $\sigma$, $z$-score) and volatility envelope chart.
5. **Replay Signal Trajectory:** Click **Replay Signal Sequence** inside the Explainability Panel to step through the 20 individual price ticks leading up to the anomaly.
6. **Review Session History & Insights:** Navigate to the **History** tab to inspect baseline price diffs since your last visit, and the **Insights** tab to analyze sector-wide volatility distributions.
7. **Simulate Feed Stall:** Click **Pause Stream** in the Data Health bar to verify that the UI handles stalled market feeds properly, then click **Resume** to restore live streaming.

---

## Limitations

- **Simulated Market Feed:** The current version operates on a calibrated synthetic price generator rather than a direct exchange feed.
- **Non-Predictive Anomaly Detection:** Rolling z-scores identify historical statistical outliers in recent tick data; they do not forecast future asset price directions.
- **No Financial Advice:** This software is an engineering demonstration of real-time statistical anomaly detection and does not constitute financial or investment recommendations.

---

## Future Improvements

- **Live Exchange Feed Integration:** Support for direct market data feeds (such as NSE/BSE WebSockets) via broker APIs.
- **User-Configurable Window & Sensitivity:** Interface controls allowing users to adjust the rolling window size ($N$) and z-score thresholds per instrument.
- **Advanced Anomaly Models:** Complementing rolling z-scores with exponential moving average (EMA) bands and volume-weighted anomaly detection (VWAP).
- **Multi-Watchlist Management:** Support for creating and managing multiple custom sector-specific watchlists.
