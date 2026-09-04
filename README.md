# Groww Sense

A real-time equity market monitoring system that surfaces statistically significant price anomalies using rolling volatility baselines instead of fixed percentage thresholds.

## Live Demo

https://groww-sense-market-signals.onrender.com

---

## Overview

Groww Sense is a real-time market surveillance application designed to filter out everyday market noise and isolate genuine price anomalies across tracked equities.

Standard market watchlists typically rely on uniform percentage change rules (such as alerting whenever a stock moves by 2%). This approach does not account for the natural differences between stocks:
- A 2% move in a fast-moving stock (like Tata Motors) is routine everyday noise.
- The same 2% move in a slow, steady stock (like Nestlé India) is a rare and significant event.

Groww Sense solves this by tracking a rolling memory of recent prices for each stock individually. By comparing every new price against that stock's recent baseline, the system automatically separates routine market fluctuations from meaningful anomalies.

---

## The Problem

Fixed percentage-based alerts create two major problems for traders:

1. **Alert Fatigue:** High-volatility stocks trigger constant false alarms even when trading normally.
2. **Missed Signals:** Low-volatility stocks rarely reach fixed percentage thresholds, causing unusual movements to go unnoticed.

---

## The Solution

Groww Sense dynamically organizes stocks into two distinct zones on the dashboard:

- **Quiet Zone:** Routine, expected price movements stay compact and unobtrusive.
- **Flagged Zone:** Stocks that experience unusual statistical price jumps or drops are automatically promoted to the top with clear severity badges.
- **Explain Panel & Replay:** Users can click any stock to view the step-by-step breakdown of why it was flagged and replay the last 20 price ticks frame-by-frame.

---

## Key Features

- **Rolling Volatility Anomaly Detection:** Dynamically calculates price deviation per stock.
- **20-Tick Rolling Memory:** Maintains a continuous window of the last 20 prices in memory.
- **Dual-Zone Watchlist:** Automatically splits stocks into Flagged and Quiet zones.
- **Signal Explanation Panel:** Displays the exact average, variance, and deviation values for full transparency.
- **20-Tick Signal Replay:** Step forward and backward through the price sequence leading up to an alert.
- **Data Health Bar:** Live WebSocket status, latency measurement, tick counter, and stream pause/resume controls.
- **Session History:** Tracks price changes and alerts that occurred since your last visit.
- **Market Insights:** Visual breakdown of portfolio volatility and sector distribution.
- **Simulated Market Feed:** 12 Indian equity instruments generating live ticks with realistic volatility.

---

## How the Anomaly Score is Calculated (Step-by-Step)

Instead of complex static rules, Groww Sense follows a simple 5-step statistical calculation for every incoming price tick:

### Step 1: Record Recent Prices
The system keeps a sliding window of the last **20 price ticks** for the stock.

### Step 2: Calculate the Rolling Average
Compute the average (mean) price across those 20 ticks:
```
Average Price = Sum of the last 20 prices / 20
```

### Step 3: Measure Normal Fluctuation (Standard Deviation)
Measure how much the price typically wiggles around that average:
```
Fluctuation (Standard Deviation) = Square root of the average squared difference from the mean
```

### Step 4: Compute the Z-Score
Calculate how many standard deviations away from normal the current price is:
```
Z-Score = (Current Price - Average Price) / Fluctuation
```

### Step 5: Classify the Signal
Based on the resulting Z-Score, the stock is categorized into one of three levels:

| Signal Level | Z-Score Range | What It Means | Dashboard Action |
|---|---|---|---|
| **Noise** | Z-Score is between -1.5 and +1.5 | Normal everyday price movement | Stays in the Quiet Zone |
| **Notable** | Z-Score is between 1.5 and 2.5 (positive or negative) | Price is moving faster than usual | Promoted to Flagged Zone with an amber badge |
| **Meaningful** | Z-Score is 2.5 or higher (positive or negative) | Highly unusual price anomaly | Placed at the top of Flagged Zone with a red badge |

### Edge-Case Handling
- **New Stocks (Fewer than 20 ticks):** Uses a fallback percentage threshold (1.5% for Notable, 3.0% for Meaningful) until 20 ticks are recorded.
- **Flat Prices (Zero Fluctuation):** When price does not change, protected against division by zero using standard fallback rules.
- **Stale or Out-of-Order Ticks:** Rejects any incoming ticks with timestamps older than the last recorded tick.

---

## System Workflow

