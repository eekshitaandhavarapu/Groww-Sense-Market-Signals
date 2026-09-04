/* DashboardTabs.tsx — Groww-style interactive horizontal tab bar. */

interface DashboardTabsProps {
  activeTab: 'watchlist' | 'alerts' | 'history' | 'insights';
  onTabChange: (tab: 'watchlist' | 'alerts' | 'history' | 'insights') => void;
  flaggedCount?: number;
}

export function DashboardTabs({ activeTab, onTabChange, flaggedCount = 0 }: DashboardTabsProps) {
  return (
    <div className="dashboard-tabs-wrapper">
      <div className="dashboard-tabs">
        {/* Tab 1: Watchlist */}
        <button
          type="button"
          className={`dashboard-tab ${activeTab === 'watchlist' ? 'dashboard-tab--active' : ''}`}
          onClick={() => onTabChange('watchlist')}
        >
          Watchlist
        </button>

        {/* Tab 2: Alerts */}
        <button
          type="button"
          className={`dashboard-tab ${activeTab === 'alerts' ? 'dashboard-tab--active' : ''}`}
          onClick={() => onTabChange('alerts')}
        >
          Alerts
          {flaggedCount > 0 ? (
            <span className="badge-tab-alert">{flaggedCount}</span>
          ) : (
            <span className="badge-tab-neutral">0</span>
          )}
        </button>

        {/* Tab 3: History */}
        <button
          type="button"
          className={`dashboard-tab ${activeTab === 'history' ? 'dashboard-tab--active' : ''}`}
          onClick={() => onTabChange('history')}
        >
          History
        </button>

        {/* Tab 4: Insights */}
        <button
          type="button"
          className={`dashboard-tab ${activeTab === 'insights' ? 'dashboard-tab--active' : ''}`}
          onClick={() => onTabChange('insights')}
        >
          Insights
        </button>
      </div>
    </div>
  );
}
