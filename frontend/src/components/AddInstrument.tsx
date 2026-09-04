/* AddInstrument — modal to search existing instruments or create infinite custom instruments. */

import React, { useState } from 'react';
import { useInstruments, useCreateInstrument } from '../api/instrumentApi';

interface AddInstrumentProps {
  existingSymbols: Set<string>;
  onAdd: (symbol: string) => void;
  onClose: () => void;
}

export function AddInstrument({ existingSymbols, onAdd, onClose }: AddInstrumentProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
  const [search, setSearch] = useState('');

  // Custom instrument form states
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');
  const [customSector, setCustomSector] = useState('Tech');
  const [customPrice, setCustomPrice] = useState('1000');
  const [customVolTier, setCustomVolTier] = useState<'high' | 'med' | 'low'>('med');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: instruments, isLoading } = useInstruments(search);
  const createInstrumentMutation = useCreateInstrument();

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const sym = customSymbol.trim().toUpperCase();
    const name = customName.trim() || sym;
    const price = parseFloat(customPrice) || 1000.0;

    if (!sym) {
      setFormError('Symbol is required (e.g. PAYTM, SWIGGY, AAPL)');
      return;
    }

    const volMap = {
      high: 0.028,
      med: 0.012,
      low: 0.005,
    };

    try {
      await createInstrumentMutation.mutateAsync({
        symbol: sym,
        name: name,
        sector: customSector,
        base_price: price,
        volatility: volMap[customVolTier],
      });
      onAdd(sym);
    } catch (err: any) {
      console.error('Failed to create custom instrument:', err);
      // Fallback directly adding symbol to watchlist (backend auto-creates)
      onAdd(sym);
    }
  };

  const handleQuickAddSearch = async () => {
    const sym = search.trim().toUpperCase();
    if (!sym) return;
    try {
      await createInstrumentMutation.mutateAsync({
        symbol: sym,
        name: sym,
        sector: 'Custom',
        base_price: 1000.0,
        volatility: 0.015,
      });
      onAdd(sym);
    } catch {
      onAdd(sym);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540, width: '92%', borderRadius: 14, overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div className="modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid #ECEFF2' }}>
          <div>
            <span className="modal__title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Add Instruments to Watchlist
            </span>
            <div style={{ fontSize: '0.76rem', color: '#8C919D', marginTop: 2 }}>
              Choose from pre-calibrated equities or create any custom asset ticker
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ECEFF2', background: '#F8F9FB' }}>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeTab === 'search' ? '#FFFFFF' : 'transparent',
              borderBottom: activeTab === 'search' ? '2px solid #00D09C' : '2px solid transparent',
              fontWeight: activeTab === 'search' ? 700 : 500,
              color: activeTab === 'search' ? '#00B386' : '#64748B',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Search Catalog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeTab === 'create' ? '#FFFFFF' : 'transparent',
              borderBottom: activeTab === 'create' ? '2px solid #00D09C' : '2px solid transparent',
              fontWeight: activeTab === 'create' ? 700 : 500,
              color: activeTab === 'create' ? '#00B386' : '#64748B',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            + Create Custom Instrument
          </button>
        </div>

        {activeTab === 'search' ? (
          <div>
            <div className="modal__search" style={{ padding: '16px 20px 12px' }}>
              <input
                type="text"
                placeholder="Search symbol (e.g. INFY, TATAMOTORS, ZOMATO)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D4D7DE', fontSize: '0.9rem' }}
              />
            </div>

            <div className="modal__list" style={{ maxHeight: 320, overflowY: 'auto', padding: '0 20px 20px' }}>
              {isLoading ? (
                <div className="loading" style={{ padding: 24, textAlign: 'center' }}>
                  <div className="spinner" />
                  Loading catalog...
                </div>
              ) : instruments && instruments.length > 0 ? (
                instruments.map((inst) => {
                  const alreadyAdded = existingSymbols.has(inst.symbol);

                  return (
                    <div
                      key={inst.symbol}
                      className={`modal__instrument ${alreadyAdded ? 'modal__instrument--added' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 8,
                        marginBottom: 6,
                        border: '1px solid #F0F1F5',
                        background: '#FFFFFF',
                      }}
                    >
                      <div className="modal__instrument-info" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="modal__instrument-symbol" style={{ fontWeight: 700, color: '#1B1F2A' }}>
                            {inst.symbol}
                          </span>
                          {inst.sector && (
                            <span
                              className="modal__instrument-sector"
                              style={{
                                fontSize: '0.7rem',
                                background: '#F0F1F5',
                                padding: '2px 6px',
                                borderRadius: 4,
                                color: '#64748B',
                              }}
                            >
                              {inst.sector}
                            </span>
                          )}
                        </div>
                        <span className="modal__instrument-name" style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>
                          {inst.name}
                        </span>
                      </div>
                      <button
                        className="btn-add"
                        disabled={alreadyAdded}
                        onClick={() => onAdd(inst.symbol)}
                        style={{
                          background: alreadyAdded ? '#F0F1F5' : '#00D09C',
                          color: alreadyAdded ? '#8C919D' : '#FFFFFF',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: alreadyAdded ? 'default' : 'pointer',
                        }}
                      >
                        {alreadyAdded ? 'In Watchlist' : '+ Add'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                  <div style={{ color: '#4B5565', fontSize: '0.9rem', marginBottom: 12 }}>
                    No stock found matching "<strong>{search}</strong>"
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAddSearch}
                    style={{
                      background: '#00D09C',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add "{search.toUpperCase()}" as Custom Stock
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Create Custom Instrument Form */
          <form onSubmit={handleCreateCustom} style={{ padding: '20px' }}>
            {formError && (
              <div style={{ background: '#FDE8E7', border: '1px solid #E5453D', color: '#C53028', padding: '8px 12px', borderRadius: 6, fontSize: '0.82rem', marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4B5565', marginBottom: 6 }}>
                  Stock Symbol *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SWIGGY, NYKAA, AAPL"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D4D7DE', fontSize: '0.9rem', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4B5565', marginBottom: 6 }}>
                  Company / Asset Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy Limited"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D4D7DE', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4B5565', marginBottom: 6 }}>
                  Sector
                </label>
                <select
                  value={customSector}
                  onChange={(e) => setCustomSector(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D4D7DE', fontSize: '0.9rem', background: '#FFFFFF' }}
                >
                  <option value="Tech">Tech / Consumer Internet</option>
                  <option value="Banking">Banking & Finance</option>
                  <option value="Auto">Automotive</option>
                  <option value="Energy">Energy & Utilities</option>
                  <option value="FMCG">FMCG / Retail</option>
                  <option value="Healthcare">Pharma & Healthcare</option>
                  <option value="Crypto">Crypto / Digital Asset</option>
                  <option value="General">Other / General</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4B5565', marginBottom: 6 }}>
                  Starting Base Price (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="1000"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D4D7DE', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4B5565', marginBottom: 6 }}>
                Simulated Volatility Tier
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { tier: 'high', label: 'High Volatility', desc: 'Fast price swings (~2.8%)' },
                  { tier: 'med', label: 'Medium', desc: 'Standard swings (~1.2%)' },
                  { tier: 'low', label: 'Defensive', desc: 'Calm & steady (~0.5%)' },
                ].map((item) => (
                  <div
                    key={item.tier}
                    onClick={() => setCustomVolTier(item.tier as any)}
                    style={{
                      border: customVolTier === item.tier ? '2px solid #00D09C' : '1px solid #D4D7DE',
                      background: customVolTier === item.tier ? '#F0FDF9' : '#FFFFFF',
                      borderRadius: 8,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: customVolTier === item.tier ? '#008764' : '#1B1F2A' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#8C919D', marginTop: 2 }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
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
                Back to Catalog
              </button>
              <button
                type="submit"
                disabled={createInstrumentMutation.isPending}
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
                {createInstrumentMutation.isPending ? 'Creating...' : '+ Create & Add to Watchlist'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
