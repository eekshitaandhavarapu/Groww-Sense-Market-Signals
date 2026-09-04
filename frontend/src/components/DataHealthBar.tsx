/* DataHealthBar.tsx — Feed status, latency, data freshness, pause/resume simulation control, and activity stream. */

import { useState, useEffect } from 'react';
import { useWatchlistStore } from '../store/watchlistStore';

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

  // Update seconds ago live counter
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - lastTickTimestamp) / 1000);
      setSecondsAgo(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastTickTimestamp]);

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

        {/* Right: Simulation Controls & Activity Feed Toggle */}
        <div className="data-health-actions">
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

          <div className="activity-event-list">
            {activityLog.length === 0 ? (
              <div className="activity-empty">No signal transitions recorded yet.</div>
            ) : (
              activityLog.map((ev) => (
                <div key={ev.id} className="activity-event-row">
                  <span className="activity-time font-mono">{ev.timestamp}</span>
                  <span
                    className={`activity-tag activity-tag--${ev.type}`}
                  >
                    {ev.type.toUpperCase()}
                  </span>
                  <span className="activity-msg">{ev.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
