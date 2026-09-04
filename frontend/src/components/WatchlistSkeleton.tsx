/* WatchlistSkeleton — placeholder skeleton while initial data fetches and WS connects */

interface WatchlistSkeletonProps {
  statusText?: string;
}

export function WatchlistSkeleton({ statusText = 'Connecting to market stream…' }: WatchlistSkeletonProps) {
  return (
    <div className="app-container" style={{ opacity: 0.95 }}>
      {/* Header skeleton */}
      <header className="app-header">
        <div className="app-header__title">
          <div className="app-header__logo">G</div>
          Groww Sense
        </div>
        <div className="app-header__actions">
          <div className="connection-status">
            <span className="connection-dot connection-dot--connecting" />
            {statusText}
          </div>
          <button className="btn btn-primary" disabled style={{ opacity: 0.5 }}>
            + Add
          </button>
        </div>
      </header>

      {/* Flagged Zone Skeleton */}
      <div className="flagged-zone" style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <div className="skeleton skeleton-header" style={{ width: 100 }} />
        <div className="skeleton skeleton-card skeleton-card--flagged" />
        <div className="skeleton skeleton-card skeleton-card--flagged" style={{ height: 80, opacity: 0.7 }} />
      </div>

      {/* Watching Zone Skeleton */}
      <div className="quiet-zone">
        <div className="skeleton skeleton-header" style={{ width: 120 }} />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" style={{ opacity: 0.7 }} />
      </div>
    </div>
  );
}
