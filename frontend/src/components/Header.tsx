import { useState } from 'react';
import { useWatchlistStore } from '../store/watchlistStore';

interface HeaderProps {
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  onAddClick: () => void;
  onLogout?: () => void;
}

export function Header({ wsStatus, onAddClick, onLogout }: HeaderProps) {
  const [showActivity, setShowActivity] = useState(false);
  const activityLog = useWatchlistStore((s) => s.activityLog);

  const statusLabel = {
    disconnected: 'Offline',
    connecting: 'Connecting…',
    connected: 'Live',
  }[wsStatus];

  return (
    <header className="app-header" style={{ position: 'relative' }}>
      <div className="app-header__title">
        <div className="app-header__logo">G</div>
        Groww Sense
      </div>
      <div className="app-header__actions">
        <div className="connection-status">
          <span
            className={`connection-dot connection-dot--${wsStatus}`}
          />
          {statusLabel}
        </div>

        {/* Subtle Activity Panel Toggle */}
        <button
          type="button"
          className="btn-header-activity"
          onClick={() => setShowActivity(!showActivity)}
          title="Recent statistical signal events"
          style={{
            background: showActivity ? '#E8ECEF' : '#F4F6F8',
            border: '1px solid #DFE2E8',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#4B5565',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Activity</span>
          {activityLog.length > 0 && (
            <span style={{
              background: '#00D09C',
              color: '#FFFFFF',
              borderRadius: 10,
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}>
              {activityLog.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset demo state to initial default watchlist?')) {
              localStorage.clear();
              window.location.href = '/';
            }
          }}
          title="Reset demo data to initial state"
          style={{
            background: 'transparent',
            border: '1px solid #DFE2E8',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          Reset Demo
        </button>

        <button
          type="button"
          onClick={() => { window.location.href = '/?page=landing'; }}
          title="View landing overview"
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748B',
            cursor: 'pointer',
            padding: '5px 8px',
          }}
        >
          Overview
        </button>

        <button className="btn btn-primary" onClick={onAddClick}>
          + Add
        </button>

        {onLogout && (
          <button
            className="btn-icon"
            onClick={onLogout}
            title="Log out / Switch account"
            aria-label="Log out / Switch account"
            style={{ color: 'var(--muted-400)', marginLeft: 4 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Header Recent Activity Dropdown Panel */}
      {showActivity && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          width: 380,
          maxWidth: '90vw',
          background: '#FFFFFF',
          border: '1px solid #ECEFF2',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          padding: 14,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            borderBottom: '1px solid #F0F2F5',
            paddingBottom: 8,
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1B1F2A' }}>
              Recent Market Signals
            </span>
            <button
              type="button"
              onClick={() => setShowActivity(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.725rem',
                color: '#71788E',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>

          <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activityLog.length === 0 ? (
              <div style={{ fontSize: '0.775rem', color: '#8C919D', textAlign: 'center', padding: 16 }}>
                No signal transitions recorded yet.
              </div>
            ) : (
              activityLog.map((ev) => {
                const dotColor = ev.type === 'meaningful' ? '#E5453D' : ev.type === 'notable' ? '#F5A623' : '#00D09C';
                return (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: '0.75rem',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: dotColor,
                      marginTop: 5,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontFamily: 'monospace', color: '#71788E', fontSize: '0.7rem', minWidth: 55 }}>
                      {ev.timestamp}
                    </span>
                    <span style={{ color: '#1B1F2A', lineHeight: 1.4 }}>
                      {ev.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </header>
  );
}
