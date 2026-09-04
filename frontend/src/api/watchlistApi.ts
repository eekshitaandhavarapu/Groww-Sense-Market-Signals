/* Watchlist API — TanStack Query hooks. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { WatchlistResponse, WatchlistSummary } from '../types';

/** List current user's watchlists. */
export function useMyWatchlists() {
  return useQuery<WatchlistSummary[]>({
    queryKey: ['watchlists', 'mine'],
    queryFn: () => apiFetch('/watchlists/mine'),
  });
}

/** Get a single watchlist with live prices and z-scores. */
export function useWatchlist(id: string | undefined) {
  return useQuery<WatchlistResponse>({
    queryKey: ['watchlist', id],
    queryFn: () => apiFetch(`/watchlists/${id}`),
    enabled: !!id,
    refetchInterval: 10000, // Refetch every 10s as fallback to WS
  });
}

/** Add an instrument to a watchlist. */
export function useAddItem(watchlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (symbol: string) =>
      apiFetch(`/watchlists/${watchlistId}/items`, {
        method: 'POST',
        body: JSON.stringify({ symbol }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', watchlistId] });
    },
  });
}

/** Remove an instrument from a watchlist. */
export function useRemoveItem(watchlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (symbol: string) =>
      apiFetch(`/watchlists/${watchlistId}/items/${symbol}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', watchlistId] });
    },
  });
}
