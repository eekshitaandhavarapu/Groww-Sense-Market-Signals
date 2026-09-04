/* Shared TypeScript types for the Smart Watchlist frontend. */

export interface SinceLastSeen {
  last_seen_price: number;
  last_seen_at: string;
  price_delta: number;
  pct_delta: number;
  last_seen_z_score?: number;
  current_z_score?: number;
  z_score?: number;
  classification?: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  sector: string | null;
  current_price: number | null;
  z_score: number;
  mean: number;
  stddev: number;
  classification: 'noise' | 'notable' | 'meaningful';
  history_len: number;
  added_at: string | null;
  since_last_seen: SinceLastSeen | null;
}

export interface WatchlistResponse {
  id: string;
  name: string;
  user_id: string;
  items: WatchlistItem[];
  flagged_count: number;
  total_count: number;
}

export interface WatchlistSummary {
  id: string;
  name: string;
  item_count: number;
}

export interface Instrument {
  symbol: string;
  name: string;
  sector: string | null;
}

export interface InstrumentHistory {
  symbol: string;
  prices: number[];
  mean: number;
  stddev: number;
  z_score: number;
  classification: string;
  upper_band: number[];
  lower_band: number[];
}

export interface LiveTick {
  symbol: string;
  price: number;
  timestamp: string;
  z_score: number;
  mean: number;
  stddev: number;
  classification: 'noise' | 'notable' | 'meaningful';
  history_len: number;
}
