import { getItem, setItem, deleteItem } from './storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
const API_URL = `${API_BASE}/api/v1`;

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

async function getHeaders(auth = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = await getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

let sessionDead = false;

export function markSessionAlive() {
  sessionDead = false;
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    if (sessionDead) throw new Error('Session expired');

    try {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        console.log('[AUTH] refresh succeeded, retrying request');
        return null;
      }
      console.warn('[AUTH] refresh rejected by server — token invalid');
    } catch (e) {
      console.warn('[AUTH] refresh network error:', e);
      throw new Error('Unable to reach server');
    }

    console.warn('[AUTH] session dead — clearing tokens');
    sessionDead = true;
    await clearTokens();
    throw new Error('Session expired');
  }
  return res;
}

let refreshPromise: Promise<boolean> | null = null;

export async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) {
    console.log('[AUTH] refresh already in progress, waiting');
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refresh = await getItem(REFRESH_TOKEN_KEY);
    if (!refresh) { console.log('[AUTH] no refresh token in storage'); return false; }

    console.log('[AUTH] attempting token refresh...');
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
        credentials: 'include',
      });
      if (!res.ok) {
        console.warn('[AUTH] refresh failed with status', res.status);
        return false;
      }
      const data = await res.json();
      await saveTokens(data.access_token, data.refresh_token);
      console.log('[AUTH] refresh succeeded, new tokens stored');
      return true;
    } catch (e) {
      console.warn('[AUTH] refresh fetch error:', e);
      throw e;
    }
  })();

  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}

export async function saveTokens(access: string, refresh: string) {
  sessionDead = false;
  await setItem(ACCESS_TOKEN_KEY, access);
  await setItem(REFRESH_TOKEN_KEY, refresh);
  console.log('[AUTH] tokens saved to storage');
}

export async function getAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function clearTokens() {
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
  console.log('[AUTH] tokens cleared from storage');
}

export async function apiGet(path: string, auth = true) {
  const headers = await getHeaders(auth);
  const res = await fetch(`${API_URL}${path}`, { headers, credentials: 'include' });
  const handled = await handleResponse(res);
  if (handled === null) return apiGet(path, auth);
  if (!handled.ok) throw new Error(await parseError(handled));
  return handled.json();
}

export async function apiPost(path: string, body?: unknown, auth = true) {
  const headers = await getHeaders(auth);
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const handled = await handleResponse(res);
  if (handled === null) return apiPost(path, body, auth);
  if (!handled.ok) throw new Error(await parseError(handled));
  return handled.json();
}

export async function apiPut(path: string, body?: unknown) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const handled = await handleResponse(res);
  if (handled === null) return apiPut(path, body);
  if (!handled.ok) throw new Error(await parseError(handled));
  return handled.json();
}

export async function apiDelete(path: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  const handled = await handleResponse(res);
  if (handled === null) return apiDelete(path);
  if (!handled.ok) throw new Error(await parseError(handled));
  return handled.json();
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || 'Something went wrong';
  } catch {
    return 'Something went wrong';
  }
}

export { API_URL };
