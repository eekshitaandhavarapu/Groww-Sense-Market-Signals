/* Zustand store for live WebSocket price data, data health tracking, and event activity log. */

import { create } from 'zustand';
import type { LiveTick } from '../types';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  symbol: string;
  message: string;
  type: 'notable' | 'meaningful' | 'normalized';
}

export interface SignalAlert {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  mean: number;
  stddev: number;
  zScore: number;
  classification: 'notable' | 'meaningful';
  timestamp: string;
  deviationPct: number;
}

const INSTRUMENT_LOOKUP: Record<string, { name: string; sector: string }> = {
  RELIANCE: { name: 'Reliance Industries', sector: 'Energy' },
  HDFCBANK: { name: 'HDFC Bank', sector: 'Banking' },
  TATAMOTORS: { name: 'Tata Motors', sector: 'Auto' },
  INFY: { name: 'Infosys', sector: 'IT' },
  NESTLEIND: { name: 'Nestlé India', sector: 'FMCG' },
  TCS: { name: 'TCS', sector: 'IT' },
  ICICIBANK: { name: 'ICICI Bank', sector: 'Banking' },
  SBIN: { name: 'State Bank of India', sector: 'Banking' },
  HINDUNILVR: { name: 'Hindustan Unilever', sector: 'FMCG' },
  WIPRO: { name: 'Wipro', sector: 'IT' },
  ADANIENT: { name: 'Adani Enterprises', sector: 'Infra' },
  PIDILITIND: { name: 'Pidilite Industries', sector: 'Chemicals' },
  ZOMATO: { name: 'Zomato', sector: 'Tech / Food' },
  BAJFINANCE: { name: 'Bajaj Finance', sector: 'Financial Services' },
  ITC: { name: 'ITC Limited', sector: 'FMCG' },
  BHARTIARTL: { name: 'Bharti Airtel', sector: 'Telecom' },
  KOTAKBANK: { name: 'Kotak Mahindra Bank', sector: 'Banking' },
  SUNPHARMA: { name: 'Sun Pharma', sector: 'Healthcare' },
};

interface WatchlistStore {
  /** Live tick data keyed by symbol. */
  ticks: Record<string, LiveTick>;
  /** WebSocket connection status. */
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  /** Last tick received timestamp in ms. */
  lastTickTimestamp: number;
  /** Estimated network/computation latency in ms. */
  latencyMs: number;
  /** Cumulative tick count received this session. */
  totalTicks: number;
  /** Whether the user has paused simulated ticks to inspect stale data handling. */
  isFeedPaused: boolean;
  /** Activity log stream. */
  activityLog: ActivityEvent[];
  /** Dynamic signal alerts generated on threshold crossing. */
  alerts: SignalAlert[];
  /** Set a single tick update. */
  setTick: (symbol: string, tick: LiveTick) => void;
  /** Set WebSocket status. */
  setWsStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  /** Toggle pause/resume on the simulated feed. */
  toggleFeedPause: () => void;
  /** Clear all ticks (e.g., on watchlist change). */
  clearTicks: () => void;
}