```
1. Market Tick Arrives (Price + Timestamp)
          │
          ▼
2. Validate Timestamp (Discard duplicate or stale data)
          │
          ▼
3. Update 20-Tick Sliding Window in Memory
          │
          ▼
4. Calculate Rolling Average & Normal Fluctuation
          │
          ▼
5. Compute Z-Score = (Current Price - Average) / Fluctuation
          │
          ▼
6. Classify Signal (Noise / Notable / Meaningful)
          │
          ▼
7. Broadcast Update via WebSocket to Connected Users
          │
          ▼
8. UI Automatically Updates Zones & Volatility Charts
```

---

## Architecture

```
+───────────────────────────────────────────────────────────+
|                 Market Price Generator                    |
|  - Simulated real-time price feed (12 Indian equities)    |
|  - Generates ticks every 2 seconds                        |
+─────────────────────────────┬─────────────────────────────+
                              │
                              ▼
+───────────────────────────────────────────────────────────+
|                 Backend Service (FastAPI)                 |
|  - Change Detection Engine (Calculates 20-tick Z-Scores)  |
|  - Data Validator (Rejects stale and out-of-order ticks)  |
|  - REST Endpoints (/api/watchlists, /api/instruments)     |
|  - WebSocket Endpoint (/ws/watchlist/{id})                |
+─────────────────────────────┬─────────────────────────────+
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
+───────────────────────────+   +───────────────────────────+
|    Database Layer         |   |    Cache & Pub/Sub        |
|  - SQLite / PostgreSQL    |   |  - In-Memory Redis /      |
|  - SQLAlchemy 2.0 Async   |   |    Redis 7                |
|  - Stores users & lists   |   |  - 20-tick sliding window |
+───────────────────────────+   +───────────────────────────+
                              │
                              ▼
+───────────────────────────────────────────────────────────+
|                 Frontend Client (React 19)                |
|  - Dual-Zone Watchlist Layout (Flagged vs Quiet)          |
|  - Real-Time WebSocket Streaming                          |
|  - Interactive Volatility Band Chart                      |
|  - Frame-by-Frame Signal Replay                           |
+───────────────────────────────────────────────────────────+
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | React 19, TypeScript | Reactive user interface and components |
| Bundler | Vite | Fast development server and production build tool |
| State Management | Zustand | In-memory real-time tick caching and socket connection |
| Data Fetching | TanStack Query v5 | REST API query caching and synchronization |
| Charts | Recharts | 20-tick volatility curve and envelope charts |
| Styling | Custom CSS | Clean design system with tabular numerical layouts |
| Backend Framework | Python 3.12, FastAPI, Uvicorn | Async REST API and WebSocket server |
| Database & ORM | SQLite / PostgreSQL, SQLAlchemy 2.0 | User and watchlist data storage |
| Migrations | Alembic | Database schema migrations |
| Cache & Pub/Sub | In-Memory Redis / Redis 7 | 20-tick sliding window and real-time messaging |
| Data Validation | Pydantic v2 | Request/response data validation |
| Deployment | Docker, Render | Containerization and cloud hosting |

---

## Market Data Feed

Groww Sense currently uses a built-in simulated market feed for demonstration purposes.

The simulator generates live ticks every 2 seconds for 12 Indian equity instruments across three volatility profiles:

- **High Volatility:** Tata Motors (`TATAMOTORS`), Adani Enterprises (`ADANIENT`), Reliance Industries (`RELIANCE`).
- **Medium Volatility:** Infosys (`INFY`), TCS (`TCS`), HDFC Bank (`HDFCBANK`), Wipro (`WIPRO`), ICICI Bank (`ICICIBANK`), State Bank of India (`SBIN`).
- **Low Volatility (Defensive):** Nestlé India (`NESTLEIND`), Hindustan Unilever (`HINDUNILVR`), Pidilite Industries (`PIDILITIND`).

The feed includes a 5% chance of simulated stale ticks to test and verify the backend data validation rules.

---

## Screenshots

### Landing Page

![Groww Sense Starting Page](docs/screenshots/landing_page.png)

Starting screen introducing the core concept and providing entry to the live dashboard.

### Watchlist Dashboard

![Watchlist Dashboard](docs/screenshots/watchlist_dashboard.png)

Live dashboard with real-time WebSocket connection, showing stocks separated into Flagged and Quiet zones.

### Signal Explanation

![Signal Explanation & Volatility Band](docs/screenshots/signal_explanation.png)

Interactive inspection panel displaying the rolling average, fluctuation values, Z-score, volatility chart, and replay button.

---

## Project Structure

```
GrowwSense/
|-- Dockerfile                  # Multi-stage container build (Frontend + Backend)
|-- docker-compose.yml          # Multi-container setup (PostgreSQL + Redis + App)
|-- render.yaml                 # Render cloud deployment blueprint
|-- run.sh                      # One-command local startup script
|-- package.json                # Workspace configuration
|-- docs/
|   \-- screenshots/            # Application screenshot assets
|-- backend/
|   |-- alembic/                # Database migrations
|   |-- requirements.txt        # Python dependencies
|   |-- scripts/
|   |   \-- seed.py             # Database seed script for demo data
|   \-- app/
|       |-- main.py             # FastAPI entrypoint and static asset mount
|       |-- config.py           # Application settings and environment variables
|       |-- database.py         # SQLAlchemy database engine setup
|       |-- memory_redis.py     # Built-in in-memory Redis implementation
|       |-- redis_client.py     # Redis connection manager
|       |-- models/             # Database models (User, Watchlist, Instrument)
|       |-- routers/            # API endpoints (watchlists, instruments, websocket)
|       |-- services/           # Change detection and baseline diffing logic
|       \-- simulator/          # Price feed simulation engine
\-- frontend/
    |-- package.json            # Frontend dependencies
    |-- vite.config.ts          # Vite build configuration
    \-- src/
        |-- App.tsx             # Main application router
        |-- index.css           # Design tokens and styles
        |-- api/                # API client and query hooks
        |-- hooks/              # WebSocket hook (useWatchlistSocket)
        |-- store/              # Zustand state store
        \-- components/         # UI components (WatchlistView, ExplainPanel, etc.)
