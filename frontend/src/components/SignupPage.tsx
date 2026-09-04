/* SignupPage.tsx — Groww-inspired two-panel modal. */

import { useState } from 'react';
import { loginWithEmail } from '../api/client';

interface SignupPageProps {
  onSuccess: (userId: string) => void;
  onBack: () => void;
}

export function SignupPage({ onSuccess, onBack }: SignupPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await loginWithEmail(clean);
      onSuccess(user.user_id);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err?.message || 'Failed to initialize demo account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setError(null);
  };

  return (
    <div className="signup-overlay" onClick={onBack}>
      <div className="signup-two-panel" onClick={(e) => e.stopPropagation()}>
        {/* Left Panel: Solid Green Block with Organic Texture */}
        <div className="signup-panel-left">
          {/* Subtle geometric wave/curves SVG texture */}
          <svg
            className="signup-panel-left__bg"
            viewBox="0 0 400 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-40 180 C80 120 180 260 320 190 C420 140 450 320 500 420 L500 600 L-40 600 Z"
              fill="white"
            />
            <circle cx="340" cy="90" r="140" fill="white" opacity="0.6" />
            <circle cx="60" cy="420" r="180" fill="white" opacity="0.4" />
          </svg>

          <div className="signup-panel-left__header">
            <div className="signup-panel-left__logo-circle">G</div>
            <div className="signup-panel-left__appname">Groww Sense</div>
          </div>

          <div className="signup-panel-left__footer">
            <h2 className="signup-panel-left__tagline">
              Simple, Focused<br />Market Insight.
            </h2>
            <p className="signup-panel-left__sub">
              Cut through market noise with automated rolling standard deviation boundaries.
            </p>
          </div>
        </div>

        {/* Right Panel: White Form */}
        <div className="signup-panel-right">
          <button
            type="button"
            className="signup-close-btn"
            onClick={onBack}
            title="Close and return to overview"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 className="signup-panel-title">Welcome to Groww Sense</h2>
          <p className="signup-panel-desc">
            Enter your email to access your personal volatility-aware watchlist.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="groww-form-field">
              <input
                type="email"
                className="groww-input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--red-500)', fontSize: '0.8125rem', marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-groww-continue"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Connecting…' : 'Continue'}
            </button>
          </form>

          {/* Quick Demo Test Presets */}
          <div className="signup-demo-presets">
            <div className="signup-demo-title">Quick Test Accounts:</div>
            <div className="signup-demo-pills">
              <button
                type="button"
                className="signup-demo-pill"
                onClick={() => handleSelectPreset('trader@groww.in')}
              >
                trader@groww.in
              </button>
              <button
                type="button"
                className="signup-demo-pill"
                onClick={() => handleSelectPreset('quant@market.io')}
              >
                quant@market.io
              </button>
              <button
                type="button"
                className="signup-demo-pill"
                onClick={() => handleSelectPreset('analyst@capital.com')}
              >
                analyst@capital.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
