/* SignalReplay.tsx — Interactive tick-by-tick anomaly replay engine.
   Demonstrates how price moved outside rolling Gaussian boundaries step by step. */

import { useState, useEffect, useMemo, useRef } from 'react';
import type { WatchlistItem } from '../types';

interface SignalReplayProps {
  items: WatchlistItem[];
  initialSymbol?: string;
  onBack?: () => void;
}

interface ReplayTick {
  time: string;
  price: number;
  mean: number;
  stddev: number;
  zScore: number;
  classification: 'noise' | 'notable' | 'meaningful';
  annotation: string;
}

function formatPrice(val: number): string {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Generate realistic calibrated tick sequence for a given stock
function generateReplaySequence(_symbol: string, basePrice: number, baseStddev: number): ReplayTick[] {
  const steps: Array<{ time: string; deltaSigma: number; note: string }> = [
    { time: '03:18 PM', deltaSigma: 0.20, note: 'Normal trading within expected 1.0σ baseline.' },
    { time: '03:20 PM', deltaSigma: 0.45, note: 'Slight upward drift, well within routine noise.' },
    { time: '03:22 PM', deltaSigma: 0.85, note: 'Approaching upper noise boundary.' },
    { time: '03:24 PM', deltaSigma: 1.42, note: 'Testing the 1.50σ threshold boundary.' },
    { time: '03:25 PM', deltaSigma: 1.82, note: 'Threshold crossed: Enters NOTABLE volatility regime (1.82σ).' },
    { time: '03:26 PM', deltaSigma: 2.25, note: 'Sustained momentum: Volatility expanding above mean.' },
    { time: '03:27 PM', deltaSigma: 2.74, note: 'Anomaly breakout: Exceeds 2.50σ MEANINGFUL threshold (2.74σ).' },
    { time: '03:28 PM', deltaSigma: 2.88, note: 'Peak anomaly: Surface alert priority at top of dashboard.' },
    { time: '03:29 PM', deltaSigma: 2.15, note: 'Price stabilizes as counter-orders absorb momentum.' },
    { time: '03:30 PM', deltaSigma: 1.35, note: 'Drifting back down through notable boundary.' },
    { time: '03:31 PM', deltaSigma: 0.72, note: 'Signal normalized: Volatility falls back under 1.50σ threshold.' },
    { time: '03:32 PM', deltaSigma: 0.35, note: 'Routine noise restored. Moved from Flagged to Watching.' },
  ];

  return steps.map((s) => {
    const price = Math.round((basePrice + s.deltaSigma * baseStddev) * 100) / 100;
    const absZ = Math.abs(s.deltaSigma);
    let classification: 'noise' | 'notable' | 'meaningful' = 'noise';
    if (absZ >= 2.5) classification = 'meaningful';
    else if (absZ >= 1.5) classification = 'notable';

    return {
      time: s.time,
      price,
      mean: basePrice,
      stddev: baseStddev,
      zScore: s.deltaSigma,
      classification,
      annotation: s.note,
    };
  });
}

export function SignalReplay({ items, initialSymbol, onBack }: SignalReplayProps) {
  const defaultSymbol = initialSymbol || (items[0]?.symbol ?? 'RELIANCE');
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.symbol === selectedSymbol) ?? items[0];
  }, [items, selectedSymbol]);

  const basePrice = selectedItem?.current_price ?? 2800;
  const baseStddev = selectedItem?.stddev && selectedItem.stddev > 0 ? selectedItem.stddev : Math.round(basePrice * 0.012);

  const sequence = useMemo(() => {
    return generateReplaySequence(selectedSymbol, basePrice, baseStddev);
  }, [selectedSymbol, basePrice, baseStddev]);

  const currentTick = sequence[stepIndex] ?? sequence[0];

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= sequence.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, sequence.length]);

  const handlePlayPause = () => {
    if (stepIndex >= sequence.length - 1) {
      setStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  // SVG dimensions for replay trajectory chart
  const svgWidth = 640;
  const svgHeight = 220;
  const padX = 40;
  const padY = 30;

  const minPrice = basePrice - baseStddev * 0.8;
  const maxPrice = basePrice + baseStddev * 3.3;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (val: number) => {
    return svgHeight - padY - ((val - minPrice) / priceRange) * (svgHeight - padY * 2);
  };

  const getX = (idx: number) => {
    return padX + (idx / (sequence.length - 1)) * (svgWidth - padX * 2);
  };

  // Path coordinates up to current step
  const playedPoints = sequence.slice(0, stepIndex + 1).map((tick, idx) => ({
    x: getX(idx),
    y: getY(tick.price),
  }));

  const playedPathD = playedPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const meanY = getY(basePrice);
  const notableUpperY = getY(basePrice + baseStddev * 1.5);
  const meaningfulUpperY = getY(basePrice + baseStddev * 2.5);

  return (
    <div className="signal-replay-panel">
      {/* Top Header */}
      <div className="replay-header">
        <div className="replay-header__left">
          {onBack && (
            <button className="btn-replay-back" onClick={onBack}>
              ← Back
            </button>
          )}
          <div>
            <h2 className="replay-title">Signal Replay Engine</h2>
            <p className="replay-subtitle">
              Inspect how price momentum crossed statistical thresholds tick-by-tick.
            </p>
          </div>
        </div>

        {/* Stock Selector */}
        <div className="replay-selector">
          <label htmlFor="replay-stock-select" className="replay-select-label">
            Instrument:
          </label>
          <select
            id="replay-stock-select"
            className="replay-select-dropdown"
            value={selectedSymbol}
            onChange={(e) => {
              setSelectedSymbol(e.target.value);
              setStepIndex(0);
              setIsPlaying(false);
            }}
          >
            {items.map((it) => (
              <option key={it.symbol} value={it.symbol}>
                {it.symbol} — {it.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Replay Visualizer Card */}
      <div className="replay-visualizer-card">
        {/* Trajectory Chart with Boundary Envelopes */}
        <div className="replay-chart-wrapper">
          <svg className="replay-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            {/* Meaningful Boundary (≥ 2.5σ) */}
            <line
              x1={padX}
              y1={meaningfulUpperY}
              x2={svgWidth - padX}
              y2={meaningfulUpperY}
              stroke="#EF4444"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={svgWidth - padX + 6}
              y={meaningfulUpperY + 4}
              fontSize="10"
              fill="#EF4444"
              fontWeight="600"
            >
              +2.5σ
            </text>

            {/* Notable Boundary (1.5σ) */}
            <line
              x1={padX}
              y1={notableUpperY}
              x2={svgWidth - padX}
              y2={notableUpperY}
              stroke="#F59E0B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={svgWidth - padX + 6}
              y={notableUpperY + 4}
              fontSize="10"
              fill="#F59E0B"
              fontWeight="600"
            >
              +1.5σ
            </text>

            {/* Rolling Mean Baseline (0σ) */}
            <line
              x1={padX}
              y1={meanY}
              x2={svgWidth - padX}
              y2={meanY}
              stroke="#9AA1B2"
              strokeWidth="1.5"
            />
            <text
              x={svgWidth - padX + 6}
              y={meanY + 4}
              fontSize="10"
              fill="#71788E"
              fontWeight="600"
            >
              Mean
            </text>

            {/* Inactive ghost track (all future steps) */}
            {sequence.map((t, idx) => {
              if (idx === 0) return null;
              return (
                <line
                  key={`ghost-${idx}`}
                  x1={getX(idx - 1)}
                  y1={getY(sequence[idx - 1].price)}
                  x2={getX(idx)}
                  y2={getY(t.price)}
                  stroke="#E2E5EA"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Active trajectory path */}
            {playedPoints.length > 1 && (
              <path
                d={playedPathD}
                fill="none"
                stroke={
                  currentTick.classification === 'meaningful'
                    ? '#EF4444'
                    : currentTick.classification === 'notable'
                    ? '#F59E0B'
                    : '#00D09C'
                }
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Tick step markers */}
            {sequence.map((t, idx) => {
              const isPast = idx <= stepIndex;
              const isCurrent = idx === stepIndex;
              const cx = getX(idx);
              const cy = getY(t.price);

              return (
                <g key={`marker-${idx}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isCurrent ? 6 : isPast ? 3.5 : 2.5}
                    fill={
                      isCurrent
                        ? t.classification === 'meaningful'
                          ? '#EF4444'
                          : t.classification === 'notable'
                          ? '#F59E0B'
                          : '#00D09C'
                        : isPast
                        ? '#586074'
                        : '#C4C9D3'
                    }
                    stroke="#FFFFFF"
                    strokeWidth={isCurrent ? 2 : 1}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Live Step Readout Card */}
        <div className="replay-readout">
          <div className="replay-readout__top">
            <div className="replay-readout__item">
              <span className="readout-label">Time</span>
              <span className="readout-value font-mono">{currentTick.time}</span>
            </div>

            <div className="replay-readout__item">
              <span className="readout-label">Tick Price</span>
              <span className="readout-value font-bold">{formatPrice(currentTick.price)}</span>
            </div>

            <div className="replay-readout__item">
              <span className="readout-label">Rolling Mean</span>
              <span className="readout-value text-muted">{formatPrice(currentTick.mean)}</span>
            </div>

            <div className="replay-readout__item">
              <span className="readout-label">Rolling StdDev</span>
              <span className="readout-value text-muted">{formatPrice(currentTick.stddev)}</span>
            </div>

            <div className="replay-readout__item">
              <span className="readout-label">Z-Score Deviation</span>
              <span
                className={`readout-value font-bold ${
                  currentTick.classification === 'meaningful'
                    ? 'text-red'
                    : currentTick.classification === 'notable'
                    ? 'text-amber'
                    : 'text-green'
                }`}
              >
                {currentTick.zScore >= 0 ? '+' : ''}
                {currentTick.zScore.toFixed(2)}σ
              </span>
            </div>

            <div className="replay-readout__item">
              <span className="readout-label">Regime</span>
              <span
                className={`badge-inline badge-inline--${currentTick.classification}`}
              >
                {currentTick.classification.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="replay-readout__annotation">
            <span className="annotation-label">Step {stepIndex + 1} of {sequence.length}:</span>{' '}
            <span className="annotation-text">{currentTick.annotation}</span>
          </div>
        </div>

        {/* Playback Controls & Scrubber */}
        <div className="replay-controls-bar">
          <div className="replay-btn-group">
            <button
              type="button"
              className="btn-replay-action"
              onClick={handlePlayPause}
            >
              {isPlaying ? 'Pause' : stepIndex >= sequence.length - 1 ? 'Replay' : 'Play'}
            </button>

            <button
              type="button"
              className="btn-replay-secondary"
              disabled={stepIndex <= 0}
              onClick={() => {
                setIsPlaying(false);
                setStepIndex((prev) => Math.max(0, prev - 1));
              }}
            >
              Previous
            </button>

            <button
              type="button"
              className="btn-replay-secondary"
              disabled={stepIndex >= sequence.length - 1}
              onClick={() => {
                setIsPlaying(false);
                setStepIndex((prev) => Math.min(sequence.length - 1, prev + 1));
              }}
            >
              Next
            </button>

            <button
              type="button"
              className="btn-replay-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          {/* Progress Scrubber Slider */}
          <div className="replay-scrubber-wrap">
            <input
              type="range"
              min="0"
              max={sequence.length - 1}
              value={stepIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setStepIndex(Number(e.target.value));
              }}
              className="replay-slider"
            />
            <div className="replay-slider-ticks">
              {sequence.map((t, idx) => (
                <span
                  key={`time-${idx}`}
                  className={`slider-tick-time ${idx === stepIndex ? 'active' : ''}`}
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIndex(idx);
                  }}
                >
                  {t.time}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
