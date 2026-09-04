/* HistoryView.tsx — Audit view of 'Since You Last Checked' baseline shifts & Signal Replay. */

import { useState } from 'react';
import { SignalReplay } from './SignalReplay';
import type { WatchlistItem, LiveTick } from '../types';

interface HistoryViewProps {
  items: WatchlistItem[];
  ticks: Record<string, LiveTick>;
  onSelect: (item: WatchlistItem) => void;
  replaySymbol?: string | null;
}

function formatPrice(val: number | null): string {
  if (val == null) return '—';
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function HistoryView({ items, ticks, onSelect, replaySymbol }: HistoryViewProps) {
  const [subTab, setSubTab] = useState<'audit' | 'replay'>(replaySymbol ? 'replay' : 'audit');
  const [activeReplaySymbol, setActiveReplaySymbol] = useState<string>(replaySymbol || items[0]?.symbol || 'RELIANCE');

  const handleStartReplay = (symbol: string) => {
    setActiveReplaySymbol(symbol);
    setSubTab('replay');
  };

  return (
    <div className="history-view">
      {/* Sub-Tab Navigation */}
      <div className="history-nav-bar">
        <div className="history-header-block">
          <h2 className="history-title">Session Comparison & Signal History</h2>
          <p className="history-subtitle">
            Audit baseline price drift and replay tick-by-tick anomaly developments.
          </p>
        </div>

        <div className="history-subtabs">
          <button
            type="button"
            className={`subtab-btn ${subTab === 'audit' ? 'subtab-btn--active' : ''}`}
            onClick={() => setSubTab('audit')}
          >
            Session Drift Audit
          </button>
          <button
            type="button"
            className={`subtab-btn ${subTab === 'replay' ? 'subtab-btn--active' : ''}`}
            onClick={() => setSubTab('replay')}
          >
            Signal Replay Engine
          </button>
        </div>
      </div>

      {subTab === 'replay' ? (
        <SignalReplay
          items={items}
          initialSymbol={activeReplaySymbol}
          onBack={() => setSubTab('audit')}
        />
      ) : (
        <div className="history-table-card">
          <table className="history-table">
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Sector</th>
                <th>Last Seen Price</th>
                <th>Current Price</th>
                <th>Net Change</th>
                <th>Z-Score Shift</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const tick = ticks[item.symbol];
                const currentPrice = tick?.price ?? item.current_price ?? 0;
                const currentZ = tick?.z_score ?? item.z_score ?? 0;
                const since = item.since_last_seen;
                const lastSeenPrice = since?.last_seen_price ?? item.mean ?? currentPrice;
                const deltaPrice = currentPrice - lastSeenPrice;
                const deltaPct = lastSeenPrice > 0 ? (deltaPrice / lastSeenPrice) * 100 : 0;
                const zThen = since?.last_seen_z_score ?? 0;
                const isPos = deltaPrice >= 0;

                return (
                  <tr key={item.symbol} onClick={() => onSelect(item)} className="history-row">
                    <td>
                      <div className="history-symbol-cell">
                        <span className="history-symbol">{item.symbol}</span>
                        <span className="history-name">{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="history-sector-pill">{item.sector || 'General'}</span>
                    </td>
                    <td className="price-value">{formatPrice(lastSeenPrice)}</td>
                    <td className="price-value font-bold">{formatPrice(currentPrice)}</td>
                    <td>
                      <span className={`history-delta ${isPos ? 'text-green' : 'text-red'}`}>
                        {isPos ? '+' : ''}{formatPrice(deltaPrice)} ({isPos ? '+' : ''}{deltaPct.toFixed(2)}%)
                      </span>
                    </td>
                    <td>
                      <span className="history-z-shift">
                        {Math.abs(zThen).toFixed(1)}σ → <strong>{Math.abs(currentZ).toFixed(1)}σ</strong>
                      </span>
                    </td>
                    <td>
                      <div className="history-row-actions">
                        <button
                          type="button"
                          className="btn-history-inspect"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(item);
                          }}
                          title="View mathematical signal breakdown"
                        >
                          Explain →
                        </button>
                        <button
                          type="button"
                          className="btn-history-replay"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartReplay(item.symbol);
                          }}
                          title="Replay anomaly emergence step-by-step"
                        >
                          Replay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
