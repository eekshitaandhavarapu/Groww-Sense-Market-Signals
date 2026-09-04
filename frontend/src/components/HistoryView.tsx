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
  const [exported, setExported] = useState(false);

  const handleStartReplay = (symbol: string) => {
    setActiveReplaySymbol(symbol);
    setSubTab('replay');
  };

  const handleExportCSV = () => {
    const headers = ['Symbol', 'Name', 'Sector', 'Last_Seen_Price', 'Current_Price', 'Price_Delta', 'Pct_Delta', 'Z_Score', 'Classification', 'Timestamp'];
    const rows = items.map((item) => {
      const tick = ticks[item.symbol];
      const currentPrice = tick?.price ?? item.current_price ?? 0;
      const currentZ = tick?.z_score ?? item.z_score ?? 0;
      const since = item.since_last_seen;
      const lastSeenPrice = since?.last_seen_price ?? item.mean ?? currentPrice;
      const deltaPrice = currentPrice - lastSeenPrice;
      const deltaPct = lastSeenPrice > 0 ? (deltaPrice / lastSeenPrice) * 100 : 0;
      const classification = Math.abs(currentZ) >= 2.5 ? 'Meaningful Anomaly' : Math.abs(currentZ) >= 1.5 ? 'Notable Movement' : 'Routine Noise';

      return [
        item.symbol,
        `"${item.name}"`,
        item.sector || 'General',
        lastSeenPrice.toFixed(2),
        currentPrice.toFixed(2),
        deltaPrice.toFixed(2),
        `${deltaPct.toFixed(2)}%`,
        currentZ.toFixed(2),
        classification,
        new Date().toISOString(),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `groww_sense_session_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="history-view">
      {/* Sub-Tab Navigation */}
      <div className="history-nav-bar">
        <div className="history-header-block">
          <h2 className="history-title">Session Comparison &amp; Signal History</h2>
          <p className="history-subtitle">
            Audit baseline price drift and replay tick-by-tick anomaly developments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {subTab === 'audit' && (
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                background: exported ? '#E6F9F3' : '#FFFFFF',
                border: exported ? '1px solid #00D09C' : '1px solid #DFE2E8',
                color: exported ? '#008764' : '#4B5565',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exported ? 'Downloaded!' : 'Export CSV Audit'}
            </button>
          )}

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
