/* Instrument API — TanStack Query hooks. */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { Instrument, InstrumentHistory } from '../types';

/** List/search available instruments. */
export function useInstruments(query: string = '') {
  return useQuery<Instrument[]>({
    queryKey: ['instruments', query],
    queryFn: () => apiFetch(`/instruments?q=${encodeURIComponent(query)}`),
  });
}

/** Get rolling price history for sparkline/explainability. */
export function useInstrumentHistory(symbol: string | undefined) {
  return useQuery<InstrumentHistory>({
    queryKey: ['instrument-history', symbol],
    queryFn: () => apiFetch(`/instruments/${symbol}/history`),
    enabled: !!symbol,
    refetchInterval: 5000,
  });
}
