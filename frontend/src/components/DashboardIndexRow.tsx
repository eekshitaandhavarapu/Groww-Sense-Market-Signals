/* DashboardIndexRow.tsx — Real aggregate stats computed from instrument universe. */

import { useMemo } from 'react';
import type { WatchlistItem, LiveTick } from '../types';

interface DashboardIndexRowProps {
  items: WatchlistItem[];
  ticks: Record<string, LiveTick>;
  flaggedCount: number;
}

function formatCurrency(val: number): string {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardIndexRow({ items, ticks, flaggedCount }: DashboardIndexRowProps) {
  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        avgPrice: 0,
        avgPct: 0,
        topItem: null as WatchlistItem | null,
        topZ: 0,
        anomalyPct: 0,
      };
    }

    let totalPrice = 0;
    let totalPct = 0;
    let topItem: WatchlistItem | null = null;
    let maxZ = -1;
    let validCount = 0;

    for (const item of items) {
      const tick = ticks[item.symbol];
      const price = tick?.price ?? item.current_price ?? 0;
      const mean = tick?.mean ?? item.mean ?? price;
      const z = Math.abs(tick?.z_score ?? item.z_score ?? 0);
      const pct = mean > 0 ? ((price - mean) / mean) * 100 : 0;

      if (price > 0) {
        totalPrice += price;
        totalPct += pct;
        validCount++;
      }

      if (z > maxZ) {
        maxZ = z;
        topItem = {
          ...item,
          current_price: price,
          z_score: tick?.z_score ?? item.z_score,
        };
      }
    }

    const avgPrice = validCount > 0 ? totalPrice / validCount : 0;
    const avgPct = validCount > 0 ? totalPct / validCount : 0;
    const anomalyPct = items.length > 0 ? (flaggedCount / items.length) * 100 : 0;

    return {
      avgPrice,
      avgPct,
      topItem,
      topZ: maxZ > 0 ? maxZ : 0,
      anomalyPct,
    };
  }, [items, ticks, flaggedCount]);

  const isPulsePos = stats.avgPct >= 0;
  const topPrice = stats.topItem?.current_price ?? 0;
  const topZ = stats.topZ;

  return (
    <div className="index-cards-row">
      {/* Card 1: Market Pulse (Watchlist Aggregate Price & Mean Delta) */}
      <div className="index-card">
        <div className="index-card__top">
          <span className="index-card__name">Market Pulse</span>
          {/* Mini SVG Sparkline */}
          <svg className="index-card__sparkline" viewBox="0 0 58 22" fill="none">
            <path
              d={
                isPulsePos
                  ? 'M2 18 L16 14 L30 15 L44 8 L56 4'
                  : 'M2 4 L16 8 L30 7 L44 14 L56 18'
              }
              stroke={isPulsePos ? '#009E75' : '#E5453D'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="index-card__body">
          <span className="index-card__value">
            {stats.avgPrice > 0 ? formatCurrency(stats.avgPrice) : '—'}
          </span>
          <span className={`index-card__change ${isPulsePos ? 'text-green' : 'text-red'}`}>
            {isPulsePos ? '+' : ''}{stats.avgPct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Card 2: Peak Volatility (Highest z-score stock right now) */}
      <div className="index-card">
        <div className="index-card__top">
          <span className="index-card__name">
            Peak Volatility • {stats.topItem?.symbol ?? 'None'}
          </span>
          {/* Mini SVG Sparkline with anomaly peak */}
          <svg className="index-card__sparkline" viewBox="0 0 58 22" fill="none">
            <path
              d="M2 14 L14 12 L26 15 L38 3 L48 9 L56 5"
              stroke="#F5A623"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="index-card__body">
          <span className="index-card__value">
            {topPrice > 0 ? formatCurrency(topPrice) : '—'}
          </span>
          <span className={`index-card__change ${topZ >= 1.5 ? 'text-amber' : 'text-green'}`}>
            {topZ.toFixed(2)}σ
          </span>
        </div>
      </div>

      {/* Card 3: Anomaly Ratio (% of universe currently flagged) */}
      <div className="index-card">
        <div className="index-card__top">
          <span className="index-card__name">Anomaly Ratio</span>
          {/* Mini SVG Sparkline */}
          <svg className="index-card__sparkline" viewBox="0 0 58 22" fill="none">
            <path
              d="M2 15 L16 13 L30 11 L44 10 L56 8"
              stroke="#00D09C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="index-card__body">
          <span className="index-card__value">
            {flaggedCount} of {items.length} Flagged
          </span>
          <span className="index-card__change text-green">
            {stats.anomalyPct.toFixed(0)}% Active
          </span>
        </div>
      </div>
    </div>
  );
}
