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
  const [showOverviewModal, setShowOverviewModal] = useState(false);
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

        {/* Live Stream Activity Toggle */}
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

        {/* In-App Guide / Overview Modal Button */}
        <button
          type="button"
          onClick={() => setShowOverviewModal(true)}
          title="How Groww Sense works"
          style={{
            background: 'transparent',
            border: '1px solid #DFE2E8',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#4B5565',
            cursor: 'pointer',
          }}
        >
          Guide &amp; Overview
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

      {/* Header Recent Activity Dropdown Panel with Backdrop & Close Button */}
      {showActivity && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'transparent' }}
            onClick={() => setShowActivity(false)}
          />
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
            boxShadow: '0 12px 32px rgba(27, 31, 42, 0.15)',
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
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1B1F2A' }}>
                  Live Stream Activity
                </span>
                <div style={{ fontSize: '0.72rem', color: '#8C919D' }}>
                  Last {Math.min(activityLog.length, 10)} Events
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActivity(false)}
                style={{
                  background: '#F0F1F5',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#64748B',
                }}
                title="Close"
              >
                &times;
              </button>
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
        </>
      )}

      {/* In-App Guide & Overview Modal */}
      {showOverviewModal && (
        <div className="modal-overlay" onClick={() => setShowOverviewModal(false)} style={{ zIndex: 9999 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 560,
              width: '92%',
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#00D09C', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  G
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#1B1F2A' }}>
                  How Groww Sense Works
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOverviewModal(false)}
                style={{
                  background: '#F0F1F5',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#64748B',
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#4B5565', lineHeight: 1.6, marginBottom: 16 }}>
              Groww Sense continuously monitors equity price activity and filters routine everyday noise by calculating rolling volatility baselines for each stock.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#F8F9FB', border: '1px solid #ECEFF2', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: '#1B1F2A', fontSize: '0.86rem', marginBottom: 4 }}>
                  1. Quiet Zone vs Flagged Zone
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Stocks experiencing normal fluctuations stay quietly in the lower zone. Stocks with statistical shifts are promoted to the top with clear amber or red alerts.
                </div>
              </div>

              <div style={{ background: '#F8F9FB', border: '1px solid #ECEFF2', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: '#1B1F2A', fontSize: '0.86rem', marginBottom: 4 }}>
                  2. 20-Tick Rolling Volatility
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  The engine compares each incoming tick against the stock's last 20 prices, computing how many standard deviations (Z-score) it has moved away from its recent equilibrium.
                </div>
              </div>

              <div style={{ background: '#F8F9FB', border: '1px solid #ECEFF2', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: '#1B1F2A', fontSize: '0.86rem', marginBottom: 4 }}>
                  3. Transparent Explainability &amp; Replay
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Click any stock card to see the full mathematical breakdown, volatility bands, and step forward/backward through the 20-tick price replay scrubber.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ECEFF2', paddingTop: 16 }}>
              <a
                href="/?page=landing"
                style={{
                  fontSize: '0.8rem',
                  color: '#00B386',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                &larr; View Public Landing Page
              </a>
              <button
                type="button"
                onClick={() => setShowOverviewModal(false)}
                style={{
                  background: '#00D09C',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
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
