/* WatchlistView — main two-zone layout (flagged / watching). */

import { useState, useMemo } from 'react';
import { useWatchlist, useAddItem, useRemoveItem } from '../api/watchlistApi';
import { useWatchlistSocket } from '../hooks/useWatchlistSocket';
import { useWatchlistStore } from '../store/watchlistStore';
import { Header } from './Header';
import { FlaggedItem } from './FlaggedItem';
import { QuietItem } from './QuietItem';
import { ExplainPanel } from './ExplainPanel';
import { AddInstrument } from './AddInstrument';
import { WatchlistSkeleton } from './WatchlistSkeleton';
import { DashboardTabs } from './DashboardTabs';
import { DashboardIndexRow } from './DashboardIndexRow';
import { TopMovers } from './TopMovers';
import { AlertsView } from './AlertsView';
import { HistoryView } from './HistoryView';
import { InsightsView } from './InsightsView';
import { DataHealthBar } from './DataHealthBar';
import type { WatchlistItem } from '../types';

interface WatchlistViewProps {
  watchlistId: string;
  onLogout?: () => void;
}

export function WatchlistView({ watchlistId, onLogout }: WatchlistViewProps) {
  const { data: watchlist, isLoading, error } = useWatchlist(watchlistId);
  const { sendCommand } = useWatchlistSocket(watchlistId);
  const ticks = useWatchlistStore((s) => s.ticks);
  const wsStatus = useWatchlistStore((s) => s.wsStatus);

  const addItem = useAddItem(watchlistId);
  const removeItem = useRemoveItem(watchlistId);

  const [activeTab, setActiveTab] = useState<'watchlist' | 'alerts' | 'history' | 'insights'>('watchlist');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [replayTargetSymbol, setReplayTargetSymbol] = useState<string | null>(null);

  // Merge API data with live WS ticks and split into flagged/unflagged
  const { flagged, quiet } = useMemo(() => {
    if (!watchlist?.items) return { flagged: [], quiet: [] };

    const flaggedList: WatchlistItem[] = [];
    const quietList: WatchlistItem[] = [];

    for (const item of watchlist.items) {
      const tick = ticks[item.symbol];
      const z = tick?.z_score ?? item.z_score;
      const isFlagged = Math.abs(z) >= 1.5;

      if (isFlagged) {
        flaggedList.push(item);
      } else {
        quietList.push(item);
      }
    }

    return { flagged: flaggedList, quiet: quietList };
  }, [watchlist, ticks]);

  const existingSymbols = useMemo(
    () => new Set(watchlist?.items.map((i) => i.symbol) ?? []),
    [watchlist],
  );

  const handleAdd = (symbol: string) => {
    addItem.mutate(symbol, {
      onSuccess: () => {
        sendCommand('subscribe', symbol);
      },
    });
  };

  const handleRemove = (symbol: string) => {
    removeItem.mutate(symbol, {
      onSuccess: () => {
        sendCommand('unsubscribe', symbol);
      },
    });
  };

  // If viewing a specific item's explainability panel
  if (selectedItem) {
    return (
      <div className="app-container">
        <ExplainPanel
          item={selectedItem}
          liveTick={ticks[selectedItem.symbol]}
          onBack={() => setSelectedItem(null)}
          onOpenReplay={(sym) => {
            setReplayTargetSymbol(sym);
            setActiveTab('history');
            setSelectedItem(null);
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return <WatchlistSkeleton statusText="Loading instruments…" />;
  }

  if (error) {
    return (
      <div className="app-container">
        <Header wsStatus={wsStatus} onAddClick={() => {}} />
        <div className="empty-state">
          <div className="empty-state__text">Failed to load watchlist</div>
        </div>
      </div>
    );
  }

  const hasItems = watchlist && watchlist.items.length > 0;

  return (
    <div className="app-container">
      <Header
        wsStatus={wsStatus}
        onAddClick={() => setShowAddModal(true)}
        onLogout={onLogout}
      />

      {/* Data Health Bar: Feed status, latency, freshness, pause/resume simulation control */}
      <DataHealthBar />

      {/* Horizontal Tab Bar */}
      <DashboardTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'history') setReplayTargetSymbol(null);
        }}
        flaggedCount={flagged.length}
      />

      {/* Tab 1: Watchlist (Default) */}
      {activeTab === 'watchlist' && (
        <>
          {/* Index-style Benchmark Row (Real aggregate stats from instrument universe) */}
          {hasItems && (
            <DashboardIndexRow
              items={watchlist?.items ?? []}
              ticks={ticks}
              flaggedCount={flagged.length}
            />
          )}

          {/* Top Movers Grid (replaces Stocks in News, ranked by absolute z-score) */}
          {hasItems && (
            <TopMovers
              items={watchlist?.items ?? []}
              ticks={ticks}
              onSelect={(item) => setSelectedItem(item)}
            />
          )}

          {/* Zero instruments empty state */}
          {!hasItems ? (
            <div className="empty-watchlist-card">
              <div className="empty-watchlist-title">Your Watchlist is Empty</div>
              <div className="empty-watchlist-desc">
                Track stocks to see real-time price movements and detect statistically meaningful volatility anomalies.
              </div>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                + Add First Instrument
              </button>
            </div>
          ) : (
            <>
              {/* Flagged Zone */}
              {flagged.length > 0 && (
                <div className="flagged-zone">
                  <div className="section-header">
                    <span className="section-header__label">Flagged</span>
                    <span className="section-header__count">{flagged.length}</span>
                  </div>
                  {flagged.map((item) => (
                    <FlaggedItem
                      key={item.symbol}
                      item={item}
                      liveTick={ticks[item.symbol]}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              )}

              {/* Quiet Zone */}
              <div className="quiet-zone">
                <div className="section-header">
                  <span className="section-header__label">Watching</span>
                  <span className="section-header__count section-header__count--muted">
                    {quiet.length}
                  </span>
                </div>
                {quiet.length > 0 ? (
                  <div className="quiet-list">
                    {quiet.map((item) => (
                      <QuietItem
                        key={item.symbol}
                        item={item}
                        liveTick={ticks[item.symbol]}
                        onClick={() => setSelectedItem(item)}
                        onRemove={() => handleRemove(item.symbol)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__text">No quiet instruments. All items are flagged!</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Since Last Seen Banner (on first revisit) */}
          {watchlist && watchlist.items.some((i) => i.since_last_seen) && flagged.length === 0 && (
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--surface-white)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              color: 'var(--muted-400)',
            }}>
              Nothing unusual since your last visit. Prices are within normal ranges.
            </div>
          )}
        </>
      )}

      {/* Tab 2: Alerts View */}
      {activeTab === 'alerts' && (
        <AlertsView
          items={watchlist?.items ?? []}
          ticks={ticks}
          onSelect={(item) => setSelectedItem(item)}
        />
      )}

      {/* Tab 3: History View */}
      {activeTab === 'history' && (
        <HistoryView
          items={watchlist?.items ?? []}
          ticks={ticks}
          onSelect={(item) => setSelectedItem(item)}
          replaySymbol={replayTargetSymbol}
        />
      )}

      {/* Tab 4: Insights View */}
      {activeTab === 'insights' && (
        <InsightsView
          items={watchlist?.items ?? []}
          ticks={ticks}
          onSelect={(item) => setSelectedItem(item)}
        />
      )}

      {/* Add Instrument Modal */}
      {showAddModal && (
        <AddInstrument
          existingSymbols={existingSymbols}
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