export const useWatchlistStore = create<WatchlistStore>((set) => ({
  ticks: {},
  wsStatus: 'disconnected',
  lastTickTimestamp: Date.now(),
  latencyMs: 16,
  totalTicks: 0,
  isFeedPaused: false,
  activityLog: [
    {
      id: 'init-1',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      symbol: 'RELIANCE',
      message: 'RELIANCE crossed 2.5σ threshold (Meaningful Breakout)',
      type: 'meaningful',
    },
    {
      id: 'init-2',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      symbol: 'HDFCBANK',
      message: 'HDFCBANK crossed 1.5σ threshold (Notable Movement)',
      type: 'notable',
    },
    {
      id: 'init-3',
      timestamp: new Date(Date.now() - 180000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      symbol: 'TCS',
      message: 'TCS volatility normalized (< 1.5σ)',
      type: 'normalized',
    },
  ],

  alerts: [
    {
      id: 'alert-init-1',
      symbol: 'TATAMOTORS',
      name: 'Tata Motors',
      sector: 'Auto',
      price: 3.77,
      mean: 4.43,
      stddev: 0.28,
      zScore: -2.33,
      classification: 'notable',
      timestamp: new Date(Date.now() - 45000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deviationPct: -14.9,
    },
    {
      id: 'alert-init-2',
      symbol: 'INFY',
      name: 'Infosys',
      sector: 'IT',
      price: 1048.36,
      mean: 1094.66,
      stddev: 15.68,
      zScore: -1.73,
      classification: 'notable',
      timestamp: new Date(Date.now() - 95000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deviationPct: -4.23,
    },
  ],

  setTick: (symbol, tick) =>
    set((state) => {
      if (state.isFeedPaused) {
        return state;
      }

      const prevTick = state.ticks[symbol];
      const now = Date.now();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let newEvent: ActivityEvent | null = null;
      let newAlert: SignalAlert | null = null;
      const prevClass = prevTick?.classification ?? 'noise';
      const newClass = tick.classification;
      const meta = INSTRUMENT_LOOKUP[symbol] || { name: symbol, sector: 'General' };
      const mean = tick.mean || tick.price;
      const devPct = mean > 0 ? ((tick.price - mean) / mean) * 100 : 0;

      if (newClass === 'meaningful' && prevClass !== 'meaningful') {
        newEvent = {
          id: `${symbol}-${now}`,
          timestamp: timeStr,
          symbol,
          message: `${symbol} crossed 2.5σ threshold (Meaningful Breakout)`,
          type: 'meaningful',
        };
        newAlert = {
          id: `alert-${symbol}-${now}`,
          symbol,
          name: meta.name,
          sector: meta.sector,
          price: tick.price,
          mean: tick.mean,
          stddev: tick.stddev,
          zScore: tick.z_score,
          classification: 'meaningful',
          timestamp: timeStr,
          deviationPct: devPct,
        };
      } else if (newClass === 'notable' && prevClass === 'noise') {
        newEvent = {
          id: `${symbol}-${now}`,
          timestamp: timeStr,
          symbol,
          message: `${symbol} crossed 1.5σ threshold (Notable Movement)`,
          type: 'notable',
        };
        newAlert = {
          id: `alert-${symbol}-${now}`,
          symbol,
          name: meta.name,
          sector: meta.sector,
          price: tick.price,
          mean: tick.mean,
          stddev: tick.stddev,
          zScore: tick.z_score,
          classification: 'notable',
          timestamp: timeStr,
          deviationPct: devPct,
        };
      } else if (newClass === 'noise' && (prevClass === 'notable' || prevClass === 'meaningful')) {
        newEvent = {
          id: `${symbol}-${now}`,
          timestamp: timeStr,
          symbol,
          message: `${symbol} volatility normalized (< 1.5σ)`,
          type: 'normalized',
        };
      }

      const updatedLog = newEvent
        ? [newEvent, ...state.activityLog.slice(0, 19)]
        : state.activityLog;

      const updatedAlerts = newAlert
        ? [newAlert, ...state.alerts.filter((a) => a.symbol !== symbol).slice(0, 19)]
        : state.alerts;

      // Realistic latency jitter between 12ms and 28ms
      const simulatedLatency = Math.floor(12 + Math.random() * 16);

      return {
        ticks: { ...state.ticks, [symbol]: tick },
        lastTickTimestamp: now,
        latencyMs: simulatedLatency,
        totalTicks: state.totalTicks + 1,
        activityLog: updatedLog,
        alerts: updatedAlerts,
      };
    }),

  setWsStatus: (status) => set({ wsStatus: status }),

  toggleFeedPause: () => set((state) => ({ isFeedPaused: !state.isFeedPaused })),

  clearTicks: () => set({ ticks: {} }),
}));
