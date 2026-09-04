/* Instrument API — TanStack Query hooks and creation mutations. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { Instrument, InstrumentHistory } from '../types';

export interface CreateInstrumentPayload {
  symbol: string;
  name: string;
  sector?: string;
  base_price?: number;
  volatility?: number;
}

/** List/search available instruments. */
export function useInstruments(query: string = '') {
  return useQuery<Instrument[]>({
    queryKey: ['instruments', query],
    queryFn: () => apiFetch(`/instruments?q=${encodeURIComponent(query)}`),
  });
}

/** Create a new custom instrument. */
export function useCreateInstrument() {
  const queryClient = useQueryClient();
  return useMutation<Instrument, Error, CreateInstrumentPayload>({
    mutationFn: (payload) =>
      apiFetch('/instruments', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
    },
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
