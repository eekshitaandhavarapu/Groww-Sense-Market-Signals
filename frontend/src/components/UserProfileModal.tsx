/* UserProfileModal.tsx — Individual user profile, preferences, and session management. */

import React, { useState } from 'react';
import { getStoredUserId, getStoredUserEmail, setStoredUser, clearStoredUser } from '../api/client';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  watchlistCount?: number;
}

export function UserProfileModal({ isOpen, onClose, onLogout, watchlistCount = 0 }: UserProfileModalProps) {
  const userId = getStoredUserId();
  const currentEmail = getStoredUserEmail();

  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('watchlist_user_name') || currentEmail.split('@')[0] || 'Trader';
  });
  const [email, setEmail] = useState(currentEmail);
  const [traderRole, setTraderRole] = useState(() => {
    return localStorage.getItem('watchlist_user_role') || 'Active Market Trader';
  });
  const [sensitivity, setSensitivity] = useState(() => {
    return localStorage.getItem('watchlist_pref_sensitivity') || '1.5';
  });
  const [audioAlerts, setAudioAlerts] = useState(() => {
    return localStorage.getItem('watchlist_pref_audio') === 'true';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredUser(userId, email.trim() || currentEmail);
    localStorage.setItem('watchlist_user_name', displayName.trim());
    localStorage.setItem('watchlist_user_role', traderRole);
    localStorage.setItem('watchlist_pref_sensitivity', sensitivity);
    localStorage.setItem('watchlist_pref_audio', audioAlerts.toString());

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleLogout = () => {
    clearStoredUser();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/?page=landing';
    }
  };

  const getInitials = () => {
    if (!displayName) return 'GS';
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          width: '94%',
          borderRadius: 14,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          background: '#FFFFFF',
        }}
      >
        {/* Modal Top Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #00D09C 0%, #009E75 100%)',
            padding: '24px 24px 20px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#FFFFFF',
                color: '#00B386',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {getInitials()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                {displayName || 'Individual Trader'}
              </h2>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: 4 }}>
                {email}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.25)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  marginTop: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Groww Sense Pro &bull; Individual
              </div>
            </div>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} style={{ padding: '24px' }}>
          {savedSuccess && (
            <div
              style={{
                background: '#E6F9F3',
                border: '1px solid #00D09C',
                color: '#008764',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Preferences saved successfully!
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4B5565', marginBottom: 6 }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #D4D7DE',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4B5565', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@groww.in"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #D4D7DE',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4B5565', marginBottom: 6 }}>
              Trader Profile / Persona
            </label>
            <select
              value={traderRole}
              onChange={(e) => setTraderRole(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #D4D7DE',
                borderRadius: 8,
                fontSize: '0.9rem',
                background: '#FFFFFF',
              }}
            >
              <option value="Active Market Trader">Active Market Trader (Intraday & Momentum)</option>
              <option value="Quantitative Analyst">Quantitative Analyst (Statistical Volatility)</option>
              <option value="Portfolio Investor">Long-Term Portfolio Investor</option>
              <option value="Risk & Compliance">Risk & Market Surveillance</option>
            </select>
          </div>

          {/* Preferences Section */}
          <div
            style={{
              background: '#F8F9FB',
              border: '1px solid #ECEFF2',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1B1F2A', marginBottom: 10 }}>
              Monitoring Preferences
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2D3348' }}>
                  Anomaly Detection Sensitivity
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8C919D' }}>
                  Z-score threshold for promoting stocks to Flagged Zone
                </div>
              </div>
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value)}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #D4D7DE',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: '#FFFFFF',
                }}
              >
                <option value="1.2">Aggressive (1.2σ)</option>
                <option value="1.5">Standard (1.5σ)</option>
                <option value="2.0">Conservative (2.0σ)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2D3348' }}>
                  Audio Notifications
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8C919D' }}>
                  Play a subtle tone when high-sigma anomaly is flagged
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22 }}>
                <input
                  type="checkbox"
                  checked={audioAlerts}
                  onChange={(e) => setAudioAlerts(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: audioAlerts ? '#00D09C' : '#D4D7DE',
                    transition: '0.3s',
                    borderRadius: 22,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      height: 16,
                      width: 16,
                      left: audioAlerts ? 20 : 3,
                      bottom: 3,
                      backgroundColor: '#FFFFFF',
                      transition: '0.3s',
                      borderRadius: '50%',
                    }}
                  />
                </span>
              </label>
            </div>
          </div>

          {/* Session Metadata */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: '#8C919D',
              borderTop: '1px solid #ECEFF2',
              paddingTop: 12,
              marginBottom: 16,
            }}
          >
            <span>User ID: <code style={{ color: '#4B5565' }}>{userId.slice(0, 8)}...</code></span>
            <span>Tracked: <strong style={{ color: '#00B386' }}>{watchlistCount} Instruments</strong></span>
            <span>Feed: <strong style={{ color: '#00B386' }}>Live WebSocket</strong></span>
          </div>

          {/* Modal Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #E5453D',
                color: '#E5453D',
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Log Out / Switch Account
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#F0F1F5',
                  border: 'none',
                  color: '#4B5565',
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: '#00D09C',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '9px 20px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 208, 156, 0.3)',
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
