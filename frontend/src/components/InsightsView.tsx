/* InsightsView.tsx — Statistical market volatility analytics & sector dispersion */

import { useMemo } from 'react';
import type { WatchlistItem, LiveTick } from '../types';

interface InsightsViewProps {
  items: WatchlistItem[];
  ticks: Record<string, LiveTick>;
  onSelect: (item: WatchlistItem) => void;
}

export function InsightsView({ items, ticks, onSelect }: InsightsViewProps) {
  // Aggregate statistics
  const analytics = useMemo(() => {
    let noiseCount = 0;
    let notableCount = 0;
    let meaningfulCount = 0;
    let totalZ = 0;

    const sectorMap: Record<string, { totalZ: number; count: number }> = {};
    let maxZ = -1;
    let minZ = 999;
    let maxItem: WatchlistItem | null = null;
    let minItem: WatchlistItem | null = null;

    for (const item of items) {
      const tick = ticks[item.symbol];
      const z = Math.abs(tick?.z_score ?? item.z_score ?? 0);
      const sector = item.sector || 'General';

      totalZ += z;

      if (z >= 2.5) meaningfulCount++;
      else if (z >= 1.5) notableCount++;
      else noiseCount++;

      if (!sectorMap[sector]) sectorMap[sector] = { totalZ: 0, count: 0 };
      sectorMap[sector].totalZ += z;
      sectorMap[sector].count++;

      if (z > maxZ) {
        maxZ = z;
        maxItem = item;
      }
      if (z < minZ) {
        minZ = z;
        minItem = item;
      }
    }

    const total = items.length || 1;
    const avgZ = totalZ / total;

    const sectorRanks = Object.entries(sectorMap).map(([sector, data]) => ({
      sector,
      avgZ: data.totalZ / data.count,
      count: data.count,
    })).sort((a, b) => b.avgZ - a.avgZ);

    return {
      noisePct: (noiseCount / total) * 100,
      notablePct: (notableCount / total) * 100,
      meaningfulPct: (meaningfulCount / total) * 100,
      noiseCount,
      notableCount,
      meaningfulCount,
      avgZ,
      maxItem,
      maxZ: maxZ > 0 ? maxZ : 0,
      minItem,
      minZ: minZ < 999 ? minZ : 0,
      sectorRanks,
    };
  }, [items, ticks]);

  return (
    <div className="insights-view">
      <div className="insights-header-block">
        <h2 className="insights-title">Statistical Volatility Intelligence</h2>
        <p className="insights-subtitle">
          Real-time Gaussian distribution dispersion, sector clustering, and signal-to-noise ratio.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="insights-metrics-grid">
        <div className="insight-card">
          <span className="insight-card__label">Average Portfolio Dispersion</span>
          <span className="insight-card__value text-green">{analytics.avgZ.toFixed(2)}σ</span>
          <span className="insight-card__sub">Expected baseline: ~1.00σ</span>
        </div>

        <div
          className={`insight-card ${analytics.maxItem ? 'cursor-pointer hover-lift' : ''}`}
          onClick={() => analytics.maxItem && onSelect(analytics.maxItem)}
          role={analytics.maxItem ? 'button' : undefined}
          tabIndex={analytics.maxItem ? 0 : undefined}
        >
          <span className="insight-card__label">Highest Sigma Spike</span>
          <span className="insight-card__value text-amber">
            {analytics.maxZ.toFixed(2)}σ
          </span>
          <span className="insight-card__sub">
            {analytics.maxItem ? `${analytics.maxItem.symbol} • Click to Explain →` : 'None'}
          </span>
        </div>

        <div
          className={`insight-card ${analytics.minItem ? 'cursor-pointer hover-lift' : ''}`}
          onClick={() => analytics.minItem && onSelect(analytics.minItem)}
          role={analytics.minItem ? 'button' : undefined}
          tabIndex={analytics.minItem ? 0 : undefined}
        >
          <span className="insight-card__label">Most Stable Asset</span>
          <span className="insight-card__value">
            {analytics.minZ.toFixed(2)}σ
          </span>
          <span className="insight-card__sub">
            {analytics.minItem ? `${analytics.minItem.symbol} • Click to Explain →` : 'None'}
          </span>
        </div>
      </div>

      {/* Volatility Regime Distribution Bar */}
      <div className="insights-regime-card">
        <div className="insights-regime-header">
          <span className="insights-regime-title">Portfolio Regime Distribution</span>
          <span className="insights-regime-note">{items.length} monitored assets</span>
        </div>

        {/* Visual Stacked Bar */}
        <div className="regime-bar-track">
          <div
            className="regime-bar-seg regime-bar-seg--noise"
            style={{ width: `${analytics.noisePct}%` }}
            title={`Quiet/Noise: ${analytics.noiseCount} items (${analytics.noisePct.toFixed(0)}%)`}
          />
          <div
            className="regime-bar-seg regime-bar-seg--notable"
            style={{ width: `${analytics.notablePct}%` }}
            title={`Notable: ${analytics.notableCount} items (${analytics.notablePct.toFixed(0)}%)`}
          />
          <div
            className="regime-bar-seg regime-bar-seg--meaningful"
            style={{ width: `${analytics.meaningfulPct}%` }}
            title={`Meaningful: ${analytics.meaningfulCount} items (${analytics.meaningfulPct.toFixed(0)}%)`}
          />
        </div>

        {/* Legend */}
        <div className="regime-legend">
          <div className="regime-legend-item">
            <span className="legend-dot legend-dot--noise" />
            <span>Normal Chop (&lt;1.5σ): <strong>{analytics.noiseCount} ({analytics.noisePct.toFixed(0)}%)</strong></span>
          </div>
          <div className="regime-legend-item">
            <span className="legend-dot legend-dot--notable" />
            <span>Notable Drift (1.5σ–2.5σ): <strong>{analytics.notableCount} ({analytics.notablePct.toFixed(0)}%)</strong></span>
          </div>
          <div className="regime-legend-item">
            <span className="legend-dot legend-dot--meaningful" />
            <span>Meaningful Breakout (≥2.5σ): <strong>{analytics.meaningfulCount} ({analytics.meaningfulPct.toFixed(0)}%)</strong></span>
          </div>
        </div>
      </div>

      {/* Sector Relative Volatility Ranking */}
      <div className="insights-sector-card">
        <h3 className="insights-sector-title">Sector Volatility Breakdown</h3>
        <p className="insights-sector-sub">
          Relative dispersion across sectors. Higher σ indicates active momentum or sector-wide catalyst.
        </p>

        <div className="sector-ranking-list">
          {analytics.sectorRanks.map((sec, idx) => (
            <div key={sec.sector} className="sector-rank-row">
              <div className="sector-rank-info">
                <span className="sector-rank-num">#{idx + 1}</span>
                <span className="sector-rank-name">{sec.sector}</span>
                <span className="sector-rank-count">({sec.count} stocks)</span>
              </div>
              <div className="sector-rank-bar-wrap">
                <div
                  className="sector-rank-bar"
                  style={{ width: `${Math.min((sec.avgZ / 3) * 100, 100)}%` }}
                />
              </div>
              <span className={`sector-rank-z ${sec.avgZ >= 1.5 ? 'text-amber font-bold' : ''}`}>
                {sec.avgZ.toFixed(2)}σ
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology & Statistical Anomaly Framework */}
      <div className="insights-methodology-card">
        <div className="insights-methodology-header">
          <span className="insights-methodology-title">Detection Methodology & Statistical Framework</span>
          <span className="insights-methodology-badge">20-TICK ROLLING WINDOW</span>
        </div>

        <p className="insights-methodology-desc">
          Groww Sense continuously evaluates monitored equities against their live sliding window.
          Calculations use pure statistical anomaly detection—not sentiment modeling or buy/sell recommendations.
        </p>

        <div className="methodology-steps-grid">
          <div className="methodology-step">
            <span className="methodology-step__num">1</span>
            <span className="methodology-step__title">Collect 20-Tick Window</span>
            <span className="methodology-step__body">
              FIFO sliding buffer captures the latest 20 confirmed price ticks for each asset.
            </span>
          </div>

          <div className="methodology-step">
            <span className="methodology-step__num">2</span>
            <span className="methodology-step__title">Calculate Rolling Mean (μ)</span>
            <span className="methodology-step__body">
              Arithmetic mean computes dynamic equilibrium: μ = Σ(p) / 20.
            </span>
          </div>

          <div className="methodology-step">
            <span className="methodology-step__num">3</span>
            <span className="methodology-step__title">Compute Std Deviation (σ)</span>
            <span className="methodology-step__body">
              Sample standard deviation measures live market dispersion around the mean.
            </span>
          </div>

          <div className="methodology-step">
            <span className="methodology-step__num">4</span>
            <span className="methodology-step__title">Derive Z-Score</span>
            <span className="methodology-step__body">
              z = (Current Price − μ) / σ determines exact statistical distance from baseline.
            </span>
          </div>
        </div>

        <div className="methodology-thresholds-box">
          <div className="meth-thresh-item">
            <span className="sev-dot sev-dot--noise" />
            <span><strong>&lt; 1.50σ</strong>: Normal market noise (Kept in Watching zone)</span>
          </div>
          <div className="meth-thresh-item">
            <span className="sev-dot sev-dot--notable" />
            <span><strong>1.50σ – 2.50σ</strong>: Notable drift (Surfaced for monitoring)</span>
          </div>
          <div className="meth-thresh-item">
            <span className="sev-dot sev-dot--meaningful" />
            <span><strong>≥ 2.50σ</strong>: Meaningful breakout (High-priority anomaly flag)</span>
          </div>
        </div>

        <div className="methodology-disclaimer">
          <strong>Statistical Notice:</strong> Groww Sense identifies statistically unusual volatility deviations relative to recent historical bounds. It does not predict future returns, guarantee outcomes, or provide buy, sell, or hold financial recommendations.
        </div>
      </div>
    </div>
  );
}
