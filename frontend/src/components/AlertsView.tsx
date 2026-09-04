/* AlertsView.tsx — Live anomaly alert feed for instruments with |z| >= 1.5σ */

import { useState, useMemo } from 'react';
import { SigmaBadge } from './SigmaBadge';
import { useWatchlistStore } from '../store/watchlistStore';
import type { WatchlistItem, LiveTick } from '../types';

interface AlertsViewProps {
  items: WatchlistItem[];
  ticks: Record<string, LiveTick>;
  onSelect: (item: WatchlistItem) => void;
}

function formatPrice(val: number | null): string {
  if (val == null) return '—';
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AlertsView({ items, ticks, onSelect }: AlertsViewProps) {
  const [filter, setFilter] = useState<'all' | 'meaningful' | 'notable'>('all');
  const storeAlerts = useWatchlistStore((s) => s.alerts);

  // Derive anomaly alerts from both active tick feed and store alerts
  const alerts = useMemo(() => {
    const map = new Map<string, {
      item: WatchlistItem;
      price: number;
      zScore: number;
      classification: 'notable' | 'meaningful';
      timestamp: string;
      pctChange: number;
    }>();

    // 1. Current active anomalous stocks in monitored items
    for (const item of items) {
      const tick = ticks[item.symbol];
      const price = tick?.price ?? item.current_price ?? 0;
      const mean = tick?.mean ?? item.mean ?? price;
      const z = tick?.z_score ?? item.z_score ?? 0;
      const classification = tick?.classification ?? item.classification ?? 'noise';
      const pctChange = mean > 0 ? ((price - mean) / mean) * 100 : 0;
      const timestamp = tick?.timestamp ? new Date(tick.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live';

      if (classification === 'notable' || classification === 'meaningful' || Math.abs(z) >= 1.5) {
        map.set(item.symbol, {
          item: {
            ...item,
            current_price: price,
            z_score: z,
            mean,
            classification,
          },
          price,
          zScore: z,
          classification: Math.abs(z) >= 2.5 ? 'meaningful' : 'notable',
          timestamp,
          pctChange,
        });
      }
    }

    // 2. Session generated threshold-crossing alerts
    for (const sa of storeAlerts) {
      if (!map.has(sa.symbol)) {
        const itemMatch = items.find((i) => i.symbol === sa.symbol) || {
          symbol: sa.symbol,
          name: sa.name,
          sector: sa.sector,
          current_price: sa.price,
          z_score: sa.zScore,
          mean: sa.mean,
          stddev: sa.stddev,
          classification: sa.classification,
          history_len: 20,
          added_at: new Date().toISOString(),
          changed_since_last_seen: null,
          since_last_seen: null,
        };

        const liveTick = ticks[sa.symbol];
        const curPrice = liveTick?.price ?? sa.price;
        const curZ = liveTick?.z_score ?? sa.zScore;
        const curMean = liveTick?.mean ?? sa.mean;
        const curPct = curMean > 0 ? ((curPrice - curMean) / curMean) * 100 : sa.deviationPct;

        map.set(sa.symbol, {
          item: {
            ...itemMatch,
            current_price: curPrice,
            z_score: curZ,
          },
          price: curPrice,
          zScore: curZ,
          classification: Math.abs(curZ) >= 2.5 ? 'meaningful' : 'notable',
          timestamp: sa.timestamp,
          pctChange: curPct,
        });
      }
    }

    const list = Array.from(map.values());

    // Sort by absolute z-score descending
    list.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

    if (filter === 'meaningful') {
      return list.filter((a) => a.classification === 'meaningful');
    }
    if (filter === 'notable') {
      return list.filter((a) => a.classification === 'notable');
    }
    return list;
  }, [items, ticks, storeAlerts, filter]);

  const stats = useMemo(() => {
    let peakZ = 0;
    let peakSymbol = 'None';
    for (const item of items) {
      const tick = ticks[item.symbol];
      const z = Math.abs(tick?.z_score ?? item.z_score ?? 0);
      if (z > peakZ) {
        peakZ = z;
        peakSymbol = item.symbol;
      }
    }
    return { peakZ, peakSymbol };
  }, [items, ticks]);

  return (
    <div className="alerts-view">
      {/* Metric Summary Cards */}
      <div className="alerts-summary-grid">
        <div className="alert-stat-card">
          <span className="alert-stat-card__label">Active Anomaly Flags</span>
          <span className="alert-stat-card__value text-amber">{alerts.length}</span>
          <span className="alert-stat-card__sub">Across {items.length} monitored stocks</span>
        </div>

        <div className="alert-stat-card">
          <span className="alert-stat-card__label">Peak Sigma Deviation</span>
          <span className="alert-stat-card__value">
            {stats.peakZ > 0 ? `${stats.peakZ.toFixed(2)}σ` : '—'}
          </span>
          <span className="alert-stat-card__sub">{stats.peakSymbol}</span>
        </div>

        <div className="alert-stat-card">
          <span className="alert-stat-card__label">Anomaly Threshold</span>
          <span className="alert-stat-card__value text-green">|z| ≥ 1.50σ</span>
          <span className="alert-stat-card__sub">20-tick rolling window</span>
        </div>
      </div>

      {/* Signal Severity Threshold Reference */}
      <div className="threshold-bar-card">
        <div className="threshold-tier">
          <span className="sev-dot sev-dot--noise" />
          <span className="threshold-tier__name">NORMAL NOISE</span>
          <span className="threshold-tier__range">|z| &lt; 1.50σ</span>
          <span className="threshold-tier__desc">Routine fluctuations (Watching)</span>
        </div>
        <div className="threshold-tier">
          <span className="sev-dot sev-dot--notable" />
          <span className="threshold-tier__name">NOTABLE DRIFT</span>
          <span className="threshold-tier__range">1.50σ ≤ |z| &lt; 2.50σ</span>
          <span className="threshold-tier__desc">Surfaced for monitoring</span>
        </div>
        <div className="threshold-tier">
          <span className="sev-dot sev-dot--meaningful" />
          <span className="threshold-tier__name">MEANINGFUL ANOMALY</span>
          <span className="threshold-tier__range">|z| ≥ 2.50σ</span>
          <span className="threshold-tier__desc">High-priority statistical spike</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="alerts-filter-bar">
        <div className="alerts-filter-buttons">
          <button
            type="button"
            className={`filter-btn ${filter === 'all' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'meaningful' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter('meaningful')}
          >
            Meaningful (≥ 2.5σ)
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'notable' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter('notable')}
          >
            Notable (1.5σ – 2.5σ)
          </button>
        </div>
      </div>

      {/* Alerts Event Feed */}
      {alerts.length === 0 ? (
        <div className="empty-state" style={{ background: '#FFFFFF', borderRadius: 12, padding: 48 }}>
          <div className="empty-state__text" style={{ fontSize: '1rem', fontWeight: 600 }}>
            Market Quiet: No Active Anomaly Flags
          </div>
          <p style={{ color: 'var(--muted-400)', fontSize: '0.875rem', marginTop: 6 }}>
            All stocks are currently fluctuating within normal expected boundaries (&lt; 1.5σ).
          </p>
        </div>
      ) : (
        <div className="alerts-feed-list">
          {alerts.map(({ item, price, zScore, classification, timestamp, pctChange }) => (
            <div
              key={item.symbol}
              className="alert-feed-item"
              onClick={() => onSelect(item)}
              role="button"
              tabIndex={0}
            >
              <div className="alert-feed-item__left">
                <div className="alert-feed-badge">
                  {item.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="alert-feed-symbol">
                    {item.symbol}
                    <span style={{ marginLeft: 8 }}>
                      <SigmaBadge zScore={zScore} classification={classification} />
                    </span>
                  </div>
                  <div className="alert-feed-name">
                    {item.name} {item.sector ? `• ${item.sector}` : ''}
                  </div>
                </div>
              </div>

              <div className="alert-feed-item__right">
                <div className="alert-feed-price price-value">{formatPrice(price)}</div>
                <div
                  className={`alert-feed-delta ${
                    pctChange >= 0 ? 'text-green' : 'text-red'
                  }`}
                >
                  {pctChange >= 0 ? '+' : ''}
                  {pctChange.toFixed(2)}% vs mean
                </div>
                <div className="alert-feed-time">{timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
