/* LandingPage.tsx — Groww-inspired landing page matching exact hero & 2x3 grid pattern, with extended metrics, comparison demo, and footer to fill the space cleanly. */

import { useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const PRODUCT_CARDS = [
  {
    id: 'live-tracking',
    label: 'Live Tracking',
    description: 'Sub-second WebSocket feed continuously streaming real-time ticks.',
    tag: 'LIVE FEED',
  },
  {
    id: 'smart-flags',
    label: 'Smart Flags',
    description: 'Separates statistical anomalies from noise using |z| ≥ 1.5σ.',
    tag: 'STATISTICAL',
  },
  {
    id: 'explainable-signals',
    label: 'Explainable Signals',
    description: 'Full mathematical breakdown showing rolling mean, stddev, and ticks.',
    tag: 'TRANSPARENT',
  },
  {
    id: 'stale-data-handling',
    label: 'Stale Data Handling',
    description: 'Visual staleness warnings when market feeds halt or lag.',
    tag: 'GUARDED',
  },
  {
    id: 'per-user-history',
    label: 'Session History',
    description: 'Audit baseline price shifts and regime changes since your last visit.',
    tag: 'AUDITED',
  },
  {
    id: 'built-to-scale',
    label: 'Built to Scale',
    description: 'High-concurrency async event loop with sub-millisecond calculation.',
    tag: 'FAST API',
  },
];

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="groww-landing-page">
      {/* Groww Top Navigation Bar */}
      <div className="groww-navbar-wrapper">
        <div className="groww-container">
          <header className="groww-navbar">
            <div className="groww-navbar__left">
              <div className="groww-logo" onClick={onGetStarted}>
                <div className="groww-logo__circle">G</div>
                <span className="groww-logo__text">Groww Sense</span>
              </div>

              {/* Visual search bar like Groww's desktop header */}
              <div className="groww-nav-search">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search stocks, indices, anomalies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Pill-shaped Login / Get Started button */}
            <button className="btn-groww-nav-pill" onClick={onLogin}>
              Login / Get Started
            </button>
          </header>
        </div>
      </div>

      {/* Hero Section: Left-aligned text + Right 2x3 Grid */}
      <div className="groww-container">
        <section className="groww-hero">
          {/* Left Column: Left-aligned Hero Headline & CTA */}
          <div className="groww-hero__left">
            <h1 className="groww-hero__headline">
              Track the market,<br />
              know what <span className="highlight">actually changed</span>.
            </h1>

            <p className="groww-hero__supporting">
              Live 20-tick rolling <em>z</em>-scores that automatically separate real market momentum from daily noise. Never suffer from alert fatigue again.
            </p>

            <button className="btn-groww-cta" onClick={onGetStarted}>
              Get Started
            </button>
          </div>

          {/* Right Column: 2x3 Grid of 6 white cards (exact Groww layout) */}
          <div className="groww-hero__right">
            <div className="groww-hero-grid">
              {PRODUCT_CARDS.map((card) => (
                <div
                  key={card.id}
                  className="groww-product-card"
                  onClick={onGetStarted}
                  role="button"
                  tabIndex={0}
                >
                  <div className="groww-card-top">
                    <span className="groww-card-tag">{card.tag}</span>
                  </div>
                  <div>
                    <div className="groww-product-label">{card.label}</div>
                    <p className="groww-product-desc">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Anomaly Detection Comparison Demo Section */}
        <section className="groww-demo-section">
          <div className="groww-section-header">
            <span className="groww-section-tag">Signal vs Noise</span>
            <h2 className="groww-section-title">How Groww Sense eliminates false alerts</h2>
            <p className="groww-section-subtitle">
              Standard watchlists flash for every minor 0.1% fluctuation. Groww Sense analyzes rolling Gaussian volatility distributions so you only react when something truly statistically significant occurs.
            </p>
          </div>

          <div className="groww-demo-grid">
            {/* Quiet Routine Fluctuation Card */}
            <div className="groww-demo-card">
              <div className="groww-demo-badge groww-demo-badge--quiet">Quiet Zone • Routine Market Noise</div>
              <div className="groww-demo-stock">
                <div className="groww-demo-symbol">TCS</div>
                <div className="groww-demo-price">₹3,842.50 <span className="groww-demo-change text-green">+0.22%</span></div>
              </div>
              <div className="groww-demo-stats">
                <div className="stat-pill">Mean: ₹3,840.10</div>
                <div className="stat-pill">StdDev: ₹8.40</div>
                <div className="stat-pill z-low">z = +0.29σ (Noise)</div>
              </div>
              <p className="groww-demo-verdict">
                Price movement is within 1 standard deviation. Kept in the Watching zone to prevent alert fatigue.
              </p>
            </div>

            {/* Flagged Anomaly Card */}
            <div className="groww-demo-card groww-demo-card--flagged">
              <div className="groww-demo-badge groww-demo-badge--alert">Flagged Zone • Anomaly Detected</div>
              <div className="groww-demo-stock">
                <div className="groww-demo-symbol">RELIANCE</div>
                <div className="groww-demo-price">₹2,985.00 <span className="groww-demo-change text-green font-bold">+3.45%</span></div>
              </div>
              <div className="groww-demo-stats">
                <div className="stat-pill">Mean: ₹2,884.20</div>
                <div className="stat-pill">StdDev: ₹34.10</div>
                <div className="stat-pill z-high">z = +2.96σ (Meaningful)</div>
              </div>
              <p className="groww-demo-verdict">
                Move exceeds the 2.5σ threshold. Instantly surfaced to the Flagged zone with a 1-click volatility explanation.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="groww-cta-banner">
          <h2>Ready to trade with statistical clarity?</h2>
          <p>
            Join intelligent traders who monitor Indian equities with real-time volatility change-detection instead of static price alerts.
          </p>
          <button className="btn-groww-cta-white" onClick={onGetStarted}>
            Get Started — It's Free
          </button>
        </section>
      </div>

      {/* Clean Groww Footer */}
      <footer className="groww-footer">
        <div className="groww-container">
          <div className="groww-footer__content">
            <div className="groww-footer__left">
              <div className="groww-logo" onClick={onGetStarted}>
                <div className="groww-logo__circle">G</div>
                <span className="groww-logo__text">Groww Sense</span>
              </div>
              <span className="groww-footer__tagline">
                Real-Time Volatility Anomaly Detection Engine for Indian Equities
              </span>
            </div>

            <div className="groww-footer__badges">
              <span className="groww-footer__badge">WebSocket Stream</span>
              <span className="groww-footer__badge">Z-Score Engine</span>
              <span className="groww-footer__badge">FastAPI Backend</span>
              <span className="groww-footer__badge">React 18</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
