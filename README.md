# Groww Sense

> **A smart market monitor that cuts out noise and only alerts you when a stock does something truly unusual.**

🔗 **Live Deployment:** [https://groww-sense-market-signals.onrender.com](https://groww-sense-market-signals.onrender.com)  
📦 **GitHub Repository:** [https://github.com/eekshitaandhavarapu/Groww-Sense-Market-Signals](https://github.com/eekshitaandhavarapu/Groww-Sense-Market-Signals)

---

## 💡 What is Groww Sense? (In Simple Words)

Imagine two students in a classroom:
- 🏃 **Leo (The Bouncy Kid):** Runs around and jumps all day. If Leo jumps today, nobody is surprised. That's just normal Leo!
- 📚 **Mia (The Quiet Kid):** Sits quietly and reads books. If Mia suddenly stands on her desk and starts shouting, **everyone looks up immediately!**

### The Problem with Traditional Stock Apps:
Traditional stock apps have one rigid rule for every stock: *"Alert me whenever any stock moves 2%!"*
- When **Leo (Tata Motors - a jumpy stock)** moves 2%, your phone buzzes — even though Tata Motors moves 2% every single day. That's just useless noise.
- When **Mia (Nestlé India - a quiet stock)** moves 2%, your phone buzzes the exact same way — even though Nestlé *almost never* moves that fast and something big just happened!

### How Groww Sense Solves This:
Groww Sense gives every stock its own memory. It learns what is "normal" for each stock and only speaks up when something rare happens:
1. 🤫 **Quiet Zone:** If a stock is just doing its normal everyday wiggle, Groww Sense keeps it calm and quiet so you aren't overwhelmed with notifications.
2. 🚨 **Flagged Zone:** If a quiet stock makes a sudden surprise jump (or sudden fall), Groww Sense immediately highlights it at the top with a clear badge.
3. 🔍 **Explain It to Me:** Click any alert to see a plain-English explanation and a step-by-step video-style replay of the last 20 price ticks so you know *why* the alert was triggered.

---

## 📸 Screenshots

### 1. Welcome & Starting Page
![Groww Sense Starting Page](docs/screenshots/landing_page.png)

### 2. Live Watchlist Dashboard (Flagged vs. Quiet Zones)
*Notice how volatile anomalies go straight to the top (Flagged Zone), while normal market noise stays in the Quiet Zone below.*
![Watchlist Dashboard](docs/screenshots/watchlist_dashboard.png)

### 3. Statistical Explainability Panel & Volatility Band
*Clicking any stock shows its dynamic volatility envelope ($\pm 1\sigma$ band) and step-by-step math.*
![Signal Explanation & Volatility Band](docs/screenshots/signal_explanation.png)

---

## 🎯 The Core Innovation: Rolling Volatility ($z$-scores)

Instead of relying on a static percentage cutoff like `+2.0%`, Groww Sense computes a real-time **Standard Score ($z$-score)** across the last **20 price ticks**:

$$\mu = \frac{1}{N} \sum_{i=1}^{N} p_i, \quad \sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (p_i - \mu)^2}, \quad z = \frac{p_{\text{current}} - \mu}{\sigma}$$

Where:
- $\mu$ (Mu) = The average price of the stock over the last 20 ticks
- $\sigma$ (Sigma) = The typical wiggle/volatility of the stock
- $z$ (Z-Score) = How many "wiggles" away from normal the current price is

### Signal Matrix

| Signal Level | What It Means | Statistical Condition | Watchlist Behavior | UI Badge |
|---|---|---|---|---|
| **Noise** | Normal everyday fluctuation | $|z| < 1.5\sigma$ | Stays in Quiet Zone | Neutral gray |
| **Notable** | Moving faster than usual | $1.5\sigma \le |z| < 2.5\sigma$ | Promoted to Flagged Zone | Amber badge (`+1.8σ`) |
| **Meaningful** | Highly unusual anomaly | $|z| \ge 2.5\sigma$ | Top of Flagged Zone | Red badge + Plain-English summary |

---

## 🏗️ Architecture & Data Flow

```
[Simulated Market Feed / Price Generator]
                 │ (2-second ticks via asyncio loop)
                 ▼
     [Change Detection Service]
                 │ 1. Validate monotonic timestamp
                 │ 2. Compute rolling mean (μ), stddev (σ), z-score
                 │ 3. Classify: Noise | Notable | Meaningful
                 ▼
      [In-Memory Redis Adapter / Redis 7]
                 │ LPUSH tick history (N=20)
                 │ PUBLISH to watchlist channel
                 ▼
        [FastAPI WebSocket Router]
                 │ Stream JSON frames (/ws/watchlist/{id})
                 ▼
          [React 19 Frontend]
                 │ Zustand Store + TanStack Query
                 │ Two-Zone Layout (Flagged / Quiet)
                 │ Recharts Volatility Band (Price, Mean, ±1σ)
                 ▼
              [User UI]
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Bundler:** Vite
- **State Management:** Zustand (real-time tick caching & socket state)
- **Data Fetching:** TanStack Query v5 (REST cache & fallback refetching)
- **Charts:** Recharts (20-tick volatility curve & $\pm 1\sigma$ envelopes)
- **Styling:** Custom Vanilla CSS Design System with tabular numerical alignment

### Backend
- **Framework:** Python 3.12 + FastAPI + Uvicorn
- **ORM / Database:** SQLAlchemy 2.0 (AsyncIO) + SQLite (`aiosqlite` for single-container local/cloud deploy) / PostgreSQL (`asyncpg`)
- **Migrations:** Alembic
- **Caching & Pub/Sub:** In-memory Redis adapter (zero external dependencies) / Redis 7
- **Validation:** Pydantic v2

---

## 📊 Market Feed Simulator

The backend includes a live market feed simulator with 12 Indian equities calibrated across 3 volatility tiers:

- ⚡ **High Volatility:** Tata Motors (`TATAMOTORS`), Adani Enterprises (`ADANIENT`), Reliance (`RELIANCE`)
- ⚖️ **Medium Volatility:** Infosys (`INFY`), HDFC Bank (`HDFCBANK`), TCS (`TCS`), Wipro, ICICI Bank, SBI
- 🛡️ **Defensive / Low Volatility:** Nestlé India (`NESTLEIND`), Hindustan Unilever (`HINDUNILVR`), Pidilite (`PIDILITIND`)

The simulator generates new ticks every 2 seconds via Geometric Brownian Motion and introduces a 5% deliberate stale-tick probability to exercise data integrity logic.

---

## 📂 Project Structure

```
GrowwSense/
|-- README.md             # Project documentation & walkthrough guide
|-- Dockerfile            # Unified multi-stage build (Node frontend + Python backend)
|-- render.yaml           # Render cloud deployment specification
|-- docker-compose.yml    # Multi-container setup (Postgres + Redis + App)
|-- package.json          # Root workspace scripts
|-- run.sh                # Zero-dependency local startup script
|-- docs/
|   \-- screenshots/      # Application UI screenshots
|-- backend/
|   |-- app/
|   |   |-- main.py       # FastAPI application entrypoint & static mount
|   |   |-- config.py     # Environment settings & CORS
|   |   |-- database.py   # Async SQLAlchemy engine
|   |   |-- models/       # User, Watchlist, Instrument, LastSeen tables
|   |   |-- routers/      # REST API endpoints & WebSocket handler
|   |   |-- services/     # Change detection & baseline diff logic
|   |   \-- simulator/    # 12-instrument price generator
|   |-- alembic/          # Database schema migrations
|   \-- requirements.txt  # Python backend dependencies
\-- frontend/
    |-- src/
    |   |-- components/   # WatchlistView, ExplainPanel, SignalReplay, etc.
    |   |-- store/        # Zustand real-time market store
    |   |-- api/          # TanStack query clients & fetch wrapper
    |   \-- index.css     # Design tokens & responsive styles
    \-- package.json      # Frontend dependencies
```

---

## 🚀 Running Locally

### Option 1: Single Startup Script (Zero External Dependencies)

Runs the backend (using SQLite and embedded memory Redis) and frontend together without requiring Docker:

```bash
./run.sh
```

- **Application:** [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Option 2: Docker (Single Command)

Builds the unified multi-stage container and starts PostgreSQL, Redis, and the web server:

```bash
docker compose up -d
```

- **Application & API:** [http://localhost:8000](http://localhost:8000)
- **Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 3: Manual Startup (Two Terminals)

#### Terminal 1 — Backend
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python scripts/seed.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Evaluator Walkthrough Guide

Follow these 9 simple steps to test the application:

1. **Starting Page:** Open the live link [https://groww-sense-market-signals.onrender.com](https://groww-sense-market-signals.onrender.com). Review the product overview and click **"Get Started"**.
2. **Watchlist Dual Zones:** Observe how normal stocks stay in the **Quiet Zone**, while stocks experiencing sudden deviation are promoted to the **Flagged Zone**.
3. **Data Health & Feed Status:** Inspect the Data Health bar at the top displaying active WebSocket connection, tick count, and latency.
4. **Inspect Signal Calculation:** Click any stock (e.g., *Tata Motors* or *Nestlé India*) to open the **ExplainPanel**. Review the breakdown of rolling mean ($\mu$), standard deviation ($\sigma$), price delta, and $z$-score.
5. **Volatility Envelope Chart:** View the price curve plotted against running mean and $\pm 1\sigma$ standard deviation bands.
6. **20-Tick Signal Replay:** Click **"Replay Signal Sequence"** in the ExplainPanel to launch the interactive scrubber. Step backward and forward through the 20 ticks leading up to the flagged anomaly.
7. **Session History:** Click the **History** tab to inspect recorded regime changes (Notable, Meaningful, Normalized) and compare current prices against your *"Since You Last Checked"* baseline.
8. **Insights & Volatility Breakdown:** Click the **Insights** tab to view sector dispersion and portfolio volatility distributions.
9. **Simulate Stale Data:** Click **"Pause Stream"** in the Data Health bar to test how the UI handles stalled market feeds. Click **"Resume"** to reconnect.
