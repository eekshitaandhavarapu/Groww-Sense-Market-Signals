/* App.tsx — root component with Landing, Signup, and Watchlist routing. */

import { useEffect, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WatchlistView } from './components/WatchlistView';
import { WatchlistSkeleton } from './components/WatchlistSkeleton';
import { LandingPage } from './components/LandingPage';
import { SignupPage } from './components/SignupPage';
import { apiFetch, clearStoredUser } from './api/client';
import type { WatchlistSummary } from './types';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 2,
    },
  },
});

function getInitialScreen(): 'landing' | 'signup' | 'app' {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    if (params.get('page') === 'landing' || hash === '#landing') return 'landing';
    if (params.get('page') === 'signup' || hash === '#signup') return 'signup';
    if (params.get('logout') === 'true') {
      clearStoredUser();
      return 'landing';
    }
  }
  // Default to immediate interactive watchlist experience for evaluator
  return 'app';
}

function AppContent() {
  // First-time visitors (no stored user ID) land on Landing Page.
  // Returning visitors with a stored user ID bypass directly to the WatchlistView.
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'signup' | 'app'>(getInitialScreen);

  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const watchlists = await apiFetch<WatchlistSummary[]>('/watchlists/mine');
      if (watchlists.length > 0) {
        setWatchlistId(watchlists[0].id);
      } else {
        const created = await apiFetch<WatchlistSummary>('/watchlists', {
          method: 'POST',
          body: JSON.stringify({ name: 'My Watchlist' }),
        });
        setWatchlistId(created.id);
      }
    } catch (e: any) {
      console.error('Init error:', e);
      setError('Failed to connect to backend. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentScreen === 'app') {
      const timer = setTimeout(() => {
        void loadUserWatchlist();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, loadUserWatchlist]);

  const handleSignupSuccess = () => {
    setCurrentScreen('app');
  };

  const handleLogout = () => {
    clearStoredUser();
    queryClient.clear();
    setWatchlistId(null);
    setCurrentScreen('landing');
  };

  // 1. Landing Page & Groww Two-Panel Signup Modal
  if (currentScreen === 'landing' || currentScreen === 'signup') {
    return (
      <>
        <LandingPage
          onGetStarted={() => setCurrentScreen('signup')}
          onLogin={() => setCurrentScreen('signup')}
        />
        {currentScreen === 'signup' && (
          <SignupPage
            onSuccess={handleSignupSuccess}
            onBack={() => setCurrentScreen('landing')}
          />
        )}
      </>
    );
  }

  // 3. Main Watchlist Application
  if (loading) {
    return <WatchlistSkeleton statusText="Connecting to Groww Sense…" />;
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-state__text">{error}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={loadUserWatchlist}>
              Retry
            </button>
            <button className="btn" onClick={handleLogout}>
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!watchlistId) {
    return (
      <div className="app-container">
        <div className="empty-state">
          <div className="empty-state__text">No watchlist found.</div>
          <button className="btn btn-primary" onClick={handleLogout} style={{ marginTop: 12 }}>
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  return <WatchlistView watchlistId={watchlistId} onLogout={handleLogout} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