```

---

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher (with npm)

### Run Locally (Single Command)

Clone the repository and run the startup script:

```bash
git clone https://github.com/eekshitaandhavarapu/Groww-Sense-Market-Signals.git
cd Groww-Sense-Market-Signals
chmod +x run.sh
./run.sh
```

This single command installs dependencies, runs database migrations, seeds demo stocks, and starts both backend and frontend servers.

### Local URLs

- **Frontend App:** http://localhost:5173
- **Interactive API Documentation:** http://localhost:8000/docs
- **API Health Check:** http://localhost:8000/api/health

---

## Docker Setup

To run the complete application using Docker:

```bash
docker compose up -d
```

- **Application & API:** http://localhost:8000
- **Interactive Swagger Docs:** http://localhost:8000/docs

---

## Deployment

Groww Sense is configured for continuous deployment on Render via `render.yaml`.

The deployment uses a multi-stage Docker build:
1. **Frontend Stage:** Compiles the React 19 application into static production files (`/dist`).
2. **Backend Stage:** Installs Python packages, starts FastAPI with Uvicorn, mounts the frontend static files, and executes database migrations on launch.

---

## Demo / Evaluation Steps

1. **Open Live App:** Navigate to [https://groww-sense-market-signals.onrender.com](https://groww-sense-market-signals.onrender.com) and click **Get Started**.
2. **Observe Watchlist Zones:** Watch the live price updates. Normal stocks stay in the Quiet Zone, while stocks with sudden price movements move into the Flagged Zone.
3. **Check Data Health:** Look at the top bar to see active WebSocket connection, tick count, and live latency.
4. **Inspect Signal Calculation:** Click any stock (such as *Tata Motors* or *Nestlé India*) to open the Explain Panel and see its rolling average, fluctuation, and Z-Score.
5. **Replay Price History:** Click **Replay Signal Sequence** inside the Explain Panel to step backward and forward through the 20 ticks leading to the alert.
6. **Review History & Insights:** Open the **History** tab to see price baseline changes since your last visit, and the **Insights** tab to view portfolio volatility distribution.
7. **Test Stream Pause:** Click **Pause Stream** in the Data Health bar to test how the interface handles a stalled market feed, then click **Resume** to reconnect.

---

## Limitations

- **Simulated Feed:** Operates on synthetic price generation rather than a direct exchange data feed.
- **Statistical Detection, Not Prediction:** Identifies statistical outliers in recent history; does not predict future prices.
- **Demonstration Software:** Created for technical demonstration purposes and is not financial advice.

---

## Future Improvements

- Integration with live exchange broker APIs (NSE / BSE).
- User-customizable rolling window sizes and alert thresholds.
- Additional technical indicators such as Exponential Moving Averages (EMA) and Volume-Weighted Average Price (VWAP).
- Support for multiple customized watchlists.
