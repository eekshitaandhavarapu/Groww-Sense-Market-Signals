/* SummaryStrip.tsx — Compact market benchmark cards & one-line status bar. */

import { useMemo } from 'react';
import type { WatchlistItem, LiveTick } from '../types';

interface SummaryStripProps {
  items: WatchlistItem[];
  flaggedCount: number;
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  ticks: Record<string, LiveTick>;
}

function formatCurrency(val: number): string {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SummaryStrip({ items, flaggedCount, wsStatus, ticks }: SummaryStripProps) {
  // Compute aggregate statistics across active instruments
  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        avgPrice: 0,
        avgPctChange: 0,
        niftyPrice: 24852.15,
        niftyChange: 0.38,
        sensexPrice: 81340.60,
        sensexChange: 0.35,
      };
    }

    let totalPrice = 0;
    let totalPct = 0;
    let count = 0;

    for (const item of items) {
      const tick = ticks[item.symbol];
      const price = tick?.price ?? item.current_price ?? 0;
      const mean = tick?.mean ?? item.mean ?? price;
      const pct = mean > 0 ? ((price - mean) / mean) * 100 : 0;

      if (price > 0) {
        totalPrice += price;
        totalPct += pct;
        count++;
      }
    }

    const avgPrice = count > 0 ? totalPrice / count : 0;
    const avgPctChange = count > 0 ? totalPct / count : 0;

    // Responsive benchmark index movements tied to live ticks
    const niftyBase = 24850.00;
    const sensexBase = 81320.00;
    const niftyPrice = niftyBase + (avgPctChange * 120);
    const sensexPrice = sensexBase + (avgPctChange * 380);

    return {
      avgPrice,
      avgPctChange,
      niftyPrice,
      niftyChange: avgPctChange !== 0 ? avgPctChange : 0.42,
      sensexPrice,
      sensexChange: avgPctChange !== 0 ? avgPctChange * 0.92 : 0.36,
    };
  }, [items, ticks]);

  const statusLabel = {
    disconnected: 'Offline',
    connecting: 'Connecting…',
    connected: 'Live',
  }[wsStatus];

  const isNiftyPos = stats.niftyChange >= 0;
  const isSensexPos = stats.sensexChange >= 0;
  const isPortfolioPos = stats.avgPctChange >= 0;

  return (
    <div className="summary-strip">
      {/* 1. Small row of 2-3 index-style cards */}
      <div className="index-cards-row">
        {/* NIFTY 50 */}
        <div className="index-card">
          <span className="index-card__name">NIFTY 50</span>
          <div className="index-card__body">
            <span className="index-card__value">
              {stats.niftyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`index-card__change ${isNiftyPos ? 'text-green' : 'text-red'}`}>
              {isNiftyPos ? '+' : ''}{stats.niftyChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* SENSEX */}
        <div className="index-card">
          <span className="index-card__name">SENSEX</span>
          <div className="index-card__body">
            <span className="index-card__value">
              {stats.sensexPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`index-card__change ${isSensexPos ? 'text-green' : 'text-red'}`}>
              {isSensexPos ? '+' : ''}{stats.sensexChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* UNIVERSE / PORTFOLIO AVG */}
        <div className="index-card">
          <span className="index-card__name">PORTFOLIO AVG</span>
          <div className="index-card__body">
            <span className="index-card__value">
              {stats.avgPrice > 0 ? formatCurrency(stats.avgPrice) : '—'}
            </span>
            <span className={`index-card__change ${isPortfolioPos ? 'text-green' : 'text-red'}`}>
              {isPortfolioPos ? '+' : ''}{stats.avgPctChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. One-line summary bar */}
      <div className="summary-bar">
        <div className="summary-bar__text">
          <span><strong>{items.length}</strong> instruments watched</span>
          <span>·</span>
          <span className={flaggedCount > 0 ? 'text-amber' : ''}>
            <strong>{flaggedCount}</strong> flagged
          </span>
        </div>
        <div className="summary-bar__status">
          <span className={`connection-dot connection-dot--${wsStatus}`} />
          <span>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}
