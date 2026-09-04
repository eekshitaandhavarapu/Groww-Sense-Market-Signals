/* FlaggedItem — expanded row for notable/meaningful instruments. */

import { SigmaBadge } from './SigmaBadge';
import type { WatchlistItem, LiveTick } from '../types';

interface FlaggedItemProps {
  item: WatchlistItem;
  liveTick?: LiveTick;
  onClick?: () => void;
}

/** Format price with ₹ and commas. */
function formatPrice(price: number | null): string {
  if (price == null) return '—';
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Compute % change from mean. */
function getPctChange(current: number, mean: number): number {
  if (mean === 0) return 0;
  return ((current - mean) / mean) * 100;
}

export function FlaggedItem({ item, liveTick, onClick }: FlaggedItemProps) {
  const price = liveTick?.price ?? item.current_price;
  const zScore = liveTick?.z_score ?? item.z_score;
  const mean = liveTick?.mean ?? item.mean;
  const stddev = liveTick?.stddev ?? item.stddev;
  const classification = liveTick?.classification ?? item.classification;
  const pctChange = price != null ? getPctChange(price, mean) : 0;
  const isPositive = pctChange >= 0;

  return (
    <div className="flagged-item" onClick={onClick}>
      <div className="flagged-item__row">
        <div className="flagged-item__info">
          <span className="flagged-item__symbol">{item.symbol}</span>
          <span className="flagged-item__name">{item.name}</span>
        </div>
        <div className="flagged-item__price-group">
          <span className="flagged-item__price price-value">{formatPrice(price)}</span>
          <span
            className={`flagged-item__delta delta ${isPositive ? 'text-green' : 'text-red'}`}
          >
            {isPositive ? '+' : ''}{pctChange.toFixed(2)}%
          </span>
          <SigmaBadge zScore={zScore} classification={classification} />
        </div>
      </div>

      <div className="flagged-item__explanation">
        <span>
          Moved <strong className="text-amber">{Math.abs(zScore).toFixed(1)}σ</strong>{' '}
          {zScore >= 0 ? 'above' : 'below'} its 20-tick rolling mean
          ({formatPrice(mean)} ± {formatPrice(stddev)})
        </span>
      </div>

      {item.since_last_seen && (
        <div className="since-last-seen">
          <span className="since-last-seen__label">Since you last checked: </span>
          <span className={item.since_last_seen.pct_delta >= 0 ? 'text-green' : 'text-red'}>
            {item.since_last_seen.pct_delta >= 0 ? '+' : ''}
            {formatPrice(item.since_last_seen.price_delta)} ({item.since_last_seen.pct_delta.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  );
}
