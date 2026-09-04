import { useState } from 'react';
import { useWatchlistStore } from '../store/watchlistStore';
import { UserProfileModal } from './UserProfileModal';

interface HeaderProps {
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  onAddClick: () => void;
  onLogout?: () => void;
}

export function Header({ wsStatus, onAddClick, onLogout }: HeaderProps) {
  const [showActivity, setShowActivity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const activityLog = useWatchlistStore((s) => s.activityLog);

  const displayName = localStorage.getItem('watchlist_user_name') || 'Trader';
  const initials = displayName.slice(0, 2).toUpperCase();

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

        {/* User Profile Button */}
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          title="Manage User Profile & Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F0FDF9',
            border: '1px solid #A7F3D0',
            borderRadius: 20,
            padding: '4px 10px 4px 6px',
            cursor: 'pointer',
            fontSize: '0.76rem',
            fontWeight: 600,
            color: '#065F46',
            transition: 'all 0.15s ease',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#00D09C',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            {initials}
          </span>
          <span>{displayName}</span>
        </button>

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
          borderRadius: 12,
          boxShadow: '0 12px 32px rgba(27, 31, 42, 0.12)',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            borderBottom: '1px solid #F0F1F5',
            paddingBottom: 8,
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1B1F2A' }}>
              Live Stream Activity
            </span>
            <span style={{ fontSize: '0.72rem', color: '#8C919D' }}>
              Last {Math.min(activityLog.length, 10)} Events
            </span>
          </div>

          {activityLog.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#8C919D', fontSize: '0.8rem' }}>
              No regime shifts recorded yet. Listening to WebSocket ticks...
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activityLog.slice(0, 10).map((act, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: act.type === 'meaningful' ? '#FDE8E7' : act.type === 'notable' ? '#FEF3DB' : '#F8F9FB',
                    border: `1px solid ${act.type === 'meaningful' ? '#FBC8C6' : act.type === 'notable' ? '#FDE8C7' : '#ECEFF2'}`,
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: act.type === 'meaningful' ? '#E5453D' : act.type === 'notable' ? '#F5A623' : '#00B386',
                    }} />
                    <strong style={{ color: '#1B1F2A' }}>{act.symbol}</strong>
                    <span style={{ color: '#4B5565' }}>{act.message}</span>
                  </div>
                  <span style={{ color: '#8C919D', fontSize: '0.7rem' }}>{act.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={onLogout}
      />
    </header>
  );
}
