/* QuietItem — compact row for unflagged (noise) instruments. */

import type { WatchlistItem, LiveTick } from '../types';

interface QuietItemProps {
  item: WatchlistItem;
  liveTick?: LiveTick;
  onClick?: () => void;
  onRemove: () => void;
}

function formatPrice(price: number | null): string {
  if (price == null) return '—';
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getPctChange(current: number, mean: number): number {
  if (mean === 0) return 0;
  return ((current - mean) / mean) * 100;
}

export function QuietItem({ item, liveTick, onClick, onRemove }: QuietItemProps) {
  const price = liveTick?.price ?? item.current_price;
  const mean = liveTick?.mean ?? item.mean;
  const pctChange = price != null ? getPctChange(price, mean) : 0;
  const isPositive = pctChange >= 0;

  return (
    <div
      className="quiet-item cursor-pointer"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="quiet-item__info">
        <span className="quiet-item__symbol">{item.symbol}</span>
        <span className="quiet-item__name">{item.name}</span>
      </div>
      <div className="quiet-item__price-group">
        <span className="quiet-item__price price-value">{formatPrice(price)}</span>
        <span
          className={`quiet-item__delta delta ${isPositive ? 'text-green' : 'text-red'}`}
        >
          {isPositive ? '+' : ''}{pctChange.toFixed(2)}%
        </span>
      </div>
      <button
        className="quiet-item__remove btn-icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title={`Remove ${item.symbol}`}
        aria-label={`Remove ${item.symbol}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
