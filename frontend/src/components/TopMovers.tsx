/* TopMovers.tsx — Groww-style card grid ranked by absolute z-score. */

import { useMemo } from 'react';
import type { WatchlistItem, LiveTick } from '../types';

interface TopMoversProps {
  items: WatchlistItem[];
  ticks: Record<string, LiveTick>;
  onSelect: (item: WatchlistItem) => void;
}

function formatPrice(val: number | null): string {
  if (val == null) return '—';
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TopMovers({ items, ticks, onSelect }: TopMoversProps) {
  // Rank real watchlist items by absolute z-score descending
  const topMovers = useMemo(() => {
    if (!items || items.length === 0) return [];

    const merged = items.map((item) => {
      const tick = ticks[item.symbol];
      const price = tick?.price ?? item.current_price ?? 0;
      const mean = tick?.mean ?? item.mean ?? price;
      const z = tick?.z_score ?? item.z_score ?? 0;
      const pctChange = mean > 0 ? ((price - mean) / mean) * 100 : 0;
      const classification = tick?.classification ?? item.classification ?? 'noise';

      return {
        ...item,
        current_price: price,
        mean,
        z_score: z,
        pctChange,
        classification,
      };
    });

    // Sort by absolute z-score descending
    merged.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));

    // Show top 4 movers
    return merged.slice(0, 4);
  }, [items, ticks]);

  if (topMovers.length === 0) return null;

  return (
    <section className="top-movers-section">
      <div className="top-movers-header">
        <h3 className="top-movers-title">Top Movers</h3>
        <span className="top-movers-subtitle">Ranked by statistical z-score</span>
      </div>

      <div className="top-movers-grid">
        {topMovers.map((item) => {
          const isPos = item.pctChange >= 0;
          const isFlagged = item.classification === 'notable' || item.classification === 'meaningful';

          return (
            <div
              key={item.symbol}
              className="top-mover-card"
              onClick={() => onSelect(item)}
              role="button"
              tabIndex={0}
            >
              <div className="top-mover-card__header">
                <div className="top-mover-badge">
                  {item.symbol.slice(0, 2)}
                </div>
                <span
                  className={`top-mover-zscore ${
                    isFlagged ? 'top-mover-zscore--flagged' : 'top-mover-zscore--quiet'
                  }`}
                >
                  {Math.abs(item.z_score).toFixed(1)}σ
                </span>
              </div>

              <div className="top-mover-card__info">
                <span className="top-mover-symbol">{item.symbol}</span>
                <span className="top-mover-name" title={item.name}>
                  {item.name}
                </span>
              </div>

              <div className="top-mover-card__price-row">
                <span className="top-mover-price">{formatPrice(item.current_price)}</span>
                <span className={`top-mover-change ${isPos ? 'text-green' : 'text-red'}`}>
                  {isPos ? '+' : ''}{item.pctChange.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
