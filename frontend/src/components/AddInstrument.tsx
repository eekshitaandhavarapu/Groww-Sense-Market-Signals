/* AddInstrument — modal to search and add instruments. */

import { useState } from 'react';
import { useInstruments } from '../api/instrumentApi';

interface AddInstrumentProps {
  existingSymbols: Set<string>;
  onAdd: (symbol: string) => void;
  onClose: () => void;
}

export function AddInstrument({ existingSymbols, onAdd, onClose }: AddInstrumentProps) {
  const [search, setSearch] = useState('');
  const { data: instruments, isLoading } = useInstruments(search);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">Add Instrument</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal__search">
          <input
            type="text"
            placeholder="Search by symbol or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal__list">
          {isLoading ? (
            <div className="loading">
              <div className="spinner" />
              Loading…
            </div>
          ) : instruments && instruments.length > 0 ? (
            instruments.map((inst) => {
              const alreadyAdded = existingSymbols.has(inst.symbol);

              return (
                <div
                  key={inst.symbol}
                  className={`modal__instrument ${alreadyAdded ? 'modal__instrument--added' : ''}`}
                >
                  <div className="modal__instrument-info">
                    <span className="modal__instrument-symbol">{inst.symbol}</span>
                    <span className="modal__instrument-name">{inst.name}</span>
                    {inst.sector && (
                      <span className="modal__instrument-sector">{inst.sector}</span>
                    )}
                  </div>
                  <button
                    className="btn-add"
                    disabled={alreadyAdded}
                    onClick={() => onAdd(inst.symbol)}
                  >
                    {alreadyAdded ? 'Added' : '+ Add'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-state__text">
                {search ? `No instruments matching "${search}"` : 'No instruments available'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
