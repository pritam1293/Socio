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

async function handleResponse(res: Response) {
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return null; // caller should retry
    }
    await clearTokens();
    throw new Error('Session expired');
  }
  return res;
}

export async function tryRefreshToken(): Promise<boolean> {
  const refresh = await getItem(REFRESH_TOKEN_KEY);
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    await saveTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function saveTokens(access: string, refresh: string) {
  await setItem(ACCESS_TOKEN_KEY, access);
  await setItem(REFRESH_TOKEN_KEY, refresh);
}

export async function getAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function clearTokens() {
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
}

export async function apiGet(path: string, auth = true) {
  const headers = await getHeaders(auth);
  const res = await fetch(`${API_URL}${path}`, { headers });
  const handled = await handleResponse(res);
  if (handled === null) return apiGet(path, auth); // retry
  if (!handled.ok) throw new Error(await parseError(handled));
  return handled.json();
}

export async function apiPost(path: string, body?: unknown, auth = true) {
  const headers = await getHeaders(auth);
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const handled = await handleResponse(res);
  if (handled === null) return apiPost(path, body, auth); // retry
  if (!handled.ok) throw new Error(await parseError(handled));
  return handled.json();
}

export async function apiPut(path: string, body?: unknown) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const handled = await handleResponse(res);
  if (handled === null) return apiPut(path, body); // retry
  if (!handled.ok) throw new Error(await parseError(handled));
  return handled.json();
}

export async function apiDelete(path: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers,
  });
  const handled = await handleResponse(res);
  if (handled === null) return apiDelete(path); // retry
  if (!handled.ok) throw new Error(await parseError(handled));
  return handled.json();
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || 'An error occurred';
  } catch {
    return 'An error occurred';
  }
}

export { API_URL };
