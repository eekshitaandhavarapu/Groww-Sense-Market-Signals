# Groww Sense

A real-time market monitoring platform designed to surface unusual stock movements while filtering routine market noise.

## Live Demo

[Groww Sense](https://groww-sense-market-signals.onrender.com)

## GitHub Repository

[View Source Code](https://github.com/eekshitaandhavarapu/Groww-Sense-Market-Signals)

---

## Overview

Groww Sense helps users identify stock movements that stand out from a stock's recent behavior.

Traditional percentage-based alerts use the same threshold across different stocks. This can result in frequent alerts for naturally volatile stocks while overlooking unusual movements in stocks that typically move less.

Groww Sense uses each stock's recent price behavior as its reference point, making it easier to distinguish routine market noise from movements that deserve attention.

---

## The Problem

Fixed percentage alerts can create two common problems:

- **Alert fatigue** — frequently moving stocks can generate unnecessary alerts.
- **Missed signals** — unusual movements in relatively stable stocks may not reach a fixed percentage threshold.

Groww Sense addresses this by evaluating movements relative to each stock's recent behavior.

---

## The Solution

Groww Sense continuously monitors tracked stocks and organizes them into two dashboard zones:

- **Quiet Zone** — stocks showing routine price behavior.
- **Flagged Zone** — stocks showing unusual movements that stand out from their recent activity.

Users can select a flagged stock to understand what changed, inspect its recent movement, and replay the sequence that led to the signal.

---

## Key Features

- **Real-Time Market Monitoring** — continuously updated stock activity.
- **Dual-Zone Watchlist** — separates routine activity from unusual movements.
- **Anomaly Detection** — identifies movements that deviate from recent stock behavior.
- **Signal Alerts** — highlights stocks requiring attention.
- **Signal Explanation** — provides context behind each flagged movement.
- **Signal Replay** — step through the price movement leading to a signal.
- **Volatility Visualization** — visual view of recent price behavior.
- **Session History** — review previously detected market events.
- **Market Insights** — view broader patterns across tracked stocks.
- **Data Health** — monitor the status of the market feed.
- **Stale-Data Handling** — helps prevent outdated market updates from affecting signals.

---

## Why Groww Sense?

Most alert systems ask:

> "Did the stock move by X%?"

Groww Sense asks:

> "Is this movement unusual for this stock?"

This distinction helps reduce routine notifications and brings attention to movements that stand out from a stock's normal recent behavior.

---

## How It Works

1. Market prices are continuously received for tracked stocks.
2. Recent price activity is used to establish a baseline for each stock.
3. New movements are compared against that recent behavior.
4. Unusual movements are classified and surfaced in the Flagged Zone.
5. Users can inspect the signal and review the movement that triggered it.

---

## How to Use

### 1. Open Groww Sense

Open the live application and select **Get Started**.

### 2. Explore the Watchlist

Review the tracked stocks and the **Quiet** and **Flagged** zones.

### 3. Watch for Signals

As market data updates, unusual movements are highlighted automatically.

### 4. Open a Flagged Stock

Select a flagged stock to understand why it was highlighted.

### 5. Inspect the Signal

Review the stock's recent movement and signal details.

### 6. Replay the Movement

Use **Replay Signal Sequence** to step through the price activity leading to the signal.

### 7. Review History and Insights

Explore previously detected events and broader market patterns.

---

## Screenshots

### Landing Page

![Groww Sense Landing Page](docs/screenshots/landing_page.png)

Introduction to Groww Sense and access to the market monitoring dashboard.

### Watchlist Dashboard

![Groww Sense Watchlist](docs/screenshots/watchlist_dashboard.png)

The watchlist separates routine activity from stocks showing unusual movements.

### Signal Explanation

![Groww Sense Signal Explanation](docs/screenshots/signal_explanation.png)

Detailed view of a detected movement with recent price behavior and signal context.

---

## Technology

| Area | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Python, FastAPI |
| Real-Time Communication | WebSockets |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| Charts | Recharts |
| Database | SQLite / PostgreSQL |
| Cache & Messaging | Redis / In-Memory Adapter |
| Containerization | Docker |
| Deployment | Render |

---

## Market Data

Groww Sense currently uses a **simulated market feed** for demonstration purposes.

The simulator generates continuously changing prices across a set of Indian equities with different volatility profiles, allowing the application to demonstrate real-time monitoring, anomaly detection, alerts, and data-health handling without relying on an external market-data provider.

---

## Deployment

Groww Sense is deployed on Render.

**Live Application:**  
https://groww-sense-market-signals.onrender.com

---

## Limitations

- The current demonstration uses simulated market data rather than a direct exchange feed.
- Groww Sense identifies unusual recent price behavior; it does not predict future prices.
- The application does not provide buy, sell, or hold recommendations.
- Groww Sense is a technical demonstration and is not financial advice.

---

## Future Improvements

- Integration with live market-data providers.
- Custom alert thresholds.
- Multiple user-defined watchlists.
- Additional market indicators.
- Extended historical analysis.
- More advanced anomaly-detection techniques.

---

## Hackathon

Built for the **Code, by Groww** hackathon.
