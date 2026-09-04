/* DataHealthBar.tsx — Feed status, latency, data freshness, pause/resume simulation control, anomaly spike injection, and activity stream. */

import { useState, useEffect } from 'react';
import { useWatchlistStore } from '../store/watchlistStore';
import { apiFetch } from '../api/client';

export function DataHealthBar() {
  const wsStatus = useWatchlistStore((s) => s.wsStatus);
  const lastTickTimestamp = useWatchlistStore((s) => s.lastTickTimestamp);
  const latencyMs = useWatchlistStore((s) => s.latencyMs);
  const totalTicks = useWatchlistStore((s) => s.totalTicks);
  const isFeedPaused = useWatchlistStore((s) => s.isFeedPaused);
  const toggleFeedPause = useWatchlistStore((s) => s.toggleFeedPause);
  const activityLog = useWatchlistStore((s) => s.activityLog);

  const [secondsAgo, setSecondsAgo] = useState(0);
  const [showActivity, setShowActivity] = useState(false);
  const [spikeLoading, setSpikeLoading] = useState(false);
  const [spikeToast, setSpikeToast] = useState<string | null>(null);

  // Update seconds ago live counter
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - lastTickTimestamp) / 1000);
      setSecondsAgo(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastTickTimestamp]);

  const handleTriggerSpike = async (symbol: string = 'TATAMOTORS') => {
    setSpikeLoading(true);
    try {
      await apiFetch(`/instruments/${symbol}/spike?direction=up&magnitude=3.2`, {
        method: 'POST',
      });
      setSpikeToast(`Injected +3.2σ spike on ${symbol}!`);
      setTimeout(() => setSpikeToast(null), 3000);
    } catch (err) {
      console.error('Failed to trigger spike:', err);
    } finally {
      setSpikeLoading(false);
    }
  };

  const isStale = isFeedPaused || secondsAgo >= 8;
  const freshness = isStale ? (isFeedPaused ? '0.0%' : '92.4%') : '99.8%';

  return (
    <div className="data-health-wrapper">
      <div className="data-health-bar">
        {/* Left: Feed Status & Metrics */}
        <div className="data-health-metrics">
          <div className="health-item">
            <span
              className={`health-dot ${
                isStale ? 'health-dot--stale' : 'health-dot--live'
              }`}
            />
            <span className="health-label">FEED STATUS:</span>
            <span className={`health-val ${isStale ? 'text-amber font-bold' : 'text-green font-bold'}`}>
              {isFeedPaused ? 'PAUSED' : isStale ? 'DELAYED' : 'LIVE'}
            </span>
          </div>

          <div className="health-divider" />

          <div className="health-item">
            <span className="health-label">LAST TICK:</span>
            <span className="health-val font-mono">
              {secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
            </span>
          </div>

          <div className="health-divider" />

          <div className="health-item">
            <span className="health-label">LATENCY:</span>
            <span className="health-val font-mono">{latencyMs} ms</span>
          </div>

          <div className="health-divider" />

          <div className="health-item">
            <span className="health-label">TICKS:</span>
            <span className="health-val font-mono">{totalTicks.toLocaleString()}</span>
          </div>

          <div className="health-divider" />

          <div className="health-item">
            <span className="health-label">SOCKET:</span>
            <span className="health-val font-mono">{wsStatus.toUpperCase()}</span>
          </div>

          <div className="health-divider" />

          <div className="health-item">
            <span className="health-label">FRESHNESS:</span>
            <span className="health-val font-mono">{freshness}</span>
          </div>
        </div>

        {/* Right: Simulation Controls & Trigger Anomaly Spike */}
        <div className="data-health-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Spike Anomaly Trigger Button */}
          <button
            type="button"
            className="btn-health-control"
            onClick={() => handleTriggerSpike('TATAMOTORS')}
            disabled={spikeLoading}
            style={{
              background: '#FEF3DB',
              border: '1px solid #F5A623',
              color: '#D48E1A',
              fontWeight: 700,
            }}
            title="Inject an intentional 3.2σ anomaly to test live Flagged Zone promotion"
          >
            {spikeLoading ? 'Triggering...' : '⚡ Test 3σ Spike'}
          </button>

          {/* Pause / Resume button for demoing stale-data handling */}
          <button
            type="button"
            className={`btn-health-control ${isFeedPaused ? 'btn-health-control--paused' : ''}`}
            onClick={toggleFeedPause}
            title={isFeedPaused ? 'Resume simulated tick stream' : 'Pause ticks to test stale-data handling'}
          >
            {isFeedPaused ? 'Resume Stream' : 'Pause Stream (Test Stale)'}
          </button>

          {/* Activity Drawer Toggle */}
          <button
            type="button"
            className={`btn-activity-toggle ${showActivity ? 'btn-activity-toggle--active' : ''}`}
            onClick={() => setShowActivity(!showActivity)}
          >
            Recent Activity ({activityLog.length})
          </button>
        </div>
      </div>

      {/* Spike notification toast */}
      {spikeToast && (
        <div
          style={{
            background: '#E6F9F3',
            border: '1px solid #00D09C',
            color: '#008764',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            fontWeight: 700,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          {spikeToast} (Watch the Flagged Zone and badge promote in real-time)
        </div>
      )}

      {/* Stale Warning Banner if paused or lagging */}
      {isStale && (
        <div className="stale-warning-banner">
          <span className="stale-badge">STALE DATA GUARD</span>
          <span>
            {isFeedPaused
              ? 'Simulation stream paused by user. Live statistical z-scores and anomaly classification are held at last snapshot.'
              : `Feed delayed (last tick ${secondsAgo}s ago). Calculations held until next valid tick to prevent false anomaly signals.`}
          </span>
          {isFeedPaused && (
            <button
              type="button"
              className="btn-resume-inline"
              onClick={toggleFeedPause}
            >
              Resume Live Feed →
            </button>
          )}
        </div>
      )}

      {/* Activity Log Dropdown Panel */}
      {showActivity && (
        <div className="activity-panel-card">
          <div className="activity-panel-header">
            <span className="activity-panel-title">Session Signal Activity</span>
            <button
              type="button"
              className="btn-activity-close"
              onClick={() => setShowActivity(false)}
            >
              Close
            </button>
          </div>
          <div className="activity-list">
            {activityLog.length === 0 ? (
              <div className="activity-empty">No signal transitions yet. Listening to WebSocket stream...</div>
            ) : (
              activityLog.map((event) => (
                <div key={event.id} className={`activity-row activity-row--${event.type}`}>
                  <span className="activity-time">{event.timestamp}</span>
                  <span className="activity-symbol">{event.symbol}</span>
                  <span className="activity-msg">{event.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
