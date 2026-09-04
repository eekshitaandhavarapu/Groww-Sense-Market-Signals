/* API client — base fetch wrapper. */

function resolveApiBase(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  // SSR fallback — only reached during server-side rendering
  return '/api';
}

function resolveWsBase(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }
  // SSR fallback
  return '';
}

const API_BASE = resolveApiBase();
const WS_BASE = resolveWsBase();

export const DEFAULT_DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_DEMO_EMAIL = 'evaluator@growwsense.local';

/** Get stored user UUID or initialize default demo session. */
export function getStoredUserId(): string {
  let id = localStorage.getItem('watchlist_user_id');
  if (!id) {
    id = DEFAULT_DEMO_USER_ID;
    localStorage.setItem('watchlist_user_id', id);
    localStorage.setItem('watchlist_user_email', DEFAULT_DEMO_EMAIL);
  }
  return id;
}

/** Get stored user email. */
export function getStoredUserEmail(): string {
  return localStorage.getItem('watchlist_user_email') || DEFAULT_DEMO_EMAIL;
}

/** Set stored user credentials in localStorage. */
export function setStoredUser(userId: string, email: string): void {
  localStorage.setItem('watchlist_user_id', userId);
  localStorage.setItem('watchlist_user_email', email);
}

/** Clear stored user credentials (log out). */
export function clearStoredUser(): void {
  localStorage.removeItem('watchlist_user_id');
  localStorage.removeItem('watchlist_user_email');
}

/** Get user ID (returns stored or empty). */
export function getUserId(): string {
  return getStoredUserId() ?? '';
}

/** Demo signup/login with email address. */
export async function loginWithEmail(email: string): Promise<{ user_id: string; email: string }> {
  const response = await fetch(`${API_BASE}/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Authentication failed');
  }

  const data = await response.json();
  setStoredUser(data.user_id, data.email);
  return data;
}

/** Base fetch with user ID header. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const userId = getStoredUserId() || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }

  return response.json();
}

export function getWsUrl(path: string): string {
  return `${WS_BASE}${path}`;
}
