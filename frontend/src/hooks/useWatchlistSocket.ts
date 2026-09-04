/* useWatchlistSocket — WebSocket hook with reconnection and backoff. */

import { useEffect, useRef, useCallback } from 'react';
import { getWsUrl } from '../api/client';
import { useWatchlistStore } from '../store/watchlistStore';
import type { LiveTick } from '../types';

const MIN_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;

export function useWatchlistSocket(watchlistId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectMs = useRef(MIN_RECONNECT_MS);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<() => void>(() => {});
  const setTick = useWatchlistStore((s) => s.setTick);
  const setWsStatus = useWatchlistStore((s) => s.setWsStatus);

  const connect = useCallback(() => {
    if (!watchlistId) return;

    const url = getWsUrl(`/ws/watchlist/${watchlistId}`);
    setWsStatus('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      reconnectMs.current = MIN_RECONNECT_MS;
    };

    ws.onmessage = (event) => {
      try {
        const tick: LiveTick = JSON.parse(event.data);
        setTick(tick.symbol, tick);
      } catch (e) {
        console.warn('Failed to parse WS message:', e);
      }
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      // Exponential backoff reconnection
      reconnectTimer.current = setTimeout(() => {
        reconnectMs.current = Math.min(
          reconnectMs.current * 2,
          MAX_RECONNECT_MS,
        );
        connectRef.current();
      }, reconnectMs.current);
    };

    ws.onerror = (err) => {
      console.warn('WS error:', err);
      ws.close();
    };
  }, [watchlistId, setTick, setWsStatus]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  /** Send a subscribe/unsubscribe command to the WS server. */
  const sendCommand = useCallback(
    (action: 'subscribe' | 'unsubscribe', symbol: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action, symbol }));
      }
    },
    [],
  );

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
      }
      setWsStatus('disconnected');
    };
  }, [connect, setWsStatus]);

  return { sendCommand };
}
