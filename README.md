# Groww Sense

A real-time market monitoring platform designed to surface unusual stock movements while filtering routine market noise.

## Live Demo

https://groww-sense-market-signals.onrender.com

---

## Overview

Traditional stock watchlists usually rely on static percentage rules to trigger alerts, such as notifying users whenever a stock moves by 2%. This one-size-fits-all approach ignores the fact that different stocks have fundamentally different trading patterns.

A 2% price swing in a volatile stock may be ordinary daily noise, while that exact same 2% shift in a stable stock can indicate a rare and significant event.

Groww Sense addresses this by continuously evaluating each stock against its own recent price activity. By establishing a per-instrument baseline, the platform highlights genuinely unusual price behavior while keeping everyday fluctuations quiet and unobtrusive.

---

## Problem

Fixed percentage-based alert systems create two core problems:

- **Alert Fatigue:** Naturally volatile stocks trigger constant alerts even during ordinary trading sessions.
- **Missed Signals:** Important abnormal movements in low-volatility stocks are frequently missed because they do not cross high fixed percentage hurdles.

---

## Solution

Groww Sense maintains a rolling view of recent price behavior for each tracked stock and uses that baseline to distinguish routine fluctuations from unusual movements.

Stocks are automatically categorized based on how far their current price deviates from their recent normal behavior:
- Routine movements remain in the **Quiet Zone** to reduce distraction.
- Significant deviations are promoted to the **Flagged Zone** with clear visual indicators.
- Users can view a transparent explanation and replay the recent price history leading up to any signal.

---

## Key Features

- Real-time market monitoring via WebSockets
- Dual-zone watchlist separating flagged movements from routine activity
- Dynamic anomaly detection based on individual stock behavior
- Visual signal alerts with severity levels
- Plain-language signal explanations
- Interactive step-by-step signal replay
- Volatility band charts
- Session history tracking changes since your last visit
- Market insights with portfolio volatility distribution
- Real-time data health and connection latency monitoring
- Stale and duplicate data rejection
- Built-in multi-asset market feed simulator

---

## How It Works

1. **Continuous Ingestion:** Market price ticks are received in real time with timestamp validation.
2. **Baseline Tracking:** The system tracks a rolling window of recent prices for each stock.
3. **Deviation Detection:** Every new price is measured against the stock's recent average and typical price dispersion.
4. **Zone Allocation:** Stocks experiencing unusual price shifts are promoted to the Flagged Zone, while normal activity stays in the Quiet Zone.
5. **Inspection and Replay:** Users can click any stock to view the exact values behind the signal and replay the recent tick progression.

---

## Screenshots

### Landing Page

![Landing Page](docs/screenshots/landing_page.png)

Introductory overview presenting the core concepts and access to the live monitoring platform.

### Watchlist

![Watchlist](docs/screenshots/watchlist_dashboard.png)

Live dashboard displaying real-time market data organized into distinct Flagged and Quiet zones.

### Signal Explanation

![Signal Explanation](docs/screenshots/signal_explanation.png)

Detailed inspection view showing the baseline values, volatility curve, and signal replay controls.

---

## Technology

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| Backend | Python 3.12, FastAPI |
| Real-time Communication | WebSockets |
| State Management | Zustand |
| Data Fetching | TanStack Query v5 |
| Charts | Recharts |
| Database | SQLite / PostgreSQL, SQLAlchemy 2.0 |
| Cache & Pub/Sub | Redis / In-memory adapter |
| Deployment | Docker, Render |

---

## Market Data

Groww Sense currently uses a simulated market feed to demonstrate real-time monitoring and anomaly detection. The simulator generates price updates across a set of Indian equities with different volatility profiles, including deliberate edge cases to verify data integrity and validation rules.

---

## Deployment

Groww Sense is deployed on Render using a multi-stage Docker container.

Live Application: https://groww-sense-market-signals.onrender.com

---

## Limitations

- The current application uses a simulated market feed for demonstration purposes rather than live exchange data.
- The platform identifies unusual historical price movements and does not predict future price trends.
- The project is an engineering demonstration and is not intended to provide investment or financial advice.

---

## Future Improvements

- Integration with live exchange broker APIs (NSE / BSE).
- User-configurable baseline windows and alert sensitivity thresholds.
- Additional technical indicators including EMA and VWAP bands.
- Support for creating multiple custom sector watchlists.
- Extended historical analytics and exportable session reports.
