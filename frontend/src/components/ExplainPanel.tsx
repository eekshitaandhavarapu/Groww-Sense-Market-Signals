/* ExplainPanel.tsx — Full statistical anomaly explainability panel & signal decomposition. */

import { useInstrumentHistory } from '../api/instrumentApi';
import { VolatilityChart } from './VolatilityChart';
import { SigmaBadge } from './SigmaBadge';
import type { WatchlistItem, LiveTick } from '../types';

interface ExplainPanelProps {
  item: WatchlistItem;
  liveTick?: LiveTick;
  onBack: () => void;
  onOpenReplay?: (symbol: string) => void;
}

function formatPrice(price: number | null): string {
  if (price == null) return '—';
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${Math.max(secs, 1)}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ExplainPanel({ item, liveTick, onBack, onOpenReplay }: ExplainPanelProps) {
  const { data: history, isLoading } = useInstrumentHistory(item.symbol);

  const price = liveTick?.price ?? item.current_price;
  const zScore = liveTick?.z_score ?? item.z_score;
  const mean = liveTick?.mean ?? item.mean;
  const stddev = liveTick?.stddev ?? item.stddev;
  const classification = liveTick?.classification ?? item.classification;
  const pctFromMean = mean ? ((price! - mean) / mean) * 100 : 0;
  const isPositive = pctFromMean >= 0;

  const since = item.since_last_seen;
  const zThen = since?.last_seen_z_score ?? 0.0;
  const zNow = Math.abs(zScore);

  return (
    <div className="explain-panel">
      {/* Top navigation actions */}
      <div className="explain-top-nav">
        <button className="explain-panel__back" onClick={onBack}>
          ← Back to Watchlist
        </button>

        {onOpenReplay && (
          <button
            className="btn-open-replay"
            onClick={() => onOpenReplay(item.symbol)}
          >
            Replay Signal Sequence →
          </button>
        )}
      </div>

      {/* Primary Header Card */}
      <div className="explain-panel__header">
        <div>
          <div className="explain-panel__symbol">
            {item.symbol}
            <span style={{ marginLeft: 10 }}>
              <SigmaBadge zScore={zScore} classification={classification} />
            </span>
          </div>
          <div className="explain-panel__name">
            {item.name} {item.sector && <span>• {item.sector}</span>}
          </div>
        </div>

        <div className="explain-panel__price-block">
          <div className="explain-panel__price price-value">
            {formatPrice(price)}
          </div>
          <div
            className={`explain-panel__pct ${isPositive ? 'text-green' : 'text-red'}`}
          >
            {isPositive ? '+' : ''}{pctFromMean.toFixed(2)}% vs rolling mean
          </div>
        </div>
      </div>

      {/* Numerical Metrics Summary Grid */}
      <div className="explain-metrics-grid">
        <div className="explain-metric-item">
          <span className="explain-metric-label">Rolling Mean (20-Tick)</span>
          <span className="explain-metric-val">{formatPrice(mean)}</span>
          <span className="explain-metric-sub">Expected equilibrium baseline</span>
        </div>

        <div className="explain-metric-item">
          <span className="explain-metric-label">Rolling Std Deviation (1σ)</span>
          <span className="explain-metric-val">{formatPrice(stddev)}</span>
          <span className="explain-metric-sub">Gaussian volatility dispersion</span>
        </div>

        <div className="explain-metric-item">
          <span className="explain-metric-label">Current Deviation</span>
          <span
            className={`explain-metric-val ${
              classification === 'meaningful'
                ? 'text-red'
                : classification === 'notable'
                ? 'text-amber'
                : 'text-green'
            }`}
          >
            {zScore >= 0 ? '+' : ''}{zScore.toFixed(2)}σ
          </span>
          <span className="explain-metric-sub">
            {classification === 'meaningful'
              ? 'Meaningful Anomaly (≥ 2.5σ)'
              : classification === 'notable'
              ? 'Notable Drift (1.5σ – 2.5σ)'
              : 'Routine Market Noise (< 1.5σ)'}
          </span>
        </div>

        <div className="explain-metric-item">
          <span className="explain-metric-label">Signal Status</span>
          <span className="explain-metric-val">
            <span className={`badge-inline badge-inline--${classification}`}>
              {classification.toUpperCase()}
            </span>
          </span>
          <span className="explain-metric-sub">20-tick sliding window</span>
        </div>
      </div>

      {/* Volatility Chart Card */}
      <div className="explain-card">
        <div className="explain-card__title">Volatility Regime & Sigma Envelope</div>
        {isLoading ? (
          <div className="loading" style={{ height: 200 }}>
            <div className="spinner" />
            Fetching volatility history…
          </div>
        ) : history ? (
          <>
            <VolatilityChart history={history} />
            <div className="explain-card__sentence">
              Current price is{' '}
              <strong className={classification === 'noise' ? 'text-green' : 'text-amber'}>
                {Math.abs(zScore).toFixed(2)} standard deviations
              </strong>{' '}
              {zScore >= 0 ? 'above' : 'below'} its 20-tick rolling mean (
              {formatPrice(mean)} ± {formatPrice(stddev)}). This move qualifies as{' '}
              <span className={`badge-inline badge-inline--${classification}`}>
                {classification.toUpperCase()}
              </span>{' '}
              relative to {item.symbol}'s recent price volatility.
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state__text">No rolling history available yet.</div>
          </div>
        )}
      </div>

      {/* Mathematical Signal Decomposition: Why Was This Flagged? */}
      <div className="explain-card">
        <div className="explain-card__title">Why Was This Flagged? (Mathematical Breakdown)</div>
        <p className="explain-subtext">
          The current price was compared against the rolling 20-tick mean and standard deviation.
          This is statistical anomaly detection, not predictive sentiment.
        </p>

        <div className="formula-box">
          <div className="formula-equation">
            z = (Current Price − Rolling Mean) / Rolling Standard Deviation
          </div>
          <div className="formula-substitution font-mono">
            z = ({formatPrice(price)} − {formatPrice(mean)}) / {formatPrice(stddev)} = {zScore >= 0 ? '+' : ''}{zScore.toFixed(2)}σ
          </div>
        </div>

        <div className="severity-legend-row">
          <div className={`severity-pill ${classification === 'noise' ? 'severity-pill--active' : ''}`}>
            <span className="sev-dot sev-dot--noise" />
            <span>NORMAL: |z| &lt; 1.50σ (Routine noise)</span>
          </div>
          <div className={`severity-pill ${classification === 'notable' ? 'severity-pill--active' : ''}`}>
            <span className="sev-dot sev-dot--notable" />
            <span>NOTABLE: 1.50σ ≤ |z| &lt; 2.50σ (Active drift)</span>
          </div>
          <div className={`severity-pill ${classification === 'meaningful' ? 'severity-pill--active' : ''}`}>
            <span className="sev-dot sev-dot--meaningful" />
            <span>MEANINGFUL: |z| ≥ 2.50σ (Statistical anomaly)</span>
          </div>
        </div>
      </div>

      {/* Since You Last Checked Card */}
      {since ? (
        <div className="explain-card">
          <div className="explain-card__title">Since You Last Checked</div>
          <div className="last-seen-card">
            <div className="last-seen-card__item">
              <span className="last-seen-card__label">Last Seen Price</span>
              <span className="last-seen-card__value price-value">
                {formatPrice(since.last_seen_price)}
              </span>
            </div>
            <div className="last-seen-card__item">
              <span className="last-seen-card__label">Recorded At</span>
              <span className="last-seen-card__value">
                {timeAgo(since.last_seen_at)}
              </span>
            </div>
            <div className="last-seen-card__item">
              <span className="last-seen-card__label">Price Delta</span>
              <span
                className={`last-seen-card__value ${
                  since.pct_delta >= 0 ? 'text-green' : 'text-red'
                }`}
              >
                {since.pct_delta >= 0 ? '+' : ''}
                {formatPrice(since.price_delta)} ({since.pct_delta >= 0 ? '+' : ''}
                {since.pct_delta.toFixed(2)}%)
              </span>
            </div>
            <div className="last-seen-card__item">
              <span className="last-seen-card__label">Z-Score Transition</span>
              <span className="last-seen-card__value text-amber">
                {Math.abs(zThen).toFixed(2)}σ → {zNow.toFixed(2)}σ
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="explain-card">
          <div className="explain-card__title">Since You Last Checked</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-400)' }}>
            This is your first view of this instrument during this session. A snapshot at{' '}
            <strong>{formatPrice(price)}</strong> has been recorded; future visits will display the delta and volatility transition.
          </p>
        </div>
      )}
    </div>
  );
}
